import React from 'react';
import { Bot } from 'lucide-react';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { useCardSize } from './useCardSize';

type VacuumCardProps = {
  widget: Widget;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  onStartPause?: () => void;
  onReturnToBase?: () => void;
  liveEntity?: MockEntityState;
};

type VacuumUiState = 'docked' | 'cleaning' | 'paused' | 'error' | 'returning' | 'idle' | 'unavailable' | 'unknown';

function toTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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

function formatFanSpeedLabel(value: string | undefined) {
  const raw = (value ?? '').trim().replace(/[_-]+/g, ' ');
  if (!raw) {
    return undefined;
  }
  return raw
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeVacuumState(value: string | undefined): VacuumUiState {
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

function translateVacuumState(state: VacuumUiState) {
  if (state === 'docked') {
    return 'In Carica';
  }
  if (state === 'cleaning') {
    return 'In Pulizia';
  }
  if (state === 'paused') {
    return 'In Pausa';
  }
  if (state === 'error') {
    return 'Errore';
  }
  if (state === 'returning') {
    return 'Ritorno alla Base';
  }
  if (state === 'idle') {
    return 'Inattivo';
  }
  if (state === 'unavailable') {
    return 'Non disponibile';
  }
  return 'Sconosciuto';
}

function VacuumRadar({ state, density = 'regular' }: { state: VacuumUiState; density?: 'tiny' | 'compact' | 'regular' }) {
  const isCleaning = state === 'cleaning';
  const isDocked = state === 'docked';
  const isError = state === 'error';
  const shellSizeClass = density === 'tiny' ? 'h-[2.65rem] w-[2.65rem]' : density === 'compact' ? 'h-[3.25rem] w-[3.25rem]' : 'h-16 w-16';

  return (
    <div className={`relative ${shellSizeClass}`}>
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

export function VacuumCard({
  widget,
  isSelected,
  isEditMode,
  onClick,
  onStartPause,
  onReturnToBase,
  liveEntity,
}: VacuumCardProps) {
  const { ref: cardRef, density: cardDensity, hasSize: hasCardSize } = useCardSize({
    tinyWidth: 230,
    tinyHeight: 150,
    compactWidth: 340,
    compactHeight: 220,
  });
  void onStartPause;
  void onReturnToBase;

  const rawAttributes = liveEntity?.rawAttributes;
  const vacuumState = normalizeVacuumState(
    toTrimmedString(liveEntity?.stateLabel) ??
      toTrimmedString(liveEntity?.state) ??
      widget.status,
  );
  const batteryLevel =
    toFiniteNumber(rawAttributes?.battery_level) ??
    toFiniteNumber(rawAttributes?.battery) ??
    toFiniteNumber(widget.value) ??
    85;
  const cleanedArea =
    toFiniteNumber(rawAttributes?.cleaned_area) ??
    toFiniteNumber(rawAttributes?.clean_area) ??
    toFiniteNumber(widget.vacuumCleanedArea);
  const cleanedAreaUnit =
    toTrimmedString(rawAttributes?.cleaned_area_unit) ??
    toTrimmedString(rawAttributes?.area_unit) ??
    'm2';
  const cleaningMinutes = Math.round(
    toFiniteNumber(rawAttributes?.cleaning_time) ??
      toFiniteNumber(rawAttributes?.clean_time) ??
      toFiniteNumber(widget.vacuumCleaningMinutes) ??
      0,
  );
  const fanSpeedLabel = formatFanSpeedLabel(
    toTrimmedString(rawAttributes?.fan_speed) ??
      toTrimmedString(rawAttributes?.fan_mode) ??
      toTrimmedString(widget.vacuumFanSpeed),
  );
  const statusLabel =
    toTrimmedString(rawAttributes?.status) ??
    translateVacuumState(vacuumState);

  const auraClass =
    vacuumState === 'cleaning'
      ? 'bg-cyan-500/10'
      : vacuumState === 'error'
        ? 'bg-rose-500/18'
        : 'bg-white/5';
  const isLayoutDense = widget.layout.w <= 1 || widget.layout.h <= 1;
  const isTinyCard = hasCardSize && cardDensity === 'tiny';
  const isDenseCard = isLayoutDense || (hasCardSize && cardDensity !== 'regular');
  const cardRadiusClass = isDenseCard ? 'rounded-[1.55rem]' : 'rounded-3xl';
  const contentPaddingClass = isTinyCard ? 'p-2.5' : isDenseCard ? 'p-3.5' : 'p-5';
  const titleClass = isTinyCard ? 'text-[0.86rem]' : isDenseCard ? 'text-[0.95rem]' : 'text-base';
  const subtitleClass = isTinyCard ? 'mt-0.5 text-[0.68rem]' : isDenseCard ? 'mt-0.5 text-[0.78rem]' : 'mt-1 text-sm';
  const chipClass = isTinyCard ? 'gap-1 text-[9px]' : isDenseCard ? 'gap-1 text-[10px]' : 'gap-1.5 text-[11px]';

  return (
    <div
      ref={cardRef}
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden ${cardRadiusClass} ${isSelected ? 'selection-corners' : ''}`}
      onClick={(event) => {
        if (isEditMode) {
          return;
        }
        event.stopPropagation();
        onClick();
      }}
    >
      <div
        className={`relative h-full w-full min-h-0 min-w-0 ${cardRadiusClass} border border-white/5 ${contentPaddingClass} flex flex-col justify-between overflow-hidden transition-transform duration-200 ${auraClass}`}
      >
        <div className={`pointer-events-none absolute inset-0 ${cardRadiusClass} bg-[radial-gradient(85%_72%_at_50%_0%,rgba(255,255,255,0.08),transparent_72%)]`} />

        <div className="relative flex min-w-0 items-center justify-between">
          <div className={`${isTinyCard ? 'h-7 w-7' : isDenseCard ? 'h-8 w-8' : 'h-9 w-9'} rounded-full border border-white/10 bg-white/10 flex items-center justify-center text-white/85`}>
            <Bot size={isTinyCard ? 13 : isDenseCard ? 14 : 16} />
          </div>
          <p className={`${isTinyCard ? 'text-[0.68rem]' : isDenseCard ? 'text-[0.78rem]' : 'text-sm'} text-white/70 font-medium`}>{Math.round(batteryLevel)}% Batt.</p>
        </div>

        <div className="relative flex justify-center py-1">
          <VacuumRadar state={vacuumState} density={isTinyCard ? 'tiny' : isDenseCard ? 'compact' : 'regular'} />
        </div>

        <div className="relative min-w-0">
          <p className={`${titleClass} font-semibold text-white leading-tight truncate`}>
            {widget.title || 'Robot Aspirapolvere'}
          </p>
          <p className={`${subtitleClass} line-clamp-1 overflow-hidden text-white/50`}>{statusLabel}</p>
          <div className={`mt-2 flex flex-wrap ${chipClass} text-white/65`}>
            <span className="rounded-full border border-white/12 bg-white/8 px-2 py-0.5">
              {cleanedArea !== undefined ? `${Math.round(cleanedArea * 10) / 10} ${cleanedAreaUnit}` : '--'}
            </span>
            <span className="rounded-full border border-white/12 bg-white/8 px-2 py-0.5">
              {cleaningMinutes > 0 ? `${cleaningMinutes} min` : '--'}
            </span>
            {fanSpeedLabel ? (
              <span className="rounded-full border border-white/12 bg-white/8 px-2 py-0.5">{fanSpeedLabel}</span>
            ) : null}
          </div>
        </div>
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
