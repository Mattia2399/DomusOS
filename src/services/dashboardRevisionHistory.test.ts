import { describe, expect, it } from 'vitest';
import {
  archiveDashboardRevision,
  createDashboardRevisionRecord,
  parseDashboardRevisionHistory,
  summarizeDashboardRevision,
} from './dashboardRevisionHistory';
import {
  createSharedHouseConfiguration,
  type DashboardLayoutConfiguration,
} from './dashboardConfigurationRepository';

function dashboard(title: string, x = 0): DashboardLayoutConfiguration {
  return {
    storageVersion: 14,
    sections: [{ id: 'main', kind: 'stack-grid', title: 'Preferiti', layout: { i: 'main', x: 0, y: 0, w: 4, h: 4 } }],
    widgets: [{
      id: 'light',
      kind: 'light',
      title,
      entityId: 'light.test',
      status: 'Accesa',
      isOn: true,
      layout: { i: 'light', x, y: 0, w: 2, h: 1 },
      lockCode: '1234',
    } as never],
    widgetTypeLayoutOverrides: {},
    widgetLayoutOverrides: {},
    responsiveLayouts: {
      root: { xl: [{ i: 'light', x, y: 0, w: 2, h: 1 }] },
    },
  };
}

function document(revision: number, title = `Versione ${revision}`) {
  return createSharedHouseConfiguration({
    revision,
    updatedAt: `2026-08-05T10:0${revision}:00.000Z`,
    updatedByUserId: 'owner',
    dashboard: dashboard(title, revision % 2),
    security: { alarmEntityId: null, visibleSensorEntityIds: null, visibleCameraEntityIds: null },
    rooms: { customRooms: [], hiddenEntitiesByRoom: {} },
  });
}

describe('dashboard revision history', () => {
  it('stores sanitized snapshots without runtime state or widget secrets', () => {
    const record = createDashboardRevisionRecord(document(1));
    const widget = record.dashboard.widgets[0] as unknown as Record<string, unknown>;
    expect(widget.status).toBeUndefined();
    expect(widget.isOn).toBeUndefined();
    expect(widget.lockCode).toBeUndefined();
  });

  it('keeps only four archived snapshots so current plus history equals five versions', () => {
    let history = null;
    for (let revision = 1; revision <= 7; revision += 1) {
      history = archiveDashboardRevision(history, document(revision));
    }
    expect(history.entries.map((entry) => entry.revision)).toEqual([7, 6, 5, 4]);
    expect(parseDashboardRevisionHistory(history)?.entries).toHaveLength(4);
  });

  it('summarizes configuration and responsive position changes', () => {
    const older = dashboard('Lampada', 0);
    const newer = dashboard('Lampada cucina', 2);
    const summary = summarizeDashboardRevision(older, newer);
    expect(summary.changedWidgets).toBe(1);
    expect(summary.movedWidgets).toBe(1);
    expect(summary.changedBreakpoints).toEqual(['xl']);
  });

  it('rejects oversized or partially malformed server history documents', () => {
    const valid = archiveDashboardRevision(null, document(1));
    expect(parseDashboardRevisionHistory({
      ...valid,
      entries: [...valid.entries, { bad: true }],
    })).toBeNull();
    expect(parseDashboardRevisionHistory({
      ...valid,
      entries: Array.from({ length: 5 }, (_, index) => createDashboardRevisionRecord(document(index + 1))),
    })).toBeNull();
  });
});
