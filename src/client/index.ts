import EventEmitter from 'eventemitter3'
import { v4 as uuidv4 } from 'uuid'
import WebSocket from 'ws'
import semver from 'semver'
import sxml from 'sxml'

import BriaRequest from '../requests/BriaRequest'

import { BriaClientStatus } from './Status'
import { BriaClientAudio } from './Audio'
import { BriaClientCall } from './Call'
import { BriaClientAccount } from './Account'
import { BriaClientVoicemail } from './Voicemail'
import { BriaClientHistory } from './History'
import { BriaClientPresence } from './Presence'
import { BriaClientCollaboration } from './Collaboration'
import BringToFrontRequest from '../requests/BringToFrontRequest'
import { BriaClientAuth } from './Auth'
import { BriaClientPhone } from './Phone'

type BriaClientOptions = {
  userAgent?: string

  /**
   * Bria WebSocket URL
   * Default is 'wss://cpclientapi.softphone.com:9002/counterpath/socketapi/v1'
   */
  apiUrl?: string

  autoReconnect?: boolean

  /**
   * Delay before reopening the WebSocket (in milliseconds)
   */
  autoReconnectDelay?: number
  autoReconnectAttempts?: number

  /**
   * Ignore invalid certificates
   * Default FALSE (insecure!!) because the Desktop API does not include
   * valid intermediate certificates in the chain.
   */
  rejectUnauthorized?: boolean

  /**
   * Automatically populate the version information on connection
   * Default TRUE, this will request API access as soon as connected
   * If false, you won't be able to use old Bria versions with the wrapper.
   */
  populateVersion?: boolean

  /**
   * Automatically populate the client's children's properties
   * Default TRUE, this will request API access as soon as connected
   * If false, it will only populate data on-demand (on event/method calls)
   */
  populateChildren?: boolean
}

type BriaClientVersion = {
  systemCompanyName: string
  systemProductName: string
  systemProductVersion: string
  systemProductBuild: number
}

/**
 * @param xml XML response from simplexml (sxml), if any
 * @param rawData Raw response string from Bria
 */
type BriaClientStatusChangeEvent = (
  xml: sxml.XML,
  rawData: string
) => Promise<void> | void

type BriaClientEvents = {
  error: (error: Error) => void
  warn: (warning: Error) => void

  reconnect: () => Promise<void> | void

  /**
   * WebSocket is open
   */
  open: () => Promise<void> | void

  /**
   * Client is ready for requests
   */
  ready: () => Promise<void> | void

  close: (code: number, reason: string) => Promise<void> | void

  'statusChange.authentication': BriaClientStatusChangeEvent
  'statusChange.phone': BriaClientStatusChangeEvent
  'statusChange.call': BriaClientStatusChangeEvent
  'statusChange.callOptions': BriaClientStatusChangeEvent
  'statusChange.voicemail': BriaClientStatusChangeEvent
  'statusChange.callHistory': BriaClientStatusChangeEvent

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any
}

/**
 * Bria Client
 */
export class BriaClient extends EventEmitter<BriaClientEvents> {
  private userAgent = 'node-bria'

  private apiUrl =
    'wss://cpclientapi.softphone.com:9002/counterpath/socketapi/v1'

  private autoReconnect = false
  private autoReconnectDelay = 500
  private autoReconnectAttempts = 5

  private ws?: WebSocket

  private reconnectAttempts = 0

  private rejectUnauthorized = false

  private populateVersion = true
  private populateChildren = true

  public clientVersion?: BriaClientVersion

  public auth: BriaClientAuth
  public phone: BriaClientPhone
  public status: BriaClientStatus
  public audio: BriaClientAudio
  public call: BriaClientCall
  public account: BriaClientAccount
  public voicemail: BriaClientVoicemail
  public history: BriaClientHistory
  public presence: BriaClientPresence
  public collaboration: BriaClientCollaboration

  public constructor(options?: BriaClientOptions) {
    super()

    if (options) {
      if (options.userAgent) this.userAgent = options.userAgent
      if (options.apiUrl) this.apiUrl = options.apiUrl
      if (typeof options.autoReconnect === 'boolean')
        this.autoReconnect = options.autoReconnect
      if (
        typeof options.autoReconnectDelay === 'number' &&
        options.autoReconnectDelay >= 0
      )
        this.autoReconnectDelay = options.autoReconnectDelay
      if (typeof options.autoReconnectAttempts === 'number')
        this.autoReconnectAttempts = options.autoReconnectAttempts

      if (typeof options.rejectUnauthorized === 'boolean')
        this.rejectUnauthorized = options.rejectUnauthorized

      if (typeof options.populateVersion === 'boolean')
        this.populateVersion = options.populateVersion

      if (typeof options.populateChildren === 'boolean')
        this.populateChildren = options.populateChildren
    }
    this.auth = new BriaClientAuth(this)
    this.phone = new BriaClientPhone(this)
    this.status = new BriaClientStatus(this)
    this.audio = new BriaClientAudio(this)
    this.call = new BriaClientCall(this)
    this.account = new BriaClientAccount(this)
    this.voicemail = new BriaClientVoicemail(this)
    this.history = new BriaClientHistory(this)
    this.presence = new BriaClientPresence(this)
    this.collaboration = new BriaClientCollaboration(this)
    this.connect()
  }

