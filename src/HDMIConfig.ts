import {AccessoryConfig} from 'homebridge';
import {PlatformConfig} from 'homebridge/lib/server';

export interface HDMIConfig extends AccessoryConfig{
    manufacturer?: string;
    name: string;
    path: string;
    baudRate?: number;
    inputs?: number;
}

export interface HDMIPlatformConfig extends PlatformConfig
{
    devices: HDMIConfig[];
}