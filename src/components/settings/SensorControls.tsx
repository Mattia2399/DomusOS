import React, { useMemo } from 'react';
import { Clock3, Droplets } from 'lucide-react';
import type { SensorConnectionState } from './types';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';

interface SensorControlsProps {
  name: string;
  status?: string;
  value: number;
  unit: string;
  entityId?: string;
  deviceClass?: string;
  history?: number[];
  battery?: string;
  connection?: string;
  connectionState?: SensorConnectionState;
}

type SensorChartKind = 'line' | 'bar';

const BAR_DEVICE_CLASSES = new Set([
  'water',
  'volume',
  'precipitation',
  'precipitation_intensity',
  'rain',
  'gas',
]);

const BAR_KEYWORDS = [
  'lit',
  'liter',
  'litri',
  'lpm',
  'l/min',
  'm3',
  'm^3',
  'gall',
  'consum',
  'flow',
  'water',
  'rain',
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeHintText(...parts: Array<string | undefined>) {
  return parts
    .map((part) => (part ?? '').trim().toLowerCase())
    .filter((part) => part.length > 0)
    .join(' ');
}

function hasKeyword(source: string, keywords: string[]) {
  return keywords.some((keyword) => source.includes(keyword));
}

function resolveSensorChartKind({
  unit,
  name,
  entityId,
  deviceClass,
}: {
  unit: string;
  name: string;
  entityId?: string;
  deviceClass?: string;
}): SensorChartKind {
  const normalizedDeviceClass = (deviceClass ?? '').trim().toLowerCase();
  if (BAR_DEVICE_CLASSES.has(normalizedDeviceClass)) {
    return 'bar';
  }
  const hint = normalizeHintText(normalizedDeviceClass, unit, name, entityId);
  if (hasKeyword(hint, BAR_KEYWORDS)) {
    return 'bar';
  }
  return 'line';
}

function parseBatteryPercentage(value?: string) {
  if (!value) {
    return undefined;
  }
  const match = value.trim().replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return undefined;
  }
  const parsed = Number.parseFloat(match[0]);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return clamp(Math.round(parsed), 0, 100);
}

