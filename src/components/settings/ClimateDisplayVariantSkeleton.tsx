import React from 'react';
import type { WidgetDisplayVariant } from '../widgets/widgetDisplayVariant';

type ClimateDisplayVariantSkeletonProps = {
  variant: WidgetDisplayVariant;
  active: boolean;
  disabled: boolean;
};

export function ClimateDisplayVariantSkeleton({
  variant,
  active,
  disabled,
}: ClimateDisplayVariantSkeletonProps) {
  const accent = active
    ? 'bg-[color:rgb(var(--profile-sheet-accent-rgb)/0.76)]'
    : disabled
      ? 'bg-white/10'
      : 'bg-orange-300/60';
  const soft = active
    ? 'bg-[color:rgb(var(--profile-sheet-accent-rgb-2)/0.30)]'
    : disabled
      ? 'bg-white/[0.05]'
      : 'bg-white/[0.13]';
  const muted = disabled ? 'bg-white/[0.07]' : 'bg-white/[0.20]';
  const frame =
    'overflow-hidden rounded-[0.82rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.065),rgba(255,255,255,0.02))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';

  const header = (condensed = false) => (
    <span className="flex min-w-0 items-start justify-between gap-1.5">
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={`h-1.5 ${condensed ? 'w-[60%]' : 'w-[68%]'} rounded-full ${muted}`} />
        <span className={`h-1 w-[48%] rounded-full ${soft}`} />
      </span>
      <span className={`inline-flex ${condensed ? 'h-3.5 w-7' : 'h-4 w-8'} shrink-0 items-center justify-center gap-0.5 rounded-full border border-white/10 ${soft}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${accent}`} />
        <span className={`h-1 w-2 rounded-full ${muted}`} />
      </span>
    </span>
  );

  const target = (condensed = false) => (
    <span className="flex min-w-0 items-center justify-between gap-1.5">
      <span className={`rounded-full border border-white/10 ${soft} ${condensed ? 'h-4 w-4' : 'h-5 w-5'}`} />
      <span className="flex min-w-0 flex-1 flex-col items-center gap-1">
        <span className={`${condensed ? 'h-2.5 w-7' : 'h-3 w-9'} rounded-full ${accent}`} />
        <span className={`h-1 w-3 rounded-full ${muted}`} />
      </span>
      <span className={`rounded-full border border-white/10 ${soft} ${condensed ? 'h-4 w-4' : 'h-5 w-5'}`} />
    </span>
  );

  const fanRail = (
    <span className="grid grid-cols-5 gap-1 rounded-[0.46rem] border border-white/[0.08] bg-white/[0.035] p-1">
      {[0, 1, 2, 3, 4].map((item) => (
        <span key={item} className={`h-2 rounded-[0.25rem] ${item === 1 ? accent : soft}`} />
      ))}
    </span>
  );

  const detailsRail = (
    <span className="grid grid-cols-3 gap-1">
      {[0, 1, 2].map((item) => (
        <span key={item} className={`h-2.5 rounded-[0.3rem] border border-white/[0.07] ${item === 0 ? accent : soft}`} />
      ))}
    </span>
  );

  if (variant === 'mini' || variant === 'compact') {
    return (
      <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
        <div className={`${frame} flex h-[3.65rem] w-full flex-col justify-between gap-1`}>
          {header(true)}
          {target(true)}
        </div>
      </div>
    );
  }

  if (variant === 'standard') {
    return (
      <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
        <div className={`${frame} grid h-[4.35rem] w-full grid-cols-[0.48fr_0.52fr] grid-rows-[auto_1fr] gap-x-2 gap-y-1.5`}>
          <span className="col-span-2">{header()}</span>
          <span className="self-center">{target()}</span>
          <span className="self-center">{fanRail}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
      <div className={`${frame} grid h-[4.6rem] w-full grid-cols-[0.48fr_0.52fr] grid-rows-[auto_1fr_auto] gap-x-2 gap-y-1`}>
        <span className="col-span-2">{header()}</span>
        <span className="self-center">{target()}</span>
        <span className="self-center">{fanRail}</span>
        <span className="col-span-2">{detailsRail}</span>
      </div>
    </div>
  );
}
