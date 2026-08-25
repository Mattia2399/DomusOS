import React, { useEffect, useMemo } from 'react';
import type { DashboardStateShape } from '../../hooks/useDashboardState';
import { useObservedElementSize } from '../../hooks/useObservedElementSize';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { LightCardView } from './LightCardView';
import { buildLightCardModel } from './lightCardModel';
import {
  resolveLightPixelDisplayVariant,
  type WidgetDisplayMetrics,
} from './widgetDisplayVariant';

type LightCardProps = {
  widget: Widget;
  state: DashboardStateShape;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  onBrightnessChange?: (value: number) => void;
  onColorChange?: (hs: [number, number]) => void;
  liveLightState?: MockEntityState;
  onDisplayMetricsChange?: (metrics: WidgetDisplayMetrics) => void;
};

export function LightCard({
  widget,
  state,
  isSelected,
  isEditMode,
  onClick,
  onBrightnessChange,
  onColorChange,
  liveLightState,
  onDisplayMetricsChange,
}: LightCardProps) {
  const isPrimaryLamp = widget.id === 'light.living_room_lamp';
  const { ref: cardRef, size: observedSize } = useObservedElementSize<HTMLDivElement>(widget.id);
  const measuredSize = observedSize?.identity === widget.id ? observedSize : null;
  const measuredVariant = measuredSize
    ? resolveLightPixelDisplayVariant({ width: measuredSize.width, height: measuredSize.height })
    : null;
  const model = useMemo(
    () => buildLightCardModel({
      widget,
      liveEntity: liveLightState,
      fallbackBrightness: isPrimaryLamp ? state.lamp.brightness : widget.value,
      fallbackHsColor: isPrimaryLamp ? state.lamp.hsColor : undefined,
      fallbackColorTempKelvin: isPrimaryLamp ? state.lamp.colorTemp : undefined,
      activeTimerEnd: isPrimaryLamp ? state.lamp.activeTimerEnd : undefined,
    }),
    [isPrimaryLamp, liveLightState, state.lamp.activeTimerEnd, state.lamp.brightness, state.lamp.colorTemp, state.lamp.hsColor, widget],
  );

  useEffect(() => {
    if (!measuredSize || !measuredVariant || !onDisplayMetricsChange) return;
    onDisplayMetricsChange({
      widgetId: widget.id,
      width: measuredSize.width,
      height: measuredSize.height,
      variant: measuredVariant,
    });
  }, [measuredSize, measuredVariant, onDisplayMetricsChange, widget.id]);

  return (
    <LightCardView
      model={model}
      isSelected={isSelected}
      isEditMode={isEditMode}
      onToggle={onClick}
      onBrightnessChange={!isEditMode ? onBrightnessChange : undefined}
      onColorChange={!isEditMode ? onColorChange : undefined}
      rootRef={cardRef}
    />
  );
}
