import BriaRequest from './BriaRequest'
import sxml from 'sxml'
import { AudioProperties } from '../client/Audio'

export default class SetAudioPropertiesRequest extends BriaRequest {
  public constructor(properties: Partial<AudioProperties>) {
    super('audioProperties', 'audioProperties')
    if (typeof properties.mute === 'boolean')
      this.xml?.insertValue('mute', properties.mute ? 'enabled' : 'disabled')

    if (typeof properties.speakerMute === 'boolean')
      this.xml?.insertValue(
        'speakerMute',
        properties.speakerMute ? 'enabled' : 'disabled'
      )

    if (typeof properties.speaker === 'boolean')
      this.xml?.insertValue(
        'speaker',
        properties.speaker ? 'enabled' : 'disabled'
      )

    if (typeof properties.speakerVolume === 'number') {
      const speakerVolume = new sxml.XML()
      speakerVolume.setTag('volume')
      speakerVolume.setProperty('type', 'speaker')
      speakerVolume.setValue(properties.speakerVolume.toString())
      this.xml?.push(speakerVolume)
    }

    if (typeof properties.microphoneVolume === 'number') {
      const microphoneVolume = new sxml.XML()
      microphoneVolume.setTag('volume')
      microphoneVolume.setProperty('type', 'microphone')
      microphoneVolume.setValue(properties.microphoneVolume.toString())
      this.xml?.push(microphoneVolume)
    }
  }
}
