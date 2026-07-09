import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Battery, DoorOpen, Lock, Unlock } from 'lucide-react';
import { useHoldToConfirm } from '../../hooks/useHoldToConfirm';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';
import { ContextPanelHeader } from './ContextPanelHeader';
import { normalizeLockCardState, translateLockCardState } from '../widgets/lockCardModel';

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
    batteryLevel?: number;
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
const LOCK_FEATURE_OPEN = 1;

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toFiniteNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.trim().replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function resolveBatteryLevel(lock: LockControlsProps['lock']) {
  const candidates = [
    lock.batteryLevel,
    lock.rawAttributes?.battery_level,
    lock.rawAttributes?.battery,
    lock.rawAttributes?.battery_percentage,
    lock.rawAttributes?.battery_percent,
    lock.rawAttributes?.battery_state_of_charge,
  ];

  for (const candidate of candidates) {
    const value = toFiniteNumber(candidate);
    if (value !== undefined) {
      return Math.max(0, Math.min(100, Math.round(value)));
    }
  }

  return undefined;
}

export function LockControls({
  lock,
  onLock,
  onUnlock,
  onOpen,
}: LockControlsProps) {
  const actionCode = lock.lockCode?.trim() || undefined;
  const [simulatedState, setSimulatedState] = useState(normalizeLockCardState(lock.state));
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
    setSimulatedState(normalizeLockCardState(lock.state));
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

  const supportedFeatures = typeof lock.supportedFeatures === 'number'
    ? lock.supportedFeatures
    : typeof lock.rawAttributes?.supported_features === 'number'
      ? lock.rawAttributes.supported_features
      : undefined;
  const supportsOpen = typeof supportedFeatures === 'number' && (supportedFeatures & LOCK_FEATURE_OPEN) !== 0;
  const batteryLevel = resolveBatteryLevel(lock);
  const batteryTone =
    batteryLevel === undefined
      ? 'unknown'
      : batteryLevel <= 20
        ? 'low'
        : batteryLevel <= 45
          ? 'medium'
          : 'good';
  const isLocked = simulatedState === 'locked' || simulatedState === 'locking';
  const isUnlocked = simulatedState === 'unlocked' || simulatedState === 'open' || simulatedState === 'opening';
  const isOpen = simulatedState === 'open' || simulatedState === 'opening';
  const isTransitioning = simulatedState === 'locking' || simulatedState === 'unlocking' || simulatedState === 'opening';
  const isJammed = simulatedState === 'jammed';
  const isUnavailable = simulatedState === 'unavailable' || simulatedState === 'unknown';
  const canLock = isUnlocked && !isTransitioning && !isUnavailable;
  const canUnlock = isLocked && !isTransitioning && !isUnavailable;
  const canOpen = supportsOpen && !isTransitioning && !isJammed && !isUnavailable;
  const statusLabel = translateLockCardState(simulatedState);
  const HeaderIcon = isJammed || isUnavailable ? AlertTriangle : isOpen ? DoorOpen : isLocked ? Lock : Unlock;

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
    enabled: canUnlock,
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
    if (isJammed) return 'border-rose-200/20 bg-rose-500/12';
    if (isTransitioning) return 'border-sky-200/18 bg-sky-500/10';
    if (isLocked) return 'border-emerald-100/16 bg-emerald-300/8';
    return 'border-orange-200/18 bg-orange-500/12';
  }, [isJammed, isLocked, isTransitioning]);
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
      <ContextPanelHeader
        title={lock.name}
        subtitle={statusLabel}
        icon={<HeaderIcon size={21} />}
        fallbackTitle="Serratura"
      />

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
              if (!canUnlock) {
                return;
              }
              event.preventDefault();
              startHold();
            }}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={(event) => {
              if (!canUnlock) {
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
              <HeaderIcon size={36} />
            </div>
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/50">
            {canUnlock
              ? 'Tenere premuto per sbloccare'
              : canLock
                ? 'Serratura pronta al blocco'
                : isJammed
                  ? 'Intervento richiesto'
                  : statusLabel}
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-white/5 bg-white/[0.04] p-1.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (!canLock) {
                return;
              }
              setSimulatedState('locked');
              onLock(actionCode);
              if (shouldUseLocalTimeline) {
                pushTimeline(`${timelineActor} ha bloccato ${formatTimeLabel(new Date())}`);
              }
            }}
            disabled={!canLock}
            className={`flex-1 h-12 rounded-full text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 ${
              canLock
                ? 'bg-white/18 text-white hover:bg-white/24 active:scale-[0.98]'
                : 'bg-white/6 text-white/35 cursor-not-allowed'
            }`}
          >
            <Lock size={16} />
            BLOCCA
          </button>
          <button
            type="button"
            onClick={() => {
              if (!canUnlock) {
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
            disabled={!canUnlock}
            className={`flex-1 h-12 rounded-full text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 ${
              canUnlock
                ? 'bg-red-500/30 border border-red-300/35 text-red-100 hover:bg-red-500/40 active:scale-[0.98]'
                : 'bg-white/6 text-white/35 cursor-not-allowed'
            }`}
          >
            <Unlock size={16} />
            SBLOCCA
          </button>
          {supportsOpen ? (
            <button
              type="button"
              onClick={() => {
                if (!canOpen) {
                  return;
                }
                setSimulatedState('opening');
                onOpen(actionCode);
                if (shouldUseLocalTimeline) {
                  pushTimeline(`${timelineActor} ha aperto lo scrocco ${formatTimeLabel(new Date())}`);
                }
              }}
              disabled={!canOpen}
              className={`flex-1 h-12 rounded-full text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 ${
                canOpen
                  ? 'bg-orange-400/18 border border-orange-200/25 text-orange-50 hover:bg-orange-400/26 active:scale-[0.98]'
                  : 'bg-white/6 text-white/35 cursor-not-allowed'
              }`}
            >
              <DoorOpen size={16} />
              APRI
            </button>
          ) : null}
        </div>

        {batteryLevel !== undefined ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-[1.35rem] border border-white/[0.07] bg-white/[0.045] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <span className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] ${
                  batteryTone === 'low'
                    ? 'border-rose-200/20 bg-rose-500/12 text-rose-100'
                    : batteryTone === 'medium'
                      ? 'border-amber-200/20 bg-amber-400/12 text-amber-100'
                      : 'border-emerald-200/18 bg-emerald-400/10 text-emerald-100'
                }`}
              >
                <Battery size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">Batteria</span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-white/82">Dispositivo</span>
              </span>
            </span>
            <span
              className={`shrink-0 text-lg font-bold tracking-[-0.04em] ${
                batteryTone === 'low'
                  ? 'text-rose-100'
                  : batteryTone === 'medium'
                    ? 'text-amber-100'
                    : 'text-white/92'
              }`}
            >
              {batteryLevel}%
            </span>
          </div>
        ) : null}
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


