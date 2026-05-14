import type { BreakpointCardDensity, GridEngineBreakpoint } from '../dashboard/dashboardBreakpointConfig';
import { resolveCardDensityByBreakpoint } from '../dashboard/dashboardBreakpointConfig';
import type { WidgetLogicalSize } from './cardLayout';

export type WidgetCardMode = 'mini' | 'compact' | 'full';

const DENSITY_TO_MODE: Record<BreakpointCardDensity, WidgetCardMode> = {
  tiny: 'mini',
  compact: 'compact',
  regular: 'full',
};

const MODE_RANK: Record<WidgetCardMode, number> = {
  mini: 0,
  compact: 1,
  full: 2,
};

function resolveModeFromLogicalSize(logicalSize: WidgetLogicalSize): WidgetCardMode {
  if (logicalSize.widthUnits <= 1 && logicalSize.heightUnits <= 1) {
    return 'mini';
  }
  if (logicalSize.widthUnits <= 1 || logicalSize.heightUnits <= 1) {
    return 'compact';
  }
  return 'full';
}

function pickMostCompactMode(first: WidgetCardMode, second: WidgetCardMode): WidgetCardMode {
  return MODE_RANK[first] <= MODE_RANK[second] ? first : second;
}

export function resolveWidgetCardMode(
  gridBreakpoint: GridEngineBreakpoint | undefined,
  logicalSize: WidgetLogicalSize,
  fallback: WidgetCardMode = 'full',
): WidgetCardMode {
  const density = resolveCardDensityByBreakpoint(gridBreakpoint, 'regular');
  const modeFromDensity = DENSITY_TO_MODE[density] ?? fallback;
  const modeFromSize = resolveModeFromLogicalSize(logicalSize);
  return pickMostCompactMode(modeFromDensity, modeFromSize);
}

