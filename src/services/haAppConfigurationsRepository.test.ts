import { describe, expect, it, vi } from 'vitest';
import {
  APP_CONFIGURATIONS_SCHEMA,
  APP_CONFIGURATIONS_VERSION,
  createHaAppConfigurationsRepository,
  parseSharedAppConfigurationsDocument,
  type SharedAppConfigurationsDocument,
} from './haAppConfigurationsRepository';

describe('HaAppConfigurationsRepository', () => {
  it('rejects malformed shared documents', () => {
    expect(parseSharedAppConfigurationsDocument({})).toBeNull();
    expect(parseSharedAppConfigurationsDocument({
      schema: APP_CONFIGURATIONS_SCHEMA,
      version: APP_CONFIGURATIONS_VERSION,
      revision: 1,
      updatedAt: 'invalid',
      updatedByUserId: 'owner',
      apps: {},
    })).toBeNull();
  });

  it('writes, verifies and reloads a house-wide app configuration', async () => {
    let stored: SharedAppConfigurationsDocument | null = null;
    const callApi = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === 'frontend/get_system_data') return { value: stored };
      if (message.type === 'frontend/set_system_data') {
        stored = message.value as SharedAppConfigurationsDocument;
        return null;
      }
      throw new Error('unsupported');
    });
    const repository = createHaAppConfigurationsRepository({
      callApi,
      isConnected: () => true,
      canManage: () => true,
    });

    const saved = await repository.saveAppConfiguration(
      'irrigation',
      { rainSensorEntityId: 'binary_sensor.rain' },
      null,
      'owner-id',
    );

    expect(saved.status).toBe('saved');
    expect(stored?.revision).toBe(1);
    expect(stored?.apps.irrigation).toEqual({ rainSensorEntityId: 'binary_sensor.rain' });
    await expect(repository.load()).resolves.toMatchObject({
      status: 'found',
      document: { revision: 1, updatedByUserId: 'owner-id' },
    });
  });

  it('blocks writes without management permission', async () => {
    const callApi = vi.fn();
    const repository = createHaAppConfigurationsRepository({
      callApi,
      isConnected: () => true,
      canManage: () => false,
    });

    await expect(repository.saveAppConfiguration('irrigation', {}, null, 'limited-user'))
      .resolves.toEqual({ status: 'unauthorized' });
    expect(callApi).not.toHaveBeenCalled();
  });

  it('detects a stale revision before writing', async () => {
    const stored: SharedAppConfigurationsDocument = {
      schema: APP_CONFIGURATIONS_SCHEMA,
      version: APP_CONFIGURATIONS_VERSION,
      revision: 3,
      updatedAt: new Date().toISOString(),
      updatedByUserId: 'other-device',
      apps: { irrigation: { weatherEntityId: 'weather.home' } },
    };
    const callApi = vi.fn(async () => ({ value: stored }));
    const repository = createHaAppConfigurationsRepository({
      callApi,
      isConnected: () => true,
      canManage: () => true,
    });

    const result = await repository.saveAppConfiguration('irrigation', {}, 2, 'owner-id');
    expect(result.status).toBe('conflict');
    expect(callApi).toHaveBeenCalledTimes(1);
  });
});
