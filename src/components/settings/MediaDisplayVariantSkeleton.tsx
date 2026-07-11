import React from 'react';
import type { WidgetDisplayVariant } from '../widgets/widgetDisplayVariant';

type MediaDisplayVariantSkeletonProps = {
  variant: WidgetDisplayVariant;
  active: boolean;
  disabled: boolean;
};

export function MediaDisplayVariantSkeleton({
  variant,
  active,
  disabled,
}: MediaDisplayVariantSkeletonProps) {
  const accent = active
    ? 'bg-[color:rgb(var(--profile-sheet-accent-rgb)/0.76)]'
    : disabled
      ? 'bg-white/10'
      : 'bg-white/60';
  const soft = active
    ? 'bg-[color:rgb(var(--profile-sheet-accent-rgb-2)/0.30)]'
    : disabled
      ? 'bg-white/[0.05]'
      : 'bg-white/[0.13]';
  const muted = disabled ? 'bg-white/[0.07]' : 'bg-white/[0.22]';
  const frame =
    'overflow-hidden rounded-[0.82rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';

  const header = (compact = false) => (
    <span className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-1.5">
      <span className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} rounded-full ${accent}`} />
      <span className="flex min-w-0 flex-col gap-1">
        <span className={`h-1.5 ${compact ? 'w-[72%]' : 'w-[82%]'} rounded-full ${muted}`} />
        {!compact ? <span className={`h-1 w-[54%] rounded-full ${soft}`} /> : null}
      </span>
    </span>
  );

  const controls = (centerOnly = false) => (
    <span className={`flex items-center justify-center ${centerOnly ? 'gap-0' : 'gap-1.5'}`}>
      {!centerOnly ? <span className={`h-4 w-4 rounded-full ${soft}`} /> : null}
      <span className={`${centerOnly ? 'h-6 w-6' : 'h-5 w-5'} rounded-full ${accent}`} />
      {!centerOnly ? <span className={`h-4 w-4 rounded-full ${soft}`} /> : null}
    </span>
  );

  const progress = (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="relative h-1.5 overflow-hidden rounded-full bg-white/12">
        <span className={`absolute inset-y-0 left-0 w-[58%] rounded-full ${accent}`} />
      </span>
      <span className="flex justify-between">
        <span className={`h-1 w-4 rounded-full ${muted}`} />
        <span className={`h-1 w-4 rounded-full ${muted}`} />
      </span>
    </span>
  );

  const chips = (
    <span className="grid grid-cols-3 gap-1">
      {[0, 1, 2].map((item) => (
        <span key={item} className={`h-2.5 rounded-full ${item === 0 ? accent : soft}`} />
      ))}
    </span>
  );

  if (variant === 'mini') {
    return (
      <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
        <div className={`${frame} grid h-12 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2`}>
          {header(true)}
          {controls(true)}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
        <div className={`${frame} grid h-[4.1rem] w-full grid-rows-[auto_1fr] gap-1.5`}>
          {header()}
          <span className="self-end">{controls()}</span>
        </div>
      </div>
    );
  }

  if (variant === 'standard') {
    return (
      <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
        <div className={`${frame} grid h-[4.45rem] w-full grid-rows-[auto_1fr_auto] gap-1.5`}>
          {header()}
          <span className="self-center">{progress}</span>
          <span className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            {chips}
            {controls(true)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
      <div className={`${frame} grid h-[4.6rem] w-full grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_1fr_auto] gap-x-2 gap-y-1.5`}>
        <span className="col-span-2">{header()}</span>
        <span className="self-center">{progress}</span>
        <span className="self-center">{controls(true)}</span>
        <span className="col-span-2">{chips}</span>
      </div>
    </div>
  );
}
