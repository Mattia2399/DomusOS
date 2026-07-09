import { describe, expect, it } from 'vitest';
import type { Widget } from '../../types/dashboardModels';
import { buildLightCardModel } from './lightCardModel';

const widget: Widget = {
  id: 'light.test',
  kind: 'light',
  title: 'Luce test',
  entityId: 'light.test',
  status: 'on',
  isOn: true,
  value: 45,
  layout: { i: 'light.test', x: 0, y: 0, w: 2, h: 2 },
};

describe('buildLightCardModel', () => {
  it('normalizes live brightness and exposes supported color controls', () => {
    const model = buildLightCardModel({
      widget,
      liveEntity: {
        state: 'on',
        toggleOn: true,
        brightness: 128,
        supportedColorModes: ['brightness', 'hs', 'color_temp'],
        hsColor: [210, 70],
        colorTempKelvin: 3200,
      },
    });

    expect(model.brightness).toBe(50);
    expect(model.supportsColor).toBe(true);
    expect(model.supportsColorTemp).toBe(true);
    expect(model.statusLabel).toBe('Accesa · 50%');
  });

  it('uses the pending toggle state and marks unavailable entities', () => {
    const pending = buildLightCardModel({
      widget,
      liveEntity: { state: 'off', rawAttributes: { __dashboard_pending_light_toggle: true } },
    });
    const unavailable = buildLightCardModel({ widget, liveEntity: { state: 'unavailable' } });

    expect(pending.pending).toBe(true);
    expect(pending.statusLabel).toBe('Accensione…');
    expect(unavailable.available).toBe(false);
    expect(unavailable.isOn).toBe(false);
  });

  it('lets the live off state override stale widget data', () => {
    const model = buildLightCardModel({ widget, liveEntity: { state: 'off' } });
    expect(model.isOn).toBe(false);
    expect(model.statusLabel).toBe('Spenta');
  });
});
