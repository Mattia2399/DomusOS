import React from 'react';
import type { WidgetDisplayVariant } from '../widgets/widgetDisplayVariant';

type LightDisplayVariantSkeletonProps = {
  variant: WidgetDisplayVariant;
  active: boolean;
  disabled: boolean;
};

export function LightDisplayVariantSkeleton({ variant, active, disabled }: LightDisplayVariantSkeletonProps) {
  const accent = active
    ? 'bg-[color:rgb(var(--ui-accent-rgb)/0.72)]'
    : disabled ? 'bg-[color:var(--ui-fill-tertiary)]' : 'bg-[color:var(--ui-text-tertiary)]';
  const soft = active
    ? 'bg-[color:rgb(var(--ui-accent-secondary-rgb)/0.3)]'
    : disabled ? 'bg-[color:var(--ui-fill-tertiary)]' : 'bg-[color:var(--ui-fill-secondary)]';
  const muted = disabled ? 'bg-[color:var(--ui-fill-tertiary)]' : 'bg-[color:var(--ui-fill-primary)]';
  const frame = 'dashboard-content-surface-soft overflow-hidden rounded-[0.82rem] p-2';

  const header = (
    <span className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5">
      <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${soft}`}>
        <span className={`h-2 w-2 rounded-full ${accent}`} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={`h-1.5 w-[74%] rounded-full ${muted}`} />
        <span className={`h-1 w-[48%] rounded-full ${soft}`} />
      </span>
      <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[0.48rem] border border-[color:var(--ui-border)] ${soft}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${accent}`} />
      </span>
    </span>
  );
  const controls = (
    <span className={`relative block h-7 min-w-0 overflow-hidden rounded-[0.68rem] border border-[color:var(--ui-border)] ${soft}`}>
      <span className={`absolute inset-y-0 left-0 w-[58%] rounded-l-[inherit] border-r border-white/25 bg-white/90`} />
      <span className="absolute inset-y-1 left-[58%] w-0.5 rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.25)]" />
    </span>
  );

  if (variant === 'mini') {
    return <div className="flex h-[4.75rem] items-center"><div className={`${frame} h-12 w-full`}>{header}</div></div>;
  }
  if (variant === 'compact') {
    return <div className="flex h-[4.75rem] items-center"><div className={`${frame} h-[3.45rem] w-full`}>{header}</div></div>;
  }
  if (variant === 'standard') {
    return (
      <div className="flex h-[4.75rem] items-center">
        <div className={`${frame} flex h-[4.2rem] w-full flex-col justify-between gap-2`}>{header}{controls}</div>
      </div>
    );
  }
  return (
    <div className="flex h-[4.75rem] items-center">
      <div className={`${frame} grid h-[4.35rem] w-full grid-cols-[0.48fr_0.52fr] grid-rows-[auto_1fr] gap-1.5`}>
        <span className="col-span-2">{header}</span>
        <span className="self-center">{controls}</span>
        <span className="grid grid-cols-3 gap-1 self-center">
          {[0, 1, 2].map((item) => <span key={item} className={`h-4 rounded-[0.35rem] ${item === 0 ? accent : soft}`} />)}
        </span>
      </div>
    </div>
  );
}
