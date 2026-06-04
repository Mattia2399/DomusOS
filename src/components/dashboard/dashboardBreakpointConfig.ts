import { GRID_ENGINE_BREAKPOINTS } from './DashboardGrid';
import type { WidgetKind } from '../../types/dashboardModels';
import {
  DASHBOARD_GRID_BREAKPOINT_ORDER,
  type WidgetTypeBreakpointLayoutOverride,
  type WidgetTypeLayoutOverrides,
} from '../../types/widgetTypeLayout';

export type GridEngineBreakpoint = keyof typeof GRID_ENGINE_BREAKPOINTS;
export type BreakpointCardDensity = 'tiny' | 'compact' | 'regular';

type WidgetSpan = { w: number; h: number };
type LightWidgetSpan = { w: number; hOff: number; hOn: number };
type SectionSpan = { w: number; h: number };

const WIDGET_KIND_ORDER: WidgetKind[] = [
  'light',
  'climate',
  'camera',
  'sensor',
  'media',
  'alarm',
  'vacuum',
  'lock',
  'cover',
  'members',
];
const GRID_BREAKPOINTS: readonly GridEngineBreakpoint[] = DASHBOARD_GRID_BREAKPOINT_ORDER;

let activeWidgetTypeLayoutOverrides: WidgetTypeLayoutOverrides = {};

function toPositiveInt(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  return Math.max(1, Math.round(value));
}

function resolveLockMinimumHeight(breakpoint: GridEngineBreakpoint) {
  return breakpoint === 'xs' || breakpoint === 'sm' ? 1 : 2;
}

function clampLockHeight(height: number | undefined, breakpoint: GridEngineBreakpoint) {
  if (height === undefined) {
    return undefined;
  }
  return Math.max(resolveLockMinimumHeight(breakpoint), height);
}

function normalizeBreakpointOverride(raw: WidgetTypeBreakpointLayoutOverride | undefined) {
  if (!raw) {
    return undefined;
  }
  const w = toPositiveInt(raw.w);
  const h = toPositiveInt(raw.h);
  const hOn = toPositiveInt(raw.hOn);
  const hOff = toPositiveInt(raw.hOff);
  if (!w && !h && !hOn && !hOff) {
    return undefined;
  }
  return {
    ...(w ? { w } : null),
    ...(h ? { h } : null),
    ...(hOn ? { hOn } : null),
    ...(hOff ? { hOff } : null),
  };
}

export function normalizeWidgetTypeLayoutOverrides(overrides: WidgetTypeLayoutOverrides | undefined): WidgetTypeLayoutOverrides {
  if (!overrides) {
    return {};
  }
  const normalized: WidgetTypeLayoutOverrides = {};
  WIDGET_KIND_ORDER.forEach((kind) => {
    const sourceByBreakpoint = overrides[kind];
    if (!sourceByBreakpoint) {
      return;
    }
    const nextByBreakpoint: Partial<Record<GridEngineBreakpoint, WidgetTypeBreakpointLayoutOverride>> = {};
    GRID_BREAKPOINTS.forEach((breakpoint) => {
      const next = normalizeBreakpointOverride(sourceByBreakpoint[breakpoint]);
      if (!next) {
        return;
      }
      if (kind === 'lock') {
        nextByBreakpoint[breakpoint] = {
          ...next,
          ...(next.h ? { h: clampLockHeight(next.h, breakpoint) } : null),
          ...(next.hOn ? { hOn: clampLockHeight(next.hOn, breakpoint) } : null),
          ...(next.hOff ? { hOff: clampLockHeight(next.hOff, breakpoint) } : null),
        };
        return;
      }
      nextByBreakpoint[breakpoint] = next;
    });
    if (Object.keys(nextByBreakpoint).length > 0) {
      normalized[kind] = nextByBreakpoint;
    }
  });
  return normalized;
}

export function setActiveWidgetTypeLayoutOverrides(overrides: WidgetTypeLayoutOverrides | undefined) {
  activeWidgetTypeLayoutOverrides = normalizeWidgetTypeLayoutOverrides(overrides);
}

