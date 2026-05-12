import { GRID_ENGINE_BREAKPOINTS } from './DashboardGrid';

export type GridEngineBreakpoint = keyof typeof GRID_ENGINE_BREAKPOINTS;
export type BreakpointCardDensity = 'tiny' | 'compact' | 'regular';

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

export function resolveCardDensityByBreakpoint(
  breakpoint: GridEngineBreakpoint | undefined,
  fallback: BreakpointCardDensity = 'regular',
): BreakpointCardDensity {
  if (!breakpoint) {
    return fallback;
  }
  return CARD_DENSITY_BY_BREAKPOINT[breakpoint] ?? fallback;
}

export const LIGHT_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, { w: number; hOff: number; hOn: number }> = {
  '2xl': { w: 2, hOff: 1, hOn: 2 },
  xl: { w: 2, hOff: 1, hOn: 2 },
  lg: { w: 2, hOff: 1, hOn: 2 },
  md: { w: 2, hOff: 1, hOn: 2 },
  sm: { w: 1, hOff: 1, hOn: 2 },
  xs: { w: 1, hOff: 1, hOn: 2 },
};

export const CLIMATE_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, { w: number; h: number }> = {
  '2xl': { w: 3, h: 3 },
  xl: { w: 3, h: 3 },
  lg: { w: 3, h: 3 },
  md: { w: 3, h: 3 },
  sm: { w: 2, h: 3 },
  xs: { w: 1, h: 3 },
};

export const MEDIA_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, { w: number; h: number }> = {
  '2xl': { w: 2, h: 3 },
  xl: { w: 2, h: 3 },
  lg: { w: 2, h: 3 },
  md: { w: 2, h: 3 },
  sm: { w: 1, h: 3 },
  xs: { w: 1, h: 3 },
};

export const VACUUM_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, { w: number; h: number }> = {
  '2xl': { w: 2, h: 3 },
  xl: { w: 2, h: 3 },
  lg: { w: 2, h: 3 },
  md: { w: 2, h: 3 },
  sm: { w: 2, h: 3 },
  xs: { w: 1, h: 3 },
};

export const COVER_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, { w: number; h: number }> = {
  '2xl': { w: 2, h: 3 },
  xl: { w: 2, h: 3 },
  lg: { w: 2, h: 3 },
  md: { w: 2, h: 3 },
  sm: { w: 1, h: 3 },
  xs: { w: 1, h: 2 },
};

export const CAMERA_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, { w: number; h: number }> = {
  '2xl': { w: 4, h: 3 },
  xl: { w: 4, h: 3 },
  lg: { w: 4, h: 3 },
  md: { w: 4, h: 3 },
  sm: { w: 1, h: 3 },
  xs: { w: 1, h: 2 },
};

export const SENSOR_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, { w: number; h: number }> = {
  '2xl': { w: 2, h: 2 },
  xl: { w: 2, h: 2 },
  lg: { w: 2, h: 2 },
  md: { w: 2, h: 2 },
  sm: { w: 1, h: 2 },
  xs: { w: 1, h: 1 },
};

export const LOCK_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, { w: number; h: number }> = {
  '2xl': { w: 2, h: 2 },
  xl: { w: 2, h: 2 },
  lg: { w: 2, h: 2 },
  md: { w: 2, h: 2 },
  sm: { w: 1, h: 2 },
  xs: { w: 1, h: 1 },
};

export const ALARM_WIDGET_SPAN_BY_BREAKPOINT: Record<GridEngineBreakpoint, { w: number; h: number }> = {
  '2xl': { w: 2, h: 2 },
  xl: { w: 2, h: 2 },
  lg: { w: 2, h: 2 },
  md: { w: 2, h: 2 },
  sm: { w: 1, h: 2 },
  xs: { w: 1, h: 2 },
};
