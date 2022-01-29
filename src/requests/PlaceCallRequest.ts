import BriaRequest from './BriaRequest'
import { Call } from '../client/Call'

export default class PlaceCallRequest extends BriaRequest {
  public constructor(call: Call) {
    super('call', 'dial')
    this.xml?.setProperty('type', call.type)
    this.xml?.insertValue('number', call.number)
    if (call.displayName) this.xml?.insertValue('displayName', call.displayName)
    if (typeof call.suppressMainWindow === 'boolean')
      this.xml?.insertValue(
        'suppressMainWindow',
        call.suppressMainWindow.toString()
      )
    if (typeof call.accountId === 'string')
      this.xml?.insertValue('accountId', call.accountId.toString())
  }
}
