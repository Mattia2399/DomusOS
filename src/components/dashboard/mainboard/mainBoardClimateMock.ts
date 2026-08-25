import type { MockEntityState } from '../../../types/ha';

export const CLIMATE_FEATURE_TARGET_TEMPERATURE = 1;
export const CLIMATE_FEATURE_TARGET_TEMPERATURE_RANGE = 2;
export const CLIMATE_FEATURE_TARGET_HUMIDITY = 4;
export const CLIMATE_FEATURE_FAN_MODE = 8;
export const CLIMATE_FEATURE_PRESET_MODE = 16;
export const CLIMATE_FEATURE_SWING_MODE = 32;
export const CLIMATE_FEATURE_TURN_OFF = 128;
export const CLIMATE_FEATURE_TURN_ON = 256;
export const CLIMATE_FEATURE_SWING_HORIZONTAL_MODE = 512;

export const CLIMATE_LIVING_ROOM_MOCK_ENTITY_ID = 'climate.living_room';

const CLIMATE_LIVING_ROOM_MOCK_FEATURES =
  CLIMATE_FEATURE_TARGET_TEMPERATURE |
  CLIMATE_FEATURE_TARGET_TEMPERATURE_RANGE |
  CLIMATE_FEATURE_TARGET_HUMIDITY |
  CLIMATE_FEATURE_FAN_MODE |
  CLIMATE_FEATURE_PRESET_MODE |
  CLIMATE_FEATURE_SWING_MODE |
  CLIMATE_FEATURE_TURN_OFF |
  CLIMATE_FEATURE_TURN_ON |
  CLIMATE_FEATURE_SWING_HORIZONTAL_MODE;

export function resolveMockClimateAction(mode: string) {
  if (mode === 'heat') return 'heating';
  if (mode === 'cool') return 'cooling';
  if (mode === 'dry') return 'drying';
  if (mode === 'fan_only') return 'fan';
  if (mode === 'off') return 'off';
  return 'idle';
}

export function createLivingRoomClimateMock(): MockEntityState {
  const hvacMode = 'heat';
  const hvacAction = resolveMockClimateAction(hvacMode);
  const hvacModes = ['off', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only'];
  const fanModes = ['auto', 'low', 'medium', 'high', 'quiet', 'turbo'];
  const presetModes = ['none', 'eco', 'comfort', 'away', 'sleep', 'boost'];
  const swingModes = ['off', 'vertical', 'horizontal', 'both'];
  const swingHorizontalModes = ['off', 'left', 'center', 'right', 'wide'];
  return {
    state: hvacMode,
    stateLabel: hvacAction,
    toggleOn: true,
    hvacMode,
    hvacAction,
    hvacModes,
    currentValue: 20.5,
    targetValue: 22,
    minTemp: 7,
    maxTemp: 35,
    targetTempStep: 0.5,
    supportedFeatures: CLIMATE_LIVING_ROOM_MOCK_FEATURES,
    currentHumidity: 48,
    targetHumidity: 60,
    minHumidity: 30,
    maxHumidity: 80,
    targetHumidityStep: 1,
    fanMode: 'auto',
    fanModes,
    presetMode: 'comfort',
    presetModes,
    swingMode: 'off',
    swingModes,
    swingHorizontalMode: 'center',
    swingHorizontalModes,
    unit: '°C',
    rawAttributes: {
      friendly_name: 'Clima Living Room',
      hvac_mode: hvacMode,
      hvac_action: hvacAction,
      hvac_modes: hvacModes,
      current_temperature: 20.5,
      temperature: 22,
      min_temp: 7,
      max_temp: 35,
      target_temp_step: 0.5,
      temperature_unit: '°C',
      current_humidity: 48,
      humidity: 60,
      min_humidity: 30,
      max_humidity: 80,
      target_humidity_step: 1,
      fan_mode: 'auto',
      fan_modes: fanModes,
      preset_mode: 'comfort',
      preset_modes: presetModes,
      swing_mode: 'off',
      swing_modes: swingModes,
      swing_horizontal_mode: 'center',
      swing_horizontal_modes: swingHorizontalModes,
      supported_features: CLIMATE_LIVING_ROOM_MOCK_FEATURES,
    },
  };
}
