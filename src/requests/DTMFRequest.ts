import BriaRequest from './BriaRequest'
import { DTMFDigit, DTMFType } from '../client/Call'

export default class DTMFRequest extends BriaRequest {
  public constructor(digit: DTMFDigit, type: DTMFType) {
    super('dtmf', 'dtmf')
    this.xml?.insertValue('tone', type)
    this.xml?.get('tone').at(0).setProperty('digit', digit)
  }
}
