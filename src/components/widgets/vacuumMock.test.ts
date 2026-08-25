import { describe, expect, it } from 'vitest';
import {
  createVacuumStateMocks,
  VACUUM_MAX_COMPAT_MOCK_ENTITY_ID,
  VACUUM_MOCK_RELATED_ENTITY_IDS,
  VACUUM_MOCK_SUPPORTED_FEATURES,
} from './vacuumMock';

describe('vacuum max compatibility mock', () => {
  it('covers all official states and capabilities', () => {
    const states = createVacuumStateMocks();
    expect(states[VACUUM_MAX_COMPAT_MOCK_ENTITY_ID].state).toBe('docked');
    expect(states['vacuum.demo_robot_cleaning'].state).toBe('cleaning');
    expect(states['vacuum.demo_robot_paused'].state).toBe('paused');
    expect(states['vacuum.demo_robot_returning'].state).toBe('returning');
    expect(states['vacuum.demo_robot_idle'].state).toBe('idle');
    expect(states['vacuum.demo_robot_error'].state).toBe('error');
    expect(states['vacuum.demo_robot_unavailable'].state).toBe('unavailable');
    expect(states[VACUUM_MAX_COMPAT_MOCK_ENTITY_ID].supportedFeatures).toBe(VACUUM_MOCK_SUPPORTED_FEATURES);
  });

  it('provides a device map, mapped areas and representative secondary controls', () => {
    const states = createVacuumStateMocks();
    const vacuum = states[VACUUM_MAX_COMPAT_MOCK_ENTITY_ID];
    expect(vacuum.rawAttributes?.demo_related_entities).toEqual([...VACUUM_MOCK_RELATED_ENTITY_IDS]);
    expect(vacuum.rawAttributes?.demo_registry_options).toMatchObject({ vacuum: { area_mapping: { kitchen: ['segment-kitchen'] } } });
    expect(states['image.demo_robot_map'].imageUrl).toContain('data:image/svg+xml');
    expect(states['sensor.demo_robot_battery']).toMatchObject({ numericValue: 82, unit: '%' });
    expect(states['select.demo_robot_water_level'].rawAttributes?.options).toHaveLength(3);
    expect(states['switch.demo_robot_carpet_boost'].toggleOn).toBe(true);
    expect(states['number.demo_robot_voice_volume']).toMatchObject({ numericValue: 45, unit: '%' });
  });
});
