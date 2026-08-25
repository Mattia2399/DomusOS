import React from 'react';
import type { WidgetDisplayVariant } from '../widgets/widgetDisplayVariant';

type SwitchDisplayVariantSkeletonProps = {
  variant: WidgetDisplayVariant;
  active: boolean;
  disabled: boolean;
};

export function SwitchDisplayVariantSkeleton({
  variant,
  active,
  disabled,
}: SwitchDisplayVariantSkeletonProps) {
  const accent = active
    ? 'bg-[color:rgb(var(--ui-accent-rgb)/0.72)]'
    : disabled ? 'bg-[color:var(--ui-fill-tertiary)]' : 'bg-emerald-400/70';
  const soft = active
    ? 'bg-[color:rgb(var(--ui-accent-secondary-rgb)/0.28)]'
    : disabled ? 'bg-[color:var(--ui-fill-tertiary)]' : 'bg-[color:var(--ui-fill-secondary)]';
  const muted = disabled ? 'bg-[color:var(--ui-fill-tertiary)]' : 'bg-[color:var(--ui-fill-primary)]';
  const frame = 'dashboard-content-surface-soft overflow-hidden rounded-[0.82rem] p-2';

  const header = () => (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${soft}`}>
        <span className={`h-2 w-2 rounded-full ${accent}`} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={`h-1.5 w-[68%] rounded-full ${muted}`} />
        <span className={`h-1 w-[44%] rounded-full ${soft}`} />
      </span>
      <span className={`h-2 w-2 shrink-0 rounded-full ${accent}`} />
    </span>
  );

  const consumption = (
    <span className="flex min-w-0 flex-col gap-1 rounded-[0.45rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] px-1.5 py-1">
      <span className={`h-1 w-[46%] rounded-full ${soft}`} />
      <span className="flex items-end gap-1">
        <span className={`h-2.5 w-7 rounded-full ${accent}`} />
        <span className={`h-1.5 w-3 rounded-full ${muted}`} />
      </span>
    </span>
  );

  if (variant === 'mini') {
    return <div className="flex h-[4.75rem] items-center"><div className={`${frame} h-12 w-full`}>{header()}</div></div>;
  }
  if (variant === 'compact') {
    return <div className="flex h-[4.75rem] items-center"><div className={`${frame} h-[3.45rem] w-full`}>{header()}</div></div>;
  }
  if (variant === 'standard') {
    return (
      <div className="flex h-[4.75rem] items-center">
        <div className={`${frame} flex h-[4.2rem] w-full flex-col justify-between gap-1.5`}>
          {header()}
          {consumption}
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-[4.75rem] items-center">
      <div className={`${frame} flex h-[4.35rem] w-full flex-col justify-between gap-1.5`}>
        {header()}
        {consumption}
      </div>
    </div>
  );
}
