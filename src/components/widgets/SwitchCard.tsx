import {
  Droplets,
  Fan,
  Flame,
  Lightbulb,
  Monitor,
  Plug,
  Power,
  Router,
  Sprout,
  ToggleRight,
  Tv,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { LightCardUI } from './LightCardUI';
import type { MockEntityState } from '../../types/ha';
import type { Widget } from '../../types/dashboardModels';

const SWITCH_TOGGLE_PENDING_ATTRIBUTE_KEY = '__dashboard_pending_switch_toggle';
const SWITCH_ON_RGB: [number, number, number] = [52, 199, 89];

type SwitchCardProps = {
  widget: Widget;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  onToggleSwitch?: () => void;
  liveEntity?: MockEntityState;
};

type SwitchState = 'on' | 'off' | 'unavailable' | 'unknown';

function normalizeSwitchState(value: string | undefined): SwitchState {
  const normalized = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalized) {
    return 'unknown';
  }
  if (normalized === 'on' || normalized === 'active' || normalized === 'enabled' || normalized === 'true') {
    return 'on';
  }
  if (normalized === 'off' || normalized === 'inactive' || normalized === 'disabled' || normalized === 'false') {
    return 'off';
  }
  if (normalized === 'unavailable') {
    return 'unavailable';
  }
  return 'unknown';
}

function resolveSwitchLabel(state: SwitchState) {
  if (state === 'on') {
    return 'Acceso';
  }
  if (state === 'off') {
    return 'Spento';
  }
  if (state === 'unavailable') {
    return 'Non disponibile';
  }
  return 'Stato sconosciuto';
}

function resolvePendingTarget(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'on') {
    return true;
  }
  if (value === 'off') {
    return false;
  }
  return undefined;
}

function normalizeToken(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/[\s-]+/g, '_') : '';
}

function resolveSwitchIcon(widget: Widget, liveEntity?: MockEntityState): LucideIcon {
  const deviceClass = normalizeToken(liveEntity?.rawAttributes?.device_class);
  const entityId = widget.entityId.toLowerCase();
  const friendlyName = normalizeToken(liveEntity?.rawAttributes?.friendly_name);
  const domain = entityId.split('.')[0] ?? '';
  const searchText = `${deviceClass} ${entityId} ${friendlyName}`;

  if (domain === 'fan' || deviceClass === 'fan' || searchText.includes('ventola')) {
    return Fan;
  }
  if (domain === 'input_boolean') {
    return ToggleRight;
  }

  if (deviceClass === 'outlet' || deviceClass === 'plug') {
    return Plug;
  }
  if (deviceClass === 'switch') {
    return ToggleRight;
  }
  if (deviceClass === 'light') {
    return Lightbulb;
  }
  if (deviceClass === 'irrigation' || deviceClass === 'sprinkler') {
    return Sprout;
  }
  if (deviceClass === 'pump' || deviceClass === 'water' || deviceClass === 'valve') {
    return Droplets;
  }
  if (deviceClass === 'heater' || deviceClass === 'heat') {
    return Flame;
  }
  if (deviceClass === 'tv' || deviceClass === 'television') {
    return Tv;
  }
  if (deviceClass === 'monitor' || deviceClass === 'display') {
    return Monitor;
  }
  if (deviceClass === 'router' || deviceClass === 'network') {
    return Router;
  }

  if (searchText.includes('presa') || searchText.includes('socket') || searchText.includes('outlet')) {
    return Plug;
  }
  if (searchText.includes('lamp') || searchText.includes('luce') || searchText.includes('light')) {
    return Lightbulb;
  }
  if (searchText.includes('irrig') || searchText.includes('garden') || searchText.includes('giardino')) {
    return Sprout;
  }
  if (searchText.includes('pump') || searchText.includes('pompa') || searchText.includes('water')) {
    return Droplets;
  }
  if (searchText.includes('heater') || searchText.includes('stufa') || searchText.includes('boiler')) {
    return Flame;
  }
  if (searchText.includes('tv') || searchText.includes('television')) {
    return Tv;
  }
  if (searchText.includes('router') || searchText.includes('wifi')) {
    return Router;
  }
  if (searchText.includes('waves') || searchText.includes('pool') || searchText.includes('piscina')) {
    return Waves;
  }

  return Power;
}

export function SwitchCard({
  widget,
  isSelected,
  isEditMode,
  onClick,
  onToggleSwitch,
  liveEntity,
}: SwitchCardProps) {
  const stateFromEntity =
    typeof liveEntity?.toggleOn === 'boolean'
      ? liveEntity.toggleOn
        ? 'on'
        : 'off'
      : liveEntity?.stateLabel ?? liveEntity?.state ?? widget.status;
  const resolvedState = normalizeSwitchState(stateFromEntity);
  const pendingTargetOn = resolvePendingTarget(liveEntity?.rawAttributes?.[SWITCH_TOGGLE_PENDING_ATTRIBUTE_KEY]);
  const isPending = pendingTargetOn !== undefined;
  const isUnavailable = resolvedState === 'unavailable' || resolvedState === 'unknown';
  const switchIsOn = isPending ? pendingTargetOn : resolvedState === 'on';
  const cardState = isUnavailable ? 'unavailable' : switchIsOn ? 'on' : 'off';
  const visualState = isUnavailable ? 'unavailable' : switchIsOn ? 'on' : 'off';
  const statusText = isPending
    ? pendingTargetOn
      ? 'Accensione in corso...'
      : 'Spegnimento in corso...'
    : resolveSwitchLabel(resolvedState);
  const showPendingRing = isPending && statusText.includes('in corso');
  const widgetHeightUnits = Math.max(1, Math.round(widget.layout.h));
  const isSingleRowOff = widgetHeightUnits === 1;
  const shellRadiusClass = isSingleRowOff ? 'rounded-2xl' : 'rounded-3xl';
  const SwitchIcon = resolveSwitchIcon(widget, liveEntity);

  const handleToggle = () => {
    if (isEditMode || isUnavailable || isPending) {
      return;
    }
    if (onToggleSwitch) {
      onToggleSwitch();
      return;
    }
    onClick();
  };

  return (
    <div
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden dashboard-light-card ${
        isSingleRowOff ? 'dashboard-light-card--single-row-off' : ''
      } ${shellRadiusClass}`}
    >
      <div className="flex h-full w-full min-h-0 min-w-0 flex-col">
        <LightCardUI
          name={widget.title || 'Switch'}
          state={cardState}
          visualState={visualState}
          selected={isSelected}
          pressed={switchIsOn}
          colorMode={switchIsOn ? 'rgb' : undefined}
          rgbColor={switchIsOn ? SWITCH_ON_RGB : undefined}
          icon={<SwitchIcon className="light-card-ui__icon" />}
          statusText={statusText}
          pendingToggle={showPendingRing}
          pendingToggleTargetOn={pendingTargetOn}
          showBrightnessSlider={false}
          onToggle={!isEditMode && !isUnavailable && !isPending ? handleToggle : undefined}
        />
      </div>
      {isUnavailable ? (
        <div className="absolute top-4 right-4 text-base leading-none font-semibold text-white/60">!</div>
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
