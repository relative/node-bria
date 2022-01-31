import BriaClientLeaf from './Leaf'
import { BriaClient } from '.'
import sxml from 'sxml'

import AnswerCallRequest from '../requests/AnswerCallRequest'
import AttendedTransferRequest from '../requests/AttendedTransferRequest'
import BlindTransferRequest from '../requests/BlindTransferRequest'
import DTMFRequest from '../requests/DTMFRequest'
import EndCallRequest from '../requests/EndCallRequest'
import HoldCallRequest from '../requests/HoldCallRequest'
import MergeCallRequest from '../requests/MergeCallRequest'
import PlaceCallRequest from '../requests/PlaceCallRequest'
import ResumeCallRequest from '../requests/ResumeCallRequest'
import SetCallOptionsRequest from '../requests/SetCallOptionsRequest'
import StartCallRecordingRequest from '../requests/StartCallRecordingRequest'
import StatusRequest from '../requests/StatusRequest'
import StopCallRecordingRequest from '../requests/StopCallRecordingRequest'

export type CallId = string
export type CallNumber = string

export type CallType = 'audio' | 'video' | 'conference'
export type Call = {
  type: CallType
  number: CallNumber
  displayName?: string
  /**
   * If true, the Bria window will not regain focus when call is initiated
   */
  suppressMainWindow?: boolean
  accountId?: string
}

export type HoldState = 'offHold' | 'localHold' | 'remoteHold'
export type CallState =
  | 'connected'
  | 'connecting'
  | 'ringing'
  | 'failed'
  | 'ended'

// more enabled/disabled from the API in place of booleans
// why?
/**
 * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getStatusCallOptions
 */
export type CallOptions = {
  anonymous: boolean
  lettersToNumbers: boolean
  autoAnswer: boolean
  callWaiting: boolean
}

export type DTMFDigit =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '*'
  | '#'
export type DTMFType = 'start' | 'stop'
export type CallParty = {
  number: CallNumber
  displayName: string
  state: CallState
  timeInitiated: Date
}

class BriaCall {
  public id!: CallId
  public holdStatus!: HoldState
  public participants: CallParty[] = []
  public recordingStatus!: boolean
  public recordingFile?: string

  public _xml!: sxml.XML
  private client: BriaClient

  constructor(client: BriaClient, xml: sxml.XML) {
    this.client = client
    this.update(xml)
  }

  /**
   *
   * @param xml
   * @returns true if the call was actually updated
   */
  public update(xml: sxml.XML): boolean {
    this._xml = xml
    let updated = false
    const newObj = {
      id: xml.get('id').at(0).getValue(),
      holdStatus: xml.get('holdStatus').at(0).getValue() as HoldState,
      recordingStatus:
        xml.get('recordingStatus').at(0).getValue() === 'recordingInProgress',
      recordingFile: xml.get('recordingFile').at(0).getValue(),
    }
    if (this.id !== newObj.id) {
      this.id = newObj.id
      updated = true
    }
    if (this.holdStatus !== newObj.holdStatus) {
      this.holdStatus = newObj.holdStatus
      updated = true
    }
    if (this.recordingStatus !== newObj.recordingStatus) {
      this.recordingStatus = newObj.recordingStatus
      updated = true
    }
    if (this.recordingFile !== newObj.recordingFile) {
      this.recordingFile = newObj.recordingFile
      updated = true
    }

    const _participants = xml.get('participants').at(0).get('participant')
    const participants: CallParty[] = []
    for (const _party of _participants) {
      // UNIX timestamp (in seconds)
      const timeInitiated = parseInt(
        _party.get('timeInitiated').at(0).getValue().trim(),
        10
      )
      const party: CallParty = {
        number: _party.get('number').at(0).getValue(),
        displayName: _party.get('displayName').at(0).getValue(),
        state: _party.get('state').at(0).getValue() as CallState,
        timeInitiated: new Date(timeInitiated * 1000), // * 1000 to milliseconds
      }
      participants.push(party)
    }
    for (const party of this.participants) {
      if (!participants.find((p) => p.number === party.number)) {
        // this party does not exist in the Bria call anymore, remove it
        const index = this.participants.findIndex(
          (p) => p.number === party.number
        )

        this.participants.splice(index, 1)
        updated = true
      }
    }
    for (const party of participants) {
      const index = this.participants.findIndex(
        (p) => p.number === party.number
      )
      if (index !== -1) {
        if (this.participants[index].number !== party.number) {
          this.participants[index].number = party.number
          updated = true
        }
        if (this.participants[index].displayName !== party.displayName) {
          this.participants[index].displayName = party.displayName
          updated = true
        }
        if (this.participants[index].state !== party.state) {
          this.participants[index].state = party.state
          updated = true
        }
        if (this.participants[index].timeInitiated !== party.timeInitiated) {
          this.participants[index].timeInitiated = party.timeInitiated
          updated = true
        }
      } else {
        this.participants.push(party)
      }
    }
    return updated
  }

