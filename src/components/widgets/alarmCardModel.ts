import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import {
  ALARM_FEATURE_ARM_AWAY,
  ALARM_FEATURE_ARM_CUSTOM_BYPASS,
  ALARM_FEATURE_ARM_HOME,
  ALARM_FEATURE_ARM_NIGHT,
  ALARM_FEATURE_ARM_VACATION,
  alarmSupportsFeature,
  getAlarmStateLabel,
  normalizeAlarmState,
  resolveAlarmSupportedFeatures,
  toTrimmedString,
} from '../../utils/alarmUtils';
import { getWidgetSecrets } from '../../services/widgetSecrets';

export type AlarmArmMode = 'home' | 'away' | 'night' | 'vacation' | 'custom_bypass';
export type AlarmCardTone = 'neutral' | 'home' | 'away' | 'night' | 'vacation' | 'bypass' | 'danger' | 'unavailable';
export type AlarmPrimaryAction = 'select-mode' | 'disarm' | 'none';

export type AlarmModeOption = {
  id: AlarmArmMode;
  label: string;
  state: string;
  feature: number;
};

export type AlarmCardModel = {
  title: string;
  state: string;
  stateLabel: string;
  tone: AlarmCardTone;
  isTriggered: boolean;
  isTransitioning: boolean;
  isUnavailable: boolean;
  supportedFeatures?: number;
  supportedModes: AlarmModeOption[];
  activeMode?: AlarmArmMode;
  primaryAction: AlarmPrimaryAction;
  armActionLocked: boolean;
  disarmActionLocked: boolean;
  changedBy?: string;
};

export const ALARM_MODE_OPTIONS: AlarmModeOption[] = [
  { id: 'home', label: 'Casa', state: 'armed_home', feature: ALARM_FEATURE_ARM_HOME },
  { id: 'away', label: 'Fuori', state: 'armed_away', feature: ALARM_FEATURE_ARM_AWAY },
  { id: 'night', label: 'Notte', state: 'armed_night', feature: ALARM_FEATURE_ARM_NIGHT },
  { id: 'vacation', label: 'Vacanza', state: 'armed_vacation', feature: ALARM_FEATURE_ARM_VACATION },
  { id: 'custom_bypass', label: 'Bypass', state: 'armed_custom_bypass', feature: ALARM_FEATURE_ARM_CUSTOM_BYPASS },
];

const TRANSITIONING_ALARM_STATES = new Set(['pending', 'arming', 'disarming']);

function resolveAlarmTone(state: string): AlarmCardTone {
  if (state === 'triggered') return 'danger';
  if (state === 'armed_home') return 'home';
  if (state === 'armed_away') return 'away';
  if (state === 'armed_night') return 'night';
  if (state === 'armed_vacation') return 'vacation';
  if (state === 'armed_custom_bypass') return 'bypass';
  if (state === 'unavailable' || state === 'unknown') return 'unavailable';
  return 'neutral';
}

export function resolveAlarmModeOptions(supportedFeatures: number | undefined) {
  if (typeof supportedFeatures === 'number' && Number.isFinite(supportedFeatures)) {
    return ALARM_MODE_OPTIONS.filter((mode) => alarmSupportsFeature(supportedFeatures, mode.feature));
  }
  return ALARM_MODE_OPTIONS.filter((mode) => mode.id === 'home' || mode.id === 'away' || mode.id === 'night');
}

export function buildAlarmCardModel(widget: Widget, liveEntity?: MockEntityState): AlarmCardModel {
  const rawAttributes = liveEntity?.rawAttributes;
  const state = normalizeAlarmState(
    toTrimmedString(liveEntity?.state) ??
      toTrimmedString(liveEntity?.stateLabel) ??
      widget.status,
  );
  const supportedFeatures = resolveAlarmSupportedFeatures(liveEntity);
  const supportedModes = resolveAlarmModeOptions(supportedFeatures);
  const activeMode = supportedModes.find((mode) => mode.state === state)?.id;
  const pendingService = toTrimmedString(rawAttributes?.__dashboard_pending_alarm_action);
  const isTransitioning = Boolean(pendingService) || TRANSITIONING_ALARM_STATES.has(state);
  const isTriggered = state === 'triggered';
  const isUnavailable = state === 'unknown' || state === 'unavailable';
  const isDisarmed = state === 'disarmed';
  const codeArmRequired = rawAttributes?.code_arm_required === true;
  const widgetSecrets = getWidgetSecrets(widget.id);
  const localUnlockEnabled =
    (widgetSecrets.alarmUnlockCode ?? '').trim().length > 0 ||
    (widgetSecrets.alarmLocalExtraCode ?? '').trim().length > 0;

  return {
    title: widget.title,
    state,
    stateLabel: isTriggered ? 'Allarme' : getAlarmStateLabel(state),
    tone: resolveAlarmTone(state),
    isTriggered,
    isTransitioning,
    isUnavailable,
    supportedFeatures,
    supportedModes,
    activeMode,
    primaryAction: isTransitioning || isUnavailable
      ? 'none'
      : isDisarmed
        ? supportedModes.length > 0
          ? 'select-mode'
          : 'none'
        : 'disarm',
    armActionLocked: codeArmRequired,
    disarmActionLocked: localUnlockEnabled || (widget.alarmRequireAuthToDisarm ?? false),
    changedBy: toTrimmedString(rawAttributes?.changed_by),
  };
}
