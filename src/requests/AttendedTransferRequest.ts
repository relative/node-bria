import BriaRequest from './BriaRequest'
import { CallId, CallNumber } from '../client/Call'

export default class AttendedTransferRequest extends BriaRequest {
  public constructor(callId: CallId, target: CallNumber) {
    super('startAttendedTransferCall', 'startAttendedTransferCall')
    this.xml?.insertValue('callId', callId)
    this.xml?.insertValue('targetNumber', target)
  }
}
