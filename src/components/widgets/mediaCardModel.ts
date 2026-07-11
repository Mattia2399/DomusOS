import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { normalizeMediaPlayerStateKey, translateMediaPlayerState } from '../../utils/mediaPlayerState';

export const MEDIA_FEATURE_PAUSE = 1;
export const MEDIA_FEATURE_SEEK = 2;
export const MEDIA_FEATURE_VOLUME_SET = 4;
export const MEDIA_FEATURE_VOLUME_MUTE = 8;
export const MEDIA_FEATURE_PREVIOUS_TRACK = 16;
export const MEDIA_FEATURE_NEXT_TRACK = 32;
export const MEDIA_FEATURE_TURN_ON = 128;
export const MEDIA_FEATURE_TURN_OFF = 256;
export const MEDIA_FEATURE_PLAY_MEDIA = 512;
export const MEDIA_FEATURE_VOLUME_STEP = 1024;
export const MEDIA_FEATURE_SELECT_SOURCE = 2048;
export const MEDIA_FEATURE_STOP = 4096;
export const MEDIA_FEATURE_CLEAR_PLAYLIST = 8192;
export const MEDIA_FEATURE_PLAY = 16384;
export const MEDIA_FEATURE_SHUFFLE_SET = 32768;
export const MEDIA_FEATURE_SELECT_SOUND_MODE = 65536;
export const MEDIA_FEATURE_BROWSE_MEDIA = 131072;
export const MEDIA_FEATURE_REPEAT_SET = 262144;
export const MEDIA_FEATURE_GROUPING = 524288;
export const MEDIA_FEATURE_ANNOUNCE = 1048576;
export const MEDIA_FEATURE_ENQUEUE = 2097152;
export const MEDIA_FEATURE_SEARCH_MEDIA = 4194304;

export type MediaPlayerRuntimeState =
  | 'off'
  | 'on'
  | 'idle'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'unavailable'
  | 'unknown';

export type MediaRepeatMode = 'off' | 'all' | 'one';
export type MediaDeviceClass = 'projector' | 'receiver' | 'speaker' | 'tv' | string;

export type MediaCardCapabilities = {
  supportedFeatures?: number;
  hasKnownFeatureMask: boolean;
  canPlay: boolean;
  canPause: boolean;
  canTogglePlayback: boolean;
  canSeek: boolean;
  canPreviousTrack: boolean;
  canNextTrack: boolean;
  canSetVolume: boolean;
  canMute: boolean;
  canStepVolume: boolean;
  canTurnOn: boolean;
  canTurnOff: boolean;
  canPlayMedia: boolean;
  canSelectSource: boolean;
  canStop: boolean;
  canClearPlaylist: boolean;
  canShuffle: boolean;
  canSelectSoundMode: boolean;
  canBrowseMedia: boolean;
  canRepeat: boolean;
  canGroup: boolean;
  canAnnounce: boolean;
  canEnqueue: boolean;
  canSearchMedia: boolean;
};

export type MediaCardMetadata = {
  title?: string;
  artist?: string;
  albumName?: string;
  albumArtist?: string;
  channel?: string;
  contentId?: string;
  contentType?: string;
  duration?: number;
  episode?: string;
  imageHash?: string;
  imageRemotelyAccessible?: boolean;
  imageUrl?: string;
  imageLocalUrl?: string;
  playlist?: string;
  position?: number;
  positionUpdatedAt?: number;
  season?: string;
  seriesTitle?: string;
  track?: number;
  appId?: string;
  appName?: string;
  source?: string;
  sourceList: string[];
  soundMode?: string;
  soundModeList: string[];
  groupMembers: string[];
  deviceClass?: MediaDeviceClass;
  volumeLevel?: number;
  volumeMuted?: boolean;
  volumeStep?: number;
};

export type MediaCardModel = {
  entityId: string;
  name: string;
  state: MediaPlayerRuntimeState;
  stateLabel: string;
  displayState: Exclude<MediaPlayerRuntimeState, 'unknown'>;
  displayStateLabel: string;
  isPlaying: boolean;
  isUnavailable: boolean;
  isBuffering: boolean;
  progressPercent: number;
  repeatMode: MediaRepeatMode;
  shuffleEnabled: boolean;
  metadata: MediaCardMetadata;
  capabilities: MediaCardCapabilities;
};

