import React from 'react';
import type { WidgetDisplayVariant } from '../widgets/widgetDisplayVariant';

type VacuumDisplayVariantSkeletonProps = {
  variant: WidgetDisplayVariant;
  active: boolean;
  disabled: boolean;
};

export function VacuumDisplayVariantSkeleton({
  variant,
  active,
  disabled,
}: VacuumDisplayVariantSkeletonProps) {
  const accent = active
    ? 'bg-[color:rgb(var(--ui-accent-rgb)/0.78)]'
    : disabled
      ? 'bg-[color:var(--ui-fill-tertiary)]'
      : 'bg-teal-300/70';
  const accentSoft = active
    ? 'bg-[color:rgb(var(--ui-accent-secondary-rgb)/0.22)]'
    : disabled
      ? 'bg-[color:var(--ui-fill-tertiary)]'
      : 'bg-cyan-300/[0.14]';
  const muted = disabled ? 'bg-[color:var(--ui-fill-tertiary)]' : 'bg-[color:var(--ui-fill-primary)]';
  const faint = 'bg-[color:var(--ui-fill-tertiary)]';
  const shell = 'dashboard-content-surface-soft relative h-[4.75rem] w-full overflow-hidden rounded-[0.82rem] p-2';

  const meta = (
    <span className="grid min-w-0 gap-1">
      <span className={`h-1.5 w-[72%] rounded-full ${muted}`} />
      <span className={`h-1 w-[45%] rounded-full ${accentSoft}`} />
    </span>
  );
  const action = (wide = true) => (
    <span className={`inline-flex h-5 items-center justify-center rounded-full border border-[color:var(--ui-border)] ${accentSoft} ${wide ? 'w-full' : 'w-5'}`}>
      <span className={`h-1.5 ${wide ? 'w-[42%]' : 'w-1.5'} rounded-full ${accent}`} />
    </span>
  );
  const robot = (
    <span className={`relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--ui-border-strong)] ${accent}`}>
      <span className="absolute top-1 h-1 w-1 rounded-full bg-[color:var(--ui-surface-glass-strong)]" />
      <span className="h-2.5 w-2.5 rounded-full border border-[color:var(--ui-border-strong)]" />
    </span>
  );
  const map = (height = 'h-8') => (
    <span className={`relative block ${height} overflow-hidden rounded-[0.62rem] border border-[color:var(--ui-border)] ${faint}`}>
      <span className="absolute inset-0 opacity-40 [background-image:linear-gradient(var(--ui-border)_1px,transparent_1px),linear-gradient(90deg,var(--ui-border)_1px,transparent_1px)] [background-size:8px_8px]" />
      <span className="absolute left-[22%] top-[58%] h-px w-[48%] rotate-[-15deg] border-t border-dashed border-[color:var(--ui-border-strong)]" />
      <span className="absolute left-[58%] top-[44%] -translate-x-1/2 -translate-y-1/2">{robot}</span>
    </span>
  );

  if (variant === 'mini') {
    return (
      <div className="flex h-[4.75rem] items-center" aria-hidden="true">
        <div className={`${shell} grid h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-2`}>
          {meta}
          {action(false)}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={shell} aria-hidden="true">
        <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          {meta}
          <span className={`h-3 w-6 rounded-full ${accentSoft}`} />
        </span>
        <span className="mt-1.5 grid grid-cols-[1fr_auto] items-center gap-2">
          {map('h-7')}
          {action(false)}
        </span>
      </div>
    );
  }

  if (variant === 'standard') {
    return (
      <div className={shell} aria-hidden="true">
        <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">{meta}<span className={`h-3 w-7 rounded-full ${accentSoft}`} /></span>
        <span className="mt-1.5 grid grid-cols-[1.35fr_0.65fr] gap-1.5">
          {map('h-9')}
          <span className="grid grid-rows-2 gap-1"><span className={`rounded-md ${faint}`} /><span className={`rounded-md ${accentSoft}`} /></span>
        </span>
      </div>
    );
  }

  return (
    <div className={shell} aria-hidden="true">
      <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">{meta}<span className={`h-3 w-7 rounded-full ${accentSoft}`} /></span>
      <span className="mt-1.5 grid grid-cols-[1.55fr_0.45fr] gap-1.5">
        {map('h-9')}
        <span className="grid grid-rows-3 gap-1"><span className={`rounded-md ${faint}`} /><span className={`rounded-md ${accentSoft}`} /><span className={`rounded-md ${faint}`} /></span>
      </span>
    </div>
  );
}
