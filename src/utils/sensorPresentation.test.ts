import { describe, expect, it } from 'vitest';
import { resolveSensorVisualGroup } from './sensorPresentation';

describe('sensor visual presentation resolver', () => {
  it.each([
    ['temperature', 'environment'],
    ['carbon_dioxide', 'environment'],
    ['water', 'fluid'],
    ['volume_flow_rate', 'fluid'],
    ['data_rate', 'measurement'],
    ['wind_direction', 'measurement'],
    ['power', 'energy'],
    ['reactive_energy', 'energy'],
  ] as const)('maps %s to %s', (deviceClass, expectedGroup) => {
    expect(resolveSensorVisualGroup(deviceClass)).toBe(expectedGroup);
  });

  it('keeps missing, non-numeric and unknown classes generic', () => {
    expect(resolveSensorVisualGroup(undefined)).toBe('generic');
    expect(resolveSensorVisualGroup('enum')).toBe('generic');
    expect(resolveSensorVisualGroup('custom_class')).toBe('generic');
  });
});
