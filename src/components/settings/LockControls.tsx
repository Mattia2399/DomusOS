import React, { useEffect, useMemo, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { useHoldToConfirm } from '../../hooks/useHoldToConfirm';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';

type LockControlsProps = {
  lock: {
    name: string;
    state: string;
    status?: string;
    changedBy?: string;
    activityLogLimit?: number;
    activityLogHours?: number;
    activityTimeline?: Array<{
      id: string;
      text: string;
    }>;
    activityTimelineStatus?: 'idle' | 'loading' | 'available' | 'empty' | 'unavailable' | 'offline';
    supportedFeatures?: number;
    rawAttributes?: Record<string, unknown>;
    lockCode?: string;
  };
  onLock: (code?: string) => void;
  onUnlock: (code?: string) => boolean | void;
  onOpen: (code?: string) => void;
};

type TimelineEntry = {
  id: string;
  text: string;
};

const RING_RADIUS = 57;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function normalizeLockState(value: string | undefined) {
  const normalized = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalized) {
    return 'unknown';
  }
  if (normalized === 'opening') {
    return 'unlocking';
  }
  if (normalized === 'closing') {
    return 'locking';
  }
  return normalized;
}

function translateLockState(state: string) {
  if (state === 'locked') {
    return 'Bloccata';
  }
  if (state === 'unlocked') {
    return 'Sbloccata';
  }
  if (state === 'locking') {
    return 'Blocco...';
  }
  if (state === 'unlocking') {
    return 'Sblocco...';
  }
  if (state === 'jammed') {
    return 'Inceppata';
  }
  if (state === 'open') {
    return 'Aperta';
  }
  if (state === 'unavailable') {
    return 'Non disponibile';
  }
  return 'Sconosciuta';
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LockControls({
  lock,
  onLock,
  onUnlock,
  onOpen,
}: LockControlsProps) {
  void onOpen;
  const actionCode = lock.lockCode?.trim() || undefined;
  const [simulatedState, setSimulatedState] = useState(normalizeLockState(lock.state));
  const maxTimelineEntries = useMemo(() => {
    const parsed = Number(lock.activityLogLimit);
    if (!Number.isFinite(parsed)) {
      return 6;
    }
    return Math.max(1, Math.min(30, Math.round(parsed)));
  }, [lock.activityLogLimit]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>(() => (lock.activityTimeline ?? []).slice(0, maxTimelineEntries));
  const timelineActor = lock.changedBy?.trim() || 'Sistema';
  const shouldUseLocalTimeline = !lock.activityTimelineStatus || lock.activityTimelineStatus === 'offline';

  useEffect(() => {
    setSimulatedState(normalizeLockState(lock.state));
  }, [lock.name, lock.state]);

  useEffect(() => {
    const incoming = (lock.activityTimeline ?? []).slice(0, maxTimelineEntries);
    setTimeline((previous) => {
      if (!shouldUseLocalTimeline) {
        return incoming;
      }
      return incoming.length > 0 ? incoming : previous;
    });
  }, [lock.activityTimeline, maxTimelineEntries, shouldUseLocalTimeline]);

  useEffect(() => {
    setTimeline((lock.activityTimeline ?? []).slice(0, maxTimelineEntries));
  }, [lock.name, lock.activityTimeline, lock.activityTimelineStatus, maxTimelineEntries]);

  const isLocked = simulatedState === 'locked' || simulatedState === 'locking';
  const statusLabel = translateLockState(simulatedState);

  const pushTimeline = (text: string) => {
    setTimeline((prev) => [
      {
        id: `activity-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
        text,
      },
      ...prev,
    ].slice(0, maxTimelineEntries));
  };

  const {
    progress,
    isHolding,
    isSuccessPulse,
    startHold,
    endHold,
  } = useHoldToConfirm({
    enabled: isLocked,
    durationMs: 1000,
    onComplete: () => {
      const didUnlock = onUnlock(actionCode);
      if (didUnlock === false) {
        return;
      }
      setSimulatedState('unlocked');
      if (shouldUseLocalTimeline) {
        pushTimeline(`${timelineActor} ha sbloccato ${formatTimeLabel(new Date())}`);
      }
    },
  });

  const ringDashOffset = RING_CIRCUMFERENCE * (1 - progress);

  const panelAuraClass = useMemo(() => {
    if (isLocked) {
      return 'bg-white/5';
    }
    return 'bg-red-950/30';
  }, [isLocked]);
  const activityUnavailableMessage = useMemo(() => {
    const historyHours = Math.max(1, Math.round(Number(lock.activityLogHours) || 24));
    if (lock.activityTimelineStatus === 'loading') {
      return 'Caricamento attività reali da Home Assistant...';
    }
    if (lock.activityTimelineStatus === 'empty') {
      return `Nessuna attività reale trovata nelle ultime ${historyHours} ore.`;
    }
    if (lock.activityTimelineStatus === 'unavailable') {
      return 'Attività reale non disponibile: il logbook di Home Assistant non ha risposto.';
    }
    if (lock.activityTimelineStatus === 'offline') {
      return 'Connetti Home Assistant per vedere attività reali della serratura.';
    }
    return 'Nessuna attività reale disponibile per questa serratura.';
  }, [lock.activityLogHours, lock.activityTimelineStatus]);

  return (
    <div className={CONTEXT_PANEL_LAYOUT.shell}>
      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full border border-white/15 bg-white/10 flex items-center justify-center text-white">
            {isLocked ? <Lock size={21} /> : <Unlock size={21} />}
          </div>
          <div className="min-w-0">
            <h3 className="text-[1.2rem] font-semibold tracking-tight text-white truncate">
              {lock.name || 'Serratura'}
            </h3>
            <p className="mt-1 text-sm text-white/60">Stato: {statusLabel}</p>
          </div>
        </div>
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="mt-6 flex flex-col items-center">
          <div
            className={`relative h-[clamp(8rem,42vw,10rem)] w-[clamp(8rem,42vw,10rem)] rounded-full border border-white/10 ${panelAuraClass} backdrop-blur-xl flex items-center justify-center transition-all duration-200 ${
              isHolding ? 'scale-[1.03]' : 'scale-100'
            } ${
              isSuccessPulse
                ? 'shadow-[0_0_0_1px_rgba(74,222,128,0.85),0_0_34px_rgba(74,222,128,0.44)]'
                : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
            }`}
            onMouseDown={(event) => {
              if (!isLocked) {
                return;
              }
              event.preventDefault();
              startHold();
            }}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={(event) => {
              if (!isLocked) {
                return;
              }
              event.preventDefault();
              startHold();
            }}
            onTouchEnd={endHold}
            onTouchCancel={endHold}
            onContextMenu={(event) => event.preventDefault()}
          >
            <svg
              className={`absolute inset-0 transition-opacity duration-150 ${progress > 0 || isHolding ? 'opacity-100' : 'opacity-0'}`}
              viewBox="0 0 150 150"
              fill="none"
            >
              <circle cx="75" cy="75" r={RING_RADIUS} stroke="rgba(255,255,255,0.16)" strokeWidth="6" />
              <circle
                cx="75"
                cy="75"
                r={RING_RADIUS}
                stroke="rgba(255,255,255,0.95)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringDashOffset}
                transform="rotate(-90 75 75)"
                style={{ transition: isHolding ? 'none' : 'stroke-dashoffset 110ms linear' }}
              />
            </svg>
            <div className="h-[clamp(4.6rem,24vw,6rem)] w-[clamp(4.6rem,24vw,6rem)] rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white">
              {isLocked ? <Lock size={36} /> : <Unlock size={36} />}
            </div>
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/50">Tenere premuto per sbloccare</p>
        </div>

        <div className="mt-6 rounded-3xl border border-white/5 bg-white/[0.04] p-1.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (isLocked) {
                return;
              }
              setSimulatedState('locked');
              onLock(actionCode);
              if (shouldUseLocalTimeline) {
                pushTimeline(`${timelineActor} ha bloccato ${formatTimeLabel(new Date())}`);
              }
            }}
            disabled={isLocked}
            className={`flex-1 h-12 rounded-full text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 ${
              isLocked
                ? 'bg-white/6 text-white/35 cursor-not-allowed'
                : 'bg-white/18 text-white hover:bg-white/24 active:scale-[0.98]'
            }`}
          >
            <Lock size={16} />
            BLOCCA
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isLocked) {
                return;
              }
              const didUnlock = onUnlock(actionCode);
              if (didUnlock === false) {
                return;
              }
              setSimulatedState('unlocked');
              if (shouldUseLocalTimeline) {
                pushTimeline(`${timelineActor} ha sbloccato ${formatTimeLabel(new Date())}`);
              }
            }}
            disabled={!isLocked}
            className={`flex-1 h-12 rounded-full text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 ${
              isLocked
                ? 'bg-red-500/30 border border-red-300/35 text-red-100 hover:bg-red-500/40 active:scale-[0.98]'
                : 'bg-white/6 text-white/35 cursor-not-allowed'
            }`}
          >
            <Unlock size={16} />
            SBLOCCA
          </button>
        </div>
      </div>

      <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-white/55">ATTIVITÀ RECENTE</p>
        <div className="mt-3 space-y-2.5">
          {timeline.length > 0 ? (
            timeline.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-white/7 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/78"
              >
                {entry.text}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/7 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/58">
              {activityUnavailableMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


