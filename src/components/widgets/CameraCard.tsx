import { useEffect, useMemo } from 'react';
import { useObservedElementSize } from '../../hooks/useObservedElementSize';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import type { GridEngineBreakpoint } from '../dashboard/dashboardBreakpointConfig';
import { CameraCardView } from './CameraCardView';
import { buildCameraCardModel } from './cameraCardModel';
import {
  resolveCameraPixelDisplayVariant,
  resolveWidgetDisplayVariant,
  type WidgetDisplayMetrics,
  type WidgetDisplayVariant,
} from './widgetDisplayVariant';

type CameraCardProps = {
  widget: Widget;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  liveEntity?: MockEntityState;
  gridBreakpoint?: GridEngineBreakpoint;
  displayVariant?: WidgetDisplayVariant;
  onDisplayMetricsChange?: (metrics: WidgetDisplayMetrics) => void;
};

export function CameraCard({
  widget,
  isSelected,
  isEditMode,
  onClick,
  liveEntity,
  gridBreakpoint,
  displayVariant,
  onDisplayMetricsChange,
}: CameraCardProps) {
  const fallbackVariant = displayVariant ?? resolveWidgetDisplayVariant({
    kind: 'camera',
    breakpoint: gridBreakpoint,
    layout: widget.layout,
    parentSectionId: widget.parentSectionId,
  });
  const { ref: cardRef, size: observedSize } = useObservedElementSize<HTMLDivElement>(widget.id);
  const measuredSize = observedSize?.identity === widget.id ? observedSize : null;
  const layoutVariant = measuredSize
    ? resolveCameraPixelDisplayVariant({ width: measuredSize.width, height: measuredSize.height })
    : fallbackVariant;
  const model = useMemo(() => buildCameraCardModel(widget, liveEntity), [liveEntity, widget]);

  useEffect(() => {
    if (!measuredSize || !onDisplayMetricsChange) return;
    onDisplayMetricsChange({
      widgetId: widget.id,
      width: measuredSize.width,
      height: measuredSize.height,
      variant: layoutVariant,
    });
  }, [layoutVariant, measuredSize, onDisplayMetricsChange, widget.id]);

  return (
    <CameraCardView
      model={model}
      layoutVariant={layoutVariant}
      isSelected={isSelected}
      isEditMode={isEditMode}
      rootRef={cardRef}
      onOpen={onClick}
    />
  );
}
