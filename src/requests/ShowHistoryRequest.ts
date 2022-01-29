import BriaRequest from './BriaRequest'
import { HistoryType } from '../client/History'

export default class ShowHistoryRequest extends BriaRequest {
  public constructor(type: HistoryType, text?: string) {
    super('showoHistory', 'filter')
    this.xml?.insertValue('type', type)
    if (text) this.xml?.insertValue('text', text)
  }
}
