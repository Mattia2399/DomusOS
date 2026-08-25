import { describe, expect, it } from 'vitest';
import {
  buildSetupEntityGroupCounts,
  buildSetupEntityGroupCountsFromRegistry,
  listSetupEntityGroups,
  resolveSetupEntityGroup,
} from './setupEntityGroups';

describe('setup entity groups', () => {
  it('groups HA domains into user-facing Home categories', () => {
    expect(resolveSetupEntityGroup('light.kitchen')).toBe('lights');
    expect(resolveSetupEntityGroup('lock.front_door')).toBe('locks');
    expect(resolveSetupEntityGroup('climate.living_room')).toBe('climate');
  });

  it('uses sensor device classes for energy and security groups', () => {
    const groups = buildSetupEntityGroupCounts([
      ['sensor.house_power', { state: '1.2', rawAttributes: { device_class: 'power' } }],
      ['binary_sensor.front_door', { state: 'off', rawAttributes: { device_class: 'door' } }],
      ['sensor.temperature', { state: '21', rawAttributes: { device_class: 'temperature' } }],
    ]);

    expect(groups).toEqual({ energy: 1, security: 1, sensors: 1 });
  });

  it('keeps the fallback group last', () => {
    expect(listSetupEntityGroups({ other: 8, locks: 1, lights: 3 }).map(({ label }) => label)).toEqual([
      'Luci',
      'Serrature',
      'Altro',
    ]);
  });

  it('reads the compact HA list_for_display registry format', () => {
    expect(buildSetupEntityGroupCountsFromRegistry({
      entities: [
        { ei: 'light.kitchen' },
        { ei: 'lock.front_door' },
        { ei: 'sensor.grid_power', dc: 'power' },
      ],
    })).toEqual({ lights: 1, locks: 1, energy: 1 });
  });
});