type BuildMediaCardModelInput = {
  widget: Widget;
  liveEntity?: MockEntityState;
  nowMs?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toInteger(value: unknown): number | undefined {
  const numberValue = toFiniteNumber(value);
  return numberValue === undefined ? undefined : Math.round(numberValue);
}

function toTrimmedString(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeToken(value: unknown) {
  return toTrimmedString(value)?.toLowerCase().replace(/\s+/g, '_') ?? '';
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'on', 'yes', '1'].includes(normalized)) return true;
    if (['false', 'off', 'no', '0'].includes(normalized)) return false;
  }
  return undefined;
}

export function toMediaStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function uniqueStrings(values: Array<string | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const entry = value?.trim();
    if (!entry) return;
    const key = entry.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(entry);
  });
  return result;
}

export function normalizeMediaPlayerState(value: string | undefined): MediaPlayerRuntimeState {
  const normalized = normalizeMediaPlayerStateKey(value);
  if (normalized === 'standby') return 'off';
  return normalized;
}

export function resolveMediaRepeatMode(value: unknown): MediaRepeatMode {
  const normalized = normalizeToken(value);
  if (normalized === 'one' || normalized === 'single' || normalized === 'track' || normalized === '1') {
    return 'one';
  }
  if (normalized === 'all' || normalized === 'playlist' || normalized === 'on' || normalized === 'true') {
    return 'all';
  }
  return 'off';
}

export function resolveLiveMediaPosition(
  basePosition: number,
  duration: number,
  state: string | undefined,
  updatedAt: number | undefined,
  nowMs: number,
) {
  if (!(duration > 0)) return 0;
  const safeBase = clamp(Math.round(basePosition || 0), 0, duration);
  if (normalizeMediaPlayerState(state) !== 'playing' || !updatedAt || nowMs <= updatedAt) {
    return safeBase;
  }
  const elapsedSeconds = Math.floor((nowMs - updatedAt) / 1000);
  return elapsedSeconds > 0 ? clamp(safeBase + elapsedSeconds, 0, duration) : safeBase;
}

function readSupportedFeatures(entity: MockEntityState | undefined) {
  const supportedFeatures =
    toInteger(entity?.supportedFeatures) ?? toInteger(entity?.rawAttributes?.supported_features);
  return supportedFeatures === undefined ? undefined : Math.max(0, supportedFeatures);
}

function hasFeature(features: number | undefined, feature: number) {
  return typeof features === 'number' && (features & feature) !== 0;
}

