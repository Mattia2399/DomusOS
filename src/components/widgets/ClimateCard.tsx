import React, { useEffect, useState } from 'react';
import { Flame, Minus, Plus, Snowflake, Wind } from 'lucide-react';
import type { DashboardStateShape } from '../../hooks/useDashboardState';
import { ROOT_CANVAS_ROW_UNITS, type Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { useCardSize } from './useCardSize';

type ClimateCardProps = {
  widget: Widget;
  state: DashboardStateShape;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  liveEntity?: MockEntityState;
  onTemperatureChange?: (nextTemp: number) => void;
  onTargetRangeChange?: (low: number, high: number) => void;
  onModeChange?: (nextMode: string) => void;
  onFanModeChange?: (nextMode: string) => void;
};

const CLIMATE_PENDING_TARGET_ATTRIBUTE_KEY = '__dashboard_pending_climate_target';
const CLIMATE_PENDING_FAN_ATTRIBUTE_KEY = '__dashboard_pending_climate_fan';

type ClimateSurface = {
  gradient: string;
  border: string;
  glow: string;
  iconSurface: string;
  controlSurface: string;
  fanAccent: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normalizeMode(value: string | undefined) {
  return (value ?? '').trim().toLowerCase();
}

function normalizeModes(modes: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const mode of modes) {
    const next = normalizeMode(mode);
    if (!next || seen.has(next)) {
      continue;
    }
    seen.add(next);
    normalized.push(next);
  }
  return normalized;
}

function toRgba(color: string, alpha: number) {
  const normalized = color.trim();
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const shortHex = /^#([0-9a-f]{3})$/i;
  const longHex = /^#([0-9a-f]{6})$/i;
  if (shortHex.test(normalized)) {
    const [, hex] = normalized.match(shortHex)!;
    const r = Number.parseInt(`${hex[0]}${hex[0]}`, 16);
    const g = Number.parseInt(`${hex[1]}${hex[1]}`, 16);
    const b = Number.parseInt(`${hex[2]}${hex[2]}`, 16);
    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
  }
  if (longHex.test(normalized)) {
    const [, hex] = normalized.match(longHex)!;
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
  }
  return normalized;
}

function formatFanModeLabel(mode: string) {
  if (mode === 'auto') {
    return 'Auto';
  }
  if (mode === 'quiet') {
    return 'Quiet';
  }
  if (mode === 'turbo') {
    return 'Turbo';
  }
  if (mode === 'low') {
    return 'Low';
  }
  if (mode === 'medium' || mode === 'med') {
    return 'Med';
  }
  if (mode === 'high') {
    return 'High';
  }
  if (mode === 'on') {
    return 'On';
  }
  if (mode === 'off') {
    return 'Off';
  }
  return mode.length ? mode.toUpperCase() : '--';
}

function toCanonicalClimateMode(value: string | undefined) {
  const normalized = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalized) {
    return '';
  }
  if (normalized === 'heating' || normalized === 'heat') {
    return 'heat';
  }
  if (normalized === 'cooling' || normalized === 'cool') {
    return 'cool';
  }
  if (normalized === 'drying' || normalized === 'dry') {
    return 'dry';
  }
  if (normalized === 'fan' || normalized === 'fan_only') {
    return 'fan_only';
  }
  if (normalized === 'heat_cool') {
    return 'heat_cool';
  }
  if (normalized === 'auto') {
    return 'auto';
  }
  if (normalized === 'off' || normalized === 'unavailable') {
    return 'off';
  }
  if (normalized === 'on') {
    return 'auto';
  }
  return normalized;
}

