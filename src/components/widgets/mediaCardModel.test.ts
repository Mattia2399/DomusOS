import { describe, expect, it } from 'vitest';
import type { Widget } from '../../types/dashboardModels';
import {
  MEDIA_FEATURE_BROWSE_MEDIA,
  MEDIA_FEATURE_CLEAR_PLAYLIST,
  MEDIA_FEATURE_GROUPING,
  MEDIA_FEATURE_ENQUEUE,
  MEDIA_FEATURE_NEXT_TRACK,
  MEDIA_FEATURE_PAUSE,
  MEDIA_FEATURE_PLAY,
  MEDIA_FEATURE_REPEAT_SET,
  MEDIA_FEATURE_SEARCH_MEDIA,
  MEDIA_FEATURE_SEEK,
  MEDIA_FEATURE_SELECT_SOUND_MODE,
  MEDIA_FEATURE_SELECT_SOURCE,
  MEDIA_FEATURE_SHUFFLE_SET,
  MEDIA_FEATURE_STOP,
  MEDIA_FEATURE_VOLUME_MUTE,
  MEDIA_FEATURE_VOLUME_SET,
  buildMediaCardModel,
} from './mediaCardModel';

const widget: Widget = {
  id: 'media-card-model-test',
  kind: 'media',
  title: 'Living Room TV',
  entityId: 'media_player.living_room_tv',
  status: 'idle',
  isOn: true,
  value: 0,
  layout: { i: 'media-card-model-test', x: 0, y: 0, w: 2, h: 3 },
};

describe('buildMediaCardModel', () => {
  it('keeps official media-player states distinct', () => {
    expect(buildMediaCardModel({ widget, liveEntity: { state: 'on' } })).toMatchObject({
      state: 'on',
      stateLabel: 'Acceso',
    });
    expect(buildMediaCardModel({ widget, liveEntity: { state: 'buffering' } })).toMatchObject({
      displayState: 'buffering',
      stateLabel: 'Caricamento',
    });
    expect(buildMediaCardModel({ widget, liveEntity: { state: 'off' } })).toMatchObject({
      displayState: 'off',
      stateLabel: 'Spento',
    });
    expect(buildMediaCardModel({ widget, liveEntity: { state: 'standby' } })).toMatchObject({
      displayState: 'off',
      stateLabel: 'Standby',
    });
  });

  it('exposes coordinated commands as a temporary pending state', () => {
    expect(buildMediaCardModel({
      widget,
      liveEntity: {
        state: 'playing',
        rawAttributes: { __dashboard_command_phase: 'awaiting_confirmation' },
      },
    }).commandPending).toBe(true);
  });

  it('normalizes official feature flags and metadata', () => {
    const supportedFeatures =
      MEDIA_FEATURE_PLAY |
      MEDIA_FEATURE_PAUSE |
      MEDIA_FEATURE_SEEK |
      MEDIA_FEATURE_VOLUME_SET |
      MEDIA_FEATURE_VOLUME_MUTE |
      MEDIA_FEATURE_NEXT_TRACK |
      MEDIA_FEATURE_SHUFFLE_SET |
      MEDIA_FEATURE_REPEAT_SET |
      MEDIA_FEATURE_SELECT_SOURCE |
      MEDIA_FEATURE_SELECT_SOUND_MODE |
      MEDIA_FEATURE_STOP |
      MEDIA_FEATURE_CLEAR_PLAYLIST |
      MEDIA_FEATURE_GROUPING |
      MEDIA_FEATURE_BROWSE_MEDIA |
      MEDIA_FEATURE_SEARCH_MEDIA |
      MEDIA_FEATURE_ENQUEUE;

    const model = buildMediaCardModel({
      widget,
      liveEntity: {
        state: 'playing',
        supportedFeatures,
        mediaPosition: 10,
        mediaDuration: 100,
        mediaPositionUpdatedAt: 1_000,
        rawAttributes: {
          app_name: 'Spotify',
          media_album_name: 'Blue Train',
          media_content_type: 'music',
          repeat: 'one',
          shuffle: true,
          source: 'Living Room',
          source_list: ['Living Room', 'Kitchen'],
          sound_mode: 'Movie',
          sound_mode_list: ['Music', 'Movie'],
          group_members: ['media_player.living_room_tv', 'media_player.kitchen_speaker'],
        },
      },
      nowMs: 11_000,
    });

    expect(model.metadata.position).toBe(20);
    expect(model.progressPercent).toBe(20);
    expect(model.repeatMode).toBe('one');
    expect(model.shuffleEnabled).toBe(true);
    expect(model.metadata.appName).toBe('Spotify');
    expect(model.metadata.albumName).toBe('Blue Train');
    expect(model.metadata.sourceList).toEqual(['Living Room', 'Kitchen']);
    expect(model.metadata.soundModeList).toEqual(['Movie', 'Music']);
    expect(model.capabilities.canStop).toBe(true);
    expect(model.capabilities.canClearPlaylist).toBe(true);
    expect(model.capabilities.canSelectSoundMode).toBe(true);
    expect(model.capabilities.canBrowseMedia).toBe(true);
    expect(model.capabilities.canSearchMedia).toBe(true);
    expect(model.capabilities.canEnqueue).toBe(true);
  });
});
