import BriaClientLeaf from './Leaf'
import { BriaClient } from '.'
import ShowHistoryRequest from '../requests/ShowHistoryRequest'
import GetCallHistoryRequest from '../requests/GetCallHistoryRequest'
import { AccountId } from './Account'
import GetCallHistoryItemRequest from '../requests/GetCallHistoryItemRequest'
import StatusRequest from '../requests/StatusRequest'

export type HistoryType = 'all' | 'missed'
export type HistoryEntryType = 'missed' | 'received' | 'dialed'
export type HistoryEntry = {
  type: HistoryEntryType
  id: string
  number: string
  displayName: string
  accountId: AccountId
  duration: number
  timeInitiated: Date

  callEnd: Date
}

export class BriaClientHistory extends BriaClientLeaf {
  public missedCalls = 0
  constructor(client: BriaClient) {
    super(client)

    this.client
      .on('statusChange.callHistory', this.callHistoryUpdated)
      .on('statusChange.missedCall', this.missedCall)
  }

  public async populate() {
    this.missedCalls = await this.getMissedCallCount()
  }

  /**
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiEvents.htm#postStatusChangeCallHistory
   */
  private callHistoryUpdated = () => {
    this.emit('historyUpdate')
  }
  /**
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiEvents.htm#postStatusChangeMissedCall
   */
  private missedCall = async () => {
    this.missedCalls = await this.getMissedCallCount()
  }

  /**
   * Show history panel and take window focus
   * @param type
   * @param text Filter text to input automatically
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHistory.htm#getShowHistoryHistory
   */
  public async showHistory(type: HistoryType, text?: string) {
    return this.client.sendWait(new ShowHistoryRequest(type, text))
  }

  /**
   * Get entries from call history
   * @param type
   * @param count default 10
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHistory.htm#getStatusCallHistory
   */
  public async getCallHistory(
    type: HistoryType,
    count = 10
  ): Promise<HistoryEntry[]> {
    const _status = await this.client.sendWait(
      new GetCallHistoryRequest(type, count)
    )
    if (!_status.has('callHistory')) return []
    const _entries = _status.get('callHistory')
    const entries: HistoryEntry[] = []
    for (const _entry of _entries) {
      // UNIX timestamp (in seconds)
      const timeInitiated = parseInt(
        _entry.get('timeInitiated').at(0).getValue().trim(),
        10
      )
      const duration = parseInt(_entry.get('duration').at(0).getValue(), 10)
      entries.push({
        type: _entry.get('type').at(0).getValue() as HistoryEntryType,
        id: _entry.get('id').at(0).getValue(),
        number: _entry.get('number').at(0).getValue(),
        displayName: _entry.has('displayName')
          ? _entry.get('displayName').at(0).getValue()
          : '',
        accountId: parseInt(_entry.get('accountId').at(0).getValue(), 10),
        duration: duration,
        timeInitiated: new Date(timeInitiated * 1000), // * 1000 to milliseconds
        callEnd: new Date((timeInitiated + duration) * 1000),
      })
    }
    return entries
  }

  /**
   * Get a single call history item
   * @param id
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHistory.htm#getStatusCallHistoryItem
   */
  public async getCallHistoryItem(id: string): Promise<HistoryEntry> {
    const _status = await this.client.sendWait(
      new GetCallHistoryItemRequest(id)
    )
    if (!_status.has('callHistory'))
      throw new Error('History entry does not exist')
    const _entry = _status.get('callHistory').at(0)
    const timeInitiated = parseInt(
      _entry.get('timeInitiated').at(0).getValue().trim(),
      10
    )
    const duration = parseInt(_entry.get('duration').at(0).getValue(), 10)
    const entry: HistoryEntry = {
      type: _entry.get('type').at(0).getValue() as HistoryEntryType,
      id: _entry.get('id').at(0).getValue(),
      number: _entry.get('number').at(0).getValue(),
      displayName: _entry.has('displayName')
        ? _entry.get('displayName').at(0).getValue()
        : '',
      accountId: parseInt(_entry.get('accountId').at(0).getValue(), 10),
      duration: duration,
      timeInitiated: new Date(timeInitiated * 1000), // * 1000 to milliseconds
      callEnd: new Date((timeInitiated + duration) * 1000),
    }
    return entry
  }

  /**
   * Get missed call count
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiHistory.htm#getStatusMissedCall
   */
  public async getMissedCallCount(): Promise<number> {
    const _missedCalls = await this.client.sendWait(
      new StatusRequest('missedCall')
    )
    return parseInt(_missedCalls.get('count').at(0).getValue(), 10)
  }
}
