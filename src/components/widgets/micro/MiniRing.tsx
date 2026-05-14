import React from 'react';
import type { MicroWidget } from '../../../types/dashboardModels';
import type { MockEntityState } from '../../../types/ha';

type MiniRingProps = {
  widget: MicroWidget;
  state?: MockEntityState;
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function parseNumeric(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function isActiveState(state: MockEntityState | undefined) {
  const normalized = (state?.stateLabel ?? state?.state ?? '').trim().toLowerCase();
  return ['on', 'open', 'opening', 'playing', 'active', 'home', 'heat', 'cool', 'cleaning', 'locked'].includes(normalized);
}

function resolveProgress(state: MockEntityState | undefined) {
  const numericValue = parseNumeric(state?.numericValue);
  if (numericValue !== undefined) {
    if (state?.unit?.trim() === '%') {
      return clampPercent(numericValue);
    }
    if (numericValue >= 0 && numericValue <= 1) {
      return clampPercent(numericValue * 100);
    }
    if (numericValue >= 0 && numericValue <= 100) {
      return clampPercent(numericValue);
    }
  }

  const progress = parseNumeric(state?.progress);
  if (progress !== undefined) {
    if (progress >= 0 && progress <= 1) {
      return clampPercent(progress * 100);
    }
    return clampPercent(progress);
  }

  const brightness = parseNumeric(state?.brightness);
  if (brightness !== undefined) {
    return clampPercent((brightness / 255) * 100);
  }

  return isActiveState(state) ? 100 : 0;
}

function formatPrimaryValue(state: MockEntityState | undefined, progress: number) {
  if (!state) {
    return '--';
  }
  if (typeof state.numericValue === 'number') {
    const rounded = Math.abs(state.numericValue) >= 10 ? Math.round(state.numericValue) : Math.round(state.numericValue * 10) / 10;
    return `${rounded}${state.unit ? ` ${state.unit}` : ''}`;
  }
  if (typeof state.progress === 'number') {
    return `${Math.round(progress)}%`;
  }
  return state.stateLabel ?? state.state ?? '--';
}

export function MiniRing({ widget, state }: MiniRingProps) {
  const label = widget.label?.trim() || state?.rawAttributes?.friendly_name?.toString() || widget.entity;
  const progress = resolveProgress(state);
  const progressRounded = Math.round(progress);
  const valueLabel = formatPrimaryValue(state, progress);
  const active = isActiveState(state);

  const ringSize = 46;
  const strokeWidth = 4;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progressRounded / 100) * circumference;

  return (
    <div
      className={`group min-h-[4.25rem] rounded-2xl border px-3 py-2.5 text-white backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.22)] ${
        active
          ? 'border-blue-300/35 bg-blue-500/12 shadow-[0_0_22px_rgba(59,130,246,0.22)]'
          : 'border-white/10 bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.08]'
      }`}
    >
      <div className="flex h-full min-w-0 items-center gap-3">
        <div className="relative h-[2.875rem] w-[2.875rem] shrink-0 transition-transform duration-200 group-hover:scale-[1.03]">
          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} className="-rotate-90">
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="rgba(96,165,250,0.95)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 260ms ease-out' }}
            />
          </svg>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white/90">
            {progressRounded}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight text-white/90">{label}</p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-white/55">{valueLabel}</p>
        </div>
      </div>
    </div>
  );
}