function resolveActiveMode(entity: MockEntityState | undefined, widget: Widget, state: DashboardStateShape) {
  const fallbackFromState =
    widget.id === 'climate.air_conditioner'
      ? toCanonicalClimateMode(state.climate.mode)
      : '';
  const fallbackFromWidget = toCanonicalClimateMode(widget.status);

  // Demo widget: mode selection in builder should immediately drive the card surface.
  if (widget.id === 'climate.air_conditioner' && fallbackFromState) {
    return fallbackFromState;
  }

  const rawAttributes = entity?.rawAttributes;
  const hvacMode =
    (typeof entity?.hvacMode === 'string' ? entity.hvacMode : undefined) ??
    (typeof rawAttributes?.hvac_mode === 'string' ? rawAttributes.hvac_mode : undefined) ??
    (typeof entity?.state === 'string' ? entity.state : undefined) ??
    '';
  const hvacAction =
    (typeof entity?.hvacAction === 'string' ? entity.hvacAction : undefined) ??
    (typeof rawAttributes?.hvac_action === 'string' ? rawAttributes.hvac_action : undefined) ??
    '';

  const mode = toCanonicalClimateMode(hvacMode);
  const action = toCanonicalClimateMode(hvacAction);

  if (mode === 'off') {
    return 'off';
  }
  if (action === 'heat') {
    return 'heat';
  }
  if (action === 'cool') {
    return 'cool';
  }
  if (action === 'dry') {
    return 'dry';
  }
  if (action === 'fan_only') {
    return 'fan_only';
  }
  if (mode) {
    return mode;
  }
  return fallbackFromState || fallbackFromWidget || (widget.isOn ? 'auto' : 'off');
}

function modeToLabel(mode: string) {
  if (mode === 'heat') {
    return 'Riscaldamento';
  }
  if (mode === 'cool') {
    return 'Raffrescamento';
  }
  if (mode === 'heat_cool' || mode === 'auto') {
    return 'Automatico';
  }
  if (mode === 'dry') {
    return 'Deumidifica';
  }
  if (mode === 'fan_only') {
    return 'Ventilazione';
  }
  if (mode === 'off') {
    return 'Spento';
  }
  return 'Inattivo';
}

function translateClimateStatus(status: string | undefined, fallback: string) {
  const raw = toTrimmedString(status);
  if (!raw) {
    return fallback;
  }
  const normalized = raw.toLowerCase().replace(/\s+/g, '_');
  if (normalized === 'heating' || normalized === 'heat') {
    return 'Riscaldamento';
  }
  if (normalized === 'cooling' || normalized === 'cool') {
    return 'Raffrescamento';
  }
  if (normalized === 'heat_cool' || normalized === 'auto' || normalized === 'automatic') {
    return 'Automatico';
  }
  if (normalized === 'dry' || normalized === 'drying' || normalized === 'dehumidify') {
    return 'Deumidifica';
  }
  if (normalized === 'fan' || normalized === 'fan_only' || normalized === 'ventilate') {
    return 'Ventilazione';
  }
  if (normalized === 'off') {
    return 'Spento';
  }
  if (normalized === 'idle') {
    return 'Inattivo';
  }
  if (normalized === 'unavailable') {
    return 'Non disponibile';
  }
  if (normalized === 'on') {
    return 'Acceso';
  }
  return raw;
}

