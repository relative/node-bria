import BriaRequest from './BriaRequest'
import { CallId } from '../client/Call'

export default class StopCallRecordingRequest extends BriaRequest {
  public constructor(callId?: CallId) {
    super('stopCallRecording', 'stopCallRecording')
    if (callId) this.xml?.insertValue('callId', callId)
  }
}
