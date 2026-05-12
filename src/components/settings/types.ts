export type ActiveDeviceType =
  | 'light'
  | 'climate'
  | 'camera'
  | 'sensor'
  | 'media'
  | 'weather'
  | 'alarm'
  | 'vacuum'
  | 'lock'
  | 'cover'
  | 'members';
export type SensorConnectionState = 'online' | 'offline' | 'unknown';

export interface ActiveDevice {
  id: string;
  name: string;
  type: ActiveDeviceType;
  status?: string;
  sensorValue?: number;
  sensorUnit?: string;
  sensorHistory?: number[];
  sensorBattery?: string;
  sensorConnection?: string;
  sensorConnectionState?: SensorConnectionState;
  alarmState?: string;
  alarmCodeRequired?: boolean;
  alarmChangedBy?: string;
  alarmSupportedFeatures?: number;
  vacuumState?: string;
  vacuumBatteryLevel?: number;
  vacuumFanSpeed?: string;
  vacuumMapUrl?: string;
  lockState?: string;
  lockChangedBy?: string;
  lockSupportsOpen?: boolean;
  coverState?: string;
  coverPosition?: number;
  coverTiltPosition?: number;
  coverSupportedFeatures?: number;
  membersMapPoints?: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    isCurrent?: boolean;
    roleLabel?: string;
    avatarUrl?: string;
    locationLabel?: string;
    devices?: {
      smartwatch: number;
      tablet: number;
      smartphone: number;
    };
  }>;
}
