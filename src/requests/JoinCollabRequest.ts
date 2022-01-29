import BriaRequest from './BriaRequest'

export default class JoinCollabRequest extends BriaRequest {
  public constructor(collabUrl: string) {
    super('joinCollab', 'joinCollab')
    this.xml?.insertValue('collabUrl', collabUrl)
  }
}
