import {AccessoryConfig} from 'homebridge';

export interface HDMIConfig extends AccessoryConfig{
    manufacturer?: string;
    path: string;
    baudRate?: number;
    inputs?: number;
}