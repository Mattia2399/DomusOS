import type { GridItem, WidgetKind } from '../../types/dashboardModels';
import type { GridEngineBreakpoint } from '../dashboard/dashboardBreakpointConfig';
import {
  ALARM_CARD_CAPABILITY,
  CAMERA_CARD_CAPABILITY,
  CLIMATE_CARD_CAPABILITY,
  COVER_CARD_CAPABILITY,
  LIGHT_CARD_CAPABILITY,
  LOCK_CARD_CAPABILITY,
  MEDIA_CARD_CAPABILITY,
  resolveCardDisplayVariant,
  SENSOR_CARD_CAPABILITY,
  SWITCH_CARD_CAPABILITY,
  VACUUM_CARD_CAPABILITY,
} from './cardCapabilityRegistry';

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

type ResolveMediaPixelDisplayVariantInput = {
  width: number;
  height: number;
};

type ResolveCameraPixelDisplayVariantInput = {
  width: number;
  height: number;
};

type ResolveLockPixelDisplayVariantInput = {
  width: number;
  height: number;
};

type ResolveCoverPixelDisplayVariantInput = {
  width: number;
  height: number;
};

type ResolveVacuumPixelDisplayVariantInput = {
  width: number;
  height: number;
};

export function resolveSensorPixelDisplayVariant({
  width,
  height,
  previousVariant,
}: ResolveSensorPixelDisplayVariantInput): WidgetDisplayVariant {
  return SENSOR_CARD_CAPABILITY.resolvePixelDisplayVariant({ width, height, previousVariant });
}

export function resolveLightPixelDisplayVariant({
  width,
  height,
}: ResolveLightPixelDisplayVariantInput): WidgetDisplayVariant {
  return LIGHT_CARD_CAPABILITY.resolvePixelDisplayVariant({ width, height });
}

export function resolveSwitchPixelDisplayVariant({
  width,
  height,
}: ResolveSwitchPixelDisplayVariantInput): WidgetDisplayVariant {
  return SWITCH_CARD_CAPABILITY.resolvePixelDisplayVariant({ width, height });
}

export function resolveClimatePixelDisplayVariant({
  width,
  height,
}: ResolveClimatePixelDisplayVariantInput): WidgetDisplayVariant {
  return CLIMATE_CARD_CAPABILITY.resolvePixelDisplayVariant({ width, height });
}

export function resolveAlarmPixelDisplayVariant({
  width,
  height,
}: ResolveAlarmPixelDisplayVariantInput): WidgetDisplayVariant {
  return ALARM_CARD_CAPABILITY.resolvePixelDisplayVariant({ width, height });
}

export function resolveMediaPixelDisplayVariant({
  width,
  height,
}: ResolveMediaPixelDisplayVariantInput): WidgetDisplayVariant {
  return MEDIA_CARD_CAPABILITY.resolvePixelDisplayVariant({ width, height });
}

export function resolveCameraPixelDisplayVariant({
  width,
  height,
}: ResolveCameraPixelDisplayVariantInput): WidgetDisplayVariant {
  return CAMERA_CARD_CAPABILITY.resolvePixelDisplayVariant({ width, height });
}

export function resolveLockPixelDisplayVariant({
  width,
  height,
}: ResolveLockPixelDisplayVariantInput): WidgetDisplayVariant {
  return LOCK_CARD_CAPABILITY.resolvePixelDisplayVariant({ width, height });
}

export function resolveCoverPixelDisplayVariant({
  width,
  height,
}: ResolveCoverPixelDisplayVariantInput): WidgetDisplayVariant {
  return COVER_CARD_CAPABILITY.resolvePixelDisplayVariant({ width, height });
}

export function resolveVacuumPixelDisplayVariant({
  width,
  height,
}: ResolveVacuumPixelDisplayVariantInput): WidgetDisplayVariant {
  return VACUUM_CARD_CAPABILITY.resolvePixelDisplayVariant({ width, height });
}

type ResolveWidgetDisplayVariantInput = {
  kind: WidgetKind;
  breakpoint?: GridEngineBreakpoint;
  layout: Pick<GridItem, 'w' | 'h'>;
  parentSectionId?: string;
};

export function resolveWidgetDisplayVariant({
  kind,
  breakpoint,
  layout,
  parentSectionId,
}: ResolveWidgetDisplayVariantInput): WidgetDisplayVariant {
  return resolveCardDisplayVariant(kind, {
    breakpoint,
    layout,
    isInsideStack: Boolean(parentSectionId),
  });
}
