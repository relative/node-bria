import BriaRequest from './BriaRequest'
import { AccountId } from '../client/Account'

export default class CheckVoicemailRequest extends BriaRequest {
  public constructor(accountId: AccountId, suppressMainWindow: boolean) {
    super('checkVoiceMail', 'checkVoiceMail')
    this.xml?.insertValue('accountId', accountId.toString())
    this.xml?.insertValue('suppressMainWindow', suppressMainWindow.toString())
  }
}