function BatteryLevelGlyph({ percentage }: { percentage?: number }) {
  const level = percentage === undefined ? 'unknown' : percentage <= 20 ? 'low' : percentage <= 50 ? 'medium' : 'high';
  const activeBars = percentage === undefined ? 0 : level === 'low' ? 1 : level === 'medium' ? 2 : 3;
  const colorClass =
    level === 'low'
      ? 'text-rose-300'
      : level === 'medium'
        ? 'text-amber-300'
        : level === 'high'
          ? 'text-emerald-300'
          : 'text-white/70';

  return (
    <span className={`inline-flex h-[clamp(0.95rem,2.8vw,1.15rem)] w-[clamp(1.45rem,4.6vw,1.8rem)] ${colorClass}`}>
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

function normalizeTrendLinePoints(values: number[], width: number, height: number, padding: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(0.001, max - min);
  return values.map((value, index) => {
    const progressX = values.length <= 1 ? 0 : index / (values.length - 1);
    const x = padding + progressX * (width - padding * 2);
    const progressY = (value - min) / spread;
    const y = height - padding - progressY * (height - padding * 2);
    return { x, y };
  });
}

function TrendLine({ values }: { values: number[] }) {
  if (values.length < 2) {
    return (
      <div className="h-[clamp(8.5rem,28vw,10rem)] rounded-[clamp(0.9rem,3vw,1rem)] bg-black/25 border border-white/8 p-[clamp(0.6rem,2.2vw,0.95rem)] flex items-center justify-center">
        <p className="text-[clamp(0.66rem,1.8vw,0.76rem)] text-white/50">Nessun dato storico disponibile</p>
      </div>
    );
  }

  const width = 320;
  const height = 108;
  const padding = 6;
  const points = normalizeTrendLinePoints(values, width, height, padding);
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
  const areaPath = [
    `M ${firstPoint.x.toFixed(2)} ${(height - padding).toFixed(2)}`,
    `L ${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)}`,
    ...points.slice(1).map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
    `L ${lastPoint.x.toFixed(2)} ${(height - padding).toFixed(2)}`,
    'Z',
  ].join(' ');

  return (
    <div className="h-[clamp(8.5rem,28vw,10rem)] rounded-[clamp(0.9rem,3vw,1rem)] bg-black/25 border border-white/8 p-[clamp(0.6rem,2.2vw,0.95rem)]">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" fill="none" aria-hidden="true">
        <path d={areaPath} fill="rgba(59,130,246,0.16)" />
        <path
          d={linePath}
          stroke="rgba(191,219,254,0.95)"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx={lastPoint.x} cy={lastPoint.y} r={2.6} fill="rgba(191,219,254,1)" />
      </svg>
    </div>
  );
}

function TrendBars({ values }: { values: number[] }) {
  const normalizedHeights = useMemo(() => {
    if (values.length === 0) {
      return [];
    }
    const max = Math.max(...values);
    const min = Math.min(...values);
    const spread = Math.max(1, max - min);
    return values.map((value) => {
      const ratio = (value - min) / spread;
      return Math.round(26 + ratio * 54);
    });
  }, [values]);

  if (normalizedHeights.length === 0) {
    return (
      <div className="h-[clamp(8.5rem,28vw,10rem)] rounded-[clamp(0.9rem,3vw,1rem)] bg-black/25 border border-white/8 p-[clamp(0.6rem,2.2vw,0.95rem)] flex items-center justify-center">
        <p className="text-[clamp(0.66rem,1.8vw,0.76rem)] text-white/50">Nessun dato storico disponibile</p>
      </div>
    );
  }

  return (
    <div className="h-[clamp(8.5rem,28vw,10rem)] rounded-[clamp(0.9rem,3vw,1rem)] bg-black/25 border border-white/8 p-[clamp(0.6rem,2.2vw,0.95rem)]">
      <div className="h-full flex items-end justify-between gap-[clamp(0.3rem,1vw,0.5rem)]">
        {normalizedHeights.map((height, index) => {
          const isLast = index === normalizedHeights.length - 1;
          return (
            <div
              key={`${index}-${height}`}
              className={`w-[clamp(0.34rem,1vw,0.52rem)] rounded-full transition-all ${isLast ? 'bg-[#3b82f6] shadow-[0_0_14px_rgba(59,130,246,0.45)]' : 'bg-white/20'}`}
              style={{ height: `${height}%` }}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
}

function MetadataCard({
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
    <div className="min-w-0 rounded-[clamp(0.95rem,3vw,1.2rem)] bg-white/5 backdrop-blur-md border border-white/8 p-[clamp(0.7rem,2.2vw,1rem)] min-h-[clamp(6.5rem,22vw,8.25rem)] flex flex-col">
      <span
        className={`h-[clamp(2rem,6vw,2.5rem)] w-[clamp(2rem,6vw,2.5rem)] rounded-full border border-white/10 bg-white/8 flex items-center justify-center ${accentClass ?? 'text-white/80'}`}
      >
        {icon}
      </span>
      <p className="mt-[clamp(0.45rem,1.6vw,0.7rem)] text-[clamp(0.66rem,1.8vw,0.78rem)] text-gray-400">{label}</p>
      <p
        className={`mt-[clamp(0.2rem,0.9vw,0.35rem)] min-w-0 text-[clamp(1.2rem,4.4vw,1.7rem)] leading-tight font-light text-white ${valueClassName ?? ''}`}
      >
        {value}
      </p>
    </div>
  );
}

export function SensorControlsPanel({
  name,
  status,
  value,
  unit,
  entityId,
  deviceClass,
  history,
  battery,
  connection,
  connectionState,
}: SensorControlsProps) {
  const sensorValue = Math.round(value);
  const chartValues = (history ?? []).filter((entry) => Number.isFinite(entry));
  const chartKind = useMemo(
    () =>
      resolveSensorChartKind({
        unit,
        name,
        entityId,
        deviceClass,
      }),
    [deviceClass, entityId, name, unit],
  );
  const average =
    chartValues.length > 0
      ? Math.round(chartValues.reduce((sum, item) => sum + item, 0) / chartValues.length)
      : null;
  const averageLabel =
    average !== null
      ? `Media: ${average}${unit && unit.trim().length > 0 ? ` ${unit}` : ''}`
      : 'Media: N/D';
  const batteryValue = battery && battery.trim().length > 0 ? battery : 'N/D';
  const resolvedConnectionState = connectionState === 'offline' ? 'offline' : 'online';
  const connectionLabel =
    connection && connection.trim().length > 0
      ? connection.trim()
      : resolvedConnectionState === 'offline'
        ? 'Disconnesso'
        : 'Connesso';
  const connectionSubtitleClass = resolvedConnectionState === 'offline' ? 'text-rose-200/90' : 'text-emerald-200/90';
  const connectionValue = connectionLabel;
  const batteryPercent = parseBatteryPercentage(batteryValue);
  void status;

  return (
    <div className={`${CONTEXT_PANEL_LAYOUT.shell} gap-[clamp(0.7rem,2.4vw,1rem)]`}>
      <div className={`${CONTEXT_PANEL_LAYOUT.sectionSoft} mb-1`}>
        <div className="flex min-w-0 items-center gap-[clamp(0.65rem,2.2vw,1rem)] pr-11">
          <div className="flex min-w-0 flex-1 items-center gap-[clamp(0.65rem,2.2vw,1rem)]">
            <span className="h-[clamp(2.6rem,6.2vw,3.2rem)] w-[clamp(2.6rem,6.2vw,3.2rem)] rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-cyan-200 shrink-0">
              <Droplets size={22} className="h-[clamp(1.05rem,3.1vw,1.35rem)] w-[clamp(1.05rem,3.1vw,1.35rem)]" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[clamp(0.98rem,2.8vw,1.3rem)] leading-[1.12] font-medium tracking-[-0.01em] text-white whitespace-normal break-words [overflow-wrap:anywhere] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden">
                {name || 'Sensore'}
              </h2>
              <p className={`mt-1 truncate text-xs ${connectionSubtitleClass}`}>{connectionLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.sectionSoft} mb-1`}>
        <div className="aspect-square w-full max-w-[clamp(12rem,58vw,15.75rem)] mx-auto rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.2)] flex flex-col items-center justify-center px-3 text-center">
          <div className="flex items-start">
            <span className="text-[clamp(2.85rem,12vw,4.4rem)] font-thin leading-none text-white">{sensorValue}</span>
            <span className="text-[clamp(1.3rem,5.4vw,1.95rem)] font-light text-gray-200 mt-[clamp(0.35rem,1.6vw,0.55rem)]">
              {unit || '%'}
            </span>
          </div>
          <p className="mt-[clamp(0.45rem,1.8vw,0.72rem)] text-[clamp(0.72rem,2.1vw,0.94rem)] leading-tight tracking-[0.01em] text-blue-400">
            Valore attuale
          </p>
        </div>
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.sectionSoft} mb-1`}>
        <div className="flex items-center justify-between mb-[clamp(0.55rem,1.9vw,0.9rem)]">
          <p className="text-[clamp(0.78rem,2vw,0.92rem)] text-white font-medium">Trend di oggi</p>
          <p className="text-[clamp(0.74rem,1.95vw,0.9rem)] text-gray-400">{averageLabel}</p>
        </div>
        {chartKind === 'bar' ? <TrendBars values={chartValues} /> : <TrendLine values={chartValues} />}
      </div>

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-[clamp(0.55rem,1.9vw,0.8rem)] mt-auto">
        <MetadataCard icon={<BatteryLevelGlyph percentage={batteryPercent} />} label="Batteria" value={batteryValue} />
        <MetadataCard
          icon={<Clock3 size={18} />}
          label="Connessione"
          value={connectionValue}
          valueClassName="text-[clamp(1rem,3.2vw,1.42rem)] leading-[1.12] [overflow-wrap:anywhere]"
        />
      </div>
    </div>
  );
}

export const SensorControls = SensorControlsPanel;
