import BriaRequest from './BriaRequest'
import { BriaClient } from '../client'
import { CallId, CallNumber } from '../client/Call'

type TransferType = 'number' | 'callId'

export default class BlindTransferRequest extends BriaRequest {
  public constructor(
    client: BriaClient,
    callId: CallId,
    target: CallId | CallNumber,
    targetType: TransferType
  ) {
    super('transferCall', 'transferCall')
    this.xml?.insertValue('callId', callId)

    if (client.versionLt('6.2.0')) {
      this.xml?.insertValue('target', target)
    } else {
      this.xml?.insertValue(
        targetType === 'number' ? 'targetNumber' : 'targetCallId',
        target
      )
    }
  }
}
