import React from 'react';
import { Activity } from 'lucide-react';
import type { MicroWidget } from '../../../types/dashboardModels';
import type { MockEntityState } from '../../../types/ha';

type ValuePillProps = {
  widget: MicroWidget;
  state?: MockEntityState;
};

function isActiveState(state: MockEntityState | undefined) {
  if (typeof state?.toggleOn === 'boolean') {
    return state.toggleOn;
  }
  const normalized = (state?.stateLabel ?? state?.state ?? '').trim().toLowerCase();
  return ['on', 'open', 'opening', 'playing', 'active', 'home', 'heat', 'cool', 'cleaning', 'locked'].includes(normalized);
}

function formatValue(state: MockEntityState | undefined) {
  if (!state) {
    return '--';
  }
  if (typeof state.numericValue === 'number') {
    const rounded = Math.abs(state.numericValue) >= 10 ? Math.round(state.numericValue) : Math.round(state.numericValue * 10) / 10;
    return `${rounded}${state.unit ? ` ${state.unit}` : ''}`;
  }
  return state.stateLabel ?? state.state ?? '--';
}

export function ValuePill({ widget, state }: ValuePillProps) {
  const label = widget.label?.trim() || state?.rawAttributes?.friendly_name?.toString() || widget.entity;
  const active = isActiveState(state);

  return (
    <div
      className={`group min-h-[4.25rem] rounded-full border px-3.5 py-2.5 text-[color:var(--ui-text-primary)] shadow-[inset_0_1px_0_var(--ui-glass-highlight)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_8px_24px_var(--ui-shadow-soft)] ${
        active
          ? 'border-sky-300/35 bg-sky-500/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_0_22px_rgba(56,189,248,0.2)]'
          : 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] hover:border-[color:var(--ui-border-strong)] hover:bg-[color:var(--ui-fill-secondary)]'
      }`}
    >
      <div className="flex h-full min-w-0 items-center gap-3">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[color:var(--ui-text-secondary)] transition-transform duration-200 group-hover:scale-[1.05] ${
            active
              ? 'border-sky-200/40 bg-sky-400/22 text-sky-100 shadow-[0_0_16px_rgba(56,189,248,0.24)]'
              : 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-secondary)]'
          }`}
        >
          <Activity size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold leading-tight text-[color:var(--ui-text-primary)]">{formatValue(state)}</p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-[color:var(--ui-text-tertiary)]">{label}</p>
        </div>
      </div>
    </div>
  );
}
