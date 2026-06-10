import { beforeEach, describe, expect, it } from 'vitest';
import {
  createDashboardBackupPayload,
  parseDashboardBackup,
  restoreDashboardBackup,
  sanitizeDashboardLayoutValue,
} from './configBackup';

const BACKUP_SCHEMA = 'ha-dashboard-builder-backup';

function buildLayout() {
  return JSON.stringify({
    version: 13,
    sections: [],
    widgets: [
      {
        id: 'alarm-1',
        kind: 'alarm',
        alarmUnlockCode: '1234',
        widgets: [{ id: 'nested', lockCode: '7777' }],
      },
      {
        id: 'lock-1',
        kind: 'lock',
        lockCode: '2580',
      },
    ],
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('config backup security filtering', () => {
  it('excludes device auth ids and local alarm PIN from exports', () => {
    window.localStorage.setItem('ha.dashboard.deviceAuth.credentialId.user', 'credential-id');
    window.localStorage.setItem('ha.dashboard.security.biometricCredentialId', 'legacy-credential-id');
    window.localStorage.setItem('ha.dashboard.security.alarmPin', '2580');
    window.localStorage.setItem('ha.dashboard.userName', 'Casa');

    const payload = createDashboardBackupPayload(window.localStorage);

    expect(payload.entries['ha.dashboard.deviceAuth.credentialId.user']).toBeUndefined();
    expect(payload.entries['ha.dashboard.security.biometricCredentialId']).toBeUndefined();
    expect(payload.entries['ha.dashboard.security.alarmPin']).toBeUndefined();
    expect(payload.entries['ha.dashboard.userName']).toBe('Casa');
  });

  it('removes alarm and lock codes from layout exports', () => {
    window.localStorage.setItem('ha.dashboard.builder.layout.v1', buildLayout());

    const payload = createDashboardBackupPayload(window.localStorage);
    const exportedLayout = JSON.parse(payload.entries['ha.dashboard.builder.layout.v1']);

    expect(exportedLayout.widgets[0].alarmUnlockCode).toBeUndefined();
    expect(exportedLayout.widgets[0].widgets[0].lockCode).toBeUndefined();
    expect(exportedLayout.widgets[1].lockCode).toBeUndefined();
  });

  it('sanitizes legacy backup payloads before restore', () => {
    const rawBackup = JSON.stringify({
      schema: BACKUP_SCHEMA,
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: {
        'ha.dashboard.deviceAuth.credentialId.user': 'credential-id',
        'ha.dashboard.security.alarmPin': '2580',
        'ha.dashboard.builder.layout.v1': buildLayout(),
      },
    });

    const payload = parseDashboardBackup(rawBackup);
    const restored = restoreDashboardBackup(payload, window.localStorage);
    const restoredLayout = JSON.parse(window.localStorage.getItem('ha.dashboard.builder.layout.v1') ?? '{}');

    expect(restored).toBe(1);
    expect(window.localStorage.getItem('ha.dashboard.deviceAuth.credentialId.user')).toBeNull();
    expect(window.localStorage.getItem('ha.dashboard.security.alarmPin')).toBeNull();
    expect(restoredLayout.widgets[0].alarmUnlockCode).toBeUndefined();
    expect(restoredLayout.widgets[0].widgets[0].lockCode).toBeUndefined();
    expect(restoredLayout.widgets[1].lockCode).toBeUndefined();
  });

  it('sanitizes layout values recursively', () => {
    const sanitized = JSON.parse(sanitizeDashboardLayoutValue(buildLayout()));

    expect(JSON.stringify(sanitized)).not.toContain('1234');
    expect(JSON.stringify(sanitized)).not.toContain('2580');
    expect(JSON.stringify(sanitized)).not.toContain('7777');
  });
});
