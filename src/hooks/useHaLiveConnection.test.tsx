import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HA_CONNECTION_OFFLINE_DELAY_MS } from '../services/haConnectionState';
import { useHaLiveConnection } from './useHaLiveConnection';

const mocks = vi.hoisted(() => {
  const listeners = new Map<string, Set<(connection: unknown, data?: unknown) => void>>();
  const connection = {
    connected: true,
    addEventListener: vi.fn((type: string, listener: (connection: unknown, data?: unknown) => void) => {
      const entries = listeners.get(type) ?? new Set();
      entries.add(listener);
      listeners.set(type, entries);
    }),
    removeEventListener: vi.fn((type: string, listener: (connection: unknown, data?: unknown) => void) => {
      listeners.get(type)?.delete(listener);
    }),
    close: vi.fn(),
    reconnect: vi.fn(),
    ping: vi.fn(async () => true),
    sendMessagePromise: vi.fn(async () => []),
  };
  const emit = (type: string, data?: unknown) => {
    if (type === 'disconnected') connection.connected = false;
    if (type === 'ready') connection.connected = true;
    listeners.get(type)?.forEach((listener) => listener(connection, data));
  };
  return {
    listeners,
    connection,
    emit,
    callService: vi.fn(async () => undefined),
    createConnection: vi.fn(async () => connection),
    subscribeEntities: vi.fn((_connection: unknown, callback: (entities: Record<string, unknown>) => void) => {
      callback({
        'light.test': {
          entity_id: 'light.test',
          state: 'on',
          attributes: { friendly_name: 'Test light' },
          last_changed: '2026-07-21T10:00:00Z',
          last_updated: '2026-07-21T10:00:00Z',
          context: { id: 'test', parent_id: null, user_id: null },
        },
      });
      return vi.fn();
    }),
  };
});

vi.mock('home-assistant-js-websocket', () => ({
  ERR_CANNOT_CONNECT: 1,
  ERR_INVALID_AUTH: 2,
  ERR_CONNECTION_LOST: 3,
  ERR_HASS_HOST_REQUIRED: 4,
  ERR_INVALID_HTTPS_TO_HTTP: 5,
  ERR_INVALID_AUTH_CALLBACK: 6,
  callService: mocks.callService,
  createConnection: mocks.createConnection,
  createLongLivedTokenAuth: vi.fn(() => ({ type: 'token' })),
  getAuth: vi.fn(async () => ({ type: 'oauth' })),
  subscribeEntities: mocks.subscribeEntities,
}));

describe('useHaLiveConnection lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.listeners.clear();
    mocks.connection.connected = true;
    mocks.connection.close.mockClear();
    mocks.connection.reconnect.mockClear();
    mocks.connection.ping.mockClear();
    mocks.connection.sendMessagePromise.mockClear();
    mocks.callService.mockClear();
    mocks.createConnection.mockClear();
    mocks.subscribeEntities.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('keeps the last snapshot while reconnecting and moves to offline after the grace period', async () => {
    const { result } = renderHook(() => useHaLiveConnection({ url: 'https://ha.example.test', token: 'token' }));
    await act(async () => result.current.connect());

    expect(result.current.status).toBe('connected');
    expect(result.current.haStates['light.test']).toBeTruthy();

    act(() => mocks.emit('disconnected'));
    expect(result.current.status).toBe('reconnecting');
    expect(result.current.haStates['light.test']).toBeTruthy();
    await act(async () => {
      expect(await result.current.callService('light', 'turn_off', { entity_id: 'light.test' })).toBe(false);
    });
    expect(mocks.callService).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(HA_CONNECTION_OFFLINE_DELAY_MS));
    expect(result.current.status).toBe('offline');

    act(() => mocks.emit('ready'));
    expect(result.current.status).toBe('connected');
  });

  it('requires a new login only for a fatal authentication error', async () => {
    const { result } = renderHook(() => useHaLiveConnection({ url: 'https://ha.example.test', token: '' }));
    await act(async () => result.current.connect());

    act(() => mocks.emit('reconnect-error', 2));
    expect(result.current.status).toBe('reauth_required');
  });

  it('keeps an explicit user disconnect separate and clears the live snapshot', async () => {
    const { result } = renderHook(() => useHaLiveConnection({ url: 'https://ha.example.test', token: 'token' }));
    await act(async () => result.current.connect());

    act(() => result.current.disconnect());
    expect(result.current.status).toBe('disconnected_by_user');
    expect(result.current.haStates).toEqual({});
  });
});
