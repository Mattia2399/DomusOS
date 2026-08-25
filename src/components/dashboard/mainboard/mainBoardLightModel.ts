import type { MockEntityState } from '../../../types/ha';
import { toFiniteNumber, toTrimmedString } from './mainBoardValueUtils';

const LIGHT_FEATURE_BRIGHTNESS = 1;
const LIGHT_FEATURE_COLOR_TEMP = 2;
const LIGHT_FEATURE_EFFECT = 4;
const LIGHT_FEATURE_FLASH = 8;
const LIGHT_FEATURE_COLOR = 16;
const LIGHT_FEATURE_TRANSITION = 32;
const LIGHT_FEATURE_WHITE = 128;
const LIGHT_COLOR_MODES_WITH_BRIGHTNESS = new Set([
  'brightness',
  'white',
  'color_temp',
  'hs',
  'xy',
  'rgb',
  'rgbw',
  'rgbww',
]);
const LIGHT_COLOR_MODE_PRIORITY = ['hs', 'rgb', 'xy', 'rgbw', 'rgbww'] as const;

export type LightColorPayloadMode = (typeof LIGHT_COLOR_MODE_PRIORITY)[number];
export type LightCommandOptions = {
  transition?: number;
};
export type LightFlashMode = 'short' | 'long';

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLightColorMode(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function readLightSupportedColorModes(entity: MockEntityState | undefined) {
  const rawModes =
    entity?.supportedColorModes ??
    entity?.supported_color_modes ??
    entity?.rawAttributes?.supported_color_modes;
  if (!Array.isArray(rawModes)) {
    return [];
  }
  return rawModes
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => normalizeLightColorMode(entry))
    .filter(Boolean);
}

