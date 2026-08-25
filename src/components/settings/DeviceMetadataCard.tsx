import React from 'react';

export function parseBatteryPercentage(value?: string | number) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : undefined;
  }
  if (!value) return undefined;
  const match = value.trim().replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : undefined;
}

export function BatteryLevelGlyph({ percentage, compact = false }: { percentage?: number; compact?: boolean }) {
  const level = percentage === undefined ? 'unknown' : percentage <= 20 ? 'low' : percentage <= 50 ? 'medium' : 'high';
  const activeBars = percentage === undefined ? 0 : level === 'low' ? 1 : level === 'medium' ? 2 : 3;
  const colorClass =
    level === 'low'
      ? 'text-rose-300'
      : level === 'medium'
        ? 'text-amber-300'
        : level === 'high'
          ? 'text-emerald-300'
          : 'text-[color:var(--ui-text-secondary)]';

  return (
    <span
      className={`inline-flex ${compact ? 'h-[0.72rem] w-[1.14rem]' : 'h-[clamp(0.95rem,2.8vw,1.15rem)] w-[clamp(1.45rem,4.6vw,1.8rem)]'} ${colorClass}`}
    >
      <svg viewBox="0 0 28 16" className="h-full w-full" fill="none" aria-hidden="true">
        <rect x="1" y="2" width="22" height="12" rx="2.4" stroke="currentColor" strokeWidth="1.4" />
        <rect x="24.2" y="5.2" width="2.6" height="5.6" rx="1.2" fill="currentColor" />
        {[0, 1, 2].map((index) => (
          <rect
            key={index}
            x={4 + index * 5.4}
            y="4.4"
            width="3.4"
            height="7.2"
            rx="0.9"
            fill="currentColor"
            opacity={index < activeBars ? 1 : 0.18}
          />
        ))}
      </svg>
    </span>
  );
}

export function DeviceMetadataCard({
  icon,
  label,
  value,
  accentClass,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentClass?: string;
  valueClassName?: string;
}) {
  return (
    <div className="dashboard-content-surface-soft flex min-h-[clamp(6.5rem,22vw,8.25rem)] min-w-0 flex-col rounded-[clamp(0.95rem,3vw,1.2rem)] p-[clamp(0.7rem,2.2vw,1rem)]">
      <span
        className={`flex h-[clamp(2rem,6vw,2.5rem)] w-[clamp(2rem,6vw,2.5rem)] items-center justify-center rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] ${accentClass ?? 'text-[color:var(--ui-text-secondary)]'}`}
      >
        {icon}
      </span>
      <p className="mt-[clamp(0.45rem,1.6vw,0.7rem)] text-[clamp(0.66rem,1.8vw,0.78rem)] text-[color:var(--ui-text-tertiary)]">{label}</p>
      <p
        className={`mt-[clamp(0.2rem,0.9vw,0.35rem)] min-w-0 text-[clamp(1.2rem,4.4vw,1.7rem)] font-light leading-tight text-[color:var(--ui-text-primary)] ${valueClassName ?? ''}`}
      >
        {value}
      </p>
    </div>
  );
}
