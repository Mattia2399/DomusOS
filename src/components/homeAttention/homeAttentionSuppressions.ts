import { useCallback, useEffect, useState } from 'react';
import type { DashboardRuntimeMode } from '../../security/dashboardAccess';
import type { HomeAttentionItem } from './homeAttentionEngine';

export type HomeAttentionSuppressionMode = 'snooze' | 'until_change';
export type HomeAttentionSnoozePreset = 'hour' | 'evening' | 'tomorrow';

export type HomeAttentionSuppression = {
  itemId: string;
  fingerprint: string;
  mode: HomeAttentionSuppressionMode;
  until?: number;
};

export const REAL_HOME_ATTENTION_SUPPRESSIONS_STORAGE_KEY =
  'ha.dashboard.homeAttention.suppressions.v1';
export const DEMO_HOME_ATTENTION_SUPPRESSIONS_STORAGE_KEY =
  'ha.dashboard.demo.homeAttention.suppressions.v1';

export function getHomeAttentionSuppressionsStorageKey(
  runtimeMode: DashboardRuntimeMode,
) {
  return runtimeMode === 'demo'
    ? DEMO_HOME_ATTENTION_SUPPRESSIONS_STORAGE_KEY
    : REAL_HOME_ATTENTION_SUPPRESSIONS_STORAGE_KEY;
}

export function getHomeAttentionItemFingerprint(item: HomeAttentionItem) {
  return [
    item.id,
    item.title,
    item.source === 'demo' ? 'demo-state' : item.activeSince ?? '',
    item.value ?? '',
  ].join('|');
}

export function resolveHomeAttentionSnoozeUntil(
  preset: HomeAttentionSnoozePreset,
  now = Date.now(),
) {
  if (preset === 'hour') return now + 60 * 60_000;

  const current = new Date(now);
  if (preset === 'evening') {
    const evening = new Date(current);
    evening.setHours(20, 0, 0, 0);
    if (evening.getTime() <= now) {
      evening.setDate(evening.getDate() + 1);
    }
    return evening.getTime();
  }

  const tomorrow = new Date(current);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow.getTime();
}

function normalizeSuppressions(value: unknown, now = Date.now()) {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, HomeAttentionSuppression>();

  value.forEach((candidate) => {
    if (!candidate || typeof candidate !== 'object') return;
    const input = candidate as Partial<HomeAttentionSuppression>;
    if (
      typeof input.itemId !== 'string' ||
      !input.itemId.trim() ||
      typeof input.fingerprint !== 'string' ||
      !input.fingerprint.trim() ||
      (input.mode !== 'snooze' && input.mode !== 'until_change')
    ) {
      return;
    }
    const until =
      input.mode === 'snooze' && typeof input.until === 'number' && Number.isFinite(input.until)
        ? input.until
        : undefined;
    if (input.mode === 'snooze' && (!until || until <= now)) return;
    unique.set(input.itemId, {
      itemId: input.itemId,
      fingerprint: input.fingerprint,
      mode: input.mode,
      ...(until ? { until } : {}),
    });
  });

  return Array.from(unique.values());
}

export function readHomeAttentionSuppressions(
  runtimeMode: DashboardRuntimeMode,
  storage: Pick<Storage, 'getItem'> | null =
    typeof window === 'undefined' ? null : window.localStorage,
  now = Date.now(),
) {
  if (!storage) return [];
  try {
    const rawValue = storage.getItem(
      getHomeAttentionSuppressionsStorageKey(runtimeMode),
    );
    return rawValue ? normalizeSuppressions(JSON.parse(rawValue), now) : [];
  } catch {
    return [];
  }
}

export function saveHomeAttentionSuppressions(
  runtimeMode: DashboardRuntimeMode,
  suppressions: HomeAttentionSuppression[],
  storage: Pick<Storage, 'setItem' | 'removeItem'> | null =
    typeof window === 'undefined' ? null : window.localStorage,
  now = Date.now(),
) {
  const normalized = normalizeSuppressions(suppressions, now);
  const storageKey = getHomeAttentionSuppressionsStorageKey(runtimeMode);
  if (normalized.length === 0) {
    storage?.removeItem(storageKey);
  } else {
    storage?.setItem(storageKey, JSON.stringify(normalized));
  }
  return normalized;
}

export function isHomeAttentionItemSuppressed(
  item: HomeAttentionItem,
  suppressions: HomeAttentionSuppression[],
  now = Date.now(),
) {
  if (item.severity === 'critical') return false;
  const fingerprint = getHomeAttentionItemFingerprint(item);
  const suppression = suppressions.find(
    (candidate) =>
      candidate.itemId === item.id && candidate.fingerprint === fingerprint,
  );
  if (!suppression) return false;
  return suppression.mode === 'until_change' || Boolean(suppression.until && suppression.until > now);
}

export function useHomeAttentionSuppressions(runtimeMode: DashboardRuntimeMode) {
  const [suppressions, setSuppressionsState] = useState(() =>
    readHomeAttentionSuppressions(runtimeMode),
  );

  useEffect(() => {
    setSuppressionsState(readHomeAttentionSuppressions(runtimeMode));
  }, [runtimeMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const storageKey = getHomeAttentionSuppressionsStorageKey(runtimeMode);
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && event.key === storageKey) {
        setSuppressionsState(readHomeAttentionSuppressions(runtimeMode));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [runtimeMode]);

  const updateSuppressions = useCallback(
    (
      updater: (
        current: HomeAttentionSuppression[],
      ) => HomeAttentionSuppression[],
    ) => {
      setSuppressionsState((current) => {
        const next = updater(current);
        return next === current
          ? current
          : saveHomeAttentionSuppressions(runtimeMode, next);
      });
    },
    [runtimeMode],
  );

  const suppressItem = useCallback(
    (
      item: HomeAttentionItem,
      mode: HomeAttentionSuppressionMode,
      until?: number,
    ) => {
      if (item.severity === 'critical') return;
      updateSuppressions((current) => [
        ...current.filter((entry) => entry.itemId !== item.id),
        {
          itemId: item.id,
          fingerprint: getHomeAttentionItemFingerprint(item),
          mode,
          ...(mode === 'snooze' && until ? { until } : {}),
        },
      ]);
    },
    [updateSuppressions],
  );

  const pruneSuppressions = useCallback(
    (activeItems: HomeAttentionItem[], now = Date.now()) => {
      const activeFingerprints = new Map(
        activeItems
          .filter((item) => item.severity !== 'critical')
          .map((item) => [item.id, getHomeAttentionItemFingerprint(item)]),
      );
      updateSuppressions((current) => {
        const next = current.filter((entry) => {
          if (entry.mode === 'snooze' && (!entry.until || entry.until <= now)) {
            return false;
          }
          return activeFingerprints.get(entry.itemId) === entry.fingerprint;
        });
        return next.length === current.length ? current : next;
      });
    },
    [updateSuppressions],
  );

  const clearSuppressions = useCallback(() => {
    setSuppressionsState(
      saveHomeAttentionSuppressions(runtimeMode, []),
    );
  }, [runtimeMode]);

  return {
    suppressions,
    suppressItem,
    pruneSuppressions,
    clearSuppressions,
  };
}
