import BriaClientLeaf from './Leaf'
import { BriaClient } from '.'
import GetAccountsRequest from '../requests/GetAccountsRequest'

export type AccountType = 'sip' | 'xmpp'
export type AccountId = number

export type Account = {
  type: AccountType
  id: AccountId
  name: string
  enabled: boolean
  registered: boolean
}

type AccountEvents = {
  accountCreate: (account: Account) => Promise<void> | void
  accountUpdate: (account: Account) => Promise<void> | void
  accountRemove: (account: Account) => Promise<void> | void
}

export class BriaClientAccount extends BriaClientLeaf<AccountEvents> {
  public accounts: Account[] = []

  public constructor(client: BriaClient) {
    super(client)

    // eslint-disable-next
    this.client.on('statusChange.account', this.accountUpdated)
  }

  private async populateAccounts() {
    const _accountsXmpp = await this.getAccounts('xmpp')
    const _accountsSip = await this.getAccounts('sip')
    const _accounts = [..._accountsXmpp, ..._accountsSip]
    for (const acct of this.accounts) {
      if (!_accounts.find((a) => a.type === acct.type && a.id === acct.id)) {
        const index = this.accounts.findIndex(
          (a) => a.type === acct.type && a.id === acct.id
        )
        this.emit('accountRemove', this.accounts[index])
        this.accounts.splice(index, 1)
      }
    }
    for (const acct of _accounts) {
      let index = this.accounts.findIndex(
        (a) => a.type === acct.type && a.id === acct.id
      )
      if (index !== -1) {
        let updated = false
        if (this.accounts[index].enabled !== acct.enabled) {
          this.accounts[index].enabled = acct.enabled
          updated = true
        }
        if (this.accounts[index].registered !== acct.registered) {
          this.accounts[index].registered = acct.registered
          updated = true
        }
        if (this.accounts[index].name !== acct.name) {
          this.accounts[index].name = acct.name
          updated = true
        }
        if (updated) this.emit('accountUpdate', this.accounts[index])
      } else {
        index = this.accounts.push(acct) - 1
        this.emit('accountCreate', this.accounts[index])
      }
    }
  }
  public async populate() {
    return this.populateAccounts()
  }
  /**
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiEvents.htm#postStatusChangeAccount
   */
  private accountUpdated = async () => {
    await this.populateAccounts()
  }

  /**
   * Get static list of accounts
   *
   * Instead of using this method, you should access client.account.accounts,
   * this method is used when Bria posts an account update event internally
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiAccount.htm#GET/statusAccounts
   */
  public async getAccounts(accountType: AccountType) {
    const _accountRes = await this.client.sendWait(
      new GetAccountsRequest(accountType)
    )
    if (!_accountRes.has('account')) return []
    const _accounts = _accountRes.get('account')
    const accounts: Account[] = []
    for (const _acct of _accounts) {
      accounts.push({
        type: _acct.get('type').at(0).getValue() as AccountType,
        id: parseInt(_acct.get('accountId').at(0).getValue(), 10),
        name: _acct.get('accountName').at(0).getValue(),
        enabled: _acct.get('enabled').at(0).getValue() === 'true',
        registered: _acct.get('registered').at(0).getValue() === 'true',
      })
    }
    return accounts
  }
}
