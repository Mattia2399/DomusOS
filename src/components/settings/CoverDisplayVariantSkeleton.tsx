import React from 'react';
import type { WidgetDisplayVariant } from '../widgets/widgetDisplayVariant';

type CoverDisplayVariantSkeletonProps = {
  variant: WidgetDisplayVariant;
  active: boolean;
  disabled: boolean;
};

export function CoverDisplayVariantSkeleton({
  variant,
  active,
  disabled,
}: CoverDisplayVariantSkeletonProps) {
  const accent = active
    ? 'bg-[color:rgb(var(--profile-sheet-accent-rgb)/0.74)]'
    : disabled
      ? 'bg-white/[0.08]'
      : 'bg-teal-300/60';
  const soft = active
    ? 'bg-[color:rgb(var(--profile-sheet-accent-rgb-2)/0.28)]'
    : disabled
      ? 'bg-white/[0.05]'
      : 'bg-white/[0.12]';
  const muted = disabled ? 'bg-white/[0.07]' : 'bg-white/[0.22]';
  const frame =
    'overflow-hidden rounded-[0.82rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';

  const header = (
    <span className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5">
      <span className={`h-5 w-5 rounded-full ${accent}`} />
      <span className="flex min-w-0 flex-col gap-1">
        <span className={`h-1.5 w-[78%] rounded-full ${muted}`} />
        <span className={`h-1 w-[54%] rounded-full ${soft}`} />
      </span>
      <span className={`h-3 w-9 rounded-full ${soft}`} />
    </span>
  );

  const rail = (height = 'h-11', width = 'w-5') => (
    <span className={`relative block ${height} ${width} overflow-hidden rounded-[0.45rem] border border-white/10 bg-white/[0.05]`}>
      <span className={`absolute inset-x-0 top-0 h-[58%] ${accent}`} />
      <span className="absolute inset-x-1 top-[58%] h-px bg-white/55" />
    </span>
  );

  const progress = (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="relative h-1.5 overflow-hidden rounded-full bg-white/12">
        <span className={`absolute inset-y-0 left-0 w-[64%] rounded-full ${accent}`} />
      </span>
      <span className="flex justify-between">
        <span className={`h-1 w-5 rounded-full ${muted}`} />
        <span className={`h-1 w-5 rounded-full ${muted}`} />
      </span>
    </span>
  );

  const tilt = (
    <span className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1">
      <span className={`h-1 w-5 rounded-full ${muted}`} />
      <span className="relative h-1.5 overflow-hidden rounded-full bg-white/12">
        <span className={`absolute inset-y-0 left-0 w-[38%] rounded-full ${accent}`} />
      </span>
      <span className={`h-1 w-4 rounded-full ${muted}`} />
    </span>
  );

  if (variant === 'mini') {
    return (
      <div className="flex h-[4.75rem] items-center" aria-hidden="true">
        <div className={`${frame} grid h-12 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2`}>
          <span className="flex min-w-0 flex-col gap-1">
            <span className={`h-1.5 w-[72%] rounded-full ${muted}`} />
            <span className={`h-1 w-[48%] rounded-full ${soft}`} />
          </span>
          {rail('h-9', 'w-4')}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex h-[4.75rem] items-center" aria-hidden="true">
        <div className={`${frame} grid h-[4.1rem] w-full grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_1fr] gap-1.5`}>
          <span className="col-span-2">{header}</span>
          <span className={`self-end h-2 w-[78%] rounded-full ${soft}`} />
          <span className="justify-self-end">{rail('h-8', 'w-4')}</span>
        </div>
      </div>
    );
  }

  if (variant === 'standard') {
    return (
      <div className="flex h-[4.75rem] items-center" aria-hidden="true">
        <div className={`${frame} grid h-[4.45rem] w-full grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_1fr_auto] gap-x-2 gap-y-1.5`}>
          <span className="col-span-2">{header}</span>
          <span className={`self-center h-2 w-[84%] rounded-full ${soft}`} />
          <span className="justify-self-end">{rail()}</span>
          <span className="col-span-2">{progress}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[4.75rem] items-center" aria-hidden="true">
      <div className={`${frame} grid h-[4.6rem] w-full grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_1fr_auto_auto] gap-x-2 gap-y-1`}>
        <span className="col-span-2">{header}</span>
        <span className={`self-center h-2 w-[88%] rounded-full ${soft}`} />
        <span className="justify-self-end">{rail('h-10', 'w-5')}</span>
        <span className="col-span-2">{progress}</span>
        <span className="col-span-2">{tilt}</span>
      </div>
    </div>
  );
}