  /**
   * Answer a call
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getAnswer
   */
  public async answer() {
    return this.client.call.answerCall(this.id)
  }

  /**
   * End a call
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getEndCall
   */
  public async end() {
    return this.client.call.endCall(this.id)
  }

  /**
   * Place call on hold
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getHold
   */
  public async hold() {
    return this.client.call.holdCall(this.id)
  }

  /**
   * Resume call that was on hold
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getResume
   */
  public async resume() {
    return this.client.call.resumeCall(this.id)
  }

  /**
   * Request a blind transfer to a number
   *
   * @param targetNumber
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getTransferCall
   */
  public async blindTransferToNumber(targetNumber: CallNumber) {
    return this.client.call.blindTransferByNumber(this.id, targetNumber)
  }

  /**
   * Request a blind transfer to a BriaCall
   *
   * @param targetCall
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getTransferCall
   */
  public async blindTransferToCall(targetCall: BriaCall) {
    return this.client.call.blindTransferByCallId(this.id, targetCall.id)
  }

  /**
   * Request an attended transfer
   *
   * On Bria versions <6.2.0, this call will throw an exception
   * @param targetNumber
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#startAttendedTransferCall
   */
  public async attendedTransfer(targetNumber: CallNumber) {
    return this.client.call.attendedTransfer(this.id, targetNumber)
  }

  /**
   * Merge call with all other calls
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#Merge
   */
  public async merge() {
    return this.client.call.mergeCall(this.id)
  }

  /**
   * Start a call recording
   * @param filename Do not include extension, Bria includes it automatically
   * @param suppressPopup Show call recording popup when ended
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiRecording.htm#Start
   */
  public async startRecording(filename: string, suppressPopup = false) {
    return this.client.call.startCallRecording(this.id, filename, suppressPopup)
  }

  /**
   * Stop a call recording
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiRecording.htm#Stop
   */
  public async stopRecording() {
    return this.client.call.stopCallRecording(this.id)
  }
}

type CallEvents = {
  callStart: (call: BriaCall, id: string) => Promise<void> | void
  callUpdate: (call: BriaCall, id: string) => Promise<void> | void
  callEnd: (call: BriaCall, id: string) => Promise<void> | void

  optionsUpdated: () => Promise<void> | void
}

export class BriaClientCall extends BriaClientLeaf<CallEvents> {
  public options?: CallOptions
  public calls: BriaCall[] = []

  constructor(client: BriaClient) {
    super(client)

    this.client
      .on('statusChange.callOptions', this.callOptionsUpdated)
      .on('statusChange.call', this.callUpdated)
  }

  public async populate() {
    const options = await this.getCallOptions()
    this.options = options
    await this.populateCalls()
  }

  private async populateCalls() {
    const _calls = await this.getCalls()
    for (const call of this.calls) {
      if (!_calls.find((c) => c.id === call.id)) {
        // this call does not exist anymore, remove it
        const index = this.calls.findIndex((c) => c.id === call.id)
        this.emit('callEnd', this.calls[index], call.id)
        this.calls.splice(index, 1)
      }
    }
    for (const call of _calls) {
      let index = this.calls.findIndex((c) => c.id === call.id)
      if (index !== -1) {
        // Call exists, update it
        const updated = this.calls[index].update(call._xml)
        if (updated) this.emit('callUpdate', this.calls[index], call.id)
      } else {
        // Call doesn't exist, add it
        index = this.calls.push(call) - 1
        this.emit('callStart', this.calls[index], call.id)
      }
    }
  }

  private callUpdated = async () => {
    // This emits our events that we need
    await this.populateCalls()
  }

  /**
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiEvents.htm#postStatusChangeCallOptions
   */
  private callOptionsUpdated = async () => {
    const options = await this.getCallOptions()
    this.options = options
    this.emit('optionsUpdated')
  }

  /**
   * Get static list of calls
   *
   * Instead of using this method, you should access client.call.calls,
   * this method is used when Bria posts a call update event internally
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getStatusCall
   */
  public async getCalls(): Promise<BriaCall[]> {
    const _callRes = await this.client.sendWait(new StatusRequest('call'))
    if (!_callRes.has('call')) return []
    const _calls = _callRes.get('call')
    const calls: BriaCall[] = []
    for (const _call of _calls) {
      calls.push(new BriaCall(this.client, _call))
    }
    return calls
  }

