import BriaRequest from './BriaRequest'
import { CallOptions } from '../client/Call'

export default class SetCallOptionsRequest extends BriaRequest {
  public constructor(properties: Partial<CallOptions>) {
    super('callOptions', 'callOptions')
    if (typeof properties.anonymous === 'boolean')
      this.xml?.insertValue(
        'anonymous',
        properties.anonymous ? 'enabled' : 'disabled'
      )

    if (typeof properties.lettersToNumbers === 'boolean')
      this.xml?.insertValue(
        'lettersToNumbers',
        properties.lettersToNumbers ? 'enabled' : 'disabled'
      )

    if (typeof properties.autoAnswer === 'boolean')
      this.xml?.insertValue(
        'autoAnswer',
        properties.autoAnswer ? 'enabled' : 'disabled'
      )

    if (typeof properties.callWaiting === 'boolean')
      this.xml?.insertValue(
        'callWaiting',
        properties.callWaiting ? 'enabled' : 'disabled'
      )
  }
}
