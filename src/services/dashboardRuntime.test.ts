import { beforeEach, describe, expect, it } from 'vitest';
import type { Widget } from '../types/dashboardModels';
import { loadDashboardLayout, saveDashboardLayout } from './dashboardStorage';
import {
  DEMO_DASHBOARD_LAYOUT_STORAGE_KEY,
  REAL_DASHBOARD_LAYOUT_STORAGE_KEY,
  resolveInitialDashboardRuntimeMode,
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

describe('Demo and Real runtime isolation', () => {
  it('stores and loads the two layouts independently', () => {
    saveDashboardLayout([], [widget('real')], {}, {}, {}, 'real');
    saveDashboardLayout([], [widget('demo')], {}, {}, {}, 'demo');
    expect(window.localStorage.getItem(REAL_DASHBOARD_LAYOUT_STORAGE_KEY)).toContain('sensor.real');
    expect(window.localStorage.getItem(DEMO_DASHBOARD_LAYOUT_STORAGE_KEY)).toContain('sensor.demo');
    expect(loadDashboardLayout('real').widgets.map(({ id }) => id)).toEqual(['real']);
    expect(loadDashboardLayout('demo').widgets.map(({ id }) => id)).toEqual(['demo']);
  });

  it('recognizes an existing real installation but never infers Demo from an outage', () => {
    window.localStorage.setItem(REAL_DASHBOARD_LAYOUT_STORAGE_KEY, '{}');
    expect(resolveInitialDashboardRuntimeMode({
      storage: window.localStorage, isManagedByParent: false, hasManualToken: false,
    })).toBe('real');
    window.localStorage.clear();
    expect(resolveInitialDashboardRuntimeMode({
      storage: window.localStorage, isManagedByParent: false, hasManualToken: false,
    })).toBeNull();
  });
});
