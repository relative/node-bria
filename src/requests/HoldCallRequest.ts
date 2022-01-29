import BriaRequest from './BriaRequest'
import { CallId } from '../client/Call'

export default class HoldCallRequest extends BriaRequest {
  public constructor(callId: CallId) {
    super('hold', 'holdCall')
    this.xml?.insertValue('callId', callId)
  }
}
