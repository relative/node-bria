import { BriaClient } from '.'
import EventEmitter from 'eventemitter3'

export default class BriaClientLeaf extends EventEmitter {
  protected client: BriaClient

  public constructor(client: BriaClient) {
    super()
    this.client = client
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async populate() {}
}
