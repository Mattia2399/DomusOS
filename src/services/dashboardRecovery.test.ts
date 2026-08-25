import { beforeEach, describe, expect, it } from 'vitest';
import type { Widget } from '../types/dashboardModels';
import {
  createDashboardRecoverySnapshot,
  discardDashboardRecoverySnapshot,
  readPendingDashboardRecoverySnapshot,
  restoreDashboardRecoverySnapshot,
} from './dashboardRecovery';
import { loadDashboardLayout, saveDashboardLayout } from './dashboardStorage';
import {
  DEMO_DASHBOARD_RECOVERY_STORAGE_KEY,
  REAL_DASHBOARD_RECOVERY_STORAGE_KEY,
} from './dashboardRuntime';

function widget(id: string): Widget {
  return {
    id,
    kind: 'sensor',
    title: id,
    entityId: `sensor.${id}`,
    dataSource: 'mock',
    status: 'ok',
    isOn: true,
    layout: { i: id, x: 0, y: 0, w: 1, h: 1 },
  };
}

beforeEach(() => window.localStorage.clear());

describe('dashboard layout recovery snapshots', () => {
  it('restores the stable layout captured before an interrupted edit session', () => {
    saveDashboardLayout([], [widget('stable')], {}, {}, {}, 'real');
    expect(createDashboardRecoverySnapshot('real', window.localStorage).ok).toBe(true);

    saveDashboardLayout([], [widget('edited')], {}, {}, {}, 'real');
    expect(readPendingDashboardRecoverySnapshot('real', window.localStorage)).toMatchObject({
      runtimeMode: 'real',
    });

    expect(restoreDashboardRecoverySnapshot('real', window.localStorage).ok).toBe(true);
    expect(loadDashboardLayout('real').widgets.map(({ id }) => id)).toEqual(['stable']);
    expect(window.localStorage.getItem(REAL_DASHBOARD_RECOVERY_STORAGE_KEY)).toBeNull();
  });

  it('removes a stale snapshot when no layout changes were made', () => {
    saveDashboardLayout([], [widget('unchanged')], {}, {}, {}, 'demo');
    expect(createDashboardRecoverySnapshot('demo', window.localStorage).ok).toBe(true);

    expect(readPendingDashboardRecoverySnapshot('demo', window.localStorage)).toBeNull();
    expect(window.localStorage.getItem(DEMO_DASHBOARD_RECOVERY_STORAGE_KEY)).toBeNull();
  });

  it('keeps Demo and real recovery copies isolated and discardable', () => {
    saveDashboardLayout([], [widget('real')], {}, {}, {}, 'real');
    saveDashboardLayout([], [widget('demo')], {}, {}, {}, 'demo');
    createDashboardRecoverySnapshot('real', window.localStorage);
    createDashboardRecoverySnapshot('demo', window.localStorage);

    expect(discardDashboardRecoverySnapshot('demo', window.localStorage).ok).toBe(true);
    expect(window.localStorage.getItem(DEMO_DASHBOARD_RECOVERY_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(REAL_DASHBOARD_RECOVERY_STORAGE_KEY)).not.toBeNull();
  });
});
