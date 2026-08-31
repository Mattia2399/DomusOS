import { describe, expect, it } from 'vitest';
import {
  buildSupportDiagnostics,
  createSupportDiagnosticsFilename,
  serializeSupportDiagnostics,
} from './supportDiagnostics';

describe('supportDiagnostics', () => {
  it('exports useful aggregate diagnostics without entity names, states or secrets', () => {
    const report = buildSupportDiagnostics({
      appVersion: '0.1.0-beta.5',
      runtimeMode: 'real',
      haStatus: 'connected',
      connectionErrorPresent: true,
      identityAuthenticated: true,
      isOwner: true,
      embedded: true,
      viewport: { width: 390, height: 844, pixelRatio: 3 },
      states: {
        'light.secret_bedroom': {
          state: 'SUPER_SECRET_TOKEN',
          rawAttributes: {
            friendly_name: 'Nome privato',
            access_token: 'TOKEN-123',
          },
        },
        'sensor.private_temperature': {
          state: 'unavailable',
          rawAttributes: { latitude: 41.9, longitude: 12.5 },
        },
      },
      entityRegistry: [
        { entityId: 'light.secret_bedroom', deviceId: 'private-device-id' },
      ],
      deviceRegistry: [
        { id: 'private-device-id', nameByUser: 'Nome dispositivo privato' },
      ],
      areaCount: 4,
      sections: [],
      widgets: [
        {
          id: 'private-widget-id',
          kind: 'light',
          title: 'Titolo privato',
          entityId: 'light.secret_bedroom',
          status: 'Accesa',
          isOn: true,
          layout: { i: 'private-widget-id', x: 0, y: 0, w: 1, h: 1 },
        },
      ],
      deviceHealth: [],
      generatedAt: new Date('2026-07-30T12:00:00.000Z'),
    });
    const serialized = serializeSupportDiagnostics(report);

    expect(report).toMatchObject({
      schema: 'domus-ui-support-diagnostics',
      version: 1,
      connection: {
        status: 'connected',
        errorPresent: true,
        identityRole: 'owner',
      },
      inventory: {
        liveEntities: 2,
        unavailableEntities: 1,
        devices: 1,
        areas: 4,
        widgets: 1,
        entityDomains: { light: 1, sensor: 1 },
        widgetKinds: { light: 1 },
      },
    });
    [
      'SUPER_SECRET_TOKEN',
      'TOKEN-123',
      'Nome privato',
      'secret_bedroom',
      'private-device-id',
      'Titolo privato',
      'latitude',
      'longitude',
    ].forEach((sensitiveValue) => {
      expect(serialized).not.toContain(sensitiveValue);
    });
  });

  it('creates a filesystem-safe timestamped filename', () => {
    expect(createSupportDiagnosticsFilename('2026-07-30T12:00:00.000Z')).toBe(
      'domus-ui-diagnostics-2026-07-30T12-00-00-000Z.json',
    );
  });
});
