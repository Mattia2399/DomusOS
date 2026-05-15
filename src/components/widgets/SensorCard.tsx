import React, { useMemo } from 'react';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { getWidgetLogicalSize } from './cardLayout';
import { type GridEngineBreakpoint } from '../dashboard/dashboardBreakpointConfig';
import { resolveWidgetCardMode } from './cardMode';

type SensorCardProps = {
  widget: Widget;
  isSelected: boolean;
  value: number;
  sensorHistory?: number[];
  isEditMode: boolean;
  onClick: () => void;
  liveEntity?: MockEntityState;
  gridBreakpoint?: GridEngineBreakpoint;
};

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

const CHART_LINE_POINT_LIMIT = 18;
const CHART_BAR_POINT_LIMIT = 12;

function normalizeHintText(...parts: Array<string | undefined>) {
  return parts
    .map((part) => (part ?? '').trim().toLowerCase())
    .filter((part) => part.length > 0)
    .join(' ');
}

function hasKeyword(source: string, keywords: string[]) {
  return keywords.some((keyword) => source.includes(keyword));
}

function resolveSensorChartKind(
  unitLabel: string | undefined,
  title: string,
  entityId: string,
  liveEntity?: MockEntityState,
): SensorChartKind {
  const rawAttributes = liveEntity?.rawAttributes;
  const rawDeviceClass =
    typeof rawAttributes?.device_class === 'string'
      ? rawAttributes.device_class.trim().toLowerCase()
      : '';
  if (BAR_DEVICE_CLASSES.has(rawDeviceClass)) {
    return 'bar';
  }
  const hint = normalizeHintText(rawDeviceClass, unitLabel, title, entityId);
  if (hasKeyword(hint, BAR_KEYWORDS)) {
    return 'bar';
  }
  return 'line';
}

function downsampleSeries(values: number[], maxPoints: number) {
  if (values.length <= maxPoints) {
    return values;
  }
  const next: number[] = [];
  const safeDenominator = Math.max(1, maxPoints - 1);
  const step = (values.length - 1) / safeDenominator;
  for (let index = 0; index < maxPoints; index += 1) {
    const sourceIndex = Math.round(index * step);
    next.push(values[sourceIndex]);
  }
  return next;
}

function resolveChartSeries(values: number[] | undefined, kind: SensorChartKind) {
  const finiteValues = (values ?? []).filter((value) => Number.isFinite(value));
  if (finiteValues.length < 3) {
    return [];
  }
  const limit = kind === 'bar' ? CHART_BAR_POINT_LIMIT : CHART_LINE_POINT_LIMIT;
  return downsampleSeries(finiteValues.slice(-Math.max(limit * 2, 18)), limit);
}

function normalizeChartPoints(
  values: number[],
  width: number,
  height: number,
  paddingX: number,
  paddingTop: number,
  paddingBottom: number,
) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(0.001, max - min);
  return values.map((value, index) => {
    const progressX = values.length <= 1 ? 0 : index / (values.length - 1);
    const x = paddingX + progressX * (width - paddingX * 2);
    const progressY = (value - min) / spread;
    const y = height - paddingBottom - progressY * (height - paddingTop - paddingBottom);
    return { x, y };
  });
}

function SensorTrendPlaceholder({ compact }: { compact: boolean }) {
  const width = 260;
  const height = compact ? 36 : 44;
  const baselineY = Math.round(height * 0.62);
  return (
    <div className="h-full w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <path
          d={`M 0 ${baselineY} L ${width} ${baselineY}`}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={1}
          strokeDasharray="2.5 4"
        />
      </svg>
    </div>
  );
}

function SensorLineTrend({
  values,
  compact,
}: {
  values: number[];
  compact: boolean;
}) {
  if (values.length < 2) {
    return <SensorTrendPlaceholder compact={compact} />;
  }
  const width = 260;
  const height = compact ? 36 : 44;
  const paddingX = 0;
  const paddingTop = 4;
  const paddingBottom = 0;
  const points = normalizeChartPoints(values, width, height, paddingX, paddingTop, paddingBottom);
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
  const areaPath = [
    `M ${firstPoint.x.toFixed(2)} ${(height - paddingBottom).toFixed(2)}`,
    `L ${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)}`,
    ...points.slice(1).map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
    `L ${lastPoint.x.toFixed(2)} ${(height - paddingBottom).toFixed(2)}`,
    'Z',
  ].join(' ');

  return (
    <div className="h-full w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <path d={areaPath} fill="rgba(125,211,252,0.13)" />
        <path
          d={linePath}
          stroke="rgba(186,230,253,0.95)"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx={lastPoint.x} cy={lastPoint.y} r={2} fill="rgba(207,250,254,0.95)" />
      </svg>
    </div>
  );
}

function SensorBarTrend({
  values,
  compact,
}: {
  values: number[];
  compact: boolean;
}) {
  if (values.length < 2) {
    return <SensorTrendPlaceholder compact={compact} />;
  }
  const width = 260;
  const height = compact ? 36 : 44;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(0.001, max - min);
  const paddingX = 0;
  const paddingTop = 4;
  const paddingBottom = 0;
  const slotWidth = (width - paddingX * 2) / values.length;
  const barWidth = Math.max(3, slotWidth * 0.64);
  const barRadius = 1.1;
  const usableHeight = height - paddingTop - paddingBottom;

  return (
    <div className="h-full w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        {values.map((value, index) => {
          const ratio = (value - min) / spread;
          const barHeight = Math.max(1.5, ratio * usableHeight);
          const x = paddingX + index * slotWidth + (slotWidth - barWidth) / 2;
          const y = height - paddingBottom - barHeight;
          const isLast = index === values.length - 1;
          return (
            <rect
              key={`${index}-${value}`}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={barRadius}
              fill={isLast ? 'rgba(186,230,253,0.95)' : 'rgba(191,219,254,0.42)'}
            />
          );
        })}
      </svg>
    </div>
  );
}

