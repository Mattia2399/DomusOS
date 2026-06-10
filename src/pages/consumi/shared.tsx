import React from 'react';
import { ArrowLeft } from 'lucide-react';

export type IntervalKey = '24H' | '7G' | '30G';

export function DetailScaffold({
  title,
  onBack,
  left,
  right,
}: {
  title: string;
  onBack: () => void;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto px-4 py-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:gap-6 sm:p-6 lg:p-8">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3.5 py-2 text-sm text-white/85 backdrop-blur-xl transition-colors hover:bg-white/14 sm:px-4"
        >
          <ArrowLeft size={16} />
          Torna indietro
        </button>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-12 xl:gap-8">
        <div className="liquid-glass-card relative flex min-h-[24rem] items-center justify-center overflow-hidden p-3 sm:min-h-[32rem] sm:p-6 lg:p-8 xl:col-span-7 xl:min-h-0">
          {left}
        </div>

        <div className="flex flex-col gap-4 overflow-visible pr-0 sm:gap-6 xl:col-span-5 xl:overflow-y-auto xl:pr-1">
          {right}
        </div>
      </div>
    </div>
  );
}

export function ChartCard({
  title,
  controls,
  children,
}: {
  title: string;
  controls?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="liquid-glass-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-white/55">{title}</p>
        {controls}
      </div>
      <div className="h-48 min-h-48 min-w-0 sm:h-56">{children}</div>
    </div>
  );
}

export function IntervalPills({
  value,
  onChange,
}: {
  value: IntervalKey;
  onChange: (value: IntervalKey) => void;
}) {
  const options: IntervalKey[] = ['24H', '7G', '30G'];
  return (
    <div className="flex rounded-full border border-white/[0.06] bg-white/[0.02] p-0.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full px-3 py-1 text-xs transition-all ${
            value === option
              ? 'bg-white/10 font-medium text-white shadow-sm backdrop-blur-md'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

type TooltipPayload = {
  name?: string;
  value?: string | number;
  color?: string;
};

export function PremiumTooltip({
  active,
  payload,
  label,
  suffix = '',
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
  suffix?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="liquid-glass-card rounded-xl px-3 py-2 text-sm text-white">
      {label !== undefined ? <p className="mb-1 text-xs text-white/60">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((item, index) => (
          <div key={`${item.name ?? 'value'}-${index}`} className="flex items-center justify-between gap-4">
            <span className="text-white/70">{item.name ?? 'Valore'}</span>
            <span className="font-semibold text-white">
              {item.value}
              {suffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function buildSeries(length: number, base: number, amplitude: number, phase = 0) {
  return Array.from({ length }, (_, index) => {
    const progress = length <= 1 ? 0 : index / (length - 1);
    const waveA = Math.sin(progress * Math.PI * 2 + phase) * amplitude;
    const waveB = Math.cos(progress * Math.PI * 3 + phase * 0.7) * amplitude * 0.35;
    return Math.max(0, Math.round((base + waveA + waveB) * 10) / 10);
  });
}
