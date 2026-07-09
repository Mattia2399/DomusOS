import type { GridItem, WidgetKind } from '../../types/dashboardModels';
import type { GridEngineBreakpoint } from '../dashboard/dashboardBreakpointConfig';

export type WidgetDisplayVariant = 'mini' | 'compact' | 'standard' | 'full';

export type WidgetDisplayMetrics = {
  widgetId: string;
  width: number;
  height: number;
  variant: WidgetDisplayVariant;
};

type ResolveSensorPixelDisplayVariantInput = {
  width: number;
  height: number;
  previousVariant?: WidgetDisplayVariant;
};

type ResolveLightPixelDisplayVariantInput = {
  width: number;
  height: number;
};

type ResolveSwitchPixelDisplayVariantInput = {
  width: number;
  height: number;
};

type ResolveClimatePixelDisplayVariantInput = {
  width: number;
  height: number;
};

type ResolveAlarmPixelDisplayVariantInput = {
  width: number;
  height: number;
};

type ResolveLockPixelDisplayVariantInput = {
  width: number;
  height: number;
};

const SENSOR_PIXEL_VARIANT_RANK: Record<WidgetDisplayVariant, number> = {
  mini: 0,
  compact: 1,
  standard: 2,
  full: 3,
};

const SENSOR_PIXEL_HYSTERESIS_WIDTH = 8;
const SENSOR_PIXEL_HYSTERESIS_HEIGHT = 4;

function fitsSensorPixelVariant(
  variant: WidgetDisplayVariant,
  width: number,
  height: number,
  direction: -1 | 0 | 1 = 0,
) {
  const widthMargin = SENSOR_PIXEL_HYSTERESIS_WIDTH * direction;
  const heightMargin = SENSOR_PIXEL_HYSTERESIS_HEIGHT * direction;

  if (variant === 'mini') {
    return true;
  }
  if (variant === 'compact') {
    return (
      (width >= 132 + widthMargin && height >= 44 + heightMargin) ||
      (width >= 88 + widthMargin && height >= 96 + heightMargin)
    );
  }
  if (variant === 'standard') {
    return width >= 170 + widthMargin && height >= 104 + heightMargin;
  }
  return (
    (width >= 260 + widthMargin && height >= 104 + heightMargin) ||
    (width >= 176 + widthMargin && height >= 160 + heightMargin)
  );
}

function resolveSensorPixelVariantWithoutHysteresis(width: number, height: number): WidgetDisplayVariant {
  if (fitsSensorPixelVariant('full', width, height)) {
    return 'full';
  }
  if (fitsSensorPixelVariant('standard', width, height)) {
    return 'standard';
  }
  if (fitsSensorPixelVariant('compact', width, height)) {
    return 'compact';
  }
  return 'mini';
}

export function resolveSensorPixelDisplayVariant({
  width,
  height,
  previousVariant,
}: ResolveSensorPixelDisplayVariantInput): WidgetDisplayVariant {
  const safeWidth = Math.max(0, Number.isFinite(width) ? width : 0);
  const safeHeight = Math.max(0, Number.isFinite(height) ? height : 0);
  const nextVariant = resolveSensorPixelVariantWithoutHysteresis(safeWidth, safeHeight);

  if (!previousVariant || nextVariant === previousVariant) {
    return nextVariant;
  }

  const isPromotion = SENSOR_PIXEL_VARIANT_RANK[nextVariant] > SENSOR_PIXEL_VARIANT_RANK[previousVariant];
  if (isPromotion) {
    return fitsSensorPixelVariant(nextVariant, safeWidth, safeHeight, 1) ? nextVariant : previousVariant;
  }

  return fitsSensorPixelVariant(previousVariant, safeWidth, safeHeight, -1) ? previousVariant : nextVariant;
}

export function resolveLightPixelDisplayVariant({
  width,
  height,
}: ResolveLightPixelDisplayVariantInput): WidgetDisplayVariant {
  const safeWidth = Math.max(0, Number.isFinite(width) ? width : 0);
  const safeHeight = Math.max(0, Number.isFinite(height) ? height : 0);
  if ((safeWidth >= 260 && safeHeight >= 104) || (safeWidth >= 176 && safeHeight >= 160)) {
    return 'full';
  }
  if (safeWidth >= 170 && safeHeight >= 104) {
    return 'standard';
  }
  if ((safeWidth >= 132 && safeHeight >= 44) || (safeWidth >= 88 && safeHeight >= 96)) {
    return 'compact';
  }
  return 'mini';
}

