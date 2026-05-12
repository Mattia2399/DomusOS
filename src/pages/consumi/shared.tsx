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
    <div className="w-full h-full p-8 flex flex-col gap-6 overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/85 backdrop-blur-xl transition-colors hover:bg-white/14"
        >
          <ArrowLeft size={16} />
          Torna indietro
        </button>
        <h2 className="text-3xl font-semibold tracking-tight text-white">{title}</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full min-h-0">
        <div className="relative xl:col-span-7 bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[2rem] overflow-hidden flex items-center justify-center p-8">
          {left}
        </div>

        <div className="xl:col-span-5 flex flex-col gap-6 overflow-y-auto pr-1">
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
    <div className="rounded-[2rem] border border-white/5 bg-white/5 p-5 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_34px_rgba(0,0,0,0.26)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-white/55">{title}</p>
        {controls}
      </div>
      <div className="h-56">{children}</div>
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
