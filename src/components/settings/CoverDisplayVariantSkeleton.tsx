import React from 'react';
import type { WidgetDisplayVariant } from '../widgets/widgetDisplayVariant';

type CoverDisplayVariantSkeletonProps = {
  variant: WidgetDisplayVariant;
  active: boolean;
  disabled: boolean;
  hasTilt?: boolean;
  supportsPosition?: boolean;
  position?: number;
  tiltPosition?: number;
};

function clampPercent(value: number | undefined, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function CoverDisplayVariantSkeleton({
  variant,
  active,
  disabled,
  hasTilt = true,
  supportsPosition = true,
  position,
  tiltPosition,
}: CoverDisplayVariantSkeletonProps) {
  const positionPercent = clampPercent(position, 62);
  const tiltPercent = clampPercent(tiltPosition, 50);
  const activeTiltIndex = Math.max(0, Math.min(4, Math.round(tiltPercent / 25)));
  const accent = active
    ? 'bg-[color:rgb(var(--ui-accent-rgb)/0.76)]'
    : disabled
      ? 'bg-[color:var(--ui-fill-tertiary)]'
      : 'bg-teal-300/62';
  const accentSoft = active
    ? 'bg-[color:rgb(var(--ui-accent-secondary-rgb)/0.26)]'
    : disabled
      ? 'bg-[color:var(--ui-fill-tertiary)]'
      : 'bg-teal-200/[0.16]';
  const muted = disabled ? 'bg-[color:var(--ui-fill-tertiary)]' : 'bg-[color:var(--ui-fill-primary)]';
  const faint = 'bg-[color:var(--ui-fill-tertiary)]';
  const frame = 'dashboard-content-surface-soft relative overflow-hidden rounded-[0.82rem] p-2';

  const iconShell = (size = 'h-5 w-5') => (
    <span className={`inline-flex ${size} shrink-0 items-center justify-center rounded-full border border-[color:var(--ui-border)] ${accentSoft}`}>
      <span className={`h-[48%] w-[48%] rounded-[0.28rem] border border-[color:var(--ui-border-strong)] ${accent}`} />
    </span>
  );

  const meta = (compact = false) => (
    <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
      <span className={`h-1.5 ${compact ? 'w-[68%]' : 'w-[78%]'} rounded-full ${muted}`} />
      <span className={`h-1 ${compact ? 'w-[42%]' : 'w-[56%]'} rounded-full ${accentSoft}`} />
    </span>
  );

  const modeChip = (
    <span className={`inline-flex h-5 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--ui-border)] ${faint}`}>
      <span className={`h-1.5 w-4 rounded-full ${hasTilt ? accent : muted}`} />
    </span>
  );

  const positionSlider = (fallbackPosition = positionPercent, tall = false) => {
    const resolvedPosition = clampPercent(position, fallbackPosition);
    return (
    <span
      className={`relative block w-full overflow-hidden rounded-[0.68rem] border border-[color:var(--ui-border)] ${faint} ${
        tall ? 'h-7' : 'h-5'
      }`}
    >
      <span
        className={`absolute inset-y-0 left-0 rounded-l-[inherit] border-r border-[color:var(--ui-border-strong)] ${supportsPosition ? accent : 'bg-[color:var(--ui-fill-secondary)]'}`}
        style={{ width: `${resolvedPosition}%` }}
      >
        <span className="absolute inset-0 opacity-75 [background-image:repeating-linear-gradient(90deg,var(--ui-border-strong)_0,var(--ui-border-strong)_1px,transparent_1px,transparent_7px)]" />
      </span>
      <span
        className="absolute inset-y-1 w-0.5 rounded-full bg-[color:var(--ui-text-primary)] shadow-[0_0_8px_var(--ui-shadow-soft)]"
        style={{ left: `calc(${resolvedPosition}% - 1px)` }}
      />
    </span>
    );
  };

  const coverVisual = (height = 'h-10', width = 'w-8') => (
    <span className={`relative block ${height} ${width} shrink-0 overflow-hidden rounded-[0.72rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] shadow-[inset_0_8px_18px_var(--ui-shadow-soft)]`}>
      <span
        className={`absolute inset-x-0 top-0 ${accent}`}
        style={{ height: `${100 - positionPercent}%` }}
      >
        <span className="absolute inset-0 opacity-70 [background-image:repeating-linear-gradient(180deg,var(--ui-border-strong)_0,var(--ui-border-strong)_1px,var(--ui-border)_1px,var(--ui-border)_7px)]" />
      </span>
      <span
        className="absolute inset-x-1 h-0.5 rounded-full bg-[color:var(--ui-text-secondary)]"
        style={{ top: `${100 - positionPercent}%` }}
      />
      <span className="absolute inset-1 rounded-[0.48rem] border border-[color:var(--ui-border)]" />
    </span>
  );

  const tiltSegments = (
    <span className="grid grid-cols-5 gap-1">
      {[0, 1, 2, 3, 4].map((item) => (
        <span
          key={item}
          className={`h-3 rounded-full border border-[color:var(--ui-border)] ${item === activeTiltIndex ? accent : faint}`}
        />
      ))}
    </span>
  );

  const detailGrid = (
    <span className="grid grid-cols-3 gap-1">
      <span className={`h-4 rounded-[0.42rem] ${accentSoft}`} />
      <span className={`h-4 rounded-[0.42rem] ${faint}`} />
      <span className={`h-4 rounded-[0.42rem] ${hasTilt ? accentSoft : faint}`} />
    </span>
  );

  const quickActions = (
    <span className="grid grid-cols-3 gap-1">
      <span className={`h-4 rounded-[0.5rem] ${faint}`} />
      <span className={`h-4 rounded-[0.5rem] ${accentSoft}`} />
      <span className={`h-4 rounded-[0.5rem] ${faint}`} />
    </span>
  );

  if (variant === 'mini') {
    return (
      <div className="flex h-[4.75rem] items-center" aria-hidden="true">
        <div className={`${frame} grid h-12 w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2`}>
          {iconShell('h-7 w-7')}
          <span className="grid min-w-0 gap-1">
            {meta(true)}
            <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5">
              <span
                className={`h-1.5 rounded-full ${accent}`}
                style={{ width: `${positionPercent}%` }}
              />
              <span className={`h-1.5 w-5 rounded-full ${muted}`} />
            </span>
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex h-[4.75rem] items-center" aria-hidden="true">
        <div className={`${frame} grid h-[4.1rem] w-full grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_1fr] gap-x-1.5 gap-y-1.5`}>
          {iconShell()}
          {meta()}
          {hasTilt ? modeChip : <span />}
          <span className="col-span-2 self-end">{positionSlider(58)}</span>
          <span className="justify-self-end self-end">{coverVisual('h-6', 'w-5')}</span>
        </div>
      </div>
    );
  }

  if (variant === 'standard') {
    return (
      <div className="flex h-[4.75rem] items-center" aria-hidden="true">
        <div className={`${frame} grid h-[4.45rem] w-full grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto_1fr] gap-x-2 gap-y-1.5`}>
          {iconShell()}
          {meta()}
          <span />
          <span className="col-span-3">{hasTilt ? tiltSegments : detailGrid}</span>
          <span className="col-span-2 self-end">{positionSlider(64, true)}</span>
          <span className="justify-self-end self-center">{coverVisual()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[4.75rem] items-center" aria-hidden="true">
      <div className={`${frame} grid h-[4.6rem] w-full grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_1fr_auto_auto] gap-x-2 gap-y-1`}>
        {iconShell()}
        {meta()}
        <span />
        <span className="col-span-3">{hasTilt ? tiltSegments : detailGrid}</span>
        <span className="col-span-2 self-center">{positionSlider(68, true)}</span>
        <span className="justify-self-end self-center">{coverVisual('h-9', 'w-8')}</span>
        <span className="col-span-3">{quickActions}</span>
      </div>
    </div>
  );
}
