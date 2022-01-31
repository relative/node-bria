import BriaClientLeaf from './Leaf'
import { BriaClient } from '.'
import { AccountId } from './Account'
import CheckVoicemailRequest from '../requests/CheckVoicemailRequest'
import StatusRequest from '../requests/StatusRequest'

export type Voicemail = {
  accountId: AccountId
  accountName: string
  count: number
}

type VoicemailEvents = {
  voicemailUpdate: (voicemail: Voicemail) => Promise<void> | void
}

export class BriaClientVoicemail extends BriaClientLeaf<VoicemailEvents> {
  public voicemails: Voicemail[] = []
  constructor(client: BriaClient) {
    super(client)

    this.client.on('statusChange.voicemail', this.voicemailUpdated)
  }

  private async populateVoicemails() {
    const _voicemails = await this.getMessageWaitingCounts()
    for (const vm of this.voicemails) {
      if (!_voicemails.find((a) => a.accountId === vm.accountId)) {
        const index = this.voicemails.findIndex(
          (a) => a.accountId === vm.accountId
        )
        this.voicemails.splice(index, 1)
      }
    }
    for (const vm of _voicemails) {
      let index = this.voicemails.findIndex((a) => a.accountId === vm.accountId)
      if (index !== -1) {
        let updated = false
        if (this.voicemails[index].count !== vm.count) {
          this.voicemails[index].count = vm.count
          updated = true
        }

        if (updated) this.emit('voicemailUpdate', this.voicemails[index])
      } else {
        index = this.voicemails.push(vm) - 1
      }
    }
  }
  public async populate() {
    return this.populateVoicemails()
  }

  private voicemailUpdated = async () => {
    await this.populateVoicemails()
  }

  /**
   * Place a call to the voicemail phone for account
   * @param accountId
   * @param suppressMainWindow
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiVmailMwi.htm#getCheckVoiceMail
   */
  public async checkVoicemail(
    accountId: AccountId,
    suppressMainWindow = false
  ) {
    return this.client.sendWait(
      new CheckVoicemailRequest(accountId, suppressMainWindow)
    )
  }

  /**
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiVmailMwi.htm#getStatusVoiceMail
   */
  public async getMessageWaitingCounts(): Promise<Voicemail[]> {
    const _status = await this.client.sendWait(new StatusRequest('voiceMail'))
    if (!_status.has('voiceMail')) return []
    const _voicemails = _status.get('voiceMail')
    const voicemails: Voicemail[] = []
    for (const _vm of _voicemails) {
      voicemails.push({
        accountId: parseInt(_vm.get('accountId').at(0).getValue(), 10),
        accountName: _vm.get('accountName').at(0).getValue(),
        count: parseInt(_vm.get('count').at(0).getValue(), 10),
      })
    }
    return voicemails
  }
}
