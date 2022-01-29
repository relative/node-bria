import BriaRequest from './BriaRequest'
import { CallId } from '../client/Call'

export default class MergeCallRequest extends BriaRequest {
  public constructor(callId: CallId) {
    super('merge', 'merge')
    this.xml?.insertValue('callId', callId)
  }
}