export function getActiveWidgetTypeLayoutOverrides() {
  return activeWidgetTypeLayoutOverrides;
}

export const CARD_DENSITY_BY_BREAKPOINT: Record<GridEngineBreakpoint, BreakpointCardDensity> = {
  '2xl': 'regular',
  xl: 'regular',
  lg: 'regular',
  md: 'regular',
  sm: 'compact',
  xs: 'tiny',
};

export const STACK_GRID_COLS_BY_BREAKPOINT: Record<GridEngineBreakpoint, number> = {
  '2xl': 6,
  xl: 6,
  lg: 5,
  md: 4,
  sm: 3,
  xs: 2,
};

export const SCENES_SECTION_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, SectionSpan> = {
  '2xl': { w: 8, h: 2 },
  xl: { w: 8, h: 2 },
  lg: { w: 8, h: 2 },
  md: { w: 6, h: 2 },
  sm: { w: 4, h: 2 },
  xs: { w: 2, h: 2 },
};

export function resolveCardDensityByBreakpoint(
  breakpoint: GridEngineBreakpoint | undefined,
  fallback: BreakpointCardDensity = 'regular',
): BreakpointCardDensity {
  if (!breakpoint) {
    return fallback;
  }
  return CARD_DENSITY_BY_BREAKPOINT[breakpoint] ?? fallback;
}

// ─── DEFINIZIONI LAYOUT DEFAULT ─────────────────────────────────────────────

const DEFAULT_LIGHT_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, LightWidgetSpan> = {
  '2xl': { w: 2, hOff: 1, hOn: 2 },
  xl: { w: 2, hOff: 1, hOn: 2 },
  lg: { w: 2, hOff: 1, hOn: 2 },
  md: { w: 2, hOff: 1, hOn: 2 },
  sm: { w: 1, hOff: 1, hOn: 2 },
  xs: { w: 1, hOff: 1, hOn: 2 }, // Luce sta bene a w=1 per affiancarsi su mobile
};

const DEFAULT_CLIMATE_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, WidgetSpan> = {
  '2xl': { w: 3, h: 3 },
  xl: { w: 3, h: 3 },
  lg: { w: 3, h: 3 },
  md: { w: 3, h: 3 },
  sm: { w: 2, h: 3 },
  xs: { w: 2, h: 3 }, // AGGIORNATO: Il termostato deve occupare tutto lo schermo mobile
};

const DEFAULT_MEDIA_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, WidgetSpan> = {
  '2xl': { w: 2, h: 3 },
  xl: { w: 2, h: 3 },
  lg: { w: 2, h: 3 },
  md: { w: 2, h: 3 },
  sm: { w: 1, h: 3 },
  xs: { w: 2, h: 3 }, // AGGIORNATO: I controlli media richiedono larghezza
};

const DEFAULT_VACUUM_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, WidgetSpan> = {
  '2xl': { w: 2, h: 3 },
  xl: { w: 2, h: 3 },
  lg: { w: 2, h: 3 },
  md: { w: 2, h: 3 },
  sm: { w: 2, h: 3 },
  xs: { w: 2, h: 3 }, // AGGIORNATO: Controlli aspirapolvere a larghezza intera
};

const DEFAULT_COVER_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, WidgetSpan> = {
  '2xl': { w: 2, h: 3 },
  xl: { w: 2, h: 3 },
  lg: { w: 2, h: 3 },
  md: { w: 2, h: 3 },
  sm: { w: 1, h: 3 },
  xs: { w: 1, h: 2 }, // Cover può stare affiancata
};

const DEFAULT_CAMERA_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, WidgetSpan> = {
  '2xl': { w: 4, h: 3 },
  xl: { w: 4, h: 3 },
  lg: { w: 4, h: 3 },
  md: { w: 4, h: 3 },
  sm: { w: 1, h: 3 },
  xs: { w: 2, h: 2 }, // AGGIORNATO: Il flusso video ha bisogno di tutto lo spazio orizzontale
};

