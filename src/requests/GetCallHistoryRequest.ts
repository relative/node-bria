import BriaRequest from './BriaRequest'
import { HistoryType } from '../client/History'

export default class GetCallHistoryRequest extends BriaRequest {
  public constructor(type: HistoryType, count: number) {
    super('status', 'status')

    this.xml?.insertValue('type', 'callHistory')
    this.xml?.insertValue('entryType', type)
    this.xml?.insertValue('count', count.toString())
  }
}
