import React from 'react';
import type { WidgetDisplayVariant } from '../widgets/widgetDisplayVariant';

type AlarmDisplayVariantSkeletonProps = {
  variant: WidgetDisplayVariant;
  active: boolean;
  disabled: boolean;
};

export function AlarmDisplayVariantSkeleton({ variant, active, disabled }: AlarmDisplayVariantSkeletonProps) {
  const accent = active
    ? 'bg-[color:rgb(var(--ui-accent-rgb)/0.72)]'
    : disabled
      ? 'bg-[color:var(--ui-fill-tertiary)]'
      : 'bg-emerald-200/60';
  const strong = disabled ? 'bg-[color:var(--ui-fill-tertiary)]' : 'bg-[color:var(--ui-fill-primary)]';
  const medium = disabled ? 'bg-[color:var(--ui-fill-tertiary)]' : 'bg-[color:var(--ui-fill-secondary)]';
  const subtle = 'bg-[color:var(--ui-fill-tertiary)]';
  const frame = 'dashboard-content-surface-soft relative overflow-hidden rounded-[0.82rem] p-2';
  const stateLine = <span className={`absolute inset-x-[20%] top-0 h-px ${accent}`} />;
  const action = <span className={`block h-3.5 w-full rounded-full border border-[color:var(--ui-border)] ${subtle}`} />;

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
        <span className="flex gap-0.5 rounded-[0.32rem] bg-[color:var(--ui-fill-tertiary)] p-0.5">
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
