import { describe, expect, it } from 'vitest';
import {
  CLIMATE_FEATURE_FAN_MODE,
  CLIMATE_FEATURE_TARGET_HUMIDITY,
  climateFeatureEnabled,
  resolveClimatePrimaryControl,
} from './climateCardModel';

describe('climate card mode model', () => {
  it('maps HVAC modes to their primary control', () => {
    expect(resolveClimatePrimaryControl('heat', false)).toBe('temperature');
    expect(resolveClimatePrimaryControl('cool', false)).toBe('temperature');
    expect(resolveClimatePrimaryControl('heat_cool', false)).toBe('temperature');
    expect(resolveClimatePrimaryControl('dry', true)).toBe('humidity');
    expect(resolveClimatePrimaryControl('dry', false)).toBe('dry-status');
    expect(resolveClimatePrimaryControl('fan_only', false)).toBe('fan');
    expect(resolveClimatePrimaryControl('off', false)).toBe('off');
  });

  it('reads supported feature flags independently', () => {
    const features = CLIMATE_FEATURE_TARGET_HUMIDITY | CLIMATE_FEATURE_FAN_MODE;
    expect(climateFeatureEnabled(features, CLIMATE_FEATURE_TARGET_HUMIDITY)).toBe(true);
    expect(climateFeatureEnabled(features, CLIMATE_FEATURE_FAN_MODE)).toBe(true);
    expect(climateFeatureEnabled(0, CLIMATE_FEATURE_TARGET_HUMIDITY)).toBe(false);
    expect(climateFeatureEnabled(undefined, CLIMATE_FEATURE_TARGET_HUMIDITY)).toBeUndefined();
  });
});