export function SensorCard({
  widget,
  isSelected,
  value,
  sensorHistory,
  isEditMode,
  onClick,
  liveEntity,
  gridBreakpoint,
}: SensorCardProps) {
  const numeric = Number.isFinite(value) ? Math.round(value) : 0;
  const displayValue = String(numeric);
  const isWifi = widget.unit?.toLowerCase() === 'mbps';
  const unitLabel = isWifi ? `${widget.unit} Download` : widget.unit;
  const logicalSize = getWidgetLogicalSize(widget);
  const cardMode = resolveWidgetCardMode(gridBreakpoint, logicalSize);
  const isMiniMode = cardMode === 'mini';
  const isCompactCard = cardMode !== 'full';
  const cardRadiusClass = isCompactCard ? 'rounded-[1.55rem]' : 'rounded-3xl';
  const chartKind = resolveSensorChartKind(unitLabel, widget.title, widget.entityId, liveEntity);
  const chartSeries = useMemo(
    () => resolveChartSeries(sensorHistory, chartKind),
    [sensorHistory, chartKind],
  );
  const miniPaddingClass = 'px-3 py-2';
  const cardPaddingClass = isCompactCard ? 'px-3 py-2.5' : 'px-3.5 py-3';
  const titleClass = isCompactCard ? 'text-[0.82rem]' : 'text-[0.9rem]';
  const miniValueClass = 'text-[1.05rem]';
  const cardValueClass = isCompactCard ? 'text-[1.2rem]' : 'text-[1.35rem]';
  const miniUnitClass = 'text-[0.53rem]';
  const cardUnitClass = isCompactCard ? 'text-[0.56rem]' : 'text-[0.62rem]';
  const chartBleedClass = isCompactCard ? '-mx-3' : '-mx-3.5';
  const chartBottomBleedClass = isCompactCard ? '-mb-2.5' : '-mb-3';

  return (
    <div
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden ${cardRadiusClass} ${
        isSelected ? 'selection-corners' : ''
      }`}
    >
      {isMiniMode ? (
        <div
          className={`pointer-events-none relative h-full w-full min-h-0 min-w-0 ${cardRadiusClass} border border-white/10 bg-white/5 overflow-hidden ${miniPaddingClass}`}
        >
          <div
            className={`absolute inset-0 ${cardRadiusClass} bg-[radial-gradient(95%_78%_at_0%_0%,rgba(255,255,255,0.14),transparent_65%)]`}
          />
          <div className="relative flex h-full min-h-0 w-full items-center justify-between gap-2">
            <p className={`min-w-0 truncate leading-tight text-white/88 ${titleClass}`}>
              {widget.title}
            </p>
            <div className="min-w-0 shrink-0 text-right">
              <p className={`leading-none font-semibold tracking-tight text-white ${miniValueClass}`}>
                {displayValue}
              </p>
              {unitLabel ? (
                <p className={`mt-0.5 text-white/58 uppercase tracking-[0.14em] ${miniUnitClass}`}>
                  {unitLabel}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`pointer-events-none relative h-full w-full min-h-0 min-w-0 ${cardRadiusClass} border border-white/10 bg-white/5 overflow-hidden ${cardPaddingClass}`}
        >
          <div
            className={`absolute inset-0 ${cardRadiusClass} bg-[radial-gradient(95%_78%_at_0%_0%,rgba(255,255,255,0.14),transparent_65%)]`}
          />
          <div className="relative flex h-full min-h-0 w-full flex-col">
            <div className="flex items-start justify-between gap-2">
              <p className={`min-w-0 truncate leading-tight text-white/92 ${titleClass}`}>
                {widget.title}
              </p>
              <div className="min-w-0 shrink-0 text-right">
                <p className={`leading-none font-semibold tracking-tight text-white ${cardValueClass}`}>
                  {displayValue}
                </p>
                {unitLabel ? (
                  <p className={`mt-0.5 text-white/58 uppercase tracking-[0.14em] ${cardUnitClass}`}>
                    {unitLabel}
                  </p>
                ) : null}
              </div>
            </div>
            <div className={`${isCompactCard ? 'mt-1.5' : 'mt-2'} min-h-0 flex-1 w-full ${chartBleedClass} ${chartBottomBleedClass}`}>
              {chartKind === 'bar' ? (
                <SensorBarTrend values={chartSeries} compact={isCompactCard} />
              ) : (
                <SensorLineTrend values={chartSeries} compact={isCompactCard} />
              )}
            </div>
          </div>
        </div>
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            onClick();
          }
        }}
        className={`absolute inset-0 ${cardRadiusClass} widget-card-handle ${
          isEditMode ? 'cursor-grab' : 'cursor-pointer'
        }`}
        aria-label={`Apri ${widget.title}`}
      />
    </div>
  );
}
