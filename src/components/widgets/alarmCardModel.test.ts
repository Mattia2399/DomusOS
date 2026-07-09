import { describe, expect, it } from 'vitest';
import type { Widget } from '../../types/dashboardModels';
import { HOME_ALARM_MOCK_FEATURES, createHomeAlarmMock } from './alarmMock';
import { buildAlarmCardModel, resolveAlarmModeOptions } from './alarmCardModel';

const widget: Widget = {
  id: 'alarm.test',
  kind: 'alarm',
  title: 'Allarme test',
  entityId: 'alarm_control_panel.home_alarm',
  status: 'disarmed',
  isOn: false,
  layout: { i: 'alarm.test', x: 0, y: 0, w: 3, h: 3 },
};

describe('alarm card model', () => {
  it('resolves every supported mock mode and a safe fallback set', () => {
    expect(resolveAlarmModeOptions(HOME_ALARM_MOCK_FEATURES).map((mode) => mode.id)).toEqual([
      'home',
      'away',
      'night',
      'vacation',
      'custom_bypass',
    ]);
    expect(resolveAlarmModeOptions(undefined).map((mode) => mode.id)).toEqual(['home', 'away', 'night']);
  });

  it('maps disarmed, armed, transitioning and triggered states to safe actions', () => {
    const mock = createHomeAlarmMock();
    expect(buildAlarmCardModel(widget, mock).primaryAction).toBe('select-mode');
    expect(buildAlarmCardModel(widget, { ...mock, state: 'armed_home' })).toMatchObject({
      tone: 'home',
      primaryAction: 'disarm',
      activeMode: 'home',
    });
    expect(buildAlarmCardModel(widget, { ...mock, state: 'arming' })).toMatchObject({
      isTransitioning: true,
      primaryAction: 'none',
    });
    expect(buildAlarmCardModel(widget, { ...mock, state: 'triggered' })).toMatchObject({
      isTriggered: true,
      tone: 'danger',
      primaryAction: 'disarm',
    });
    expect(buildAlarmCardModel(widget, { ...mock, state: 'unavailable' }).primaryAction).toBe('none');
    expect(buildAlarmCardModel(widget, { ...mock, supportedFeatures: 0, rawAttributes: { supported_features: 0 } }).primaryAction).toBe('none');
  });

  it('separates Home Assistant arm code from local disarm protection', () => {
    const mock = createHomeAlarmMock();
    const localModel = buildAlarmCardModel(
      { ...widget, alarmUnlockCode: '1234', alarmRequireAuthToDisarm: true },
      mock,
    );
    expect(localModel.armActionLocked).toBe(false);
    expect(localModel.disarmActionLocked).toBe(true);

    const haCodeModel = buildAlarmCardModel(widget, {
      ...mock,
      rawAttributes: {
        ...mock.rawAttributes,
        code_arm_required: true,
      },
    });
    expect(haCodeModel.armActionLocked).toBe(true);
    expect(haCodeModel.disarmActionLocked).toBe(false);
  });
});
