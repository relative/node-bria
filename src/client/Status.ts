import BriaClientLeaf from './Leaf'
import StatusRequest from '../requests/StatusRequest'
import { CallType } from './Call'

export type SystemInformationResponse = {
  systemCompanyName: string
  systemProductName: string
  systemProductVersion: string
  systemProductBuild: number
}

export type SystemSettingsResponse = {
  defaultCallType: CallType

  /**
   * If false, user must manually press Call in the UI
   * before call is placed after GET /call (client.calls)
   * If true, call is placed immediately
   */
  callRightAwayOnceNumberSelected: boolean
}

export class BriaClientStatus extends BriaClientLeaf {
  /**
   * Request Bria client version information
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiGettingReady.htm#getStatusSystemInformation
   */
  public async getSystemInformation(
    populateVersion = false
  ): Promise<SystemInformationResponse> {
    const ver = await this.client.sendWait(
      new StatusRequest('systemInformation')
    )

    const res = {
      systemCompanyName: ver.get('systemCompanyName').at(0).getValue(),
      systemProductName: ver.get('systemProductName').at(0).getValue(),
      systemProductVersion: ver.get('systemProductVersion').at(0).getValue(),
      systemProductBuild: parseInt(
        ver.get('systemProductBuild').at(0).getValue(),
        10
      ),
    }
    if (populateVersion) {
      this.client.clientVersion = res
    }
    return res
  }

  /**
   * Request call settings from Bria client
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiGettingReady.htm#getStatusSystemSettings
   * @returns Certain Bria settings
   */
  public async getSystemSettings(): Promise<SystemSettingsResponse> {
    const settings = await this.client.sendWait(
      new StatusRequest('systemSettings')
    )
    const res = {
      defaultCallType: settings
        .get('defaultCallType')
        .at(0)
        .getValue() as CallType,
      callRightAwayOnceNumberSelected:
        settings.get('callRightAwayOnceNumberSelected').at(0).getValue() ===
        'true',
    }

    return res
  }
}
