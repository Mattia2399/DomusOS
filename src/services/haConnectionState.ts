import {
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
  ERR_INVALID_AUTH_CALLBACK,
} from 'home-assistant-js-websocket';

export type HaConnectionStatus =
  | 'disconnected'
  | 'disconnected_by_user'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'offline'
  | 'reauth_required'
  | 'error';

export const HA_CONNECTION_OFFLINE_DELAY_MS = 12_000;
export const HA_CONNECTION_WATCHDOG_INTERVAL_MS = 15_000;
export const HA_CONNECTION_WATCHDOG_TIMEOUT_MS = 8_000;

function normalizeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.trim().toLowerCase() : '';
}

export function isHaAuthenticationFailure(error: unknown) {
  if (error === ERR_INVALID_AUTH || error === ERR_INVALID_AUTH_CALLBACK) {
    return true;
  }
  const message = normalizeErrorMessage(error);
  return [
    'invalid auth',
    'invalid authentication',
    'auth_invalid',
    'unauthorized',
    'token expired',
    'token revoked',
    'refresh token',
    'inactive user',
  ].some((fragment) => message.includes(fragment));
}

export function isHaReachabilityFailure(error: unknown) {
  if (error === ERR_CANNOT_CONNECT) {
    return true;
  }
  const message = normalizeErrorMessage(error);
  return [
    'cannot connect',
    'connection lost',
    'failed to fetch',
    'networkerror',
    'network error',
    'network request failed',
    'load failed',
    'timeout',
    'timed out',
    'websocket',
    'econnrefused',
    'enotfound',
  ].some((fragment) => message.includes(fragment));
}

export function classifyHaConnectionFailure(error: unknown): HaConnectionStatus {
  if (isHaAuthenticationFailure(error)) {
    return 'reauth_required';
  }
  if (isHaReachabilityFailure(error)) {
    return 'offline';
  }
  return 'error';
}

export function isHaConnectionTransient(status: HaConnectionStatus) {
  return status === 'connecting' || status === 'reconnecting';
}

export function isHaConnectionUnavailable(status: HaConnectionStatus) {
  return status !== 'connected';
}

export function isHaConnectionRecoveryStatus(status: HaConnectionStatus) {
  return status === 'reconnecting' || status === 'offline' || status === 'reauth_required' || status === 'error';
}
