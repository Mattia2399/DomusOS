import { describe, expect, it } from 'vitest';
import {
  formatSensorNumericValue,
  normalizeSensorDisplayPrecision,
  resolveSensorDisplayPrecision,
  resolveSensorNumericValue,
} from './sensorValue';

describe('sensor value resolver', () => {
  it('prefers manual precision over the Home Assistant suggestion', () => {
    expect(resolveSensorDisplayPrecision(3, { display_precision: 4, suggested_display_precision: 1 })).toBe(3);
    expect(resolveSensorDisplayPrecision(undefined, { display_precision: 4, suggested_display_precision: 1 })).toBe(4);
    expect(resolveSensorDisplayPrecision(undefined, { suggested_display_precision: 2 })).toBe(2);
  });

  it('uses Home Assistant device-class defaults and adjusts them for the unit', () => {
    expect(resolveSensorDisplayPrecision(undefined, { device_class: 'temperature' }, '°C')).toBe(1);
    expect(resolveSensorDisplayPrecision(undefined, { device_class: 'power' }, 'W')).toBe(0);
    expect(resolveSensorDisplayPrecision(undefined, { device_class: 'power' }, 'kW')).toBe(2);
    expect(resolveSensorDisplayPrecision(undefined, { device_class: 'current' }, 'A')).toBe(2);
    expect(resolveSensorDisplayPrecision(undefined, { device_class: 'volume' }, 'L')).toBe(2);
  });

  it('keeps the integer fallback for device classes without an official precision default', () => {
    expect(resolveSensorDisplayPrecision(undefined, { device_class: 'humidity' }, '%')).toBe(0);
    expect(resolveSensorDisplayPrecision(undefined, undefined)).toBe(0);
  });

  it('rejects invalid precision values', () => {
    expect(normalizeSensorDisplayPrecision(-1)).toBeUndefined();
    expect(normalizeSensorDisplayPrecision(7)).toBeUndefined();
    expect(normalizeSensorDisplayPrecision(1.5)).toBeUndefined();
  });

  it('formats the requested number of decimals', () => {
    expect(formatSensorNumericValue(21.456, 0)).toBe('21');
    expect(formatSensorNumericValue(21.456, 2)).toBe('21.46');
    expect(formatSensorNumericValue(21, 2)).toBe('21.00');
  });

  it('does not reuse fallback data for unavailable or non-numeric live states', () => {
    expect(resolveSensorNumericValue(48, { state: 'unavailable' })).toBeUndefined();
    expect(resolveSensorNumericValue(48, { state: 'unknown' })).toBeUndefined();
    expect(resolveSensorNumericValue(48, { state: 'open' })).toBeUndefined();
    expect(resolveSensorNumericValue(48, { state: '21.5', numericValue: 21.5 })).toBe(21.5);
  });
});
