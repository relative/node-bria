import BriaClientLeaf from './Leaf'
import { BriaClient } from '.'
import StatusRequest from '../requests/StatusRequest'

export type PresenceType =
  | 'available'
  | 'busy'
  | 'away'
  | 'onThePhone'
  | 'notAvailableForCalls'
  | 'doNotDisturb'
  | 'offline'
export type Presence = {
  status: PresenceType
  text: string
}
export class BriaClientPresence extends BriaClientLeaf {
  public presence?: Presence
  constructor(client: BriaClient) {
    super(client)

    this.client.on('statusChange.presence', this.presenceUpdated)
  }

  public async populate() {
    this.presence = await this.getPresence()
  }

  /**
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiEvents.htm#postStatusChangePresence
   */
  private presenceUpdated = async () => {
    this.presence = await this.getPresence()
  }

  /**
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiContactsPresence.htm#getStatusPresence
   */
  public async getPresence(): Promise<Presence> {
    try {
      const _status = await this.client.sendWait(new StatusRequest('presence'))
      if (!_status.has('presenceStatus'))
        return { status: 'offline', text: 'invalid response' }

      const presence = {
        status: _status.get('presenceStatus').at(0).getValue() as PresenceType,
        text: _status.get('presenceText').at(0).getValue(),
      }
      return presence
    } catch (err: unknown) {
      return {
        status: 'offline',
        text:
          "Your version of Bria doesn't support presences?: " +
          (err as Error).toString(),
      }
    }
  }

  /**
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiContactsPresence.htm#getStatusSupportedPresence
   */
  public async getSupportedPresenceOptions(): Promise<PresenceType[]> {
    const _status = await this.client.sendWait(
      new StatusRequest('supportedPresence')
    )
    if (!_status.has('presenceStatus')) return []
    const _types = _status.get('presenceStatus')
    const presenceTypes: PresenceType[] = []
    for (const _type of _types) {
      presenceTypes.push(_type.getValue() as PresenceType)
    }
    return presenceTypes
  }
}
