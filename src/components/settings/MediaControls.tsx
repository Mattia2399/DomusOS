import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  Cast,
  Check,
  ChevronRight,
  Info,
  ListX,
  Mic,
  Music,
  Pause,
  Play,
  Plus,
  Repeat,
  Search,
  Settings2,
  Shuffle,
  SkipBack,
  SkipForward,
  Speaker,
  Square,
  Tv2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';
import { ContextPanelHeader } from './ContextPanelHeader';
import { translateMediaPlayerState } from '../../utils/mediaPlayerState';

interface MediaOutputDevice {
  id: string;
  name: string;
  subtitle?: string;
  kind?: 'speaker' | 'tv' | 'cast';
}

interface MediaGroupDevice {
  id: string;
  name: string;
  subtitle?: string;
  kind?: 'speaker' | 'tv' | 'cast';
  grouped?: boolean;
}

type MediaRepeatMode = 'off' | 'all' | 'one';
type MediaPlayMode = 'play' | 'enqueue' | 'announce';

export type MediaPlayRequest = {
  mediaContentId: string;
  mediaContentType: string;
  enqueue?: 'add' | 'next' | 'play' | 'replace';
  announce?: boolean;
};

type MediaLibraryItem = {
  id: string;
  title: string;
  subtitle?: string;
  mediaContentId: string;
  mediaContentType: string;
  thumbnailUrl?: string;
};

interface MediaControlsProps {
  name?: string;
  status?: string;
  isPlaying: boolean;
  progress: number;
  positionSeconds?: number;
  trackTitle?: string;
  trackArtist?: string;
  durationSeconds?: number;
  coverUrl?: string;
  volumeLevel?: number;
  muted?: boolean;
  supportsSeek?: boolean;
  supportsVolume?: boolean;
  supportsMute?: boolean;
  supportsVolumeStep?: boolean;
  supportsNextTrack?: boolean;
  supportsPreviousTrack?: boolean;
  supportsPower?: boolean;
  supportsShuffle?: boolean;
  supportsRepeat?: boolean;
  supportsSelectSource?: boolean;
  supportsGrouping?: boolean;
  supportsStop?: boolean;
  supportsClearPlaylist?: boolean;
  supportsSelectSoundMode?: boolean;
  supportsPlayMedia?: boolean;
  supportsBrowseMedia?: boolean;
  supportsSearchMedia?: boolean;
  supportsAnnounce?: boolean;
  supportsEnqueue?: boolean;
  shuffleEnabled?: boolean;
  repeatMode?: MediaRepeatMode;
  soundMode?: string;
  soundModeList?: string[];
  volumeStep?: number;
  rawAttributes?: Record<string, unknown>;
  outputDevices?: MediaOutputDevice[];
  selectedOutputDeviceId?: string;
  multiroomDevices?: MediaGroupDevice[];
  onTogglePlayback: () => void;
  onTogglePower?: () => void;
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
  onSeek?: (position: number) => void;
  onVolumeChange?: (value: number) => void;
  onToggleMute?: () => void;
  onToggleShuffle?: () => void;
  onCycleRepeatMode?: () => void;
  onStop?: () => void;
  onClearPlaylist?: () => void;
  onSelectSoundMode?: (soundMode: string) => void;
  onPlayMedia?: (request: MediaPlayRequest) => void;
  onSelectOutputDevice?: (deviceId: string) => void;
  onToggleMultiroomDevice?: (deviceId: string, shouldJoin: boolean) => void;
}

const DEFAULT_ALBUM_ART =
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop';
function formatTimeFromProgress(progressPercent: number, durationSeconds: number) {
  const current = Math.round((Math.max(0, Math.min(100, progressPercent)) / 100) * durationSeconds);
  const minutes = Math.floor(current / 60);
  const seconds = String(current % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function formatTimeFromSeconds(secondsValue: number) {
  const safe = Math.max(0, Math.round(secondsValue));
  const minutes = Math.floor(safe / 60);
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatMediaContentTypeLabel(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) {
    return 'Media';
  }
  const normalized = raw.toLowerCase().replace(/[_-]+/g, ' ');
  if (normalized === 'music') return 'Musica';
  if (normalized === 'playlist') return 'Playlist';
  if (normalized === 'channel') return 'Canale';
  if (normalized === 'episode') return 'Episodio';
  if (normalized === 'announcement') return 'Annuncio';
  if (normalized === 'movie') return 'Film';
  if (normalized === 'tvshow' || normalized === 'tv show' || normalized === 'series') return 'Serie TV';
  if (normalized === 'app') return 'App';
  if (normalized === 'video') return 'Video';
  if (normalized === 'podcast') return 'Podcast';
  if (normalized === 'album') return 'Album';
  if (normalized === 'track' || normalized === 'song') return 'Brano';
  return raw;
}

function formatSoundModeLabel(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (normalized === 'music') return 'Musica';
  if (normalized === 'movie') return 'Film';
  if (normalized === 'night') return 'Notte';
  if (normalized === 'speech') return 'Voce';
  if (normalized === 'game') return 'Gioco';
  if (normalized === 'standard') return 'Standard';
  if (normalized === 'stereo') return 'Stereo';
  if (normalized === 'surround') return 'Surround';
  if (normalized === 'auto') return 'Auto';
  if (normalized === 'off') return 'Spento';
  return value;
}

function formatRepeatButtonLabel(mode: MediaRepeatMode) {
  if (mode === 'one') return 'Ripeti: uno';
  if (mode === 'all') return 'Ripeti: tutti';
  return 'Ripeti: disattivato';
}

function toTrimmedString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readFirstString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = toTrimmedString(source[key]);
    if (value) {
      return value;
    }
  }
  return undefined;
}

