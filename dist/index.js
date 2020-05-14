"use strict";
var homebridge_1 = require("homebridge");
var serial_hdmi_switch_1 = require("serial-hdmi-switch");
var hap;
var HDMISwitchAccessory = /** @class */ (function () {
    function HDMISwitchAccessory(log, config, api) {
        this.active = true;
        this.activeIdentifier = 1;
        this.log = log;
        this.name = config.name;
        this.availableServices = [];
        // let tvUUID = uuid.generate('HDMISwitch:'+this.name);
        // this.tvAccessory = new Accessory(this.name, tvUUID);
        this.hdmiSwitch = new serial_hdmi_switch_1.HDMISwitch('/dev/cu.usbserial-40130');
        this.informationService = new hap.Service.AccessoryInformation()
            .setCharacteristic(hap.Characteristic.Manufacturer, "Custom Manufacturer")
            .setCharacteristic(hap.Characteristic.Model, "Custom Model");
        this.availableServices.push(this.informationService);
        this.tvService = new homebridge_1.Service.Television(this.name, 'tvService');
        this.tvService.getCharacteristic(homebridge_1.Characteristic.Active)
            .on("get" /* GET */, this.getActive.bind(this))
            .on("set" /* SET */, this.setActive.bind(this));
        this.tvService.getCharacteristic(homebridge_1.Characteristic.ActiveIdentifier)
            .on("get" /* GET */, this.getActiveIdentifier.bind(this))
            .on("set" /* SET */, this.setActiveIdentifier.bind(this));
        this.tvService.setCharacteristic(homebridge_1.Characteristic.ConfiguredName, this.name);
        this.tvService.getCharacteristic(homebridge_1.Characteristic.RemoteKey)
            .on("set" /* SET */, this.setRemoteKey.bind(this));
        this.tvService.setCharacteristic(homebridge_1.Characteristic.SleepDiscoveryMode, homebridge_1.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        this.availableServices.push(this.tvService);
        var inputs = 5;
        for (var i = 1; i <= inputs; i++) {
            var identifier = i;
            var inputName = 'HDMI ' + i;
            var inputSource = new homebridge_1.Service.InputSource(inputName, inputName);
            inputSource
                .setCharacteristic(homebridge_1.Characteristic.ConfiguredName, inputName)
                .setCharacteristic(homebridge_1.Characteristic.InputSourceType, homebridge_1.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(homebridge_1.Characteristic.IsConfigured, homebridge_1.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(homebridge_1.Characteristic.CurrentVisibilityState, homebridge_1.Characteristic.CurrentVisibilityState.SHOWN)
                .setCharacteristic(homebridge_1.Characteristic.Identifier, identifier);
            if (i == 1) {
                this.tvService.getCharacteristic(homebridge_1.Characteristic.ActiveIdentifier).updateValue(identifier);
            }
            this.tvService.addLinkedService(inputSource);
            this.availableServices.push(inputSource);
        }
        // this.availableServices.forEach((service:Service) => {
        //     this.tvAccessory.addService(service);
        // });
        // this.availableServices = this.tvAccessory.services;
        log.info("Switch finished initializing!");
    }
    /*
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
    HDMISwitchAccessory.prototype.identify = function () {
        this.log("Identify!");
    };
    /*
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     */
    HDMISwitchAccessory.prototype.getServices = function () {
        return this.availableServices;
    };
    HDMISwitchAccessory.prototype.getActive = function (callback) {
        this.log('get active');
        callback(null, this.active);
    };
    HDMISwitchAccessory.prototype.setActive = function (value, callback) {
        this.log('set active:', value);
        this.active = (value == homebridge_1.Characteristic.Active.ACTIVE);
        if (this.active) {
            this.hdmiSwitch.powerOn();
        }
        else {
            this.hdmiSwitch.powerOff();
        }
        callback();
    };
    HDMISwitchAccessory.prototype.getActiveIdentifier = function (callback) {
        this.log('get active identifier:', this.activeIdentifier);
        callback(null, this.activeIdentifier);
    };
    HDMISwitchAccessory.prototype.setActiveIdentifier = function (value, callback) {
        this.log('set active identifier:', value);
        this.activeIdentifier = Number(value);
        this.hdmiSwitch.setInputIndex(this.activeIdentifier - 1);
        callback();
    };
    HDMISwitchAccessory.prototype.setRemoteKey = function (value, callback) {
        this.log('set remote key:', value);
        callback();
    };
    return HDMISwitchAccessory;
}());
module.exports = function (api) {
    hap = api.hap;
    api.registerAccessory("HDMISwitch", HDMISwitchAccessory);
};
//# sourceMappingURL=index.js.map