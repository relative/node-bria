import BriaRequest from './BriaRequest'

export default class GetContactRequest extends BriaRequest {
  public constructor(address: string) {
    super('status', 'status')
    this.xml?.insertValue('type', 'contact')
    this.xml?.insertValue('email', address)
  }
}