function normalizeMediaLibraryItem(value: unknown, index: number): MediaLibraryItem | null {
  if (typeof value === 'string') {
    const mediaContentId = value.trim();
    if (!mediaContentId) {
      return null;
    }
    return {
      id: `media-library-string-${index}`,
      title: mediaContentId,
      mediaContentId,
      mediaContentType: 'music',
    };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const mediaContentId = readFirstString(raw, ['media_content_id', 'mediaContentId', 'content_id', 'id', 'uri', 'url']);
  if (!mediaContentId) {
    return null;
  }
  const mediaContentType =
    readFirstString(raw, ['media_content_type', 'mediaContentType', 'content_type', 'type']) ?? 'music';
  const title =
    readFirstString(raw, ['title', 'name', 'label', 'media_title', 'mediaTitle']) ?? mediaContentId;
  const subtitle = readFirstString(raw, ['subtitle', 'description', 'artist', 'media_artist', 'album']);
  const thumbnailUrl = readFirstString(raw, ['thumbnail', 'thumbnail_url', 'image', 'image_url', 'artwork']);
  return {
    id: readFirstString(raw, ['key', 'item_id']) ?? `${mediaContentType}-${mediaContentId}-${index}`,
    title,
    subtitle,
    mediaContentId,
    mediaContentType,
    thumbnailUrl,
  };
}

function resolveMediaLibraryItems(rawAttributes: Record<string, unknown> | undefined) {
  const source =
    rawAttributes?.media_library ??
    rawAttributes?.media_items ??
    rawAttributes?.media_browser_items ??
    rawAttributes?.browse_items;
  const entries = Array.isArray(source) ? source : [];
  const items = entries
    .map((entry, index) => normalizeMediaLibraryItem(entry, index))
    .filter((entry): entry is MediaLibraryItem => Boolean(entry));
  const currentContentId = toTrimmedString(rawAttributes?.media_content_id);
  if (currentContentId) {
    const currentContentType = toTrimmedString(rawAttributes?.media_content_type) ?? 'music';
    const currentTitle = toTrimmedString(rawAttributes?.media_title) ?? currentContentId;
    items.unshift({
      id: `current-${currentContentType}-${currentContentId}`,
      title: currentTitle,
      subtitle: toTrimmedString(rawAttributes?.media_artist) ?? toTrimmedString(rawAttributes?.app_name),
      mediaContentId: currentContentId,
      mediaContentType: currentContentType,
      thumbnailUrl: toTrimmedString(rawAttributes?.media_image_url) ?? toTrimmedString(rawAttributes?.entity_picture),
    });
  }
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.mediaContentType}:${item.mediaContentId}`.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function SecondaryAction({
  icon,
  label,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`h-12 w-12 min-[420px]:h-14 min-[420px]:w-14 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 flex items-center justify-center transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/15'
      }`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

export function MediaControlsPanel({
  name = 'Diffusore',
  status = 'Connesso',
  isPlaying,
  progress,
  positionSeconds,
  trackTitle = '',
  trackArtist = '',
  durationSeconds = 0,
  coverUrl,
  volumeLevel = 72,
  muted = false,
  supportsSeek = true,
  supportsVolume = true,
  supportsMute = true,
  supportsVolumeStep = false,
  supportsNextTrack = true,
  supportsPreviousTrack = true,
  supportsShuffle = true,
  supportsRepeat = true,
  supportsSelectSource = true,
  supportsGrouping = true,
  supportsStop = false,
  supportsClearPlaylist = false,
  supportsSelectSoundMode = false,
  supportsPlayMedia = false,
  supportsBrowseMedia = false,
  supportsSearchMedia = false,
  supportsAnnounce = false,
  supportsEnqueue = false,
  shuffleEnabled = false,
  repeatMode = 'off',
  soundMode,
  soundModeList,
  volumeStep,
  rawAttributes,
  outputDevices,
  selectedOutputDeviceId: selectedOutputDeviceIdProp,
  multiroomDevices,
  onTogglePlayback,
  onPreviousTrack,
  onNextTrack,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeatMode,
  onStop,
  onClearPlaylist,
  onSelectSoundMode,
  onPlayMedia,
  onSelectOutputDevice,
  onToggleMultiroomDevice,
}: MediaControlsProps) {
  const VOLUME_DEBOUNCE_MS = 120;
  const volumeDebounceRef = useRef<number | null>(null);
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const safeDuration = Math.max(0, Math.round(durationSeconds));
  const hasLiveDuration = safeDuration > 0;
  const fallbackPosition = hasLiveDuration ? Math.round((safeProgress / 100) * safeDuration) : 0;
  const resolvedPosition = clamp(Math.round(positionSeconds ?? fallbackPosition), 0, safeDuration);
  const [livePosition, setLivePosition] = useState(resolvedPosition);
  const displayProgress = hasLiveDuration ? Math.round((livePosition / safeDuration) * 100) : 0;
  const [volumeDraft, setVolumeDraft] = useState(Math.max(0, Math.min(100, Math.round(volumeLevel))));
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const availableOutputDevices = outputDevices ?? [];
  const availableMultiroomDevices = multiroomDevices ?? [];
  const [localOutputDeviceId, setLocalOutputDeviceId] = useState(
    selectedOutputDeviceIdProp ?? availableOutputDevices[0]?.id ?? '',
  );
  const [localGroupedDeviceIds, setLocalGroupedDeviceIds] = useState<string[]>([]);
  const [multiroomOverlayOpen, setMultiroomOverlayOpen] = useState(false);
  const selectedOutputDeviceId = selectedOutputDeviceIdProp ?? localOutputDeviceId;
  const resolvedShuffleEnabled = Boolean(shuffleEnabled);
  const resolvedRepeatMode: MediaRepeatMode = repeatMode === 'one' || repeatMode === 'all' ? repeatMode : 'off';
  const repeatButtonLabel = formatRepeatButtonLabel(resolvedRepeatMode);
  const safeVolumePercent = Math.max(0, Math.min(100, volumeDraft));
  const elapsed = useMemo(() => formatTimeFromSeconds(livePosition), [livePosition]);
  const total = useMemo(() => formatTimeFromProgress(100, safeDuration), [safeDuration]);
  const resolvedTrackTitle = trackTitle.trim() || 'Nessun brano in riproduzione';
  const resolvedTrackArtist = trackArtist.trim() || 'Nessun artista';
  const translatedStatus = translateMediaPlayerState(status, status || 'Sconosciuto');
  const albumArt = coverUrl && coverUrl.trim().length > 0 ? coverUrl : DEFAULT_ALBUM_ART;
  const metadataDetails = [
    toTrimmedString(rawAttributes?.media_album_name),
    toTrimmedString(rawAttributes?.media_playlist),
    toTrimmedString(rawAttributes?.media_channel),
    toTrimmedString(rawAttributes?.media_series_title)
      ? [
          toTrimmedString(rawAttributes?.media_series_title),
          toTrimmedString(rawAttributes?.media_season),
          toTrimmedString(rawAttributes?.media_episode),
        ].filter(Boolean).join(' S')
      : undefined,
  ].filter((entry): entry is string => Boolean(entry));
  const soundModes = useMemo(
    () => (
      Array.isArray(soundModeList) && soundModeList.length > 0
        ? soundModeList
        : toStringArray(rawAttributes?.sound_mode_list)
    )
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0),
    [rawAttributes, soundModeList],
  );
  const activeSoundMode = toTrimmedString(soundMode) ?? toTrimmedString(rawAttributes?.sound_mode);
  const rawVolumeStep = volumeStep ?? toFiniteNumber(rawAttributes?.volume_step);
  const volumeStepPercent = rawVolumeStep === undefined
    ? 5
    : rawVolumeStep > 0 && rawVolumeStep <= 1
      ? Math.max(1, Math.round(rawVolumeStep * 100))
      : Math.max(1, Math.round(rawVolumeStep));
  const mediaLibraryItems = useMemo(() => resolveMediaLibraryItems(rawAttributes), [rawAttributes]);
  const filteredMediaLibraryItems = useMemo(() => {
    const query = mediaSearchQuery.trim().toLowerCase();
    if (!query) {
      return mediaLibraryItems.slice(0, 6);
    }
    return mediaLibraryItems
      .filter((item) =>
        `${item.title} ${item.subtitle ?? ''} ${item.mediaContentType} ${item.mediaContentId}`
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 6);
  }, [mediaLibraryItems, mediaSearchQuery]);
  const canPlayMedia = supportsPlayMedia && Boolean(onPlayMedia);
  const showMediaLibrary = filteredMediaLibraryItems.length > 0 || mediaSearchQuery.trim().length > 0;
  const groupedDeviceIds = useMemo(() => new Set(localGroupedDeviceIds), [localGroupedDeviceIds]);
  const groupedMultiroomDevices = useMemo(
    () => availableMultiroomDevices.filter((device) => groupedDeviceIds.has(device.id)),
    [availableMultiroomDevices, groupedDeviceIds],
  );
  const multiroomSummary = !supportsGrouping
    ? 'Non disponibile'
    : availableMultiroomDevices.length === 0
      ? 'Nessun player disponibile'
      : groupedMultiroomDevices.length === 0
        ? 'Solo questo player'
        : groupedMultiroomDevices.length === 1
          ? '1 dispositivo collegato'
          : `${groupedMultiroomDevices.length} dispositivi collegati`;
  const multiroomDetail = groupedMultiroomDevices.length > 0
    ? groupedMultiroomDevices.map((device) => device.name).slice(0, 2).join(', ') +
      (groupedMultiroomDevices.length > 2 ? ` +${groupedMultiroomDevices.length - 2}` : '')
    : 'Aggiungi speaker, TV o cast compatibili.';

  useEffect(() => {
    setVolumeDraft(Math.max(0, Math.min(100, Math.round(volumeLevel))));
  }, [volumeLevel]);

  useEffect(() => {
    if (selectedOutputDeviceIdProp) {
      setLocalOutputDeviceId(selectedOutputDeviceIdProp);
      return;
    }
    if (!availableOutputDevices.some((device) => device.id === localOutputDeviceId)) {
      setLocalOutputDeviceId(availableOutputDevices[0]?.id ?? '');
    }
  }, [availableOutputDevices, localOutputDeviceId, selectedOutputDeviceIdProp]);

  useEffect(() => {
    setLocalGroupedDeviceIds(
      availableMultiroomDevices
        .filter((device) => device.grouped === true)
        .map((device) => device.id),
    );
  }, [availableMultiroomDevices]);

  useEffect(() => {
    if (!supportsGrouping || availableMultiroomDevices.length === 0) {
      setMultiroomOverlayOpen(false);
    }
  }, [availableMultiroomDevices.length, supportsGrouping]);

  useEffect(() => {
    setLivePosition(resolvedPosition);
  }, [resolvedPosition, trackTitle, trackArtist, safeDuration, status]);

  useEffect(() => {
    if (!isPlaying || !hasLiveDuration) {
      return;
    }
    const timerId = window.setInterval(() => {
      setLivePosition((current) => {
        if (current >= safeDuration) {
          return safeDuration;
        }
        return current + 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(timerId);
    };
  }, [hasLiveDuration, isPlaying, safeDuration]);

  useEffect(
    () => () => {
      if (volumeDebounceRef.current !== null) {
        window.clearTimeout(volumeDebounceRef.current);
        volumeDebounceRef.current = null;
      }
    },
    [],
  );

  const stepVolume = (direction: -1 | 1) => {
    if (!supportsVolume || !supportsVolumeStep || !onVolumeChange) {
      return;
    }
    const nextVolume = clamp(safeVolumePercent + direction * volumeStepPercent, 0, 100);
    setVolumeDraft(nextVolume);
    onVolumeChange(nextVolume);
  };

  const submitPlayMedia = (item: MediaLibraryItem, mode: MediaPlayMode = 'play') => {
    if (!canPlayMedia) {
      return;
    }
    const mediaContentId = item.mediaContentId.trim();
    const mediaContentType = item.mediaContentType.trim() || 'music';
    if (!mediaContentId) {
      return;
    }
    onPlayMedia?.({
      mediaContentId,
      mediaContentType,
      enqueue: mode === 'enqueue' ? 'add' : undefined,
      announce: mode === 'announce' ? true : undefined,
    });
  };

  const toggleMultiroomDevice = (deviceId: string, shouldJoin: boolean) => {
    if (!supportsGrouping) {
      return;
    }
    setLocalGroupedDeviceIds((current) => {
      if (shouldJoin) {
        return current.includes(deviceId) ? current : [...current, deviceId];
      }
      return current.filter((entry) => entry !== deviceId);
    });
    onToggleMultiroomDevice?.(deviceId, shouldJoin);
  };

  return (
    <div className={`${CONTEXT_PANEL_LAYOUT.shell} relative`}>
      <ContextPanelHeader title={name} subtitle={translatedStatus} icon={<Speaker size={22} />} fallbackTitle="Diffusore" />

      <div className={`relative overflow-hidden ${CONTEXT_PANEL_LAYOUT.sectionSoft} mb-1`}>
        <div
          className="absolute inset-0 z-0 bg-center bg-cover blur-3xl opacity-30 scale-110 transform"
          style={{ backgroundImage: `url(${albumArt})` }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <img
            src={albumArt}
            alt="Copertina album"
            className="w-full aspect-square object-cover rounded-2xl shadow-2xl shadow-black/50"
          />

          <div className="mt-4 text-center">
            <p className="text-white text-lg font-medium">{resolvedTrackTitle}</p>
            <p className="text-gray-400 text-sm font-light mt-1">{resolvedTrackArtist}</p>
            {metadataDetails.length > 0 ? (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {metadataDetails.slice(0, 7).map((detail) => (
                  <span
                    key={detail}
                    className="max-w-[10rem] truncate rounded-full border border-white/8 bg-white/[0.07] px-2.5 py-1 text-[10px] font-semibold text-white/55"
                    title={detail}
                  >
                    {detail}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            <div className="h-1 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-[width]" style={{ width: `${displayProgress}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-white/60">
              <span>{elapsed}</span>
              <span>{total}</span>
            </div>
          </div>

          <div className="mt-4 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/5 p-2 flex items-center justify-center gap-2.5">
            <button
              type="button"
              className={`w-9 h-9 rounded-full border text-white flex items-center justify-center transition-colors ${
                resolvedShuffleEnabled
                  ? 'bg-white/22 border-white/30 text-white'
                  : 'bg-white/10 border-white/10'
              } ${supportsShuffle ? 'hover:bg-white/15' : 'opacity-45 cursor-not-allowed'}`}
              disabled={!supportsShuffle}
              aria-label="Riproduzione casuale"
              title={resolvedShuffleEnabled ? 'Casuale attivo' : 'Casuale disattivato'}
              aria-pressed={resolvedShuffleEnabled}
              onClick={() => {
                if (!supportsShuffle) {
                  return;
                }
                onToggleShuffle?.();
              }}
            >
              <Shuffle size={15} />
            </button>

            <button
              type="button"
              className={`w-9 h-9 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center transition-colors ${
                supportsPreviousTrack ? 'hover:bg-white/15' : 'opacity-45 cursor-not-allowed'
              }`}
              aria-label="Traccia precedente"
              disabled={!supportsPreviousTrack}
              onClick={() => onPreviousTrack?.()}
            >
              <SkipBack size={16} />
            </button>

            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/24 bg-white/18 text-white shadow-[0_0_18px_rgba(255,255,255,0.12)] backdrop-blur-xl transition-colors hover:bg-white/24"
              onClick={onTogglePlayback}
              aria-label={isPlaying ? 'Metti in pausa' : 'Riproduci'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>

            <button
              type="button"
              className={`w-9 h-9 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center transition-colors ${
                supportsNextTrack ? 'hover:bg-white/15' : 'opacity-45 cursor-not-allowed'
              }`}
              aria-label="Traccia successiva"
              disabled={!supportsNextTrack}
              onClick={() => onNextTrack?.()}
            >
              <SkipForward size={16} />
            </button>

            <button
              type="button"
              className={`relative w-9 h-9 rounded-full border text-white flex items-center justify-center transition-colors ${
                resolvedRepeatMode !== 'off'
                  ? 'bg-white/22 border-white/30 text-white'
                  : 'bg-white/10 border-white/10'
              } ${supportsRepeat ? 'hover:bg-white/15' : 'opacity-45 cursor-not-allowed'}`}
              disabled={!supportsRepeat}
              aria-label={repeatButtonLabel}
              title={repeatButtonLabel}
              aria-pressed={resolvedRepeatMode !== 'off'}
              onClick={() => {
                if (!supportsRepeat) {
                  return;
                }
                onCycleRepeatMode?.();
              }}
            >
              <Repeat size={15} />
              {resolvedRepeatMode === 'one' ? (
                <span className="absolute -bottom-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full border border-white/25 bg-white/[0.08] px-1 text-[9px] font-semibold leading-none text-white">
                  1
                </span>
              ) : null}
            </button>

            {supportsStop ? (
              <button
                type="button"
                className={`w-9 h-9 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center transition-colors ${
                  onStop ? 'hover:bg-white/15' : 'opacity-45 cursor-not-allowed'
                }`}
                aria-label="Interrompi riproduzione"
                disabled={!onStop}
                onClick={() => onStop?.()}
              >
                <Square size={14} />
              </button>
            ) : null}
          </div>

          {supportsClearPlaylist ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={!onClearPlaylist}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  onClearPlaylist
                    ? 'border-white/12 bg-white/[0.08] text-white/78 hover:bg-white/[0.13]'
                    : 'cursor-not-allowed border-white/8 bg-white/[0.04] text-white/38'
                }`}
                onClick={() => onClearPlaylist?.()}
              >
                <ListX size={13} />
                Svuota playlist
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {showMediaLibrary ? (
        <div className="w-full rounded-[clamp(1.15rem,4vw,1.8rem)] bg-white/5 backdrop-blur-xl border border-white/5 p-2 sm:p-3 mb-1">
          <div className="px-3 pb-2 pt-1">
            <p className="text-[10px] text-white/40 font-semibold tracking-wider uppercase">
              Libreria media
            </p>
          </div>

          <div className="space-y-2 px-1 pb-1">
            {supportsSearchMedia ? (
              <label className="relative block">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/42" />
                <input
                  value={mediaSearchQuery}
                  onChange={(event) => setMediaSearchQuery(event.target.value)}
                  className="h-10 w-full rounded-2xl border border-white/8 bg-white/[0.07] pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/32 focus:border-white/18 focus:bg-white/[0.1]"
                  placeholder="Cerca media"
                  aria-label="Cerca media"
                />
              </label>
            ) : null}

            {supportsBrowseMedia || filteredMediaLibraryItems.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {filteredMediaLibraryItems.length > 0 ? (
                  filteredMediaLibraryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.055] px-3 py-2"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.07] text-white/62">
                            <Music size={15} />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-white/84">{item.title}</span>
                          <span className="block truncate text-[11px] text-white/42">
                            {item.subtitle ?? formatMediaContentTypeLabel(item.mediaContentType)}
                          </span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          disabled={!canPlayMedia}
                          onClick={() => submitPlayMedia(item, 'play')}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.07] text-white/68 transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:text-white/25"
                          aria-label={`Riproduci ${item.title}`}
                          title="Riproduci"
                        >
                          <Play size={13} />
                        </button>
                        {supportsEnqueue ? (
                          <button
                            type="button"
                            disabled={!canPlayMedia}
                            onClick={() => submitPlayMedia(item, 'enqueue')}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.07] text-white/68 transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:text-white/25"
                            aria-label={`Aggiungi alla coda ${item.title}`}
                            title="Aggiungi alla coda"
                          >
                            <Plus size={13} />
                          </button>
                        ) : null}
                        {supportsAnnounce ? (
                          <button
                            type="button"
                            disabled={!canPlayMedia}
                            onClick={() => submitPlayMedia(item, 'announce')}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.07] text-white/68 transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:text-white/25"
                            aria-label={`Annuncia ${item.title}`}
                            title="Annuncia"
                          >
                            <Bell size={13} />
                          </button>
                        ) : null}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3 text-sm text-white/42">
                    Nessun media disponibile.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="w-full rounded-[clamp(1.15rem,4vw,1.8rem)] bg-white/5 backdrop-blur-xl border border-white/5 p-2 sm:p-3 mb-1">
        <p className="text-[10px] text-white/40 font-semibold tracking-wider uppercase px-3 pb-2 pt-1">
          Dispositivo di uscita
        </p>

        {availableOutputDevices.length > 0 ? (
          <div className="space-y-1.5">
            {availableOutputDevices.map((device) => {
              const isSelected = device.id === selectedOutputDeviceId;
              const DeviceIcon =
                device.kind === 'tv' ? Tv2 : device.kind === 'cast' ? Cast : Speaker;
              return (
                <button
                  key={device.id}
                  type="button"
                  disabled={!supportsSelectSource}
                  onClick={() => {
                    if (!supportsSelectSource) {
                      return;
                    }
                    if (onSelectOutputDevice) {
                      onSelectOutputDevice(device.id);
                      return;
                    }
                    setLocalOutputDeviceId(device.id);
                  }}
                  className={`flex items-center justify-between w-full rounded-2xl py-3 px-4 transition-all duration-200 active:scale-[0.98] ${
                    !supportsSelectSource
                      ? 'opacity-45 cursor-not-allowed text-white/65'
                      : isSelected
                        ? 'bg-white/15 text-white cursor-pointer'
                        : 'text-white/85 hover:bg-white/10 cursor-pointer'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <DeviceIcon
                      size={18}
                      className={isSelected ? 'text-white' : 'text-white/75'}
                    />
                    <span className="text-sm font-medium truncate">{device.name}</span>
                  </span>

                  {isSelected ? (
                    <Check size={16} className="ml-auto text-white" />
                  ) : (
                    <span className="text-xs text-white/45 ml-3 shrink-0">{device.subtitle ?? ''}</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="px-3 py-3 text-sm text-white/55">
            Nessun dispositivo di uscita disponibile.
          </p>
        )}
      </div>

      {supportsSelectSoundMode || soundModes.length > 0 ? (
        <div className="w-full rounded-[clamp(1.15rem,4vw,1.8rem)] bg-white/5 backdrop-blur-xl border border-white/5 p-2 sm:p-3 mb-1">
          <p className="text-[10px] text-white/40 font-semibold tracking-wider uppercase px-3 pb-2 pt-1">
            Modalita audio
          </p>

          {soundModes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 px-1 pb-1">
              {soundModes.map((mode) => {
                const active = activeSoundMode?.toLowerCase() === mode.toLowerCase();
                return (
                  <button
                    key={mode}
                    type="button"
                    disabled={!supportsSelectSoundMode}
                    onClick={() => {
                      if (!supportsSelectSoundMode) return;
                      onSelectSoundMode?.(mode);
                    }}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                      !supportsSelectSoundMode
                          ? 'cursor-not-allowed border-white/8 bg-white/[0.04] text-white/38'
                        : active
                          ? 'border-white/22 bg-white/16 text-white'
                          : 'border-white/10 bg-white/[0.07] text-white/68 hover:bg-white/[0.12] hover:text-white'
                    }`}
                    aria-pressed={active}
                  >
                    {formatSoundModeLabel(mode)}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-3 text-sm text-white/55">
              Nessuna modalita audio disponibile.
            </p>
          )}
        </div>
      ) : null}

      <div className="w-full rounded-[clamp(1.15rem,4vw,1.8rem)] bg-white/5 backdrop-blur-xl border border-white/5 p-2 sm:p-3 mb-1">
        <p className="text-[10px] text-white/40 font-semibold tracking-wider uppercase px-3 pb-2 pt-1">
          Riproduci anche su
        </p>

        <button
          type="button"
          disabled={!supportsGrouping || availableMultiroomDevices.length === 0}
          onClick={() => setMultiroomOverlayOpen(true)}
          className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.98] ${
            supportsGrouping && availableMultiroomDevices.length > 0
              ? 'bg-white/[0.07] text-white hover:bg-white/[0.12]'
              : 'cursor-not-allowed bg-white/[0.035] text-white/45'
          }`}
          aria-label="Gestisci gruppo multiroom"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/72">
              <Speaker size={17} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white/86">{multiroomSummary}</span>
              <span className="mt-0.5 block truncate text-[11px] text-white/42">{multiroomDetail}</span>
            </span>
          </span>
          {supportsGrouping && availableMultiroomDevices.length > 0 ? (
            <ChevronRight size={17} className="shrink-0 text-white/48" />
          ) : null}
        </button>

        {!supportsGrouping ? (
          <div className="mt-2 rounded-xl border border-amber-200/25 bg-amber-400/10 px-3 py-2.5">
            <p className="text-xs font-medium text-amber-100">
              Multiroom non disponibile con questo player.
            </p>
            <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug text-amber-100/80">
              <span title="Suggerimento multiroom">
                <Info
                  size={13}
                  className="mt-[1px] shrink-0"
                  aria-hidden="true"
                />
              </span>
              <span title="Per il multiroom usa un player leader compatibile come Sonos, Google Cast o Music Assistant.">
                Per usare al meglio il multiroom serve un player leader compatibile (es. Sonos, Google Cast o Music Assistant).
              </span>
            </p>
          </div>
        ) : null}
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.sectionSoft} mb-1`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-[0.18em] text-white/55">Volume</p>
          <div className="flex items-center gap-1.5">
            {supportsVolumeStep ? (
              <>
                <button
                  type="button"
                  disabled={!supportsVolume || !onVolumeChange}
                  onClick={() => stepVolume(-1)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Abbassa volume"
                  title={`-${volumeStepPercent}%`}
                >
                  -
                </button>
                <button
                  type="button"
                  disabled={!supportsVolume || !onVolumeChange}
                  onClick={() => stepVolume(1)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Alza volume"
                  title={`+${volumeStepPercent}%`}
                >
                  +
                </button>
              </>
            ) : null}
            <button
              type="button"
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                muted
                  ? 'bg-white/16 border-white/18 text-white'
                  : 'bg-white/[0.08] border-white/10 text-white/70 hover:bg-white/[0.12]'
              } ${supportsMute ? '' : 'opacity-45 cursor-not-allowed'}`}
              aria-label={muted ? 'Riattiva audio' : 'Silenzia audio'}
              title={muted ? 'Riattiva audio' : 'Silenzia audio'}
              disabled={!supportsMute}
              onClick={() => onToggleMute?.()}
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
        </div>

        <div
          className={`relative w-full h-14 rounded-3xl bg-white/10 backdrop-blur-md border border-white/5 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-10px_18px_rgba(0,0,0,0.24)] ${
            supportsVolume ? '' : 'opacity-55'
          }`}
        >
          <div
            className="absolute inset-y-0 left-0 h-full bg-white/68 shadow-[0_0_18px_rgba(255,255,255,0.16)] transition-[width] duration-200"
            style={{ width: `${safeVolumePercent}%` }}
          />

          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            {muted ? (
              <VolumeX size={18} className="text-white/90 mix-blend-difference" />
            ) : (
              <Volume2 size={18} className="text-white/90 mix-blend-difference" />
            )}
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-sm font-semibold text-white/90 mix-blend-difference">
            {`${safeVolumePercent}%`}
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={safeVolumePercent}
            disabled={!supportsVolume}
            onChange={(event) => {
              if (!supportsVolume) {
                return;
              }
              const nextValue = Math.max(0, Math.min(100, Number(event.target.value)));
              setVolumeDraft(nextValue);
              if (volumeDebounceRef.current !== null) {
                window.clearTimeout(volumeDebounceRef.current);
                volumeDebounceRef.current = null;
              }
              if (!onVolumeChange) {
                return;
              }
              volumeDebounceRef.current = window.setTimeout(() => {
                onVolumeChange(nextValue);
                volumeDebounceRef.current = null;
              }, VOLUME_DEBOUNCE_MS);
            }}
            className="absolute inset-0 z-20 w-full h-full opacity-0 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none [&::-webkit-slider-runnable-track]:appearance-none [&::-moz-range-track]:appearance-none"
            aria-label="Volume uscita audio"
          />
        </div>
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.sectionSoft} mb-1 opacity-55 pointer-events-none`} aria-disabled="true">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SecondaryAction icon={<Cast size={22} />} label="Trasmetti a" disabled />
          <SecondaryAction icon={<Mic size={22} />} label={muted ? 'Muto' : 'Premi per parlare'} disabled />
          <SecondaryAction icon={<Settings2 size={22} />} label="Impostazioni" disabled />
        </div>
      </div>

      <AnimatePresence>
        {multiroomOverlayOpen ? (
          <motion.div
            key="media-multiroom-panel-page"
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-multiroom-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[240] flex flex-col overflow-hidden border-[color:var(--profile-sheet-border)] [background:var(--profile-sheet-page-bg)] text-[color:var(--profile-sheet-text)] shadow-[-24px_0_70px_var(--profile-sheet-shadow)] backdrop-blur-3xl md:left-auto md:w-[clamp(18rem,34vw,24rem)] md:border-l"
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-[color:var(--profile-sheet-border)] px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.9rem)] md:px-5 md:pt-5">
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-title)] shadow-[0_8px_20px_var(--profile-sheet-shadow)] transition-colors hover:bg-[color:var(--profile-sheet-surface-strong)]"
                onClick={() => setMultiroomOverlayOpen(false)}
                aria-label="Torna indietro"
                title="Torna indietro"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0 flex-1">
                <p id="media-multiroom-title" className="truncate text-lg font-semibold tracking-[-0.01em] text-[color:var(--profile-sheet-title)]">
                  Riproduci anche su
                </p>
                <p className="mt-1 truncate text-xs font-medium text-[color:var(--profile-sheet-muted)]">{multiroomSummary}</p>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 glass-scrollbar [touch-action:pan-y] [-webkit-overflow-scrolling:touch] md:px-5">
              <div className="space-y-2">
                {availableMultiroomDevices.map((device) => {
                  const isGrouped = groupedDeviceIds.has(device.id);
                  const DeviceIcon =
                    device.kind === 'tv' ? Tv2 : device.kind === 'cast' ? Cast : Speaker;
                  return (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => toggleMultiroomDevice(device.id, !isGrouped)}
                      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all duration-200 active:scale-[0.98] ${
                        isGrouped
                          ? 'bg-white/15 text-white'
                          : 'text-white/85 hover:bg-white/10'
                      }`}
                      aria-pressed={isGrouped}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <DeviceIcon size={18} className={isGrouped ? 'text-white' : 'text-white/75'} />
                        <span className="truncate text-sm font-medium">{device.name}</span>
                      </span>

                      {isGrouped ? (
                        <Check size={16} className="ml-auto text-white" />
                      ) : (
                        <span className="ml-3 shrink-0 text-xs text-white/45">{device.subtitle ?? 'Disponibile'}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="px-1 pb-[calc(env(safe-area-inset-bottom)+0.3rem)] pt-4 text-[11px] font-medium leading-snug text-[color:var(--profile-sheet-muted)]">
                Seleziona uno o piu dispositivi compatibili. Home Assistant usera il player corrente come leader del gruppo.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export const MediaControls = MediaControlsPanel;
