import React from 'react';
import { LightCardUI } from './LightCardUI';
import type { DashboardStateShape } from '../../hooks/useDashboardState';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';

const LIGHT_TOGGLE_PENDING_ATTRIBUTE_KEY = '__dashboard_pending_light_toggle';

type LightCardProps = {
  widget: Widget;
  state: DashboardStateShape;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  onBrightnessChange?: (value: number) => void;
  liveLightState?: MockEntityState;
};

export function LightCard({
  widget,
  state,
  isSelected,
  isEditMode,
  onClick,
  onBrightnessChange,
  liveLightState,
}: LightCardProps) {
  const isPrimaryLamp = widget.id === 'light.living_room_lamp';
  const cardState = widget.status.toLowerCase().includes('unavailable')
    ? 'unavailable'
    : widget.isOn
      ? 'on'
      : 'off';
  const widgetHeightUnits = Math.max(1, Math.round(widget.layout.h));
  const isSingleRowOff = widgetHeightUnits === 1 && (cardState === 'off' || cardState === 'unavailable');
  const shellRadiusClass = isSingleRowOff ? 'rounded-2xl' : 'rounded-3xl';
  const showUnavailableBadge = cardState === 'unavailable';
  const hasLiveLightState = Boolean(liveLightState);
  const liveColorMode = liveLightState?.colorMode ?? liveLightState?.color_mode;
  const liveSupportedColorModes = Array.isArray(liveLightState?.rawAttributes?.supported_color_modes)
    ? liveLightState.rawAttributes.supported_color_modes
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.toLowerCase())
    : [];
  const liveSupportsColor =
    liveSupportedColorModes.some((mode) => ['hs', 'xy', 'rgb', 'rgbw', 'rgbww'].includes(mode)) ||
    (typeof liveLightState?.supportedFeatures === 'number' ? (liveLightState.supportedFeatures & 16) !== 0 : false) ||
    ['hs', 'xy', 'rgb', 'rgbw', 'rgbww'].some((mode) => (liveColorMode ?? '').toLowerCase().includes(mode));
  const resolvedColorMode = hasLiveLightState
    ? liveSupportsColor
      ? liveColorMode
      : undefined
    : isPrimaryLamp
      ? 'hs'
      : undefined;
  const resolvedHsColor = hasLiveLightState
    ? liveSupportsColor
      ? liveLightState?.hsColor ?? liveLightState?.hs_color
      : undefined
    : isPrimaryLamp
      ? state.lamp.hsColor
      : undefined;
  const resolvedRgbColor = hasLiveLightState && liveSupportsColor
    ? liveLightState?.rgbColor ?? liveLightState?.rgb_color
    : undefined;
  const rawPendingToggle = liveLightState?.rawAttributes?.[LIGHT_TOGGLE_PENDING_ATTRIBUTE_KEY];
  const pendingToggleTargetOn =
    typeof rawPendingToggle === 'boolean'
      ? rawPendingToggle
      : rawPendingToggle === 'on'
        ? true
        : rawPendingToggle === 'off'
          ? false
          : undefined;
  const isPendingToggle = pendingToggleTargetOn !== undefined;
  const showBrightnessSlider =
    cardState === 'on' &&
    widgetHeightUnits >= 2;

  return (
    <div
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden dashboard-light-card ${
        isSingleRowOff ? 'dashboard-light-card--single-row-off' : ''
      } ${shellRadiusClass}`}
    >
      <div className="flex h-full w-full min-h-0 min-w-0 flex-col">
        <LightCardUI
          name={widget.title}
          state={cardState}
          selected={isSelected}
          brightness={widget.value ?? 0}
          colorMode={resolvedColorMode}
          hsColor={resolvedHsColor}
          rgbColor={resolvedRgbColor}
          pendingToggle={isPendingToggle}
          pendingToggleTargetOn={pendingToggleTargetOn}
          activeTimerEnd={isPrimaryLamp ? state.lamp.activeTimerEnd : undefined}
          showBrightnessSlider={showBrightnessSlider}
          onToggle={!isEditMode ? onClick : undefined}
          onBrightnessChange={!isEditMode ? onBrightnessChange : undefined}
        />
      </div>
      {showUnavailableBadge ? (
        <div
          className="absolute top-4 right-4 text-base leading-none font-semibold text-white/60"
        >
          !
        </div>
      ) : null}
      {isEditMode ? (
        <div
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              onClick();
            }
          }}
          className={`absolute inset-0 widget-card-handle cursor-grab ${shellRadiusClass}`}
          aria-label={`Apri ${widget.title}`}
        />
      ) : null}
    </div>
  );
}
