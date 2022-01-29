import BriaClientLeaf from './Leaf'
import { BriaClient } from '.'
import SignInRequest from '../requests/SignInRequest'
import StatusRequest from '../requests/StatusRequest'
import ExitRequest from '../requests/ExitRequest'
import SignOutRequest from '../requests/SignOutRequest'

export type AuthResponse = {
  authenticated: boolean
  notAuthenticatedReason?: string
  serverProvidedReason?: string
}

export class BriaClientAuth extends BriaClientLeaf {
  public authenticated = false
  constructor(client: BriaClient) {
    super(client)

    this.client.on('statusChange.authentication', this.authenticationUpdate)
  }

  public async populate() {
    if (this.client.versionLt('6.4.0')) {
      this.authenticated = true
    } else {
      const ar = await this.getAuthentication()
      this.authenticated = ar.authenticated
    }
  }

  /**
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiEvents.htm#postStatusChangeAuthentication
   */
  private authenticationUpdate = async () => {
    const ar = await this.getAuthentication()
    this.authenticated = ar.authenticated
    this.emit('authenticationUpdate', ar)
  }

  /**
   * Sign in to Bria with provided credentials
   *
   * Requires Bria Solo/Teams/Enterprise client version 6.4.0 or later
   * @param username
   * @param password
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiLoggingInOut.htm#getSignIn
   */
  public async signIn(username: string, password: string) {
    if (this.client.versionLt('6.4.0'))
      throw new Error('Bria client does not support call (version out-of-date)')
    return this.client.sendWait(new SignInRequest(username, password))
  }

  /**
   * Sign out from Bria
   *
   * Requires Bria Solo/Teams/Enterprise client version 6.4.0 or later
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiLoggingInOut.htm#getSignOut
   */
  public async signOut() {
    if (this.client.versionLt('6.4.0'))
      throw new Error('Bria client does not support call (version out-of-date)')
    return this.client.sendWait(new SignOutRequest())
  }

  /**
   * Exit Bria client
   *
   * Requires Bria Solo/Teams/Enterprise client version 6.4.0 or later
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiLoggingInOut.htm#getExit
   */
  public async exit() {
    // might not even need 6.4.0, but the docs are ambiguous
    if (this.client.versionLt('6.4.0'))
      throw new Error('Bria client does not support call (version out-of-date)')
    return this.client.sendWait(new ExitRequest())
  }

  /**
   * Get authentication status
   *
   * Requires Bria Solo/Teams/Enterprise client version 6.4.0 or later
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiLoggingInOut.htm#getStatusAuth
   */
  public async getAuthentication(): Promise<AuthResponse> {
    if (this.client.versionLt('6.4.0'))
      throw new Error('Bria client does not support call (version out-of-date)')
    const _status = await this.client.sendWait(
      new StatusRequest('authentication')
    )
    if (!_status.has('authenticated')) return { authenticated: false }

    return {
      authenticated: _status.get('authenticated').at(0).getValue() === 'true',
      notAuthenticatedReason: _status.has('notAuthenticatedReason')
        ? _status.get('notAuthenticatedReason').at(0).getValue()
        : undefined,
      serverProvidedReason: _status.has('serverProvidedReason')
        ? _status.get('serverProvidedReason').at(0).getValue()
        : undefined,
    }
  }
}
