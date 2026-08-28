import { describe, expect, it } from 'vitest';
import {
  buildIrrigationConsumptionSeries,
  extractIrrigationHistoryEntries,
  waterUnitMultiplier,
} from './irrigationConsumptionModel';

describe('irrigationConsumptionModel', () => {
  it('extracts the requested entity and converts cumulative deltas into buckets', () => {
    const payload = [[
      { entity_id: 'sensor.water', state: '100', last_changed: '2026-08-24T08:00:00Z' },
      { entity_id: 'sensor.water', state: '112', last_changed: '2026-08-24T10:00:00Z' },
      { entity_id: 'sensor.water', state: '125', last_changed: '2026-08-25T10:00:00Z' },
    ]];

    expect(extractIrrigationHistoryEntries(payload, 'sensor.water')).toHaveLength(3);
    const points = buildIrrigationConsumptionSeries(payload, 'sensor.water', '7d');
    expect(points.reduce((sum, point) => sum + point.value, 0)).toBe(25);
  });

  it('handles a meter reset without producing a negative consumption', () => {
    const payload = {
      'sensor.water': [
        { state: '95', last_updated: '2026-08-24T08:00:00Z' },
        { state: '4', last_updated: '2026-08-24T09:00:00Z' },
        { state: '11', last_updated: '2026-08-24T10:00:00Z' },
      ],
    };
    const points = buildIrrigationConsumptionSeries(payload, 'sensor.water', '7d');
    expect(points.reduce((sum, point) => sum + point.value, 0)).toBe(11);
  });

  it('supports the compact WebSocket history format returned by Home Assistant', () => {
    const payload = {
      'sensor.water': [
        { s: '100', lu: 1787817600 },
        { s: '135.5', lu: 1787821200 },
      ],
    };
    const points = buildIrrigationConsumptionSeries(payload, 'sensor.water', '7d');
    expect(points.reduce((sum, point) => sum + point.value, 0)).toBe(35.5);
  });

  it('normalizes common water units to liters', () => {
    expect(waterUnitMultiplier('L')).toBe(1);
    expect(waterUnitMultiplier('m³')).toBe(1000);
    expect(waterUnitMultiplier('ml')).toBe(0.001);
  });
});
