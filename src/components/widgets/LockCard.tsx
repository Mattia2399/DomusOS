import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { useHoldToConfirm } from '../../hooks/useHoldToConfirm';
import { getWidgetLogicalSize } from './cardLayout';
import {
  resolveCardDensityByBreakpoint,
  type GridEngineBreakpoint,
} from '../dashboard/dashboardBreakpointConfig';

type LockCardProps = {
  widget: Widget;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  onToggleLock?: () => void;
  onOpenDoor?: () => void;
  liveEntity?: MockEntityState;
  gridBreakpoint?: GridEngineBreakpoint;
};

const RING_RADIUS_TINY = 15;
const RING_RADIUS_DEFAULT = 35;
const RING_RADIUS_COMPACT = 19;

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

function toRelativeTimeLabel(attributes: Record<string, unknown> | undefined) {
  const candidate =
    attributes?.changed_at ??
    attributes?.last_changed ??
    attributes?.last_updated;
  if (typeof candidate !== 'string' || !candidate.trim()) {
    return '2 min fa';
  }
  const timestamp = Date.parse(candidate);
  if (!Number.isFinite(timestamp)) {
    return '2 min fa';
  }
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes} min fa`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} h fa`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} g fa`;
}

function resolveLastUnlockLabel(attributes: Record<string, unknown> | undefined) {
  const candidate =
    attributes?.last_unlocked ??
    attributes?.last_unlock ??
    attributes?.last_unlocked_at ??
    attributes?.unlocked_at;
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    const timestamp = Date.parse(candidate);
    if (Number.isFinite(timestamp)) {
      const diffMs = Math.max(0, Date.now() - timestamp);
      const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
      if (diffMinutes < 60) {
        return `${diffMinutes} min fa`;
      }
      const diffHours = Math.round(diffMinutes / 60);
      if (diffHours < 24) {
        return `${diffHours} h fa`;
      }
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays} g fa`;
    }
  }
  return toRelativeTimeLabel(attributes);
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
  const cardDensity = resolveCardDensityByBreakpoint(gridBreakpoint);
  void _onOpenDoor;
  const rawAttributes = liveEntity?.rawAttributes;
  const lockStateFromEntity = normalizeLockState(
    liveEntity?.stateLabel ??
      liveEntity?.state ??
      widget.status,
  );
  const [simulatedState, setSimulatedState] = useState(lockStateFromEntity);
  useEffect(() => {
    setSimulatedState(lockStateFromEntity);
  }, [lockStateFromEntity, widget.id]);

  const isLocked = simulatedState === 'locked' || simulatedState === 'locking';
  const isTransitioning = simulatedState === 'locking' || simulatedState === 'unlocking';
  const canHoldToUnlock = !isEditMode && isLocked && !isTransitioning;
  const suppressNextClickRef = useRef(false);
  const logicalSize = getWidgetLogicalSize(widget);
  const isSingleCell = logicalSize.widthUnits <= 1 && logicalSize.heightUnits <= 1;
  const isTinyCard = cardDensity === 'tiny';
  const isCompact = cardDensity !== 'regular';
  const cardRadiusClass = isCompact ? 'rounded-[1.55rem]' : 'rounded-3xl';
  const ringRadius = isSingleCell
    ? isTinyCard
      ? 13
      : 15
    : isTinyCard
      ? RING_RADIUS_TINY
      : isCompact
        ? RING_RADIUS_COMPACT
        : RING_RADIUS_DEFAULT;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringSize = isSingleCell ? (isTinyCard ? 42 : 50) : isTinyCard ? 44 : isCompact ? 56 : 92;
  const ringCenter = ringSize / 2;
  const iconShellSize = isSingleCell ? (isTinyCard ? 30 : 36) : isTinyCard ? 32 : isCompact ? 44 : 74;
  const iconSize = isSingleCell ? (isTinyCard ? 14 : 18) : isTinyCard ? 15 : isCompact ? 20 : 31;
  const ringStroke = isSingleCell ? (isTinyCard ? 2.5 : 3) : isTinyCard ? 3 : isCompact ? 4 : 5;
  const contentPaddingClass = isSingleCell
    ? isTinyCard
      ? 'px-2 py-2'
      : 'px-2.5 py-2.5'
    : isTinyCard
      ? 'px-2.5 py-2'
      : isCompact
        ? 'px-3 py-2'
        : 'p-5';
  const compactTitleClass = isTinyCard
    ? 'truncate text-[0.88rem] leading-tight font-normal tracking-tight text-white'
    : 'truncate text-[0.97rem] leading-tight font-normal tracking-tight text-white';
  const compactSubtitleClass = isTinyCard
    ? 'line-clamp-1 mt-0.5 overflow-hidden text-[0.68rem] leading-none text-white/72'
    : 'line-clamp-1 mt-0.5 overflow-hidden text-[0.74rem] leading-none text-white/72';
  const compactHintClass = isTinyCard
    ? 'mt-0.5 text-[9px] uppercase tracking-[0.14em] text-white/42'
    : 'mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45';
  const regularSubtitleClass = isCompact
    ? 'mt-3 text-[10px] leading-tight font-medium text-white/62'
    : 'mt-4 text-[11px] leading-tight font-medium text-white/62';
  const regularHintClass = isCompact
    ? 'mt-1 text-[9px] uppercase tracking-[0.18em] text-white/45'
    : 'mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45';

  const {
    progress,
    isHolding,
    isSuccessPulse,
    startHold,
    endHold,
    forceReset,
  } = useHoldToConfirm({
    enabled: canHoldToUnlock,
    durationMs: 1000,
    onComplete: () => {
      setSimulatedState('unlocked');
      suppressNextClickRef.current = true;
      onToggleLock?.();
    },
  });

  const ringDashOffset = ringCircumference * (1 - progress);
  const lastUnlockLine = useMemo(() => resolveLastUnlockLabel(rawAttributes), [rawAttributes]);
  const canTapToggle = !isEditMode && !canHoldToUnlock && !isTransitioning;

  return (
    <div
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden ${cardRadiusClass} transition-transform duration-200 ${
        isSelected ? 'selection-corners' : ''
      }`}
      onClick={(event) => {
        if (isEditMode) {
          return;
        }
        event.stopPropagation();
        if (suppressNextClickRef.current) {
          suppressNextClickRef.current = false;
          return;
        }
        onClick();
      }}
    >
      <div
        className={`relative h-full w-full min-h-0 min-w-0 overflow-hidden ${cardRadiusClass} border border-white/5 backdrop-blur-xl ${contentPaddingClass} transition-all duration-300 ${
          isLocked ? 'bg-white/5' : 'bg-red-950/30'
        } ${
          isHolding ? 'scale-[1.03]' : 'scale-100'
        } ${
          isSuccessPulse
            ? 'shadow-[0_0_0_1px_rgba(74,222,128,0.85),0_0_30px_rgba(74,222,128,0.42)]'
            : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
        }`}
      >
        <div className={`pointer-events-none absolute inset-0 ${cardRadiusClass} bg-[radial-gradient(85%_72%_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)]`} />
        <div
          className={`relative h-full min-h-0 min-w-0 ${
            isSingleCell
              ? 'flex flex-col items-center justify-center text-center'
              : isCompact
                ? `flex items-center ${isTinyCard ? 'gap-2' : 'gap-3'} text-left`
                : 'flex flex-col items-center justify-center text-center'
          }`}
        >
          {isSingleCell ? (
            <button
              type="button"
              className={`relative pointer-events-auto flex items-center justify-center shrink-0 rounded-full ${isEditMode ? 'cursor-grab' : 'cursor-pointer'} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200/70`}
              style={{ width: `${ringSize}px`, height: `${ringSize}px` }}
              onClick={(event) => {
                event.stopPropagation();
                if (!canTapToggle) {
                  return;
                }
                onToggleLock?.();
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                  return;
                }
                event.preventDefault();
                event.stopPropagation();
                if (!canTapToggle) {
                  return;
                }
                onToggleLock?.();
              }}
              onMouseDown={(event) => {
                if (!canHoldToUnlock) {
                  return;
                }
                event.preventDefault();
                event.stopPropagation();
                startHold();
              }}
              onMouseUp={canHoldToUnlock ? endHold : undefined}
              onMouseLeave={canHoldToUnlock ? endHold : undefined}
              onTouchStart={
                canHoldToUnlock
                  ? (event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      startHold();
                    }
                  : undefined
              }
              onTouchEnd={canHoldToUnlock ? endHold : undefined}
              onTouchCancel={canHoldToUnlock ? endHold : undefined}
              onContextMenu={(event) => event.preventDefault()}
              aria-label={isLocked ? `Sblocca ${widget.title}` : `Blocca ${widget.title}`}
            >
              <svg
                className={`absolute inset-0 transition-opacity duration-150 ${progress > 0 || isHolding ? 'opacity-100' : 'opacity-0'}`}
                viewBox={`0 0 ${ringSize} ${ringSize}`}
                fill="none"
              >
                <circle cx={ringCenter} cy={ringCenter} r={ringRadius} stroke="rgba(255,255,255,0.18)" strokeWidth={ringStroke} />
                <circle
                  cx={ringCenter}
                  cy={ringCenter}
                  r={ringRadius}
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringDashOffset}
                  transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
                  style={{ transition: isHolding ? 'none' : 'stroke-dashoffset 110ms linear' }}
                />
              </svg>
              <div
                className="rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white"
                style={{ width: `${iconShellSize}px`, height: `${iconShellSize}px` }}
              >
                {isLocked ? <Lock size={iconSize} /> : <Unlock size={iconSize} />}
              </div>
            </button>
          ) : (
            <div
              className="relative flex items-center justify-center shrink-0"
              style={{ width: `${ringSize}px`, height: `${ringSize}px` }}
            >
              <svg
                className={`absolute inset-0 transition-opacity duration-150 ${progress > 0 || isHolding ? 'opacity-100' : 'opacity-0'}`}
                viewBox={`0 0 ${ringSize} ${ringSize}`}
                fill="none"
              >
                <circle cx={ringCenter} cy={ringCenter} r={ringRadius} stroke="rgba(255,255,255,0.18)" strokeWidth={ringStroke} />
                <circle
                  cx={ringCenter}
                  cy={ringCenter}
                  r={ringRadius}
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringDashOffset}
                  transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
                  style={{ transition: isHolding ? 'none' : 'stroke-dashoffset 110ms linear' }}
                />
              </svg>
              <div
                className="rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white"
                style={{ width: `${iconShellSize}px`, height: `${iconShellSize}px` }}
              >
                {isLocked ? <Lock size={iconSize} /> : <Unlock size={iconSize} />}
              </div>
            </div>
          )}

          {isSingleCell ? null : isCompact ? (
            <div className="min-w-0 flex-1">
              <p className={compactTitleClass}>{widget.title}</p>
              <p className={compactSubtitleClass}>{`Ultimo sblocco ${lastUnlockLine}`}</p>
              {canHoldToUnlock ? (
                <p className={compactHintClass}>Tieni premuto</p>
              ) : null}
            </div>
          ) : (
            <>
              <p className={regularSubtitleClass}>{`Ultimo sblocco ${lastUnlockLine}`}</p>
              {canHoldToUnlock ? (
                <p className={regularHintClass}>Tenere premuto per sbloccare</p>
              ) : null}
            </>
          )}
        </div>
      </div>

      {canHoldToUnlock && !isSingleCell ? (
        <div
          className={`absolute inset-0 z-10 ${cardRadiusClass} cursor-pointer`}
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
          className={`absolute inset-0 ${cardRadiusClass} widget-card-handle cursor-grab`}
          aria-label={`Apri ${widget.title}`}
        />
      ) : null}
    </div>
  );
}
