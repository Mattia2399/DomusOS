import { beforeEach, describe, expect, it } from 'vitest';
import { DASHBOARD_LAYOUT_STORAGE_KEY } from './configBackup';
import { loadDashboardLayout, saveDashboardLayout } from './dashboardStorage';
import { WIDGET_SECRETS_STORAGE_KEY } from './widgetSecrets';
import type { Widget } from '../types/dashboardModels';

function buildWidget(overrides: Partial<Widget>): Widget {
  return {
    id: 'alarm-1',
    kind: 'alarm',
    title: 'Allarme',
    entityId: 'alarm_control_panel.home_alarm',
    status: 'Disinserito',
    isOn: false,
    layout: { i: overrides.id ?? 'alarm-1', x: 0, y: 0, w: 2, h: 2 },
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('dashboard storage widget secrets', () => {
  it('stores widget codes outside the persisted layout and hydrates them on load', () => {
    const widgets = [
      buildWidget({
        id: 'alarm-1',
        alarmUnlockCode: '1234',
        alarmLocalExtraCode: '99',
      }),
      buildWidget({
        id: 'lock-1',
        kind: 'lock',
        title: 'Porta',
        entityId: 'lock.front_door',
        lockCode: '2580',
      }),
    ];

    saveDashboardLayout([], widgets);

    const storedLayout = JSON.parse(window.localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY) ?? '{}');
    const storedSecrets = JSON.parse(window.localStorage.getItem(WIDGET_SECRETS_STORAGE_KEY) ?? '{}');

    expect(storedLayout.widgets[0].alarmUnlockCode).toBeUndefined();
    expect(storedLayout.widgets[0].alarmLocalExtraCode).toBeUndefined();
    expect(storedLayout.widgets[1].lockCode).toBeUndefined();
    expect(storedSecrets.widgets['alarm-1'].alarmUnlockCode).toBe('1234');
    expect(storedSecrets.widgets['alarm-1'].alarmLocalExtraCode).toBe('99');
    expect(storedSecrets.widgets['lock-1'].lockCode).toBe('2580');

    const restored = loadDashboardLayout();
    expect(restored.widgets.find((widget) => widget.id === 'alarm-1')?.alarmUnlockCode).toBe('1234');
    expect(restored.widgets.find((widget) => widget.id === 'alarm-1')?.alarmLocalExtraCode).toBe('99');
    expect(restored.widgets.find((widget) => widget.id === 'lock-1')?.lockCode).toBe('2580');
  });

  it('migrates legacy widget codes from an old local layout into widget secrets storage', () => {
    window.localStorage.setItem(
      DASHBOARD_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        version: 14,
        sections: [],
        widgets: [
          buildWidget({
            id: 'alarm-legacy',
            alarmUnlockCode: '4321',
            alarmLocalExtraCode: '77',
          }),
        ],
      }),
    );

    const restored = loadDashboardLayout();
    const storedSecrets = JSON.parse(window.localStorage.getItem(WIDGET_SECRETS_STORAGE_KEY) ?? '{}');

    expect(restored.widgets.find((widget) => widget.id === 'alarm-legacy')?.alarmUnlockCode).toBe('4321');
    expect(restored.widgets.find((widget) => widget.id === 'alarm-legacy')?.alarmLocalExtraCode).toBe('77');
    expect(storedSecrets.widgets['alarm-legacy'].alarmUnlockCode).toBe('4321');
    expect(storedSecrets.widgets['alarm-legacy'].alarmLocalExtraCode).toBe('77');
  });
});
