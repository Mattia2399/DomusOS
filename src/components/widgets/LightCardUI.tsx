import React, { useEffect, useMemo, useRef } from 'react';
import { Clock3, Lightbulb } from 'lucide-react';
import './LightCardUI.css';

export interface LightCardUIProps {
  entityId?: string;
  name: string;
  state: 'on' | 'off' | 'unavailable';
  selected?: boolean;
  brightness?: number; // 0-100 or 0-255
  colorMode?: string;
  hsColor?: [number, number];
  rgbColor?: [number, number, number];
  activeTimerEnd?: number;
  showBrightnessSlider?: boolean;
  onToggle?: () => void;
  onBrightnessChange?: (newVal: number) => void;
  onLongPress?: (entityId: string) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function statusLabel(state: LightCardUIProps['state']) {
  if (state === 'on') {
    return 'Accesa';
  }
  if (state === 'unavailable') {
    return 'Non disponibile';
  }
  return 'Spenta';
}

function normalizeRgb(rgb: [number, number, number] | undefined) {
  if (!rgb || rgb.length !== 3) {
    return null;
  }
  const [r, g, b] = rgb;
  const safeR = clamp(Math.round(Number(r) || 0), 0, 255);
  const safeG = clamp(Math.round(Number(g) || 0), 0, 255);
  const safeB = clamp(Math.round(Number(b) || 0), 0, 255);
  return [safeR, safeG, safeB] as [number, number, number];
}

function hsToRgb(hs: [number, number] | undefined) {
  if (!hs || hs.length !== 2) {
    return null;
  }
  const hue = ((Number(hs[0]) || 0) % 360 + 360) % 360;
  const sat = clamp((Number(hs[1]) || 0) / 100, 0, 1);
  const c = sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;
  if (hue < 60) {
    rPrime = c;
    gPrime = x;
  } else if (hue < 120) {
    rPrime = x;
    gPrime = c;
  } else if (hue < 180) {
    gPrime = c;
    bPrime = x;
  } else if (hue < 240) {
    gPrime = x;
    bPrime = c;
  } else if (hue < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }
  return [
    Math.round((rPrime + (1 - c)) * 255),
    Math.round((gPrime + (1 - c)) * 255),
    Math.round((bPrime + (1 - c)) * 255),
  ] as [number, number, number];
}

function mixWithWhite(rgb: [number, number, number], ratio: number) {
  const mix = clamp(ratio, 0, 1);
  return [
    Math.round(rgb[0] * (1 - mix) + 255 * mix),
    Math.round(rgb[1] * (1 - mix) + 255 * mix),
    Math.round(rgb[2] * (1 - mix) + 255 * mix),
  ] as [number, number, number];
}

function mixWithBlack(rgb: [number, number, number], ratio: number) {
  const mix = clamp(ratio, 0, 1);
  return [
    Math.round(rgb[0] * (1 - mix)),
    Math.round(rgb[1] * (1 - mix)),
    Math.round(rgb[2] * (1 - mix)),
  ] as [number, number, number];
}

function rgbaString(rgb: [number, number, number], alpha = 1) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export function LightCardUI({
  entityId,
  name,
  state,
  selected = false,
  brightness,
  colorMode,
  hsColor,
  rgbColor,
  activeTimerEnd,
  showBrightnessSlider = true,
  onToggle,
  onBrightnessChange,
  onLongPress,
}: LightCardUIProps) {
  const isOn = state === 'on';
  const isUnavailable = state === 'unavailable';
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  const inputScale = useMemo(() => {
    const raw = typeof brightness === 'number' ? brightness : 0;
    return raw > 100 ? 255 : 100;
  }, [brightness]);

  const normalizedValue = useMemo(() => {
    const fallback = isOn ? 72 : 0;
    const raw = typeof brightness === 'number' ? brightness : fallback;
    const clamped = clamp(raw, 0, inputScale);
    return Math.round((clamped / inputScale) * 100);
  }, [brightness, inputScale, isOn]);

  const sliderValueLabel = `${normalizedValue}%`;
  const canRenderSlider = isOn && showBrightnessSlider;
  const statusText = isOn
    ? `${statusLabel(state)} \u2022 ${normalizedValue}%`
    : statusLabel(state);
  const hasActiveTimer = activeTimerEnd !== undefined;
  const supportsRgb = useMemo(() => {
    const mode = (colorMode ?? '').toLowerCase();
    return mode.includes('rgb') || mode.includes('hs') || mode.includes('xy') || Boolean(rgbColor) || Boolean(hsColor);
  }, [colorMode, hsColor, rgbColor]);
  const resolvedBaseRgb = useMemo(() => {
    return normalizeRgb(rgbColor) ?? hsToRgb(hsColor);
  }, [rgbColor, hsColor]);
  const onSurfaceStyle = useMemo(() => {
    if (!isOn || !supportsRgb || !resolvedBaseRgb) {
      return undefined;
    }
    const start = mixWithWhite(resolvedBaseRgb, 0.16);
    const mid = mixWithWhite(resolvedBaseRgb, 0.08);
    const end = mixWithBlack(resolvedBaseRgb, 0.12);
    const sliderRight = mixWithBlack(resolvedBaseRgb, 0.18);
    return {
      ['--light-card-on-start' as string]: rgbaString(start),
      ['--light-card-on-mid' as string]: rgbaString(mid),
      ['--light-card-on-end' as string]: rgbaString(end),
      ['--light-card-on-glow' as string]: rgbaString(resolvedBaseRgb, 0.28),
      ['--light-slider-right' as string]: rgbaString(sliderRight, 0.86),
    } as React.CSSProperties;
  }, [isOn, resolvedBaseRgb, supportsRgb]);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startLongPress = () => {
    if (!onLongPress || !entityId) {
      return;
    }
    clearLongPressTimer();
    longPressFiredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      onLongPress(entityId);
    }, 500);
  };

  const stopLongPress = () => {
    clearLongPressTimer();
  };

  useEffect(
    () => () => {
      clearLongPressTimer();
    },
    [],
  );

  return (
    <div
      className={`light-card-ui light-card-ui--${state}${selected ? ' light-card-ui--selected' : ''}${
        showBrightnessSlider ? '' : ' light-card-ui--slider-hidden'
      }`}
    >
      <div
        className="light-card-ui__surface"
        style={onSurfaceStyle}
        role={onToggle ? 'button' : undefined}
        tabIndex={onToggle ? 0 : undefined}
        onPointerDown={startLongPress}
        onPointerUp={stopLongPress}
        onPointerLeave={stopLongPress}
        onPointerCancel={stopLongPress}
        onClick={() => {
          if (longPressFiredRef.current) {
            longPressFiredRef.current = false;
            return;
          }
          if (!onToggle || isUnavailable) {
            return;
          }
          onToggle();
        }}
        onKeyDown={(event) => {
          if (!onToggle || isUnavailable) {
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle();
          }
        }}
        aria-disabled={isUnavailable}
        aria-pressed={onToggle ? isOn : undefined}
      >
        <div className="light-card-ui__header">
          <span className="light-card-ui__icon-shell" aria-hidden="true">
            <Lightbulb className="light-card-ui__icon" />
          </span>
          <div className="light-card-ui__meta">
            <div className="light-card-ui__name">{name}</div>
            <div className="light-card-ui__status">{statusText}</div>
          </div>
          {hasActiveTimer ? (
            <span className="light-card-ui__timer-badge" aria-label="Timer attivo">
              <Clock3 className="light-card-ui__timer-icon" />
            </span>
          ) : null}
        </div>

        <div className="light-card-ui__expand" aria-hidden={!canRenderSlider}>
          <div className="light-card-ui__slider-wrap" onClick={(event) => event.stopPropagation()}>
            {canRenderSlider ? (
              <input
                className="light-card-ui__slider"
                type="range"
                min={0}
                max={100}
                step={1}
                value={normalizedValue}
                aria-label={`Brightness ${name}`}
                aria-valuetext={sliderValueLabel}
                onPointerDown={(event) => event.stopPropagation()}
                onChange={(event) => {
                  if (!onBrightnessChange) {
                    return;
                  }
                  const nextPercent = clamp(Number(event.target.value), 0, 100);
                  const nextValue =
                    inputScale === 255
                      ? Math.round((nextPercent / 100) * 255)
                      : nextPercent;
                  onBrightnessChange(nextValue);
                }}
                disabled={!isOn || isUnavailable || !onBrightnessChange}
                style={
                  {
                    ['--light-slider-fill' as string]: `${normalizedValue}%`,
                  } as React.CSSProperties
                }
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LightCardUI;
