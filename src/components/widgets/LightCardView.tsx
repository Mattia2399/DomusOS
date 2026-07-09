import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, Lightbulb, Palette, Sparkles, Sun, Thermometer } from 'lucide-react';
import type { WidgetDisplayVariant } from './widgetDisplayVariant';
import type { LightCardModel } from './lightCardModel';
import './LightCard.css';

type LightCardViewProps = {
  model: LightCardModel;
  isSelected: boolean;
  isEditMode: boolean;
  onToggle: () => void;
  onBrightnessChange?: (value: number) => void;
  onColorChange?: (hs: [number, number]) => void;
  rootRef?: React.Ref<HTMLDivElement>;
  layoutVariant?: WidgetDisplayVariant;
};

type SliderMode = 'brightness' | 'color';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function LightCardView({
  model,
  isSelected,
  isEditMode,
  onToggle,
  onBrightnessChange,
  onColorChange,
  rootRef,
  layoutVariant,
}: LightCardViewProps) {
  const [sliderMode, setSliderMode] = useState<SliderMode>('brightness');
  const [draftValue, setDraftValue] = useState<number | null>(null);
  const pointerActiveRef = useRef(false);
  const skipNextBlurCommitRef = useRef(false);
  const canUseColor = model.isOn && model.supportsColor && Boolean(onColorChange);
  const canUseBrightness = model.isOn && model.supportsBrightness && Boolean(onBrightnessChange);
  const sourceValue = sliderMode === 'color' ? model.hue : model.brightness;
  const sliderValue = draftValue ?? sourceValue;
  const sliderMaximum = sliderMode === 'color' ? 360 : 100;
  const progress = (sliderValue / sliderMaximum) * 100;
  const effectiveSaturation = Math.max(72, model.saturation);
  const accentRgb = model.rgb.join(' ');
  const rootStyle = useMemo(
    () => ({
      '--light-accent-rgb': accentRgb,
      '--light-slider-progress': `${clamp(progress, 0, 100)}%`,
      '--light-slider-hue': `${clamp(sliderMode === 'color' ? sliderValue : model.hue, 0, 360)}`,
    }) as React.CSSProperties,
    [accentRgb, model.hue, progress, sliderMode, sliderValue],
  );

  useEffect(() => {
    if (!model.supportsColor && sliderMode === 'color') {
      setSliderMode('brightness');
      setDraftValue(null);
    }
  }, [model.supportsColor, sliderMode]);

  useEffect(() => {
    if (!pointerActiveRef.current) setDraftValue(null);
  }, [model.brightness, model.hue, sliderMode]);

  const commitSliderValue = (rawValue: number) => {
    const value = clamp(Math.round(rawValue), 0, sliderMaximum);
    setDraftValue(value);
    if (sliderMode === 'color') {
      onColorChange?.([value, effectiveSaturation]);
    } else {
      onBrightnessChange?.(value);
    }
  };

  const detailItems = [
    model.supportsColor
      ? { id: 'color', icon: <Palette />, label: 'Colore', value: `${model.hue}°`, swatch: true }
      : null,
    model.supportsColorTemp && model.colorTempKelvin
      ? { id: 'temperature', icon: <Thermometer />, label: 'Temperatura', value: `${model.colorTempKelvin} K` }
      : null,
    model.effect
      ? { id: 'effect', icon: <Sparkles />, label: 'Effetto', value: model.effect }
      : null,
  ].filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <div
      ref={rootRef}
      className={`light-card ${isSelected ? 'selection-corners' : ''}`}
      data-light-state={model.available ? (model.isOn ? 'on' : 'off') : 'unavailable'}
      data-light-mode={sliderMode}
      data-light-variant={layoutVariant}
      data-light-has-details={detailItems.length > 0 ? 'true' : 'false'}
      style={rootStyle}
    >
      <div className="liquid-glass-card light-card__surface">
        <div className={`light-card__icon-shell ${model.pending ? 'light-card__icon-shell--pending' : ''}`} aria-hidden="true">
          <Lightbulb className="light-card__icon" />
        </div>

        <div className="light-card__meta">
          <p className="light-card__title" title={model.title}>{model.title}</p>
          <p className="light-card__status">{model.statusLabel}</p>
        </div>

        {model.timerActive ? (
          <span className="light-card__timer" title="Timer attivo" aria-label="Timer attivo">
            <Clock3 />
          </span>
        ) : null}

        <div className="light-card__controls" onClick={(event) => event.stopPropagation()}>
          <input
            className="light-card__slider"
            type="range"
            min={0}
            max={sliderMaximum}
            step={1}
            value={sliderValue}
            disabled={sliderMode === 'color' ? !canUseColor : !canUseBrightness}
            aria-label={sliderMode === 'color' ? `Colore ${model.title}` : `Luminosità ${model.title}`}
            aria-valuetext={sliderMode === 'color' ? `${Math.round(sliderValue)} gradi` : `${Math.round(sliderValue)}%`}
            onPointerDown={(event) => {
              event.stopPropagation();
              pointerActiveRef.current = true;
              setDraftValue(Number(event.currentTarget.value));
            }}
            onPointerUp={(event) => {
              event.stopPropagation();
              pointerActiveRef.current = false;
              commitSliderValue(Number(event.currentTarget.value));
              skipNextBlurCommitRef.current = true;
            }}
            onPointerCancel={(event) => {
              event.stopPropagation();
              pointerActiveRef.current = false;
              setDraftValue(null);
            }}
            onChange={(event) => setDraftValue(Number(event.currentTarget.value))}
            onKeyUp={(event) => {
              if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
                commitSliderValue(Number(event.currentTarget.value));
              }
            }}
            onBlur={(event) => {
              if (skipNextBlurCommitRef.current) {
                skipNextBlurCommitRef.current = false;
                return;
              }
              if (draftValue !== null && !pointerActiveRef.current) {
                commitSliderValue(Number(event.currentTarget.value));
              }
            }}
          />

          {model.supportsColor ? (
            <button
              type="button"
              className="light-card__mode-button"
              disabled={!model.isOn || !model.available || !onColorChange}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setDraftValue(null);
                setSliderMode((current) => current === 'brightness' ? 'color' : 'brightness');
              }}
              aria-label={sliderMode === 'brightness' ? 'Passa al controllo colore' : 'Torna al controllo luminosità'}
              title={sliderMode === 'brightness' ? 'Colore' : 'Luminosità'}
            >
              {sliderMode === 'brightness' ? <Palette /> : <Sun />}
            </button>
          ) : null}
        </div>

        <div className="light-card__details" aria-label="Dettagli luce">
          {detailItems.map((item) => (
            <span key={item.id} className="light-card__detail">
              <span className={`light-card__detail-icon ${item.swatch ? 'light-card__detail-icon--swatch' : ''}`}>{item.icon}</span>
              <span className="light-card__detail-copy">
                <small>{item.label}</small>
                <strong>{item.value}</strong>
              </span>
            </span>
          ))}
        </div>

        {isEditMode ? (
          <div
            role="button"
            tabIndex={0}
            className="light-card__edit-handle widget-card-handle cursor-grab"
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                onToggle();
              }
            }}
            aria-label={`Configura ${model.title}`}
          />
        ) : (
          <button
            type="button"
            className="light-card__toggle"
            onClick={onToggle}
            disabled={!model.available}
            aria-pressed={model.isOn}
            aria-label={`${model.isOn ? 'Spegni' : 'Accendi'} ${model.title}`}
          />
        )}
      </div>
    </div>
  );
}
