import type { Widget } from '../../types/dashboardModels';
import type { WidgetLogicalSize } from './cardLayout';
import { getWidgetLogicalSize } from './cardLayout';

export type CardVariant = 'micro' | 'compact' | 'standard' | 'expanded' | 'hero';

export function resolveCardVariantFromSize(logicalSize: WidgetLogicalSize): CardVariant {
  const width = Math.max(1, Math.round(logicalSize.widthUnits));
  const height = Math.max(1, Math.round(logicalSize.heightUnits));
  const area = width * height;

  if (width <= 1 && height <= 1) {
    return 'micro';
  }
  if (area <= 2 || width <= 1 || height <= 1) {
    return 'compact';
  }
  if (area <= 4) {
    return 'standard';
  }
  if (area <= 6) {
    return 'expanded';
  }
  return 'hero';
}

export function resolveCardVariant(widget: Widget): CardVariant {
  return resolveCardVariantFromSize(getWidgetLogicalSize(widget));
}
