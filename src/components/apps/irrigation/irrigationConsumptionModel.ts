export type IrrigationConsumptionPeriod = '7d' | '30d' | '12m';

export type IrrigationConsumptionPoint = {
  key: string;
  label: string;
  value: number;
};

type HistoryEntry = {
  s?: unknown;
  state?: unknown;
  lu?: unknown;
  lc?: unknown;
  last_changed?: unknown;
  last_changed_ts?: unknown;
  last_updated?: unknown;
  last_updated_ts?: unknown;
  entity_id?: unknown;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function irrigationConsumptionPeriodStart(period: IrrigationConsumptionPeriod, end = new Date()) {
  const start = new Date(end);
  if (period === '7d') start.setDate(start.getDate() - 7);
  else if (period === '30d') start.setDate(start.getDate() - 30);
  else start.setMonth(start.getMonth() - 12);
  return start;
}

export function irrigationConsumptionPeriodDays(period: IrrigationConsumptionPeriod) {
  if (period === '7d') return 7;
  if (period === '30d') return 30;
  return 365;
}

function entryTimestamp(entry: HistoryEntry) {
  const raw = entry.lu ?? entry.last_updated ?? entry.last_updated_ts ?? entry.lc ?? entry.last_changed ?? entry.last_changed_ts;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.abs(raw) < 10_000_000_000 ? Math.round(raw * 1000) : Math.round(raw);
  }
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const trimmed = raw.trim();
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    const numeric = Number.parseFloat(trimmed);
    if (Number.isFinite(numeric)) return Math.abs(numeric) < 10_000_000_000 ? Math.round(numeric * 1000) : Math.round(numeric);
  }
  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function entryValue(entry: HistoryEntry) {
  const raw = entry.s ?? entry.state;
  const value = typeof raw === 'number' ? raw : Number.parseFloat(`${raw ?? ''}`);
  return Number.isFinite(value) ? value : null;
}

function collectHistoryArrays(payload: unknown): HistoryEntry[][] {
  if (Array.isArray(payload)) {
    if (payload.every((entry) => Array.isArray(entry))) return payload as HistoryEntry[][];
    return [payload as HistoryEntry[]];
  }
  if (!payload || typeof payload !== 'object') return [];
  return Object.values(payload as Record<string, unknown>)
    .filter((entry): entry is HistoryEntry[] => Array.isArray(entry));
}

export function extractIrrigationHistoryEntries(payload: unknown, entityId: string) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const directEntries = (payload as Record<string, unknown>)[entityId];
    if (Array.isArray(directEntries)) {
      return directEntries
        .map((entry) => ({ timestamp: entryTimestamp(entry), value: entryValue(entry) }))
        .filter((entry): entry is { timestamp: number; value: number } => entry.timestamp !== null && entry.value !== null)
        .sort((first, second) => first.timestamp - second.timestamp);
    }
  }
  const arrays = collectHistoryArrays(payload);
  const matching = arrays.find((entries) => entries.some((entry) => entry?.entity_id === entityId));
  const fallback = arrays.length === 1 ? arrays[0] : [];
  return (matching ?? fallback)
    .map((entry) => ({ timestamp: entryTimestamp(entry), value: entryValue(entry) }))
    .filter((entry): entry is { timestamp: number; value: number } => entry.timestamp !== null && entry.value !== null)
    .sort((first, second) => first.timestamp - second.timestamp);
}

function bucketDescriptor(period: IrrigationConsumptionPeriod, timestamp: number) {
  const date = new Date(timestamp);
  if (period === '12m') {
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    return { key, label: date.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '') };
  }

  const bucketSizeDays = period === '30d' ? 2 : 1;
  const localDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const bucketStart = Math.floor(localDay / (DAY_MS * bucketSizeDays)) * DAY_MS * bucketSizeDays;
  const bucketDate = new Date(bucketStart);
  return {
    key: `${bucketStart}`,
    label: period === '7d'
      ? bucketDate.toLocaleDateString('it-IT', { weekday: 'short' }).slice(0, 2)
      : bucketDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).replace('.', ''),
  };
}

/**
 * Converts a monotonically increasing (or periodically resetting) HA counter into
 * consumption buckets. A reset contributes the new value, while invalid and
 * negative samples are ignored.
 */
export function buildIrrigationConsumptionSeries(
  payload: unknown,
  entityId: string,
  period: IrrigationConsumptionPeriod,
  unitMultiplier = 1,
): IrrigationConsumptionPoint[] {
  const entries = extractIrrigationHistoryEntries(payload, entityId);
  if (entries.length < 2) return [];

  const buckets = new Map<string, IrrigationConsumptionPoint>();
  for (let index = 1; index < entries.length; index += 1) {
    const previous = entries[index - 1].value;
    const current = entries[index].value;
    const rawDelta = current >= previous ? current - previous : Math.max(0, current);
    const delta = rawDelta * unitMultiplier;
    if (!Number.isFinite(delta) || delta < 0) continue;
    const descriptor = bucketDescriptor(period, entries[index].timestamp);
    const existing = buckets.get(descriptor.key);
    buckets.set(descriptor.key, {
      ...descriptor,
      value: (existing?.value ?? 0) + delta,
    });
  }

  return Array.from(buckets.values()).map((point) => ({
    ...point,
    value: Math.round(point.value * 10) / 10,
  }));
}

export function waterUnitMultiplier(unit: unknown) {
  const normalized = `${unit ?? ''}`.trim().toLowerCase().replace('³', '3');
  if (['m3', 'm^3'].includes(normalized)) return 1000;
  if (['ml', 'milliliter', 'milliliters'].includes(normalized)) return 0.001;
  if (['gal', 'gallon', 'gallons'].includes(normalized)) return 3.78541;
  return 1;
}
