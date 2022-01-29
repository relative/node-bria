import BriaRequest from './BriaRequest'
import sxml from 'sxml'
import { AudioDevice } from '../client/Audio'

export default class SelectAudioDeviceRequest extends BriaRequest {
  public constructor(devices: AudioDevice[]) {
    super('selectAudioDevices', 'devices')

    for (const dev of devices) {
      if (!dev.roles) continue
      const devXml = new sxml.XML()
      devXml.setTag('device')
      devXml.insertValue('name', dev.name)
      devXml.insertValue('id', dev.id.toString())
      devXml.insertValue('type', dev.type)

      // Bria API only supports changing one role per device per request.
      devXml.insertValue('role', dev.roles[0])
      this.xml?.push(devXml)
    }
  }
}
