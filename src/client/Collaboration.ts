import BriaClientLeaf from './Leaf'
import { BriaClient } from '.'
import { AccountType } from './Account'
import CreateIMRequest from '../requests/CreateIMRequest'
import StartCollabRequest from '../requests/StartCollabRequest'
import JoinCollabRequest from '../requests/JoinCollabRequest'
import { PresenceType } from './Presence'
import GetContactRequest from '../requests/GetContactRequest'
import StartScreenshareRequest from '../requests/StartScreenshareRequest'
import StatusRequest from '../requests/StatusRequest'

export type ContactId = number
export type Contact = {
  id: ContactId
  email: string[]
  fax: string[]
  home: string[]
  jid: string[]
  mobile: string[]
  other: string[]
  softphone: string[]
  website: string[]
  work: string[]
  collabUrl: string[]
  presenceStatus: PresenceType
  presenceText: string
  presenceAddress: string
  presenceType: AccountType
}
export type ContactTag =
  | 'email'
  | 'fax'
  | 'home'
  | 'jid'
  | 'mobile'
  | 'other'
  | 'softphone'
  | 'website'
  | 'work'
  | 'collabUrl'

// Why not xmpp | sip, like everywhere else in your api????????????????????
export type ScreenShareInviteeType = 'xmpp' | 'simple'
export type ScreenShareInvitee = {
  address: string
  type: ScreenShareInviteeType
}

export type ScreenShareSession = {
  status: string // no list of possible values provided, thanks CounterPath!!!
  joinUrl: string
}

export class BriaClientCollaboration extends BriaClientLeaf {
  public screenShares: ScreenShareSession[] = []

  constructor(client: BriaClient) {
    super(client)

    this.client.on('statusChange.screenShare', this.screenShareUpdate)
  }

  private async populateScreenShares() {
    this.screenShares = await this.getScreenShares()
  }
  public async populate() {
    return this.populateScreenShares()
  }
  private screenShareUpdate = async () => {
    this.screenShares = await this.getScreenShares()
  }

  /**
   * Open an IM session and take window focus
   * @param type
   * @param address
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiIM.htm#/im
   */
  public async createIM(type: AccountType, address: string) {
    return this.client.sendWait(new CreateIMRequest(type, address))
  }

  /**
   * Start a new collaboration conference
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiConferences.htm#startCollab
   */
  public async startCollab() {
    return this.client.sendWait(new StartCollabRequest())
  }

  /**
   * Join an existing collaboration conference
   * @param collabUrl
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiConferences.htm#joinCollab
   */
  public async joinCollab(collabUrl: string) {
    return this.client.sendWait(new JoinCollabRequest(collabUrl))
  }

  /**
   * Get contact information
   * @param address Email address
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiContactsPresence.htm#getStatusContact
   */
  public async getContact(address: string): Promise<Contact> {
    const _status = await this.client.sendWait(new GetContactRequest(address))
    if (!_status.has('contact')) throw new Error('Contact does not exist')
    const _contact = _status.get('contact').at(0)
    const tags = [
      'email',
      'fax',
      'home',
      'jid',
      'mobile',
      'other',
      'softphone',
      'website',
      'work',
      'collabUrl',
    ]
    const contact = {
      id: parseInt(_contact.get('id').at(0).getValue(), 10),
      email: [],
      fax: [],
      home: [],
      jid: [],
      mobile: [],
      other: [],
      softphone: [],
      website: [],
      work: [],
      collabUrl: [],
      presenceStatus: _contact
        .get('presenceStatus')
        .at(0)
        .getValue() as PresenceType,
      presenceText: _contact.get('presenceText').at(0).getValue(),
      presenceAddress: _contact.get('presenceText').at(0).getValue(),
      presenceType: _contact
        .get('presenceType')
        .at(0)
        .getValue() as AccountType,
    }
    tags.forEach((tag) => {
      if (!_contact.has(tag)) return
      const entries = _contact.get(tag)
      for (const ent of entries) {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        ;((contact as any)[tag] as string[]).push(ent.getValue())
      }
    })
    return contact as Contact
  }

  /**
   * Screenshare invitees
   * @param invitees type = 'simple' for SIP, xmpp for jabber
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiScreenSharing.htm#getStartScreenShare
   */
  public async startScreenShare(invitees: ScreenShareInvitee[]) {
    return this.client.sendWait(new StartScreenshareRequest(invitees))
  }

  /**
   * Get active screenshares
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiScreenSharing.htm#getStatusScreenShare
   */
  public async getScreenShares(): Promise<ScreenShareSession[]> {
    try {
      const _status = await this.client.sendWait(
        new StatusRequest('screenShare')
      )
      if (!_status.has('session')) return []
      const sessions: ScreenShareSession[] = []
      const _sessions = _status.get('session')
      for (const _session of _sessions) {
        sessions.push({
          status: _session.get('status').at(0).getValue(),
          joinUrl: _session.get('joinUrl').at(0).getValue(),
        })
      }
      return sessions
    } catch (err) {
      // Client does not support Screenshares
      // Thank bria for bad documentation
      return []
    }
  }
}
