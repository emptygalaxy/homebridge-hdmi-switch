import {API, APIEvent, DynamicPlatformPlugin} from 'homebridge/lib/api';
import {PlatformAccessory} from 'homebridge/lib/platformAccessory';
import {Logger} from 'homebridge/lib/logger';
import {PlatformConfig} from 'homebridge/lib/server';
import {HDMIConfig, HDMIPlatformConfig} from './HDMIConfig';
import {HDMISwitchPlatformAccessory} from './HDMISwitchPlatformAccessory';
import {PLATFORM_NAME, PLUGIN_NAME} from './settings';

export class HDMISwitchPlatform implements DynamicPlatformPlugin {
    public readonly accessories: PlatformAccessory[] = [];

    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {
        this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
            this.log.debug('Load HDMI switch accessories');

            this.discoverDevices();
        });
    }

    configureAccessory(accessory: PlatformAccessory): void {
        // console.log('configureAccessory', accessory.displayName, accessory.UUID);
        this.accessories.push(accessory);
    }

    discoverDevices(): void {
        const c: HDMIPlatformConfig = this.config as HDMIPlatformConfig;
        const devices = c.devices;

        // console.log('all accessories: ', this.accessories);
        // this.accessories.forEach((value: PlatformAccessory) => {
        //     console.log(value.displayName, value.UUID);
        // });

        const retiredAccessories = this.accessories.slice();

        devices.forEach((device: HDMIConfig) => {

            const name: string = device.name;
            const path: string = device.path;
            const id: string = device.id || `hdmi-switch:${path}`;
            const uuid = this.api.hap.uuid.generate(id);

            // see if an accessory with the same uuid has already been registered and restored from
            // the cached devices we stored in the `configureAccessory` method above
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
            if(existingAccessory) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName, uuid);

                // link accessory
                new HDMISwitchPlatformAccessory(this.log, this.api, device, this, existingAccessory);
                this.api.updatePlatformAccessories([existingAccessory]);

                // remove from retired devices
                const retiredIndex = retiredAccessories.indexOf(existingAccessory);
                if(retiredIndex > -1) {
                    retiredAccessories.splice(retiredIndex, 1);
                }
            } else {
                const accessory = new this.api.platformAccessory(name, uuid);
                accessory.context.device = device;

                new HDMISwitchPlatformAccessory(this.log, this.api, device, this, accessory);
                this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
            }
        });

        // clean up unused accessories
        this.log.info('removing retired accessories:', retiredAccessories);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, retiredAccessories);
    }
    
}