function modeToSurface(mode: string): ClimateSurface {
  if (mode === 'heat') {
    return {
      gradient: 'from-[#ff8b45] via-[#f97332] to-[#ec5f22]',
      border: 'border-[#ffbc9a]/70',
      glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_12px_28px_rgba(226,104,41,0.24)]',
      iconSurface: 'bg-white/24 border border-white/26',
      controlSurface: 'bg-white/94 text-[#262626]',
      fanAccent: '#f97332',
    };
  }
  if (mode === 'cool') {
    return {
      gradient: 'from-[#4f78ff] via-[#4569f6] to-[#3958e9]',
      border: 'border-[#92abff]/70',
      glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_12px_28px_rgba(47,89,240,0.24)]',
      iconSurface: 'bg-white/20 border border-white/22',
      controlSurface: 'bg-white/95 text-[#1f2937]',
      fanAccent: '#4569f6',
    };
  }
  if (mode === 'heat_cool' || mode === 'auto') {
    return {
      gradient: 'from-[#3cbad1] via-[#2f9ad0] to-[#277ec0]',
      border: 'border-[#97d6e8]/65',
      glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_12px_28px_rgba(34,128,190,0.22)]',
      iconSurface: 'bg-white/20 border border-white/20',
      controlSurface: 'bg-white/94 text-[#1f2937]',
      fanAccent: '#2f9ad0',
    };
  }
  if (mode === 'dry') {
    return {
      gradient: 'from-[#8f7dfd] via-[#7a65ef] to-[#6953df]',
      border: 'border-[#b9adff]/65',
      glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.26),0_12px_28px_rgba(93,70,202,0.24)]',
      iconSurface: 'bg-white/20 border border-white/22',
      controlSurface: 'bg-white/94 text-[#262626]',
      fanAccent: '#7a65ef',
    };
  }
  if (mode === 'fan_only') {
    return {
      gradient: 'from-[#4a75f5] via-[#3a67ee] to-[#2f57dc]',
      border: 'border-[#8aa8ff]/65',
      glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_12px_28px_rgba(48,84,214,0.23)]',
      iconSurface: 'bg-white/20 border border-white/22',
      controlSurface: 'bg-white/94 text-[#262626]',
      fanAccent: '#3a67ee',
    };
  }
  return {
    gradient: 'from-[#394158] via-[#2f3650] to-[#252b3d]',
    border: 'border-white/30',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_24px_rgba(0,0,0,0.2)]',
    iconSurface: 'bg-white/18 border border-white/20',
    controlSurface: 'bg-white/90 text-[#262626]',
    fanAccent: '#64748b',
  };
}

