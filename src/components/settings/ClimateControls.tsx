import React, { useEffect, useMemo, useState } from 'react';
import { Droplets, Flame, Minus, Plus, Power, Snowflake, Sparkles, Sun, Thermometer, Wind } from 'lucide-react';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';
import { CircularTemperatureSlider, snapTemperatureToStep } from './CircularTemperatureSlider';
import { GlassButton } from '../ui/GlassButton';

interface ClimateControlsProps {
  climate: {
    name: string;
    mode: string;
    isOn: boolean;
    status?: string;
    currentTemp: number;
    targetTemp: number;
    minTemp: number;
    maxTemp: number;
    targetTempLow?: number;
    targetTempHigh?: number;
    targetTempStep?: number;
    hvacModes?: string[];
    hvacAction?: string;
    fanMode?: string;
    fanModes?: string[];
    presetMode?: string;
    presetModes?: string[];
    temperatureUnit?: string;
    rawAttributes?: Record<string, unknown>;
  };
  onTogglePower: () => void;
  onDecreaseTarget: () => void;
  onIncreaseTarget: () => void;
  onAutoAdjust: () => void;
  onRefreshCurrent: () => void;
  onSetTargetTemp?: (value: number) => void;
  onSetTargetRange?: (low: number, high: number) => void;
  onSetMode?: (mode: string) => void;
  onSetFanMode?: (mode: string) => void;
  onSetPresetMode?: (mode: string) => void;
  hideHeader?: boolean;
  density?: 'default' | 'compact';
}

const CLIMATE_PENDING_TARGET_ATTRIBUTE_KEY = '__dashboard_pending_climate_target';
const CLIMATE_PENDING_FAN_ATTRIBUTE_KEY = '__dashboard_pending_climate_fan';

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

