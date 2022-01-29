import BriaRequest from './BriaRequest'

type WindowType = 'main' | 'collab'

export default class BringToFrontRequest extends BriaRequest {
  public constructor(window?: WindowType) {
    super('bringToFront', 'bringToFront')
    if (window) this.xml?.insertValue('window', window)
  }
}
