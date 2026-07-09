import type { MockEntityState } from '../../types/ha';
import {
  ALARM_FEATURE_ARM_AWAY,
  ALARM_FEATURE_ARM_CUSTOM_BYPASS,
  ALARM_FEATURE_ARM_HOME,
  ALARM_FEATURE_ARM_NIGHT,
  ALARM_FEATURE_ARM_VACATION,
  ALARM_FEATURE_TRIGGER,
} from '../../utils/alarmUtils';

export const HOME_ALARM_MOCK_ENTITY_ID = 'alarm_control_panel.home_alarm';

export const HOME_ALARM_MOCK_FEATURES =
  ALARM_FEATURE_ARM_HOME |
  ALARM_FEATURE_ARM_AWAY |
  ALARM_FEATURE_ARM_NIGHT |
  ALARM_FEATURE_TRIGGER |
  ALARM_FEATURE_ARM_CUSTOM_BYPASS |
  ALARM_FEATURE_ARM_VACATION;

export function createHomeAlarmMock(): MockEntityState {
  return {
    state: 'disarmed',
    stateLabel: 'disarmed',
    toggleOn: false,
    supportedFeatures: HOME_ALARM_MOCK_FEATURES,
    rawAttributes: {
      friendly_name: 'Allarme Casa',
      supported_features: HOME_ALARM_MOCK_FEATURES,
      code_arm_required: false,
      code_format: 'number',
      changed_by: 'Dashboard Demo',
    },
  };
}
