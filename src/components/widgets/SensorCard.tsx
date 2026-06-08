import React, { useMemo } from 'react';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { getWidgetLogicalSize } from './cardLayout';
import { type GridEngineBreakpoint } from '../dashboard/dashboardBreakpointConfig';
import { resolveWidgetCardMode } from './cardMode';
import { type CardVariant, resolveCardVariant } from './cardVariant';

type SensorCardProps = {
  widget: Widget;
  isSelected: boolean;
  value: number;
  sensorHistory?: number[];
  isEditMode: boolean;
  onClick: () => void;
  liveEntity?: MockEntityState;
  batteryEntity?: MockEntityState;
  gridBreakpoint?: GridEngineBreakpoint;
  variant?: CardVariant;
};

type SensorTone = {
  base: string;
  soft: string;
  strong: string;
};

const SENSOR_MIN_ATTRIBUTE_KEYS = [
  'min',
  'min_value',
  'min_level',
  'min_db',
  'minimum',
  'suggested_display_precision_min',
];

const SENSOR_MAX_ATTRIBUTE_KEYS = [
  'max',
  'max_value',
  'max_level',
  'max_db',
  'maximum',
  'suggested_display_precision_max',
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) {
      return undefined;
    }
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readAttributeNumber(attributes: Record<string, unknown> | undefined, keys: string[]) {
  if (!attributes) {
    return undefined;
  }
  for (const key of keys) {
    const parsed = toFiniteNumber(attributes[key]);
    if (parsed !== undefined) {
      return parsed;
    }
  }
  return undefined;
}

function niceCeil(value: number) {
  if (!Number.isFinite(value)) {
    return 10;
  }
  if (value <= 0) {
    return 0;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  let step = 10;
  if (normalized <= 1) {
    step = 1;
  } else if (normalized <= 2) {
    step = 2;
  } else if (normalized <= 5) {
    step = 5;
  }
  return step * magnitude;
}

function niceFloor(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value >= 0) {
    return 0;
  }
  const magnitude = 10 ** Math.floor(Math.log10(Math.abs(value)));
  const normalized = Math.abs(value) / magnitude;
  let step = 10;
  if (normalized <= 1) {
    step = 1;
  } else if (normalized <= 2) {
    step = 2;
  } else if (normalized <= 5) {
    step = 5;
  }
  return -step * magnitude;
}

function resolveDefaultRange(unitLabel: string | undefined, numericValue: number) {
  const normalizedUnit = (unitLabel ?? '').trim().toLowerCase();
  if (normalizedUnit.includes('%')) {
    return { min: 0, max: 100 };
  }
  if (normalizedUnit.includes('db')) {
    return { min: 0, max: 120 };
  }
  if (normalizedUnit.includes('mbps')) {
    return { min: 0, max: 200 };
  }
  if (normalizedUnit === 'c' || normalizedUnit === '\u00b0c') {
    return { min: 0, max: 50 };
  }
  const positiveMax = niceCeil(Math.max(10, Math.abs(numericValue) * 1.8));
  return {
    min: numericValue < 0 ? niceFloor(numericValue * 1.2) : 0,
    max: Math.max(10, positiveMax),
  };
}

function resolveDisplayRange(
  numericValue: number,
  unitLabel: string | undefined,
  sensorHistory: number[] | undefined,
  liveEntity: MockEntityState | undefined,
) {
  const defaultRange = resolveDefaultRange(unitLabel, numericValue);
  const finiteHistory = (sensorHistory ?? []).filter((entry) => Number.isFinite(entry));
  const historyValues = finiteHistory.length > 0 ? finiteHistory : [numericValue];
  const historyMin = Math.min(...historyValues);
  const historyMax = Math.max(...historyValues);
  const attrMin = readAttributeNumber(liveEntity?.rawAttributes, SENSOR_MIN_ATTRIBUTE_KEYS);
  const attrMax = readAttributeNumber(liveEntity?.rawAttributes, SENSOR_MAX_ATTRIBUTE_KEYS);

  let min = attrMin ?? (finiteHistory.length >= 3 ? niceFloor(historyMin) : defaultRange.min);
  let max = attrMax ?? (finiteHistory.length >= 3 ? niceCeil(historyMax) : defaultRange.max);

  if (numericValue < min) {
    min = niceFloor(numericValue);
  }
  if (numericValue > max) {
    max = niceCeil(numericValue);
  }
  if (max <= min) {
    max = min + Math.max(1, Math.abs(min) * 0.25);
  }
  return { min, max };
}

