import React, { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Clock3, Droplets } from 'lucide-react';
import type { SensorConnectionState } from './types';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';
import { ContextPanelHeader } from './ContextPanelHeader';
import { formatSensorNumericValue } from '../../utils/sensorValue';
import { resolveSensorVisualGroup, type SensorVisualGroup } from '../../utils/sensorPresentation';
import { SensorHeroVisual } from './SensorHeroVisual';

interface SensorControlsProps {
  name: string;
  status?: string;
  value?: number;
  unit?: string;
  displayPrecision?: number;
  entityId?: string;
  deviceClass?: string;
  history?: number[];
  battery?: string;
  connection?: string;
  connectionState?: SensorConnectionState;
}

type SensorChartKind = 'line' | 'bar';

const SENSOR_HISTORY_WINDOWS = [3, 6, 12, 24] as const;

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
  unit?: string;
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
      <div className="h-[clamp(8.5rem,28vw,10rem)] rounded-[clamp(0.9rem,3vw,1rem)] bg-white/[0.04] border border-white/8 p-[clamp(0.6rem,2.2vw,0.95rem)] flex items-center justify-center">
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
    <div className="h-[clamp(8.5rem,28vw,10rem)] rounded-[clamp(0.9rem,3vw,1rem)] bg-white/[0.04] border border-white/8 p-[clamp(0.6rem,2.2vw,0.95rem)]">
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
      <div className="h-[clamp(8.5rem,28vw,10rem)] rounded-[clamp(0.9rem,3vw,1rem)] bg-white/[0.04] border border-white/8 p-[clamp(0.6rem,2.2vw,0.95rem)] flex items-center justify-center">
        <p className="text-[clamp(0.66rem,1.8vw,0.76rem)] text-white/50">Nessun dato storico disponibile</p>
      </div>
    );
  }

  return (
    <div className="h-[clamp(8.5rem,28vw,10rem)] rounded-[clamp(0.9rem,3vw,1rem)] bg-white/[0.04] border border-white/8 p-[clamp(0.6rem,2.2vw,0.95rem)]">
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

function resolveSensorChartAccent(group: SensorVisualGroup) {
  if (group === 'energy') {
    return {
      stroke: 'rgba(255,214,10,0.86)',
      fill: 'rgba(255,214,10,0.10)',
    };
  }
  if (group === 'environment') {
    return {
      stroke: 'rgba(143,242,207,0.86)',
      fill: 'rgba(52,211,153,0.10)',
    };
  }
  if (group === 'fluid') {
    return {
      stroke: 'rgba(125,211,252,0.86)',
      fill: 'rgba(14,165,233,0.10)',
    };
  }
  if (group === 'measurement') {
    return {
      stroke: 'rgba(196,181,253,0.86)',
      fill: 'rgba(167,139,250,0.10)',
    };
  }
  return {
    stroke: 'rgba(148,163,184,0.86)',
    fill: 'rgba(148,163,184,0.10)',
  };
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
  displayPrecision = 0,
  entityId,
  deviceClass,
  history,
  battery,
  connection,
  connectionState,
}: SensorControlsProps) {
  const sensorValue = formatSensorNumericValue(value, displayPrecision) ?? '—';
  const [historyHours, setHistoryHours] = useState<(typeof SENSOR_HISTORY_WINDOWS)[number]>(24);
  const hasSensorValue = typeof value === 'number' && Number.isFinite(value);
  const visualGroup = resolveSensorVisualGroup(deviceClass);
  const chartAccent = resolveSensorChartAccent(visualGroup);
  const chartData = useMemo(() => {
    const historyValues = (history ?? []).filter((entry) => Number.isFinite(entry));
    if (historyValues.length < 2) {
      return [];
    }
    const visiblePoints = Math.max(2, Math.ceil((historyValues.length * historyHours) / 24));
    const values = historyValues.slice(-visiblePoints);
    return values.map((entry, index) => ({ index, value: entry }));
  }, [history, historyHours]);
  const average =
    chartData.length > 0
      ? chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length
      : null;
  const averageLabel =
    average !== null
      ? `Media ${formatSensorNumericValue(average, displayPrecision)}${unit && unit.trim().length > 0 ? ` ${unit}` : ''}`
      : 'Media --';
  const batteryValue = battery && battery.trim().length > 0 ? battery : 'N/D';
  const resolvedConnectionState = connectionState ?? 'unknown';
  const connectionLabel =
    connection && connection.trim().length > 0
      ? connection.trim()
      : resolvedConnectionState === 'offline'
        ? 'Disconnesso'
        : resolvedConnectionState === 'online'
          ? 'Connesso'
          : 'Stato sconosciuto';
  const connectionSubtitleClass =
    resolvedConnectionState === 'offline'
      ? 'text-rose-200/90'
      : resolvedConnectionState === 'online'
        ? 'text-emerald-200/90'
        : 'text-white/55';
  const connectionValue = connectionLabel;
  const batteryPercent = parseBatteryPercentage(batteryValue);
  return (
    <div className={`${CONTEXT_PANEL_LAYOUT.shell} gap-[clamp(0.7rem,2.4vw,1rem)]`}>
      <ContextPanelHeader
        title={name}
        subtitle={connectionLabel}
        icon={<Droplets size={22} />}
        fallbackTitle="Sensore"
        iconClassName="text-cyan-200"
        subtitleClassName={connectionSubtitleClass}
      />

      <div className={`${CONTEXT_PANEL_LAYOUT.sectionSoft} mb-1`}>
        <div className="aspect-square w-full max-w-[clamp(13rem,62vw,17.5rem)] mx-auto">
          <SensorHeroVisual
            group={visualGroup}
            value={sensorValue}
            numericValue={hasSensorValue ? value : undefined}
            unit={hasSensorValue ? unit : undefined}
            deviceClass={deviceClass}
            history={history}
            status={status}
          />
        </div>
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <span className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-white/48">
            <Clock3 size={14} />
            Andamento
          </span>
          <span className="shrink-0 text-xs font-semibold text-white/52">{averageLabel}</span>
        </div>

        <div className="liquid-segmented-control">
          <div className="grid grid-cols-4 gap-1">
            {SENSOR_HISTORY_WINDOWS.map((hours) => {
              const active = historyHours === hours;
              return (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setHistoryHours(hours)}
                  className={`flex h-9 min-w-0 items-center justify-center rounded-full text-xs font-semibold transition-all active:scale-[0.96] ${
                    active
                      ? 'liquid-segmented-option-active'
                      : 'liquid-segmented-option-inactive'
                  }`}
                  aria-pressed={active}
                  aria-label={`Mostra ultime ${hours} ore`}
                >
                  {hours}h
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 h-36 overflow-hidden rounded-[1.55rem] border border-white/[0.07] bg-black/[0.14] px-2 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]">
          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartAccent.stroke}
                  strokeWidth={2.2}
                  fill={chartAccent.fill}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-xs text-white/42">
              Nessun dato storico disponibile
            </div>
          )}
        </div>
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
