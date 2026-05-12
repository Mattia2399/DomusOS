import React, { useEffect, useMemo, useState } from 'react';
import { Droplets, Flame, Minus, Plus, Power, Snowflake, Sparkles, Sun, Thermometer, Wind } from 'lucide-react';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';

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
    return 'text-[#f97316]';
  }
  if (mode === 'cool') {
    return 'text-[#3b82f6]';
  }
  if (mode === 'auto' || mode === 'heat_cool') {
    return 'text-[#14b8a6]';
  }
  if (mode === 'dry') {
    return 'text-[#6366f1]';
  }
  if (mode === 'fan_only') {
    return 'text-[#64748b]';
  }
  if (mode === 'off') {
    return 'text-[#6b7280]';
  }
  return 'text-[#334155]';
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
  const circumference = 2 * Math.PI * 74;
  const activeArc = circumference * (0.16 + ringProgress * 0.78);
  const arcOffset = circumference - activeArc;

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
          <span className="h-[clamp(2.6rem,6.2vw,3.2rem)] w-[clamp(2.6rem,6.2vw,3.2rem)] rounded-full bg-white/10 border border-white/12 flex items-center justify-center text-white shrink-0">
            {modeIcon(mode, 19)}
          </span>
          <div className="min-w-0">
            <h2
              className="text-[clamp(0.98rem,2.7vw,1.24rem)] leading-[1.08] font-semibold tracking-tight text-white whitespace-normal break-words [overflow-wrap:anywhere]"
              style={panelTitleStyle}
            >
              {climate.name}
            </h2>
            <p className="mt-0.5 text-[clamp(0.72rem,1.9vw,0.86rem)] text-gray-400 line-clamp-2">{translatedStatus}</p>
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
              stroke={mode === 'heat' ? '#fb923c' : mode === 'cool' ? '#3b82f6' : '#9ca3af'}
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={arcOffset}
              className="transition-all duration-300"
            />
          </svg>

          <div className="h-[72%] w-[72%] rounded-full bg-black/35 border border-white/12 backdrop-blur-md flex flex-col items-center justify-center px-3 text-center">
            <div className="flex items-start">
              <span className={`text-[clamp(1.95rem,7.6vw,3.15rem)] font-light leading-none tracking-tight ${targetPending ? 'text-slate-300' : 'text-white'}`}>
                {localRange
                  ? `${Math.round(localRange.low)}-${Math.round(localRange.high)}`
                  : localTarget !== undefined
                    ? localTarget.toFixed(1)
                    : '--'}
              </span>
              <span className={`text-[clamp(0.95rem,2.8vw,1.25rem)] mt-1.5 ${targetPending ? 'text-slate-300/90' : 'text-gray-300'}`}>{unit}</span>
            </div>
            <p className="mt-1.5 text-[clamp(0.72rem,1.9vw,0.86rem)] text-gray-400">
              {currentTemp !== undefined ? `Current: ${currentTemp.toFixed(1)}${unit}` : 'Current: --'}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.3rem] bg-white/10 backdrop-blur-md border border-white/12 p-1.5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5">
          <button
            type="button"
            className="h-[clamp(2.5rem,6vw,2.95rem)] w-[clamp(2.5rem,6vw,2.95rem)] rounded-full bg-white/12 border border-white/16 text-white flex items-center justify-center hover:bg-white/16 transition-colors"
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
          </button>

          <button
            type="button"
            className="h-[clamp(2.5rem,6vw,2.95rem)] min-w-0 rounded-full bg-black/20 border border-white/8 text-[clamp(0.82rem,2.2vw,0.92rem)] text-gray-200 font-medium hover:bg-black/30 transition-colors"
            onClick={onAutoAdjust}
          >
            Align
          </button>

          <button
            type="button"
            className="h-[clamp(2.5rem,6vw,2.95rem)] w-[clamp(2.5rem,6vw,2.95rem)] rounded-full bg-white/12 border border-white/16 text-white flex items-center justify-center hover:bg-white/16 transition-colors"
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
          </button>
        </div>
      </div>

      {hvacModes.length > 0 ? (
        <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
          <p className="text-xs uppercase tracking-[0.14em] text-gray-400 mb-3">Mode</p>
          <div className="rounded-[1.2rem] border border-white/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] px-2.5 py-3">
            <div className={`${CONTEXT_PANEL_LAYOUT.rail} justify-center gap-2.5`}>
              {hvacModes.map((entry) => {
                const active = entry === mode;
                return (
                  <div key={entry} className="min-w-[3.15rem] shrink-0 flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSetMode?.(entry)}
                      className={`relative h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-all flex items-center justify-center ${
                        active
                          ? 'bg-white/[0.96] shadow-[0_8px_18px_rgba(0,0,0,0.22)]'
                          : 'bg-white/8 text-white/75 hover:text-white hover:bg-white/14 border border-white/10'
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
            <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Fan Mode</p>
          </div>
          <div className="flex justify-center">
            <div className={`${CONTEXT_PANEL_LAYOUT.rail} rounded-full border border-white/10 bg-white/[0.07] backdrop-blur-xl p-1.5`}>
              {fanModes.map((entry) => {
                const normalized = normalizeMode(entry);
                const active = localFanMode === normalized;
                const pendingActive = fanPending && active;
                return (
                  <button
                    key={entry}
                    type="button"
                    className={`relative h-10 min-w-[2.5rem] shrink-0 rounded-full px-3 text-[0.72rem] font-semibold uppercase tracking-[0.04em] transition-all ${
                      active
                        ? pendingActive
                          ? 'bg-slate-200/85 text-slate-700 shadow-[0_8px_18px_rgba(0,0,0,0.2)]'
                          : 'bg-white/[0.96] text-neutral-900 shadow-[0_8px_18px_rgba(0,0,0,0.22)]'
                        : 'text-white/72 hover:text-white hover:bg-white/10'
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