function resolveMediaCapabilities(entity: MockEntityState | undefined): MediaCardCapabilities {
  const supportedFeatures = readSupportedFeatures(entity);
  const hasKnownFeatureMask = supportedFeatures !== undefined;
  const rawAttributes = entity?.rawAttributes;
  const sourceList = toMediaStringArray(rawAttributes?.source_list);
  const soundModeList = toMediaStringArray(rawAttributes?.sound_mode_list);
  const groupMembers = toMediaStringArray(rawAttributes?.group_members);
  const inferWhenUnknown = !hasKnownFeatureMask;

  const canPlay = hasFeature(supportedFeatures, MEDIA_FEATURE_PLAY) || inferWhenUnknown;
  const canPause = hasFeature(supportedFeatures, MEDIA_FEATURE_PAUSE) || inferWhenUnknown;

  return {
    supportedFeatures,
    hasKnownFeatureMask,
    canPlay,
    canPause,
    canTogglePlayback: canPlay || canPause || inferWhenUnknown,
    canSeek: hasFeature(supportedFeatures, MEDIA_FEATURE_SEEK) || inferWhenUnknown || entity?.mediaDuration !== undefined,
    canPreviousTrack: hasFeature(supportedFeatures, MEDIA_FEATURE_PREVIOUS_TRACK) || inferWhenUnknown,
    canNextTrack: hasFeature(supportedFeatures, MEDIA_FEATURE_NEXT_TRACK) || inferWhenUnknown,
    canSetVolume: hasFeature(supportedFeatures, MEDIA_FEATURE_VOLUME_SET) || inferWhenUnknown || entity?.volumeLevel !== undefined,
    canMute:
      hasFeature(supportedFeatures, MEDIA_FEATURE_VOLUME_MUTE) ||
      inferWhenUnknown ||
      entity?.mediaMuted !== undefined ||
      rawAttributes?.is_volume_muted !== undefined,
    canStepVolume: hasFeature(supportedFeatures, MEDIA_FEATURE_VOLUME_STEP),
    canTurnOn: hasFeature(supportedFeatures, MEDIA_FEATURE_TURN_ON) || inferWhenUnknown,
    canTurnOff: hasFeature(supportedFeatures, MEDIA_FEATURE_TURN_OFF) || inferWhenUnknown,
    canPlayMedia: hasFeature(supportedFeatures, MEDIA_FEATURE_PLAY_MEDIA),
    canSelectSource:
      hasFeature(supportedFeatures, MEDIA_FEATURE_SELECT_SOURCE) || inferWhenUnknown || sourceList.length > 0,
    canStop: hasFeature(supportedFeatures, MEDIA_FEATURE_STOP),
    canClearPlaylist: hasFeature(supportedFeatures, MEDIA_FEATURE_CLEAR_PLAYLIST),
    canShuffle:
      hasFeature(supportedFeatures, MEDIA_FEATURE_SHUFFLE_SET) ||
      inferWhenUnknown ||
      toBoolean(rawAttributes?.shuffle) !== undefined,
    canSelectSoundMode:
      hasFeature(supportedFeatures, MEDIA_FEATURE_SELECT_SOUND_MODE) || soundModeList.length > 0,
    canBrowseMedia: hasFeature(supportedFeatures, MEDIA_FEATURE_BROWSE_MEDIA),
    canRepeat:
      hasFeature(supportedFeatures, MEDIA_FEATURE_REPEAT_SET) ||
      inferWhenUnknown ||
      toTrimmedString(rawAttributes?.repeat) !== undefined,
    canGroup:
      hasFeature(supportedFeatures, MEDIA_FEATURE_GROUPING) || inferWhenUnknown || groupMembers.length > 0,
    canAnnounce: hasFeature(supportedFeatures, MEDIA_FEATURE_ANNOUNCE),
    canEnqueue: hasFeature(supportedFeatures, MEDIA_FEATURE_ENQUEUE),
    canSearchMedia: hasFeature(supportedFeatures, MEDIA_FEATURE_SEARCH_MEDIA),
  };
}

