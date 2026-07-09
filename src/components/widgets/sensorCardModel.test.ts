import { describe, expect, it } from 'vitest';
import type { Widget } from '../../types/dashboardModels';
import { buildSensorCardModel } from './sensorCardModel';

const widget: Widget = {
  id: 'sensor-model-test',
  kind: 'sensor',
  title: 'Potenza casa',
  entityId: 'sensor.home_power',
  status: 'online',
  isOn: true,
  unit: 'W',
  layout: { i: 'sensor-model-test', x: 0, y: 0, w: 2, h: 2 },
};

describe('buildSensorCardModel', () => {
  it('builds history, trend and statistics for an available sensor', () => {
    const model = buildSensorCardModel({
      widget,
      value: 420,
      sensorHistory: [300, 340, 380],
      liveEntity: {
        state: '420',
        numericValue: 420,
        unit: 'W',
        rawAttributes: { device_class: 'power' },
      },
    });

    expect(model.available).toBe(true);
    expect(model.visualGroup).toBe('energy');
    expect(model.visualization).toBe('sparkline');
    expect(model.trend.direction).toBe('up');
    expect(model.stats.minText).toBe('300');
    expect(model.stats.maxText).toBe('420');
  });

  it('uses a range visualization when history is missing', () => {
    const model = buildSensorCardModel({ widget, value: 48 });
    expect(model.visualization).toBe('range');
    expect(model.range.min).toBe(0);
    expect(model.range.max).toBeGreaterThan(48);
  });

  it('creates an explicit unavailable presentation', () => {
    const model = buildSensorCardModel({
      widget,
      liveEntity: { state: 'unavailable', unit: 'W' },
    });
    expect(model.available).toBe(false);
    expect(model.valueText).toBe('—');
    expect(model.trend.direction).toBe('none');
    expect(model.status.activeBars).toBe(0);
  });

  it('shortens large values only for compact layouts', () => {
    const model = buildSensorCardModel({ widget, value: 1_250_000 });
    expect(model.valueText).toBe('1250000');
    expect(model.compactValueText).toBe('1.25M');
  });
});
