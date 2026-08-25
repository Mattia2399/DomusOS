import React, { useEffect, useMemo } from 'react';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { useObservedElementSize } from '../../hooks/useObservedElementSize';
import { SensorCardView } from './SensorCardView';
import { buildSensorCardModel } from './sensorCardModel';
import {
  resolveSensorPixelDisplayVariant,
  type WidgetDisplayMetrics,
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
  onDisplayMetricsChange,
}: SensorCardProps) {
  const { ref: cardRef, size: observedSize } = useObservedElementSize<HTMLDivElement>(widget.id);
  const measuredSize = observedSize?.identity === widget.id ? observedSize : null;
  const measuredVariant = measuredSize
    ? resolveSensorPixelDisplayVariant({ width: measuredSize.width, height: measuredSize.height })
    : null;
  const model = useMemo(
    () => buildSensorCardModel({ widget, value, sensorHistory, liveEntity, batteryEntity }),
    [batteryEntity, liveEntity, sensorHistory, value, widget],
  );

  useEffect(() => {
    if (!measuredSize || !measuredVariant || !onDisplayMetricsChange) {
      return;
    }
    onDisplayMetricsChange({
      widgetId: widget.id,
      width: measuredSize.width,
      height: measuredSize.height,
      variant: measuredVariant,
    });
  }, [measuredSize, measuredVariant, onDisplayMetricsChange, widget.id]);

  return (
    <SensorCardView
      model={model}
      isSelected={isSelected}
      isEditMode={isEditMode}
      onClick={onClick}
      rootRef={cardRef}
    />
  );
}
