import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Cast,
  Check,
  Mic,
  Pause,
  Play,
  Power,
  Settings2,
  SkipBack,
  SkipForward,
  Star,
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
  outputDevices?: MediaOutputDevice[];
  selectedOutputDeviceId?: string;
  onTogglePlayback: () => void;
  onTogglePower?: () => void;
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
  onSeek?: (position: number) => void;
  onVolumeChange?: (value: number) => void;
  onToggleMute?: () => void;
  onSelectOutputDevice?: (deviceId: string) => void;
}

const DEFAULT_ALBUM_ART =
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop';
const FALLBACK_OUTPUT_DEVICES: MediaOutputDevice[] = [
  { id: 'output_living_room', name: 'Living Room Speaker', subtitle: 'Wi-Fi', kind: 'speaker' },
  { id: 'output_homepod_mini', name: 'HomePod mini', subtitle: 'AirPlay', kind: 'speaker' },
  { id: 'output_tv', name: 'LG Living TV', subtitle: 'HDMI ARC', kind: 'tv' },
  { id: 'output_chromecast', name: 'Chromecast Audio', subtitle: 'Cast', kind: 'cast' },
];

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

function SecondaryAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="h-12 w-12 min-[420px]:h-14 min-[420px]:w-14 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 flex items-center justify-center hover:bg-white/15 transition-colors"
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
  supportsPower = true,
  outputDevices,
  selectedOutputDeviceId: selectedOutputDeviceIdProp,
  onTogglePlayback,
  onTogglePower,
  onPreviousTrack,
  onNextTrack,
  onVolumeChange,
  onToggleMute,
  onSelectOutputDevice,
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
  const availableOutputDevices = outputDevices && outputDevices.length > 0 ? outputDevices : FALLBACK_OUTPUT_DEVICES;
  const [localOutputDeviceId, setLocalOutputDeviceId] = useState(
    selectedOutputDeviceIdProp ?? availableOutputDevices[0]?.id ?? '',
  );
  const selectedOutputDeviceId = selectedOutputDeviceIdProp ?? localOutputDeviceId;
  const safeVolumePercent = Math.max(0, Math.min(100, volumeDraft));
  const elapsed = useMemo(() => formatTimeFromSeconds(livePosition), [livePosition]);
  const total = useMemo(() => formatTimeFromProgress(100, safeDuration), [safeDuration]);
  const resolvedTrackTitle = trackTitle.trim() || 'Nessun brano in riproduzione';
  const resolvedTrackArtist = trackArtist.trim() || 'Nessun artista';
  const statusWithTime = `${status} - ${elapsed} / ${total}`;
  const albumArt = coverUrl && coverUrl.trim().length > 0 ? coverUrl : DEFAULT_ALBUM_ART;

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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="w-14 h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
              <Speaker size={22} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[1.3rem] font-medium text-white truncate">{name}</h2>
              <p className="text-sm text-gray-400 font-light truncate">{statusWithTime}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onTogglePower?.()}
            disabled={!supportsPower}
            className={`w-14 h-14 rounded-full border flex items-center justify-center transition-colors ${
              supportsPower
                ? 'bg-white/90 border-white text-slate-900'
                : 'bg-white/10 border-white/10 text-white/45 cursor-not-allowed'
            }`}
            aria-label="Power speaker"
          >
            <Power size={20} />
          </button>
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
              <span className="w-8 h-8 rounded-full bg-[#1DB954] text-black text-xs font-bold flex items-center justify-center">
                S
              </span>
              <span className="text-sm text-white font-medium">Spotify</span>
            </div>
            <span className="text-[10px] tracking-wider uppercase bg-white/10 rounded-full px-3 py-1 text-gray-200 border border-white/10">
              Open App
            </span>
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

          <div className="mt-4 rounded-full bg-black/20 backdrop-blur-md border border-white/5 p-2 flex items-center justify-between gap-3">
            <div className="flex-1" />
            <div className="flex items-center gap-3">
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
                className="w-11 h-11 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-white/90 transition-colors"
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
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1 text-xs text-white/80">
                <Volume2 size={14} />
                {`${volumeDraft}%`}
              </span>
              <button
                type="button"
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                  muted
                    ? 'bg-blue-500/25 border-blue-300/40 text-blue-100'
                    : 'bg-white/10 border-white/10 text-white/90 hover:bg-white/15'
                } ${supportsMute ? '' : 'opacity-45 cursor-not-allowed'}`}
                aria-label="Mute audio"
                disabled={!supportsMute}
                onClick={() => onToggleMute?.()}
              >
                <Star size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full rounded-[clamp(1.15rem,4vw,1.8rem)] bg-white/5 backdrop-blur-xl border border-white/5 p-2 sm:p-3 mb-1">
        <p className="text-[10px] text-white/40 font-semibold tracking-wider uppercase px-3 pb-2 pt-1">
          Speakers & TVs
        </p>

        <div className="space-y-1.5">
          {availableOutputDevices.map((device) => {
            const isSelected = device.id === selectedOutputDeviceId;
            const DeviceIcon =
              device.kind === 'tv' ? Tv2 : device.kind === 'cast' ? Cast : Speaker;
            return (
              <button
                key={device.id}
                type="button"
                onClick={() => {
                  if (onSelectOutputDevice) {
                    onSelectOutputDevice(device.id);
                    return;
                  }
                  setLocalOutputDeviceId(device.id);
                }}
                className={`flex items-center justify-between w-full rounded-2xl py-3 px-4 cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                  isSelected
                    ? 'bg-white/15 text-white'
                    : 'text-white/85 hover:bg-white/10'
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
            className="absolute inset-y-0 left-0 h-full bg-white/95 transition-[width] duration-200"
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

      <div className={`${CONTEXT_PANEL_LAYOUT.sectionSoft} mb-1`}>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SecondaryAction icon={<Cast size={22} />} label="Cast To" />
          <SecondaryAction icon={<Mic size={22} />} label={muted ? 'Muted' : 'Push to talk'} />
          <SecondaryAction icon={<Settings2 size={22} />} label="Settings" />
        </div>
      </div>
    </div>
  );
}

export const MediaControls = MediaControlsPanel;
