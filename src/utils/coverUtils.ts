import type { MockEntityState } from '../types/ha';

export const COVER_FEATURE_OPEN = 1;
export const COVER_FEATURE_CLOSE = 2;
export const COVER_FEATURE_SET_POSITION = 4;
export const COVER_FEATURE_STOP = 8;
export const COVER_FEATURE_OPEN_TILT = 16;
export const COVER_FEATURE_CLOSE_TILT = 32;
export const COVER_FEATURE_STOP_TILT = 64;
export const COVER_FEATURE_SET_TILT_POSITION = 128;

export type NormalizedCoverState =
  | 'open'
  | 'closed'
  | 'opening'
  | 'closing'
  | 'stopped'
  | 'unavailable'
  | 'unknown';

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeCoverState(value: string | undefined): NormalizedCoverState {
  const normalized = (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
  if (!normalized) {
    return 'unknown';
  }
  if (normalized === 'opening' || normalized === 'in apertura' || normalized === 'apertura') {
    return 'opening';
  }
  if (normalized === 'closing' || normalized === 'in chiusura' || normalized === 'chiusura') {
    return 'closing';
  }
  if (normalized === 'open' || normalized === 'opened' || normalized === 'aperta' || normalized === 'aperto') {
    return 'open';
  }
  if (normalized === 'closed' || normalized === 'close' || normalized === 'chiusa' || normalized === 'chiuso') {
    return 'closed';
  }
  if (normalized === 'stopped' || normalized === 'stop' || normalized === 'ferma' || normalized === 'fermata' || normalized === 'fermato') {
    return 'stopped';
  }
  if (normalized === 'unavailable' || normalized === 'offline' || normalized === 'not available' || normalized === 'non disponibile') {
    return 'unavailable';
  }
  if (normalized === 'unknown' || normalized === 'sconosciuta' || normalized === 'sconosciuto') {
    return 'unknown';
  }
  return 'unknown';
}

export function translateCoverState(state: string) {
  if (state === 'open') {
    return 'Aperta';
  }
  if (state === 'closed') {
    return 'Chiusa';
  }
  if (state === 'opening') {
    return 'In apertura';
  }
  if (state === 'closing') {
    return 'In chiusura';
  }
  if (state === 'stopped') {
    return 'Fermata';
  }
  if (state === 'unavailable') {
    return 'Non disponibile';
  }
  return 'Sconosciuta';
}

export function resolveCoverPosition(
  state: string | undefined,
  rawPosition: unknown,
  fallback = 70,
) {
  const parsed = toFiniteNumber(rawPosition);
  if (parsed !== undefined) {
    return clampPercent(parsed);
  }
  const normalizedState = normalizeCoverState(state);
  if (normalizedState === 'open') {
    return 100;
  }
  if (normalizedState === 'closed') {
    return 0;
  }
  return clampPercent(fallback);
}

export function resolveCoverTiltPosition(rawTilt: unknown, fallback = 50) {
  const parsed = toFiniteNumber(rawTilt);
  if (parsed !== undefined) {
    return clampPercent(parsed);
  }
  return clampPercent(fallback);
}

export function resolveCoverPositionAttribute(rawAttributes: Record<string, unknown> | undefined) {
  return rawAttributes?.current_position ?? rawAttributes?.position ?? rawAttributes?.current_cover_position;
}

export function resolveCoverTiltAttribute(rawAttributes: Record<string, unknown> | undefined) {
  return rawAttributes?.current_tilt_position ?? rawAttributes?.tilt_position ?? rawAttributes?.current_cover_tilt_position;
}

export function resolveCoverSupportedFeatures(entity: MockEntityState | undefined) {
  const rawFeatures = toFiniteNumber(entity?.rawAttributes?.supported_features);
  if (typeof entity?.supportedFeatures === 'number') {
    return Math.round(entity.supportedFeatures);
  }
  return rawFeatures !== undefined ? Math.round(rawFeatures) : undefined;
}

export function coverSupportsOpen(supportedFeatures: number | undefined) {
  return (
    supportedFeatures === undefined ||
    supportedFeatures === 0 ||
    (supportedFeatures & COVER_FEATURE_OPEN) !== 0
  );
}

export function coverSupportsClose(supportedFeatures: number | undefined) {
  return (
    supportedFeatures === undefined ||
    supportedFeatures === 0 ||
    (supportedFeatures & COVER_FEATURE_CLOSE) !== 0
  );
}

export function coverSupportsSetPosition(supportedFeatures: number | undefined) {
  return (
    supportedFeatures === undefined ||
    supportedFeatures === 0 ||
    (supportedFeatures & COVER_FEATURE_SET_POSITION) !== 0
  );
}

export function coverSupportsStop(supportedFeatures: number | undefined) {
  return (
    supportedFeatures === undefined ||
    supportedFeatures === 0 ||
    (supportedFeatures & COVER_FEATURE_STOP) !== 0
  );
}

export function coverSupportsOpenTilt(supportedFeatures: number | undefined) {
  return typeof supportedFeatures === 'number' && (supportedFeatures & COVER_FEATURE_OPEN_TILT) !== 0;
}

export function coverSupportsCloseTilt(supportedFeatures: number | undefined) {
  return typeof supportedFeatures === 'number' && (supportedFeatures & COVER_FEATURE_CLOSE_TILT) !== 0;
}

export function coverSupportsSetTiltPosition(supportedFeatures: number | undefined) {
  return typeof supportedFeatures === 'number' && (supportedFeatures & COVER_FEATURE_SET_TILT_POSITION) !== 0;
}

export function coverSupportsStopTilt(supportedFeatures: number | undefined) {
  return typeof supportedFeatures === 'number' && (supportedFeatures & COVER_FEATURE_STOP_TILT) !== 0;
}

export function coverSupportsTilt(
  supportedFeatures: number | undefined,
  rawAttributes: Record<string, unknown> | undefined,
) {
  if (toFiniteNumber(rawAttributes?.current_tilt_position) !== undefined) {
    return true;
  }
  if (toFiniteNumber(rawAttributes?.tilt_position) !== undefined) {
    return true;
  }
  if (toFiniteNumber(rawAttributes?.current_cover_tilt_position) !== undefined) {
    return true;
  }
  if (supportedFeatures === undefined) {
    return false;
  }
  return (
    (supportedFeatures & COVER_FEATURE_SET_TILT_POSITION) !== 0 ||
    (supportedFeatures & COVER_FEATURE_OPEN_TILT) !== 0 ||
    (supportedFeatures & COVER_FEATURE_CLOSE_TILT) !== 0 ||
    (supportedFeatures & COVER_FEATURE_STOP_TILT) !== 0
  );
}
