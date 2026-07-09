import React from 'react';
import type { WidgetDisplayVariant } from '../widgets/widgetDisplayVariant';

type LightDisplayVariantSkeletonProps = {
  variant: WidgetDisplayVariant;
  active: boolean;
  disabled: boolean;
};

export function LightDisplayVariantSkeleton({ variant, active, disabled }: LightDisplayVariantSkeletonProps) {
  const accent = active
    ? 'bg-[color:rgb(var(--profile-sheet-accent-rgb)/0.72)]'
    : disabled ? 'bg-white/10' : 'bg-white/34';
  const soft = active
    ? 'bg-[color:rgb(var(--profile-sheet-accent-rgb-2)/0.3)]'
    : disabled ? 'bg-white/[0.05]' : 'bg-white/[0.13]';
  const muted = disabled ? 'bg-white/[0.07]' : 'bg-white/[0.2]';
  const frame = 'overflow-hidden rounded-[0.82rem] border border-white/10 bg-white/[0.035] p-2';

  const header = (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${soft}`}>
        <span className={`h-2 w-2 rounded-full ${accent}`} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={`h-1.5 w-[74%] rounded-full ${muted}`} />
        <span className={`h-1 w-[48%] rounded-full ${soft}`} />
      </span>
    </span>
  );
  const controls = (
    <span className="flex items-center gap-1.5">
      <span className={`relative h-3.5 min-w-0 flex-1 overflow-hidden rounded-full ${soft}`}>
        <span className={`absolute inset-y-0 left-0 w-[58%] rounded-full ${accent}`} />
        <span className="absolute left-[52%] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-white/60 bg-white/80" />
      </span>
      <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${soft}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${accent}`} />
      </span>
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
