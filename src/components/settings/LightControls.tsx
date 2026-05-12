import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, Palette, Power, Sun } from 'lucide-react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import './LightControls.css';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';

const COLOR_PICKER_DEBOUNCE_MS = 160;

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
  };
  onToggle: () => void;
  onBrightnessChange: (value: number) => void;
  onColorTempChange: (kelvin: number) => void;
  onColorChange: (hs: [number, number]) => void;
}

export function LightControlsPanel({
  lamp,
  onToggle,
  onBrightnessChange,
  onColorTempChange,
  onColorChange,
}: LightControlsProps) {
  const colorDebounceRef = useRef<number | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isAdjustingBrightness, setIsAdjustingBrightness] = useState(false);
  const brightness = Math.round(lamp.brightness);
  const [brightnessDraft, setBrightnessDraft] = useState(brightness);
  const supportsBrightness = lamp.supportsBrightness ?? true;
  const supportsColorTemp = lamp.supportsColorTemp ?? true;
  const supportsColor = lamp.supportsColor ?? true;
  const presets: Array<{ label: string; kelvin: number }> = [
    { label: 'Warm', kelvin: 2700 },
    { label: 'Neutral', kelvin: 4000 },
    { label: 'Cool', kelvin: 5200 },
    { label: 'Day', kelvin: 6500 },
  ];
  const colorDots: Array<[number, number]> = [
    [32, 94],
    [225, 68],
    [152, 72],
    [272, 70],
  ];
  const currentStateLabel = lamp.isOn ? 'Accesa' : 'Spenta';

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
    colorDots.forEach(([hue], index) => {
      const diff = Math.abs(hue - lamp.hsColor[0]);
      if (diff < nearestDiff) {
        nearest = index;
        nearestDiff = diff;
      }
    });
    return nearest;
  }, [colorDots, lamp.hsColor]);

  const sliderAccent = lamp.isOn
    ? `hsl(${lamp.hsColor[0]} ${Math.max(56, lamp.hsColor[1])}% 62%)`
    : 'rgba(255,255,255,0.16)';
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
      onColorChange(rgbToHs(rgb));
      colorDebounceRef.current = null;
    }, COLOR_PICKER_DEBOUNCE_MS);
  };

  return (
    <div className={CONTEXT_PANEL_LAYOUT.shell}>
      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-full bg-white/10 border border-white/12 flex items-center justify-center text-white">
              <Lightbulb size={23} />
            </span>
            <div>
              <h2 className="text-[1.35rem] font-semibold tracking-tight text-white">{lamp.name}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{currentStateLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${
              lamp.isOn
                ? 'bg-white border-white text-slate-900 shadow-[0_8px_24px_rgba(255,255,255,0.25)]'
                : 'bg-white/8 border-white/15 text-white'
            }`}
            aria-label="Accendi o spegni luce"
          >
            <Power size={20} />
          </button>
        </div>
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">Luminosita</span>
          <span className="text-sm text-gray-300">{supportsBrightness ? `${Math.round(brightnessDraft)}%` : 'N/D'}</span>
        </div>

        <div
          className={`relative h-16 rounded-full overflow-hidden bg-black/35 border border-white/10 ${
            supportsBrightness ? '' : 'opacity-50'
          }`}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
            style={{
              width: `${Math.max(0, Math.min(100, brightnessDraft))}%`,
              background: `linear-gradient(90deg, rgba(255,255,255,0.88) 0%, ${sliderAccent} 100%)`,
            }}
          />

          <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center ${lamp.isOn ? 'bg-white/26 text-white' : 'bg-white/10 text-gray-300'}`}>
              <Sun size={18} />
            </span>
            <span className="text-sm font-semibold tracking-wide text-white">{`${Math.round(brightnessDraft)}%`}</span>
          </div>

          <input
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-none"
            type="range"
            min={0}
            max={100}
            step={1}
            value={brightnessDraft}
            onPointerDown={() => {
              if (!supportsBrightness) {
                return;
              }
              setIsAdjustingBrightness(true);
            }}
            onPointerUp={() => {
              if (!supportsBrightness) {
                return;
              }
              setIsAdjustingBrightness(false);
            }}
            onPointerCancel={() => {
              if (!supportsBrightness) {
                return;
              }
              setIsAdjustingBrightness(false);
            }}
            onBlur={() => {
              if (!supportsBrightness) {
                return;
              }
              setIsAdjustingBrightness(false);
            }}
            onChange={(event) => {
              if (!supportsBrightness) {
                return;
              }
              const nextValue = clamp(Number(event.target.value), 0, 100);
              setBrightnessDraft(nextValue);
              onBrightnessChange(nextValue);
            }}
            disabled={!supportsBrightness}
            aria-label="Luminosita lampada"
            aria-valuetext={`${Math.round(brightnessDraft)}%`}
          />
        </div>
        {!supportsBrightness ? (
          <p className="mt-3 text-xs text-white/50">Questa entita non supporta il controllo luminosita.</p>
        ) : null}
      </div>

      <div
        className={`${CONTEXT_PANEL_LAYOUT.section} mb-1 ${
          supportsColorTemp ? '' : 'opacity-50'
        }`}
      >
        <div className="flex items-center gap-2 mb-4 text-white/75">
          <Sun size={16} />
          <span className="text-sm text-gray-300">Temperatura colore</span>
        </div>

        <div className="relative rounded-full p-1 bg-black/35 border border-white/10">
          <div
            className="absolute top-1 bottom-1 left-1 rounded-full bg-white/20 border border-white/25 transition-transform duration-300"
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
                onClick={() => {
                  if (!supportsColorTemp) {
                    return;
                  }
                  onColorTempChange(preset.kelvin);
                }}
                disabled={!supportsColorTemp}
                className={`h-10 rounded-full text-xs font-medium transition-colors ${
                  index === activeTempIndex ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                } ${supportsColorTemp ? '' : 'cursor-not-allowed'}
                ${
                  !supportsColorTemp && index === activeTempIndex ? 'text-white/65' : ''
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        {!supportsColorTemp ? (
          <p className="mt-3 text-xs text-white/50">Questa entita non supporta la temperatura colore.</p>
        ) : null}
      </div>

      <div
        className={`${CONTEXT_PANEL_LAYOUT.section} mt-auto ${
          supportsColor ? '' : 'opacity-50'
        }`}
      >
        <div className="flex items-center gap-2 mb-5 text-white/75">
          <Palette size={16} />
          <span className="text-sm text-gray-300">Colori rapidi</span>
        </div>

        <div className="flex items-center gap-3">
          {colorDots.map(([hue, sat], index) => (
            <button
              key={`${hue}-${sat}`}
              type="button"
              onClick={() => {
                if (!supportsColor) {
                  return;
                }
                clearPendingColorDebounce();
                onColorChange([hue, sat]);
              }}
              disabled={!supportsColor}
              className={`w-11 h-11 rounded-full transition-transform hover:scale-105 ${
                index === activeSwatchIndex
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#090b12]'
                  : 'ring-1 ring-white/20 ring-offset-0'
              } ${supportsColor ? '' : 'cursor-not-allowed'}`}
              style={{ backgroundColor: `hsl(${hue} ${sat}% 52%)` }}
              aria-label={`Imposta colore ${hue}`}
            />
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.14em] text-white/55">Picker colore</p>
            <button
              type="button"
              onClick={() => {
                if (!supportsColor) {
                  return;
                }
                setIsPickerOpen((prev) => !prev);
              }}
              disabled={!supportsColor}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                supportsColor
                  ? 'border-white/20 bg-white/10 text-white hover:bg-white/15'
                  : 'border-white/10 bg-white/5 text-white/45 cursor-not-allowed'
              }`}
            >
              {isPickerOpen ? 'Chiudi' : 'Apri'}
            </button>
          </div>
          <div
            className={`mt-3 w-full rounded-xl border p-3 transition-colors ${
              supportsColor
                ? 'border-white/15 bg-white/5'
                : 'border-white/8 bg-white/[0.04] cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">Colore personalizzato</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-xs text-white/80">
                <span
                  className="h-4 w-4 rounded-full border border-white/30"
                  style={{ backgroundColor: pickerColor }}
                  aria-hidden="true"
                />
                {pickerColor.toUpperCase()}
              </span>
            </div>
            {isPickerOpen ? (
              <div className="ha-light-color-picker mt-4">
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
        {!supportsColor ? (
          <p className="mt-3 text-xs text-white/50">Questa entita non supporta i colori RGB/HS.</p>
        ) : null}
      </div>
    </div>
  );
}

export const LightControls = LightControlsPanel;
