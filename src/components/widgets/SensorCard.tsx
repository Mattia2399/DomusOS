import React, { useEffect, useMemo } from 'react';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { useObservedElementSize } from '../../hooks/useObservedElementSize';
import type { GridEngineBreakpoint } from '../dashboard/dashboardBreakpointConfig';
import { SensorCardView } from './SensorCardView';
import { buildSensorCardModel } from './sensorCardModel';
import {
  resolveSensorPixelDisplayVariant,
  resolveWidgetDisplayVariant,
  type WidgetDisplayMetrics,
  type WidgetDisplayVariant,
} from './widgetDisplayVariant';

type SensorCardProps = {
  widget: Widget;
  isSelected: boolean;
  value?: number;
  sensorHistory?: number[];
  isEditMode: boolean;
  onClick: () => void;
  liveEntity?: MockEntityState;
  batteryEntity?: MockEntityState;
  gridBreakpoint?: GridEngineBreakpoint;
  displayVariant?: WidgetDisplayVariant;
  onDisplayMetricsChange?: (metrics: WidgetDisplayMetrics) => void;
};

export function SensorCard({
  widget,
  isSelected,
  value,
  sensorHistory,
  isEditMode,
  onClick,
  liveEntity,
  batteryEntity,
  gridBreakpoint,
  displayVariant,
  onDisplayMetricsChange,
}: SensorCardProps) {
  const fallbackVariant =
    displayVariant ??
    resolveWidgetDisplayVariant({
      kind: widget.kind,
      breakpoint: gridBreakpoint,
      layout: widget.layout,
      parentSectionId: widget.parentSectionId,
    });
  const { ref: cardRef, size: observedSize } = useObservedElementSize<HTMLDivElement>(widget.id);
  const measuredSize = observedSize?.identity === widget.id ? observedSize : null;
  const layoutVariant = measuredSize
    ? resolveSensorPixelDisplayVariant({ width: measuredSize.width, height: measuredSize.height })
    : fallbackVariant;
  const model = useMemo(
    () => buildSensorCardModel({ widget, value, sensorHistory, liveEntity, batteryEntity }),
    [batteryEntity, liveEntity, sensorHistory, value, widget],
  );

  useEffect(() => {
    if (!measuredSize || !onDisplayMetricsChange) {
      return;
    }
    onDisplayMetricsChange({
      widgetId: widget.id,
      width: measuredSize.width,
      height: measuredSize.height,
      variant: layoutVariant,
    });
  }, [layoutVariant, measuredSize, onDisplayMetricsChange, widget.id]);

  return (
    <SensorCardView
      model={model}
      isSelected={isSelected}
      isEditMode={isEditMode}
      onClick={onClick}
      rootRef={cardRef}
      layoutVariant={layoutVariant}
    />
  );
}
