import {
    AccessoryConfig,
    AccessoryPlugin,
    API,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    Logging,
    Service,
} from 'homebridge';

import {HDMISwitch} from 'serial-hdmi-switch';
import {HDMIConfig} from './HDMIConfig';

export class HDMISwitchAccessory implements AccessoryPlugin {
    private readonly log: Logging;
    private readonly api: API;
    private readonly name: string;

    private readonly tvService: Service;
    private readonly informationService: Service;
    private readonly availableServices: Service[];

    private active = true;
    private activeIdentifier = 1;

    private readonly manufacturer: string;
    private readonly path: string;
    private readonly baudRate: number;
    private readonly inputs: number;
    private readonly hdmiSwitch: HDMISwitch;

    /**
     *
     * @param {Logging} log
     * @param {AccessoryConfig} config
     * @param {API} api
     */
    constructor(log: Logging, config: AccessoryConfig, api: API) {
        this.log = log;
        this.api = api;
        this.name = config.name;

        this.log.info('config', config);

        this.availableServices = [];


        // handle config
        const c: HDMIConfig = config as HDMIConfig;
        this.manufacturer = c.manufacturer || 'Manufacturer';
        this.path = c.path;
        this.baudRate = c.baudRate || 9600;
        this.inputs = c.inputs || 5;

        this.log.info('connect', this.path);

        // setup internals
        this.hdmiSwitch = new HDMISwitch(this.path);

        // setup services
        this.informationService = new this.api.hap.Service.AccessoryInformation()
            .setCharacteristic(this.api.hap.Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(this.api.hap.Characteristic.Model, 'Custom Model');

        this.availableServices.push(this.informationService);

        this.tvService = new this.api.hap.Service.Television(this.name, 'tvService');
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

        for(let i=1; i<=this.inputs; i++) {
            const identifier = i;
            const inputName = 'HDMI ' + i;
            const inputSource:Service = new this.api.hap.Service.InputSource(inputName, inputName);
            inputSource
                .setCharacteristic(this.api.hap.Characteristic.ConfiguredName, inputName)
                .setCharacteristic(this.api.hap.Characteristic.InputSourceType, this.api.hap.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(this.api.hap.Characteristic.IsConfigured, this.api.hap.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.api.hap.Characteristic.CurrentVisibilityState, this.api.hap.Characteristic.CurrentVisibilityState.SHOWN)
                .setCharacteristic(this.api.hap.Characteristic.Identifier, identifier)
            ;

            if(i === 1) {
                this.tvService.getCharacteristic(this.api.hap.Characteristic.ActiveIdentifier).updateValue(identifier);
            }

            this.tvService.addLinkedService(inputSource);
            this.availableServices.push(inputSource);
        }

        log.info('finished initializing!');
    }

    /**
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
    identify(): void {
        this.log('Identify!');
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
        this.log('get active');
        callback(null, this.active);
    }

    /**
     *
     * @param {CharacteristicValue} value
     * @param {CharacteristicSetCallback} callback
     */
    setActive(value:CharacteristicValue, callback:CharacteristicSetCallback) {
        this.log('set active:', value);
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
        this.log('get active identifier:', this.activeIdentifier);
        callback(null, this.activeIdentifier);
    }

    /**
     *
     * @param {CharacteristicValue} value
     * @param {CharacteristicSetCallback} callback
     */
    setActiveIdentifier(value:CharacteristicValue, callback:CharacteristicSetCallback) {
        this.log('set active identifier:', value);

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
        this.log('set remote key:', value);
        callback();
    }
}