import type {API} from 'homebridge';
import {HDMISwitchPlatform} from './HDMISwitchPlatform';

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  api.registerPlatform('HDMISwitch', 'HDMISwitch', HDMISwitchPlatform);
};
