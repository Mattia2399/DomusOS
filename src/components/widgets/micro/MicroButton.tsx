import React from 'react';
import { ChevronRight, Hand, Power } from 'lucide-react';
import type { MicroWidget } from '../../../types/dashboardModels';
import type { MockEntityState } from '../../../types/ha';

type MicroButtonProps = {
  widget: MicroWidget;
  state?: MockEntityState;
  onSwitchToggle?: (nextActive: boolean) => void;
  onPushTap?: () => void;
  onPushStart?: () => void;
  onPushEnd?: () => void;
  onPageNavigate?: (path: string) => void;
};

function isActiveState(state: MockEntityState | undefined) {
  if (typeof state?.toggleOn === 'boolean') {
    return state.toggleOn;
  }
  const normalized = (state?.stateLabel ?? state?.state ?? '').trim().toLowerCase();
  return ['on', 'open', 'opening', 'playing', 'active', 'home', 'heat', 'cool', 'cleaning', 'locked'].includes(normalized);
}

export function MicroButton({
  widget,
  state,
  onSwitchToggle,
  onPushTap,
  onPushStart,
  onPushEnd,
  onPageNavigate,
}: MicroButtonProps) {
  const mode = widget.buttonMode ?? 'switch';
  const holdWhilePressed = widget.buttonHoldWhilePressed === true;
  const baseActive = isActiveState(state);
  const [isPressed, setIsPressed] = React.useState(false);
  const [tapPulse, setTapPulse] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const pressPulseTimerRef = React.useRef<number | null>(null);
  const tapPulseTimerRef = React.useRef<number | null>(null);
  const pendingTimeoutRef = React.useRef<number | null>(null);
  const pendingTargetRef = React.useRef<boolean | null>(null);
  const label = widget.label?.trim() || state?.rawAttributes?.friendly_name?.toString() || widget.entity;
  const pagePath = widget.buttonPagePath?.trim() || '/home';

  React.useEffect(() => {
    if (mode !== 'switch' || !isPending || pendingTargetRef.current === null) {
      return;
    }
    if (baseActive === pendingTargetRef.current) {
      pendingTargetRef.current = null;
      setIsPending(false);
      if (pendingTimeoutRef.current !== null) {
        window.clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }
    }
  }, [baseActive, isPending, mode]);

  React.useEffect(
    () => () => {
      if (pressPulseTimerRef.current !== null) {
        window.clearTimeout(pressPulseTimerRef.current);
      }
      if (tapPulseTimerRef.current !== null) {
        window.clearTimeout(tapPulseTimerRef.current);
      }
      if (pendingTimeoutRef.current !== null) {
        window.clearTimeout(pendingTimeoutRef.current);
      }
    },
    [],
  );

  const triggerTapPulse = () => {
    setTapPulse(true);
    if (tapPulseTimerRef.current !== null) {
      window.clearTimeout(tapPulseTimerRef.current);
    }
    tapPulseTimerRef.current = window.setTimeout(() => {
      setTapPulse(false);
      tapPulseTimerRef.current = null;
    }, 180);
  };

  const startSwitchPending = (targetActive: boolean) => {
    pendingTargetRef.current = targetActive;
    setIsPending(true);
    if (pendingTimeoutRef.current !== null) {
      window.clearTimeout(pendingTimeoutRef.current);
    }
    pendingTimeoutRef.current = window.setTimeout(() => {
      pendingTargetRef.current = null;
      setIsPending(false);
      pendingTimeoutRef.current = null;
    }, 1700);
  };

  const startPushPending = () => {
    setIsPending(true);
    if (pendingTimeoutRef.current !== null) {
      window.clearTimeout(pendingTimeoutRef.current);
    }
    pendingTimeoutRef.current = window.setTimeout(() => {
      setIsPending(false);
      pendingTimeoutRef.current = null;
    }, 650);
  };

  const visualActive =
    mode === 'switch'
      ? baseActive
      : mode === 'push'
        ? isPressed || baseActive
        : Boolean(pagePath);

  const statusText =
    mode === 'switch'
      ? state?.stateLabel ?? state?.state ?? (visualActive ? 'On' : 'Off')
      : mode === 'push'
        ? holdWhilePressed
          ? 'Premi e tieni'
          : 'Invio singolo'
        : pagePath;
  const displayStatusText = statusText;

  const handleSwitchClick = () => {
    if (isPending || !onSwitchToggle) {
      return;
    }
    triggerTapPulse();
    const nextActive = !baseActive;
    startSwitchPending(nextActive);
    onSwitchToggle(nextActive);
  };

  const handlePushSingle = () => {
    if (!onPushTap) {
      return;
    }
    triggerTapPulse();
    startPushPending();
    setIsPressed(true);
    if (pressPulseTimerRef.current !== null) {
      window.clearTimeout(pressPulseTimerRef.current);
    }
    pressPulseTimerRef.current = window.setTimeout(() => {
      setIsPressed(false);
      pressPulseTimerRef.current = null;
    }, 160);
    onPushTap();
  };

  const handlePushHoldStart = () => {
    if (isPressed || !onPushStart) {
      return;
    }
    triggerTapPulse();
    startPushPending();
    setIsPressed(true);
    onPushStart();
  };

  const handlePushHoldEnd = () => {
    if (!isPressed || !onPushEnd) {
      return;
    }
    startPushPending();
    setIsPressed(false);
    onPushEnd();
  };

  const handleNavigate = () => {
    triggerTapPulse();
    onPageNavigate?.(pagePath);
  };

  return (
    <button
      type="button"
      onClick={
        mode === 'switch'
          ? handleSwitchClick
          : mode === 'push'
            ? holdWhilePressed
              ? undefined
              : handlePushSingle
            : handleNavigate
      }
      onPointerDown={
        mode === 'push' && holdWhilePressed
          ? (event) => {
              event.preventDefault();
              handlePushHoldStart();
            }
          : undefined
      }
      onPointerUp={
        mode === 'push' && holdWhilePressed
          ? (event) => {
              event.preventDefault();
              handlePushHoldEnd();
            }
          : undefined
      }
      onPointerCancel={mode === 'push' && holdWhilePressed ? handlePushHoldEnd : undefined}
      onPointerLeave={mode === 'push' && holdWhilePressed ? handlePushHoldEnd : undefined}
      onKeyDown={
        mode === 'push' && holdWhilePressed
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handlePushHoldStart();
              }
            }
          : undefined
      }
      onKeyUp={
        mode === 'push' && holdWhilePressed
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handlePushHoldEnd();
              }
            }
          : undefined
      }
      disabled={mode === 'switch' ? isPending : false}
      className={`min-h-[4.25rem] rounded-2xl border px-3 py-2.5 text-left text-white transition-all duration-200 ease-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/55 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
        visualActive
          ? 'border-blue-300/45 bg-blue-500/18 shadow-[0_0_24px_rgba(56,189,248,0.24)]'
          : 'border-white/10 bg-white/[0.06] hover:border-white/22 hover:bg-white/[0.08] hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.22)]'
      } ${isPressed || tapPulse ? 'scale-[0.995]' : ''} ${isPending && mode === 'switch' ? 'cursor-wait opacity-80' : ''}`}
      aria-label={label}
      title={label}
    >
      <div className="flex h-full min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-white/92">{label}</p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-white/58">{displayStatusText}</p>
        </div>
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-white/90 ${
            visualActive
              ? 'border-blue-200/55 bg-blue-400/28'
              : 'border-white/15 bg-white/10'
          }`}
        >
          {isPending && mode !== 'page' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/85 border-t-transparent" />
          ) : mode === 'page' ? (
            <ChevronRight size={16} />
          ) : mode === 'push' ? (
            <Hand size={16} />
          ) : (
            <Power size={16} />
          )}
        </span>
      </div>
    </button>
  );
}
