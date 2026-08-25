import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HA_IDENTITY_REVALIDATION_INTERVAL_MS,
  useHaIdentityRevalidation,
} from './useHaIdentityRevalidation';

describe('useHaIdentityRevalidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('replaces cached admin privileges after Home Assistant changes the role', async () => {
    let payload: Record<string, unknown> | null = {
      id: 'user-1',
      name: 'Test admin',
      is_admin: true,
      is_owner: false,
    };
    const callApi = vi.fn(async () => payload);
    const { result } = renderHook(() =>
      useHaIdentityRevalidation({ isConnected: true, callApi }),
    );

    await act(async () => Promise.resolve());
    expect(result.current?.isAdmin).toBe(true);

    payload = {
      id: 'user-1',
      name: 'Test admin',
      is_admin: false,
      is_owner: false,
    };
    await act(async () => {
      await vi.advanceTimersByTimeAsync(HA_IDENTITY_REVALIDATION_INTERVAL_MS);
    });

    expect(result.current?.isAdmin).toBe(false);
    expect(callApi).toHaveBeenLastCalledWith(
      { type: 'auth/current_user' },
      { reportError: false },
    );
  });

  it('revalidates immediately on focus and fails closed on an invalid response', async () => {
    let payload: Record<string, unknown> | null = {
      id: 'owner-1',
      name: 'Owner',
      is_admin: true,
      is_owner: true,
    };
    const callApi = vi.fn(async () => payload);
    const { result } = renderHook(() =>
      useHaIdentityRevalidation({ isConnected: true, callApi }),
    );

    await act(async () => Promise.resolve());
    expect(result.current?.isOwner).toBe(true);

    payload = null;
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      await Promise.resolve();
    });

    expect(result.current).toBeNull();
  });
});
