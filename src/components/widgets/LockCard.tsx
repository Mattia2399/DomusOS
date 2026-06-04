import React, { useEffect, useRef, useState } from 'react';
import { Battery, ChevronRight, Lock, Unlock } from 'lucide-react';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { useHoldToConfirm } from '../../hooks/useHoldToConfirm';
import { getWidgetLogicalSize } from './cardLayout';
import { type CardVariant } from './cardVariant';
import { type GridEngineBreakpoint } from '../dashboard/dashboardBreakpointConfig';

type LockCardProps = {
  widget: Widget;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  onToggleLock?: () => boolean | void;
  onOpenDoor?: () => void;
  liveEntity?: MockEntityState;
  gridBreakpoint?: GridEngineBreakpoint;
  variant?: CardVariant;
};

type LockVariant = 'statusChip' | 'statusTile' | 'actionPill' | 'controlCard' | 'detailControl';

const SLIDE_UNLOCK_THRESHOLD = 0.82;
const SLIDE_KNOB_INSET_PX = 5;
const LOCK_PENDING_ATTRIBUTE_KEY = '__dashboard_pending_lock';
const HOLD_RING_RADIUS = 46;
const HOLD_RING_CIRCUMFERENCE = 2 * Math.PI * HOLD_RING_RADIUS;

type LockPendingAction = 'lock' | 'unlock' | 'open';

function toFiniteNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) {
      return undefined;
    }
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function resolveLockBatteryLevel(rawAttributes: Record<string, unknown> | undefined) {
  if (!rawAttributes) {
    return undefined;
  }
  const candidates = [
    rawAttributes.battery_level,
    rawAttributes.battery,
    rawAttributes.battery_percentage,
    rawAttributes.battery_percent,
  ];
  for (const candidate of candidates) {
    const value = toFiniteNumber(candidate);
    if (value !== undefined) {
      return Math.max(0, Math.min(100, Math.round(value)));
    }
  }
  return undefined;
}

function normalizeLockState(value: string | undefined) {
  const normalized = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalized) {
    return 'unknown';
  }
  if (normalized === 'locked' || normalized === 'closed' || normalized === 'bloccata' || normalized === 'bloccato' || normalized === 'chiusa' || normalized === 'chiuso') {
    return 'locked';
  }
  if (normalized === 'unlocked' || normalized === 'sbloccata' || normalized === 'sbloccato') {
    return 'unlocked';
  }
  if (normalized === 'open' || normalized === 'opened' || normalized === 'aperta' || normalized === 'aperto') {
    return 'open';
  }
  if (normalized === 'opening') {
    return 'unlocking';
  }
  if (normalized === 'closing') {
    return 'locking';
  }
  if (normalized.includes('sblocc')) {
    return normalized.includes('in_corso') ? 'unlocking' : 'unlocked';
  }
  if (normalized.includes('apert')) {
    return normalized.includes('in_corso') || normalized.includes('ing') ? 'unlocking' : 'open';
  }
  if (normalized.includes('chiusur') || normalized.includes('in_chius')) {
    return 'locking';
  }
  if (normalized.includes('blocc')) {
    return normalized.includes('in_corso') ? 'locking' : 'locked';
  }
  return normalized;
}

function resolveLockStatusLabel(state: string) {
  if (state === 'locked') {
    return 'Bloccata';
  }
  if (state === 'unlocked' || state === 'open') {
    return 'Sbloccata';
  }
  if (state === 'locking') {
    return 'Blocco in corso';
  }
  if (state === 'unlocking') {
    return 'Sblocco in corso';
  }
  return 'Stato sconosciuto';
}

function resolvePendingLockAction(value: unknown): LockPendingAction | undefined {
  if (value === 'lock' || value === 'unlock' || value === 'open') {
    return value;
  }
  return undefined;
}

function resolvePendingStatusLabel(action: LockPendingAction) {
  if (action === 'lock') {
    return 'Blocco in corso';
  }
  if (action === 'open') {
    return 'Apertura in corso';
  }
  return 'Sblocco in corso';
}

