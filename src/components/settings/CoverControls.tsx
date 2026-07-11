import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Blinds, Square } from 'lucide-react';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';
import {
  COVER_FEATURE_CLOSE,
  COVER_FEATURE_OPEN,
  coverSupportsCloseTilt,
  coverSupportsOpenTilt,
  coverSupportsSetPosition,
  coverSupportsSetTiltPosition,
  coverSupportsStop,
  coverSupportsStopTilt,
  coverSupportsTilt,
  normalizeCoverState,
  resolveCoverPosition,
  resolveCoverPositionAttribute,
  resolveCoverTiltAttribute,
  resolveCoverTiltPosition,
  translateCoverState,
} from '../../utils/coverUtils';
import { ContextPanelHeader } from './ContextPanelHeader';
import { normalizeCoverDeviceClass } from '../widgets/coverCardModel';
import '../widgets/CoverCard.css';

type CoverControlsProps = {
  cover: {
    name: string;
    state: string;
    status?: string;
    position?: number;
    tiltPosition?: number;
    supportedFeatures?: number;
    supportsOpen?: boolean;
    supportsClose?: boolean;
    supportsStop?: boolean;
    supportsSetPosition?: boolean;
    supportsOpenTilt?: boolean;
    supportsCloseTilt?: boolean;
    supportsSetTiltPosition?: boolean;
    supportsStopTilt?: boolean;
    rawAttributes?: Record<string, unknown>;
  };
  onOpen: () => void;
  onClose: () => void;
  onStop: () => void;
  onSetPosition?: (position: number) => void;
  onOpenTilt?: () => void;
  onCloseTilt?: () => void;
  onStopTilt?: () => void;
  onSetTiltPosition?: (position: number) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const TILT_PRESETS = [
  { value: 0, label: '0', ariaLabel: '0 deg' },
  { value: 25, label: '23', ariaLabel: '23 deg' },
  { value: 50, label: '45', ariaLabel: '45 deg' },
  { value: 75, label: '68', ariaLabel: '68 deg' },
  { value: 100, label: '90', ariaLabel: '90 deg' },
];

function findNearestTiltPreset(value: number) {
  return TILT_PRESETS.reduce((nearest, option) =>
    Math.abs(option.value - value) < Math.abs(nearest.value - value) ? option : nearest,
  );
}

export function CoverControls({
  cover,
  onOpen,
  onClose,
  onStop,
  onSetPosition,
  onOpenTilt,
  onCloseTilt,
  onStopTilt,
  onSetTiltPosition,
}: CoverControlsProps) {
  const normalizedState = normalizeCoverState(cover.state);
  const supportedFeatures = cover.supportedFeatures;
  const supportsOpen =
    cover.supportsOpen ??
    (
      supportedFeatures === undefined ||
      supportedFeatures === 0 ||
      (supportedFeatures & COVER_FEATURE_OPEN) !== 0
    );
  const supportsClose =
    cover.supportsClose ??
    (
      supportedFeatures === undefined ||
      supportedFeatures === 0 ||
      (supportedFeatures & COVER_FEATURE_CLOSE) !== 0
    );
  const supportsSetPosition = cover.supportsSetPosition ?? coverSupportsSetPosition(supportedFeatures);
  const supportsStop = cover.supportsStop ?? coverSupportsStop(supportedFeatures);
  const supportsOpenTilt = cover.supportsOpenTilt ?? coverSupportsOpenTilt(supportedFeatures);
  const supportsCloseTilt = cover.supportsCloseTilt ?? coverSupportsCloseTilt(supportedFeatures);
  const supportsSetTiltPosition =
    cover.supportsSetTiltPosition ??
    (
      coverSupportsSetTiltPosition(supportedFeatures) ||
      coverSupportsTilt(supportedFeatures, cover.rawAttributes)
    );
  const supportsStopTilt = cover.supportsStopTilt ?? coverSupportsStopTilt(supportedFeatures);
  const supportsTilt = supportsOpenTilt || supportsCloseTilt || supportsSetTiltPosition || supportsStopTilt;

  const resolvedPosition = resolveCoverPosition(
    normalizedState,
    cover.position ?? resolveCoverPositionAttribute(cover.rawAttributes),
    70,
  );
  const resolvedTiltPosition = resolveCoverTiltPosition(
    cover.tiltPosition ?? resolveCoverTiltAttribute(cover.rawAttributes),
    50,
  );

  const [currentPosition, setCurrentPosition] = useState(resolvedPosition);
  const [tiltPosition, setTiltPosition] = useState(resolvedTiltPosition);

  useEffect(() => {
    setCurrentPosition(resolvedPosition);
  }, [resolvedPosition, cover.name]);

  useEffect(() => {
    setTiltPosition(resolvedTiltPosition);
  }, [resolvedTiltPosition, cover.name]);

  const displayStatus = useMemo(() => {
    return `${translateCoverState(normalizedState)} | ${currentPosition}%`;
  }, [currentPosition, normalizedState]);

  const blindCoverage = 100 - currentPosition;
  const tiltDegrees = Math.round((tiltPosition / 100) * 90);
  const isMoving = normalizedState === 'opening' || normalizedState === 'closing';
  const deviceClass = normalizeCoverDeviceClass(
    cover.rawAttributes?.device_class,
    `${cover.name} ${String(cover.rawAttributes?.friendly_name ?? '')}`,
  );
  const visualTone =
    isMoving
      ? 'moving'
      : normalizedState === 'closed'
        ? 'closed'
        : normalizedState === 'unavailable' || normalizedState === 'unknown'
          ? 'offline'
          : 'open';
  const visualMovementClass = normalizedState === 'opening'
    ? 'cover-card__blind--moving cover-card__blind--opening'
    : normalizedState === 'closing'
      ? 'cover-card__blind--moving cover-card__blind--closing'
      : '';
  const visualToneVars = {
    '--cover-card-coverage': `${blindCoverage}%`,
    '--cover-card-position': `${currentPosition}%`,
    '--cover-card-tilt': `${tiltPosition}%`,
  } as React.CSSProperties;
  const activeTiltPreset = findNearestTiltPreset(tiltPosition);

  const handlePositionChange = (nextValue: number) => {
    if (!supportsSetPosition) {
      return;
    }
    const safe = clamp(Math.round(nextValue), 0, 100);
    setCurrentPosition(safe);
    onSetPosition?.(safe);
  };

  const handleTiltChange = (nextValue: number) => {
    if (!supportsTilt) {
      return;
    }
    const safe = clamp(Math.round(nextValue), 0, 100);
    setTiltPosition(safe);
    onSetTiltPosition?.(safe);
  };

  const canUseTiltPreset = (value: number) => {
    if (supportsSetTiltPosition) {
      return true;
    }
    if (value === 0) {
      return supportsCloseTilt;
    }
    if (value === 100) {
      return supportsOpenTilt;
    }
    return false;
  };

  const handleTiltPresetSelect = (value: number) => {
    if (!canUseTiltPreset(value)) {
      return;
    }
    if (supportsSetTiltPosition) {
      handleTiltChange(value);
      return;
    }
    if (value === 0) {
      setTiltPosition(0);
      onCloseTilt?.();
      return;
    }
    if (value === 100) {
      setTiltPosition(100);
      onOpenTilt?.();
    }
  };

  return (
    <div className={CONTEXT_PANEL_LAYOUT.shell}>
      <ContextPanelHeader title={cover.name} subtitle={displayStatus} icon={<Blinds size={21} />} fallbackTitle="Tapparella" />

      <div className={CONTEXT_PANEL_LAYOUT.section}>
        <div className="grid gap-4">
          <div className="flex justify-center">
            <div
              className="cover-card cover-controls__visual relative aspect-[7/10] w-full max-w-[clamp(12rem,68vw,16.5rem)]"
              data-cover-device={deviceClass}
              data-cover-tone={visualTone}
              style={visualToneVars}
            >
              <span className="cover-card__rail cover-controls__rail">
                <span className="cover-card__frame-glow" />
                <span className={`cover-card__blind ${visualMovementClass}`} />
                <span className="cover-card__handle-line" />

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={100 - currentPosition}
                  onChange={(event) => handlePositionChange(100 - Number(event.target.value))}
                  disabled={!supportsSetPosition}
                  className={`absolute inset-0 z-20 opacity-0 appearance-none ${
                    supportsSetPosition ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'
                  } [writing-mode:vertical-lr] [-webkit-appearance:slider-vertical]`}
                  aria-label="Posizione tapparella"
                />
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                if (!supportsOpen) {
                  return;
                }
                setCurrentPosition(100);
                onOpen();
              }}
              disabled={!supportsOpen}
              className={`flex h-12 min-w-0 items-center justify-center rounded-2xl border px-2 text-xs font-semibold backdrop-blur-md transition-all active:scale-95 ${
                supportsOpen ? 'border-white/12 bg-white/[0.09] text-white hover:bg-white/[0.14]' : 'border-white/8 bg-white/[0.04] text-white/32 cursor-not-allowed'
              }`}
              aria-label="Apri"
              title="Apri"
            >
              <ArrowUp size={16} />
            </button>
            <button
              type="button"
              onClick={onStop}
              disabled={!supportsStop}
              className={`flex h-12 min-w-0 items-center justify-center rounded-2xl border px-2 text-xs font-semibold backdrop-blur-md transition-all active:scale-95 ${
                supportsStop
                  ? 'border-white/12 bg-white/[0.09] text-white hover:bg-white/[0.14]'
                  : 'border-white/8 bg-white/[0.04] text-white/32 cursor-not-allowed'
              }`}
              aria-label="Stop"
              title="Stop"
            >
              <Square size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!supportsClose) {
                  return;
                }
                setCurrentPosition(0);
                onClose();
              }}
              disabled={!supportsClose}
              className={`flex h-12 min-w-0 items-center justify-center rounded-2xl border px-2 text-xs font-semibold backdrop-blur-md transition-all active:scale-95 ${
                supportsClose ? 'border-white/12 bg-white/[0.09] text-white hover:bg-white/[0.14]' : 'border-white/8 bg-white/[0.04] text-white/32 cursor-not-allowed'
              }`}
              aria-label="Chiudi"
              title="Chiudi"
            >
              <ArrowDown size={16} />
            </button>
          </div>

          {supportsTilt ? (
            <div className="liquid-glass-card rounded-[1.65rem] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-white/42">Inclinazione lamelle</p>
                </div>
                {supportsStopTilt ? (
                  <button
                    type="button"
                    onClick={onStopTilt}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/72 transition-all hover:bg-white/[0.14] active:scale-95"
                    aria-label="Stop tilt"
                    title="Stop tilt"
                  >
                    <Square size={13} />
                  </button>
                ) : null}
              </div>

              <div className="liquid-segmented-control">
                <div
                  className="segmented-options [grid-auto-columns:auto] [grid-template-columns:repeat(5,minmax(0,1fr))]"
                  style={{ '--segmented-option-min': '2rem' } as React.CSSProperties}
                >
                  {TILT_PRESETS.map((option) => {
                    const active = option.value === activeTiltPreset.value;
                    const enabled = canUseTiltPreset(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleTiltPresetSelect(option.value)}
                        disabled={!enabled}
                        className={`h-10 rounded-full px-2 text-xs font-semibold transition-all active:scale-[0.96] ${
                          active
                            ? 'liquid-segmented-option-active'
                            : 'liquid-segmented-option-inactive'
                        } ${enabled ? '' : 'cursor-not-allowed opacity-35'}`}
                        aria-pressed={active}
                        aria-label={`Imposta inclinazione lamelle a ${option.ariaLabel}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
