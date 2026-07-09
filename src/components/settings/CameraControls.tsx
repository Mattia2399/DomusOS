import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlarmSmoke,
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Camera,
  Expand,
  Mic,
  Pause,
  PersonStanding,
  Play,
  RefreshCw,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  Webcam,
} from 'lucide-react';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';
import { ContextPanelHeader } from './ContextPanelHeader';

export type CameraPtzDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'up_left'
  | 'up_right'
  | 'down_left'
  | 'down_right';

interface CameraControlsProps {
  name: string;
  status?: string;
  entityId?: string;
  streamUrl?: string;
  snapshotUrl?: string;
  isOffline?: boolean;
  rawAttributes?: Record<string, unknown>;
  supportsPtz?: boolean;
  onPtzMove?: (direction: CameraPtzDirection) => void;
  onPtzStop?: () => void;
}

type CameraEventType = 'sound' | 'motion';

interface CameraEvent {
  id: string;
  type: CameraEventType;
  title: string;
  time: string;
  timestampMs?: number;
  clipUrl?: string;
  thumbnailUrl?: string;
}

interface TimelineItem {
  id: string;
  label: string;
  hasClip: boolean;
}

const FALLBACK_TIMELINE_TIMES = ['09:10', '09:20', '09:30', '09:40'];

const FALLBACK_EVENT_LOGS: CameraEvent[] = [
  { id: 'ev-1', type: 'sound', title: 'Sound Detection', time: '12:30:48' },
  { id: 'ev-2', type: 'motion', title: 'Motion Detection', time: '12:25:10' },
  { id: 'ev-3', type: 'sound', title: 'Sound Detection', time: '12:18:02' },
  { id: 'ev-4', type: 'motion', title: 'Motion Detection', time: '11:57:41' },
];

function toTrimmedString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'on', 'yes', 'open', 'online', 'detected'].includes(normalized)) {
      return true;
    }
    if (['false', 'off', 'no', 'closed', 'offline', 'clear', 'idle'].includes(normalized)) {
      return false;
    }
  }
  return undefined;
}

function toTimestampMs(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value > 1e12 ? value : value * 1000);
  }
  if (typeof value === 'string') {
    const parsedDate = Date.parse(value);
    if (Number.isFinite(parsedDate)) {
      return parsedDate;
    }
    const parsedNumeric = Number.parseFloat(value);
    if (Number.isFinite(parsedNumeric)) {
      return Math.round(parsedNumeric > 1e12 ? parsedNumeric : parsedNumeric * 1000);
    }
  }
  return undefined;
}

function formatClockFromTimestamp(timestampMs: number | undefined) {
  if (!timestampMs || Number.isNaN(timestampMs)) {
    return undefined;
  }
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestampMs));
}

function inferEventType(value: unknown): CameraEventType {
  const normalized = toTrimmedString(value)?.toLowerCase() ?? '';
  if (normalized.includes('sound') || normalized.includes('audio') || normalized.includes('noise')) {
    return 'sound';
  }
  return 'motion';
}

function firstStringValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const candidate = toTrimmedString(source[key]);
    if (candidate) {
      return candidate;
    }
  }
  return undefined;
}

