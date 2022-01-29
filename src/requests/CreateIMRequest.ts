import BriaRequest from './BriaRequest'
import { AccountType } from '../client/Account'

export default class CreateIMRequest extends BriaRequest {
  public constructor(type: AccountType, address: string) {
    super('im', 'im')
    this.xml?.setProperty('type', type)
    this.xml?.insertValue('address', address)
  }
}