const DEFAULT_SENSOR_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, WidgetSpan> = {
  '2xl': { w: 2, h: 3 },
  xl: { w: 2, h: 3 },
  lg: { w: 2, h: 2 },
  md: { w: 2, h: 3 },
  sm: { w: 1, h: 2 },
  xs: { w: 1, h: 1 }, // I sensori devono affiancarsi
};

const DEFAULT_MEMBERS_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, WidgetSpan> = {
  '2xl': { w: 3, h: 2 },
  xl: { w: 3, h: 2 },
  lg: { w: 3, h: 2 },
  md: { w: 2, h: 2 },
  sm: { w: 2, h: 2 },
  xs: { w: 2, h: 2 }, // AGGIORNATO: Lista membri allineata in orizzontale
};

const DEFAULT_LOCK_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, WidgetSpan> = {
  '2xl': { w: 2, h: 3 },
  xl: { w: 2, h: 3 },
  lg: { w: 2, h: 2 },
  md: { w: 2, h: 2 },
  sm: { w: 1, h: 2 },
  xs: { w: 1, h: 1 }, // Serratura può stare affiancata
};

const DEFAULT_ALARM_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, WidgetSpan> = {
  '2xl': { w: 2, h: 2 },
  xl: { w: 2, h: 2 },
  lg: { w: 2, h: 2 },
  md: { w: 2, h: 2 },
  sm: { w: 1, h: 2 },
  xs: { w: 2, h: 2 }, // AGGIORNATO: Tastierino allarme largo per usabilità
};

// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_WIDGET_SPANS_BY_KIND: Record<Exclude<WidgetKind, 'light'>, Record<GridEngineBreakpoint, WidgetSpan>> = {
  climate: DEFAULT_CLIMATE_WIDGET_SPAN_BY_BREAKPOINT,
  camera: DEFAULT_CAMERA_WIDGET_SPAN_BY_BREAKPOINT,
  sensor: DEFAULT_SENSOR_WIDGET_SPAN_BY_BREAKPOINT,
  media: DEFAULT_MEDIA_WIDGET_SPAN_BY_BREAKPOINT,
  alarm: DEFAULT_ALARM_WIDGET_SPAN_BY_BREAKPOINT,
  vacuum: DEFAULT_VACUUM_WIDGET_SPAN_BY_BREAKPOINT,
  lock: DEFAULT_LOCK_WIDGET_SPAN_BY_BREAKPOINT,
  cover: DEFAULT_COVER_WIDGET_SPAN_BY_BREAKPOINT,
  members: DEFAULT_MEMBERS_WIDGET_SPAN_BY_BREAKPOINT,
};

function resolveSimpleWidgetSpanWithOverrides(
  kind: Exclude<WidgetKind, 'light'>,
  breakpoint: GridEngineBreakpoint,
) {
  const base = DEFAULT_WIDGET_SPANS_BY_KIND[kind][breakpoint];
  const override = activeWidgetTypeLayoutOverrides[kind]?.[breakpoint];
  const minimumHeight = kind === 'lock' ? resolveLockMinimumHeight(breakpoint) : 1;
  if (!override) {
    return {
      ...base,
      h: Math.max(minimumHeight, base.h),
    };
  }
  return {
    w: toPositiveInt(override.w) ?? base.w,
    h: Math.max(minimumHeight, toPositiveInt(override.h ?? override.hOn ?? override.hOff) ?? base.h),
  };
}

function resolveLightWidgetSpanWithOverrides(breakpoint: GridEngineBreakpoint) {
  const base = DEFAULT_LIGHT_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  const override = activeWidgetTypeLayoutOverrides.light?.[breakpoint];
  if (!override) {
    return base;
  }
  const fallbackHeight = toPositiveInt(override.h);
  return {
    w: toPositiveInt(override.w) ?? base.w,
    hOn: toPositiveInt(override.hOn) ?? fallbackHeight ?? base.hOn,
    hOff: toPositiveInt(override.hOff) ?? fallbackHeight ?? base.hOff,
  };
}

