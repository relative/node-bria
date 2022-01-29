import BriaRequest from './BriaRequest'

export default class SignInRequest extends BriaRequest {
  public constructor(username: string, password: string) {
    super('signIn', 'signIn')
    this.xml?.insertValue('user', username)
    this.xml?.insertValue('password', password)
  }
}
