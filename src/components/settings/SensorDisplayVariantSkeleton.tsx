import React from 'react';
import type { WidgetDisplayVariant } from '../widgets/widgetDisplayVariant';

type SensorDisplayVariantSkeletonProps = {
  variant: WidgetDisplayVariant;
  active: boolean;
  disabled: boolean;
};

export function SensorDisplayVariantSkeleton({
  variant,
  active,
  disabled,
}: SensorDisplayVariantSkeletonProps) {
  const accentClass = active
    ? 'bg-[color:rgb(var(--ui-accent-rgb)/0.72)]'
    : disabled
      ? 'bg-[color:var(--ui-fill-tertiary)]'
      : 'bg-[color:var(--ui-text-tertiary)]';
  const softClass = active
    ? 'bg-[color:rgb(var(--ui-accent-secondary-rgb)/0.34)]'
    : disabled
      ? 'bg-[color:var(--ui-fill-tertiary)]'
      : 'bg-[color:var(--ui-fill-secondary)]';
  const mutedClass = disabled ? 'bg-[color:var(--ui-fill-tertiary)]' : 'bg-[color:var(--ui-fill-primary)]';
  const chartClass = active
    ? 'text-[color:rgb(var(--ui-accent-rgb)/0.78)]'
    : disabled
      ? 'text-[color:var(--ui-text-disabled)]'
      : 'text-[color:var(--ui-text-tertiary)]';
  const surfaceClass =
    'dashboard-content-surface-soft overflow-hidden rounded-[0.82rem]';

  const statusGlyph = (
    <span className="inline-flex h-3.5 w-4 shrink-0 items-end justify-end gap-[2px]" aria-hidden="true">
      <span className={`h-[38%] w-[3px] rounded-full ${accentClass}`} />
      <span className={`h-[66%] w-[3px] rounded-full ${accentClass}`} />
      <span className={`h-full w-[3px] rounded-full ${accentClass}`} />
    </span>
  );

  const valueGlyph = (large = false) => (
    <span className="inline-flex min-w-0 items-end gap-1" aria-hidden="true">
      <span className={`${large ? 'h-4 w-10' : 'h-3.5 w-8'} rounded-full ${accentClass}`} />
      <span className={`mb-0.5 h-1.5 w-3 rounded-full ${mutedClass}`} />
    </span>
  );

  const trendGlyph = (extended = false) => (
    <span className="inline-flex min-w-0 items-center gap-1" aria-hidden="true">
      <svg viewBox="0 0 10 10" className={`h-2.5 w-2.5 shrink-0 ${chartClass}`} fill="none">
        <path d="M1.5 7.5 4.2 4.8 6 6.4 8.5 2.6M5.8 2.6h2.7v2.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`h-1.5 ${extended ? 'w-8' : 'w-5'} rounded-full ${softClass}`} />
      {extended ? <span className={`h-1.5 w-4 rounded-full ${mutedClass}`} /> : null}
    </span>
  );

  const chartGlyph = (tall = false) => (
    <span className="flex min-w-0 flex-col gap-1" aria-hidden="true">
      <span className="flex items-center justify-between gap-2">
        <span className={`h-1 w-4 rounded-full ${mutedClass}`} />
        <span className={`h-1 w-4 rounded-full ${mutedClass}`} />
      </span>
      <span className={`relative block min-w-0 overflow-hidden rounded-full border border-[color:var(--ui-border)] ${softClass} ${tall ? 'h-4' : 'h-3'}`}>
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className={`absolute inset-0 h-full w-full ${chartClass}`} fill="none">
          <polyline points="0,19 18,15 35,17 52,8 69,12 84,5 100,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </span>
  );

  const statsGlyph = (
    <span className="grid min-w-0 grid-cols-3 gap-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span key={index} className="flex min-w-0 flex-col gap-1">
          <span className={`h-1 w-[72%] rounded-full ${mutedClass}`} />
          <span className={`h-1.5 w-full rounded-full ${index === 1 ? accentClass : softClass}`} />
        </span>
      ))}
    </span>
  );

  if (variant === 'mini') {
    return (
      <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
        <div className={`${surfaceClass} grid h-12 w-full grid-cols-[minmax(0,1fr)_auto] grid-rows-[minmax(0,1fr)_auto] gap-x-2 px-2 py-1.5`}>
          <span className="self-end">{valueGlyph()}</span>
          <span className="self-start">{statusGlyph}</span>
          <span className={`col-span-2 h-1.5 w-[46%] self-end rounded-full ${softClass}`} />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
        <div className={`${surfaceClass} grid h-[4.7rem] w-[68%] min-w-[4.3rem] grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_minmax(0,1fr)_auto] gap-x-1.5 gap-y-1.5 p-2`}>
          <span className={`h-1.5 w-[82%] rounded-full ${softClass}`} />
          {statusGlyph}
          <span className="col-span-2 self-center">{valueGlyph(true)}</span>
          <span className="col-span-2 self-end">{trendGlyph()}</span>
        </div>
      </div>
    );
  }

  if (variant === 'standard') {
    return (
      <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
        <div className={`${surfaceClass} grid h-[4.1rem] w-full grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_minmax(0,1fr)_auto] gap-x-2 gap-y-1 px-2 py-1.5`}>
          <span className={`h-1.5 w-[52%] rounded-full ${softClass}`} />
          {statusGlyph}
          <span className="self-center">{valueGlyph(true)}</span>
          <span className="self-center">{trendGlyph()}</span>
          <span className="col-span-2">{chartGlyph()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[4.75rem] items-center justify-center" aria-hidden="true">
      <div className={`${surfaceClass} grid h-[4.25rem] w-full grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] grid-rows-[auto_minmax(0,1fr)_auto] gap-x-2 gap-y-1 px-2 py-1.5`}>
        <span className={`h-1.5 w-[72%] rounded-full ${softClass}`} />
        <span className="justify-self-end">{statusGlyph}</span>
        <span className="self-center">{valueGlyph(true)}</span>
        <span className="self-center">{chartGlyph(true)}</span>
        <span className="self-end">{trendGlyph(true)}</span>
        <span className="self-end">{statsGlyph}</span>
      </div>
    </div>
  );
}
