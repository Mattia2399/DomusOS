import { describe, expect, it } from 'vitest';
import type { Widget } from '../../types/dashboardModels';
import { buildMediaCardModel } from './mediaCardModel';
import {
  createMediaPlayerMock,
  createMediaPlayerStateMocks,
  MEDIA_PLAYER_MAX_COMPAT_FEATURES,
  MEDIA_PLAYER_MAX_COMPAT_MOCK_ENTITY_ID,
  MEDIA_PLAYER_MOCK_STATES,
} from './mediaMock';

const widget: Widget = {
  id: MEDIA_PLAYER_MAX_COMPAT_MOCK_ENTITY_ID,
  kind: 'media',
  title: 'Media Player Max Compat',
  entityId: MEDIA_PLAYER_MAX_COMPAT_MOCK_ENTITY_ID,
  status: 'playing',
  isOn: true,
  value: 0,
  layout: { i: MEDIA_PLAYER_MAX_COMPAT_MOCK_ENTITY_ID, x: 0, y: 0, w: 3, h: 3 },
};

describe('media player mock', () => {
  it('creates one complete media player fixture for every supported state', () => {
    const mocks = createMediaPlayerStateMocks();
    const expectedEntityIds = MEDIA_PLAYER_MOCK_STATES.map((state) =>
      state === 'playing' ? MEDIA_PLAYER_MAX_COMPAT_MOCK_ENTITY_ID : `media_player.max_compat_${state}`,
    );

    expect(Object.keys(mocks).sort()).toEqual(expectedEntityIds.sort());
    expectedEntityIds.forEach((entityId) => {
      expect(mocks[entityId].supportedFeatures).toBe(MEDIA_PLAYER_MAX_COMPAT_FEATURES);
      expect(mocks[entityId].rawAttributes?.demo_supported_states).toEqual(MEDIA_PLAYER_MOCK_STATES);
      expect(Array.isArray(mocks[entityId].rawAttributes?.media_library)).toBe(true);
    });
  });

  it('exercises the legacy standby state through the card model', () => {
    const model = buildMediaCardModel({
      widget,
      liveEntity: createMediaPlayerMock('standby'),
      nowMs: Date.now(),
    });

    expect(model.state).toBe('off');
    expect(model.capabilities.canPlayMedia).toBe(true);
    expect(model.capabilities.canAnnounce).toBe(true);
  });
});