function createSimpleWidgetSpanProxy(kind: Exclude<WidgetKind, 'light'>) {
  const base = DEFAULT_WIDGET_SPANS_BY_KIND[kind];
  return new Proxy(base, {
    get(target, property, receiver) {
      if (typeof property === 'string' && GRID_BREAKPOINTS.includes(property as GridEngineBreakpoint)) {
        return resolveSimpleWidgetSpanWithOverrides(kind, property as GridEngineBreakpoint);
      }
      return Reflect.get(target, property, receiver);
    },
  }) as Record<GridEngineBreakpoint, WidgetSpan>;
}

function createLightWidgetSpanProxy() {
  return new Proxy(DEFAULT_LIGHT_WIDGET_SPAN_BY_BREAKPOINT, {
    get(target, property, receiver) {
      if (typeof property === 'string' && GRID_BREAKPOINTS.includes(property as GridEngineBreakpoint)) {
        return resolveLightWidgetSpanWithOverrides(property as GridEngineBreakpoint);
      }
      return Reflect.get(target, property, receiver);
    },
  }) as Record<GridEngineBreakpoint, LightWidgetSpan>;
}

export function resolveWidgetTypeLayoutSpan(
  kind: WidgetKind,
  breakpoint: GridEngineBreakpoint,
  overrides: WidgetTypeLayoutOverrides | undefined = activeWidgetTypeLayoutOverrides,
): { w: number; h: number; hOn?: number; hOff?: number } {
  if (kind === 'light') {
    const base = DEFAULT_LIGHT_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
    const override = overrides?.light?.[breakpoint];
    const fallbackHeight = toPositiveInt(override?.h);
    const hOn = toPositiveInt(override?.hOn) ?? fallbackHeight ?? base.hOn;
    const hOff = toPositiveInt(override?.hOff) ?? fallbackHeight ?? base.hOff;
    return {
      w: toPositiveInt(override?.w) ?? base.w,
      h: Math.max(hOn, hOff),
      hOn,
      hOff,
    };
  }
  const base = DEFAULT_WIDGET_SPANS_BY_KIND[kind][breakpoint];
  const override = overrides?.[kind]?.[breakpoint];
  const minimumHeight = kind === 'lock' ? resolveLockMinimumHeight(breakpoint) : 1;
  return {
    w: toPositiveInt(override?.w) ?? base.w,
    h: Math.max(minimumHeight, toPositiveInt(override?.h ?? override?.hOn ?? override?.hOff) ?? base.h),
  };
}

export const LIGHT_WIDGET_SPAN_BY_BREAKPOINT = createLightWidgetSpanProxy();
export const CLIMATE_WIDGET_SPAN_BY_BREAKPOINT = createSimpleWidgetSpanProxy('climate');
export const MEDIA_WIDGET_SPAN_BY_BREAKPOINT = createSimpleWidgetSpanProxy('media');
export const VACUUM_WIDGET_SPAN_BY_BREAKPOINT = createSimpleWidgetSpanProxy('vacuum');
export const COVER_WIDGET_SPAN_BY_BREAKPOINT = createSimpleWidgetSpanProxy('cover');
export const CAMERA_WIDGET_SPAN_BY_BREAKPOINT = createSimpleWidgetSpanProxy('camera');
export const SENSOR_WIDGET_SPAN_BY_BREAKPOINT = createSimpleWidgetSpanProxy('sensor');
export const MEMBERS_WIDGET_SPAN_BY_BREAKPOINT = createSimpleWidgetSpanProxy('members');
export const LOCK_WIDGET_SPAN_BY_BREAKPOINT = createSimpleWidgetSpanProxy('lock');
export const ALARM_WIDGET_SPAN_BY_BREAKPOINT = createSimpleWidgetSpanProxy('alarm');