function buildLiveEventLogs(rawAttributes: Record<string, unknown> | undefined) {
  const events: CameraEvent[] = [];
  const pushEvent = (event: CameraEvent) => {
    events.push(event);
  };

  const liveEventSources = [rawAttributes?.event_log, rawAttributes?.events, rawAttributes?.history];
  const liveEventArray = liveEventSources.find((value) => Array.isArray(value));

  if (Array.isArray(liveEventArray)) {
    liveEventArray.slice(0, 12).forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return;
      }
      const source = entry as Record<string, unknown>;
      const timestampMs = toTimestampMs(
        source.time ?? source.timestamp ?? source.when ?? source.created_at ?? source.datetime,
      );
      const title =
        firstStringValue(source, ['title', 'name', 'event', 'type']) ??
        'Detection';
      const type = inferEventType(source.type ?? source.event ?? title);
      const clipUrl = firstStringValue(source, [
        'clip_url',
        'video_url',
        'recording_url',
        'playback_url',
        'media_url',
        'clip',
        'url',
      ]);
      const thumbnailUrl = firstStringValue(source, [
        'thumbnail_url',
        'thumbnail',
        'snapshot_url',
        'snapshot',
        'image_url',
        'image',
        'preview_url',
        'preview',
      ]);
      pushEvent({
        id: `history-${index}-${title}`.replace(/\s+/g, '-').toLowerCase(),
        type,
        title,
        timestampMs,
        time: formatClockFromTimestamp(timestampMs) ?? '--:--:--',
        clipUrl,
        thumbnailUrl,
      });
    });
  }

  const motionDetected = toBoolean(rawAttributes?.motion_detected ?? rawAttributes?.motion);
  if (motionDetected) {
    const timestampMs = Date.now();
    pushEvent({
      id: `live-motion-${timestampMs}`,
      type: 'motion',
      title: 'Motion Detection',
      timestampMs,
      time: formatClockFromTimestamp(timestampMs) ?? '--:--:--',
    });
  }
  const soundDetected = toBoolean(rawAttributes?.sound_detected ?? rawAttributes?.audio_detected);
  if (soundDetected) {
    const timestampMs = Date.now();
    pushEvent({
      id: `live-sound-${timestampMs}`,
      type: 'sound',
      title: 'Sound Detection',
      timestampMs,
      time: formatClockFromTimestamp(timestampMs) ?? '--:--:--',
    });
  }

  const lastMotionTimestamp = toTimestampMs(
    rawAttributes?.last_motion_detected ?? rawAttributes?.last_motion ?? rawAttributes?.last_tripped,
  );
  if (lastMotionTimestamp) {
    pushEvent({
      id: `last-motion-${lastMotionTimestamp}`,
      type: 'motion',
      title: 'Last Motion',
      timestampMs: lastMotionTimestamp,
      time: formatClockFromTimestamp(lastMotionTimestamp) ?? '--:--:--',
    });
  }
  const lastSoundTimestamp = toTimestampMs(
    rawAttributes?.last_sound_detected ?? rawAttributes?.last_sound ?? rawAttributes?.last_audio,
  );
  if (lastSoundTimestamp) {
    pushEvent({
      id: `last-sound-${lastSoundTimestamp}`,
      type: 'sound',
      title: 'Last Sound',
      timestampMs: lastSoundTimestamp,
      time: formatClockFromTimestamp(lastSoundTimestamp) ?? '--:--:--',
    });
  }

  const deduped = events.filter((event, index, list) => {
    const firstIndex = list.findIndex(
      (entry) =>
        entry.type === event.type &&
        entry.title === event.title &&
        entry.time === event.time &&
        entry.clipUrl === event.clipUrl &&
        entry.thumbnailUrl === event.thumbnailUrl,
    );
    return firstIndex === index;
  });

  return deduped
    .sort((left, right) => (right.timestampMs ?? 0) - (left.timestampMs ?? 0))
    .slice(0, 10);
}