  /**
   * Place a call
   * @param call
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getCall
   */
  public async placeCall(call: Call) {
    return this.client.sendWait(new PlaceCallRequest(call))
  }

  /**
   * Answer a call
   * @param callId
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getAnswer
   */
  public async answerCall(callId: CallId) {
    return this.client.sendWait(new AnswerCallRequest(callId))
  }

  /**
   * End a call
   * @param callId
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getEndCall
   */
  public async endCall(callId: CallId) {
    return this.client.sendWait(new EndCallRequest(callId))
  }

  /**
   * Place call on hold
   * @param callId
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getHold
   */
  public async holdCall(callId: CallId) {
    return this.client.sendWait(new HoldCallRequest(callId))
  }

  /**
   * Resume call that was on hold
   * @param callId
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getResume
   */
  public async resumeCall(callId: CallId) {
    return this.client.sendWait(new ResumeCallRequest(callId))
  }

  /**
   * Send a DTMF tone to the call recipient
   * @param digit
   * @param type start/stop
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getDTMF
   */
  public async sendDTMF(digit: DTMFDigit | number, type: DTMFType) {
    let _digit = digit
    if (typeof digit === 'number') {
      if (isNaN(digit) || digit < 0 || digit > 9)
        throw new TypeError('"digit" is not a valid DTMFDigit')
      _digit = digit.toString() as DTMFDigit
    }
    return this.client.sendWait(new DTMFRequest(_digit as DTMFDigit, type))
  }

  /**
   * Request a blind transfer by number
   *
   * On Bria versions <6.2.0, both blindTransferByNumber and
   * and blindTransferByCallId act functionally identical.
   * @param callId
   * @param targetNumber
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getTransferCall
   */
  public async blindTransferByNumber(callId: CallId, targetNumber: CallNumber) {
    return this.client.sendWait(
      new BlindTransferRequest(this.client, callId, targetNumber, 'number')
    )
  }

  /**
   * Request a blind transfer by callId
   *
   * On Bria versions <6.2.0, both blindTransferByNumber and
   * and blindTransferByCallId act functionally identical.
   * @param callId
   * @param targetNumber
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getTransferCall
   */
  public async blindTransferByCallId(callId: CallId, targetCallId: CallId) {
    return this.client.sendWait(
      new BlindTransferRequest(this.client, callId, targetCallId, 'callId')
    )
  }

  /**
   * Request an attended transfer
   *
   * On Bria versions <6.2.0 this call will throw an exception
   * @param callId
   * @param target
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#startAttendedTransferCall
   */
  public async attendedTransfer(callId: CallId, target: CallNumber) {
    if (this.client.versionLt('6.2.0'))
      throw new Error('Bria client does not support call (version out-of-date)')
    return this.client.sendWait(new AttendedTransferRequest(callId, target))
  }

  /**
   * Merge calls into local conference
   *
   * This call will not provide any error if call ID is invalid
   * @param callId This call should not be on hold.
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#Merge
   */
  public async mergeCall(callId: CallId) {
    if (this.client.versionLt('6.3.0'))
      throw new Error('Bria client does not support call (version out-of-date)')
    return this.client.sendWait(new MergeCallRequest(callId))
  }

  /**
   * Get call options
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getStatusCallOptions
   */
  public async getCallOptions(): Promise<CallOptions> {
    const _options = await this.client.sendWait(
      new StatusRequest('callOptions')
    )
    const options: CallOptions = {
      anonymous: _options.get('anonymous').at(0).getValue() === 'enabled',
      lettersToNumbers:
        _options.get('lettersToNumbers').at(0).getValue() === 'enabled',
      autoAnswer: _options.get('autoAnswer').at(0).getValue() === 'enabled',
      callWaiting: _options.get('callWaiting').at(0).getValue() === 'enabled',
    }
    return options
  }

  /**
   * Set call options
   * @param options Partial call options
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHandlingCalls.htm#getCallOptions
   */
  public async setCallOptions(options: Partial<CallOptions>) {
    return this.client.sendWait(new SetCallOptionsRequest(options))
  }

  /**
   * Start a call recording
   * @param callId
   * @param filename Do not include extension, Bria includes it automatically
   * @param suppressPopup Show call recording popup when ended
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiRecording.htm#Start
   */
  public async startCallRecording(
    callId: CallId,
    filename: string,
    suppressPopup = false
  ) {
    return this.client.sendWait(
      new StartCallRecordingRequest(callId, filename, suppressPopup)
    )
  }

  /**
   * Stop a call recording
   * @param callId If null, call recording is stopped for the current live call
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiRecording.htm#Stop
   */
  public async stopCallRecording(callId?: CallId) {
    return this.client.sendWait(new StopCallRecordingRequest(callId))
  }
}
