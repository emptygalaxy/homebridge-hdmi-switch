import { API } from 'homebridge';
import { HDMISwitchAccessory } from './HDMISwitchAccessory';

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
    api.registerAccessory('HDMISwitch', HDMISwitchAccessory);
};
