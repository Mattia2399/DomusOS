export const CLIMATE_FEATURE_TARGET_TEMPERATURE = 1;
export const CLIMATE_FEATURE_TARGET_TEMPERATURE_RANGE = 2;
export const CLIMATE_FEATURE_TARGET_HUMIDITY = 4;
export const CLIMATE_FEATURE_FAN_MODE = 8;
export const CLIMATE_FEATURE_PRESET_MODE = 16;
export const CLIMATE_FEATURE_SWING_MODE = 32;
export const CLIMATE_FEATURE_TURN_OFF = 128;
export const CLIMATE_FEATURE_TURN_ON = 256;
export const CLIMATE_FEATURE_SWING_HORIZONTAL_MODE = 512;

export type ClimatePrimaryControl = 'temperature' | 'humidity' | 'dry-status' | 'fan' | 'off';

export function normalizeClimateMode(value: string | undefined) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
}

export function climateFeatureEnabled(supportedFeatures: number | undefined, feature: number) {
  return supportedFeatures === undefined ? undefined : (supportedFeatures & feature) !== 0;
}

export function resolveClimatePrimaryControl(
  modeValue: string | undefined,
  supportsTargetHumidity: boolean,
): ClimatePrimaryControl {
  const mode = normalizeClimateMode(modeValue);
  if (mode === 'off') return 'off';
  if (['dry', 'drying', 'dehumidify'].includes(mode)) {
    return supportsTargetHumidity ? 'humidity' : 'dry-status';
  }
  if (['fan', 'fan_only', 'ventilate'].includes(mode)) return 'fan';
  return 'temperature';
}
