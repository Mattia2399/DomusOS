import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Cast,
  Check,
  Info,
  Mic,
  Pause,
  Play,
  Repeat,
  Settings2,
  Shuffle,
  SkipBack,
  SkipForward,
  Speaker,
  Tv2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';

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
  supportsNextTrack?: boolean;
  supportsPreviousTrack?: boolean;
  supportsPower?: boolean;
  supportsShuffle?: boolean;
  supportsRepeat?: boolean;
  supportsSelectSource?: boolean;
  supportsGrouping?: boolean;
  shuffleEnabled?: boolean;
  repeatMode?: MediaRepeatMode;
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

type MediaSourceKind =
  | 'spotify'
  | 'youtube_music'
  | 'youtube'
  | 'apple_music'
  | 'tidal'
  | 'deezer'
  | 'amazon_music'
  | 'soundcloud'
  | 'generic';

function toTrimmedString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function inferMediaSourceKind(value: string | undefined): MediaSourceKind | null {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized.includes('spotify')) {
    return 'spotify';
  }
  if (
    normalized.includes('youtube music') ||
    normalized.includes('yt music') ||
    normalized.includes('ytmusic')
  ) {
    return 'youtube_music';
  }
  if (normalized.includes('youtube')) {
    return 'youtube';
  }
  if (normalized.includes('apple music')) {
    return 'apple_music';
  }
  if (normalized.includes('tidal')) {
    return 'tidal';
  }
  if (normalized.includes('deezer')) {
    return 'deezer';
  }
  if (normalized.includes('amazon music')) {
    return 'amazon_music';
  }
  if (normalized.includes('soundcloud')) {
    return 'soundcloud';
  }
  return 'generic';
}

function sourceKindLabel(kind: MediaSourceKind, fallback?: string) {
  if (kind === 'spotify') {
    return 'Spotify';
  }
  if (kind === 'youtube_music') {
    return 'YouTube Music';
  }
  if (kind === 'youtube') {
    return 'YouTube';
  }
  if (kind === 'apple_music') {
    return 'Apple Music';
  }
  if (kind === 'tidal') {
    return 'TIDAL';
  }
  if (kind === 'deezer') {
    return 'Deezer';
  }
  if (kind === 'amazon_music') {
    return 'Amazon Music';
  }
  if (kind === 'soundcloud') {
    return 'SoundCloud';
  }
  return fallback ?? 'Sorgente';
}

function sourceKindBadge(kind: MediaSourceKind, label: string) {
  if (kind === 'spotify') {
    return 'S';
  }
  if (kind === 'youtube_music') {
    return 'YM';
  }
  if (kind === 'youtube') {
    return 'YT';
  }
  if (kind === 'apple_music') {
    return 'A';
  }
  if (kind === 'tidal') {
    return 'T';
  }
  if (kind === 'deezer') {
    return 'D';
  }
  if (kind === 'amazon_music') {
    return 'AM';
  }
  if (kind === 'soundcloud') {
    return 'SC';
  }
  const first = label.trim().charAt(0).toUpperCase();
  return first || 'M';
}

function sourceKindBadgeClass(kind: MediaSourceKind) {
  if (kind === 'spotify') {
    return 'bg-[#1DB954] text-black';
  }
  if (kind === 'youtube_music') {
    return 'bg-[#ff0033] text-white';
  }
  if (kind === 'youtube') {
    return 'bg-[#ff0000] text-white';
  }
  if (kind === 'apple_music') {
    return 'bg-[#fa233b] text-white';
  }
  if (kind === 'tidal') {
    return 'bg-white text-black';
  }
  if (kind === 'deezer') {
    return 'bg-[#8c30ff] text-white';
  }
  if (kind === 'amazon_music') {
    return 'bg-[#00a8e1] text-white';
  }
  if (kind === 'soundcloud') {
    return 'bg-[#ff7700] text-white';
  }
  return 'bg-white/20 text-white';
}

function parseSpotifyUrl(value: string | undefined) {
  const raw = toTrimmedString(value);
  if (!raw) {
    return undefined;
  }
  if (raw.startsWith('https://open.spotify.com/') || raw.startsWith('http://open.spotify.com/')) {
    return raw;
  }
  if (!raw.startsWith('spotify:')) {
    return undefined;
  }
  const parts = raw.split(':').filter((entry) => entry.trim().length > 0);
  if (parts.length < 3) {
    return 'https://open.spotify.com/';
  }
  const resource = parts[1];
  const id = parts[2];
  if (!resource || !id) {
    return 'https://open.spotify.com/';
  }
  return `https://open.spotify.com/${encodeURIComponent(resource)}/${encodeURIComponent(id)}`;
}

