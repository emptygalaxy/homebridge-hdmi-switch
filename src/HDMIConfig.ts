import {AccessoryConfig, PlatformConfig} from 'homebridge';

export interface HDMIConfig extends AccessoryConfig{
    manufacturer?: string;
    name: string;
    id?: string;
    path: string;
    baudRate?: number;
    inputs?: number;
    labels?: string[];
}

export interface HDMIPlatformConfig extends PlatformConfig
{
    devices: HDMIConfig[];
}
