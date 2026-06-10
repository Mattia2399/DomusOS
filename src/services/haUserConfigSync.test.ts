import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyDashboardUserDataPayload,
  buildDashboardUserDataPayload,
  parseDashboardUserDataPayload,
} from './haUserConfigSync';

function buildLayout() {
  return JSON.stringify({
    version: 13,
    sections: [],
    widgets: [
      { id: 'alarm', kind: 'alarm', alarmUnlockCode: '1234' },
      { id: 'lock', kind: 'lock', lockCode: '2580' },
    ],
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('HA user config sync security filtering', () => {
  it('excludes device auth ids and local alarm PIN from exported user data', () => {
    window.localStorage.setItem('ha.dashboard.deviceAuth.credentialId.user', 'credential-id');
    window.localStorage.setItem('ha.dashboard.security.biometricCredentialId', 'legacy-credential-id');
    window.localStorage.setItem('ha.dashboard.security.alarmPin', '2580');
    window.localStorage.setItem('ha.dashboard.userName', 'Casa');

    const payload = buildDashboardUserDataPayload(window.localStorage);

    expect(payload.entries['ha.dashboard.deviceAuth.credentialId.user']).toBeUndefined();
    expect(payload.entries['ha.dashboard.security.biometricCredentialId']).toBeUndefined();
    expect(payload.entries['ha.dashboard.security.alarmPin']).toBeUndefined();
    expect(payload.entries['ha.dashboard.userName']).toBe('Casa');
  });

  it('removes widget codes from synced layout values', () => {
    window.localStorage.setItem('ha.dashboard.builder.layout.v1', buildLayout());

    const payload = buildDashboardUserDataPayload(window.localStorage);
    const layout = JSON.parse(payload.entries['ha.dashboard.builder.layout.v1']);

    expect(layout.widgets[0].alarmUnlockCode).toBeUndefined();
    expect(layout.widgets[1].lockCode).toBeUndefined();
  });

  it('rejects sensitive keys and sanitizes layout on import', () => {
    const payload = parseDashboardUserDataPayload({
      schema: 'ha-dashboard-builder-user-data',
      version: 1,
      updatedAt: new Date().toISOString(),
      entries: {
        'ha.dashboard.security.alarmPin': '2580',
        'ha.dashboard.deviceAuth.credentialId.user': 'credential-id',
        'ha.dashboard.builder.layout.v1': buildLayout(),
      },
    });

    expect(payload).not.toBeNull();
    applyDashboardUserDataPayload(payload!, window.localStorage);

    const layout = JSON.parse(window.localStorage.getItem('ha.dashboard.builder.layout.v1') ?? '{}');
    expect(window.localStorage.getItem('ha.dashboard.security.alarmPin')).toBeNull();
    expect(window.localStorage.getItem('ha.dashboard.deviceAuth.credentialId.user')).toBeNull();
    expect(layout.widgets[0].alarmUnlockCode).toBeUndefined();
    expect(layout.widgets[1].lockCode).toBeUndefined();
  });
});