function toPlausibleClimateTemperature(value: unknown, min?: number, max?: number): number | undefined {
  const nextValue = toFiniteNumber(value);
  if (nextValue === undefined) {
    return undefined;
  }
  if (min !== undefined && max !== undefined && max > min) {
    const tolerance = Math.max(12, (max - min) * 0.35);
    return nextValue >= min - tolerance && nextValue <= max + tolerance ? nextValue : undefined;
  }
  return nextValue > -80 && nextValue < 160 ? nextValue : undefined;
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

function normalizeMode(mode: string | undefined) {
  return (mode ?? '').trim().toLowerCase();
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

function modeIcon(mode: string, size = 16) {
  if (mode === 'heat') {
    return <Flame size={size} />;
  }
  if (mode === 'cool') {
    return <Snowflake size={size} />;
  }
  if (mode === 'auto' || mode === 'heat_cool') {
    return <Sparkles size={size} />;
  }
  if (mode === 'fan_only') {
    return <Wind size={size} />;
  }
  if (mode === 'dry') {
    return <Droplets size={size} />;
  }
  if (mode === 'off') {
    return <Power size={size} />;
  }
  return <Thermometer size={size} />;
}

function modeSelectorIcon(mode: string, size = 16) {
  if (mode === 'heat') {
    return <Sun size={size} />;
  }
  return modeIcon(mode, size);
}

function modeAccentIconClass(mode: string) {
  if (mode === 'heat') {
    return 'text-[#FF9F0A]';
  }
  if (mode === 'cool') {
    return 'text-[#0A84FF]';
  }
  if (mode === 'auto' || mode === 'heat_cool') {
    return 'text-[#32D74B]';
  }
  if (mode === 'dry') {
    return 'text-[#64D2FF]';
  }
  if (mode === 'fan_only') {
    return 'text-white';
  }
  if (mode === 'off') {
    return 'text-white/65';
  }
  return 'text-white';
}

function modeActiveButtonClass(mode: string) {
  if (mode === 'heat') {
    return 'border-[#FF9F0A]/45 bg-[#FF9F0A]/18 text-[#FF9F0A] shadow-[0_0_20px_rgba(255,159,10,0.35)]';
  }
  if (mode === 'cool') {
    return 'border-[#0A84FF]/45 bg-[#0A84FF]/18 text-[#0A84FF] shadow-[0_0_20px_rgba(10,132,255,0.35)]';
  }
  if (mode === 'auto' || mode === 'heat_cool') {
    return 'border-[#32D74B]/45 bg-[#32D74B]/18 text-[#32D74B] shadow-[0_0_20px_rgba(50,215,75,0.32)]';
  }
  if (mode === 'dry') {
    return 'border-[#64D2FF]/45 bg-[#64D2FF]/18 text-[#64D2FF] shadow-[0_0_20px_rgba(100,210,255,0.32)]';
  }
  if (mode === 'fan_only') {
    return 'border-white/[0.18] bg-white/[0.14] text-white shadow-[0_0_18px_rgba(255,255,255,0.16)]';
  }
  return 'border-white/[0.12] bg-white/[0.10] text-white/82 shadow-lg';
}

function modeSelectorLabel(mode: string) {
  if (mode === 'off') {
    return 'On/Off';
  }
  return formatModeLabel(mode);
}

function modeActionChipLabel(mode: string) {
  if (mode === 'off') {
    return 'Off';
  }
  if (mode === 'heat') {
    return 'Caldo';
  }
  if (mode === 'cool') {
    return 'Freddo';
  }
  if (mode === 'heat_cool' || mode === 'auto') {
    return 'Auto';
  }
  if (mode === 'fan_only') {
    return 'Ventola';
  }
  if (mode === 'dry') {
    return 'Dry';
  }
  return mode.length ? mode.replace(/[_-]+/g, ' ') : 'Mode';
}

type RoomClimateAction = {
  id: string;
  value: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  iconClassName: string;
};

function isEquivalentClimateMode(currentMode: string, candidateMode: string) {
  if (currentMode === candidateMode) {
    return true;
  }
  return (
    (currentMode === 'auto' && candidateMode === 'heat_cool') ||
    (currentMode === 'heat_cool' && candidateMode === 'auto')
  );
}

function titleCaseModeLabel(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function fanActionLabel(mode: string) {
  const normalized = normalizeMode(mode);
  if (normalized === 'auto') {
    return 'Auto';
  }
  if (normalized === 'low') {
    return 'Bassa';
  }
  if (normalized === 'medium' || normalized === 'mid') {
    return 'Media';
  }
  if (normalized === 'high') {
    return 'Alta';
  }
  if (normalized === 'turbo') {
    return 'Turbo';
  }
  if (normalized === 'silent' || normalized === 'quiet') {
    return 'Silenziosa';
  }
  return titleCaseModeLabel(mode);
}

function formatModeLabel(mode: string) {
  if (mode === 'heat') {
    return 'Riscaldamento';
  }
  if (mode === 'cool') {
    return 'Raffrescamento';
  }
  if (mode === 'heat_cool' || mode === 'auto') {
    return 'Automatico';
  }
  if (mode === 'fan_only') {
    return 'Ventilazione';
  }
  if (mode === 'dry') {
    return 'Deumidifica';
  }
  if (mode === 'off') {
    return 'Spento';
  }
  return mode.length ? mode : 'Inattivo';
}

function translateClimateStatus(status: string | undefined, fallback: string) {
  const raw = status?.trim();
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

export function ClimateControlsPanel({
  climate,
  onTogglePower,
  onDecreaseTarget,
  onIncreaseTarget,
  onAutoAdjust,
  onRefreshCurrent,
  onSetTargetTemp,
  onSetTargetRange,
  onSetMode,
  onSetFanMode,
  hideHeader = false,
  density = 'default',
}: ClimateControlsProps) {
  void onTogglePower;
  void onRefreshCurrent;

  const unit = climate.temperatureUnit?.trim() || '\u00B0C';
  const rawAttributes = climate.rawAttributes;

  const hvacModes = useMemo(() => {
    const source =
      Array.isArray(climate.hvacModes) && climate.hvacModes.length > 0
        ? climate.hvacModes
        : toStringArray(rawAttributes?.hvac_modes);
    const normalized = normalizeModes(source);
    const modesWithoutOff = normalized.filter((entry) => entry !== 'off');
    if (!modesWithoutOff.includes('auto')) {
      modesWithoutOff.push('auto');
    }
    return ['off', ...modesWithoutOff];
  }, [climate.hvacModes, rawAttributes]);

  const fanModes = useMemo(
    () =>
      Array.isArray(climate.fanModes) && climate.fanModes.length > 0
        ? climate.fanModes
        : toStringArray(rawAttributes?.fan_modes),
    [climate.fanModes, rawAttributes],
  );

  const mode = normalizeMode(climate.mode);
  const targetTemp = toFiniteNumber(climate.targetTemp);
  const targetLow = toFiniteNumber(climate.targetTempLow);
  const targetHigh = toFiniteNumber(climate.targetTempHigh);
  const hasRangeTarget = targetLow !== undefined && targetHigh !== undefined;
  const minTemp = toFiniteNumber(climate.minTemp);
  const maxTemp = toFiniteNumber(climate.maxTemp);
  const currentTemp = toPlausibleClimateTemperature(climate.currentTemp, minTemp, maxTemp);
  const step = toFiniteNumber(climate.targetTempStep) ?? 0.5;
  const activeFanMode = normalizeMode(climate.fanMode);
  const targetPending = rawAttributes?.[CLIMATE_PENDING_TARGET_ATTRIBUTE_KEY] === true;
  const fanPending = rawAttributes?.[CLIMATE_PENDING_FAN_ATTRIBUTE_KEY] === true;

  const [localTarget, setLocalTarget] = useState<number | undefined>(targetTemp);
  const [localRange, setLocalRange] = useState<{ low: number; high: number } | null>(
    hasRangeTarget ? { low: targetLow, high: targetHigh } : null,
  );
  const [localTargetPending, setLocalTargetPending] = useState(false);
  const [localFanMode, setLocalFanMode] = useState(activeFanMode);

  useEffect(() => {
    setLocalTarget(targetTemp);
    setLocalTargetPending(false);
  }, [targetTemp]);

  useEffect(() => {
    if (hasRangeTarget) {
      setLocalRange({ low: targetLow, high: targetHigh });
      setLocalTargetPending(false);
      return;
    }
    setLocalRange(null);
    setLocalTargetPending(false);
  }, [hasRangeTarget, targetHigh, targetLow]);

  useEffect(() => {
    if (!localTargetPending) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setLocalTargetPending(false), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [localTargetPending]);

  useEffect(() => {
    setLocalFanMode(activeFanMode);
  }, [activeFanMode]);

  const targetForProgress = localRange ? (localRange.low + localRange.high) / 2 : localTarget;
  const dialAccentColor = mode === 'heat' ? '#FF9F0A' : mode === 'cool' ? '#0A84FF' : '#32D74B';
  const dialGlowFilter =
    mode === 'heat'
      ? 'drop-shadow(0 0 15px rgba(255,159,10,0.4))'
      : mode === 'cool'
        ? 'drop-shadow(0 0 15px rgba(10,132,255,0.35))'
        : 'drop-shadow(0 0 10px rgba(50,215,75,0.26))';

  const translatedStatus = translateClimateStatus(
    climate.status ?? climate.hvacAction ?? climate.mode,
    formatModeLabel(mode),
  );
  const panelTitleStyle: React.CSSProperties = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };
  const isCompact = density === 'compact';
  const shellClass = isCompact
    ? 'flex flex-col gap-2 px-2.5 pt-2.5 pb-2.5 sm:gap-2.5 sm:px-3 sm:pt-3 sm:pb-3'
    : `${CONTEXT_PANEL_LAYOUT.shell} gap-3 sm:gap-4`;
  const sectionClass = isCompact
    ? 'liquid-glass-card rounded-[1.35rem] p-2.5 sm:p-3'
    : CONTEXT_PANEL_LAYOUT.sectionCompact;
  const dialSizeClass = isCompact
    ? 'max-w-[11.5rem] sm:max-w-[12rem] xl:max-w-[12.25rem]'
    : 'max-w-64';
  const stepButtonClass = isCompact
    ? 'h-9 w-9 rounded-full sm:h-10 sm:w-10'
    : 'h-11 w-11 rounded-full sm:h-12 sm:w-12';
  const alignButtonClass = isCompact
    ? 'h-9 min-w-0 rounded-full px-2.5 text-xs sm:h-10'
    : 'h-11 min-w-0 rounded-full px-3 text-sm sm:h-12';
  const modeButtonClass = isCompact ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-10 w-10 sm:h-11 sm:w-11';
  const targetValueClass = isCompact ? 'text-4xl sm:text-[2.5rem]' : 'text-5xl sm:text-6xl';
  const targetUnitClass = isCompact ? 'mt-1 text-base sm:text-lg' : 'mt-1.5 text-lg sm:text-xl';
  const currentTempClass = isCompact ? 'mt-1 text-xs' : 'mt-1.5 text-sm';
  const canUseCircularSlider = minTemp !== undefined && maxTemp !== undefined && maxTemp > minTemp;
  const isTargetPending = targetPending || localTargetPending;
  const applyPanelTargetValue = (value: number, commit: boolean) => {
    if (minTemp === undefined || maxTemp === undefined || maxTemp <= minTemp) {
      return;
    }
    const snappedValue = snapTemperatureToStep(clamp(value, minTemp, maxTemp), step, minTemp);
    setLocalTargetPending(true);
    if (localRange) {
      const rangeSize = Math.max(0, localRange.high - localRange.low);
      let low = snappedValue - rangeSize / 2;
      let high = snappedValue + rangeSize / 2;
      if (low < minTemp) {
        high = Math.min(maxTemp, high + (minTemp - low));
        low = minTemp;
      }
      if (high > maxTemp) {
        low = Math.max(minTemp, low - (high - maxTemp));
        high = maxTemp;
      }
      low = snapTemperatureToStep(clamp(low, minTemp, maxTemp), step, minTemp);
      high = snapTemperatureToStep(clamp(high, minTemp, maxTemp), step, minTemp);
      if (low > high) {
        [low, high] = [high, low];
      }
      setLocalRange({ low, high });
      if (commit) {
        onSetTargetRange?.(low, high);
      }
      return;
    }
    setLocalTarget(snappedValue);
    if (commit) {
      onSetTargetTemp?.(snappedValue);
    }
  };
  const updatePanelTargetByStep = (direction: -1 | 1) => {
    if (targetForProgress !== undefined && canUseCircularSlider) {
      applyPanelTargetValue(targetForProgress + direction * step, true);
      return;
    }
    if (direction < 0) {
      onDecreaseTarget();
      return;
    }
    onIncreaseTarget();
  };
  return (
    <div className={shellClass}>
      {!hideHeader ? (
        <div className={sectionClass}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-[clamp(2.6rem,6.2vw,3.2rem)] w-[clamp(2.6rem,6.2vw,3.2rem)] shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] text-white shadow-lg backdrop-blur-xl">
              {modeIcon(mode, 19)}
            </span>
            <div className="min-w-0">
              <h2
                className="text-[clamp(0.98rem,2.7vw,1.24rem)] leading-[1.08] font-semibold tracking-tight text-white whitespace-normal break-words [overflow-wrap:anywhere]"
                style={panelTitleStyle}
              >
                {climate.name}
              </h2>
              <p className="mt-0.5 line-clamp-2 text-[clamp(0.72rem,1.9vw,0.86rem)] text-white/58">{translatedStatus}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className={sectionClass}>
        <CircularTemperatureSlider
          value={targetForProgress}
          min={minTemp}
          max={maxTemp}
          step={step}
          unit={unit}
          accentColor={dialAccentColor}
          glowFilter={dialGlowFilter}
          pending={isTargetPending}
          disabled={!canUseCircularSlider}
          className={`mx-auto w-full ${dialSizeClass}`}
          onChange={(value) => applyPanelTargetValue(value, false)}
          onCommit={(value) => applyPanelTargetValue(value, true)}
        >
          <div
            className={`flex h-[72%] w-[72%] flex-col items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] px-3 text-center backdrop-blur-xl ${
              mode === 'heat' ? 'glow-active-orange' : mode === 'cool' ? 'glow-active-blue' : mode === 'auto' || mode === 'heat_cool' ? 'glow-active-green' : 'shadow-lg'
            }`}
          >
            <div className="flex items-start">
              <span className={`${targetValueClass} font-light leading-none tracking-tight transition-colors duration-200 ${isTargetPending ? 'text-white/58' : 'text-white'}`}>
                {localRange
                  ? `${Math.round(localRange.low)}-${Math.round(localRange.high)}`
                  : localTarget !== undefined
                    ? localTarget.toFixed(1)
                    : '--'}
              </span>
              <span className={`${targetUnitClass} transition-colors duration-200 ${isTargetPending ? 'text-white/46' : 'text-white/74'}`}>{unit}</span>
            </div>
            <p className={`${currentTempClass} text-white/56`}>
              {currentTemp !== undefined ? `Attuale ${currentTemp.toFixed(1)}${unit}` : 'Attuale non disponibile'}
            </p>
          </div>
        </CircularTemperatureSlider>

        <div className={`liquid-glass-card grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 p-1.5 ${isCompact ? 'mt-1' : 'mt-1.5'}`}>
          <GlassButton
            size="icon"
            className={stepButtonClass}
            onClick={() => updatePanelTargetByStep(-1)}
            aria-label="Diminuisci temperatura target"
          >
            <Minus size={18} />
          </GlassButton>

          <GlassButton
            className={alignButtonClass}
            onClick={() => {
              if (currentTemp !== undefined && canUseCircularSlider) {
                applyPanelTargetValue(currentTemp, true);
                return;
              }
              onAutoAdjust();
            }}
          >
            Align
          </GlassButton>

          <GlassButton
            size="icon"
            className={stepButtonClass}
            onClick={() => updatePanelTargetByStep(1)}
            aria-label="Aumenta temperatura target"
          >
            <Plus size={18} />
          </GlassButton>
        </div>
      </div>

      {hvacModes.length > 0 ? (
        <div className={sectionClass}>
          <p className={isCompact ? 'mb-2 text-[10px] uppercase tracking-[0.14em] text-white/42' : 'mb-3 text-xs uppercase tracking-[0.14em] text-white/48'}>Mode</p>
          <div className={isCompact ? 'liquid-glass-card px-2 py-2' : 'liquid-glass-card px-2.5 py-3'}>
            <div className={`${CONTEXT_PANEL_LAYOUT.rail} justify-center ${isCompact ? 'gap-1.5' : 'gap-2.5'}`}>
              {hvacModes.map((entry) => {
                const active = entry === mode;
                return (
                  <div key={entry} className={isCompact ? 'flex min-w-[2.65rem] shrink-0 flex-col items-center gap-1' : 'min-w-[3.15rem] shrink-0 flex flex-col items-center gap-1.5'}>
                    <button
                      type="button"
                      onClick={() => onSetMode?.(entry)}
                      className={`btn-premium relative ${modeButtonClass} rounded-full transition-all flex items-center justify-center ${
                        active
                          ? modeActiveButtonClass(entry)
                          : 'border border-white/[0.08] bg-white/[0.04] text-white/72 shadow-lg backdrop-blur-xl hover:border-white/[0.14] hover:bg-white/[0.08] hover:text-white'
                      }`}
                      title={modeSelectorLabel(entry)}
                      aria-label={`Imposta modalità ${modeSelectorLabel(entry)}`}
                    >
                      <span className={active ? modeAccentIconClass(entry) : ''}>{modeSelectorIcon(entry, 16)}</span>
                    </button>
                    <span className={`${isCompact ? 'text-[0.56rem]' : 'text-[0.64rem]'} uppercase tracking-[0.08em] ${active ? 'text-white' : 'text-white/65'}`}>
                      {modeActionChipLabel(entry)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {fanModes.length > 0 ? (
        <div className={sectionClass}>
          <div className={isCompact ? 'mb-2 flex items-center justify-between' : 'flex items-center justify-between mb-3'}>
            <p className={isCompact ? 'text-[10px] uppercase tracking-[0.14em] text-white/42' : 'text-xs uppercase tracking-[0.14em] text-white/48'}>Fan Mode</p>
          </div>
          <div className="flex justify-center">
            <div className={`${CONTEXT_PANEL_LAYOUT.rail} liquid-glass-card ${isCompact ? 'p-1' : 'p-1.5'}`}>
              {fanModes.map((entry) => {
                const normalized = normalizeMode(entry);
                const active = localFanMode === normalized;
                const pendingActive = fanPending && active;
                return (
                  <button
                    key={entry}
                    type="button"
                    className={`btn-premium relative ${isCompact ? 'h-8 min-w-[2.25rem] px-2 text-[0.66rem]' : 'h-10 min-w-[2.5rem] px-3 text-[0.72rem]'} shrink-0 rounded-full font-semibold uppercase tracking-[0.04em] transition-all ${
                      active
                        ? pendingActive
                          ? 'border border-[#0A84FF]/24 bg-[#0A84FF]/12 text-white/72 shadow-[0_0_14px_rgba(10,132,255,0.18)] backdrop-blur-xl'
                          : 'border border-[#0A84FF]/45 bg-[#0A84FF]/18 text-white shadow-[0_0_20px_rgba(10,132,255,0.35)] backdrop-blur-xl'
                        : 'border border-transparent bg-white/[0.04] text-white/72 hover:border-white/[0.12] hover:bg-white/[0.08] hover:text-white'
                    }`}
                    onClick={() => {
                      setLocalFanMode(normalized);
                      onSetFanMode?.(entry);
                    }}
                  >
                    {entry}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export const ClimateControls = ClimateControlsPanel;

export function RoomClimateCard({
  climate,
  onDecreaseTarget,
  onIncreaseTarget,
  onAutoAdjust,
  onRefreshCurrent,
  onSetTargetTemp,
  onSetTargetRange,
  onSetMode,
  onSetFanMode,
}: ClimateControlsProps) {
  void onAutoAdjust;
  void onRefreshCurrent;

  const unit = climate.temperatureUnit?.trim() || '\u00B0C';
  const rawAttributes = climate.rawAttributes;
  const hvacModes = useMemo(() => {
    const source =
      Array.isArray(climate.hvacModes) && climate.hvacModes.length > 0
        ? climate.hvacModes
        : toStringArray(rawAttributes?.hvac_modes);
    return normalizeModes(source);
  }, [climate.hvacModes, rawAttributes]);
  const fanModes = useMemo(
    () =>
      Array.isArray(climate.fanModes) && climate.fanModes.length > 0
        ? climate.fanModes
        : toStringArray(rawAttributes?.fan_modes),
    [climate.fanModes, rawAttributes],
  );
  const mode = normalizeMode(climate.mode);
  const fanMode = normalizeMode(climate.fanMode ?? (typeof rawAttributes?.fan_mode === 'string' ? rawAttributes.fan_mode : undefined));
  const targetTemp = toFiniteNumber(climate.targetTemp);
  const targetLow = toFiniteNumber(climate.targetTempLow);
  const targetHigh = toFiniteNumber(climate.targetTempHigh);
  const hasRangeTarget = targetLow !== undefined && targetHigh !== undefined;
  const minTemp = toFiniteNumber(climate.minTemp);
  const maxTemp = toFiniteNumber(climate.maxTemp);
  const currentTemp = toPlausibleClimateTemperature(climate.currentTemp, minTemp, maxTemp);
  const step = toFiniteNumber(climate.targetTempStep) ?? 0.5;
  const targetPending = rawAttributes?.[CLIMATE_PENDING_TARGET_ATTRIBUTE_KEY] === true;

  const [localTarget, setLocalTarget] = useState<number | undefined>(targetTemp);
  const [localRange, setLocalRange] = useState<{ low: number; high: number } | null>(
    hasRangeTarget ? { low: targetLow, high: targetHigh } : null,
  );
  const [localTargetPending, setLocalTargetPending] = useState(false);

  useEffect(() => {
    setLocalTarget(targetTemp);
    setLocalTargetPending(false);
  }, [targetTemp]);

  useEffect(() => {
    if (hasRangeTarget) {
      setLocalRange({ low: targetLow, high: targetHigh });
      setLocalTargetPending(false);
      return;
    }
    setLocalRange(null);
    setLocalTargetPending(false);
  }, [hasRangeTarget, targetHigh, targetLow]);

  useEffect(() => {
    if (!localTargetPending) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setLocalTargetPending(false), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [localTargetPending]);

  const targetForProgress = localRange ? (localRange.low + localRange.high) / 2 : localTarget;
  const dialAccentColor = mode === 'heat' ? '#FF9F0A' : mode === 'cool' ? '#0A84FF' : '#32D74B';
  const dialGlowFilter =
    mode === 'heat'
      ? 'drop-shadow(0 0 15px rgba(255,159,10,0.4))'
      : mode === 'cool'
        ? 'drop-shadow(0 0 15px rgba(10,132,255,0.35))'
        : 'drop-shadow(0 0 10px rgba(50,215,75,0.26))';
  const translatedStatus = translateClimateStatus(
    climate.status ?? climate.hvacAction ?? climate.mode,
    formatModeLabel(mode),
  );
  const hvacActions = useMemo<RoomClimateAction[]>(
    () =>
      hvacModes
        .filter((entry) => !['unavailable', 'unknown'].includes(normalizeMode(entry)))
        .map((entry) => {
          const normalized = normalizeMode(entry);
          return {
            id: `hvac:${normalized}`,
            value: entry,
            label: modeActionChipLabel(normalized),
            icon: modeSelectorIcon(normalized, 18),
            active: isEquivalentClimateMode(mode, normalized),
            iconClassName: modeAccentIconClass(normalized),
          };
        }),
    [hvacModes, mode],
  );
  const fanActions = useMemo<RoomClimateAction[]>(
    () =>
      fanModes
        .map((entry) => ({ entry, normalized: normalizeMode(entry) }))
        .filter(({ normalized }) => Boolean(normalized) && !['unknown', 'unavailable'].includes(normalized))
        .map(({ entry, normalized }) => ({
          id: `fan:${normalized}`,
          value: entry,
          label: fanActionLabel(entry),
          icon: <Wind size={18} />,
          active: fanMode === normalized,
          iconClassName: 'text-[#64D2FF]',
        })),
    [fanMode, fanModes],
  );
  const targetValue = localRange
    ? `${Math.round(localRange.low)}-${Math.round(localRange.high)}`
    : localTarget !== undefined
      ? `${Number.isInteger(localTarget) ? Math.round(localTarget) : localTarget.toFixed(1)}`
      : '--';
  const displayUnit = unit.includes('\u00B0') ? '\u00B0' : unit;
  const canUseCircularSlider = minTemp !== undefined && maxTemp !== undefined && maxTemp > minTemp;
  const isTargetPending = targetPending || localTargetPending;

  const applyTargetValue = (value: number, commit: boolean) => {
    if (minTemp === undefined || maxTemp === undefined || maxTemp <= minTemp) {
      return;
    }
    const snappedValue = snapTemperatureToStep(clamp(value, minTemp, maxTemp), step, minTemp);
    setLocalTargetPending(true);
    if (localRange) {
      const rangeSize = Math.max(0, localRange.high - localRange.low);
      let low = snappedValue - rangeSize / 2;
      let high = snappedValue + rangeSize / 2;
      if (low < minTemp) {
        high = Math.min(maxTemp, high + (minTemp - low));
        low = minTemp;
      }
      if (high > maxTemp) {
        low = Math.max(minTemp, low - (high - maxTemp));
        high = maxTemp;
      }
      low = snapTemperatureToStep(clamp(low, minTemp, maxTemp), step, minTemp);
      high = snapTemperatureToStep(clamp(high, minTemp, maxTemp), step, minTemp);
      if (low > high) {
        [low, high] = [high, low];
      }
      setLocalRange({ low, high });
      if (commit) {
        onSetTargetRange?.(low, high);
      }
      return;
    }
    setLocalTarget(snappedValue);
    if (commit) {
      onSetTargetTemp?.(snappedValue);
    }
  };

  const updateTargetByStep = (direction: -1 | 1) => {
    if (targetForProgress !== undefined && canUseCircularSlider) {
      applyTargetValue(targetForProgress + direction * step, true);
      return;
    }
    if (direction < 0) {
      onDecreaseTarget();
      return;
    }
    onIncreaseTarget();
  };
  const renderActionRail = (
    label: string,
    actions: RoomClimateAction[],
    onSelect: ((value: string) => void) | undefined,
  ) =>
    actions.length > 0 ? (
      <div className="flex w-full min-w-0 items-center justify-between gap-3">
        <p className="shrink-0 text-xs font-semibold tracking-tight text-white/50">{label}</p>
        <div className="scrollbar-none inline-flex min-w-0 max-w-[70%] items-center gap-1 overflow-x-auto overscroll-x-contain rounded-full border border-white/[0.055] bg-white/[0.045] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl [touch-action:pan-x]">
          {actions.map((action) => {
            const isFanRail = label === 'Ventilazione';
            const shouldShowFanLabel = isFanRail && /^[0-9]+$/.test(action.label);
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onSelect?.(action.value)}
                title={action.label}
                className={`group inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full px-3 transition-all duration-200 active:scale-95 ${
                  action.active
                    ? 'bg-white text-zinc-900 shadow-[0_10px_24px_rgba(255,255,255,0.22),inset_0_1px_0_rgba(255,255,255,0.65)]'
                    : 'text-white/56 hover:bg-white/[0.07] hover:text-white/82'
                }`}
                aria-label={`Imposta ${action.label}`}
              >
                {shouldShowFanLabel ? (
                  <span className="min-w-4 text-center text-xs font-bold tracking-tight">{action.label}</span>
                ) : (
                  <span>{action.icon}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <div className="flex h-full min-h-[32rem] max-h-[calc(100dvh-14rem)] flex-col justify-between overflow-hidden rounded-[inherit] px-5 py-5 md:min-h-[33rem] xl:min-h-[34rem]">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-[1.05rem] font-semibold leading-tight tracking-tight text-white">
            {climate.name || 'Termostato'}
          </h2>
          <p className="mt-1 truncate text-xs font-medium text-white/46">{translatedStatus}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-0 py-5">
        <CircularTemperatureSlider
          value={targetForProgress}
          min={minTemp}
          max={maxTemp}
          step={step}
          unit={unit}
          accentColor={dialAccentColor}
          glowFilter={dialGlowFilter}
          pending={isTargetPending}
          disabled={!canUseCircularSlider}
          className="mx-auto w-full max-w-[14.75rem] xl:max-w-[15.75rem]"
          onChange={(value) => applyTargetValue(value, false)}
          onCommit={(value) => applyTargetValue(value, true)}
        >
          <div className="flex h-[63%] w-[63%] flex-col items-center justify-center rounded-full bg-white/[0.025] text-center backdrop-blur-md">
            <div className="flex items-start">
              <span className={`text-[3.15rem] font-light leading-none tracking-tight transition-colors duration-200 ${isTargetPending ? 'text-white/58' : 'text-white'}`}>
                {targetValue}
              </span>
              <span className={`mt-1.5 text-xl transition-colors duration-200 ${isTargetPending ? 'text-white/46' : 'text-white/72'}`}>{displayUnit}</span>
            </div>
            <p className="mt-1.5 text-xs font-semibold tracking-tight text-white/45">
              {currentTemp !== undefined ? `Attuale ${currentTemp.toFixed(1)}${unit}` : 'Attuale non disponibile'}
            </p>
          </div>
        </CircularTemperatureSlider>

        <div className="-mt-8 flex items-center justify-center gap-3">
          <GlassButton
            size="icon"
            className="h-9 w-9 rounded-full border-white/[0.08] bg-white/[0.07] text-white/80 hover:bg-white/[0.11] hover:text-white"
            onClick={() => updateTargetByStep(-1)}
            aria-label="Diminuisci temperatura target"
          >
            <Minus size={17} />
          </GlassButton>
          <GlassButton
            size="icon"
            className="h-9 w-9 rounded-full border-white/[0.08] bg-white/[0.07] text-white/80 hover:bg-white/[0.11] hover:text-white"
            onClick={() => updateTargetByStep(1)}
            aria-label="Aumenta temperatura target"
          >
            <Plus size={17} />
          </GlassButton>
        </div>
      </div>

      {hvacActions.length > 0 || fanActions.length > 0 ? (
        <div className="shrink-0 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.035] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_18px_42px_rgba(0,0,0,0.14)] backdrop-blur-2xl">
          {renderActionRail('Modalità', hvacActions, onSetMode)}
          {hvacActions.length > 0 && fanActions.length > 0 ? <div className="my-2 h-px w-full bg-white/[0.055]" /> : null}
          {renderActionRail('Ventilazione', fanActions, onSetFanMode)}
        </div>
      ) : null}
    </div>
  );
}