function formatSingleTarget(value: number | undefined) {
  if (value === undefined) {
    return '--';
  }
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${Math.round(rounded)}` : rounded.toFixed(1);
}

function formatRangeTarget(low: number, high: number) {
  return `${Math.round(low)}-${Math.round(high)}`;
}

function normalizeTemperatureUnit(value: unknown) {
  const raw = toTrimmedString(value)?.toUpperCase();
  if (!raw) {
    return '\u00B0C';
  }
  if (raw === 'C' || raw === '\u00B0C') {
    return '\u00B0C';
  }
  if (raw === 'F' || raw === '\u00B0F') {
    return '\u00B0F';
  }
  return raw;
}

export function ClimateCard({
  widget,
  state,
  isSelected,
  isEditMode,
  onClick,
  liveEntity,
  onTemperatureChange,
  onTargetRangeChange,
  onFanModeChange,
}: ClimateCardProps) {
  const { ref: cardRef, width: cardWidth, height: cardHeight, density: cardDensity, hasSize: hasCardSize } = useCardSize({
    tinyWidth: 250,
    tinyHeight: 168,
    compactWidth: 340,
    compactHeight: 220,
  });
  const isDemoClimate = widget.id === 'climate.air_conditioner';
  const rawAttributes = liveEntity?.rawAttributes;
  const activeMode = resolveActiveMode(liveEntity, widget, state);
  const fallbackStatus = modeToLabel(activeMode);
  const statusLine = translateClimateStatus(
    toTrimmedString(liveEntity?.stateLabel) ??
      toTrimmedString(liveEntity?.hvacAction) ??
      toTrimmedString(rawAttributes?.hvac_action) ??
      toTrimmedString(liveEntity?.hvacMode) ??
      toTrimmedString(rawAttributes?.hvac_mode) ??
      toTrimmedString(liveEntity?.state) ??
      (isDemoClimate ? toTrimmedString(state.climate.status) ?? toTrimmedString(state.climate.mode) : undefined),
    fallbackStatus,
  );
  const currentTemp =
    toFiniteNumber(liveEntity?.currentValue) ??
    toFiniteNumber(rawAttributes?.current_temperature) ??
    (isDemoClimate ? toFiniteNumber(state.climate.currentTemp) : undefined);
  const targetTemp =
    toFiniteNumber(liveEntity?.targetValue) ??
    toFiniteNumber(rawAttributes?.temperature) ??
    (isDemoClimate ? toFiniteNumber(state.climate.targetTemp) : undefined);
  const targetTempLow =
    toFiniteNumber(liveEntity?.targetTempLow) ??
    toFiniteNumber(rawAttributes?.target_temp_low) ??
    (isDemoClimate ? toFiniteNumber(state.climate.targetTempLow) : undefined);
  const targetTempHigh =
    toFiniteNumber(liveEntity?.targetTempHigh) ??
    toFiniteNumber(rawAttributes?.target_temp_high) ??
    (isDemoClimate ? toFiniteNumber(state.climate.targetTempHigh) : undefined);
  const minTemp =
    toFiniteNumber(liveEntity?.minTemp) ??
    toFiniteNumber(rawAttributes?.min_temp) ??
    (isDemoClimate ? toFiniteNumber(state.climate.minTemp) : undefined);
  const maxTemp =
    toFiniteNumber(liveEntity?.maxTemp) ??
    toFiniteNumber(rawAttributes?.max_temp) ??
    (isDemoClimate ? toFiniteNumber(state.climate.maxTemp) : undefined);
  const targetStep =
    toFiniteNumber(liveEntity?.targetTempStep) ??
    toFiniteNumber(rawAttributes?.target_temp_step) ??
    (isDemoClimate ? toFiniteNumber(state.climate.targetTempStep) : undefined) ??
    0.5;
  const hasRangeTarget = targetTempLow !== undefined && targetTempHigh !== undefined;
  const fanModesFromAttributes = toStringArray(rawAttributes?.fan_modes);
  const fanModesSource =
    Array.isArray(liveEntity?.fanModes) && liveEntity.fanModes.length > 0
      ? liveEntity.fanModes
      : fanModesFromAttributes.length > 0
        ? fanModesFromAttributes
        : isDemoClimate
          ? (state.climate.fanModes ?? [])
          : [];
  const fanModes = normalizeModes(fanModesSource);
  const activeFanMode = normalizeMode(
    toTrimmedString(liveEntity?.fanMode) ??
      toTrimmedString(rawAttributes?.fan_mode) ??
      (isDemoClimate ? toTrimmedString(state.climate.fanMode) : undefined) ??
      fanModes[0],
  );

  const [localTarget, setLocalTarget] = useState<number | undefined>(targetTemp);
  const [localRange, setLocalRange] = useState<{ low: number; high: number } | null>(
    hasRangeTarget ? { low: targetTempLow, high: targetTempHigh } : null,
  );
  const [localFanMode, setLocalFanMode] = useState(activeFanMode);

  useEffect(() => {
    setLocalTarget(targetTemp);
  }, [targetTemp]);

  useEffect(() => {
    if (hasRangeTarget) {
      setLocalRange({ low: targetTempLow, high: targetTempHigh });
      return;
    }
    setLocalRange(null);
  }, [hasRangeTarget, targetTempHigh, targetTempLow]);

  useEffect(() => {
    setLocalFanMode(activeFanMode);
  }, [activeFanMode]);

  const safeMin = minTemp ?? Number.NEGATIVE_INFINITY;
  const safeMax = maxTemp ?? Number.POSITIVE_INFINITY;
  const safeStep = targetStep > 0 ? targetStep : 0.5;
  const surface = modeToSurface(activeMode);
  const targetPending = rawAttributes?.[CLIMATE_PENDING_TARGET_ATTRIBUTE_KEY] === true;
  const fanPending = rawAttributes?.[CLIMATE_PENDING_FAN_ATTRIBUTE_KEY] === true;
  const setToLabel = localRange
    ? formatRangeTarget(localRange.low, localRange.high)
    : formatSingleTarget(localTarget);
  const temperatureUnit = normalizeTemperatureUnit(
    rawAttributes?.temperature_unit ??
      liveEntity?.unit ??
      (isDemoClimate ? state.climate.temperatureUnit : undefined) ??
      widget.unit,
  );
  const currentTempLabel =
    currentTemp !== undefined ? `${currentTemp.toFixed(1)}${temperatureUnit}` : `--${temperatureUnit}`;
  const subtitleLine = `${statusLine} \u2022 ${currentTempLabel}`;
  const ModeIcon = activeMode === 'heat' ? Flame : activeMode === 'cool' ? Snowflake : Wind;
  const isLayoutDense = widget.layout.w <= 1 || widget.layout.h <= ROOT_CANVAS_ROW_UNITS;
  const isLayoutCompact = widget.layout.w <= 2 || widget.layout.h <= ROOT_CANVAS_ROW_UNITS + 1;
  const isDenseCard = cardDensity === 'tiny' || isLayoutDense;
  const isCompactClimateCard = isDenseCard || cardDensity === 'compact' || isLayoutCompact;
  const normalizedTitle = widget.title.trim();
  const isLongTitle = normalizedTitle.length >= (isDenseCard ? 12 : isCompactClimateCard ? 16 : 22);
  const fanModeMinHeight = ROOT_CANVAS_ROW_UNITS + 1;
  const hasFanModeControlSpace =
    widget.layout.w >= 2 &&
    widget.layout.h >= fanModeMinHeight &&
    (!hasCardSize || (cardWidth >= 200 && cardHeight >= 148));
  const showFanModeControl = fanModes.length > 0 && hasFanModeControlSpace && Boolean(onFanModeChange);
  const cardRadiusClass = isDenseCard ? 'rounded-[1.55rem]' : 'rounded-[1.9rem]';
  const cardPaddingClass = isDenseCard ? 'px-3 py-2.5' : isCompactClimateCard ? 'px-3.5 py-3' : 'px-4 py-4';
  const headerGapClass = isDenseCard ? 'gap-2.5' : isCompactClimateCard ? 'gap-2.5' : 'gap-3';
  const controlsGapClass = isDenseCard ? 'gap-2' : 'gap-2.5';
  const iconShellClass = isDenseCard
    ? 'h-8 w-8'
    : isCompactClimateCard
      ? 'h-9 w-9'
      : 'h-10 w-10';
  const titleClass = isDenseCard
    ? `leading-[1.08] font-normal text-white whitespace-normal break-words [overflow-wrap:anywhere] ${
        isLongTitle ? 'text-[clamp(0.78rem,1.5vw,0.9rem)]' : 'text-[clamp(0.84rem,1.7vw,0.98rem)]'
      }`
    : isCompactClimateCard
      ? `leading-[1.08] font-normal text-white whitespace-normal break-words [overflow-wrap:anywhere] ${
          isLongTitle ? 'text-[clamp(0.84rem,1.8vw,1.02rem)]' : 'text-[clamp(0.92rem,2vw,1.12rem)]'
        }`
      : `leading-[1.06] font-normal text-white whitespace-normal break-words [overflow-wrap:anywhere] ${
          isLongTitle ? 'text-[clamp(0.94rem,2.15vw,1.16rem)]' : 'text-[clamp(1.02rem,2.35vw,1.32rem)]'
        }`;
  const subtitleClass = isDenseCard
    ? 'line-clamp-1 mt-0.5 overflow-hidden text-[0.7rem] text-white/80'
    : isCompactClimateCard
      ? 'line-clamp-1 mt-0.5 overflow-hidden text-[0.78rem] text-white/80'
      : 'line-clamp-1 mt-0.5 overflow-hidden text-[0.9rem] text-white/80';
  const controlsClass = isDenseCard
    ? 'h-9 w-9'
    : isCompactClimateCard
      ? 'h-10 w-10'
      : 'h-12 w-12';
  const controlIconSize = isDenseCard ? 16 : isCompactClimateCard ? 17 : 20;
  const setPointClass = isDenseCard
    ? `text-[1.95rem] leading-none font-semibold tracking-tight drop-shadow-[0_6px_14px_rgba(0,0,0,0.16)] ${targetPending ? 'text-slate-200' : 'text-white'}`
    : isCompactClimateCard
      ? `text-[2.05rem] leading-none font-semibold tracking-tight drop-shadow-[0_6px_14px_rgba(0,0,0,0.16)] ${targetPending ? 'text-slate-200' : 'text-white'}`
      : `text-[2.2rem] leading-none font-semibold tracking-tight drop-shadow-[0_6px_14px_rgba(0,0,0,0.16)] ${targetPending ? 'text-slate-200' : 'text-white'}`;
  const unitClass = isDenseCard
    ? `mt-0.5 text-[0.58rem] leading-none font-semibold tracking-[0.18em] ${targetPending ? 'text-slate-300/85' : 'text-white/82'}`
    : isCompactClimateCard
      ? `mt-0.5 text-[0.62rem] leading-none font-semibold tracking-[0.18em] ${targetPending ? 'text-slate-300/85' : 'text-white/82'}`
      : `mt-1 text-[0.74rem] leading-none font-semibold tracking-[0.2em] ${targetPending ? 'text-slate-300/85' : 'text-white/82'}`;
  const fanModeIconIndex = Math.max(0, fanModes.findIndex((mode) => mode === 'auto'));
  const fanModesAreCrowded = fanModes.length > (isDenseCard ? 4 : isCompactClimateCard ? 5 : 7);
  const fanTrackClass = isDenseCard
    ? 'mx-auto mt-1.5 w-full rounded-[0.68rem] border p-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]'
    : isCompactClimateCard
      ? 'mx-auto mt-2 w-full rounded-[0.76rem] border p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]'
      : 'mx-auto mt-3 w-full rounded-[0.82rem] border p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]';
  const fanStepClass = isDenseCard ? 'h-5' : isCompactClimateCard ? 'h-6' : 'h-7';
  const fanCrowdedWidthClass = isDenseCard ? 'w-[1.45rem]' : isCompactClimateCard ? 'w-[1.7rem]' : 'w-[1.95rem]';
  const fanItemsClass = fanModesAreCrowded ? 'flex items-center gap-1 overflow-x-auto pr-0.5' : 'flex items-center gap-1';
  const fanItemsStyle: React.CSSProperties | undefined = fanModesAreCrowded
    ? { scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' as 'auto' | 'touch' }
    : undefined;
  const fanTrackStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    borderColor: toRgba(surface.fanAccent, 0.24),
    boxShadow: `inset 0 0 0 999px ${toRgba(surface.fanAccent, 0.08)}, inset 0 1px 0 rgba(255,255,255,0.78)`,
  };
  const titleLineClamp = isDenseCard ? 2 : isCompactClimateCard ? 3 : 3;
  const titleWrapStyle: React.CSSProperties = {
    display: '-webkit-box',
    WebkitLineClamp: titleLineClamp,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  return (
    <div
      ref={cardRef}
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden ${cardRadiusClass} ${
        isSelected ? 'selection-corners' : ''
      }`}
      onClick={(event) => {
        if (isEditMode) {
          return;
        }
        event.stopPropagation();
        onClick();
      }}
    >
      <div
        className={`relative h-full w-full min-h-0 min-w-0 overflow-hidden ${cardRadiusClass} border bg-gradient-to-br ${surface.gradient} ${surface.border} ${surface.glow} ${cardPaddingClass} flex flex-col ${
          isEditMode ? 'pointer-events-none' : ''
        }`}
      >
        <div className={`pointer-events-none absolute inset-0 ${cardRadiusClass} bg-[radial-gradient(95%_80%_at_15%_0%,rgba(255,255,255,0.22),transparent_64%)]`} />

        <div className={`relative flex items-start ${headerGapClass} min-w-0`}>
          <div
            className={`${iconShellClass} flex-shrink-0 rounded-full ${surface.iconSurface} flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]`}
          >
            <ModeIcon size={isDenseCard ? 16 : 18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={titleClass} style={titleWrapStyle}>
              {normalizedTitle}
            </p>
            <p className={subtitleClass}>{subtitleLine}</p>
          </div>
        </div>

        <div className={`relative mt-auto flex items-center justify-between ${controlsGapClass} ${isEditMode ? 'pointer-events-none' : ''}`}>
          <button
            type="button"
            className={`${controlsClass} rounded-full ${surface.controlSurface} flex items-center justify-center shadow-[0_12px_20px_rgba(0,0,0,0.2)] transition-transform active:scale-95`}
            onClick={(event) => {
              event.stopPropagation();
              if (localRange && onTargetRangeChange) {
                const nextLow = clamp(localRange.low - safeStep, safeMin, safeMax);
                const nextHigh = clamp(localRange.high - safeStep, safeMin, safeMax);
                const low = Math.min(nextLow, nextHigh);
                const high = Math.max(nextLow, nextHigh);
                setLocalRange({ low, high });
                onTargetRangeChange(low, high);
                return;
              }
              if (localTarget !== undefined && onTemperatureChange) {
                const next = clamp(localTarget - safeStep, safeMin, safeMax);
                setLocalTarget(next);
                onTemperatureChange(next);
              }
            }}
            aria-label="Diminuisci temperatura target"
          >
            <Minus size={controlIconSize} />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className={setPointClass}>
              {setToLabel}
            </p>
            <p className={unitClass}>
              {temperatureUnit}
            </p>
          </div>

          <button
            type="button"
            className={`${controlsClass} rounded-full ${surface.controlSurface} flex items-center justify-center shadow-[0_12px_20px_rgba(0,0,0,0.2)] transition-transform active:scale-95`}
            onClick={(event) => {
              event.stopPropagation();
              if (localRange && onTargetRangeChange) {
                const nextLow = clamp(localRange.low + safeStep, safeMin, safeMax);
                const nextHigh = clamp(localRange.high + safeStep, safeMin, safeMax);
                const low = Math.min(nextLow, nextHigh);
                const high = Math.max(nextLow, nextHigh);
                setLocalRange({ low, high });
                onTargetRangeChange(low, high);
                return;
              }
              if (localTarget !== undefined && onTemperatureChange) {
                const next = clamp(localTarget + safeStep, safeMin, safeMax);
                setLocalTarget(next);
                onTemperatureChange(next);
              }
            }}
            aria-label="Aumenta temperatura target"
          >
            <Plus size={controlIconSize} />
          </button>
        </div>

        {showFanModeControl ? (
          <div className={`relative ${isEditMode ? 'pointer-events-none' : ''}`}>
            <div className={fanTrackClass} style={fanTrackStyle}>
              <div className={fanItemsClass} style={fanItemsStyle}>
                {fanModes.map((entry, index) => {
                  const normalized = normalizeMode(entry);
                  const active = localFanMode === normalized;
                  const label = formatFanModeLabel(normalized);
                  const activeStyle = fanPending
                    ? {
                        backgroundColor: toRgba(surface.fanAccent, 0.52),
                        boxShadow: `0 4px 10px ${toRgba(surface.fanAccent, 0.24)}`,
                      }
                    : {
                        backgroundColor: toRgba(surface.fanAccent, 0.3),
                        boxShadow: `0 3px 8px ${toRgba(surface.fanAccent, 0.14)}`,
                      };
                  return (
                    <button
                      key={entry}
                      type="button"
                      className={`${fanStepClass} ${fanModesAreCrowded ? `${fanCrowdedWidthClass} shrink-0` : 'flex-1 min-w-0'} rounded-[0.58rem] flex items-center justify-center transition-colors ${
                        active
                          ? ''
                          : 'bg-transparent hover:bg-black/4'
                      }`}
                      style={active ? activeStyle : undefined}
                      onClick={(event) => {
                        event.stopPropagation();
                        setLocalFanMode(normalized);
                        onFanModeChange?.(normalized);
                      }}
                      aria-label={`Imposta fan mode ${label}`}
                      title={`Fan mode: ${label}`}
                    >
                      {index === fanModeIconIndex ? (
                        <Wind
                          size={fanModesAreCrowded ? (isDenseCard ? 11 : 12) : isDenseCard ? 12 : 13}
                          style={{ color: active ? '#ffffff' : toRgba(surface.fanAccent, 0.72) }}
                        />
                      ) : (
                        <span
                          className={`rounded-full transition-all ${
                            active ? 'h-2 w-2' : 'h-1.5 w-1.5'
                          }`}
                          style={{ backgroundColor: active ? '#ffffff' : toRgba(surface.fanAccent, 0.72) }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {isEditMode ? (
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
          className={`absolute inset-0 ${cardRadiusClass} widget-card-handle cursor-grab`}
          aria-label={`Apri ${widget.title}`}
        />
      ) : null}
    </div>
  );
}