function resolveTone(levelRatio: number): SensorTone {
  if (levelRatio < 0.45) {
    return {
      base: '#22c55e',
      soft: '#34d56b',
      strong: '#16a34a',
    };
  }
  if (levelRatio < 0.75) {
    return {
      base: '#e5c100',
      soft: '#f2cf00',
      strong: '#c9a700',
    };
  }
  return {
    base: '#f59e0b',
    soft: '#f7b733',
    strong: '#d97706',
  };
}

function SensorLevelGlyph({ color, activeBars = 3 }: { color: string; activeBars?: number }) {
  return (
    <svg viewBox="0 0 20 20" className="h-full w-full" fill="none" aria-hidden="true">
      {[
        { x: 1.5, y: 12.5, height: 6 },
        { x: 8.1, y: 9.2, height: 9.3 },
        { x: 14.7, y: 5.2, height: 13.3 },
      ].map((bar, index) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width="2.5"
          height={bar.height}
          rx="1.2"
          fill={color}
          opacity={index < activeBars ? 1 : 0.22}
        />
      ))}
    </svg>
  );
}
function parseBatteryPercentage(value: unknown) {
  const parsed = toFiniteNumber(value);
  if (parsed !== undefined) {
    return clamp(Math.round(parsed), 0, 100);
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const match = value.trim().replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return undefined;
  }
  const numeric = Number.parseFloat(match[0]);
  return Number.isFinite(numeric) ? clamp(Math.round(numeric), 0, 100) : undefined;
}

function resolveBatteryGlyphState(percentage: number | undefined) {
  const level = percentage === undefined ? 'unknown' : percentage <= 20 ? 'low' : percentage <= 50 ? 'medium' : 'high';
  const activeBars = percentage === undefined ? 0 : level === 'low' ? 1 : level === 'medium' ? 2 : 3;
  const color =
    level === 'low'
      ? '#fb7185'
      : level === 'medium'
        ? '#f59e0b'
        : level === 'high'
          ? '#22c55e'
          : '#8f96aa';
  return { activeBars, color };
}

function formatMainValue(value: number) {
  return String(Math.round(value));
}

function formatRangeValue(value: number) {
  const rounded = Math.round(value);
  return String(rounded);
}

function resolveHeading(title: string) {
  const trimmed = title.trim();
  if (!trimmed) {
    return 'Current sensor level';
  }
  const normalized = trimmed.toLowerCase();
  if (normalized.startsWith('current ')) {
    return trimmed;
  }
  return `Current ${normalized}`;
}

