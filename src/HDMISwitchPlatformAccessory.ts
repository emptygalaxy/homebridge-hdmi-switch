import {HDMISwitchPlatform} from './HDMISwitchPlatform';
import {
    API,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    Service,
} from 'homebridge';
import {PlatformAccessory} from 'homebridge/lib/platformAccessory';
import {HDMISwitch} from 'serial-hdmi-switch';
import {HDMIConfig} from './HDMIConfig';
import {Logger} from 'homebridge/lib/logger';

export class HDMISwitchPlatformAccessory {
    private readonly name: string;

    private readonly tvService: Service;
    private readonly informationService: Service;
    private readonly availableServices: Service[] = [];

    private active = true;
    private activeIdentifier = 1;

    private readonly manufacturer: string;
    private readonly path: string;
    private readonly baudRate: number;
    private readonly inputs: number;
    private readonly hdmiSwitch: HDMISwitch;

    public constructor(
        private readonly log: Logger,
        private readonly api: API,
        private readonly config: HDMIConfig,
        private readonly platform: HDMISwitchPlatform,
        private readonly accessory: PlatformAccessory,
    ) {

        // handle config
        const c = config;

        this.name = c.name || 'hdmi';
        this.manufacturer = c.manufacturer || 'Manufacturer';
        this.path = c.path;
        this.baudRate = c.baudRate || 9600;
        this.inputs = c.inputs || 5;

        this.log.info('connect', this.path);

        // setup internals
        this.hdmiSwitch = new HDMISwitch(this.path);

        // set category
        this.accessory.category = this.api.hap.Categories.TV_SET_TOP_BOX;

        // setup services
        this.informationService = (this.accessory.getService(this.api.hap.Service.AccessoryInformation) ||
                                    this.accessory.addService(this.api.hap.Service.AccessoryInformation));
        this.informationService
            .setCharacteristic(this.api.hap.Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(this.api.hap.Characteristic.Model, 'Custom Model')
        ;
        this.availableServices.push(this.informationService);

        this.tvService = (this.accessory.getService(this.api.hap.Service.Television) ||
                            this.accessory.addService(this.api.hap.Service.Television));
        this.tvService.getCharacteristic(this.api.hap.Characteristic.Active)
            .on(this.api.hap.CharacteristicEventTypes.GET, this.getActive.bind(this))
            .on(this.api.hap.CharacteristicEventTypes.SET, this.setActive.bind(this));

        this.tvService.getCharacteristic(this.api.hap.Characteristic.ActiveIdentifier)
            .on(this.api.hap.CharacteristicEventTypes.GET, this.getActiveIdentifier.bind(this))
            .on(this.api.hap.CharacteristicEventTypes.SET, this.setActiveIdentifier.bind(this));

        this.tvService.setCharacteristic(this.api.hap.Characteristic.ConfiguredName, this.name);
        this.tvService.getCharacteristic(this.api.hap.Characteristic.RemoteKey)
            .on(this.api.hap.CharacteristicEventTypes.SET, this.setRemoteKey.bind(this));

        this.tvService.setCharacteristic(this.api.hap.Characteristic.SleepDiscoveryMode,
            this.api.hap.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

        this.availableServices.push(this.tvService);

        if(this.accessory.context.inputLabels === undefined) {
            this.accessory.context.inputLabels = {};
        }

        for(let i=1; i<=this.inputs; i++) {
            const identifier: string = i.toString();
            let inputName: string = 'HDMI ' + i;

            if(this.accessory.context.inputLabels[identifier] !== undefined) {
                inputName = this.accessory.context.inputLabels[identifier];
            } else if(config.labels !== undefined && config.labels.length > i) {
                inputName = config.labels[i - 1];
            } else {
                this.accessory.context.inputLabels[identifier] = inputName;
            }


            this.log.info(identifier, inputName);

            const inputSource:Service = this.accessory.getService(identifier) ||
                                        this.accessory.addService(this.api.hap.Service.InputSource, identifier, inputName);
            inputSource
                .setCharacteristic(this.api.hap.Characteristic.ConfiguredName, inputName)
                .setCharacteristic(this.api.hap.Characteristic.InputSourceType,
                    this.api.hap.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(this.api.hap.Characteristic.IsConfigured,
                    this.api.hap.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.api.hap.Characteristic.CurrentVisibilityState,
                    this.api.hap.Characteristic.CurrentVisibilityState.SHOWN)
                .setCharacteristic(this.api.hap.Characteristic.Identifier, identifier)
            ;

            inputSource.getCharacteristic(this.api.hap.Characteristic.ConfiguredName)
                .on(this.api.hap.CharacteristicEventTypes.SET, this.setConfiguredInputSourceName.bind(this, identifier));

            if(i === 1) {
                this.tvService.getCharacteristic(this.api.hap.Characteristic.ActiveIdentifier).updateValue(identifier);
            }

            this.tvService.addLinkedService(inputSource);
            this.availableServices.push(inputSource);
        }

        // console.dir(this.accessory.context);
        log.info('finished initializing!');
    }

    /**
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     * @returns Service[]
     */
    getServices(): Service[] {
        return this.availableServices;
    }

    /**
     *
     * @param {CharacteristicGetCallback} callback
     */
    getActive(callback:CharacteristicGetCallback) {
        this.log.info('get active');
        callback(null, this.active);
    }

    /**
     *
     * @param {CharacteristicValue} value
     * @param {CharacteristicSetCallback} callback
     */
    setActive(value:CharacteristicValue, callback:CharacteristicSetCallback) {
        this.log.info('set active:', value);
        this.active = (value === this.api.hap.Characteristic.Active.ACTIVE);

        if(this.active) {
            this.hdmiSwitch.powerOn();
        } else {
            this.hdmiSwitch.powerOff();
        }

        callback();
    }

    /**
     *
     * @param {CharacteristicGetCallback} callback
     */
    getActiveIdentifier(callback:CharacteristicGetCallback) {
        this.log.info('get active identifier:', this.activeIdentifier);
        callback(null, this.activeIdentifier);
    }

    /**
     *
     * @param {CharacteristicValue} value
     * @param {CharacteristicSetCallback} callback
     */
    setActiveIdentifier(value:CharacteristicValue, callback:CharacteristicSetCallback) {
        this.log.info('set active identifier:', value);

        this.activeIdentifier = Number(value);
        this.hdmiSwitch.setInputIndex(this.activeIdentifier - 1);

        callback();
    }

    /**
     *
     * @param {CharacteristicValue} value
     * @param {CharacteristicSetCallback} callback
     */
    setRemoteKey(value:CharacteristicValue, callback:CharacteristicSetCallback) {
        this.log.info('set remote key:', value);
        callback();
    }

    setConfiguredInputSourceName(inputIdentifier: string, value: CharacteristicValue, callback: CharacteristicSetCallback) {
        this.log.info('Set input value', inputIdentifier, value);

        this.accessory.context.inputLabels[inputIdentifier] = value;

        callback();
    }
}
