import {
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
  ERR_INVALID_AUTH_CALLBACK,
} from 'home-assistant-js-websocket';
import { describe, expect, it } from 'vitest';
import {
  classifyHaConnectionFailure,
  isHaAuthenticationFailure,
  isHaConnectionRecoveryStatus,
  isHaConnectionTransient,
  isHaReachabilityFailure,
} from './haConnectionState';

describe('Home Assistant connection state', () => {
  it.each([
    ERR_INVALID_AUTH,
    ERR_INVALID_AUTH_CALLBACK,
    new Error('auth_invalid'),
    new Error('401 Unauthorized'),
    new Error('Refresh token revoked'),
  ])('classifies %s as a reauthentication failure', (error) => {
    expect(isHaAuthenticationFailure(error)).toBe(true);
    expect(classifyHaConnectionFailure(error)).toBe('reauth_required');
  });

  it.each([
    ERR_CANNOT_CONNECT,
    new Error('Failed to fetch'),
    new Error('WebSocket connection lost'),
    new Error('Request timeout'),
  ])('classifies %s as a reachability failure', (error) => {
    expect(isHaReachabilityFailure(error)).toBe(true);
    expect(classifyHaConnectionFailure(error)).toBe('offline');
  });

  it('keeps unknown configuration failures separate', () => {
    expect(classifyHaConnectionFailure(new Error('Unsupported configuration'))).toBe('error');
  });

  it('separates transient and actionable recovery states', () => {
    expect(isHaConnectionTransient('connecting')).toBe(true);
    expect(isHaConnectionTransient('reconnecting')).toBe(true);
    expect(isHaConnectionTransient('offline')).toBe(false);
    expect(isHaConnectionRecoveryStatus('reconnecting')).toBe(true);
    expect(isHaConnectionRecoveryStatus('reauth_required')).toBe(true);
    expect(isHaConnectionRecoveryStatus('disconnected_by_user')).toBe(false);
  });
});
