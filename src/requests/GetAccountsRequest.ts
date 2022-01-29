import BriaRequest from './BriaRequest'
import { AccountType } from '../client/Account'

export default class GetAccountsRequest extends BriaRequest {
  public constructor(accountType: AccountType) {
    super('status', 'status')

    this.xml?.insertValue('type', 'account')
    this.xml?.insertValue('accountType', accountType)
  }
}