export function resolveSwitchPixelDisplayVariant({
  width,
  height,
}: ResolveSwitchPixelDisplayVariantInput): WidgetDisplayVariant {
  const safeWidth = Math.max(0, Number.isFinite(width) ? width : 0);
  const safeHeight = Math.max(0, Number.isFinite(height) ? height : 0);
  if ((safeWidth >= 260 && safeHeight >= 104) || (safeWidth >= 176 && safeHeight >= 160)) {
    return 'full';
  }
  if (safeWidth >= 170 && safeHeight >= 104) {
    return 'standard';
  }
  if ((safeWidth >= 132 && safeHeight >= 44) || (safeWidth >= 88 && safeHeight >= 96)) {
    return 'compact';
  }
  return 'mini';
}

export function resolveClimatePixelDisplayVariant({
  width,
  height,
}: ResolveClimatePixelDisplayVariantInput): WidgetDisplayVariant {
  const safeWidth = Math.max(0, Number.isFinite(width) ? width : 0);
  const safeHeight = Math.max(0, Number.isFinite(height) ? height : 0);
  if (safeWidth >= 260 && safeHeight >= 212) {
    return 'full';
  }
  if (safeWidth >= 200 && safeHeight >= 148) {
    return 'standard';
  }
  return 'compact';
}

export function resolveAlarmPixelDisplayVariant({
  width,
  height,
}: ResolveAlarmPixelDisplayVariantInput): WidgetDisplayVariant {
  const safeWidth = Math.max(0, Number.isFinite(width) ? width : 0);
  const safeHeight = Math.max(0, Number.isFinite(height) ? height : 0);
  if (safeWidth >= 260 && safeHeight >= 212) return 'full';
  if (safeWidth >= 200 && safeHeight >= 148) return 'standard';
  return 'compact';
}

export function resolveLockPixelDisplayVariant({
  width,
  height,
}: ResolveLockPixelDisplayVariantInput): WidgetDisplayVariant {
  const safeWidth = Math.max(0, Number.isFinite(width) ? width : 0);
  const safeHeight = Math.max(0, Number.isFinite(height) ? height : 0);
  if ((safeWidth >= 250 && safeHeight >= 188) || (safeWidth >= 176 && safeHeight >= 212)) {
    return 'full';
  }
  if (safeWidth >= 170 && safeHeight >= 160) {
    return 'standard';
  }
  if (safeWidth >= 132 && safeHeight >= 44) {
    return 'compact';
  }
  return 'mini';
}

type ResolveWidgetDisplayVariantInput = {
  kind: WidgetKind;
  breakpoint?: GridEngineBreakpoint;
  layout: Pick<GridItem, 'w' | 'h'>;
  parentSectionId?: string;
};

function toGridUnits(value: number | undefined, fallback = 1) {
  return Math.max(1, Math.round(value ?? fallback));
}

export function resolveWidgetDisplayVariant({
  kind,
  breakpoint,
  layout,
  parentSectionId,
}: ResolveWidgetDisplayVariantInput): WidgetDisplayVariant {
  const width = toGridUnits(layout.w);
  const height = toGridUnits(layout.h);
  const area = width * height;
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
  const isInsideStack = Boolean(parentSectionId);

  if (kind === 'climate') {
    if (width >= 2 && height >= 4) {
      return 'full';
    }
    if (width >= 2 && height >= 3) {
      return 'standard';
    }
    return 'compact';
  }

  if (kind === 'alarm') {
    if (width >= 2 && height >= 4) return 'full';
    if (width >= 2 && height >= 3) return 'standard';
    return 'compact';
  }

  if (kind === 'lock') {
    if ((width >= 2 && height >= 4) || (width >= 3 && height >= 2 && !isInsideStack)) {
      return 'full';
    }
    if (width >= 2 && height >= 3) {
      return 'standard';
    }
    if (width <= 1 && height <= 2) {
      return 'mini';
    }
    if (width >= 2 && height >= 2) {
      return 'compact';
    }
    return 'compact';
  }

  if (width <= 1 && height <= 1) {
    return 'mini';
  }

  if (height <= 1 || width <= 1 || area <= 2) {
    return 'compact';
  }

  if (kind === 'sensor') {
    if (width >= 2 && height >= 3 && !isMobile) {
      return 'full';
    }
    if (width >= 3 && height >= 2 && !isInsideStack) {
      return 'full';
    }
    return 'standard';
  }

  if (isMobile || area <= 4) {
    return 'standard';
  }

  return 'full';
}
