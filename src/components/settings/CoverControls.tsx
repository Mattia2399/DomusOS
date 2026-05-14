import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Blinds, Square } from 'lucide-react';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';
import {
  COVER_FEATURE_CLOSE,
  COVER_FEATURE_OPEN,
  coverSupportsSetPosition,
  coverSupportsStop,
  coverSupportsTilt,
  normalizeCoverState,
  resolveCoverPosition,
  resolveCoverTiltPosition,
  translateCoverState,
} from '../../utils/coverUtils';

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
    supportsSetTiltPosition?: boolean;
    rawAttributes?: Record<string, unknown>;
  };
  onOpen: () => void;
  onClose: () => void;
  onStop: () => void;
  onSetPosition?: (position: number) => void;
  onSetTiltPosition?: (position: number) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function CoverControls({
  cover,
  onOpen,
  onClose,
  onStop,
  onSetPosition,
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
  const supportsTilt = cover.supportsSetTiltPosition ?? coverSupportsTilt(supportedFeatures, cover.rawAttributes);

  const resolvedPosition = resolveCoverPosition(
    normalizedState,
    cover.position ?? cover.rawAttributes?.current_position ?? cover.rawAttributes?.position,
    70,
  );
  const resolvedTiltPosition = resolveCoverTiltPosition(
    cover.tiltPosition ?? cover.rawAttributes?.current_tilt_position ?? cover.rawAttributes?.tilt_position,
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

  return (
    <div className={CONTEXT_PANEL_LAYOUT.shell}>
      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="flex items-start gap-3 pr-11">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-full border border-white/10 bg-white/10 flex items-center justify-center text-white">
              <Blinds size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[1.2rem] font-semibold tracking-tight text-white truncate">{cover.name || 'Tapparella Salotto'}</h3>
              <p className="mt-1 text-sm text-white/60 truncate">{displayStatus}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={CONTEXT_PANEL_LAYOUT.section}>
        <div className="mt-6 flex justify-center">
          <div className="relative aspect-[7/10] w-full max-w-[clamp(10.5rem,62vw,14rem)] rounded-3xl border-[6px] border-neutral-800/80 bg-black/40 overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),inset_0_18px_34px_rgba(0,0,0,0.35)]">
            <div className="pointer-events-none absolute inset-[10px] rounded-[18px] border border-white/5" />
            <div
              className="absolute inset-x-0 top-0 border-b-2 border-white/40 bg-white/20 backdrop-blur-md shadow-[0_16px_22px_rgba(0,0,0,0.28)]"
              style={{
                height: `${blindCoverage}%`,
                backgroundImage:
                  'repeating-linear-gradient(180deg,rgba(255,255,255,0.32)_0px,rgba(255,255,255,0.32)_1px,rgba(255,255,255,0.16)_1px,rgba(255,255,255,0.16)_12px)',
              }}
            />

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
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
            className={`h-14 w-14 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center transition-all active:scale-95 ${
              supportsOpen ? 'bg-white/10 hover:bg-white/20' : 'bg-white/6 text-white/35 cursor-not-allowed'
            }`}
            aria-label="Apri"
            title="Apri"
          >
            <ArrowUp size={20} />
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={!supportsStop}
            className={`h-14 w-14 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center transition-all active:scale-95 ${
              supportsStop
                ? 'bg-white/10 hover:bg-white/20'
                : 'bg-white/6 text-white/35 cursor-not-allowed'
            }`}
            aria-label="Stop"
            title="Stop"
          >
            <Square size={18} />
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
            className={`h-14 w-14 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center transition-all active:scale-95 ${
              supportsClose ? 'bg-white/10 hover:bg-white/20' : 'bg-white/6 text-white/35 cursor-not-allowed'
            }`}
            aria-label="Chiudi"
            title="Chiudi"
          >
            <ArrowDown size={20} />
          </button>
        </div>

        {supportsTilt ? (
          <div className="mt-8">
            <p className="mb-3 text-xs uppercase tracking-[0.16em] text-white/40">INCLINAZIONE LAMELLE</p>
            <div className="relative h-12 w-full rounded-3xl border border-white/5 bg-white/10 backdrop-blur-md overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-white/95 rounded-r-xl"
                style={{ width: `${tiltPosition}%` }}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4 text-xs font-semibold">
                <span className="mix-blend-difference text-white">0 deg</span>
                <span className="mix-blend-difference text-white">{`${tiltDegrees} deg`}</span>
                <span className="mix-blend-difference text-white">90 deg</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={tiltPosition}
                onChange={(event) => handleTiltChange(Number(event.target.value))}
                disabled={!supportsTilt}
                className={`absolute inset-0 z-20 w-full h-full opacity-0 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none ${
                  supportsTilt ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
                aria-label="Inclinazione lamelle"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
