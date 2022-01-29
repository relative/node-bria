import BriaRequest from './BriaRequest'

type StatusType =
  | 'systemInformation'
  | 'systemSettings'
  | 'audioDevices'
  | 'audioProperties'
  | 'call'
  | 'callOptions'
  | 'voiceMail'
  | 'missedCall'
  | 'supportedPresence'
  | 'presence'
  | 'screenShare'
  | 'authentication'
  | 'phone'

export default class StatusRequest extends BriaRequest {
  public constructor(type: StatusType) {
    super('status', 'status')

    this.xml?.insertValue('type', type)
  }
}
