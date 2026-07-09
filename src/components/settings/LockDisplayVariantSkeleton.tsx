import React from 'react';
import type { WidgetDisplayVariant } from '../widgets/widgetDisplayVariant';

type LockDisplayVariantSkeletonProps = {
  variant: WidgetDisplayVariant;
  active: boolean;
  disabled: boolean;
};

export function LockDisplayVariantSkeleton({ variant, active, disabled }: LockDisplayVariantSkeletonProps) {
  const accent = active
    ? 'bg-[color:rgb(var(--profile-sheet-accent-rgb)/0.72)]'
    : disabled
      ? 'bg-white/[0.08]'
      : 'bg-emerald-300/58';
  const soft = active
    ? 'bg-[color:rgb(var(--profile-sheet-accent-rgb-2)/0.22)]'
    : disabled
      ? 'bg-white/[0.045]'
      : 'bg-white/[0.11]';
  const medium = disabled ? 'bg-white/[0.075]' : 'bg-white/[0.20]';
  const frame =
    'relative overflow-hidden rounded-[0.82rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';

  const icon = (size = 'h-6 w-6') => (
    <span className={`inline-flex ${size} shrink-0 items-center justify-center rounded-full border border-white/[0.08] ${soft}`}>
      <span className={`h-[42%] w-[42%] rounded-full ${accent}`} />
    </span>
  );

  const meta = (
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className={`h-1.5 w-[68%] rounded-full ${medium}`} />
      <span className={`h-1 w-[46%] rounded-full ${soft}`} />
    </span>
  );

  const action = (
    <span className={`relative block h-3.5 w-full overflow-hidden rounded-full border border-white/[0.06] ${soft}`}>
      <span className={`absolute inset-y-0 left-0 w-[45%] rounded-full ${active ? accent : 'bg-white/[0.12]'}`} />
      <span className="absolute left-0.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-white/15 bg-white/55 shadow-[0_2px_5px_rgba(0,0,0,0.22)]" />
    </span>
  );

  if (variant === 'mini') {
    return (
      <div className="flex h-[4.75rem] items-center" aria-hidden="true">
        <div className={`${frame} flex h-[4.35rem] w-full flex-col justify-between gap-1.5`}>
          {meta}
          <span className="flex flex-1 items-center justify-center">
            {icon('h-8 w-8')}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex h-[4.75rem] items-center" aria-hidden="true">
        <div className={`${frame} flex h-[4.1rem] w-full flex-col justify-between gap-1.5`}>
          <span className="flex min-w-0 items-center gap-1.5">
            {icon()}
            {meta}
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${accent}`} />
          </span>
          {action}
        </div>
      </div>
    );
  }

  if (variant === 'standard') {
    return (
      <div className="flex h-[4.75rem] items-center" aria-hidden="true">
        <div className={`${frame} grid h-[4.35rem] w-full grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_1fr_auto] gap-1.5`}>
          <span className="row-span-2 self-center">{icon('h-9 w-9')}</span>
          {meta}
          <span className={`h-1.5 w-1.5 justify-self-end rounded-full ${accent}`} />
          <span className={`col-span-2 h-1.5 w-[72%] rounded-full ${soft}`} />
          <span className="col-span-3">{action}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[4.75rem] items-center" aria-hidden="true">
      <div className={`${frame} grid h-[4.6rem] w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-1.5`}>
        <span className="row-span-2 self-center">{icon('h-10 w-10')}</span>
        {meta}
        <span className={`h-1.5 w-1.5 justify-self-end rounded-full ${accent}`} />
        <span className={`h-1.5 w-[76%] rounded-full ${soft}`} />
        <span className="col-span-3 grid grid-cols-3 gap-1">
          <span className={`h-4 rounded-[0.45rem] ${soft}`} />
          <span className={`h-4 rounded-[0.45rem] ${soft}`} />
          <span className={`h-4 rounded-[0.45rem] ${soft}`} />
        </span>
        <span className="col-span-3 grid grid-cols-[1.35fr_1fr] gap-1">
          <span className={`h-2.5 rounded-full ${accent}`} />
          <span className={`h-2.5 rounded-full ${soft}`} />
        </span>
      </div>
    </div>
  );
}
