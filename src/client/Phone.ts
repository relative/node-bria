import BriaClientLeaf from './Leaf'
import { BriaClient } from '.'
import StatusRequest from '../requests/StatusRequest'

export type PhoneState = 'ready' | 'notReady'
export type PhoneCallState = 'allow' | 'notAllow'
export type PhoneAccountStatus =
  | 'connected'
  | 'connecting'
  | 'failureContactingServer'
  | 'failureAtServer'
  | 'disabled'
export type PhoneStatus = {
  state: PhoneState
  call: PhoneCallState
  maxLines: number
  accountStatus: PhoneAccountStatus
  accountFailureCode: number
}

export class BriaClientPhone extends BriaClientLeaf {
  public status?: PhoneStatus
  constructor(client: BriaClient) {
    super(client)

    this.client.on('statusChange.phone', this.phoneUpdate)
  }

  public async populate() {
    this.status = await this.getPhoneStatus()
  }
  /**
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiEvents.htm#postStatusChangePhone
   */
  private phoneUpdate = async () => {
    this.status = await this.getPhoneStatus()
  }

  /**
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiGettingReady.htm#getStatusPhone
   */
  public async getPhoneStatus(): Promise<PhoneStatus> {
    const _status = await this.client.sendWait(new StatusRequest('phone'))
    const status = {
      state: _status.get('state').at(0).getValue() as PhoneState,
      call: _status.get('call').at(0).getValue() as PhoneCallState,
      maxLines: parseInt(_status.get('maxLines').at(0).getValue(), 10),
      accountStatus: _status
        .get('accountStatus')
        .at(0)
        .getValue() as PhoneAccountStatus,
      accountFailureCode: _status.has('accountFailureCode')
        ? parseInt(_status.get('accountFailureCode').at(0).getValue(), 10)
        : 0,
    }
    return status
  }
}
