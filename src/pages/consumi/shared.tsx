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
        <div className="relative flex min-h-[24rem] items-center justify-center overflow-hidden rounded-[1.65rem] border border-white/5 bg-white/5 p-3 backdrop-blur-2xl sm:min-h-[32rem] sm:rounded-[2rem] sm:p-6 lg:p-8 xl:col-span-7 xl:min-h-0">
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
    <div className="rounded-[1.65rem] border border-white/5 bg-white/5 p-4 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_34px_rgba(0,0,0,0.26)] sm:rounded-[2rem] sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-white/55">{title}</p>
        {controls}
      </div>
      <div className="h-48 sm:h-56">{children}</div>
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
    <div className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/6 p-1 backdrop-blur-xl">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium tracking-[0.08em] transition-colors ${
            value === option ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
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
    <div className="rounded-xl border border-white/10 bg-neutral-900/90 px-3 py-2 text-sm text-white backdrop-blur-md shadow-[0_16px_26px_rgba(0,0,0,0.42)]">
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
