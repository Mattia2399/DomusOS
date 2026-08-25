import { useCallback, useEffect, useState } from 'react';
import type { DashboardRuntimeMode } from '../../security/dashboardAccess';
import type { HomeAttentionCategory } from './homeAttentionEngine';

export type HomeAttentionPreferences = {
  enabled: boolean;
  categories: Record<HomeAttentionCategory, boolean>;
  batteryWarningThreshold: number;
  openingWarningMinutes: number;
};

export const REAL_HOME_ATTENTION_STORAGE_KEY = 'ha.dashboard.homeAttention.v1';
export const DEMO_HOME_ATTENTION_STORAGE_KEY = 'ha.dashboard.demo.homeAttention.v1';

export const DEFAULT_HOME_ATTENTION_PREFERENCES: HomeAttentionPreferences = {
  enabled: true,
  categories: {
    safety: true,
    security: true,
    opening: true,
    availability: true,
    battery: true,
    configuration: true,
  },
  batteryWarningThreshold: 20,
  openingWarningMinutes: 10,
};

const BATTERY_THRESHOLDS = new Set([10, 15, 20, 25, 30]);
const OPENING_THRESHOLDS = new Set([5, 10, 15, 30, 60]);
const CATEGORY_KEYS: HomeAttentionCategory[] = [
  'safety',
  'security',
  'opening',
  'availability',
  'battery',
  'configuration',
];

export function getHomeAttentionStorageKey(runtimeMode: DashboardRuntimeMode) {
  return runtimeMode === 'demo'
    ? DEMO_HOME_ATTENTION_STORAGE_KEY
    : REAL_HOME_ATTENTION_STORAGE_KEY;
}

function normalizePreferences(value: unknown): HomeAttentionPreferences {
  if (!value || typeof value !== 'object') {
    return {
      ...DEFAULT_HOME_ATTENTION_PREFERENCES,
      categories: { ...DEFAULT_HOME_ATTENTION_PREFERENCES.categories },
    };
  }

  const candidate = value as Partial<HomeAttentionPreferences>;
  const categories =
    candidate.categories && typeof candidate.categories === 'object'
      ? candidate.categories
      : {};
  const batteryWarningThreshold = Number(candidate.batteryWarningThreshold);
  const openingWarningMinutes = Number(candidate.openingWarningMinutes);

  return {
    enabled:
      typeof candidate.enabled === 'boolean'
        ? candidate.enabled
        : DEFAULT_HOME_ATTENTION_PREFERENCES.enabled,
    categories: Object.fromEntries(
      CATEGORY_KEYS.map((category) => [
        category,
        typeof categories[category] === 'boolean'
          ? categories[category]
          : DEFAULT_HOME_ATTENTION_PREFERENCES.categories[category],
      ]),
    ) as Record<HomeAttentionCategory, boolean>,
    batteryWarningThreshold: BATTERY_THRESHOLDS.has(batteryWarningThreshold)
      ? batteryWarningThreshold
      : DEFAULT_HOME_ATTENTION_PREFERENCES.batteryWarningThreshold,
    openingWarningMinutes: OPENING_THRESHOLDS.has(openingWarningMinutes)
      ? openingWarningMinutes
      : DEFAULT_HOME_ATTENTION_PREFERENCES.openingWarningMinutes,
  };
}

export function readHomeAttentionPreferences(
  runtimeMode: DashboardRuntimeMode,
  storage: Pick<Storage, 'getItem'> | null =
    typeof window === 'undefined' ? null : window.localStorage,
): HomeAttentionPreferences {
  if (!storage) {
    return normalizePreferences(null);
  }
  try {
    const rawValue = storage.getItem(getHomeAttentionStorageKey(runtimeMode));
    return rawValue ? normalizePreferences(JSON.parse(rawValue)) : normalizePreferences(null);
  } catch {
    return normalizePreferences(null);
  }
}

export function saveHomeAttentionPreferences(
  runtimeMode: DashboardRuntimeMode,
  preferences: HomeAttentionPreferences,
  storage: Pick<Storage, 'setItem'> | null =
    typeof window === 'undefined' ? null : window.localStorage,
) {
  const normalized = normalizePreferences(preferences);
  storage?.setItem(getHomeAttentionStorageKey(runtimeMode), JSON.stringify(normalized));
  return normalized;
}

export function useHomeAttentionPreferences(runtimeMode: DashboardRuntimeMode) {
  const [preferences, setPreferencesState] = useState(() =>
    readHomeAttentionPreferences(runtimeMode),
  );

  useEffect(() => {
    setPreferencesState(readHomeAttentionPreferences(runtimeMode));
  }, [runtimeMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const storageKey = getHomeAttentionStorageKey(runtimeMode);
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && event.key === storageKey) {
        setPreferencesState(readHomeAttentionPreferences(runtimeMode));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [runtimeMode]);

  const setPreferences = useCallback(
    (
      next:
        | HomeAttentionPreferences
        | ((current: HomeAttentionPreferences) => HomeAttentionPreferences),
    ) => {
      setPreferencesState((current) => {
        const resolved = typeof next === 'function' ? next(current) : next;
        return saveHomeAttentionPreferences(runtimeMode, resolved);
      });
    },
    [runtimeMode],
  );

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_HOME_ATTENTION_PREFERENCES);
  }, [setPreferences]);

  return { preferences, setPreferences, resetPreferences };
}
