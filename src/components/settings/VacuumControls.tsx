import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Home, LocateFixed, Pause, Play, Sparkles, Square } from 'lucide-react';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';

type VacuumControlsProps = {
  vacuum: {
    name: string;
    state: string;
    status?: string;
    batteryLevel?: number;
    cleanedArea?: number;
    cleanedAreaUnit?: string;
    cleaningMinutes?: number;
    fanSpeed?: string;
    fanSpeedList?: string[];
    mapUrl?: string;
    supportedFeatures?: number;
    supportsStart?: boolean;
    supportsPause?: boolean;
    supportsStop?: boolean;
    supportsReturnToBase?: boolean;
    supportsLocate?: boolean;
    supportsCleanSpot?: boolean;
    supportsCleanArea?: boolean;
    supportsFanSpeed?: boolean;
    supportsMap?: boolean;
    supportsSendCommand?: boolean;
    rawAttributes?: Record<string, unknown>;
  };
  areaOptions?: Array<{
    id: string;
    name: string;
  }>;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReturnToBase: () => void;
  onLocate: () => void;
  onCleanSpot: () => void;
  onCleanArea: (areaIds: string[]) => void;
  onSetFanSpeed: (fanSpeed: string) => void;
  onSendCommand: (command: string, params?: unknown) => void;
};

type VacuumUiState = 'docked' | 'cleaning' | 'paused' | 'error' | 'returning' | 'idle' | 'unavailable' | 'unknown';

type ZonePreset = {
  key: string;
  label: string;
  areaFallbackId: string;
  aliases: string[];
};

const ZONE_PRESETS: ZonePreset[] = [
  { key: 'kitchen', label: 'Cucina', areaFallbackId: 'kitchen', aliases: ['cucina', 'kitchen'] },
  { key: 'living', label: 'Salotto', areaFallbackId: 'living_room', aliases: ['salotto', 'living'] },
  { key: 'bedroom', label: 'Camera', areaFallbackId: 'bedroom', aliases: ['camera', 'bedroom'] },
  { key: 'bathroom', label: 'Bagno', areaFallbackId: 'bathroom', aliases: ['bagno', 'bathroom'] },
];

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

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normalizeState(value: string | undefined): VacuumUiState {
  const normalized = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalized) {
    return 'unknown';
  }
  if (normalized === 'charging') {
    return 'docked';
  }
  if (normalized === 'returning_to_base') {
    return 'returning';
  }
  if (
    normalized === 'docked' ||
    normalized === 'cleaning' ||
    normalized === 'paused' ||
    normalized === 'error' ||
    normalized === 'returning' ||
    normalized === 'idle' ||
    normalized === 'unavailable'
  ) {
    return normalized;
  }
  return 'unknown';
}

function translateState(state: VacuumUiState) {
  if (state === 'docked') {
    return 'In carica';
  }
  if (state === 'cleaning') {
    return 'In pulizia';
  }
  if (state === 'paused') {
    return 'In pausa';
  }
  if (state === 'error') {
    return 'Errore';
  }
  if (state === 'returning') {
    return 'Ritorno alla base';
  }
  if (state === 'idle') {
    return 'Inattivo';
  }
  if (state === 'unavailable') {
    return 'Non disponibile';
  }
  return 'Sconosciuto';
}

function normalizeToken(value: string | undefined) {
  return (value ?? '').trim().toLowerCase();
}

function formatFanSpeedLabel(value: string) {
  const normalized = value.trim().replace(/[_-]+/g, ' ');
  if (!normalized) {
    return 'Auto';
  }
  return normalized
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveAreaIdForZone(zone: ZonePreset, areaOptions: Array<{ id: string; name: string }>) {
  if (!areaOptions.length) {
    return zone.areaFallbackId;
  }
  const found = areaOptions.find((area) => {
    const name = area.name.trim().toLowerCase();
    return zone.aliases.some((alias) => name.includes(alias));
  });
  return found?.id ?? zone.areaFallbackId;
}

function RadarCore({ state, sizeClass }: { state: VacuumUiState; sizeClass: string }) {
  const isCleaning = state === 'cleaning';
  const isDocked = state === 'docked';
  const isError = state === 'error';

  return (
    <div className={`relative ${sizeClass}`}>
      <div className="absolute inset-0 rounded-full border border-white/12 bg-black/30" />
      {isCleaning ? (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              animationDuration: '2.1s',
              background:
                'conic-gradient(from 0deg, rgba(16,185,129,0) 0deg, rgba(16,185,129,0.68) 120deg, rgba(56,189,248,0.5) 170deg, rgba(16,185,129,0) 250deg, rgba(16,185,129,0) 360deg)',
            }}
          />
        </div>
      ) : null}
      <div
        className={`absolute inset-[9%] rounded-full border ${
          isError ? 'border-rose-300/35 bg-rose-500/25' : 'border-cyan-300/25 bg-cyan-400/16'
        } ${isDocked ? 'animate-pulse [animation-duration:2.8s]' : ''}`}
      />
      <div className="absolute inset-[34%] rounded-full bg-white/75" />
    </div>
  );
}

