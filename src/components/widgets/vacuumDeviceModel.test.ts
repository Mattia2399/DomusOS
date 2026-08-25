import { describe, expect, it } from 'vitest';
import {
  buildVacuumDeviceSnapshot,
  buildVacuumRelatedEntity,
  enrichVacuumEntity,
  parseVacuumMappedAreas,
} from './vacuumDeviceModel';

describe('vacuum device model', () => {
  it('prefers related battery, map and session sensors over legacy attributes', () => {
    const related = [
      buildVacuumRelatedEntity('sensor.robot_battery', { state: '76', unit: '%', rawAttributes: { device_class: 'battery', friendly_name: 'Batteria' } }),
      buildVacuumRelatedEntity('image.robot_map', { state: 'now', imageUrl: 'data:image/svg+xml,map', rawAttributes: { friendly_name: 'Mappa robot' } }),
      buildVacuumRelatedEntity('sensor.robot_cleaned_area', { state: '39.2', unit: 'm²', rawAttributes: { friendly_name: 'Area pulita' } }),
      buildVacuumRelatedEntity('sensor.robot_cleaning_time', { state: '1800', unit: 's', rawAttributes: { friendly_name: 'Tempo pulizia', device_class: 'duration' } }),
    ];
    const snapshot = buildVacuumDeviceSnapshot({
      vacuumEntity: { state: 'cleaning', rawAttributes: { battery_level: 12, cleaned_area: 4 } },
      relatedEntities: related,
    });

    expect(snapshot.batteryLevel).toBe(76);
    expect(snapshot.mapUrl).toContain('data:image');
    expect(snapshot.cleanedArea).toBe(39.2);
    expect(snapshot.cleanedAreaUnit).toBe('m²');
    expect(snapshot.cleaningMinutes).toBe(30);
    const enriched = enrichVacuumEntity({ state: 'cleaning' }, snapshot);
    expect(enriched.rawAttributes?.__dashboard_battery_level).toBe(76);
  });

  it('returns only areas configured in the official vacuum area mapping', () => {
    const areas = parseVacuumMappedAreas(
      { vacuum: { area_mapping: { kitchen: ['1'], living_room: ['2', '3'] } } },
      new Map([['kitchen', 'Cucina'], ['living_room', 'Salotto']]),
    );

    expect(areas).toEqual([
      { id: 'kitchen', name: 'Cucina', segmentIds: ['1'] },
      { id: 'living_room', name: 'Salotto', segmentIds: ['2', '3'] },
    ]);
  });
});
