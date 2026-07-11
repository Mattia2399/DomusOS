import type { MockEntityState, MockEntityStateMap } from '../../types/ha';
import {
  MEDIA_FEATURE_ANNOUNCE,
  MEDIA_FEATURE_BROWSE_MEDIA,
  MEDIA_FEATURE_CLEAR_PLAYLIST,
  MEDIA_FEATURE_ENQUEUE,
  MEDIA_FEATURE_GROUPING,
  MEDIA_FEATURE_NEXT_TRACK,
  MEDIA_FEATURE_PAUSE,
  MEDIA_FEATURE_PLAY,
  MEDIA_FEATURE_PLAY_MEDIA,
  MEDIA_FEATURE_PREVIOUS_TRACK,
  MEDIA_FEATURE_REPEAT_SET,
  MEDIA_FEATURE_SEARCH_MEDIA,
  MEDIA_FEATURE_SEEK,
  MEDIA_FEATURE_SELECT_SOUND_MODE,
  MEDIA_FEATURE_SELECT_SOURCE,
  MEDIA_FEATURE_SHUFFLE_SET,
  MEDIA_FEATURE_STOP,
  MEDIA_FEATURE_TURN_OFF,
  MEDIA_FEATURE_TURN_ON,
  MEDIA_FEATURE_VOLUME_MUTE,
  MEDIA_FEATURE_VOLUME_SET,
  MEDIA_FEATURE_VOLUME_STEP,
  type MediaPlayerRuntimeState,
} from './mediaCardModel';

export const MEDIA_PLAYER_MAX_COMPAT_MOCK_ENTITY_ID = 'media_player.max_compat_media_player';

export const MEDIA_PLAYER_MOCK_STATES = [
  'playing',
  'paused',
  'idle',
  'buffering',
  'on',
  'off',
  'unavailable',
  'standby',
] as const;

export type MediaPlayerMockState = (typeof MEDIA_PLAYER_MOCK_STATES)[number];

export const MEDIA_PLAYER_MAX_COMPAT_FEATURES =
  MEDIA_FEATURE_PAUSE |
  MEDIA_FEATURE_SEEK |
  MEDIA_FEATURE_VOLUME_SET |
  MEDIA_FEATURE_VOLUME_MUTE |
  MEDIA_FEATURE_PREVIOUS_TRACK |
  MEDIA_FEATURE_NEXT_TRACK |
  MEDIA_FEATURE_TURN_ON |
  MEDIA_FEATURE_TURN_OFF |
  MEDIA_FEATURE_PLAY_MEDIA |
  MEDIA_FEATURE_VOLUME_STEP |
  MEDIA_FEATURE_SELECT_SOURCE |
  MEDIA_FEATURE_STOP |
  MEDIA_FEATURE_CLEAR_PLAYLIST |
  MEDIA_FEATURE_PLAY |
  MEDIA_FEATURE_SHUFFLE_SET |
  MEDIA_FEATURE_SELECT_SOUND_MODE |
  MEDIA_FEATURE_BROWSE_MEDIA |
  MEDIA_FEATURE_REPEAT_SET |
  MEDIA_FEATURE_GROUPING |
  MEDIA_FEATURE_ANNOUNCE |
  MEDIA_FEATURE_ENQUEUE |
  MEDIA_FEATURE_SEARCH_MEDIA;

const MEDIA_LIBRARY_ITEMS = [
  {
    id: 'mock-track-focus',
    title: 'Sessione focus lo-fi',
    subtitle: 'Dashboard Studio - Album demo',
    media_content_id: 'mock://media/lofi-focus-session',
    media_content_type: 'music',
  },
  {
    id: 'mock-playlist-evening',
    title: 'Playlist serale',
    subtitle: 'Playlist - 24 brani',
    media_content_id: 'mock://playlist/evening',
    media_content_type: 'playlist',
  },
  {
    id: 'mock-channel-news',
    title: 'Radio notizie dashboard',
    subtitle: 'Canale live',
    media_content_id: 'mock://channel/news-radio',
    media_content_type: 'channel',
  },
  {
    id: 'mock-series-episode',
    title: 'Storie smart home',
    subtitle: 'Serie - S02E05',
    media_content_id: 'mock://video/smart-home-stories-s02e05',
    media_content_type: 'episode',
  },
  {
    id: 'mock-announcement',
    title: 'Cena pronta',
    subtitle: 'Annuncio demo',
    media_content_id: 'mock://announce/dinner-ready',
    media_content_type: 'announcement',
  },
];

function normalizeMockState(state: MediaPlayerMockState): Exclude<MediaPlayerRuntimeState, 'unknown'> {
  return state === 'standby' ? 'off' : state;
}

