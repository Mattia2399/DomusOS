import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Lock, Unlock } from 'lucide-react';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { useHoldToConfirm } from '../../hooks/useHoldToConfirm';
import { getWidgetLogicalSize } from './cardLayout';
import { resolveWidgetCardMode, type WidgetCardMode } from './cardMode';
import { type GridEngineBreakpoint } from '../dashboard/dashboardBreakpointConfig';

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

const RING_RADIUS_DEFAULT = 35;
const RING_RADIUS_COMPACT = 19;
const MINI_SLIDE_TRACK_INSET_PX = 4;
const MINI_SLIDE_UNLOCK_THRESHOLD = 0.84;
const MINI_UNLOCK_SWEEP_MS = 420;

const LOCK_MODE_VISIBILITY: Record<
  WidgetCardMode,
  {
    showTitle: boolean;
    showHoldHint: boolean;
  }
> = {
  mini: {
    showTitle: false,
    showHoldHint: false,
  },
  compact: {
    showTitle: true,
    showHoldHint: true,
  },
  full: {
    showTitle: true,
    showHoldHint: true,
  },
};

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
  const miniSlideTrackRef = useRef<HTMLDivElement | null>(null);
  const miniSlidePointerIdRef = useRef<number | null>(null);
  const miniUnlockSweepTimerRef = useRef<number | null>(null);
  const [miniSlideProgress, setMiniSlideProgress] = useState(0);
  const [isMiniSliding, setIsMiniSliding] = useState(false);
  const [isMiniUnlockSweeping, setIsMiniUnlockSweeping] = useState(false);
  const [miniUnlockSweepTick, setMiniUnlockSweepTick] = useState(0);
  const logicalSize = getWidgetLogicalSize(widget);
  const cardMode = resolveWidgetCardMode(gridBreakpoint, logicalSize);
  const visibility = LOCK_MODE_VISIBILITY[cardMode];
  const isMdBreakpoint = gridBreakpoint === 'md';
  const isMiniMode = cardMode === 'mini';
  const canSlideToUnlock = isMiniMode && canHoldToUnlock;
  const isCompactMode = cardMode === 'compact';
  const useTightMdProfile = cardMode === 'full' && isMdBreakpoint;
  const useCompactSizing = isCompactMode || useTightMdProfile;
  const useCompactText = isCompactMode || useTightMdProfile;
  const isCompactCard = cardMode !== 'full';
  const cardRadiusClass = isCompactCard ? 'rounded-[1.55rem]' : 'rounded-3xl';

  const ringRadius = isMiniMode
    ? 13
    : useCompactSizing
      ? RING_RADIUS_COMPACT
      : RING_RADIUS_DEFAULT;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringSize = isMiniMode ? 42 : useCompactSizing ? 50 : 86;
  const ringCenter = ringSize / 2;
  const iconShellSize = isMiniMode ? 30 : useCompactSizing ? 40 : 70;
  const iconSize = isMiniMode ? 14 : useCompactSizing ? 18 : 28;
  const ringStroke = isMiniMode ? 2.5 : useCompactSizing ? 4 : 5;

  const contentPaddingClass = isMiniMode
    ? 'px-2 py-2'
    : useCompactSizing
      ? 'px-3 py-2'
      : 'p-5';
  const compactTitleClass = 'truncate text-[0.83rem] leading-tight font-medium tracking-tight text-white/92';
  const regularTitleClass = 'truncate text-[0.95rem] leading-tight font-medium tracking-tight text-white/95';
  const compactHintClass = 'text-[9px] leading-tight tracking-[0.15em] text-white/72 uppercase';
  const regularHintClass = 'text-[10px] leading-tight tracking-[0.16em] text-white/72 uppercase';

  const {
    progress,
    isHolding,
    isSuccessPulse,
    startHold,
    endHold,
    forceReset,
  } = useHoldToConfirm({
    enabled: canHoldToUnlock && !isMiniMode,
    durationMs: 1000,
    onComplete: () => {
      setSimulatedState('unlocked');
      suppressNextClickRef.current = true;
      onToggleLock?.();
    },
  });

  const ringDashOffset = ringCircumference * (1 - progress);
  const canTapToggle = !isEditMode && !canHoldToUnlock && !isTransitioning;
  const showHoldHint = canHoldToUnlock && visibility.showHoldHint;
  const miniSliderProgress = isLocked ? miniSlideProgress : 1;

  useEffect(
    () => () => {
      if (miniUnlockSweepTimerRef.current !== null) {
        window.clearTimeout(miniUnlockSweepTimerRef.current);
        miniUnlockSweepTimerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    if (!isMiniMode) {
      setIsMiniSliding(false);
      setMiniSlideProgress(0);
      setIsMiniUnlockSweeping(false);
      miniSlidePointerIdRef.current = null;
      return;
    }
    if (isLocked) {
      if (!isMiniSliding) {
        setMiniSlideProgress(0);
      }
      setIsMiniUnlockSweeping(false);
      return;
    }
    setMiniSlideProgress(1);
    setIsMiniSliding(false);
    miniSlidePointerIdRef.current = null;
  }, [isLocked, isMiniMode, isMiniSliding]);

  const resolveMiniSlideProgress = (clientX: number) => {
    const track = miniSlideTrackRef.current;
    if (!track) {
      return 0;
    }
    const trackRect = track.getBoundingClientRect();
    const knobRadius = iconShellSize / 2;
    const start = trackRect.left + MINI_SLIDE_TRACK_INSET_PX + knobRadius;
    const end = trackRect.right - MINI_SLIDE_TRACK_INSET_PX - knobRadius;
    const travel = Math.max(1, end - start);
    const raw = (clientX - start) / travel;
    return Math.min(1, Math.max(0, raw));
  };

  const commitMiniUnlock = () => {
    setMiniSlideProgress(1);
    setIsMiniSliding(false);
    miniSlidePointerIdRef.current = null;
    setIsMiniUnlockSweeping(false);
    setMiniUnlockSweepTick((current) => current + 1);
    setIsMiniUnlockSweeping(true);
    if (miniUnlockSweepTimerRef.current !== null) {
      window.clearTimeout(miniUnlockSweepTimerRef.current);
    }
    miniUnlockSweepTimerRef.current = window.setTimeout(() => {
      setIsMiniUnlockSweeping(false);
      miniUnlockSweepTimerRef.current = null;
    }, MINI_UNLOCK_SWEEP_MS);
    setSimulatedState('unlocked');
    suppressNextClickRef.current = true;
    onToggleLock?.();
  };

  const handleMiniSlideEnd = (commit: boolean) => {
    const reachedThreshold = miniSlideProgress >= MINI_SLIDE_UNLOCK_THRESHOLD;
    setIsMiniSliding(false);
    miniSlidePointerIdRef.current = null;
    if (commit && canSlideToUnlock && reachedThreshold) {
      commitMiniUnlock();
      return;
    }
    setMiniSlideProgress(isLocked ? 0 : 1);
  };

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
        <div className="relative h-full min-h-0 min-w-0">
          {isMiniMode ? (
            <style>
              {`
                @keyframes lock-mini-arrow-drift {
                  0% { opacity: 0.22; transform: translateX(-3px); }
                  45% { opacity: 1; transform: translateX(1px); }
                  100% { opacity: 0.22; transform: translateX(5px); }
                }
                @keyframes lock-mini-unlock-sweep {
                  0% { opacity: 0; transform: translateX(-68%); }
                  20% { opacity: 0.86; }
                  100% { opacity: 0; transform: translateX(226%); }
                }
                @keyframes lock-mini-knob-pop {
                  0% { transform: translateY(-50%) scale(1); }
                  45% { transform: translateY(-50%) scale(1.08); }
                  100% { transform: translateY(-50%) scale(1); }
                }
              `}
            </style>
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center">
            {isMiniMode ? (
              <div
                ref={miniSlideTrackRef}
                role="button"
                tabIndex={isEditMode ? -1 : 0}
                className={`relative pointer-events-auto h-full min-h-0 w-full max-w-[13.5rem] rounded-full ${
                  isEditMode ? 'cursor-grab' : canSlideToUnlock ? 'cursor-ew-resize' : 'cursor-pointer'
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200/70`}
                style={{ touchAction: 'none' }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!canTapToggle) {
                    return;
                  }
                  onToggleLock?.();
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  if (!canSlideToUnlock) {
                    return;
                  }
                  if (event.pointerType === 'mouse' && event.button !== 0) {
                    return;
                  }
                  event.preventDefault();
                  miniSlidePointerIdRef.current = event.pointerId;
                  setIsMiniSliding(true);
                  setMiniSlideProgress(resolveMiniSlideProgress(event.clientX));
                  try {
                    event.currentTarget.setPointerCapture(event.pointerId);
                  } catch {
                    // no-op: some browsers may not support pointer capture in this context
                  }
                }}
                onPointerMove={(event) => {
                  if (!isMiniSliding || miniSlidePointerIdRef.current !== event.pointerId) {
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  setMiniSlideProgress(resolveMiniSlideProgress(event.clientX));
                }}
                onPointerUp={(event) => {
                  if (miniSlidePointerIdRef.current !== event.pointerId) {
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  try {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  } catch {
                    // no-op
                  }
                  handleMiniSlideEnd(true);
                }}
                onPointerCancel={(event) => {
                  if (miniSlidePointerIdRef.current !== event.pointerId) {
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  handleMiniSlideEnd(false);
                }}
                onLostPointerCapture={(event) => {
                  if (miniSlidePointerIdRef.current !== event.pointerId) {
                    return;
                  }
                  handleMiniSlideEnd(false);
                }}
                onContextMenu={(event) => event.preventDefault()}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  if (canSlideToUnlock) {
                    commitMiniUnlock();
                    return;
                  }
                  if (canTapToggle) {
                    onToggleLock?.();
                  }
                }}
                aria-label={isLocked ? `Trascina per sbloccare ${widget.title}` : `Blocca ${widget.title}`}
              >
                {isMiniUnlockSweeping ? (
                  <div key={miniUnlockSweepTick} className="pointer-events-none absolute inset-[2px] overflow-hidden rounded-full">
                    <div
                      className="absolute inset-y-0 -left-1/2 w-[45%] rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(125,211,252,0.82),rgba(255,255,255,0))] blur-[2px]"
                      style={{ animation: 'lock-mini-unlock-sweep 420ms cubic-bezier(0.2,0.62,0.22,1) forwards' }}
                    />
                  </div>
                ) : null}
                <div
                  className="pointer-events-none absolute left-[2.7rem] right-2 top-1/2 -translate-y-1/2"
                  style={{
                    opacity: Math.max(0, 1 - miniSliderProgress * 1.35),
                    transition: isMiniSliding ? 'none' : 'opacity 140ms ease',
                  }}
                >
                  <p className="truncate text-[11px] leading-tight font-medium tracking-tight text-white/92">
                    {widget.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-white/68">
                      Scorri per aprire
                    </span>
                    <span className="ml-0.5 inline-flex items-center">
                      <ChevronRight
                        size={9}
                        className="text-white/58"
                        style={{ animation: 'lock-mini-arrow-drift 1.1s ease-in-out infinite 0ms' }}
                      />
                      <ChevronRight
                        size={9}
                        className="text-white/68 -ml-0.5"
                        style={{ animation: 'lock-mini-arrow-drift 1.1s ease-in-out infinite 120ms' }}
                      />
                      <ChevronRight
                        size={9}
                        className="text-white/78 -ml-0.5"
                        style={{ animation: 'lock-mini-arrow-drift 1.1s ease-in-out infinite 240ms' }}
                      />
                    </span>
                  </div>
                </div>
                <div
                  className="pointer-events-none absolute top-1/2 h-[0.92rem] -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,rgba(125,211,252,0.02),rgba(186,230,253,0.28),rgba(255,255,255,0.08))] blur-[1px]"
                  style={{
                    left: `${MINI_SLIDE_TRACK_INSET_PX + 2}px`,
                    width: `calc((100% - ${iconShellSize}px - ${MINI_SLIDE_TRACK_INSET_PX * 2 + 4}px) * ${miniSliderProgress} + 8px)`,
                    opacity: Math.min(0.9, Math.max(0, miniSliderProgress * 1.12)),
                    transition: isMiniSliding ? 'none' : 'width 180ms ease, opacity 180ms ease',
                  }}
                />
                <div
                  className="absolute top-1/2 rounded-full border border-white/25 bg-white/12 text-white shadow-[0_6px_16px_rgba(15,23,42,0.42),inset_0_1px_0_rgba(255,255,255,0.2)]"
                  style={{
                    width: `${iconShellSize}px`,
                    height: `${iconShellSize}px`,
                    left: `calc(${MINI_SLIDE_TRACK_INSET_PX}px + ((100% - ${iconShellSize}px - ${MINI_SLIDE_TRACK_INSET_PX * 2}px) * ${miniSliderProgress}))`,
                    transform: 'translateY(-50%)',
                    transition: isMiniSliding ? 'none' : 'left 190ms ease',
                    animation: isMiniUnlockSweeping ? 'lock-mini-knob-pop 320ms ease-out' : undefined,
                  }}
                >
                  <div className="flex h-full w-full items-center justify-center">
                    {isLocked ? <Lock size={iconSize} /> : <Unlock size={iconSize} />}
                  </div>
                </div>
              </div>
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
          </div>

          {!isMiniMode && visibility.showTitle ? (
            <div className={`pointer-events-none absolute inset-x-2 min-w-0 text-center ${useCompactText ? 'top-0.5' : 'top-2'}`}>
              <p className={useCompactText ? compactTitleClass : regularTitleClass}>{widget.title}</p>
            </div>
          ) : null}

          {showHoldHint ? (
            <div className={`pointer-events-none absolute inset-x-2 min-w-0 text-center ${useCompactText ? 'bottom-0.5' : 'bottom-1'}`}>
              <p className={useCompactText ? compactHintClass : regularHintClass}>
                Tieni premuto per sbloccare
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {canHoldToUnlock && !isMiniMode ? (
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