function readLightEffectList(entity: MockEntityState | undefined) {
  const rawEffects = entity?.effectList ?? entity?.effect_list ?? entity?.rawAttributes?.effect_list;
  if (!Array.isArray(rawEffects)) {
    return [];
  }
  const seen = new Set<string>();
  return rawEffects
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => {
      const key = entry.toLowerCase();
      if (!entry || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function hsToRgbColor(hue: number, saturation: number): [number, number, number] {
  const h = ((Number(hue) || 0) % 360 + 360) % 360;
  const s = clampNumber((Number(saturation) || 0) / 100, 0, 1);
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
  return [
    Math.round(clampNumber((rPrime + m) * 255, 0, 255)),
    Math.round(clampNumber((gPrime + m) * 255, 0, 255)),
    Math.round(clampNumber((bPrime + m) * 255, 0, 255)),
  ];
}

function rgbToXyColor(rgb: [number, number, number]): [number, number] {
  const normalizeChannel = (channel: number) => {
    const normalized = clampNumber(channel, 0, 255) / 255;
    return normalized > 0.04045
      ? ((normalized + 0.055) / 1.055) ** 2.4
      : normalized / 12.92;
  };
  const red = normalizeChannel(rgb[0]);
  const green = normalizeChannel(rgb[1]);
  const blue = normalizeChannel(rgb[2]);
  const x = red * 0.664511 + green * 0.154324 + blue * 0.162028;
  const y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
  const z = red * 0.000088 + green * 0.07231 + blue * 0.986039;
  const total = x + y + z;
  return total <= 0
    ? [0.3127, 0.329]
    : [Math.round((x / total) * 10000) / 10000, Math.round((y / total) * 10000) / 10000];
}

export function buildLightColorServicePayload(
  mode: LightColorPayloadMode,
  hsColor: [number, number],
) {
  const safeHue = clampNumber(Math.round(hsColor[0]), 0, 360);
  const safeSat = clampNumber(Math.round(hsColor[1]), 0, 100);
  const rgbColor = hsToRgbColor(safeHue, safeSat);
  if (mode === 'hs') return { hs_color: [safeHue, safeSat] };
  if (mode === 'rgb') return { rgb_color: rgbColor };
  if (mode === 'xy') return { xy_color: rgbToXyColor(rgbColor) };
  if (mode === 'rgbw') return { rgbw_color: [...rgbColor, 0] };
  return { rgbww_color: [...rgbColor, 0, 0] };
}

export function buildLightCommandOptionsPayload(options?: LightCommandOptions) {
  const transition = toFiniteNumber(options?.transition);
  return transition === undefined || transition <= 0
    ? {}
    : { transition: Math.round(transition * 10) / 10 };
}

export function percentToHaBrightness(value: number) {
  return Math.round((clampNumber(value, 0, 100) / 100) * 255);
}

export function resolveLightCapabilities(entity?: MockEntityState) {
  if (!entity) {
    return {
      supportedColorModes: [...LIGHT_COLOR_MODE_PRIORITY, 'color_temp', 'brightness'],
      colorMode: 'hs',
      preferredColorMode: 'hs' as LightColorPayloadMode,
      supportsOnOff: true,
      supportsBrightness: true,
      supportsColorTemp: true,
      supportsColor: true,
      supportsHs: true,
      supportsRgb: true,
      supportsRgbw: true,
      supportsRgbww: true,
      supportsXy: true,
      supportsWhite: true,
      supportsEffects: true,
      supportsFlash: true,
      supportsTransition: true,
      minColorTempKelvin: 2000,
      maxColorTempKelvin: 6500,
      activeEffect: undefined,
      effectList: ['off', 'colorloop', 'pulse'],
    };
  }

  const supportedColorModes = readLightSupportedColorModes(entity);
  const features = typeof entity.supportedFeatures === 'number' ? entity.supportedFeatures : 0;
  const hasExplicitColorModes = supportedColorModes.length > 0;
  const colorMode = normalizeLightColorMode(
    entity.colorMode ?? entity.color_mode ?? entity.rawAttributes?.color_mode,
  );
  const hasLegacyColorFeature = (features & LIGHT_FEATURE_COLOR) !== 0;
  const supportsHs =
    supportedColorModes.includes('hs') ||
    (!hasExplicitColorModes && hasLegacyColorFeature) ||
    Array.isArray(entity.hsColor ?? entity.hs_color);
  const supportsRgb =
    supportedColorModes.includes('rgb') ||
    (!hasExplicitColorModes && hasLegacyColorFeature) ||
    Array.isArray(entity.rgbColor ?? entity.rgb_color);
  const supportsRgbw =
    supportedColorModes.includes('rgbw') || Array.isArray(entity.rgbwColor ?? entity.rgbw_color);
  const supportsRgbww =
    supportedColorModes.includes('rgbww') || Array.isArray(entity.rgbwwColor ?? entity.rgbww_color);
  const supportsXy =
    supportedColorModes.includes('xy') || Array.isArray(entity.xyColor ?? entity.xy_color);
  const supportsColor = supportsHs || supportsRgb || supportsRgbw || supportsRgbww || supportsXy;
  const supportsColorTemp =
    supportedColorModes.includes('color_temp') ||
    (features & LIGHT_FEATURE_COLOR_TEMP) !== 0 ||
    typeof entity.colorTempKelvin === 'number' ||
    typeof entity.color_temp_kelvin === 'number' ||
    typeof entity.rawAttributes?.min_color_temp_kelvin === 'number' ||
    typeof entity.rawAttributes?.max_color_temp_kelvin === 'number';
  const supportsWhite =
    supportedColorModes.includes('white') || (features & LIGHT_FEATURE_WHITE) !== 0;
  const supportsBrightness =
    supportedColorModes.some((mode) => LIGHT_COLOR_MODES_WITH_BRIGHTNESS.has(mode)) ||
    (features & LIGHT_FEATURE_BRIGHTNESS) !== 0 ||
    typeof entity.brightness === 'number' ||
    entity.rawAttributes?.brightness !== undefined ||
    supportsColor ||
    supportsColorTemp ||
    supportsWhite;
  const effectList = readLightEffectList(entity);
  const supportsEffects = effectList.length > 0 || (features & LIGHT_FEATURE_EFFECT) !== 0;
  const supportsFlash = (features & LIGHT_FEATURE_FLASH) !== 0;
  const supportsTransition = (features & LIGHT_FEATURE_TRANSITION) !== 0;
  const preferredColorMode =
    LIGHT_COLOR_MODE_PRIORITY.find((mode) => {
      if (mode === 'hs') return supportsHs;
      if (mode === 'rgb') return supportsRgb;
      if (mode === 'xy') return supportsXy;
      if (mode === 'rgbw') return supportsRgbw;
      return supportsRgbww;
    }) ?? null;
  const minColorTempKelvin =
    toFiniteNumber(entity.minColorTempKelvin) ??
    toFiniteNumber(entity.min_color_temp_kelvin) ??
    toFiniteNumber(entity.rawAttributes?.min_color_temp_kelvin) ??
    2000;
  const maxColorTempKelvin =
    toFiniteNumber(entity.maxColorTempKelvin) ??
    toFiniteNumber(entity.max_color_temp_kelvin) ??
    toFiniteNumber(entity.rawAttributes?.max_color_temp_kelvin) ??
    6500;

  return {
    supportedColorModes,
    colorMode,
    preferredColorMode,
    supportsOnOff: supportedColorModes.includes('onoff') || !hasExplicitColorModes || Boolean(entity.state),
    supportsBrightness,
    supportsColorTemp,
    supportsColor,
    supportsHs,
    supportsRgb,
    supportsRgbw,
    supportsRgbww,
    supportsXy,
    supportsWhite,
    supportsEffects,
    supportsFlash,
    supportsTransition,
    minColorTempKelvin: Math.min(minColorTempKelvin, maxColorTempKelvin),
    maxColorTempKelvin: Math.max(minColorTempKelvin, maxColorTempKelvin),
    activeEffect: toTrimmedString(entity.effect) ?? toTrimmedString(entity.rawAttributes?.effect),
    effectList,
  };
}