export function createMediaPlayerMock(state: MediaPlayerMockState = 'playing'): MockEntityState {
  const normalizedState = normalizeMockState(state);
  const isPlayableState = ['playing', 'paused', 'buffering'].includes(normalizedState);
  const isPowered = normalizedState !== 'off' && normalizedState !== 'unavailable';
  const mediaPosition = isPlayableState ? 153 : 0;
  const mediaDuration = 326;
  const progress = mediaDuration > 0 ? Math.round((mediaPosition / mediaDuration) * 100) : 0;
  const friendlyName =
    state === 'standby'
      ? 'Media player demo in standby'
      : state === 'unavailable'
        ? 'Media player demo offline'
        : 'Media player massima compatibilita';

  return {
    state,
    stateLabel: state,
    toggleOn: isPowered,
    progress,
    nowPlaying: 'Sessione focus lo-fi',
    mediaTitle: 'Sessione focus lo-fi',
    mediaArtist: 'Dashboard Studio',
    mediaAlbumArtist: 'Dashboard Studio',
    mediaAlbumName: 'Album demo',
    mediaChannel: 'Radio dashboard',
    mediaContentId: 'mock://media/lofi-focus-session',
    mediaContentType: 'music',
    mediaPosition,
    mediaDuration,
    mediaPositionUpdatedAt: Date.now(),
    mediaEpisode: '5',
    mediaImageHash: 'mock-media-hash',
    mediaImageRemotelyAccessible: true,
    mediaImageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80&fit=crop',
    mediaImageLocalUrl: '/media/local/mock-cover.jpg',
    mediaPlaylist: 'Playlist serale',
    mediaSeason: '2',
    mediaSeriesTitle: 'Storie smart home',
    mediaTrack: 7,
    appId: 'mock.media.app',
    appName: 'Music Assistant',
    source: 'Soggiorno',
    sourceList: ['Soggiorno', 'Diffusore cucina', 'TV camera', 'AirPlay', 'Chromecast'],
    soundMode: 'Musica',
    soundModeList: ['Musica', 'Film', 'Notte', 'Voce'],
    groupMembers: ['media_player.max_compat_media_player', 'media_player.kitchen_speaker'],
    mediaDeviceClass: 'speaker',
    shuffleEnabled: true,
    repeatMode: 'all',
    volumeLevel: 68,
    mediaMuted: false,
    volumeStep: 0.05,
    supportedFeatures: MEDIA_PLAYER_MAX_COMPAT_FEATURES,
    rawAttributes: {
      friendly_name: friendlyName,
      supported_features: MEDIA_PLAYER_MAX_COMPAT_FEATURES,
      app_id: 'mock.media.app',
      app_name: 'Music Assistant',
      device_class: 'speaker',
      entity_picture: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80&fit=crop',
      entity_picture_local: '/media/local/mock-cover.jpg',
      group_members: ['media_player.max_compat_media_player', 'media_player.kitchen_speaker'],
      is_volume_muted: false,
      media_album_artist: 'Dashboard Studio',
      media_album_name: 'Album demo',
      media_artist: 'Dashboard Studio',
      media_channel: 'Radio dashboard',
      media_content_id: 'mock://media/lofi-focus-session',
      media_content_type: 'music',
      media_duration: mediaDuration,
      media_episode: '5',
      media_image_hash: 'mock-media-hash',
      media_image_remotely_accessible: true,
      media_image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80&fit=crop',
      media_library: MEDIA_LIBRARY_ITEMS,
      media_playlist: 'Playlist serale',
      media_position: mediaPosition,
      media_position_updated_at: Date.now(),
      media_season: '2',
      media_series_title: 'Storie smart home',
      media_title: 'Sessione focus lo-fi',
      media_track: 7,
      repeat: 'all',
      shuffle: true,
      sound_mode: 'Musica',
      sound_mode_list: ['Musica', 'Film', 'Notte', 'Voce'],
      source: 'Soggiorno',
      source_list: ['Soggiorno', 'Diffusore cucina', 'TV camera', 'AirPlay', 'Chromecast'],
      volume_level: 0.68,
      volume_step: 0.05,
      demo_supported_states: MEDIA_PLAYER_MOCK_STATES,
    },
  };
}

export function createMediaPlayerStateMocks(): MockEntityStateMap {
  return MEDIA_PLAYER_MOCK_STATES.reduce<MockEntityStateMap>((stateMap, state) => {
    const entityId =
      state === 'playing'
        ? MEDIA_PLAYER_MAX_COMPAT_MOCK_ENTITY_ID
        : `media_player.max_compat_${state}`;
    stateMap[entityId] = createMediaPlayerMock(state);
    return stateMap;
  }, {});
}
