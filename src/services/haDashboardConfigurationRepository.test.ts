import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSharedHouseConfiguration,
  HA_SHARED_HOUSE_CONFIGURATION_KEY,
  type DashboardLayoutConfiguration,
  type SharedHouseConfiguration,
} from './dashboardConfigurationRepository';
import { HA_DASHBOARD_REVISION_HISTORY_KEY } from './dashboardRevisionHistory';
import { HA_DASHBOARD_RESET_MARKER_KEY } from './dashboardReset';
import { createHaDashboardConfigurationRepository } from './haDashboardConfigurationRepository';
import {
  createLocalDashboardConfigurationCache,
  SHARED_HOUSE_CONFIGURATION_CACHE_KEY,
} from './localDashboardConfigurationCache';

const dashboard: DashboardLayoutConfiguration = {
  storageVersion: 14,
  sections: [],
  widgets: [],
  widgetTypeLayoutOverrides: {},
  widgetLayoutOverrides: {},
  responsiveLayouts: {},
};

function buildDocument(revision = 1): SharedHouseConfiguration {
  return createSharedHouseConfiguration({
    revision,
    updatedAt: '2026-08-04T10:00:00.000Z',
    updatedByUserId: 'owner',
    dashboard,
    security: {
      alarmEntityId: null,
      visibleSensorEntityIds: null,
      visibleCameraEntityIds: null,
    },
    rooms: { customRooms: [], hiddenEntitiesByRoom: {} },
  });
}

beforeEach(() => window.localStorage.clear());

