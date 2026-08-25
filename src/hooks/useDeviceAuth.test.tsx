import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEVICE_AUTH_VERIFICATION_TIMEOUT_MS, useDeviceAuth } from './useDeviceAuth';

describe('useDeviceAuth same-document synchronization', () => {
  const secureContextDescriptor = Object.getOwnPropertyDescriptor(window, 'isSecureContext');
  const credentialsDescriptor = Object.getOwnPropertyDescriptor(navigator, 'credentials');
  const createCredential = vi.fn(async () => ({
    rawId: new Uint8Array([1, 2, 3, 4]).buffer,
  }));
  const getCredential = vi.fn(async () => ({
    rawId: new Uint8Array([1, 2, 3, 4]).buffer,
  }));

  beforeEach(() => {
    window.localStorage.clear();
    createCredential.mockClear();
    getCredential.mockClear();
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: { create: createCredential, get: getCredential },
    });
    vi.stubGlobal('PublicKeyCredential', {
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn(async () => true),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.unstubAllGlobals();
    if (secureContextDescriptor) {
      Object.defineProperty(window, 'isSecureContext', secureContextDescriptor);
    } else {
      delete (window as Window & { isSecureContext?: boolean }).isSecureContext;
    }
    if (credentialsDescriptor) {
      Object.defineProperty(navigator, 'credentials', credentialsDescriptor);
    } else {
      delete (navigator as Navigator & { credentials?: CredentialsContainer }).credentials;
    }
  });

  it('shares enrollment and removal immediately between hook instances for the same user', async () => {
    const user = { id: 'ha-user-1', name: 'mattia', displayName: 'Mattia' };
    const first = renderHook(() => useDeviceAuth(user));
    const second = renderHook(() => useDeviceAuth(user));

    await act(async () => {
      expect(await first.result.current.enroll('Test enrollment')).toBe(true);
    });

    expect(first.result.current.isEnrolled).toBe(true);
    expect(second.result.current.isEnrolled).toBe(true);
    expect(second.result.current.credentialId).toBe(first.result.current.credentialId);

    await act(async () => {
      expect(await second.result.current.authenticate('Test authentication')).toBe(true);
    });
    expect(getCredential).toHaveBeenCalledTimes(1);

    act(() => first.result.current.clearCredential());
    expect(first.result.current.isEnrolled).toBe(false);
    expect(second.result.current.isEnrolled).toBe(false);
  });

  it('migrates a legacy credential only once instead of exposing it to another user', () => {
    window.localStorage.setItem('ha.dashboard.security.biometricCredentialId', 'legacy-id');
    const first = renderHook(() =>
      useDeviceAuth({ id: 'ha-user-1', name: 'first', displayName: 'First' }),
    );

    expect(first.result.current.isEnrolled).toBe(true);
    expect(window.localStorage.getItem('ha.dashboard.security.biometricCredentialId')).toBeNull();
    first.unmount();

    const second = renderHook(() =>
      useDeviceAuth({ id: 'ha-user-2', name: 'second', displayName: 'Second' }),
    );
    expect(second.result.current.isEnrolled).toBe(false);
  });

  it('stops a stalled platform verification and returns the PIN fallback result', async () => {
    vi.useFakeTimers();
    const result = renderHook(() =>
      useDeviceAuth({ id: 'ha-user-1', name: 'mattia', displayName: 'Mattia' }),
    );

    await act(async () => {
      expect(await result.result.current.enroll('Test enrollment')).toBe(true);
    });

    getCredential.mockImplementationOnce(() => new Promise(() => undefined));

    let authenticationResult: Promise<boolean>;
    act(() => {
      authenticationResult = result.result.current.authenticate('Test stalled authentication');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEVICE_AUTH_VERIFICATION_TIMEOUT_MS);
    });

    await expect(authenticationResult!).resolves.toBe(false);
    const requestOptions = (
      getCredential.mock.calls as unknown as Array<[
        CredentialRequestOptions & { signal?: AbortSignal },
      ]>
    ).at(-1)?.[0];
    expect(requestOptions?.signal?.aborted).toBe(true);
  });
});
