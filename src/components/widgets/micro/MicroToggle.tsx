import React from 'react';
import GlassToggle from '../../ui/GlassToggle';
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
      className={`min-h-[4.25rem] rounded-2xl border px-3 py-2.5 text-[color:var(--ui-text-primary)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_8px_24px_var(--ui-shadow-soft)] ${
        visualActive
          ? 'border-sky-300/35 bg-sky-500/12 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
          : 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] hover:border-[color:var(--ui-border-strong)] hover:bg-[color:var(--ui-fill-secondary)]'
      } ${tapPulse ? 'scale-[0.995]' : ''}`}
    >
      <div className="flex h-full min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight text-[color:var(--ui-text-primary)]">{label}</p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-[color:var(--ui-text-tertiary)]">{status}</p>
        </div>

        <GlassToggle
          checked={visualActive}
          onChange={() => handleToggle()}
          busy={isPending}
          size="compact"
          tone="blue"
          label={`Toggle ${label}`}
        />
      </div>
    </div>
  );
}
