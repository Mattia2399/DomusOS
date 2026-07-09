import React, { useEffect, useMemo } from 'react';
import { useObservedElementSize } from '../../hooks/useObservedElementSize';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import type { GridEngineBreakpoint } from '../dashboard/dashboardBreakpointConfig';
import { SwitchCardView } from './SwitchCardView';
import { buildSwitchCardModel } from './switchCardModel';
import {
  resolveSwitchPixelDisplayVariant,
  resolveWidgetDisplayVariant,
  type WidgetDisplayMetrics,
  type WidgetDisplayVariant,
} from './widgetDisplayVariant';

type SwitchCardProps = {
  widget: Widget;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  onToggleSwitch?: () => void;
  liveEntity?: MockEntityState;
  consumptionEntity?: MockEntityState;
  gridBreakpoint?: GridEngineBreakpoint;
  displayVariant?: WidgetDisplayVariant;
  onDisplayMetricsChange?: (metrics: WidgetDisplayMetrics) => void;
};

export function SwitchCard({
  widget,
  isSelected,
  isEditMode,
  onClick,
  onToggleSwitch,
  liveEntity,
  consumptionEntity,
  gridBreakpoint,
  displayVariant,
  onDisplayMetricsChange,
}: SwitchCardProps) {
  const fallbackVariant = displayVariant ?? resolveWidgetDisplayVariant({
    kind: 'switch',
    breakpoint: gridBreakpoint,
    layout: widget.layout,
    parentSectionId: widget.parentSectionId,
  });
  const { ref: cardRef, size: observedSize } = useObservedElementSize<HTMLDivElement>(widget.id);
  const measuredSize = observedSize?.identity === widget.id ? observedSize : null;
  const layoutVariant = measuredSize
    ? resolveSwitchPixelDisplayVariant({ width: measuredSize.width, height: measuredSize.height })
    : fallbackVariant;
  const model = useMemo(
    () => buildSwitchCardModel({ widget, liveEntity, consumptionEntity }),
    [consumptionEntity, liveEntity, widget],
  );

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
    <SwitchCardView
      model={model}
      isSelected={isSelected}
      isEditMode={isEditMode}
      onToggle={onToggleSwitch ?? onClick}
      onOpen={onClick}
      rootRef={cardRef}
      layoutVariant={layoutVariant}
    />
  );
}
