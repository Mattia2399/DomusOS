import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, Palette, Power, Sparkles, Sun, Timer, Zap } from 'lucide-react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import './LightControls.css';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';
import { ContextPanelHeader } from './ContextPanelHeader';

const COLOR_PICKER_DEBOUNCE_MS = 160;

const QUICK_COLOR_PRESETS = [
  { label: 'Ambra', hue: 32, saturation: 94 },
  { label: 'Blu', hue: 225, saturation: 68 },
  { label: 'Verde', hue: 152, saturation: 72 },
  { label: 'Viola', hue: 272, saturation: 70 },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hsToRgb(hue: number, saturation: number): [number, number, number] {
  const h = ((Number(hue) || 0) % 360 + 360) % 360;
  const s = clamp((Number(saturation) || 0) / 100, 0, 1);
  const c = s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;
  if (h < 60) {
    rPrime = c;
    gPrime = x;
  } else if (h < 120) {
    rPrime = x;
    gPrime = c;
  } else if (h < 180) {
    gPrime = c;
    bPrime = x;
  } else if (h < 240) {
    gPrime = x;
    bPrime = c;
  } else if (h < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }
  const m = 1 - c;
  return [Math.round((rPrime + m) * 255), Math.round((gPrime + m) * 255), Math.round((bPrime + m) * 255)];
}

function componentToHex(value: number) {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');
}

function rgbToHex(rgb: [number, number, number]) {
  return `#${componentToHex(rgb[0])}${componentToHex(rgb[1])}${componentToHex(rgb[2])}`;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function rgbToHs(rgb: [number, number, number]): [number, number] {
  const [r, g, b] = rgb.map((channel) => clamp(channel, 0, 255) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) {
      hue = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      hue = 60 * ((b - r) / delta + 2);
    } else {
      hue = 60 * ((r - g) / delta + 4);
    }
  }
  if (hue < 0) {
    hue += 360;
  }
  const sat = max === 0 ? 0 : (delta / max) * 100;
  return [Math.round(hue), Math.round(sat)];
}

interface LightControlsProps {
  lamp: {
    name: string;
    isOn: boolean;
    brightness: number;
    status: string;
    hsColor: [number, number];
    colorTemp: number;
    supportsBrightness?: boolean;
    supportsColorTemp?: boolean;
    supportsColor?: boolean;
    supportsWhite?: boolean;
    supportsEffects?: boolean;
    supportsFlash?: boolean;
    supportsTransition?: boolean;
    minColorTempKelvin?: number;
    maxColorTempKelvin?: number;
    effect?: string;
    effectList?: string[];
  };
  onToggle: () => void;
  onBrightnessChange: (value: number, options?: { transition?: number }) => void;
  onColorTempChange: (kelvin: number, options?: { transition?: number }) => void;
  onColorChange: (hs: [number, number], options?: { transition?: number }) => void;
  onWhiteChange: (value: number, options?: { transition?: number }) => void;
  onEffectChange: (effect: string, options?: { transition?: number }) => void;
  onFlash: (mode: 'short' | 'long') => void;
}

export function LightControlsPanel({
  lamp,
  onToggle,
  onBrightnessChange,
  onColorTempChange,
  onColorChange,
  onWhiteChange,
  onEffectChange,
  onFlash,
}: LightControlsProps) {
  const colorDebounceRef = useRef<number | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isAdjustingBrightness, setIsAdjustingBrightness] = useState(false);
  const brightness = Math.round(lamp.brightness);
  const [brightnessDraft, setBrightnessDraft] = useState(brightness);
  const [whiteDraft, setWhiteDraft] = useState(brightness);
  const [transitionSeconds, setTransitionSeconds] = useState(0);
  const supportsBrightness = lamp.supportsBrightness ?? true;
  const supportsColorTemp = lamp.supportsColorTemp ?? true;
  const supportsColor = lamp.supportsColor ?? true;
  const supportsWhite = lamp.supportsWhite ?? false;
  const supportsEffects = lamp.supportsEffects ?? false;
  const supportsFlash = lamp.supportsFlash ?? false;
  const supportsTransition = lamp.supportsTransition ?? false;
  const colorTempMin = Math.min(lamp.minColorTempKelvin ?? 2000, lamp.maxColorTempKelvin ?? 6500);
  const colorTempMax = Math.max(lamp.minColorTempKelvin ?? 2000, lamp.maxColorTempKelvin ?? 6500);
  const commandOptions = supportsTransition && transitionSeconds > 0 ? { transition: transitionSeconds } : undefined;
  const presets = useMemo<Array<{ label: string; kelvin: number }>>(() => {
    const range = Math.max(0, colorTempMax - colorTempMin);
    return [
      { label: 'Warm', kelvin: colorTempMin },
      { label: 'Neutral', kelvin: Math.round(colorTempMin + range * 0.38) },
      { label: 'Cool', kelvin: Math.round(colorTempMin + range * 0.68) },
      { label: 'Day', kelvin: colorTempMax },
    ];
  }, [colorTempMax, colorTempMin]);
  const effectOptions = useMemo(() => {
    const entries = (lamp.effectList ?? []).map((entry) => entry.trim()).filter(Boolean);
    const hasOff = entries.some((entry) => ['off', 'none'].includes(entry.toLowerCase()));
    return hasOff ? entries : ['off', ...entries];
  }, [lamp.effectList]);
  const currentStateLabel = lamp.isOn ? 'Accesa' : 'Spenta';
  const activeEffect = (lamp.effect?.trim() || 'off').toLowerCase();
  const hasAdvancedControls = supportsWhite || (supportsEffects && effectOptions.length > 0) || supportsFlash || supportsTransition;

  const activeTempIndex = useMemo(() => {
    let nearest = 0;
    let nearestDiff = Number.POSITIVE_INFINITY;
    presets.forEach((preset, index) => {
      const diff = Math.abs(lamp.colorTemp - preset.kelvin);
      if (diff < nearestDiff) {
        nearest = index;
        nearestDiff = diff;
      }
    });
    return nearest;
  }, [lamp.colorTemp, presets]);

  const activeSwatchIndex = useMemo(() => {
    let nearest = 0;
    let nearestDiff = Number.POSITIVE_INFINITY;
    QUICK_COLOR_PRESETS.forEach((preset, index) => {
      const diff = Math.abs(preset.hue - lamp.hsColor[0]);
      if (diff < nearestDiff) {
        nearest = index;
        nearestDiff = diff;
      }
    });
    return nearest;
  }, [lamp.hsColor]);

  const sliderAccent = lamp.isOn
    ? `hsl(${lamp.hsColor[0]} ${Math.max(56, lamp.hsColor[1])}% 62%)`
    : 'rgba(255,255,255,0.16)';
  const displayedBrightness = lamp.isOn ? brightnessDraft : 0;
  const displayedWhite = lamp.isOn ? whiteDraft : 0;
  const currentColorHex = useMemo(() => rgbToHex(hsToRgb(lamp.hsColor[0], lamp.hsColor[1])), [lamp.hsColor]);
  const [pickerColor, setPickerColor] = useState(currentColorHex);

  useEffect(() => {
    setPickerColor(currentColorHex);
  }, [currentColorHex]);

  useEffect(() => {
    if (isAdjustingBrightness) {
      return;
    }
    setBrightnessDraft(brightness);
    setWhiteDraft(brightness);
  }, [brightness, isAdjustingBrightness]);

  const clearPendingColorDebounce = () => {
    if (colorDebounceRef.current !== null) {
      window.clearTimeout(colorDebounceRef.current);
      colorDebounceRef.current = null;
    }
  };

  useEffect(
    () => () => {
      clearPendingColorDebounce();
    },
    [],
  );

  useEffect(() => {
    if (!supportsColor) {
      clearPendingColorDebounce();
      setIsPickerOpen(false);
    }
  }, [supportsColor]);

  useEffect(() => {
    if (!supportsBrightness) {
      setIsAdjustingBrightness(false);
    }
  }, [supportsBrightness]);

  const handlePickerChange = (nextHex: string) => {
    setPickerColor(nextHex);
    if (!supportsColor) {
      return;
    }
    clearPendingColorDebounce();
    colorDebounceRef.current = window.setTimeout(() => {
      const rgb = hexToRgb(nextHex);
      if (!rgb) {
        return;
      }
      onColorChange(rgbToHs(rgb), commandOptions);
      colorDebounceRef.current = null;
    }, COLOR_PICKER_DEBOUNCE_MS);
  };

  return (
    <div className={CONTEXT_PANEL_LAYOUT.shell}>
      <ContextPanelHeader title={lamp.name} subtitle={currentStateLabel} icon={<Lightbulb size={22} />} />

      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-sm text-gray-400">{supportsBrightness ? 'Luminosita' : 'Stato'}</span>
            <p className="mt-0.5 text-xs text-white/45">{currentStateLabel}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {supportsBrightness ? <span className="text-sm text-gray-300">{`${Math.round(displayedBrightness)}%`}</span> : null}
            <button
              type="button"
              onClick={onToggle}
              className={`h-10 w-10 rounded-full border flex items-center justify-center transition-all ${
                lamp.isOn
                  ? 'bg-white border-white text-slate-900 shadow-[0_8px_24px_rgba(255,255,255,0.22)]'
                  : 'bg-white/8 border-white/15 text-white'
              }`}
              aria-label="Accendi o spegni luce"
              title="Accendi o spegni luce"
            >
              <Power size={17} />
            </button>
          </div>
        </div>

        {supportsBrightness ? (
          <div className="relative h-16 overflow-hidden rounded-full border border-white/10 bg-black/35">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
              style={{
                width: `${Math.max(0, Math.min(100, displayedBrightness))}%`,
                background: `linear-gradient(90deg, rgba(255,255,255,0.88) 0%, ${sliderAccent} 100%)`,
              }}
            />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-5">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${lamp.isOn ? 'bg-white/26 text-white' : 'bg-white/10 text-gray-300'}`}>
                <Sun size={18} />
              </span>
              <span className="text-sm font-semibold tracking-wide text-white">{`${Math.round(displayedBrightness)}%`}</span>
            </div>

            <input
              className="absolute inset-0 h-full w-full cursor-pointer touch-none opacity-0"
              type="range"
              min={0}
              max={100}
              step={1}
              value={displayedBrightness}
              onPointerDown={() => {
                setIsAdjustingBrightness(true);
              }}
              onPointerUp={() => {
                setIsAdjustingBrightness(false);
              }}
              onPointerCancel={() => {
                setIsAdjustingBrightness(false);
              }}
              onBlur={() => {
                setIsAdjustingBrightness(false);
              }}
              onChange={(event) => {
                const nextValue = clamp(Number(event.target.value), 0, 100);
                setBrightnessDraft(nextValue);
                onBrightnessChange(nextValue, commandOptions);
              }}
              aria-label="Luminosita lampada"
              aria-valuetext={`${Math.round(displayedBrightness)}%`}
            />
          </div>
        ) : null}
      </div>

      {supportsColorTemp ? (
        <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
          <div className="mb-4 flex items-center justify-between gap-3 text-white/75">
            <span className="inline-flex min-w-0 items-center gap-2">
              <Sun size={16} />
              <span className="text-sm text-gray-300">Temperatura colore</span>
            </span>
          </div>

          <div className="liquid-segmented-control">
            <div
              className="liquid-segmented-thumb absolute bottom-1 left-1 top-1"
              style={{
                width: 'calc((100% - 0.5rem) / 4)',
                transform: `translateX(${activeTempIndex * 100}%)`,
              }}
            />

            <div className="relative grid grid-cols-4">
              {presets.map((preset, index) => (
                <button
                  key={preset.kelvin}
                  type="button"
                  onClick={() => onColorTempChange(preset.kelvin, commandOptions)}
                  className={`relative z-10 h-10 rounded-full text-xs font-medium transition-all duration-500 ease-[cubic-bezier(0.34,1.15,0.3,1)] ${
                    index === activeTempIndex ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]' : 'text-white/60 hover:text-white/90'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {supportsColor ? (
        <div className={`${CONTEXT_PANEL_LAYOUT.section} ${hasAdvancedControls ? 'mb-1' : 'mt-auto'}`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-white/78">
              <Palette size={16} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-300">Colore</p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/70">
              <span
                className="h-3.5 w-3.5 rounded-full border border-white/25"
                style={{ backgroundColor: pickerColor }}
                aria-hidden="true"
              />
              {pickerColor.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {QUICK_COLOR_PRESETS.map((preset, index) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  clearPendingColorDebounce();
                  onColorChange([preset.hue, preset.saturation], commandOptions);
                }}
                className={`group flex min-h-[4.6rem] flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-2.5 text-center transition-all active:scale-[0.97] ${
                  index === activeSwatchIndex
                    ? 'border-white/24 bg-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                    : 'border-white/[0.07] bg-white/[0.035] hover:bg-white/[0.07]'
                }`}
                aria-label={`Imposta colore ${preset.label}`}
                title={preset.label}
              >
                <span
                  className={`h-9 w-9 rounded-full border transition-transform group-hover:scale-105 ${
                    index === activeSwatchIndex
                      ? 'border-white/85 shadow-[0_0_0_3px_rgba(255,255,255,0.12),0_10px_20px_rgba(0,0,0,0.2)]'
                      : 'border-white/24 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                  }`}
                  style={{ backgroundColor: `hsl(${preset.hue} ${preset.saturation}% 52%)` }}
                  aria-hidden="true"
                />
                <span className="max-w-full truncate text-[11px] font-semibold leading-none text-white/72">{preset.label}</span>
              </button>
            ))}
          </div>

          <div className="liquid-glass-card mt-4 overflow-hidden rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setIsPickerOpen((prev) => !prev);
              }}
              className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.055] active:scale-[0.99]"
              aria-expanded={isPickerOpen}
              aria-label="Colore personalizzato"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="ha-light-spectrum-swatch h-10 w-10 shrink-0 rounded-full border border-white/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_20px_rgba(0,0,0,0.24)]" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white/86">Personalizzato</span>
                  <span className="mt-0.5 block truncate text-xs text-white/46">{pickerColor.toUpperCase()}</span>
                </span>
              </span>
              <span
                className={`h-8 w-8 shrink-0 rounded-full border transition-transform ${
                  isPickerOpen ? 'scale-110 border-white/70' : 'border-white/20'
                }`}
                style={{ backgroundColor: pickerColor }}
                aria-hidden="true"
              />
            </button>

            {isPickerOpen ? (
              <div className="ha-light-color-picker border-t border-white/[0.07] px-3.5 pb-3.5 pt-3">
                <HexColorPicker color={pickerColor} onChange={handlePickerChange} />
                <div className="mt-3 flex items-center gap-3">
                  <HexColorInput
                    color={pickerColor}
                    onChange={handlePickerChange}
                    prefixed
                    className="ha-light-color-picker__input"
                    aria-label="Colore HEX"
                  />
                  <span
                    className="ha-light-color-picker__swatch"
                    style={{ backgroundColor: pickerColor }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {hasAdvancedControls ? (
        <div className={`${CONTEXT_PANEL_LAYOUT.section} mt-auto space-y-4`}>
          <div className="flex items-center gap-2 text-white/78">
            <Sparkles size={16} />
            <span className="text-sm font-medium text-gray-300">Funzioni</span>
          </div>

          {supportsWhite ? (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="min-w-0 text-sm font-medium text-white/80">Bianco</span>
                <span className="shrink-0 text-xs font-semibold text-white/56">{Math.round(displayedWhite)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={displayedWhite}
                onChange={(event) => {
                  const nextValue = clamp(Number(event.target.value), 0, 100);
                  setWhiteDraft(nextValue);
                  onWhiteChange(nextValue, commandOptions);
                }}
                className="ha-light-range"
                aria-label="Canale bianco"
              />
            </div>
          ) : null}

          {supportsEffects && effectOptions.length > 0 ? (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="min-w-0 text-sm font-medium text-white/80">Effetti</span>
                <span className="truncate text-xs text-white/45">{lamp.effect || 'off'}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {effectOptions.map((effectName) => {
                  const normalizedEffect = effectName.toLowerCase();
                  const isActive = normalizedEffect === activeEffect;
                  const label = ['off', 'none'].includes(normalizedEffect) ? 'Nessuno' : effectName;
                  return (
                    <button
                      key={effectName}
                      type="button"
                      onClick={() => onEffectChange(effectName, commandOptions)}
                      className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all active:scale-[0.97] ${
                        isActive
                          ? 'border-white/35 bg-white/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                          : 'border-white/[0.08] bg-black/18 text-white/58 hover:bg-white/[0.07] hover:text-white/82'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {supportsFlash ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 text-sm font-medium text-white/80">Flash</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onFlash('short')}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-3 text-sm font-semibold text-white/76 transition-all hover:bg-white/[0.07] active:scale-[0.97]"
                >
                  <Zap size={15} />
                  Breve
                </button>
                <button
                  type="button"
                  onClick={() => onFlash('long')}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-3 text-sm font-semibold text-white/76 transition-all hover:bg-white/[0.07] active:scale-[0.97]"
                >
                  <Zap size={15} />
                  Lungo
                </button>
              </div>
            </div>
          ) : null}

          {supportsTransition ? (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-white/80">
                  <Timer size={15} />
                  Transizione
                </span>
                <span className="text-xs font-semibold text-white/56">{transitionSeconds.toFixed(transitionSeconds % 1 === 0 ? 0 : 1)}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={transitionSeconds}
                onChange={(event) => setTransitionSeconds(clamp(Number(event.target.value), 0, 10))}
                className="ha-light-range"
                aria-label="Durata transizione"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const LightControls = LightControlsPanel;
