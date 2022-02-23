import BriaClientLeaf from './Leaf'
import { BriaClient } from '.'
import SelectAudioDeviceRequest from '../requests/SelectAudioDeviceRequest'
import SetAudioPropertiesRequest from '../requests/SetAudioPropertiesRequest'
import StatusRequest from '../requests/StatusRequest'

export type AudioDeviceType = 'input' | 'output'

// API docs say "speakPhone", response is "speakerPhone"
// Version discrepancy or incompetence?
export type AudioDeviceRole = 'headset' | 'speakerPhone' | 'ringOn'
export type AudioDevice = {
  name: string
  id: number
  type: AudioDeviceType
  selected?: boolean
  roles?: AudioDeviceRole[]
}

// Apparently the API uses "enabled/disabled" for these booleans... why?
export type AudioProperties = {
  /**
   * Microphone mute state
   */
  mute: boolean

  /**
   * Sound output mute state
   */
  speakerMute: boolean

  /**
   * Speakerphone mode state
   */
  speaker: boolean

  /**
   * https://github.com/CounterPath/Bria_API_CSharp_SampleApp_3/blob/16712ddda3/Bria_API_SampleApp_Phone/BriaAPIWrapper.cs#L1175
   * ?
   */
  supressDialtone: boolean

  speakerVolume: number
  microphoneVolume: number
}

type AudioTypes = {
  devicesUpdated: (devices: AudioDevice[]) => Promise<void> | void
  propertiesUpdated: () => Promise<void> | void
}

/**
 * Control audio settings of the Bria client
 */
export class BriaClientAudio extends BriaClientLeaf<AudioTypes> {
  public devices?: AudioDevice[]
  public properties?: AudioProperties

  constructor(client: BriaClient) {
    super(client)

    this.client
      .on('statusChange.audioDevices', this.audioDevicesUpdated)
      .on('statusChange.audioProperties', this.audioPropertiesUpdated)
  }

  public async populate() {
    const devices = await this.getAudioDevices()
    const properties = await this.getAudioProperties()
    this.devices = devices
    this.properties = properties
  }

  /**
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiEvents.htm#postStatusChangeAudioDevices
   */
  private audioDevicesUpdated = async () => {
    const devices = await this.getAudioDevices()
    this.devices = devices
    this.emit('devicesUpdated', devices)
  }

  /**
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiEvents.htm#postStatusChangeAudioProperties
   */
  private audioPropertiesUpdated = async () => {
    const properties = await this.getAudioProperties()
    this.properties = properties
    this.emit('propertiesUpdated')
  }

  /**
   * Get audio properties (mute, speakerphone state, volume)
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiAudio.htm#getStatusAudioProperties
   * @returns Properties
   */
  public async getAudioProperties(): Promise<AudioProperties> {
    const xProperties = await this.client.sendWait(
      new StatusRequest('audioProperties')
    )
    const properties: AudioProperties = {
      mute: xProperties.get('mute').at(0).getValue() === 'enabled',
      speakerMute:
        xProperties.get('speakerMute').at(0).getValue() === 'enabled',
      speaker: xProperties.get('speaker').at(0).getValue() === 'enabled',
      speakerVolume: -1,
      microphoneVolume: -1,
      supressDialtone: false,
    }
    for (const vol of xProperties.get('volume')) {
      switch (vol.getProperty('type')) {
        case 'speaker':
          properties.speakerVolume = parseInt(vol.getValue(), 10)
          break
        case 'microphone':
          properties.microphoneVolume = parseInt(vol.getValue(), 10)
          break
      }
    }
    return properties
  }
  /**
   * Set audio properties
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiAudio.htm#getSelectAudioDevices
   * @param properties Partial audio properties
   */
  public async setAudioProperties(properties: Partial<AudioProperties>) {
    return this.client.sendWait(new SetAudioPropertiesRequest(properties))
  }

  /**
   * Get audio devices (input/output) from Bria client
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiAudio.htm#getStatusAudioDevices
   * @returns Array of audio devices
   */
  public async getAudioDevices(): Promise<AudioDevice[]> {
    const xDevices = await this.client.sendWait(
      new StatusRequest('audioDevices')
    )
    const devices: AudioDevice[] = []
    const deviceList = xDevices.get('devices').at(0).get('device')
    for (const dev of deviceList) {
      const audioDevice: AudioDevice = {
        name: dev.get('name').at(0).getValue(),
        id: parseInt(dev.get('id').at(0).getValue(), 10),
        type: dev.get('type').at(0).getValue() as AudioDeviceType,
        selected: dev.get('selected').at(0).getValue() === 'true',
        roles: [],
      }
      if (audioDevice.selected) {
        audioDevice.roles = dev
          .get('selected')
          .at(0)
          .getProperty('role')
          .split(/, ?/gi) as AudioDeviceRole[]
      }
      devices.push(audioDevice)
    }
    return devices
  }

  /**
   * Select audio devices
   * Roles must be a one-element array in each device, Bria API only supports
   * changing one role per device per request :(
   * @see https://docs.counterpath.com/guides/desk/desk_api/clients/deskAPI/deskApiAudio.htm#getSelectAudioDevices
   * @param devices Array of audio devices
   */
  public async selectAudioDevices(devices: AudioDevice[]) {
    return this.client.sendWait(new SelectAudioDeviceRequest(devices))
  }
}
