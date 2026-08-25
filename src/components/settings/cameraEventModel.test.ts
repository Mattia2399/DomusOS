import { describe, expect, it } from 'vitest';
import {
  buildHistoryEventLogs,
  buildLiveEventLogs,
  mergeCameraEvents,
  type CameraEvent,
  type CameraHistoryEntry,
  type CameraRelatedEntityInfo,
} from './CameraControls';

const motionEntity: CameraRelatedEntityInfo = {
  entityId: 'binary_sensor.garden_motion',
  name: 'Movimento giardino',
  domain: 'binary_sensor',
  category: 'detection',
  deviceClass: 'motion',
};

describe('camera event model', () => {
  it('creates detections only from active history states', () => {
    const history: CameraHistoryEntry[] = [
      { entityId: motionEntity.entityId, state: 'off', timestampMs: 1_000 },
      { entityId: motionEntity.entityId, state: 'on', timestampMs: 2_000 },
      { entityId: motionEntity.entityId, state: 'off', timestampMs: 3_000 },
    ];

    const events = buildHistoryEventLogs(history, [motionEntity]);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      entityId: motionEntity.entityId,
      timestampMs: 2_000,
      type: 'motion',
      source: 'history',
    });
  });

  it('keeps snapshots separate from playable clips', () => {
    const events = buildLiveEventLogs({
      event_log: [
        {
          title: 'Persona rilevata',
          type: 'person',
          timestamp: '2026-07-13T10:00:00Z',
          thumbnail_url: '/local/person.jpg',
          url: '/local/person.jpg',
        },
      ],
    });

    expect(events[0].thumbnailUrl).toBe('/local/person.jpg');
    expect(events[0].clipUrl).toBeUndefined();
  });

  it('deduplicates equivalent sources and keeps newest events first', () => {
    const older: CameraEvent = {
      id: 'older',
      type: 'motion',
      title: 'Movimento',
      time: '10:00:00',
      timestampMs: 1_000,
      entityId: motionEntity.entityId,
    };
    const newer: CameraEvent = {
      ...older,
      id: 'newer',
      timestampMs: 2_000,
    };

    const events = mergeCameraEvents([older, newer], [{ ...newer, id: 'duplicate' }]);

    expect(events.map((event) => event.id)).toEqual(['newer', 'older']);
  });
});
