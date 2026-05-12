import type { Widget } from '../../types/dashboardModels';

export type WidgetLogicalSize = {
  widthUnits: number;
  heightUnits: number;
  rawHeightUnits: number;
  isRootWidget: boolean;
};

export function getWidgetLogicalSize(widget: Widget): WidgetLogicalSize {
  const widthUnits = Math.max(1, Math.round(widget.layout.w));
  const rawHeightUnits = Math.max(1, Math.round(widget.layout.h));
  const isRootWidget = !widget.parentSectionId;
  const heightUnits = rawHeightUnits;

  return {
    widthUnits,
    heightUnits,
    rawHeightUnits,
    isRootWidget,
  };
}
