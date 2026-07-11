import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Blinds, DoorOpen, SlidersHorizontal, Square } from 'lucide-react';
import type { CoverCardModel } from './coverCardModel';
import type { WidgetDisplayVariant } from './widgetDisplayVariant';
import './CoverCard.css';

type CoverCardViewProps = {
  model: CoverCardModel;
  layoutVariant: WidgetDisplayVariant;
  isSelected: boolean;
  isEditMode: boolean;
  rootRef?: React.Ref<HTMLDivElement>;
  onOpen: () => void;
  onPositionChange?: (position: number) => void;
  onTiltPositionChange?: (position: number) => void;
};

type CoverCardControlMode = 'position' | 'tilt';

const COVER_POSITION_STEP = 10;

const TILT_PRESETS = [
  { value: 0, label: '0', ariaLabel: '0 gradi' },
  { value: 25, label: '23', ariaLabel: '23 gradi' },
  { value: 50, label: '45', ariaLabel: '45 gradi' },
  { value: 75, label: '68', ariaLabel: '68 gradi' },
  { value: 100, label: '90', ariaLabel: '90 gradi' },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function snapPosition(value: number) {
  return clamp(Math.round(value / COVER_POSITION_STEP) * COVER_POSITION_STEP, 0, 100);
}

function findNearestTiltPreset(value: number) {
  return TILT_PRESETS.reduce((nearest, option) =>
    Math.abs(option.value - value) < Math.abs(nearest.value - value) ? option : nearest,
  );
}

function resolveDeviceIcon(model: CoverCardModel) {
  if (model.deviceClass === 'door' || model.deviceClass === 'garage' || model.deviceClass === 'gate' || model.deviceClass === 'window') {
    return DoorOpen;
  }
  if (model.deviceClass === 'damper') {
    return Square;
  }
  return Blinds;
}

export function CoverCardView({
  model,
  layoutVariant,
  isSelected,
  isEditMode,
  rootRef,
  onOpen,
  onPositionChange,
  onTiltPositionChange,
}: CoverCardViewProps) {
  const [controlMode, setControlMode] = useState<CoverCardControlMode>('position');
  const [draftPosition, setDraftPosition] = useState<number | null>(null);
  const pointerActiveRef = useRef(false);
  const skipNextBlurCommitRef = useRef(false);
  const DeviceIcon = resolveDeviceIcon(model);
  const canUsePosition = model.isAvailable && model.supportsSetPosition && Boolean(onPositionChange);
  const canUseTilt = model.isAvailable && model.hasTilt && model.supportsSetTiltPosition && Boolean(onTiltPositionChange);
  const activeTiltPreset = findNearestTiltPreset(model.tiltPosition);
  const sliderValue = draftPosition ?? snapPosition(model.position);
  const visualMovementClass = model.state === 'opening'
    ? 'cover-card__blind--moving cover-card__blind--opening'
    : model.state === 'closing'
      ? 'cover-card__blind--moving cover-card__blind--closing'
      : '';
  const style = useMemo(
    () => ({
      '--cover-card-position': `${model.position}%`,
      '--cover-card-coverage': `${model.coverage}%`,
      '--cover-card-tilt': `${model.tiltPosition}%`,
      '--cover-slider-progress': `${sliderValue}%`,
    }) as React.CSSProperties,
    [model.coverage, model.position, model.tiltPosition, sliderValue],
  );
  const subtitle =
    model.isAvailable
      ? `${model.stateLabel} - ${model.deviceClassLabel}`
      : model.stateLabel;

  useEffect(() => {
    if (!canUseTilt && controlMode === 'tilt') {
      setControlMode('position');
    }
  }, [canUseTilt, controlMode]);

  useEffect(() => {
    if (!pointerActiveRef.current) {
      setDraftPosition(null);
    }
  }, [model.position]);

  const commitPosition = (rawValue: number) => {
    const nextPosition = snapPosition(rawValue);
    setDraftPosition(nextPosition);
    onPositionChange?.(nextPosition);
  };

  return (
    <div
      ref={rootRef}
      className={`cover-card ${isSelected ? 'selection-corners' : ''}`}
      data-cover-state={model.state}
      data-cover-tone={model.tone}
      data-cover-variant={layoutVariant}
      data-cover-device={model.deviceClass}
      data-cover-available={model.isAvailable ? 'true' : 'false'}
      data-cover-tilt={model.hasTilt ? 'true' : 'false'}
      data-cover-control-mode={controlMode}
      data-cover-pending={model.pending ? 'true' : 'false'}
      style={style}
      onClick={(event) => {
        if (isEditMode) return;
        event.stopPropagation();
        onOpen();
      }}
      aria-label={`${model.title}, ${model.stateLabel}, ${model.position}%`}
      aria-busy={model.isMoving || model.pending || undefined}
    >
      <div className="liquid-glass-card cover-card__surface">
        <span className="cover-card__icon-shell" aria-hidden="true">
          <DeviceIcon className="cover-card__icon" />
        </span>

        <span className="cover-card__meta">
          <span className="cover-card__title" title={model.title}>{model.title}</span>
          <span className="cover-card__subtitle" title={subtitle}>{subtitle}</span>
        </span>

        {canUseTilt ? (
          <button
            type="button"
            className="cover-card__mode-button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setDraftPosition(null);
              setControlMode((current) => current === 'position' ? 'tilt' : 'position');
            }}
            aria-label={controlMode === 'position' ? 'Passa al controllo lamelle' : 'Torna al controllo posizione'}
            title={controlMode === 'position' ? 'Lamelle' : 'Posizione'}
          >
            {controlMode === 'position' ? <Blinds /> : <SlidersHorizontal />}
            <span className="cover-card__mode-label">
              {controlMode === 'position' ? 'Lamelle' : 'Posizione'}
            </span>
          </button>
        ) : null}

        <div className="cover-card__controls" onClick={(event) => event.stopPropagation()}>
          {controlMode === 'tilt' && canUseTilt ? (
            <div className="cover-card__tilt-segments" role="group" aria-label={`Inclinazione lamelle ${model.title}`}>
              {TILT_PRESETS.map((option) => {
                const active = option.value === activeTiltPreset.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`cover-card__tilt-option ${active ? 'cover-card__tilt-option--active' : ''}`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onTiltPositionChange?.(option.value);
                    }}
                    aria-pressed={active}
                    aria-label={`Imposta inclinazione lamelle a ${option.ariaLabel}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="cover-card__cover-slider">
              <span className={`cover-card__cover-slider-fill ${visualMovementClass}`} aria-hidden="true" />
              <span className="cover-card__cover-slider-handle" aria-hidden="true" />
              <input
                className="cover-card__cover-range"
                type="range"
                min={0}
                max={100}
                step={COVER_POSITION_STEP}
                value={sliderValue}
                disabled={!canUsePosition}
                aria-label={`Posizione ${model.title}`}
                aria-valuetext={`${sliderValue}%`}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  pointerActiveRef.current = true;
                  setDraftPosition(snapPosition(Number(event.currentTarget.value)));
                }}
                onPointerUp={(event) => {
                  event.stopPropagation();
                  pointerActiveRef.current = false;
                  commitPosition(Number(event.currentTarget.value));
                  skipNextBlurCommitRef.current = true;
                }}
                onPointerCancel={(event) => {
                  event.stopPropagation();
                  pointerActiveRef.current = false;
                  setDraftPosition(null);
                }}
                onChange={(event) => setDraftPosition(snapPosition(Number(event.currentTarget.value)))}
                onClick={(event) => event.stopPropagation()}
                onKeyUp={(event) => {
                  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
                    commitPosition(Number(event.currentTarget.value));
                  }
                }}
                onBlur={(event) => {
                  if (skipNextBlurCommitRef.current) {
                    skipNextBlurCommitRef.current = false;
                    return;
                  }
                  if (draftPosition !== null && !pointerActiveRef.current) {
                    commitPosition(Number(event.currentTarget.value));
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {isEditMode ? (
        <div
          role="button"
          tabIndex={0}
          className="cover-card__edit-handle widget-card-handle cursor-grab"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              onOpen();
            }
          }}
          aria-label={`Configura ${model.title}`}
        />
      ) : null}
    </div>
  );
}
