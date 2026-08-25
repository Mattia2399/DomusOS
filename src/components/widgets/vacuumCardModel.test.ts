import { describe, expect, it } from 'vitest';
import type { Widget } from '../../types/dashboardModels';
import { buildVacuumCardModel, VACUUM_FEATURE_PAUSE, VACUUM_FEATURE_START } from './vacuumCardModel';

const widget: Widget = {
  id: 'vacuum.test',
  kind: 'vacuum',
  title: 'Robot test',
  entityId: 'vacuum.test',
  status: 'docked',
  isOn: false,
  value: 99,
  layout: { i: 'vacuum.test', x: 0, y: 0, w: 2, h: 2 },
};

describe('buildVacuumCardModel', () => {
  it('uses enriched device data and chooses the state-aware action', () => {
    const model = buildVacuumCardModel({
      widget,
      liveEntity: {
        state: 'cleaning',
        supportedFeatures: VACUUM_FEATURE_START | VACUUM_FEATURE_PAUSE,
        rawAttributes: {
          friendly_name: 'Omni test',
          __dashboard_battery_level: 81,
          __dashboard_cleaned_area: 42.5,
          __dashboard_cleaned_area_unit: 'm²',
          __dashboard_cleaning_minutes: 36,
          __dashboard_map_url: 'data:image/svg+xml,map',
          __dashboard_command_phase: 'sending',
          fan_speed: 'turbo',
        },
      },
    });

    expect(model.title).toBe('Omni test');
    expect(model.state).toBe('cleaning');
    expect(model.primaryAction).toBe('pause');
    expect(model.batteryLevel).toBe(81);
    expect(model.cleanedAreaLabel).toBe('42.5 m²');
    expect(model.cleaningTimeLabel).toBe('36 min');
    expect(model.mapUrl).toContain('data:image');
    expect(model.fanSpeedLabel).toBe('Turbo');
    expect(model.commandPending).toBe(true);
  });

  it('does not invent values or capabilities for a real entity', () => {
    const model = buildVacuumCardModel({ widget, liveEntity: { state: 'idle', rawAttributes: {} } });

    expect(model.batteryLevel).toBeUndefined();
    expect(model.cleanedArea).toBeUndefined();
    expect(model.cleaningMinutes).toBeUndefined();
    expect(model.supportsStart).toBe(false);
    expect(model.primaryAction).toBe('none');
  });

  it('surfaces errors without offering a blind start action', () => {
    const model = buildVacuumCardModel({
      widget,
      liveEntity: { state: 'error', rawAttributes: { error: 'Ruota bloccata' } },
    });

    expect(model.tone).toBe('error');
    expect(model.subtitle).toBe('Ruota bloccata');
    expect(model.primaryAction).toBe('details');
  });
});