export function buildMediaCardModel({
  widget,
  liveEntity,
  nowMs = Date.now(),
}: BuildMediaCardModelInput): MediaCardModel {
  const rawAttributes = liveEntity?.rawAttributes;
  const rawStateValue = liveEntity?.state ?? liveEntity?.stateLabel ?? widget.status;
  const state = normalizeMediaPlayerState(rawStateValue);
  const duration = Math.max(
    0,
    Math.round(
      toFiniteNumber(liveEntity?.mediaDuration) ??
        toFiniteNumber(rawAttributes?.media_duration) ??
        0,
    ),
  );
  const rawPosition =
    toFiniteNumber(liveEntity?.mediaPosition) ?? toFiniteNumber(rawAttributes?.media_position) ?? 0;
  const positionUpdatedAt =
    toFiniteNumber(liveEntity?.mediaPositionUpdatedAt) ??
    toFiniteNumber(rawAttributes?.media_position_updated_at);
  const position = resolveLiveMediaPosition(
    rawPosition,
    duration,
    liveEntity?.state ?? liveEntity?.stateLabel ?? widget.status,
    positionUpdatedAt,
    nowMs,
  );
  const source = toTrimmedString(rawAttributes?.source) ?? toTrimmedString(rawAttributes?.source_name);
  const sourceList = uniqueStrings([source, ...toMediaStringArray(rawAttributes?.source_list)]);
  const soundMode = toTrimmedString(rawAttributes?.sound_mode);
  const soundModeList = uniqueStrings([soundMode, ...toMediaStringArray(rawAttributes?.sound_mode_list)]);
  const groupMembers = toMediaStringArray(rawAttributes?.group_members);
  const shuffleEnabled =
    liveEntity?.shuffleEnabled ??
    toBoolean(rawAttributes?.shuffle) ??
    toBoolean(rawAttributes?.shuffle_enabled) ??
    false;
  const repeatMode = resolveMediaRepeatMode(liveEntity?.repeatMode ?? rawAttributes?.repeat ?? rawAttributes?.repeat_mode);
  const progressPercent = duration > 0
    ? clamp(Math.round((position / duration) * 100), 0, 100)
    : clamp(Math.round(toFiniteNumber(liveEntity?.progress) ?? toFiniteNumber(widget.value) ?? 0), 0, 100);
  const volumeLevel =
    toFiniteNumber(liveEntity?.volumeLevel) ??
    toFiniteNumber(rawAttributes?.volume_level);
  const metadata: MediaCardMetadata = {
    title: toTrimmedString(liveEntity?.mediaTitle) ?? toTrimmedString(liveEntity?.nowPlaying) ?? toTrimmedString(rawAttributes?.media_title),
    artist: toTrimmedString(liveEntity?.mediaArtist) ?? toTrimmedString(rawAttributes?.media_artist),
    albumName: toTrimmedString(liveEntity?.mediaAlbumName) ?? toTrimmedString(rawAttributes?.media_album_name),
    albumArtist: toTrimmedString(liveEntity?.mediaAlbumArtist) ?? toTrimmedString(rawAttributes?.media_album_artist),
    channel: toTrimmedString(liveEntity?.mediaChannel) ?? toTrimmedString(rawAttributes?.media_channel),
    contentId: toTrimmedString(liveEntity?.mediaContentId) ?? toTrimmedString(rawAttributes?.media_content_id),
    contentType: toTrimmedString(liveEntity?.mediaContentType) ?? toTrimmedString(rawAttributes?.media_content_type),
    duration,
    episode: toTrimmedString(liveEntity?.mediaEpisode) ?? toTrimmedString(rawAttributes?.media_episode),
    imageHash: toTrimmedString(liveEntity?.mediaImageHash) ?? toTrimmedString(rawAttributes?.media_image_hash),
    imageRemotelyAccessible:
      typeof liveEntity?.mediaImageRemotelyAccessible === 'boolean'
        ? liveEntity.mediaImageRemotelyAccessible
        : typeof rawAttributes?.media_image_remotely_accessible === 'boolean'
          ? rawAttributes.media_image_remotely_accessible
          : undefined,
    imageUrl:
      toTrimmedString(liveEntity?.imageUrl) ??
      toTrimmedString(liveEntity?.mediaImageUrl) ??
      toTrimmedString(rawAttributes?.media_image_url) ??
      toTrimmedString(rawAttributes?.entity_picture),
    imageLocalUrl: toTrimmedString(liveEntity?.mediaImageLocalUrl) ?? toTrimmedString(rawAttributes?.entity_picture_local),
    playlist: toTrimmedString(liveEntity?.mediaPlaylist) ?? toTrimmedString(rawAttributes?.media_playlist),
    position,
    positionUpdatedAt,
    season: toTrimmedString(liveEntity?.mediaSeason) ?? toTrimmedString(rawAttributes?.media_season),
    seriesTitle: toTrimmedString(liveEntity?.mediaSeriesTitle) ?? toTrimmedString(rawAttributes?.media_series_title),
    track: toInteger(liveEntity?.mediaTrack) ?? toInteger(rawAttributes?.media_track),
    appId: toTrimmedString(liveEntity?.appId) ?? toTrimmedString(rawAttributes?.app_id),
    appName: toTrimmedString(liveEntity?.appName) ?? toTrimmedString(rawAttributes?.app_name),
    source,
    sourceList,
    soundMode,
    soundModeList,
    groupMembers,
    deviceClass: toTrimmedString(liveEntity?.mediaDeviceClass) ?? toTrimmedString(rawAttributes?.device_class),
    volumeLevel: volumeLevel === undefined ? undefined : clamp(Math.round(volumeLevel), 0, 100),
    volumeMuted:
      typeof liveEntity?.mediaMuted === 'boolean'
        ? liveEntity.mediaMuted
        : typeof rawAttributes?.is_volume_muted === 'boolean'
          ? rawAttributes.is_volume_muted
          : undefined,
    volumeStep: toFiniteNumber(liveEntity?.volumeStep) ?? toFiniteNumber(rawAttributes?.volume_step),
  };

  const displayState = state === 'unknown' ? 'idle' : state;

  return {
    entityId: widget.entityId,
    name: widget.title || toTrimmedString(rawAttributes?.friendly_name) || widget.entityId,
    state,
    stateLabel: translateMediaPlayerState(rawStateValue),
    displayState,
    displayStateLabel: translateMediaPlayerState(state === 'unknown' ? displayState : rawStateValue),
    isPlaying: state === 'playing',
    isUnavailable: displayState === 'unavailable',
    isBuffering: displayState === 'buffering',
    progressPercent,
    repeatMode,
    shuffleEnabled,
    metadata,
    capabilities: resolveMediaCapabilities(liveEntity),
  };
}