export function SensorCard({
  widget,
  isSelected,
  value,
  sensorHistory,
  isEditMode,
  onClick,
  liveEntity,
  batteryEntity,
  gridBreakpoint,
  variant,
}: SensorCardProps) {
  const numericValue = Number.isFinite(value) ? value : 0;
  const displayValue = formatMainValue(numericValue);
  const isWifi = widget.unit?.toLowerCase() === 'mbps';
  const unitLabel = isWifi ? `${widget.unit} Download` : widget.unit;
  const logicalSize = getWidgetLogicalSize(widget);
  const heightUnits = Math.max(1, Math.round(widget.layout.h));
  const resolvedCardMode = resolveWidgetCardMode(gridBreakpoint, logicalSize);
  const resolvedCardVariant = variant ?? resolveCardVariant(widget);
  const shouldUseSmVersionOnXs = gridBreakpoint === 'xs' && heightUnits >= 2;
  const cardMode = shouldUseSmVersionOnXs && resolvedCardMode === 'mini' ? 'compact' : resolvedCardMode;
  const cardVariant = shouldUseSmVersionOnXs && resolvedCardVariant === 'micro' ? 'compact' : resolvedCardVariant;
  const isMiniMode = cardVariant === 'micro' || cardMode === 'mini';
  const isCompactVariant = cardVariant === 'compact';
  const isCompactSingleRow = isCompactVariant && heightUnits <= 1;
  const isShortCard = heightUnits <= 2;
  const isCompactCard = isMiniMode || isCompactVariant || cardMode !== 'full';
  const cardRadiusClass = isCompactCard ? 'rounded-[1.55rem]' : 'rounded-[2rem]';
  const cardPaddingClass = isMiniMode
    ? 'px-2 py-1.5'
    : isShortCard
      ? 'px-[clamp(0.8rem,5cqi,1rem)] py-[clamp(0.65rem,7cqb,0.95rem)]'
      : isCompactCard
        ? 'px-3 py-2.5'
        : 'px-4 py-3.5';
  const titleClass = isShortCard ? 'text-[clamp(0.68rem,6.2cqi,0.9rem)]' : isCompactCard ? 'text-[0.78rem]' : 'text-[0.9rem]';
  const valueClass = isShortCard ? 'text-[clamp(2.05rem,22cqi,3.25rem)]' : isCompactCard ? 'text-[2.28rem]' : 'text-[3.1rem]';
  const unitClass = isShortCard ? 'text-[clamp(0.55rem,5cqi,0.76rem)]' : isCompactCard ? 'text-[0.66rem]' : 'text-[0.82rem]';
  const rangeLabelClass = isShortCard ? 'text-[clamp(0.55rem,4.8cqi,0.7rem)]' : isCompactCard ? 'text-[0.64rem]' : 'text-[0.8rem]';
  const rangeValueClass = isShortCard
    ? 'text-[clamp(0.58rem,5.4cqi,0.82rem)]'
    : isCompactCard
      ? 'text-[clamp(0.72rem,6cqi,0.95rem)]'
      : 'text-[clamp(0.86rem,7cqi,1.15rem)]';

  const displayRange = useMemo(
    () => resolveDisplayRange(numericValue, unitLabel, sensorHistory, liveEntity),
    [liveEntity, numericValue, sensorHistory, unitLabel],
  );
  const rangeSpan = Math.max(0.001, displayRange.max - displayRange.min);
  const levelRatio = clamp((numericValue - displayRange.min) / rangeSpan, 0, 1);
  const meterSplitRatio = clamp(0.2 + levelRatio * 0.6, 0.2, 0.8);
  const meterSplitPercent = `${(meterSplitRatio * 100).toFixed(1)}%`;
  const tone = resolveTone(levelRatio);
  const headingLabel = resolveHeading(widget.title);
  const hasConfiguredBatteryGlyph = Boolean(widget.sensorBatteryEntityId?.trim());
  const batteryPercentage =
    parseBatteryPercentage(batteryEntity?.numericValue) ??
    parseBatteryPercentage(batteryEntity?.state) ??
    parseBatteryPercentage(batteryEntity?.stateLabel) ??
    parseBatteryPercentage(liveEntity?.rawAttributes?.battery_level) ??
    parseBatteryPercentage(liveEntity?.rawAttributes?.battery);
  const batteryGlyph = resolveBatteryGlyphState(batteryPercentage);
  const miniGlyphColor = hasConfiguredBatteryGlyph ? batteryGlyph.color : tone.base;
  const miniGlyphActiveBars = hasConfiguredBatteryGlyph ? batteryGlyph.activeBars : 3;

  return (
    <div
        className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden ${cardRadiusClass} ${
        isSelected ? 'selection-corners' : ''
      }`}
      style={{ containerType: 'size' }}
    >
      <div
        className={`liquid-glass-card pointer-events-none relative h-full w-full min-h-0 min-w-0 overflow-hidden ${cardRadiusClass} ${cardPaddingClass}`}
      >
        {isMiniMode ? (
          <div className="relative flex h-full min-h-0 w-full flex-col justify-end">
            <div className="absolute right-0 top-0 h-4 w-4 shrink-0">
              <SensorLevelGlyph color={miniGlyphColor} activeBars={miniGlyphActiveBars} />
            </div>
            <div className="min-w-0 pr-4">
              <div className="flex max-w-full min-w-0 items-start justify-start text-left">
                <p className="max-w-full truncate text-[clamp(1.16rem,39cqi,1.52rem)] leading-[0.88] font-semibold text-white">
                  {displayValue}
                </p>
                {unitLabel ? (
                  <p className="ml-0.5 mt-0.5 max-w-[1.8rem] truncate text-[0.45rem] leading-none text-white/58">
                    {unitLabel}
                  </p>
                ) : null}
              </div>
              <p className="mt-0.5 max-w-full truncate text-[0.48rem] font-medium leading-none text-white/58">
                {widget.title}
              </p>
            </div>
          </div>
        ) : isCompactVariant ? (
          <div
            className={`relative flex h-full min-h-0 w-full ${
              isCompactSingleRow ? 'items-center justify-between gap-2' : 'flex-col justify-between'
            }`}
          >
            {isCompactSingleRow ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="max-w-full truncate text-[0.72rem] font-medium leading-none text-white/58">{widget.title}</p>
                  <div className="mt-0.5 flex min-w-0 items-start">
                    <p className="max-w-full truncate text-[clamp(1.02rem,9cqi,1.36rem)] leading-[0.9] font-semibold text-white">
                      {displayValue}
                    </p>
                    {unitLabel ? (
                      <p className="ml-0.5 mt-0.5 max-w-[2.4rem] truncate text-[0.48rem] leading-none text-white/58">{unitLabel}</p>
                    ) : null}
                  </div>
                </div>
                <div className="h-5 w-5 shrink-0">
                  <SensorLevelGlyph color={tone.base} />
                </div>
              </>
            ) : (
              <>
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-[0.75rem] font-medium text-white/58">{widget.title}</p>
                  <div className="h-5 w-5 shrink-0">
                    <SensorLevelGlyph color={tone.base} />
                  </div>
                </div>
                <div className="mt-2 min-w-0">
                  <div className="flex min-w-0 items-end gap-1.5">
                    <p className="text-[2rem] leading-none font-semibold text-white">{displayValue}</p>
                    {unitLabel ? (
                      <p className="mb-1 min-w-0 truncate text-[0.62rem] font-medium leading-none text-white/58">{unitLabel}</p>
                    ) : null}
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(levelRatio * 100).toFixed(1)}%`,
                        background: `linear-gradient(90deg, ${tone.soft} 0%, ${tone.strong} 100%)`,
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="relative flex h-full min-h-0 w-full flex-col">
            <div className={`flex min-w-0 items-start justify-between ${isShortCard ? 'gap-1.5' : 'gap-2'}`}>
              <div className="min-w-0">
                <p className={`truncate font-medium text-white/58 ${titleClass}`}>{headingLabel}</p>
                <div className={`${isShortCard ? 'mt-[clamp(0.15rem,2cqb,0.35rem)] gap-1' : 'mt-1 gap-1.5'} flex items-start`}>
                  <span className={`leading-none font-semibold text-white ${valueClass}`}>
                    {displayValue}
                  </span>
                  {unitLabel ? (
                    <span className={`mt-[0.42em] leading-none text-white/58 ${unitClass}`}>{unitLabel}</span>
                  ) : null}
                </div>
              </div>
              <div className={isShortCard ? 'h-[clamp(1.15rem,13cqb,1.7rem)] w-[clamp(1.15rem,13cqb,1.7rem)]' : isCompactCard ? 'h-7 w-7' : 'h-8 w-8'}>
                <SensorLevelGlyph color={tone.base} />
              </div>
            </div>

            <div className={`${isShortCard ? 'mt-[clamp(0.15rem,2.8cqb,0.4rem)]' : isCompactCard ? 'mt-2.5' : 'mt-3'} flex min-h-0 flex-1 flex-col justify-end`}>
              <div className={`${isShortCard ? 'mb-[clamp(0.08rem,1.6cqb,0.25rem)]' : 'mb-1.5'} flex items-center justify-between font-medium text-white/54 ${rangeLabelClass}`}>
                <span>Min</span>
                <span>Max</span>
              </div>
              <div
                className="relative grid min-h-0"
                style={{ height: isShortCard ? 'clamp(0.55rem, 11cqb, 1.15rem)' : isCompactCard ? '4.1rem' : '5.05rem' }}
              >
                <div className={`grid h-full ${isShortCard ? 'gap-1' : 'gap-2'}`} style={{ gridTemplateColumns: `${meterSplitPercent} minmax(0,1fr)` }}>
                  <div
                    className={`${isShortCard ? 'rounded-[0.55rem]' : 'rounded-[1rem]'} relative overflow-hidden border border-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.33)]`}
                    style={{ background: `linear-gradient(145deg, ${tone.soft} 0%, ${tone.strong} 100%)` }}
                  >
                    <div
                      className="absolute inset-0 opacity-70"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(110deg, rgba(255,255,255,0.26) 0px, rgba(255,255,255,0.26) 2px, rgba(255,255,255,0) 2px, rgba(255,255,255,0) 11px)',
                      }}
                    />
                    <span className={`${isShortCard ? 'bottom-0.5 left-1.5' : 'bottom-1.5 left-2'} absolute leading-none font-semibold text-white ${rangeValueClass}`}>
                      {formatRangeValue(numericValue)}
                    </span>
                  </div>
                  <div className={`${isShortCard ? 'rounded-[0.55rem]' : 'rounded-[1rem]'} relative overflow-hidden border border-white/[0.08] bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl`}>
                    <span className={`${isShortCard ? 'bottom-0.5 right-1.5' : 'bottom-1.5 right-2'} absolute leading-none font-medium text-white/72 ${rangeValueClass}`}>
                      {formatRangeValue(displayRange.max)}
                    </span>
                  </div>
                </div>
                <div
                  className={`${isShortCard ? 'bottom-1 top-1' : 'bottom-2 top-2'} pointer-events-none absolute w-[2px] rounded-full opacity-55`}
                  style={{ left: `calc(${meterSplitPercent} - 1px)`, backgroundColor: tone.base }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

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
