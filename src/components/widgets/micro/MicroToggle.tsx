import React from 'react';
import type { MicroWidget } from '../../../types/dashboardModels';
import type { MockEntityState } from '../../../types/ha';

type MicroToggleProps = {
  widget: MicroWidget;
  state?: MockEntityState;
  onToggle?: (nextActive: boolean) => void;
};

function isActiveState(state: MockEntityState | undefined) {
  if (typeof state?.toggleOn === 'boolean') {
    return state.toggleOn;
  }
  const normalized = (state?.stateLabel ?? state?.state ?? '').trim().toLowerCase();
  return ['on', 'open', 'opening', 'playing', 'active', 'home', 'heat', 'cool', 'cleaning', 'locked'].includes(normalized);
}

export function MicroToggle({ widget, state, onToggle }: MicroToggleProps) {
  const activeFromState = isActiveState(state);
  const [tapPulse, setTapPulse] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const pendingTargetRef = React.useRef<boolean | null>(null);
  const tapPulseTimerRef = React.useRef<number | null>(null);
  const pendingTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!isPending || pendingTargetRef.current === null) {
      return;
    }
    if (activeFromState === pendingTargetRef.current) {
      pendingTargetRef.current = null;
      setIsPending(false);
      if (pendingTimeoutRef.current !== null) {
        window.clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }
    }
  }, [activeFromState, isPending]);

  React.useEffect(
    () => () => {
      if (tapPulseTimerRef.current !== null) {
        window.clearTimeout(tapPulseTimerRef.current);
      }
      if (pendingTimeoutRef.current !== null) {
        window.clearTimeout(pendingTimeoutRef.current);
      }
    },
    [],
  );

  const visualActive = activeFromState;
  const label = widget.label?.trim() || state?.rawAttributes?.friendly_name?.toString() || widget.entity;
  const status = state?.stateLabel ?? state?.state ?? (visualActive ? 'On' : 'Off');

  const handleToggle = () => {
    if (isPending || !onToggle) {
      return;
    }
    const nextActive = !activeFromState;
    pendingTargetRef.current = nextActive;
    setIsPending(true);
    if (pendingTimeoutRef.current !== null) {
      window.clearTimeout(pendingTimeoutRef.current);
    }
    pendingTimeoutRef.current = window.setTimeout(() => {
      pendingTargetRef.current = null;
      setIsPending(false);
      pendingTimeoutRef.current = null;
    }, 1700);

    setTapPulse(true);
    if (tapPulseTimerRef.current !== null) {
      window.clearTimeout(tapPulseTimerRef.current);
    }
    tapPulseTimerRef.current = window.setTimeout(() => {
      setTapPulse(false);
      tapPulseTimerRef.current = null;
    }, 180);
    onToggle(nextActive);
  };

  return (
    <div
      className={`min-h-[4.25rem] rounded-2xl border px-3 py-2.5 text-white transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.22)] ${
        visualActive
          ? 'border-sky-300/35 bg-sky-500/12 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
          : 'border-white/10 bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.08]'
      } ${tapPulse ? 'scale-[0.995]' : ''}`}
    >
      <div className="flex h-full min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight text-white/92">{label}</p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-white/55">{status}</p>
        </div>

        <button
          type="button"
          role="switch"
          onClick={handleToggle}
          disabled={isPending}
          className={`ios-glass-switch h-7 w-12 ${visualActive ? 'ios-glass-switch-blue-on' : ''} ${isPending ? 'cursor-wait opacity-75' : ''}`}
          aria-label={`Toggle ${label}`}
          aria-checked={visualActive}
        >
          {isPending ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/90 border-t-transparent" />
            </span>
          ) : (
            <span
              className={`absolute left-[2px] top-[2px] h-[1.375rem] w-[1.375rem] rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.35)] transition-transform ${
                visualActive ? 'translate-x-[1.25rem]' : 'translate-x-0'
              }`}
            />
          )}
        </button>
      </div>
    </div>
  );
}
