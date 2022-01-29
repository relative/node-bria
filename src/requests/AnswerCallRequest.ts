import BriaRequest from './BriaRequest'
import { CallId } from '../client/Call'

export default class AnswerCallRequest extends BriaRequest {
  public constructor(callId: CallId) {
    super('answer', 'answerCall')
    this.xml?.insertValue('callId', callId)
  }
}
