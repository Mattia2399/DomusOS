import { normalizeHassUrl } from '../../../services/haLive';

export function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) {
      return undefined;
    }
    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

export function toTrimmedString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}`;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return undefined;
}

export function normalizeLower(value: string | undefined) {
  return (value ?? '').trim().toLowerCase();
}

export function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (
      [
        'true',
        'on',
        'yes',
        'enabled',
        'supported',
        'available',
        '1',
        'attivo',
        'presente',
        'rilevato',
      ].includes(normalized)
    ) {
      return true;
    }
    if (
      [
        'false',
        'off',
        'no',
        'disabled',
        'unsupported',
        'unavailable',
        '0',
        'assente',
        'inattivo',
        'spento',
        'silenzioso',
      ].includes(normalized)
    ) {
      return false;
    }
  }
  return undefined;
}

export function normalizeLookupToken(value: string | undefined) {
  if (!value) {
    return '';
  }
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function resolveRelativeHaUrl(value: string | undefined, haUrl: string) {
  if (!value) {
    return undefined;
  }
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }
  if (value.startsWith('/')) {
    const base = normalizeHassUrl(haUrl);
    return base ? `${base}${value}` : value;
  }
  return value;
}

export function toTimestampMs(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 1_000_000_000_000_000) {
      return Math.round(value / 1000);
    }
    if (value < 10_000_000_000) {
      return Math.round(value * 1000);
    }
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const numericValue = Number(value.trim());
    if (Number.isFinite(numericValue) && value.trim().length > 0) {
      return toTimestampMs(numericValue);
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

export function isRecordObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function toHistoryTimestampMs(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.abs(value) < 10_000_000_000 ? Math.round(value * 1000) : Math.round(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      const numeric = Number.parseFloat(trimmed);
      if (Number.isFinite(numeric)) {
        return Math.abs(numeric) < 10_000_000_000 ? Math.round(numeric * 1000) : Math.round(numeric);
      }
    }
    const parsed = Date.parse(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}
