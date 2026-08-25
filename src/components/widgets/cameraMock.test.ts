import { describe, expect, it } from 'vitest';
import {
  CAMERA_MAX_COMPAT_MOCK_ENTITY_ID,
  CAMERA_MOCK_RELATED_ENTITY_IDS,
  createCameraStateMocks,
} from './cameraMock';

describe('camera max compatibility mock', () => {
  it('provides a complete device with timeline media and related entities', () => {
    const states = createCameraStateMocks();
    const camera = states[CAMERA_MAX_COMPAT_MOCK_ENTITY_ID];
    const events = camera.rawAttributes?.event_log;

    expect(camera.state).toBe('streaming');
    expect(camera.rawAttributes?.supports_ptz).toBe(true);
    expect(camera.rawAttributes?.demo_related_entities).toEqual([...CAMERA_MOCK_RELATED_ENTITY_IDS]);
    expect(Array.isArray(events)).toBe(true);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clip_url: expect.stringContaining('.mp4') }),
        expect.objectContaining({ thumbnail_url: expect.stringContaining('data:image/svg+xml') }),
      ]),
    );
    CAMERA_MOCK_RELATED_ENTITY_IDS.forEach((entityId) => {
      expect(states[entityId]).toBeDefined();
    });
  });

  it('exposes toggle, select, slider, action and diagnostic examples', () => {
    const states = createCameraStateMocks();

    expect(states['switch.front_door_motion_detection'].toggleOn).toBe(true);
    expect(states['select.front_door_night_vision'].rawAttributes?.options).toHaveLength(3);
    expect(states['number.front_door_detection_sensitivity']).toMatchObject({ numericValue: 72, unit: '%' });
    expect(states['button.front_door_snapshot']).toBeDefined();
    expect(states['sensor.front_door_battery']).toMatchObject({ numericValue: 86, unit: '%' });
  });
});