function parseYoutubeMusicUrl(value: string | undefined) {
  const raw = toTrimmedString(value);
  if (!raw) {
    return undefined;
  }
  if (
    raw.startsWith('https://music.youtube.com/') ||
    raw.startsWith('http://music.youtube.com/')
  ) {
    return raw;
  }
  if (raw.startsWith('https://www.youtube.com/') || raw.startsWith('http://www.youtube.com/')) {
    return raw;
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    return `https://music.youtube.com/watch?v=${raw}`;
  }
  if (raw.includes('watch?v=')) {
    return raw.startsWith('http') ? raw : `https://music.youtube.com/${raw.replace(/^\/+/, '')}`;
  }
  return undefined;
}

function parseHttpUrl(value: string | undefined) {
  const raw = toTrimmedString(value);
  if (!raw) {
    return undefined;
  }
  if (raw.startsWith('https://') || raw.startsWith('http://')) {
    return raw;
  }
  return undefined;
}

function resolveMediaSourceMeta(rawAttributes: Record<string, unknown> | undefined) {
  const sourceCandidates = [
    toTrimmedString(rawAttributes?.app_name),
    toTrimmedString(rawAttributes?.source),
    toTrimmedString(rawAttributes?.media_channel),
    toTrimmedString(rawAttributes?.source_name),
    toTrimmedString(rawAttributes?.application_name),
    toTrimmedString(rawAttributes?.app_id),
  ].filter((entry): entry is string => Boolean(entry));

  const firstCandidate = sourceCandidates[0];
  const inferredKind =
    sourceCandidates.map((entry) => inferMediaSourceKind(entry)).find((entry): entry is MediaSourceKind => entry !== null) ??
    'generic';
  const sourceLabel = sourceKindLabel(inferredKind, firstCandidate);

  const directUrlCandidates = [
    toTrimmedString(rawAttributes?.app_url),
    toTrimmedString(rawAttributes?.source_url),
    toTrimmedString(rawAttributes?.media_content_url),
    toTrimmedString(rawAttributes?.url),
    toTrimmedString(rawAttributes?.link),
    toTrimmedString(rawAttributes?.website),
  ];
  const mediaContentId = toTrimmedString(rawAttributes?.media_content_id);
  const directHttpUrl =
    directUrlCandidates
      .map((candidate) => parseHttpUrl(candidate))
      .find((candidate): candidate is string => Boolean(candidate)) ??
    parseHttpUrl(mediaContentId);

  let sourceAppUrl = directHttpUrl;
  if (!sourceAppUrl && inferredKind === 'spotify') {
    sourceAppUrl = parseSpotifyUrl(mediaContentId) ?? 'https://open.spotify.com/';
  }
  if (!sourceAppUrl && inferredKind === 'youtube_music') {
    sourceAppUrl = parseYoutubeMusicUrl(mediaContentId) ?? 'https://music.youtube.com/';
  }
  if (!sourceAppUrl && inferredKind === 'youtube') {
    sourceAppUrl = parseYoutubeMusicUrl(mediaContentId) ?? 'https://www.youtube.com/';
  }
  if (!sourceAppUrl && inferredKind === 'apple_music') {
    sourceAppUrl = 'https://music.apple.com/';
  }
  if (!sourceAppUrl && inferredKind === 'tidal') {
    sourceAppUrl = 'https://listen.tidal.com/';
  }
  if (!sourceAppUrl && inferredKind === 'deezer') {
    sourceAppUrl = 'https://www.deezer.com/';
  }
  if (!sourceAppUrl && inferredKind === 'amazon_music') {
    sourceAppUrl = 'https://music.amazon.com/';
  }
  if (!sourceAppUrl && inferredKind === 'soundcloud') {
    sourceAppUrl = 'https://soundcloud.com/';
  }

  return {
    sourceKind: inferredKind,
    sourceLabel,
    sourceBadge: sourceKindBadge(inferredKind, sourceLabel),
    sourceBadgeClass: sourceKindBadgeClass(inferredKind),
    sourceAppUrl,
  };
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
  name = 'Speaker',
  status = 'Connected',
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
  supportsNextTrack = true,
  supportsPreviousTrack = true,
  supportsShuffle = true,
  supportsRepeat = true,
  supportsSelectSource = true,
  supportsGrouping = true,
  shuffleEnabled = false,
  repeatMode = 'off',
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
  const availableOutputDevices = outputDevices ?? [];
  const availableMultiroomDevices = multiroomDevices ?? [];
  const [localOutputDeviceId, setLocalOutputDeviceId] = useState(
    selectedOutputDeviceIdProp ?? availableOutputDevices[0]?.id ?? '',
  );
  const [localGroupedDeviceIds, setLocalGroupedDeviceIds] = useState<string[]>([]);
  const selectedOutputDeviceId = selectedOutputDeviceIdProp ?? localOutputDeviceId;
  const resolvedShuffleEnabled = Boolean(shuffleEnabled);
  const resolvedRepeatMode: MediaRepeatMode = repeatMode === 'one' || repeatMode === 'all' ? repeatMode : 'off';
  const repeatButtonLabel =
    resolvedRepeatMode === 'one'
      ? 'Repeat: uno'
      : resolvedRepeatMode === 'all'
        ? 'Repeat: tutti'
        : 'Repeat: off';
  const safeVolumePercent = Math.max(0, Math.min(100, volumeDraft));
  const elapsed = useMemo(() => formatTimeFromSeconds(livePosition), [livePosition]);
  const total = useMemo(() => formatTimeFromProgress(100, safeDuration), [safeDuration]);
  const resolvedTrackTitle = trackTitle.trim() || 'Nessun brano in riproduzione';
  const resolvedTrackArtist = trackArtist.trim() || 'Nessun artista';
  const albumArt = coverUrl && coverUrl.trim().length > 0 ? coverUrl : DEFAULT_ALBUM_ART;
  const sourceMeta = useMemo(() => resolveMediaSourceMeta(rawAttributes), [rawAttributes]);
  const canOpenSourceApp = Boolean(sourceMeta.sourceAppUrl);

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

  return (
    <div className={CONTEXT_PANEL_LAYOUT.shell}>
      <div className={`${CONTEXT_PANEL_LAYOUT.sectionSoft} mb-1`}>
        <div className="flex items-center gap-4 min-w-0 pr-11">
            <span className="w-14 h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
              <Speaker size={22} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[1.3rem] font-medium text-white truncate">{name}</h2>
              <p className="mt-0.5 text-sm text-white/60 truncate">{status}</p>
            </div>
        </div>
      </div>

      <div className={`relative overflow-hidden ${CONTEXT_PANEL_LAYOUT.sectionSoft} mb-1`}>
        <div
          className="absolute inset-0 z-0 bg-center bg-cover blur-3xl opacity-30 scale-110 transform"
          style={{ backgroundImage: `url(${albumArt})` }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center ${sourceMeta.sourceBadgeClass}`}
              >
                {sourceMeta.sourceBadge}
              </span>
              <span className="text-sm text-white font-medium truncate">{sourceMeta.sourceLabel}</span>
            </div>
            <a
              href={sourceMeta.sourceAppUrl ?? '#'}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                if (!sourceMeta.sourceAppUrl) {
                  event.preventDefault();
                }
              }}
              className={`text-[10px] tracking-wider uppercase rounded-full px-3 py-1 border transition-colors ${
                canOpenSourceApp
                  ? 'bg-white/10 text-gray-200 border-white/10 hover:bg-white/15'
                  : 'bg-white/5 text-gray-400 border-white/5 cursor-not-allowed'
              }`}
              aria-disabled={!canOpenSourceApp}
              title={canOpenSourceApp ? `Apri ${sourceMeta.sourceLabel}` : 'Sorgente non disponibile'}
            >
              Open App
            </a>
          </div>

          <img
            src={albumArt}
            alt="Album art"
            className="w-full aspect-square object-cover rounded-2xl shadow-2xl shadow-black/50"
          />

          <div className="mt-4 text-center">
            <p className="text-white text-lg font-medium">{resolvedTrackTitle}</p>
            <p className="text-gray-400 text-sm font-light mt-1">{resolvedTrackArtist}</p>
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
                  ? 'bg-blue-500/25 border-blue-300/45 text-blue-100'
                  : 'bg-white/10 border-white/10'
              } ${supportsShuffle ? 'hover:bg-white/15' : 'opacity-45 cursor-not-allowed'}`}
              disabled={!supportsShuffle}
              aria-label="Shuffle"
              title={resolvedShuffleEnabled ? 'Shuffle attivo' : 'Shuffle disattivo'}
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
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#0A84FF]/45 bg-[#0A84FF]/20 text-blue-50 shadow-[0_0_22px_rgba(10,132,255,0.35)] backdrop-blur-xl transition-colors hover:bg-[#0A84FF]/28"
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
                  ? 'bg-blue-500/25 border-blue-300/45 text-blue-100'
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
          </div>
        </div>
      </div>

      <div className="w-full rounded-[clamp(1.15rem,4vw,1.8rem)] bg-white/5 backdrop-blur-xl border border-white/5 p-2 sm:p-3 mb-1">
        <p className="text-[10px] text-white/40 font-semibold tracking-wider uppercase px-3 pb-2 pt-1">
          Output Device
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

      <div className="w-full rounded-[clamp(1.15rem,4vw,1.8rem)] bg-white/5 backdrop-blur-xl border border-white/5 p-2 sm:p-3 mb-1">
        <p className="text-[10px] text-white/40 font-semibold tracking-wider uppercase px-3 pb-2 pt-1">
          Multiroom Group
        </p>

        {!supportsGrouping ? (
          <div className="mb-2 rounded-xl border border-amber-200/25 bg-amber-400/10 px-3 py-2.5">
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

        {availableMultiroomDevices.length > 0 ? (
          <div className="space-y-1.5">
            {availableMultiroomDevices.map((device) => {
              const isGrouped =
                device.grouped === true || localGroupedDeviceIds.includes(device.id);
              const DeviceIcon =
                device.kind === 'tv' ? Tv2 : device.kind === 'cast' ? Cast : Speaker;
              return (
                <button
                  key={device.id}
                  type="button"
                  disabled={!supportsGrouping}
                  onClick={() => {
                    if (!supportsGrouping) {
                      return;
                    }
                    const shouldJoin = !isGrouped;
                    if (onToggleMultiroomDevice) {
                      onToggleMultiroomDevice(device.id, shouldJoin);
                      return;
                    }
                    setLocalGroupedDeviceIds((current) => {
                      if (shouldJoin) {
                        return current.includes(device.id) ? current : [...current, device.id];
                      }
                      return current.filter((entry) => entry !== device.id);
                    });
                  }}
                  className={`flex items-center justify-between w-full rounded-2xl py-3 px-4 transition-all duration-200 active:scale-[0.98] ${
                    !supportsGrouping
                      ? 'opacity-45 cursor-not-allowed text-white/65'
                      : isGrouped
                        ? 'bg-blue-500/20 border border-blue-300/30 text-blue-100 cursor-pointer'
                        : 'text-white/85 hover:bg-white/10 cursor-pointer'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <DeviceIcon
                      size={18}
                      className={isGrouped ? 'text-blue-100' : 'text-white/75'}
                    />
                    <span className="text-sm font-medium truncate">{device.name}</span>
                  </span>

                  {isGrouped ? (
                    <Check size={16} className="ml-auto text-blue-100" />
                  ) : (
                    <span className="text-xs text-white/45 ml-3 shrink-0">{device.subtitle ?? ''}</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="px-3 py-3 text-sm text-white/55">
            Nessun player disponibile per il gruppo.
          </p>
        )}
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.sectionSoft} mb-1`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-[0.18em] text-white/55">Volume</p>
          <button
            type="button"
            className={`text-[11px] uppercase tracking-[0.16em] rounded-full border px-2.5 py-1 transition-colors ${
              muted
                ? 'bg-blue-500/20 border-blue-300/40 text-blue-100'
                : 'bg-white/[0.08] border-white/10 text-white/70 hover:bg-white/[0.12]'
            } ${supportsMute ? '' : 'opacity-45 cursor-not-allowed'}`}
            aria-label="Mute audio"
            disabled={!supportsMute}
            onClick={() => onToggleMute?.()}
          >
            {muted ? 'Muted' : 'Mute'}
          </button>
        </div>

        <div
          className={`relative w-full h-14 rounded-3xl bg-white/10 backdrop-blur-md border border-white/5 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-10px_18px_rgba(0,0,0,0.24)] ${
            supportsVolume ? '' : 'opacity-55'
          }`}
        >
          <div
            className="absolute inset-y-0 left-0 h-full bg-[#0A84FF]/70 shadow-[0_0_18px_rgba(10,132,255,0.32)] transition-[width] duration-200"
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
            aria-label="Volume output"
          />
        </div>
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.sectionSoft} mb-1 opacity-55 pointer-events-none`} aria-disabled="true">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SecondaryAction icon={<Cast size={22} />} label="Cast To" disabled />
          <SecondaryAction icon={<Mic size={22} />} label={muted ? 'Muted' : 'Push to talk'} disabled />
          <SecondaryAction icon={<Settings2 size={22} />} label="Settings" disabled />
        </div>
      </div>
    </div>
  );
}

export const MediaControls = MediaControlsPanel;
