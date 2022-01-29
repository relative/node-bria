import BriaRequest from './BriaRequest'
import { CallId } from '../client/Call'

export default class ResumeCallRequest extends BriaRequest {
  public constructor(callId: CallId) {
    super('resume', 'resumeCall')
    this.xml?.insertValue('callId', callId)
  }
}
