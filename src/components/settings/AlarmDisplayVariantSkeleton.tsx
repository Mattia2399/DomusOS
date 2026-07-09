import React from 'react';
import type { WidgetDisplayVariant } from '../widgets/widgetDisplayVariant';

type AlarmDisplayVariantSkeletonProps = {
  variant: WidgetDisplayVariant;
  active: boolean;
  disabled: boolean;
};

export function AlarmDisplayVariantSkeleton({ variant, active, disabled }: AlarmDisplayVariantSkeletonProps) {
  const accent = active
    ? 'bg-[color:rgb(var(--profile-sheet-accent-rgb)/0.72)]'
    : disabled
      ? 'bg-white/[0.08]'
      : 'bg-emerald-200/60';
  const strong = disabled ? 'bg-white/[0.10]' : 'bg-white/[0.28]';
  const medium = disabled ? 'bg-white/[0.07]' : 'bg-white/[0.17]';
  const subtle = disabled ? 'bg-white/[0.045]' : 'bg-white/[0.09]';
  const frame =
    'relative overflow-hidden rounded-[0.82rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.065),rgba(255,255,255,0.02))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';
  const stateLine = <span className={`absolute inset-x-[20%] top-0 h-px ${accent}`} />;
  const action = <span className={`block h-3.5 w-full rounded-full border border-white/[0.06] ${subtle}`} />;

  if (variant === 'mini' || variant === 'compact') {
    return (
      <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
        <div className={`${frame} flex h-[3.9rem] w-full flex-col`}>
          {stateLine}
          <span className="flex min-w-0 items-center gap-2">
            <span className={`h-5 w-5 shrink-0 rounded-full ${subtle}`} />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className={`h-1.5 w-[62%] rounded-full ${strong}`} />
              <span className={`h-1 w-[38%] rounded-full ${medium}`} />
            </span>
          </span>
          <span className="mt-auto">{action}</span>
        </div>
      </div>
    );
  }

  if (variant === 'standard') {
    return (
      <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
        <div className={`${frame} flex h-[4.35rem] w-full flex-col`}>
          {stateLine}
          <span className="flex items-center justify-between">
            <span className={`h-1 w-[42%] rounded-full ${medium}`} />
            <span className={`h-2.5 w-2.5 rounded-[0.2rem] ${accent}`} />
          </span>
          <span className="my-auto flex flex-col gap-1">
            <span className={`h-2 w-[58%] rounded-full ${strong}`} />
            <span className={`h-1 w-[72%] rounded-full ${medium}`} />
          </span>
          {action}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
      <div className={`${frame} flex h-[4.6rem] w-full flex-col gap-1`}>
        {stateLine}
        <span className="flex items-center justify-between">
          <span className={`h-1 w-[38%] rounded-full ${medium}`} />
          <span className={`h-2.5 w-2.5 rounded-[0.2rem] ${accent}`} />
        </span>
        <span className={`h-2 w-[52%] rounded-full ${strong}`} />
        <span className="flex gap-0.5 rounded-[0.32rem] bg-black/15 p-0.5">
          <span className={`h-2 flex-1 rounded-[0.25rem] ${accent}`} />
          <span className={`h-2 flex-1 rounded-[0.25rem] ${subtle}`} />
          <span className={`h-2 flex-1 rounded-[0.25rem] ${subtle}`} />
        </span>
        <span className="flex gap-1">
          <span className={`h-1 flex-1 rounded-full ${medium}`} />
          <span className={`h-1 w-[28%] rounded-full ${subtle}`} />
        </span>
        <span className="mt-auto">{action}</span>
      </div>
    </div>
  );
}