  private websocketReconnect = () => {
    this.reconnectAttempts++
    if (this.reconnectAttempts > this.autoReconnectAttempts)
      return this.emit(
        'error',
        new Error(
          'Failed to reconnect to Bria client (exceeded maximum attempts)'
        )
      )
    this.connect()
    this.emit('reconnect')
  }
  private websocketOpen = async () => {
    this.reconnectAttempts = 0
    this.emit('open')
    if (this.populateVersion) await this.status.getSystemInformation(true)
    if (this.populateChildren) {
      await this.auth.populate()
      await this.phone.populate()
      await this.status.populate()
      await this.audio.populate()
      await this.call.populate()
      await this.account.populate()
      await this.voicemail.populate()
      await this.history.populate()
      await this.presence.populate()
      await this.collaboration.populate()
    }
    this.emit('ready')
  }
  private websocketClosed = (code: number, reason: Buffer) => {
    this.emit('close', code, reason.toString())
    if (this.autoReconnect && code != 1001 /* CLOSE_GOING_AWAY */) {
      if (this.autoReconnectDelay > 0) {
        setTimeout(this.websocketReconnect, this.autoReconnectDelay)
      } else {
        this.websocketReconnect()
      }
    }
  }
  private websocketMessage = (message: Buffer) => {
    const data = message.toString()
    // why does Bria implement pseudo-http over WebSockets
    if (data.startsWith('HTTP/1.1 ')) {
      // Received a response to one of our requests from Bria
      const dataSplit = data.split(/\r?\n/gi)

      const statusMatches = dataSplit[0].match(/^HTTP\/1\.1 (\d{3}) ([\w ]+)$/i)
      const txMatches = dataSplit[1].match(/^Transaction-ID: ([\w-]+)$/i)
      const clMatches = dataSplit[3].match(/^Content-Length: (\d+)$/i)
      if (!statusMatches || !txMatches || !clMatches)
        return this.emit(
          'error',
          new Error(
            'Invalid message received from Bria client (header invalid)'
          )
        )
      const statusCode = parseInt(statusMatches[1], 10)
      const transactionId = txMatches[1]
      const contentLength = parseInt(clMatches[1], 10)

      if (this.listeners(transactionId).length === 0)
        this.emit(
          'warn',
          new Error('Received response to request without a listener')
        )

      if (contentLength === 0)
        return this.emit(transactionId, statusCode, undefined, data)

      // why is .substr deprecated without an actual replacement
      // stupid js
      const xdsIdx = data.indexOf('<?xml')
      const xmlStr = data.substring(xdsIdx, xdsIdx + contentLength - 1)
      const xml = new sxml.XML(xmlStr)
      this.emit(transactionId, statusCode, xml, data)
    } else if (data.startsWith('POST /')) {
      // Received an async event from Bria
      const dataSplit = data.split(/\r?\n/gi)

      const pathMatches = dataSplit[0].match(/^POST \/(\w+)$/i)
      const clMatches = dataSplit[3].match(/^Content-Length: (\d+)$/i)
      if (!pathMatches || !clMatches)
        return this.emit(
          'error',
          new Error(
            'Invalid event message received from Bria client (no path or Content-Length)'
          )
        )

      const path = pathMatches[1]
      const contentLength = parseInt(clMatches[1], 10)

      if (contentLength === 0)
        return this.emit(
          'warn',
          new Error('Received empty async event from Bria client')
        )

      const xdsIdx = data.indexOf('<?xml')
      const xmlStr = data.substring(xdsIdx, xdsIdx + contentLength - 1)
      const xml = new sxml.XML(xmlStr)
      if (path === 'statusChange') {
        const evtType = xml.getProperty('type')
        this.emit(`${path}.${evtType}`, xml, data)
      } else {
        this.emit(
          'warn',
          new Error('Received unknown async event from Bria client')
        )
      }
    } else {
      return this.emit(
        'error',
        new Error('Invalid message received from Bria client')
      )
    }
  }

  public connect() {
    if (this.ws) {
      this.ws.close(1001)
      delete this.ws
    }
    this.ws = new WebSocket(this.apiUrl, {
      rejectUnauthorized: this.rejectUnauthorized,
    })
    this.ws
      .on('open', this.websocketOpen)
      .on('close', this.websocketClosed)
      .on('message', this.websocketMessage)
  }

  /**
   * Check the Bria version against the args (clientVersion < major.minor.patch)
   * If populateVersion is false, this function always returns FALSE.
   * @param version
   */
  public versionLt(version: string): boolean {
    if (!this.clientVersion) return false
    return semver.lt(this.clientVersion.systemProductVersion, version)
  }

  /**
   * Check the Bria version against the args (clientVersion > major.minor.patch)
   * If populateVersion is false, this function always returns TRUE.
   * @param version
   */
  public versionGt(version: string): boolean {
    return !this.versionLt(version)
  }

  /**
   * Send a request to the Bria client
   * @param request BriaRequest
   * @returns request's transaction ID (UUID)
   */
  public send(request: BriaRequest): string {
    if (this.ws?.readyState != WebSocket.OPEN)
      throw new Error('The Bria client is not connected')

    const transactionId = uuidv4()

    const reqStr = request.buildRequest(this.userAgent, transactionId)
    this.ws.send(reqStr)

    return transactionId
  }

  /**
   * Send a request to the Bria client and wait for a response by transaction ID
   * @param request BriaRequest
   * @returns response
   */
  public async sendWait(request: BriaRequest): Promise<sxml.XML> {
    const transactionId = this.send(request)

    return new Promise((resolve, reject) => {
      this.once(transactionId, (statusCode: number, x: sxml.XML) => {
        if (statusCode !== 200) return reject(x !== undefined ? x : statusCode)
        return resolve(x)
      })
    })
  }

  /**
   * Brings Bria window to front and takes focus
   * @param window Window to bring focus to
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiGettingReady.htm#getBringToFront
   */
  public async bringToFront(window?: 'main' | 'collab') {
    return this.sendWait(new BringToFrontRequest(window))
  }
}