describe('HA dashboard configuration repository', () => {
  it('loads an empty or existing HA system document', async () => {
    const existing = buildDocument(4);
    const emptyCall = vi.fn(async () => ({ value: null }));
    const foundCall = vi.fn(async () => ({ value: existing }));

    await expect(createHaDashboardConfigurationRepository({
      callApi: emptyCall,
      isConnected: () => true,
      canManageSharedConfiguration: () => true,
    }).loadSharedHouseConfiguration()).resolves.toEqual({ status: 'empty' });

    await expect(createHaDashboardConfigurationRepository({
      callApi: foundCall,
      isConnected: () => true,
      canManageSharedConfiguration: () => true,
    }).loadSharedHouseConfiguration()).resolves.toEqual({ status: 'found', document: existing });
    expect(foundCall).toHaveBeenCalledWith({
      type: 'frontend/get_system_data',
      key: HA_SHARED_HOUSE_CONFIGURATION_KEY,
    }, { reportError: false, throwOnError: true });
  });

  it('fails closed while offline or without administrative access', async () => {
    const callApi = vi.fn();
    const offlineRepository = createHaDashboardConfigurationRepository({
      callApi,
      isConnected: () => false,
      canManageSharedConfiguration: () => true,
    });
    await expect(offlineRepository.loadSharedHouseConfiguration()).resolves.toEqual({ status: 'offline' });

    const limitedRepository = createHaDashboardConfigurationRepository({
      callApi,
      isConnected: () => true,
      canManageSharedConfiguration: () => false,
    });
    await expect(limitedRepository.saveSharedHouseConfiguration(buildDocument(), null))
      .resolves.toEqual({ status: 'unauthorized' });
    expect(callApi).not.toHaveBeenCalled();
  });

  it('reports read-only server storage for a connected limited user', async () => {
    const repository = createHaDashboardConfigurationRepository({
      callApi: vi.fn(async () => ({ value: buildDocument(2) })),
      isConnected: () => true,
      canManageSharedConfiguration: () => false,
    });

    await expect(repository.probeSharedHouseConfiguration()).resolves.toBe('available_read_only');
  });

  it('detects stale revisions before writing', async () => {
    const current = buildDocument(5);
    const callApi = vi.fn(async () => ({ value: current }));
    const repository = createHaDashboardConfigurationRepository({
      callApi,
      isConnected: () => true,
      canManageSharedConfiguration: () => true,
    });

    await expect(repository.saveSharedHouseConfiguration(buildDocument(4), 3))
      .resolves.toEqual({ status: 'conflict', current });
    expect(callApi).toHaveBeenCalledTimes(1);
  });

  it('writes, verifies and strips legacy widget secrets', async () => {
    const next = {
      ...buildDocument(2),
      dashboard: {
        ...dashboard,
        widgets: [{
          id: 'lock', kind: 'lock', title: 'Porta', entityId: 'lock.door', status: 'Chiusa',
          isOn: false, layout: { i: 'lock', x: 0, y: 0, w: 1, h: 2 }, lockCode: '2580',
        }],
      },
    } as unknown as SharedHouseConfiguration;
    const current = buildDocument(1);
    let stored: SharedHouseConfiguration = current;
    const callApi = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === 'frontend/set_system_data') {
        stored = message.value as SharedHouseConfiguration;
        return undefined;
      }
      return { value: stored };
    });
    const repository = createHaDashboardConfigurationRepository({
      callApi,
      isConnected: () => true,
      canManageSharedConfiguration: () => true,
    });

    const result = await repository.saveSharedHouseConfiguration(next, 1);
    expect(result.status).toBe('saved');
    const storedWidget = stored.dashboard.widgets[0] as unknown as Record<string, unknown>;
    expect(storedWidget.lockCode).toBeUndefined();
    expect(storedWidget.status).toBeUndefined();
    expect(storedWidget.isOn).toBeUndefined();
  });

  it('accepts the null payload returned by a successful HA set command', async () => {
    let stored = buildDocument(1);
    const callApi = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === 'frontend/set_system_data') {
        stored = message.value as SharedHouseConfiguration;
        return null;
      }
      return { value: stored };
    });
    const repository = createHaDashboardConfigurationRepository({
      callApi,
      isConnected: () => true,
      canManageSharedConfiguration: () => true,
    });

    await expect(repository.saveSharedHouseConfiguration(buildDocument(2), 1))
      .resolves.toMatchObject({ status: 'saved', document: { revision: 2 } });
  });

  it('confirms the write when HA omits the ephemeral publication client id', async () => {
    let stored = buildDocument(1);
    const requested = {
      ...buildDocument(2),
      publication: { source: 'edit' as const, originClientId: 'desktop-client' },
      dashboard: {
        storageVersion: dashboard.storageVersion,
        sections: dashboard.sections,
        widgets: dashboard.widgets,
        widgetTypeLayoutOverrides: dashboard.widgetTypeLayoutOverrides,
        responsiveLayouts: dashboard.responsiveLayouts,
        widgetLayoutOverrides: dashboard.widgetLayoutOverrides,
      },
    };
    const callApi = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === 'frontend/set_system_data') {
        const written = message.value as SharedHouseConfiguration;
        stored = {
          ...written,
          publication: written.publication
            ? { source: written.publication.source, restoredFromRevision: written.publication.restoredFromRevision }
            : undefined,
        };
        return null;
      }
      return { value: stored };
    });
    const repository = createHaDashboardConfigurationRepository({
      callApi,
      isConnected: () => true,
      canManageSharedConfiguration: () => true,
    });

    await expect(repository.saveSharedHouseConfiguration(requested, 1))
      .resolves.toMatchObject({ status: 'saved', document: { revision: 2 } });
  });

  it('does not confirm a same-number revision written by another client', async () => {
    const current = buildDocument(1);
    const requested = {
      ...buildDocument(2),
      updatedAt: '2026-08-04T10:01:00.000Z',
      dashboard: { ...dashboard, sections: [{ id: 'mine', kind: 'stack-grid', title: 'Mine', layout: { i: 'mine', x: 0, y: 0, w: 4, h: 4 } }] },
    } as SharedHouseConfiguration;
    const competing = {
      ...buildDocument(2),
      updatedAt: '2026-08-04T10:01:01.000Z',
      dashboard: { ...dashboard, sections: [{ id: 'other', kind: 'stack-grid', title: 'Other', layout: { i: 'other', x: 0, y: 0, w: 4, h: 4 } }] },
    } as SharedHouseConfiguration;
    let stored = current;
    const callApi = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === 'frontend/set_system_data') {
        stored = competing;
        return undefined;
      }
      return { value: stored };
    });
    const repository = createHaDashboardConfigurationRepository({
      callApi,
      isConnected: () => true,
      canManageSharedConfiguration: () => true,
    });

    await expect(repository.saveSharedHouseConfiguration(requested, 1))
      .resolves.toEqual({ status: 'conflict', current: competing });
  });

  it('retries verification when the bridge briefly returns an empty value after write', async () => {
    vi.useFakeTimers();
    let stored = buildDocument(1);
    let emptyReadsAfterWrite = 2;
    let hasWritten = false;
    const callApi = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === 'frontend/set_system_data') {
        stored = message.value as SharedHouseConfiguration;
        hasWritten = true;
        return null;
      }
      if (hasWritten && emptyReadsAfterWrite > 0) {
        emptyReadsAfterWrite -= 1;
        return { value: null };
      }
      return { value: stored };
    });
    const repository = createHaDashboardConfigurationRepository({
      callApi,
      isConnected: () => true,
      canManageSharedConfiguration: () => true,
    });

    const savePromise = repository.saveSharedHouseConfiguration(buildDocument(2), 1);
    await vi.runAllTimersAsync();
    await expect(savePromise).resolves.toMatchObject({ status: 'saved', document: { revision: 2 } });
    vi.useRealTimers();
  });

  it('clears and verifies revision history and shared configuration', async () => {
    let storedConfiguration: unknown = buildDocument(4);
    let storedHistory: unknown = { entries: [{ revision: 3 }] };
    let storedResetMarker: unknown = null;
    const progress: string[] = [];
    const callApi = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === 'frontend/set_system_data') {
        if (message.key === HA_DASHBOARD_REVISION_HISTORY_KEY) storedHistory = message.value;
        if (message.key === HA_SHARED_HOUSE_CONFIGURATION_KEY) storedConfiguration = message.value;
        if (message.key === HA_DASHBOARD_RESET_MARKER_KEY) storedResetMarker = message.value;
        return null;
      }
      return {
        value: message.key === HA_DASHBOARD_REVISION_HISTORY_KEY
          ? storedHistory
          : message.key === HA_DASHBOARD_RESET_MARKER_KEY
            ? storedResetMarker
            : storedConfiguration,
      };
    });
    const repository = createHaDashboardConfigurationRepository({
      callApi,
      isConnected: () => true,
      canManageSharedConfiguration: () => true,
    });

    await expect(repository.resetAuthoritativeConfiguration('owner-1', (stage) => progress.push(stage)))
      .resolves.toMatchObject({ status: 'reset', marker: { status: 'complete' } });
    expect(progress).toEqual([
      'publishing_reset',
      'clearing_history',
      'clearing_shared_configuration',
      'verifying_server',
      'finalizing_reset',
    ]);
    expect(storedHistory).toBeNull();
    expect(storedConfiguration).toBeNull();
    expect(storedResetMarker).toMatchObject({
      schema: 'domusos-dashboard-reset',
      status: 'complete',
      requestedByUserId: 'owner-1',
    });
  });

  it('fails closed without clearing when reset is unauthorized', async () => {
    const callApi = vi.fn();
    const repository = createHaDashboardConfigurationRepository({
      callApi,
      isConnected: () => true,
      canManageSharedConfiguration: () => false,
    });

    await expect(repository.resetAuthoritativeConfiguration('owner-1')).resolves.toEqual({
      status: 'unauthorized',
    });
    expect(callApi).not.toHaveBeenCalled();
  });
});

describe('local dashboard configuration cache', () => {
  it('round-trips valid documents and ignores malformed cache data', () => {
    const cache = createLocalDashboardConfigurationCache(window.localStorage);
    cache.saveSharedHouseConfiguration(buildDocument(2));
    expect(cache.loadSharedHouseConfiguration()?.revision).toBe(2);

    window.localStorage.setItem(SHARED_HOUSE_CONFIGURATION_CACHE_KEY, '{bad-json');
    expect(cache.loadSharedHouseConfiguration()).toBeNull();
    cache.clearSharedHouseConfiguration();
    expect(window.localStorage.getItem(SHARED_HOUSE_CONFIGURATION_CACHE_KEY)).toBeNull();
  });
});
