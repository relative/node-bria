import BriaRequest from './BriaRequest'
import { CallId } from '../client/Call'

export default class EndCallRequest extends BriaRequest {
  public constructor(callId: CallId) {
    super('endCall', 'endCall')
    this.xml?.insertValue('callId', callId)
  }
}
