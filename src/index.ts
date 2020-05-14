import {
    AccessoryConfig,
    AccessoryPlugin,
    API,
    CharacteristicEventTypes,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    HAP,
    Logging,
    Service,
    Characteristic
} from "homebridge";

import {HDMISwitch} from "serial-hdmi-switch";

let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
    hap = api.hap;
    api.registerAccessory("HDMISwitch", HDMISwitchAccessory);
};

class HDMISwitchAccessory implements AccessoryPlugin
{
    private readonly log: Logging;
    private readonly name: string;

    private readonly tvService: Service;
    private readonly informationService: Service;
    private readonly availableServices: Service[];

    private active: boolean = true;
    private activeIdentifier: number = 1;

    private readonly manufacturer: string;
    private readonly path: string;
    private readonly baudRate: number = 9600;
    private readonly hdmiSwitch: HDMISwitch;

    /**
     *
     * @param {Logging} log
     * @param {AccessoryConfig} config
     * @param {API} api
     */
    constructor(log: Logging, config: AccessoryConfig, api: API) {
        this.log = log;
        this.name = config.name;

        this.availableServices = [];


        // handle config
        this.manufacturer = config['manufacturer'] || 'Manufacturer';
        this.path = config['path'];
        this.baudRate = config['baudRate'] || 9600;

        // setup internals
        this.hdmiSwitch = new HDMISwitch(this.path);

        // setup services
        this.informationService = new hap.Service.AccessoryInformation()
            .setCharacteristic(hap.Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(hap.Characteristic.Model, "Custom Model");

        this.availableServices.push(this.informationService);

        this.tvService = new Service.Television(this.name, 'tvService');
        this.tvService.getCharacteristic(Characteristic.Active)
            .on(CharacteristicEventTypes.GET, this.getActive.bind(this))
            .on(CharacteristicEventTypes.SET, this.setActive.bind(this));

        this.tvService.getCharacteristic(Characteristic.ActiveIdentifier)
            .on(CharacteristicEventTypes.GET, this.getActiveIdentifier.bind(this))
            .on(CharacteristicEventTypes.SET, this.setActiveIdentifier.bind(this));

        this.tvService.setCharacteristic(Characteristic.ConfiguredName, this.name);
        this.tvService.getCharacteristic(Characteristic.RemoteKey)
            .on(CharacteristicEventTypes.SET, this.setRemoteKey.bind(this));

        this.tvService.setCharacteristic(Characteristic.SleepDiscoveryMode, Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

        this.availableServices.push(this.tvService);

        let inputs = 5;
        for(let i=1; i<=inputs; i++)
        {
            let identifier = i;
            let inputName:string = 'HDMI ' + i;
            let inputSource:Service = new Service.InputSource(inputName, inputName);
            inputSource
                .setCharacteristic(Characteristic.ConfiguredName, inputName)
                .setCharacteristic(Characteristic.InputSourceType, Characteristic.InputSourceType.HDMI)
                .setCharacteristic(Characteristic.IsConfigured, Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(Characteristic.CurrentVisibilityState, Characteristic.CurrentVisibilityState.SHOWN)
                .setCharacteristic(Characteristic.Identifier, identifier)
            ;

            if(i == 1)
            {
                this.tvService.getCharacteristic(Characteristic.ActiveIdentifier).updateValue(identifier);
            }

            this.tvService.addLinkedService(inputSource);
            this.availableServices.push(inputSource);
        }

        log.info("finished initializing!");
    }

    /**
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
    identify(): void {
        this.log("Identify!");
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
    getActive(callback:CharacteristicGetCallback)
    {
        this.log('get active');
        callback(null, this.active);
    }

    /**
     *
     * @param {CharacteristicValue} value
     * @param {CharacteristicSetCallback} callback
     */
    setActive(value:CharacteristicValue, callback:CharacteristicSetCallback)
    {
        this.log('set active:', value);
        this.active = (value == Characteristic.Active.ACTIVE);

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
    getActiveIdentifier(callback:CharacteristicGetCallback)
    {
        this.log('get active identifier:', this.activeIdentifier);
        callback(null, this.activeIdentifier);
    }

    /**
     *
     * @param {CharacteristicValue} value
     * @param {CharacteristicSetCallback} callback
     */
    setActiveIdentifier(value:CharacteristicValue, callback:CharacteristicSetCallback)
    {
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
    setRemoteKey(value:CharacteristicValue, callback:CharacteristicSetCallback)
    {
        this.log('set remote key:', value);
        callback();
    }
}