export function VacuumControls({
  vacuum,
  areaOptions = [],
  onStart,
  onPause,
  onStop,
  onReturnToBase,
  onLocate,
  onCleanSpot,
  onCleanArea,
  onSetFanSpeed,
  onSendCommand,
}: VacuumControlsProps) {
  void onSendCommand;

  const state = normalizeState(vacuum.state);
  const statusLabel = vacuum.status?.trim() || translateState(state);
  const batteryLevel = Math.round(
    toFiniteNumber(vacuum.batteryLevel) ??
      toFiniteNumber(vacuum.rawAttributes?.battery_level) ??
      toFiniteNumber(vacuum.rawAttributes?.battery) ??
      85,
  );
  const cleanedArea =
    toFiniteNumber(vacuum.cleanedArea) ??
    toFiniteNumber(vacuum.rawAttributes?.cleaned_area) ??
    toFiniteNumber(vacuum.rawAttributes?.clean_area);
  const cleanedAreaUnit =
    toTrimmedString(vacuum.cleanedAreaUnit) ??
    toTrimmedString(vacuum.rawAttributes?.cleaned_area_unit) ??
    toTrimmedString(vacuum.rawAttributes?.area_unit) ??
    'm2';
  const cleaningMinutes = Math.round(
    toFiniteNumber(vacuum.cleaningMinutes) ??
      toFiniteNumber(vacuum.rawAttributes?.cleaning_time) ??
      toFiniteNumber(vacuum.rawAttributes?.clean_time) ??
      0,
  );

  const supportsStart = vacuum.supportsStart ?? true;
  const supportsPause = vacuum.supportsPause ?? true;
  const supportsStop = vacuum.supportsStop ?? true;
  const supportsReturnToBase = vacuum.supportsReturnToBase ?? true;
  const supportsLocate = vacuum.supportsLocate ?? true;
  const supportsCleanSpot = vacuum.supportsCleanSpot ?? true;
  const supportsCleanArea = vacuum.supportsCleanArea ?? true;
  const supportsFanSpeed = vacuum.supportsFanSpeed ?? true;
  const supportsMap = vacuum.supportsMap ?? true;

  const fanSpeedOptions = useMemo(() => {
    const options =
      Array.isArray(vacuum.fanSpeedList) && vacuum.fanSpeedList.length > 0
        ? vacuum.fanSpeedList
        : toStringArray(vacuum.rawAttributes?.fan_speed_list).length > 0
          ? toStringArray(vacuum.rawAttributes?.fan_speed_list)
          : toStringArray(vacuum.rawAttributes?.fan_speeds).length > 0
            ? toStringArray(vacuum.rawAttributes?.fan_speeds)
            : toStringArray(vacuum.rawAttributes?.fan_modes).length > 0
              ? toStringArray(vacuum.rawAttributes?.fan_modes)
              : ['quiet', 'balanced', 'turbo'];
    const unique = new Set<string>();
    const normalized = options
      .map((entry) => entry.trim())
      .filter((entry) => {
        if (!entry || unique.has(entry.toLowerCase())) {
          return false;
        }
        unique.add(entry.toLowerCase());
        return true;
      });
    return normalized;
  }, [vacuum.fanSpeedList, vacuum.rawAttributes]);

  const activeFanSpeed =
    toTrimmedString(vacuum.fanSpeed) ??
    fanSpeedOptions[0] ??
    '';
  const [selectedZoneKey, setSelectedZoneKey] = useState<string | null>(null);
  const [fanMode, setFanMode] = useState<string>(activeFanSpeed);

  useEffect(() => {
    setFanMode(activeFanSpeed);
  }, [activeFanSpeed, vacuum.name]);

  const playActive = state === 'docked' || state === 'idle';
  const pauseActive = state === 'cleaning';
  const homeActive = state === 'cleaning' || state === 'returning';

  return (
    <div className={CONTEXT_PANEL_LAYOUT.shell}>
      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full border border-white/12 bg-white/10 flex items-center justify-center text-white">
            <Bot size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">Robot Aspirapolvere</h3>
            <p className="-mt-0.5 text-sm text-white/70 truncate">{vacuum.name}</p>
            <p className="text-sm text-white/60">Stato: {statusLabel}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <RadarCore state={state} sizeClass="h-[clamp(6.75rem,34vw,8rem)] w-[clamp(6.75rem,34vw,8rem)]" />
        </div>

        <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-4 grid grid-cols-2 min-[380px]:grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-white/50">Batteria</p>
            <p className="mt-1 text-lg font-semibold text-white">{Number.isFinite(batteryLevel) ? `${batteryLevel}%` : '--'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/50">Area</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {cleanedArea !== undefined ? `${Math.round(cleanedArea * 10) / 10} ${cleanedAreaUnit}` : '--'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/50">Tempo</p>
            <p className="mt-1 text-lg font-semibold text-white">{cleaningMinutes > 0 ? `${cleaningMinutes} min` : '--'}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onStart}
            disabled={!supportsStart}
            className={`h-14 w-14 rounded-2xl border border-white/10 backdrop-blur-md flex items-center justify-center transition-colors ${
              !supportsStart
                ? 'bg-white/5 text-white/35 cursor-not-allowed'
                : playActive
                  ? 'bg-white text-neutral-900 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]'
                  : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="Avvia"
            aria-label="Avvia"
          >
            <Play size={20} className="ml-0.5" />
          </button>
          <button
            type="button"
            onClick={onPause}
            disabled={!supportsPause}
            className={`h-14 w-14 rounded-2xl border border-white/10 backdrop-blur-md flex items-center justify-center transition-colors ${
              !supportsPause
                ? 'bg-white/5 text-white/35 cursor-not-allowed'
                : pauseActive
                  ? 'bg-white text-neutral-900 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]'
                  : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="Pausa"
            aria-label="Pausa"
          >
            <Pause size={20} />
          </button>
          <button
            type="button"
            onClick={onReturnToBase}
            disabled={!supportsReturnToBase}
            className={`h-14 w-14 rounded-2xl border border-white/10 backdrop-blur-md flex items-center justify-center transition-colors ${
              !supportsReturnToBase
                ? 'bg-white/5 text-white/35 cursor-not-allowed'
                : homeActive
                  ? 'bg-white text-neutral-900 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]'
                  : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="Torna alla base"
            aria-label="Torna alla base"
          >
            <Home size={20} />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 min-[380px]:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onStop}
            disabled={!supportsStop}
            className={`h-10 rounded-xl border border-white/10 text-xs transition-colors ${
              supportsStop ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/5 text-white/35 cursor-not-allowed'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Square size={13} />
              Stop
            </span>
          </button>
          <button
            type="button"
            onClick={onLocate}
            disabled={!supportsLocate}
            className={`h-10 rounded-xl border border-white/10 text-xs transition-colors ${
              supportsLocate ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/5 text-white/35 cursor-not-allowed'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <LocateFixed size={13} />
              Locate
            </span>
          </button>
          <button
            type="button"
            onClick={onCleanSpot}
            disabled={!supportsCleanSpot}
            className={`h-10 rounded-xl border border-white/10 text-xs transition-colors ${
              supportsCleanSpot ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/5 text-white/35 cursor-not-allowed'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={13} />
              Spot
            </span>
          </button>
        </div>

        {supportsMap && vacuum.mapUrl ? (
          <div className="mt-4 rounded-2xl border border-white/8 bg-black/25 overflow-hidden">
            <img
              src={vacuum.mapUrl}
              alt="Mappa pulizia"
              className="h-28 w-full object-cover"
            />
          </div>
        ) : null}
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.sectionCompact} mb-1 ${supportsCleanArea ? '' : 'opacity-60'}`}>
        <p className="text-xs uppercase text-white/40 tracking-wider mb-3">Pulizia zone</p>
        <div className="flex flex-wrap gap-2.5">
          {ZONE_PRESETS.map((zone) => {
            const active = selectedZoneKey === zone.key;
            return (
              <button
                key={zone.key}
                type="button"
                onClick={() => {
                  if (!supportsCleanArea) {
                    return;
                  }
                  const areaId = resolveAreaIdForZone(zone, areaOptions);
                  setSelectedZoneKey(zone.key);
                  onCleanArea([areaId]);
                }}
                disabled={!supportsCleanArea}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  !supportsCleanArea
                    ? 'bg-white/5 border-white/10 text-white/35 cursor-not-allowed'
                    : active
                      ? 'bg-white text-neutral-900 border-white'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/15'
                }`}
              >
                {zone.label}
              </button>
            );
          })}
        </div>
      </div>

      {supportsFanSpeed && fanSpeedOptions.length > 0 ? (
        <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
          <p className="text-xs uppercase text-white/40 tracking-wider mb-3">Potenza aspirazione</p>
          <div className="rounded-2xl bg-white/5 border border-white/8 p-1.5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(fanSpeedOptions.length, 3)}, minmax(0, 1fr))` }}>
            {fanSpeedOptions.map((mode) => {
              const active = normalizeToken(fanMode) === normalizeToken(mode);
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setFanMode(mode);
                    onSetFanSpeed(mode);
                  }}
                  className={`h-10 rounded-xl px-2 text-xs font-medium transition-colors ${
                    active ? 'bg-white text-neutral-900' : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {formatFanSpeedLabel(mode)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
