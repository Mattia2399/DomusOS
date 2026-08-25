import React from 'react';

export type DeviceTelemetryStripItem = {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
};

const TONE_CLASS: Record<NonNullable<DeviceTelemetryStripItem['tone']>, string> = {
  neutral: 'text-[color:var(--ui-text-secondary)]',
  success: 'text-[color:var(--ui-success)]',
  warning: 'text-[color:var(--ui-warning)]',
  danger: 'text-[color:var(--ui-danger)]',
};

export function DeviceTelemetryStrip({ items }: { items: DeviceTelemetryStripItem[] }) {
  if (items.length === 0) return null;

  return (
    <div
      className="dashboard-content-surface-soft grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-px overflow-hidden rounded-[1.15rem] p-1"
      aria-label="Informazioni dispositivo"
    >
      {items.map((item) => (
        <div key={item.id} className="flex min-w-0 items-center gap-2.5 rounded-[0.9rem] px-2.5 py-2">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] ${TONE_CLASS[item.tone ?? 'neutral']}`}
          >
            {item.icon}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[10px] font-medium leading-none text-[color:var(--ui-text-tertiary)]">
              {item.label}
            </span>
            <strong className="mt-1 block truncate text-[13px] font-semibold leading-none text-[color:var(--ui-text-primary)]">
              {item.value}
            </strong>
          </span>
        </div>
      ))}
    </div>
  );
}
