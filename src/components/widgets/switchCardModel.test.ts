import { describe, expect, it } from 'vitest';
import type { Widget } from '../../types/dashboardModels';
import { buildSwitchCardModel } from './switchCardModel';

const widget: Widget = {
  id: 'switch.test',
  kind: 'switch',
  title: 'Presa test',
  entityId: 'switch.test',
  status: 'on',
  isOn: true,
  layout: { i: 'switch.test', x: 0, y: 0, w: 2, h: 1 },
};

describe('buildSwitchCardModel', () => {
  it('lets the live state override stale widget data', () => {
    const model = buildSwitchCardModel({ widget, liveEntity: { state: 'off' } });

    expect(model.available).toBe(true);
    expect(model.isOn).toBe(false);
    expect(model.statusLabel).toBe('Spento');
  });

  it('resolves pending state and related consumption', () => {
    const model = buildSwitchCardModel({
      widget: { ...widget, status: 'off', isOn: false },
      liveEntity: {
        state: 'off',
        rawAttributes: { __dashboard_pending_switch_toggle: true, device_class: 'outlet' },
      },
      consumptionEntity: { state: '12.4', numericValue: 12.4, unit: 'W' },
    });

    expect(model.pending).toBe(true);
    expect(model.isOn).toBe(true);
    expect(model.statusLabel).toBe('Accensione…');
    expect(model.consumption).toMatchObject({ valueText: '12,4', unit: 'W', label: 'Potenza' });
    expect(model.deviceIcon).toBe('plug');
  });

  it('marks unavailable entities and keeps an explicit consumption placeholder', () => {
    const model = buildSwitchCardModel({ widget, liveEntity: { state: 'unavailable' } });

    expect(model.available).toBe(false);
    expect(model.isOn).toBe(false);
    expect(model.statusLabel).toBe('Non disponibile');
    expect(model.consumption).toMatchObject({
      available: false,
      valueText: '—',
      helperText: 'Configura entità consumo',
    });
  });

  it('falls back to power attributes exposed by the switch entity', () => {
    const model = buildSwitchCardModel({
      widget,
      liveEntity: { state: 'on', rawAttributes: { current_power_w: 7.8 } },
    });

    expect(model.consumption).toMatchObject({
      available: true,
      valueText: '7,8',
      unit: 'W',
      label: 'Potenza',
    });
  });
});
