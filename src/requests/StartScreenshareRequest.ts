import BriaRequest from './BriaRequest'
import sxml from 'sxml'
import { ScreenShareInvitee } from '../client/Collaboration'

export default class StartScreenshareRequest extends BriaRequest {
  public constructor(invitees: ScreenShareInvitee[]) {
    super('startScreenShare', 'invitees')
    const invs = invitees.map((invitee) => {
      const inv = new sxml.XML()
      inv.setTag('invitee')
      inv.insertValue('address', invitee.address)
      inv.get('address').at(0).setProperty('type', invitee.type)
      return inv
    })
    this.xml?.push(...invs)
  }
}
