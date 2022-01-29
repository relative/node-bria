import BriaRequest from './BriaRequest'

export default class GetCallHistoryItemRequest extends BriaRequest {
  public constructor(id: string) {
    super('status', 'status')

    this.xml?.insertValue('type', 'callHistoryItem')
    this.xml?.insertValue('id', id)
  }
}
