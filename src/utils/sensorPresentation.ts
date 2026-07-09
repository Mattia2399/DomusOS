export type SensorVisualGroup =
  | 'environment'
  | 'fluid'
  | 'measurement'
  | 'energy'
  | 'generic';

const ENVIRONMENT_DEVICE_CLASSES = new Set([
  'absolute_humidity',
  'aqi',
  'atmospheric_pressure',
  'blood_glucose_concentration',
  'carbon_dioxide',
  'carbon_monoxide',
  'conductivity',
  'humidity',
  'illuminance',
  'irradiance',
  'moisture',
  'nitrogen_dioxide',
  'nitrogen_monoxide',
  'nitrous_oxide',
  'ozone',
  'ph',
  'pm1',
  'pm10',
  'pm25',
  'pm4',
  'pressure',
  'sound_pressure',
  'sulphur_dioxide',
  'temperature',
  'temperature_delta',
  'volatile_organic_compounds',
  'volatile_organic_compounds_parts',
]);

const FLUID_DEVICE_CLASSES = new Set([
  'gas',
  'precipitation',
  'precipitation_intensity',
  'volume',
  'volume_flow_rate',
  'volume_storage',
  'water',
]);

const MEASUREMENT_DEVICE_CLASSES = new Set([
  'area',
  'data_rate',
  'data_size',
  'distance',
  'duration',
  'monetary',
  'signal_strength',
  'speed',
  'weight',
  'wind_direction',
  'wind_speed',
]);

const ENERGY_DEVICE_CLASSES = new Set([
  'apparent_power',
  'battery',
  'current',
  'energy',
  'energy_distance',
  'energy_storage',
  'frequency',
  'power',
  'power_factor',
  'reactive_energy',
  'reactive_power',
  'voltage',
]);

export function resolveSensorVisualGroup(deviceClass: unknown): SensorVisualGroup {
  const normalized = typeof deviceClass === 'string' ? deviceClass.trim().toLowerCase() : '';
  if (ENVIRONMENT_DEVICE_CLASSES.has(normalized)) {
    return 'environment';
  }
  if (FLUID_DEVICE_CLASSES.has(normalized)) {
    return 'fluid';
  }
  if (MEASUREMENT_DEVICE_CLASSES.has(normalized)) {
    return 'measurement';
  }
  if (ENERGY_DEVICE_CLASSES.has(normalized)) {
    return 'energy';
  }
  return 'generic';
}