function appendCacheBuster(url: string, nonce: number) {
  if (!url || nonce <= 0 || url.startsWith('data:')) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_ts=${nonce}`;
}

function sanitizeFileSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function formatSnapshotTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const seconds = `${date.getSeconds()}`.padStart(2, '0');
  return `${year}${month}${day}-${hour}${minutes}${seconds}`;
}

function isLikelyVideoUrl(url: string | undefined) {
  if (!url) {
    return false;
  }
  return /\.(mp4|webm|ogg|m3u8)(?:$|[?#])/i.test(url);
}

function TimelineSelector({
  value,
  items,
  onChange,
}: {
  value: string;
  items: TimelineItem[];
  onChange: (next: string) => void;
}) {
  const dayLabel = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date()),
    [],
  );
  const columnCount = Math.min(4, Math.max(1, items.length));

  return (
    <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
      <p className="text-center text-sm text-gray-300 font-medium">{dayLabel}</p>
      <div
        className="mt-4 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const isActive = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className="rounded-xl py-2 px-1 flex flex-col items-center gap-1 text-center"
              aria-label={`Seleziona orario ${item.label}`}
            >
              <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                {item.label}
              </span>
              <span
                className={`h-1 w-8 rounded-full transition-colors ${
                  isActive ? 'bg-[#3b82f6]' : item.hasClip ? 'bg-cyan-300/55' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EventRow({
  event,
  isActive = false,
  onPlay,
}: {
  event: CameraEvent;
  isActive?: boolean;
  onPlay?: () => void;
}) {
  const isSound = event.type === 'sound';
  const hasClip = Boolean(event.clipUrl || event.thumbnailUrl);
  return (
    <div
      className={`rounded-2xl border p-3 flex items-center gap-4 transition-colors ${
        isActive ? 'bg-white/12 border-blue-300/35' : 'bg-white/5 border-white/10'
      }`}
    >
      <span
        className={`w-11 h-11 rounded-full flex items-center justify-center border ${
          isSound
            ? 'bg-indigo-500/20 border-indigo-400/35 text-indigo-200'
            : 'bg-cyan-500/20 border-cyan-400/35 text-cyan-200'
        }`}
      >
        {isSound ? <Volume2 size={18} /> : <PersonStanding size={18} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">{event.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{event.time}</p>
      </div>
      <button
        type="button"
        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
          hasClip
            ? 'bg-white/10 border-white/15 text-white hover:bg-white/15'
            : 'bg-white/5 border-white/8 text-white/40 cursor-not-allowed'
        }`}
        aria-label={`Riproduci clip ${event.time}`}
        onClick={onPlay}
        disabled={!hasClip}
      >
        <Play size={15} className="ml-0.5" />
      </button>
    </div>
  );
}

function QuickActionButton({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`w-16 h-16 rounded-full border flex items-center justify-center transition-colors ${
        active
          ? 'bg-[#3b82f6] border-[#60a5fa] text-white shadow-[0_10px_24px_rgba(59,130,246,0.35)]'
          : 'bg-white/10 border-white/15 text-white/90 hover:bg-white/15'
      }`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

function PtzJoystick({
  activeDirection,
  onDirectionStart,
  onDirectionStop,
}: {
  activeDirection: CameraPtzDirection | null;
  onDirectionStart: (direction: CameraPtzDirection) => void;
  onDirectionStop: () => void;
}) {
  const bindDirection = (direction: CameraPtzDirection) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onDirectionStart(direction);
    },
    onPointerUp: onDirectionStop,
    onPointerLeave: (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.buttons === 0) {
        onDirectionStop();
      }
    },
    onPointerCancel: onDirectionStop,
    onContextMenu: (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault(),
  });

  const buttonClass = (direction: CameraPtzDirection) =>
    `h-12 w-12 rounded-xl border flex items-center justify-center transition-colors ${
      activeDirection === direction
        ? 'bg-blue-500/28 border-blue-300/40 text-blue-100'
        : 'bg-white/10 border-white/12 text-white hover:bg-white/16'
    }`;

  return (
    <div className="w-full flex items-center justify-center">
      <div className="grid grid-cols-3 gap-2">
        <button type="button" className={buttonClass('up_left')} aria-label="PTZ in alto a sinistra" {...bindDirection('up_left')}>
          <ArrowUpLeft size={16} />
        </button>
        <button type="button" className={buttonClass('up')} aria-label="PTZ in alto" {...bindDirection('up')}>
          <ArrowUp size={16} />
        </button>
        <button type="button" className={buttonClass('up_right')} aria-label="PTZ in alto a destra" {...bindDirection('up_right')}>
          <ArrowUpRight size={16} />
        </button>

        <button type="button" className={buttonClass('left')} aria-label="PTZ a sinistra" {...bindDirection('left')}>
          <ArrowLeft size={16} />
        </button>
        <button
          type="button"
          className="h-12 w-12 rounded-xl border border-white/12 bg-rose-500/16 text-rose-100 hover:bg-rose-500/22 flex items-center justify-center transition-colors"
          aria-label="Ferma movimento PTZ"
          onClick={onDirectionStop}
        >
          <Square size={14} />
        </button>
        <button type="button" className={buttonClass('right')} aria-label="PTZ a destra" {...bindDirection('right')}>
          <ArrowRight size={16} />
        </button>

        <button type="button" className={buttonClass('down_left')} aria-label="PTZ in basso a sinistra" {...bindDirection('down_left')}>
          <ArrowDownLeft size={16} />
        </button>
        <button type="button" className={buttonClass('down')} aria-label="PTZ in basso" {...bindDirection('down')}>
          <ArrowDown size={16} />
        </button>
        <button type="button" className={buttonClass('down_right')} aria-label="PTZ in basso a destra" {...bindDirection('down_right')}>
          <ArrowDownRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function CameraControlsPanel({
  name,
  entityId,
  streamUrl,
  snapshotUrl,
  isOffline = false,
  rawAttributes,
  supportsPtz = false,
  onPtzMove,
  onPtzStop,
}: CameraControlsProps) {
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const clipVideoRef = useRef<HTMLVideoElement | null>(null);
  const refreshResetTimeoutRef = useRef<number | null>(null);
  const [selectedTimelineId, setSelectedTimelineId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isClipMode, setIsClipMode] = useState(false);
  const [streamFailed, setStreamFailed] = useState(false);
  const [clipFailed, setClipFailed] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSnapshotBusy, setIsSnapshotBusy] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [activePtzDirection, setActivePtzDirection] = useState<CameraPtzDirection | null>(null);

  useEffect(() => {
    setStreamFailed(false);
  }, [entityId, snapshotUrl, streamUrl]);

  useEffect(
    () => () => {
      if (refreshResetTimeoutRef.current !== null) {
        window.clearTimeout(refreshResetTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!actionFeedback) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setActionFeedback(null);
    }, 2600);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [actionFeedback]);

  const resolvedStreamUrl = useMemo(() => {
    const url = toTrimmedString(streamUrl);
    return url ? appendCacheBuster(url, refreshNonce) : undefined;
  }, [refreshNonce, streamUrl]);
  const resolvedSnapshotUrl = useMemo(() => {
    const url = toTrimmedString(snapshotUrl);
    return url ? appendCacheBuster(url, refreshNonce) : undefined;
  }, [refreshNonce, snapshotUrl]);
  const cameraProxySnapshotUrl = useMemo(() => {
    const resolvedEntityId = toTrimmedString(entityId);
    if (!resolvedEntityId) {
      return undefined;
    }
    return appendCacheBuster(`/api/camera_proxy/${encodeURIComponent(resolvedEntityId)}`, refreshNonce);
  }, [entityId, refreshNonce]);

  const fallbackVisual = resolvedSnapshotUrl;
  const liveVisualUrl = streamFailed ? fallbackVisual ?? '' : resolvedStreamUrl ?? fallbackVisual ?? '';
  const hasLiveVisual = liveVisualUrl.length > 0;
  const snapshotCaptureUrl = cameraProxySnapshotUrl ?? fallbackVisual ?? (hasLiveVisual ? liveVisualUrl : undefined);
  const subtitle = isOffline ? 'Disconnesso' : 'Connesso';
  const subtitleClass = isOffline ? 'text-rose-200/90' : 'text-emerald-200/90';

  const eventLogs = useMemo(() => {
    const liveEvents = buildLiveEventLogs(rawAttributes);
    return liveEvents.length > 0 ? liveEvents : FALLBACK_EVENT_LOGS;
  }, [rawAttributes]);

  const clipEvents = useMemo(
    () => eventLogs.filter((event) => Boolean(event.clipUrl || event.thumbnailUrl)),
    [eventLogs],
  );

  const timelineItems = useMemo<TimelineItem[]>(() => {
    if (eventLogs.length > 0) {
      return eventLogs.slice(0, 4).map((event) => ({
        id: event.id,
        label: event.time,
        hasClip: Boolean(event.clipUrl || event.thumbnailUrl),
      }));
    }
    return FALLBACK_TIMELINE_TIMES.map((time) => ({
      id: `fallback-${time}`,
      label: time,
      hasClip: false,
    }));
  }, [eventLogs]);

  useEffect(() => {
    if (!timelineItems.length) {
      return;
    }
    const hasCurrent = timelineItems.some((item) => item.id === selectedTimelineId);
    if (!hasCurrent) {
      setSelectedTimelineId(timelineItems[0].id);
    }
  }, [selectedTimelineId, timelineItems]);

  const selectedEvent = useMemo(
    () => eventLogs.find((event) => event.id === selectedTimelineId),
    [eventLogs, selectedTimelineId],
  );
  const selectedClipEvent = useMemo(() => {
    if (selectedEvent && (selectedEvent.clipUrl || selectedEvent.thumbnailUrl)) {
      return selectedEvent;
    }
    return clipEvents[0];
  }, [clipEvents, selectedEvent]);

  useEffect(() => {
    setClipFailed(false);
  }, [refreshNonce, selectedClipEvent?.id]);

  const activeClipUrl = useMemo(() => {
    const candidate = selectedClipEvent?.clipUrl ?? selectedClipEvent?.thumbnailUrl;
    return candidate ? appendCacheBuster(candidate, refreshNonce) : undefined;
  }, [refreshNonce, selectedClipEvent?.clipUrl, selectedClipEvent?.thumbnailUrl]);

  const showClipVisual = isClipMode && Boolean(activeClipUrl) && !clipFailed;
  const activeVisualUrl = showClipVisual ? activeClipUrl ?? '' : liveVisualUrl;
  const hasActiveVisual = activeVisualUrl.length > 0;
  const activeVisualIsVideo = showClipVisual && isLikelyVideoUrl(activeClipUrl);
  const canTakeSnapshot = Boolean(snapshotCaptureUrl) && !isSnapshotBusy;
  const canUsePtz = supportsPtz && typeof onPtzMove === 'function';

  useEffect(() => {
    if (!showClipVisual || !activeVisualIsVideo || !clipVideoRef.current) {
      return;
    }
    if (isPlaying) {
      void clipVideoRef.current.play().catch(() => undefined);
      return;
    }
    clipVideoRef.current.pause();
  }, [activeVisualIsVideo, isPlaying, showClipVisual]);

  const refreshStream = () => {
    setStreamFailed(false);
    setClipFailed(false);
    setRefreshNonce(Date.now());
    setIsRefreshing(true);
    setActionFeedback('Stream aggiornato');
    if (refreshResetTimeoutRef.current !== null) {
      window.clearTimeout(refreshResetTimeoutRef.current);
    }
    refreshResetTimeoutRef.current = window.setTimeout(() => {
      setIsRefreshing(false);
      refreshResetTimeoutRef.current = null;
    }, 800);
  };

  const toggleFullscreen = async () => {
    const target = previewContainerRef.current;
    if (!target) {
      return;
    }
    const anyTarget = target as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };
    const anyDocument = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
      msExitFullscreen?: () => Promise<void> | void;
    };
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (anyDocument.webkitExitFullscreen) {
          await anyDocument.webkitExitFullscreen();
        } else if (anyDocument.msExitFullscreen) {
          await anyDocument.msExitFullscreen();
        }
        return;
      }
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if (anyTarget.webkitRequestFullscreen) {
        await anyTarget.webkitRequestFullscreen();
      } else if (anyTarget.msRequestFullscreen) {
        await anyTarget.msRequestFullscreen();
      }
    } catch {
      setActionFeedback('Fullscreen non disponibile');
    }
  };

  const captureSnapshot = async () => {
    if (!snapshotCaptureUrl || isSnapshotBusy) {
      setActionFeedback('Snapshot non disponibile');
      return;
    }
    setIsSnapshotBusy(true);
    try {
      const response = await fetch(snapshotCaptureUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const safeName = sanitizeFileSegment(name || entityId || 'camera') || 'camera';
      const extension = blob.type.includes('png') ? 'png' : 'jpg';
      const fileName = `${safeName}-${formatSnapshotTimestamp()}.${extension}`;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 800);
      setActionFeedback(`Snapshot salvata (${fileName})`);
    } catch {
      setActionFeedback('Errore durante lo snapshot');
    } finally {
      setIsSnapshotBusy(false);
    }
  };

  const handleTimelineChange = (timelineId: string) => {
    setSelectedTimelineId(timelineId);
    const event = eventLogs.find((entry) => entry.id === timelineId);
    if (!event) {
      return;
    }
    if (event.clipUrl || event.thumbnailUrl) {
      setIsClipMode(true);
      setIsPlaying(true);
      setClipFailed(false);
      return;
    }
    setActionFeedback('Nessuna clip disponibile per questo evento');
  };

  const navigateClips = (step: -1 | 1) => {
    if (!clipEvents.length) {
      setActionFeedback('Nessuna clip disponibile');
      return;
    }
    const currentIndex = clipEvents.findIndex((entry) => entry.id === selectedClipEvent?.id);
    const baseIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (baseIndex + step + clipEvents.length) % clipEvents.length;
    const nextClip = clipEvents[nextIndex];
    setSelectedTimelineId(nextClip.id);
    setIsClipMode(true);
    setIsPlaying(true);
    setClipFailed(false);
  };

  const toggleClipPlayback = () => {
    if (!clipEvents.length) {
      setActionFeedback('Nessuna clip disponibile');
      return;
    }
    if (!isClipMode) {
      setIsClipMode(true);
      setIsPlaying(true);
      setClipFailed(false);
      return;
    }
    setIsPlaying((value) => !value);
  };

  const startPtz = (direction: CameraPtzDirection) => {
    if (!canUsePtz || !onPtzMove) {
      return;
    }
    setActivePtzDirection(direction);
    onPtzMove(direction);
  };

  const stopPtz = () => {
    if (activePtzDirection === null) {
      return;
    }
    setActivePtzDirection(null);
    onPtzStop?.();
  };

  useEffect(
    () => () => {
      if (activePtzDirection !== null) {
        onPtzStop?.();
      }
    },
    [activePtzDirection, onPtzStop],
  );

  return (
    <div className={CONTEXT_PANEL_LAYOUT.shell}>
      <ContextPanelHeader
        title={name}
        subtitle={subtitle}
        icon={<Webcam size={22} />}
        fallbackTitle="Videocamera"
        subtitleClassName={subtitleClass}
      />

      <div className={`${CONTEXT_PANEL_LAYOUT.sectionCompact} mb-1`}>
        <div
          ref={previewContainerRef}
          className="relative aspect-video rounded-3xl overflow-hidden bg-black/40 border border-white/10"
        >
          {hasActiveVisual ? (
            activeVisualIsVideo ? (
              <video
                ref={clipVideoRef}
                src={activeVisualUrl}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                onError={() => {
                  setClipFailed(true);
                  setActionFeedback('Clip non riproducibile, ritorno al live');
                }}
              />
            ) : (
              <img
                src={activeVisualUrl}
                alt={name || 'Camera stream'}
                className="absolute inset-0 h-full w-full object-cover"
                onError={() => {
                  if (showClipVisual) {
                    setClipFailed(true);
                    setActionFeedback('Clip non disponibile, ritorno al live');
                    return;
                  }
                  if (!streamFailed && fallbackVisual && activeVisualUrl !== fallbackVisual) {
                    setStreamFailed(true);
                  }
                }}
              />
            )
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(59,130,246,0.28),transparent_62%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs text-gray-400">Live stream non disponibile</p>
              </div>
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/45" aria-hidden="true" />

          {showClipVisual ? (
            <div className="absolute top-3 right-3 z-20 inline-flex items-center gap-2">
              <span className="rounded-full border border-cyan-300/35 bg-cyan-500/20 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-cyan-100">
                CLIP
              </span>
              <button
                type="button"
                className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/90 hover:bg-black/55"
                onClick={() => {
                  setIsClipMode(false);
                  setIsPlaying(false);
                }}
              >
                LIVE
              </button>
            </div>
          ) : null}

          <div className="absolute left-4 bottom-4">
            <div className="liquid-glass-card flex items-center gap-1.5 rounded-full px-2 py-1.5">
              <button
                type="button"
                className={`w-8 h-8 rounded-full border text-white flex items-center justify-center transition-colors ${
                  clipEvents.length > 0
                    ? 'bg-white/10 border-white/10 hover:bg-white/15'
                    : 'bg-white/6 border-white/8 opacity-45 cursor-not-allowed'
                }`}
                aria-label="Clip precedente"
                onClick={() => navigateClips(-1)}
                disabled={clipEvents.length === 0}
              >
                <SkipBack size={14} />
              </button>
              <button
                type="button"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  clipEvents.length > 0 ? 'border-[#0A84FF]/40 bg-[#0A84FF]/18 text-blue-50 shadow-[0_0_18px_rgba(10,132,255,0.28)] hover:bg-[#0A84FF]/26' : 'bg-white/20 text-white/60'
                }`}
                onClick={toggleClipPlayback}
                aria-label={isClipMode && isPlaying ? 'Pausa clip' : 'Riproduci clip'}
                disabled={clipEvents.length === 0}
              >
                {isClipMode && isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
              </button>
              <button
                type="button"
                className={`w-8 h-8 rounded-full border text-white flex items-center justify-center transition-colors ${
                  clipEvents.length > 0
                    ? 'bg-white/10 border-white/10 hover:bg-white/15'
                    : 'bg-white/6 border-white/8 opacity-45 cursor-not-allowed'
                }`}
                aria-label="Clip successiva"
                onClick={() => navigateClips(1)}
                disabled={clipEvents.length === 0}
              >
                <SkipForward size={14} />
              </button>
            </div>
          </div>

          <div className="absolute right-4 bottom-4">
            <div className="liquid-glass-card flex items-center gap-1.5 rounded-full px-2 py-1.5">
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center hover:bg-white/15 transition-colors"
                aria-label="Aggiorna stream"
                title="Aggiorna stream"
                onClick={refreshStream}
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                className={`w-8 h-8 rounded-full border text-white flex items-center justify-center transition-colors ${
                  canTakeSnapshot
                    ? 'bg-white/10 border-white/10 hover:bg-white/15'
                    : 'bg-white/6 border-white/8 opacity-45 cursor-not-allowed'
                }`}
                aria-label="Scatta foto"
                title="Scatta foto"
                onClick={captureSnapshot}
                disabled={!canTakeSnapshot}
              >
                <Camera size={14} />
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center hover:bg-white/15 transition-colors"
                aria-label="Schermo intero"
                title="Schermo intero"
                onClick={() => {
                  void toggleFullscreen();
                }}
              >
                <Expand size={14} />
              </button>
            </div>
          </div>
        </div>
        {actionFeedback ? <p className="mt-2 px-1 text-[11px] text-white/60">{actionFeedback}</p> : null}
      </div>

      {canUsePtz ? (
        <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-white/55">PTZ Joystick</p>
            <span className="text-[10px] uppercase tracking-[0.16em] rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-white/70">
              Hold to move
            </span>
          </div>
          <PtzJoystick
            activeDirection={activePtzDirection}
            onDirectionStart={startPtz}
            onDirectionStop={stopPtz}
          />
        </div>
      ) : null}

      <div className="mb-1">
        <TimelineSelector value={selectedTimelineId} items={timelineItems} onChange={handleTimelineChange} />
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.sectionCompact} mb-1`}>
        <div className="space-y-3">
          {eventLogs.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              isActive={event.id === selectedTimelineId}
              onPlay={() => handleTimelineChange(event.id)}
            />
          ))}
        </div>
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <QuickActionButton icon={<Mic size={22} />} label="Push to talk" active />
          <QuickActionButton icon={<AlarmSmoke size={22} />} label="Siren" />
        </div>
      </div>
    </div>
  );
}

export const CameraControls = CameraControlsPanel;
