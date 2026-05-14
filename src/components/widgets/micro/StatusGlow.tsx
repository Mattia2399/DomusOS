import React from 'react';
import type { MicroWidget } from '../../../types/dashboardModels';
import type { MockEntityState } from '../../../types/ha';

type StatusGlowProps = {
  widget: MicroWidget;
  state?: MockEntityState;
};

function isActiveState(state: MockEntityState | undefined) {
  const normalized = (state?.stateLabel ?? state?.state ?? '').trim().toLowerCase();
  return ['on', 'open', 'opening', 'playing', 'active', 'home', 'heat', 'cool', 'cleaning', 'locked'].includes(normalized);
}

export function StatusGlow({ widget, state }: StatusGlowProps) {
  const active = isActiveState(state);
  const label = widget.label?.trim() || state?.rawAttributes?.friendly_name?.toString() || widget.entity;
  const status = state?.stateLabel ?? state?.state ?? 'N/D';

  return (
    <div
      className={`min-h-[4.25rem] rounded-2xl border px-3 py-2.5 text-white backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.22)] ${
        active
          ? 'border-emerald-300/35 bg-emerald-500/12 shadow-[0_0_22px_rgba(16,185,129,0.2)]'
          : 'border-white/10 bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.08]'
      }`}
    >
      <div className="flex h-full min-w-0 items-center gap-3">
        <span
          className={`h-3.5 w-3.5 shrink-0 rounded-full transition-transform duration-200 ${
            active
              ? 'bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.85)] animate-pulse [animation-duration:2.2s]'
              : 'bg-white/35 shadow-[0_0_12px_rgba(255,255,255,0.18)]'
          }`}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight text-white/90">{label}</p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-white/50">{status}</p>
        </div>
      </div>
    </div>
  );
}
