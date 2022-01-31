import { BriaClient } from '.'
import EventEmitter from 'eventemitter3'

export default class BriaClientLeaf<
  EventTypes extends EventEmitter.ValidEventTypes = string | symbol,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Context = any
> extends EventEmitter<EventTypes, Context> {
  protected client: BriaClient

  public constructor(client: BriaClient) {
    super()
    this.client = client
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async populate() {}
}
