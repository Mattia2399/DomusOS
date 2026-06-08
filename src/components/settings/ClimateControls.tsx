import React, { useEffect, useMemo, useState } from 'react';
import { Droplets, Flame, Minus, Plus, Power, Snowflake, Sparkles, Sun, Thermometer, Wind } from 'lucide-react';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';
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
  const currentTemp = toFiniteNumber(climate.currentTemp);
  const targetTemp = toFiniteNumber(climate.targetTemp);
  const targetLow = toFiniteNumber(climate.targetTempLow);
  const targetHigh = toFiniteNumber(climate.targetTempHigh);
  const hasRangeTarget = targetLow !== undefined && targetHigh !== undefined;
  const minTemp = toFiniteNumber(climate.minTemp);
  const maxTemp = toFiniteNumber(climate.maxTemp);
  const step = toFiniteNumber(climate.targetTempStep) ?? 0.5;
  const activeFanMode = normalizeMode(climate.fanMode);
  const targetPending = rawAttributes?.[CLIMATE_PENDING_TARGET_ATTRIBUTE_KEY] === true;
  const fanPending = rawAttributes?.[CLIMATE_PENDING_FAN_ATTRIBUTE_KEY] === true;

  const [localTarget, setLocalTarget] = useState<number | undefined>(targetTemp);
  const [localRange, setLocalRange] = useState<{ low: number; high: number } | null>(
    hasRangeTarget ? { low: targetLow, high: targetHigh } : null,
  );
  const [localFanMode, setLocalFanMode] = useState(activeFanMode);

  useEffect(() => {
    setLocalTarget(targetTemp);
  }, [targetTemp]);

  useEffect(() => {
    if (hasRangeTarget) {
      setLocalRange({ low: targetLow, high: targetHigh });
      return;
    }
    setLocalRange(null);
  }, [hasRangeTarget, targetHigh, targetLow]);

  useEffect(() => {
    setLocalFanMode(activeFanMode);
  }, [activeFanMode]);

  const targetForProgress = localRange ? (localRange.low + localRange.high) / 2 : localTarget;
  const ringProgress =
    targetForProgress !== undefined && minTemp !== undefined && maxTemp !== undefined && maxTemp > minTemp
      ? clamp((targetForProgress - minTemp) / (maxTemp - minTemp), 0, 1)
      : 0;
  const arcProgress = 0.16 + ringProgress * 0.78;
  const circumference = 2 * Math.PI * 74;
  const activeArc = circumference * arcProgress;
  const arcOffset = circumference - activeArc;
  const dialAngle = -90 + arcProgress * 360;
  const dialRadians = (dialAngle * Math.PI) / 180;
  const dialCursorX = 100 + 74 * Math.cos(dialRadians);
  const dialCursorY = 100 + 74 * Math.sin(dialRadians);
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

  return (
    <div className={`${CONTEXT_PANEL_LAYOUT.shell} gap-3 sm:gap-4`}>
      <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
        <div className="flex items-center gap-3 min-w-0">
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

      <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
        <div className="relative mx-auto aspect-square w-full max-w-[clamp(12.75rem,56vw,16rem)] flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="74" fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="18" />
            <circle
              cx="100"
              cy="100"
              r="74"
              fill="none"
              stroke={dialAccentColor}
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={arcOffset}
              className="transition-all duration-300"
              style={{ filter: dialGlowFilter }}
            />
            <circle
              cx={dialCursorX}
              cy={dialCursorY}
              r="7"
              fill={dialAccentColor}
              className="transition-all duration-300"
              style={{ filter: dialGlowFilter }}
            />
          </svg>

          <div
            className={`flex h-[72%] w-[72%] flex-col items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] px-3 text-center backdrop-blur-xl ${
              mode === 'heat' ? 'glow-active-orange' : mode === 'cool' ? 'glow-active-blue' : mode === 'auto' || mode === 'heat_cool' ? 'glow-active-green' : 'shadow-lg'
            }`}
          >
            <div className="flex items-start">
              <span className={`text-[clamp(1.95rem,7.6vw,3.15rem)] font-light leading-none tracking-tight ${targetPending ? 'text-white/72' : 'text-white'}`}>
                {localRange
                  ? `${Math.round(localRange.low)}-${Math.round(localRange.high)}`
                  : localTarget !== undefined
                    ? localTarget.toFixed(1)
                    : '--'}
              </span>
              <span className={`mt-1.5 text-[clamp(0.95rem,2.8vw,1.25rem)] ${targetPending ? 'text-white/68' : 'text-white/74'}`}>{unit}</span>
            </div>
            <p className="mt-1.5 text-[clamp(0.72rem,1.9vw,0.86rem)] text-white/56">
              {currentTemp !== undefined ? `Current: ${currentTemp.toFixed(1)}${unit}` : 'Current: --'}
            </p>
          </div>
        </div>

        <div className="liquid-glass-card mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 p-1.5">
          <GlassButton
            size="icon"
            className="h-[clamp(2.5rem,6vw,2.95rem)] w-[clamp(2.5rem,6vw,2.95rem)] rounded-full"
            onClick={() => {
              if (localRange && onSetTargetRange && minTemp !== undefined && maxTemp !== undefined) {
                const nextLow = clamp(localRange.low - step, minTemp, maxTemp);
                const nextHigh = clamp(localRange.high - step, minTemp, maxTemp);
                const low = Math.min(nextLow, nextHigh);
                const high = Math.max(nextLow, nextHigh);
                setLocalRange({ low, high });
                onSetTargetRange(low, high);
                return;
              }
              if (localTarget !== undefined && onSetTargetTemp && minTemp !== undefined && maxTemp !== undefined) {
                const next = clamp(localTarget - step, minTemp, maxTemp);
                setLocalTarget(next);
                onSetTargetTemp(next);
                return;
              }
              onDecreaseTarget();
            }}
            aria-label="Diminuisci temperatura target"
          >
            <Minus size={18} />
          </GlassButton>

          <GlassButton
            className="h-[clamp(2.5rem,6vw,2.95rem)] min-w-0 rounded-full px-3 text-[clamp(0.82rem,2.2vw,0.92rem)]"
            onClick={onAutoAdjust}
          >
            Align
          </GlassButton>

          <GlassButton
            size="icon"
            className="h-[clamp(2.5rem,6vw,2.95rem)] w-[clamp(2.5rem,6vw,2.95rem)] rounded-full"
            onClick={() => {
              if (localRange && onSetTargetRange && minTemp !== undefined && maxTemp !== undefined) {
                const nextLow = clamp(localRange.low + step, minTemp, maxTemp);
                const nextHigh = clamp(localRange.high + step, minTemp, maxTemp);
                const low = Math.min(nextLow, nextHigh);
                const high = Math.max(nextLow, nextHigh);
                setLocalRange({ low, high });
                onSetTargetRange(low, high);
                return;
              }
              if (localTarget !== undefined && onSetTargetTemp && minTemp !== undefined && maxTemp !== undefined) {
                const next = clamp(localTarget + step, minTemp, maxTemp);
                setLocalTarget(next);
                onSetTargetTemp(next);
                return;
              }
              onIncreaseTarget();
            }}
            aria-label="Aumenta temperatura target"
          >
            <Plus size={18} />
          </GlassButton>
        </div>
      </div>

      {hvacModes.length > 0 ? (
        <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-white/48">Mode</p>
          <div className="liquid-glass-card px-2.5 py-3">
            <div className={`${CONTEXT_PANEL_LAYOUT.rail} justify-center gap-2.5`}>
              {hvacModes.map((entry) => {
                const active = entry === mode;
                return (
                  <div key={entry} className="min-w-[3.15rem] shrink-0 flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSetMode?.(entry)}
                      className={`btn-premium relative h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-all flex items-center justify-center ${
                        active
                          ? modeActiveButtonClass(entry)
                          : 'border border-white/[0.08] bg-white/[0.04] text-white/72 shadow-lg backdrop-blur-xl hover:border-white/[0.14] hover:bg-white/[0.08] hover:text-white'
                      }`}
                      title={modeSelectorLabel(entry)}
                      aria-label={`Imposta modalità ${modeSelectorLabel(entry)}`}
                    >
                      <span className={active ? modeAccentIconClass(entry) : ''}>{modeSelectorIcon(entry, 16)}</span>
                    </button>
                    <span className={`text-[0.64rem] uppercase tracking-[0.08em] ${active ? 'text-white' : 'text-white/65'}`}>
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
        <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-[0.14em] text-white/48">Fan Mode</p>
          </div>
          <div className="flex justify-center">
            <div className={`${CONTEXT_PANEL_LAYOUT.rail} liquid-glass-card p-1.5`}>
              {fanModes.map((entry) => {
                const normalized = normalizeMode(entry);
                const active = localFanMode === normalized;
                const pendingActive = fanPending && active;
                return (
                  <button
                    key={entry}
                    type="button"
                    className={`btn-premium relative h-10 min-w-[2.5rem] shrink-0 rounded-full px-3 text-[0.72rem] font-semibold uppercase tracking-[0.04em] transition-all ${
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
