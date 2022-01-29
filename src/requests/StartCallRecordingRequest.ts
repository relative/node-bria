import BriaRequest from './BriaRequest'
import { CallId } from '../client/Call'

export default class StartCallRecordingRequest extends BriaRequest {
  public constructor(callId: CallId, filename: string, suppressPopup: boolean) {
    super('startCallRecording', 'startCallRecording')
    this.xml?.insertValue('callId', callId)
    this.xml?.insertValue('filename', filename)
    this.xml?.insertValue('suppressPopup', suppressPopup.toString())
  }
}