function resolvePendingVisualState(action: LockPendingAction) {
  if (action === 'lock') {
    return 'locked';
  }
  if (action === 'open') {
    return 'open';
  }
  return 'unlocked';
}

function resolveSliderGlyphSize(knobSizePx: number) {
  return Math.max(10, Math.min(16, Math.round(knobSizePx * 0.38)));
}

function resolveLockVariant(
  _widthUnits: number,
  _heightUnits: number,
  gridBreakpoint?: GridEngineBreakpoint,
): LockVariant {
  if (gridBreakpoint === 'xs' || gridBreakpoint === 'sm') {
    return 'actionPill';
  }
  return 'statusTile';
}

function getVariantRadiusClass(lockVariant: LockVariant) {
  if (lockVariant === 'actionPill') {
    return 'rounded-[1.55rem]';
  }
  if (lockVariant === 'statusChip') {
    return 'rounded-[1.45rem]';
  }
  return 'rounded-[1.85rem]';
}

export function LockCard({
  widget,
  isSelected,
  isEditMode,
  onClick,
  onToggleLock,
  onOpenDoor: _onOpenDoor,
  liveEntity,
  gridBreakpoint,
}: LockCardProps) {
  void _onOpenDoor;

  const pendingLockAction = resolvePendingLockAction(liveEntity?.rawAttributes?.[LOCK_PENDING_ATTRIBUTE_KEY]);
  const lockStateFromEntity = normalizeLockState(
    (pendingLockAction ? resolvePendingVisualState(pendingLockAction) : undefined) ??
      liveEntity?.state ??
      liveEntity?.stateLabel ??
      widget.status,
  );
  const [simulatedState, setSimulatedState] = useState(lockStateFromEntity);
  const [slideProgress, setSlideProgress] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [sweepTick, setSweepTick] = useState(0);
  const [isSweepActive, setIsSweepActive] = useState(false);
  const slideTrackRef = useRef<HTMLDivElement | null>(null);
  const slidePointerIdRef = useRef<number | null>(null);
  const sweepTimerRef = useRef<number | null>(null);
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    setSimulatedState(lockStateFromEntity);
  }, [lockStateFromEntity, widget.id]);

  const logicalSize = getWidgetLogicalSize(widget);
  const widthUnits = Math.max(1, Math.round(logicalSize.widthUnits));
  const heightUnits = Math.max(1, Math.round(logicalSize.heightUnits));
  const lockVariant = resolveLockVariant(widthUnits, heightUnits, gridBreakpoint);
  const isPendingAction = pendingLockAction !== undefined;
  const isLocked = simulatedState === 'locked' || simulatedState === 'locking';
  const isUnlocked = simulatedState === 'unlocked' || simulatedState === 'open';
  const isTransitioning = simulatedState === 'locking' || simulatedState === 'unlocking' || isPendingAction;
  const canUnlock = !isEditMode && isLocked && !isTransitioning;
  const canLock = !isEditMode && isUnlocked && !isTransitioning;
  const canSlideUnlock = canUnlock && lockVariant === 'actionPill';
  const canHoldConfirm = canUnlock && !canSlideUnlock && lockVariant === 'statusTile';
  const statusLabel = pendingLockAction
    ? resolvePendingStatusLabel(pendingLockAction)
    : resolveLockStatusLabel(simulatedState);
  const radiusClass = getVariantRadiusClass(lockVariant);
  const lockArea = widthUnits * heightUnits;
  const statusTileIconShellSize = lockArea >= 8 ? 74 : lockArea >= 6 ? 66 : lockArea >= 4 ? 58 : lockArea >= 2 ? 50 : 46;
  const statusTileIconSize = lockArea >= 8 ? 30 : lockArea >= 6 ? 27 : lockArea >= 4 ? 24 : lockArea >= 2 ? 20 : 18;
  const isLargeStatusTile = lockVariant === 'statusTile' && lockArea >= 6;
  const isLargeControl = lockVariant === 'detailControl';
  const iconShellSize =
    lockVariant === 'statusChip'
      ? 34
      : lockVariant === 'actionPill'
        ? 34
        : lockVariant === 'statusTile'
          ? statusTileIconShellSize
          : isLargeControl
            ? 78
            : 64;
  const iconSize =
    lockVariant === 'statusChip'
      ? 16
      : lockVariant === 'actionPill'
        ? 16
        : lockVariant === 'statusTile'
          ? statusTileIconSize
          : isLargeControl
            ? 30
            : 25;
  const toneTokens = isPendingAction
    ? {
        frameClass: 'border-white/20',
        overlay: 'radial-gradient(88% 65% at 50% 0%, rgba(255,220,196,0.14), transparent 70%)',
        iconRing: 'rgba(255,220,196,0.42)',
        iconHalo: '0 0 0 3px rgba(255,220,196,0.12)',
        actionClass: 'border-white/26 bg-white/12 text-white/92 hover:bg-white/18',
        trail: 'linear-gradient(90deg, rgba(255,220,196,0.02), rgba(255,220,196,0.24), rgba(255,255,255,0.06))',
        sweep: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,220,196,0.68), rgba(255,255,255,0))',
      }
    : {
        frameClass: 'border-white/12',
        overlay: 'radial-gradient(88% 65% at 50% 0%, rgba(255,210,178,0.12), transparent 70%)',
        iconRing: 'rgba(255,220,196,0.34)',
        iconHalo: '0 0 0 3px rgba(255,220,196,0.08)',
        actionClass: 'border-white/22 bg-white/[0.09] text-white/88 hover:bg-white/[0.14]',
        trail: 'linear-gradient(90deg, rgba(255,220,196,0.02), rgba(255,220,196,0.2), rgba(255,255,255,0.05))',
        sweep: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,220,196,0.62), rgba(255,255,255,0))',
      };
  const surfaceBackground = isUnlocked
    ? 'rgba(127, 29, 29, 0.56)'
    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)';
  const surfaceAuraShadow = '0 16px 34px rgba(17,10,9,0.44), inset 0 1px 0 rgba(255,255,255,0.07)';
  const surfaceOverlayBackground = 'transparent';
  const iconSurfaceBackground = 'linear-gradient(162deg, rgba(142,94,82,0.42), rgba(109,73,65,0.44))';
  const iconSurfaceBorderColor = 'rgba(255,220,196,0.26)';
  const iconSurfaceShadow = '0 8px 18px rgba(38,20,18,0.36), inset 0 1px 0 rgba(255,255,255,0.08)';
  const iconHaloShadow = toneTokens.iconHalo;
  const slideTrailBackground = toneTokens.trail;
  const slideSweepBackground = toneTokens.sweep;

  const {
    progress,
    isHolding,
    isSuccessPulse,
    startHold,
    endHold,
    forceReset,
  } = useHoldToConfirm({
    enabled: canHoldConfirm,
    durationMs: 1050,
    onComplete: () => {
      const didStartAction = onToggleLock?.();
      if (didStartAction === false) {
        suppressNextClickRef.current = true;
        return;
      }
      setSimulatedState('unlocked');
      suppressNextClickRef.current = true;
    },
  });

  const holdProgress = Math.max(0, Math.min(1, progress));
  const showHoldProgress = canHoldConfirm && (isHolding || holdProgress > 0 || isSuccessPulse);
  const lockBatteryLevel = resolveLockBatteryLevel(liveEntity?.rawAttributes);
  const showBatteryGlyph = lockBatteryLevel !== undefined;
  const primaryHint = isPendingAction
    ? statusLabel
    : canUnlock
      ? canSlideUnlock
        ? 'Trascina per sbloccare'
        : 'Tenere premuto per sbloccare'
      : canLock
        ? 'Tocca per bloccare'
        : statusLabel;
  const controlSliderKnobSizePx = isLargeControl ? 40 : 34;
  const actionSliderGlyphSize = resolveSliderGlyphSize(iconShellSize);
  const controlSliderGlyphSize = resolveSliderGlyphSize(controlSliderKnobSizePx);
  const actionPillTextLeft = `calc(${SLIDE_KNOB_INSET_PX}px + ${iconShellSize}px + 0.55rem)`;
  const controlSliderCanDrag = false;

  useEffect(
    () => () => {
      if (sweepTimerRef.current !== null) {
        window.clearTimeout(sweepTimerRef.current);
        sweepTimerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    if (!canSlideUnlock) {
      setIsSliding(false);
      slidePointerIdRef.current = null;
    }
    setSlideProgress(isUnlocked ? 1 : 0);
  }, [canSlideUnlock, isUnlocked]);

  const lockDoor = () => {
    if (!canLock) {
      return;
    }
    setSimulatedState('locked');
    onToggleLock?.();
  };

  const resolveSlideProgress = (clientX: number, knobSizePx: number) => {
    const track = slideTrackRef.current;
    if (!track) {
      return 0;
    }
    const rect = track.getBoundingClientRect();
    const knobRadius = knobSizePx / 2;
    const start = rect.left + SLIDE_KNOB_INSET_PX + knobRadius;
    const end = rect.right - SLIDE_KNOB_INSET_PX - knobRadius;
    const travel = Math.max(1, end - start);
    return Math.max(0, Math.min(1, (clientX - start) / travel));
  };

  const commitSlideUnlock = () => {
    setSlideProgress(1);
    setIsSliding(false);
    slidePointerIdRef.current = null;
    setIsSweepActive(false);
    setSweepTick((current) => current + 1);
    setIsSweepActive(true);
    if (sweepTimerRef.current !== null) {
      window.clearTimeout(sweepTimerRef.current);
    }
    sweepTimerRef.current = window.setTimeout(() => {
      setIsSweepActive(false);
      sweepTimerRef.current = null;
    }, 420);
    const didStartAction = onToggleLock?.();
    if (didStartAction === false) {
      setSlideProgress(0);
      setSimulatedState('locked');
      suppressNextClickRef.current = true;
      return;
    }
    setSimulatedState('unlocked');
    suppressNextClickRef.current = true;
  };

  const endSlide = (commit: boolean) => {
    const shouldUnlock = slideProgress >= SLIDE_UNLOCK_THRESHOLD;
    setIsSliding(false);
    slidePointerIdRef.current = null;
    if (commit && canSlideUnlock && shouldUnlock) {
      commitSlideUnlock();
      return;
    }
    setSlideProgress(isUnlocked ? 1 : 0);
  };

  const handleSurfaceClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isEditMode) {
      return;
    }
    event.stopPropagation();
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    onClick();
  };

  const renderIcon = (extraClassName = '', withHoldRing = false) => (
    <div
      className={`relative shrink-0 rounded-full text-white ${extraClassName}`}
      style={{
        width: `${iconShellSize}px`,
        height: `${iconShellSize}px`,
        background: iconSurfaceBackground,
        border: `1px solid ${iconSurfaceBorderColor}`,
        boxShadow: `${iconSurfaceShadow}, ${iconHaloShadow}`,
      }}
    >
      {withHoldRing ? (
        <span
          className={`pointer-events-none absolute -inset-[8px] transition-opacity duration-150 ${
            showHoldProgress ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        >
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={HOLD_RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r={HOLD_RING_RADIUS}
              fill="none"
              stroke={isSuccessPulse ? 'rgba(74,222,128,0.92)' : 'rgba(255,220,196,0.94)'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={HOLD_RING_CIRCUMFERENCE}
              strokeDashoffset={HOLD_RING_CIRCUMFERENCE * (1 - holdProgress)}
              style={{
                transition: isHolding ? 'none' : 'stroke-dashoffset 140ms ease, stroke 180ms ease',
              }}
            />
          </svg>
        </span>
      ) : null}
      {isPendingAction ? (
        <span className="pointer-events-none absolute -inset-[5px] rounded-full bg-sky-300/14 blur-[5px]" />
      ) : null}
      <span
        className="pointer-events-none absolute inset-[3px] rounded-full"
        style={{ border: `1px solid ${toneTokens.iconRing}` }}
      />
      <div className="flex h-full w-full items-center justify-center">
        {isLocked ? <Lock size={iconSize} /> : <Unlock size={iconSize} />}
      </div>
    </div>
  );

  const renderStatusChip = () => (
    <div className="relative flex h-full w-full min-w-0 flex-col items-center justify-center gap-1.5 px-2 py-2 text-center">
      {renderIcon()}
      <p className="max-w-full truncate text-[clamp(0.48rem,10cqi,0.62rem)] font-semibold leading-none text-white/92">
        {widget.title}
      </p>
    </div>
  );

  const renderStatusTile = () => {
    const renderStatusTileIcon = (withHoldRing: boolean) => {
      const iconNode = renderIcon('', withHoldRing);
      if (!canLock) {
        return iconNode;
      }
      return (
        <button
          type="button"
          className="relative inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/55"
          onClick={(event) => {
            event.stopPropagation();
            lockDoor();
          }}
          aria-label={`Blocca ${widget.title}`}
        >
          {iconNode}
        </button>
      );
    };

    return (
      <div className="relative grid h-full w-full min-w-0 grid-rows-[auto_1fr_auto] justify-items-center gap-[clamp(0.18rem,1.35cqi,0.38rem)] overflow-hidden px-[clamp(0.58rem,4cqi,0.98rem)] py-[clamp(0.62rem,4.2cqi,1rem)] text-center">
        <p
          className={`max-w-full truncate font-semibold leading-tight text-white/95 ${
            isLargeStatusTile ? 'text-[clamp(0.74rem,4.8cqi,0.98rem)]' : 'text-[clamp(0.6rem,6cqi,0.82rem)]'
          }`}
        >
          {widget.title}
        </p>
        <div className="flex min-h-0 w-full items-center justify-center py-[clamp(0.08rem,1.4cqi,0.22rem)]">
          {renderStatusTileIcon(canHoldConfirm)}
        </div>
        <div className="flex min-h-0 w-full flex-col items-center justify-end gap-[clamp(0.18rem,1.2cqi,0.32rem)] pb-[clamp(0.02rem,0.35cqi,0.08rem)]">
          <p
            className={`max-w-full whitespace-normal px-[clamp(0.08rem,1cqi,0.2rem)] leading-tight font-medium tracking-[0.02em] text-white/68 ${
              isLargeStatusTile ? 'text-[clamp(0.5rem,2.9cqi,0.66rem)]' : 'text-[clamp(0.4rem,3.6cqi,0.54rem)]'
            }`}
          >
            {canHoldConfirm
              ? 'Tieni premuto per aprire'
              : canLock
                ? 'Tocca il lucchetto per bloccare'
                : isPendingAction
                  ? 'Aggiornamento stato'
                  : statusLabel}
          </p>
        </div>
      </div>
    );
  };

  const renderActionPill = () => (
    <div
      ref={slideTrackRef}
      role="button"
      tabIndex={isEditMode ? -1 : 0}
      className={`relative h-full w-full min-w-0 overflow-hidden rounded-[inherit] px-2 py-2 ${
        canSlideUnlock ? 'cursor-ew-resize' : isPendingAction ? 'cursor-progress' : 'cursor-pointer'
      }`}
      style={{ touchAction: 'none' }}
      onClick={(event) => {
        event.stopPropagation();
        if (canLock) {
          lockDoor();
          return;
        }
        onClick();
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (!canSlideUnlock) {
          return;
        }
        if (event.pointerType === 'mouse' && event.button !== 0) {
          return;
        }
        event.preventDefault();
        slidePointerIdRef.current = event.pointerId;
        setIsSliding(true);
        setSlideProgress(resolveSlideProgress(event.clientX, iconShellSize));
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Some browsers may not support pointer capture here.
        }
      }}
      onPointerMove={(event) => {
        if (!isSliding || slidePointerIdRef.current !== event.pointerId) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        setSlideProgress(resolveSlideProgress(event.clientX, iconShellSize));
      }}
      onPointerUp={(event) => {
        if (slidePointerIdRef.current !== event.pointerId) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // no-op
        }
        endSlide(true);
      }}
      onPointerCancel={(event) => {
        if (slidePointerIdRef.current !== event.pointerId) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        endSlide(false);
      }}
      onLostPointerCapture={(event) => {
        if (slidePointerIdRef.current !== event.pointerId) {
          return;
        }
        endSlide(false);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (canLock) {
          lockDoor();
        }
      }}
      aria-label={
        isPendingAction
          ? `${statusLabel} ${widget.title}`
          : isLocked
            ? `Trascina per sbloccare ${widget.title}`
            : `Blocca ${widget.title}`
      }
    >
      {isSweepActive ? (
        <div key={sweepTick} className="pointer-events-none absolute inset-[2px] overflow-hidden rounded-full">
          <div
            className="absolute inset-y-0 -left-1/2 w-[45%] rounded-full blur-[2px] animate-[lock-sweep_420ms_cubic-bezier(0.2,0.62,0.22,1)_forwards]"
            style={{ background: slideSweepBackground }}
          />
        </div>
      ) : null}
      <div
        className="pointer-events-none absolute top-1/2 h-[0.8rem] -translate-y-1/2 rounded-full blur-[1px]"
        style={{
          background: slideTrailBackground,
          left: `${SLIDE_KNOB_INSET_PX + 2}px`,
          width: `calc((100% - ${iconShellSize}px - ${SLIDE_KNOB_INSET_PX * 2 + 4}px) * ${slideProgress} + 8px)`,
          opacity: canSlideUnlock ? Math.min(0.82, Math.max(0, slideProgress * 1.1)) : 0.2,
          transition: isSliding ? 'none' : 'width 180ms ease, opacity 180ms ease',
        }}
      />
      <div
        className="absolute top-1/2 rounded-full text-white"
        style={{
          width: `${iconShellSize}px`,
          height: `${iconShellSize}px`,
          left: `calc(${SLIDE_KNOB_INSET_PX}px + ((100% - ${iconShellSize}px - ${SLIDE_KNOB_INSET_PX * 2}px) * ${slideProgress}))`,
          transform: 'translateY(-50%)',
          background: iconSurfaceBackground,
          border: `1px solid ${iconSurfaceBorderColor}`,
          boxShadow: `${iconSurfaceShadow}, ${iconHaloShadow}`,
          transition: isSliding ? 'none' : 'left 190ms ease',
        }}
      >
        <div className="flex h-full w-full items-center justify-center">
          {isLocked ? <Lock size={actionSliderGlyphSize} /> : <Unlock size={actionSliderGlyphSize} />}
        </div>
      </div>
      <div
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
        style={{
          left: actionPillTextLeft,
          opacity: canSlideUnlock ? Math.max(0, 1 - slideProgress * 1.35) : 1,
          transition: isSliding ? 'none' : 'opacity 140ms ease',
        }}
      >
        <p className="truncate text-[clamp(0.52rem,4.4cqi,0.7rem)] font-semibold leading-tight text-white/94">
          {widget.title}
        </p>
        <div className="mt-[1px] flex min-w-0 items-center gap-1">
          <span className="min-w-0 truncate text-[clamp(0.42rem,3.8cqi,0.56rem)] font-semibold tracking-[0.02em] text-white/72">
            {isPendingAction ? 'Attendi conferma' : isLocked ? 'Trascina per sbloccare' : 'Tocca per bloccare'}
          </span>
          {isLocked ? (
            <span className="inline-flex shrink-0 items-center">
              <ChevronRight size={9} className="text-white/50" />
              <ChevronRight size={9} className="-ml-0.5 text-white/65" />
              <ChevronRight size={9} className="-ml-0.5 text-white/80" />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderControlCard = () => (
    <div className="relative flex h-full w-full min-w-0 flex-col rounded-[inherit] px-[clamp(0.55rem,3.8cqi,0.9rem)] py-[clamp(0.55rem,3.8cqi,0.9rem)]">
      <div className="flex min-w-0 items-center justify-between gap-2 px-[clamp(0.2rem,1.4cqi,0.35rem)]">
        <p className="truncate text-[clamp(0.72rem,5.8cqi,1.02rem)] font-semibold leading-tight text-white/94">
          {widget.title}
        </p>
        {showBatteryGlyph ? (
          <span
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/[0.08] text-white/86"
            style={{
              width: isLargeControl ? 'clamp(1.55rem, 10.5cqi, 2rem)' : 'clamp(1.42rem, 10cqi, 1.82rem)',
              height: isLargeControl ? 'clamp(1.55rem, 10.5cqi, 2rem)' : 'clamp(1.42rem, 10cqi, 1.82rem)',
            }}
            aria-label={`Batteria ${lockBatteryLevel}%`}
            title={`Batteria ${lockBatteryLevel}%`}
          >
            <Battery size={isLargeControl ? 14 : 12} />
          </span>
        ) : null}
      </div>

      <div
        ref={slideTrackRef}
        role="button"
        tabIndex={isEditMode ? -1 : 0}
        className={`mt-auto relative h-[clamp(2.4rem,18cqi,3.35rem)] overflow-hidden rounded-[clamp(0.9rem,5.8cqi,1.35rem)] border border-white/14 bg-white/[0.12] ${
          controlSliderCanDrag ? 'cursor-ew-resize' : canLock ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={{ touchAction: 'none' }}
        onClick={(event) => {
          event.stopPropagation();
          if (canLock) {
            lockDoor();
          }
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          if (!controlSliderCanDrag) {
            return;
          }
          if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
          }
          event.preventDefault();
          slidePointerIdRef.current = event.pointerId;
          setIsSliding(true);
          setSlideProgress(resolveSlideProgress(event.clientX, controlSliderKnobSizePx));
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // Some browsers may not support pointer capture here.
          }
        }}
        onPointerMove={(event) => {
          if (!isSliding || slidePointerIdRef.current !== event.pointerId) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          setSlideProgress(resolveSlideProgress(event.clientX, controlSliderKnobSizePx));
        }}
        onPointerUp={(event) => {
          if (slidePointerIdRef.current !== event.pointerId) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          try {
            event.currentTarget.releasePointerCapture(event.pointerId);
          } catch {
            // no-op
          }
          endSlide(true);
        }}
        onPointerCancel={(event) => {
          if (slidePointerIdRef.current !== event.pointerId) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          endSlide(false);
        }}
        onLostPointerCapture={(event) => {
          if (slidePointerIdRef.current !== event.pointerId) {
            return;
          }
          endSlide(false);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          if (canLock) {
            lockDoor();
          }
        }}
        aria-label={isLocked ? `Trascina per sbloccare ${widget.title}` : `Blocca ${widget.title}`}
      >
        {isSweepActive ? (
          <div key={`${sweepTick}-control`} className="pointer-events-none absolute inset-[2px] overflow-hidden rounded-[inherit]">
            <div
              className="absolute inset-y-0 -left-1/2 w-[45%] rounded-full blur-[2px] animate-[lock-sweep_420ms_cubic-bezier(0.2,0.62,0.22,1)_forwards]"
              style={{ background: slideSweepBackground }}
            />
          </div>
        ) : null}
        <div
          className="pointer-events-none absolute top-1/2 h-[clamp(0.45rem,3.2cqi,0.72rem)] -translate-y-1/2 rounded-full blur-[1px]"
          style={{
            background: slideTrailBackground,
            left: `${SLIDE_KNOB_INSET_PX + 2}px`,
            width: `calc((100% - ${controlSliderKnobSizePx}px - ${SLIDE_KNOB_INSET_PX * 2 + 4}px) * ${slideProgress} + 8px)`,
            opacity: controlSliderCanDrag ? Math.min(0.82, Math.max(0, slideProgress * 1.1)) : 0.25,
            transition: isSliding ? 'none' : 'width 180ms ease, opacity 180ms ease',
          }}
        />
        <div
          className="absolute top-1/2 rounded-full text-black/80"
          style={{
            width: `${controlSliderKnobSizePx}px`,
            height: `${controlSliderKnobSizePx}px`,
            left: `calc(${SLIDE_KNOB_INSET_PX}px + ((100% - ${controlSliderKnobSizePx}px - ${SLIDE_KNOB_INSET_PX * 2}px) * ${slideProgress}))`,
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.96)',
            border: '1px solid rgba(255,255,255,0.45)',
            boxShadow: '0 6px 14px rgba(0,0,0,0.24)',
            transition: isSliding ? 'none' : 'left 190ms ease',
          }}
        >
          <div className="flex h-full w-full items-center justify-center">
            {isLocked ? <Lock size={controlSliderGlyphSize} /> : <Unlock size={controlSliderGlyphSize} />}
          </div>
        </div>
        <div
          className="pointer-events-none absolute left-[clamp(2.2rem,16cqi,3rem)] right-[clamp(0.55rem,3.6cqi,0.85rem)] top-1/2 -translate-y-1/2"
          style={{
            opacity: controlSliderCanDrag ? Math.max(0, 1 - slideProgress * 1.2) : 1,
            transition: isSliding ? 'none' : 'opacity 140ms ease',
          }}
        >
          <p className="truncate text-[clamp(0.42rem,3.4cqi,0.58rem)] font-semibold tracking-[0.02em] text-white/74">
            {primaryHint}
          </p>
          {isLocked ? (
            <div className="mt-[2px] inline-flex items-center text-white/54">
              <ChevronRight size={8} />
              <ChevronRight size={8} className="-ml-0.5" />
              <ChevronRight size={8} className="-ml-0.5" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (lockVariant === 'statusChip') {
      return renderStatusChip();
    }
    if (lockVariant === 'statusTile') {
      return renderStatusTile();
    }
    if (lockVariant === 'actionPill') {
      return renderActionPill();
    }
    return renderControlCard();
  };

  return (
    <div
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden ${radiusClass} transition-transform duration-200 ${
        isSelected ? 'selection-corners' : ''
      }`}
      onClick={handleSurfaceClick}
    >
      <style>
        {`
          @keyframes lock-sweep {
            0% { opacity: 0; transform: translateX(-68%); }
            20% { opacity: 0.86; }
            100% { opacity: 0; transform: translateX(226%); }
          }
        `}
      </style>
      <div
        className={`relative h-full w-full min-h-0 min-w-0 overflow-hidden ${radiusClass} border transition-all duration-300 ${toneTokens.frameClass} ${
          isHolding ? 'scale-[1.02]' : 'scale-100'
        } ${
          isSuccessPulse
            ? 'shadow-[0_0_0_1px_rgba(74,222,128,0.85),0_0_30px_rgba(74,222,128,0.42)]'
            : ''
        }`}
        style={{
          containerType: 'size',
          background: surfaceBackground,
          boxShadow: isSuccessPulse ? undefined : surfaceAuraShadow,
        }}
      >
        <div
          className={`pointer-events-none absolute inset-0 ${radiusClass}`}
          style={{ background: surfaceOverlayBackground }}
        />
        <div className="relative h-full min-h-0 min-w-0">
          {renderContent()}
        </div>
      </div>

      {canHoldConfirm ? (
        <div
          className={`absolute inset-0 z-10 ${radiusClass} cursor-pointer`}
          onMouseDown={(event) => {
            event.preventDefault();
            startHold();
          }}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={(event) => {
            event.preventDefault();
            startHold();
          }}
          onTouchEnd={endHold}
          onTouchCancel={endHold}
          onContextMenu={(event) => event.preventDefault()}
        />
      ) : null}

      {isEditMode ? (
        <div
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            forceReset();
            onClick();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              forceReset();
              onClick();
            }
          }}
          className={`absolute inset-0 ${radiusClass} widget-card-handle cursor-grab`}
          aria-label={`Apri ${widget.title}`}
        />
      ) : null}
    </div>
  );
}
