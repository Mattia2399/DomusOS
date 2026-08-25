import { describe, expect, it } from 'vitest';
import { HA_OAUTH_STATE_MAX_AGE_MS, resolveOAuthReturnPath, validateHaOAuthCallbackState } from './oauthState';

function state(issuedAt: number, returnTo = '/home?view=1') {
  return JSON.stringify({
    nonce: '0123456789abcdef0123456789abcdef',
    hassUrl: 'https://ha.example.test',
    returnTo,
    issuedAt,
  });
}

describe('OAuth callback state', () => {
  it('accepts only the exact, unexpired session state', () => {
    const now = Date.now();
    const expected = state(now - 1000);
    expect(validateHaOAuthCallbackState(expected, expected, now)).toMatchObject({ ok: true });
    expect(validateHaOAuthCallbackState(`${expected} `, expected, now)).toEqual({ ok: false, reason: 'mismatch' });
  });

  it('rejects expired, missing and therefore already-consumed states', () => {
    const now = Date.now();
    const expired = state(now - HA_OAUTH_STATE_MAX_AGE_MS - 1);
    expect(validateHaOAuthCallbackState(expired, expired, now)).toEqual({ ok: false, reason: 'expired' });
    expect(validateHaOAuthCallbackState(state(now), null, now)).toEqual({ ok: false, reason: 'mismatch' });
  });

  it('keeps the return target on the current origin', () => {
    const now = Date.now();
    const unsafe = state(now, '//evil.example/path');
    expect(validateHaOAuthCallbackState(unsafe, unsafe, now)).toEqual({ ok: false, reason: 'unsafe_return' });
    expect(resolveOAuthReturnPath('https://evil.example')).toBe('/home');
    expect(resolveOAuthReturnPath('/profile#ha')).toBe('/profile#ha');
  });
});
