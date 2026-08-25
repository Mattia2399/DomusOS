import { useMemo, useSyncExternalStore } from 'react';
import type { Widget } from '../types/dashboardModels';

export const LEGACY_WIDGET_SECRETS_STORAGE_KEY = 'ha.dashboard.secrets.widgetCodes.v1';
export const WIDGET_SECRETS_STORAGE_KEY = 'ha.dashboard.secrets.widgetCodes.v2';

const WIDGET_SECRETS_VERSION = 2;
export const WIDGET_SECRET_FIELDS = ['alarmUnlockCode', 'alarmLocalExtraCode', 'lockCode'] as const;

export type WidgetSecretField = (typeof WIDGET_SECRET_FIELDS)[number];
export type WidgetSecretRecord = Partial<Record<WidgetSecretField, string>>;

type PersistedWidgetSecretRecord = WidgetSecretRecord & {
  rememberOnDevice: true;
};

type WidgetSecretsPayload = {
  version: typeof WIDGET_SECRETS_VERSION;
  widgets: Record<string, PersistedWidgetSecretRecord>;
};

const memorySecrets = new Map<string, WidgetSecretRecord>();
const rememberedWidgetIds = new Set<string>();
const listeners = new Set<() => void>();
let storeVersion = 0;
let activeStorage: Storage | null = null;

function hydrateWidgetSecrets(storage: Storage) {
  storage.removeItem(LEGACY_WIDGET_SECRETS_STORAGE_KEY);
  activeStorage = storage;
  memorySecrets.clear();
  rememberedWidgetIds.clear();
  const payload = readPayload(storage);
  Object.entries(payload.widgets).forEach(([widgetId, record]) => {
    const { rememberOnDevice: _rememberOnDevice, ...secrets } = record;
    rememberedWidgetIds.add(widgetId);
    if (hasSecretValue(secrets)) {
      memorySecrets.set(widgetId, secrets);
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSecretRecord(value: unknown): WidgetSecretRecord {
  if (!isRecord(value)) {
    return {};
  }
  const record: WidgetSecretRecord = {};
  WIDGET_SECRET_FIELDS.forEach((field) => {
    const entryValue = value[field];
    if (typeof entryValue === 'string' && entryValue.trim().length > 0) {
      record[field] = entryValue;
    }
  });
  return record;
}

function hasSecretValue(record: WidgetSecretRecord) {
  return WIDGET_SECRET_FIELDS.some((field) => Boolean(record[field]?.trim()));
}

function emitChange() {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
}

function readPayload(storage: Storage): WidgetSecretsPayload {
  try {
    const parsed = JSON.parse(storage.getItem(WIDGET_SECRETS_STORAGE_KEY) ?? '') as unknown;
    if (!isRecord(parsed) || parsed.version !== WIDGET_SECRETS_VERSION || !isRecord(parsed.widgets)) {
      return { version: WIDGET_SECRETS_VERSION, widgets: {} };
    }
    const widgets: Record<string, PersistedWidgetSecretRecord> = {};
    Object.entries(parsed.widgets).forEach(([widgetId, value]) => {
      const secrets = normalizeSecretRecord(value);
      if (!widgetId.trim() || !isRecord(value) || value.rememberOnDevice !== true) {
        return;
      }
      widgets[widgetId] = { ...secrets, rememberOnDevice: true };
    });
    return { version: WIDGET_SECRETS_VERSION, widgets };
  } catch {
    return { version: WIDGET_SECRETS_VERSION, widgets: {} };
  }
}

function writePayload(storage: Storage) {
  const widgets: Record<string, PersistedWidgetSecretRecord> = {};
  rememberedWidgetIds.forEach((widgetId) => {
    const secrets = memorySecrets.get(widgetId) ?? {};
    widgets[widgetId] = { ...secrets, rememberOnDevice: true };
  });
  if (Object.keys(widgets).length === 0) {
    storage.removeItem(WIDGET_SECRETS_STORAGE_KEY);
    return;
  }
  storage.setItem(
    WIDGET_SECRETS_STORAGE_KEY,
    JSON.stringify({ version: WIDGET_SECRETS_VERSION, widgets } satisfies WidgetSecretsPayload),
  );
}

export function initializeWidgetSecrets(storage: Storage) {
  hydrateWidgetSecrets(storage);
  emitChange();
}

function ensureStorage(storage?: Storage) {
  if (storage) {
    activeStorage = storage;
  }
  if (!activeStorage && typeof window !== 'undefined') {
    activeStorage = window.localStorage;
  }
  return activeStorage;
}

export function getWidgetSecrets(widgetId: string): WidgetSecretRecord {
  return { ...(memorySecrets.get(widgetId) ?? {}) };
}

export function isWidgetSecretsRemembered(widgetId: string) {
  return rememberedWidgetIds.has(widgetId);
}

export function setWidgetSecrets(
  widgetId: string,
  patch: WidgetSecretRecord,
  storage?: Storage,
) {
  if (!widgetId.trim()) {
    return;
  }
  const current = memorySecrets.get(widgetId) ?? {};
  const next: WidgetSecretRecord = { ...current };
  WIDGET_SECRET_FIELDS.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(patch, field)) {
      return;
    }
    const value = patch[field];
    if (typeof value === 'string' && value.trim().length > 0) {
      next[field] = value;
    } else {
      delete next[field];
    }
  });
  if (hasSecretValue(next)) {
    memorySecrets.set(widgetId, next);
  } else {
    memorySecrets.delete(widgetId);
  }
  const targetStorage = ensureStorage(storage);
  if (targetStorage && rememberedWidgetIds.has(widgetId)) {
    writePayload(targetStorage);
  }
  emitChange();
}

export function setWidgetSecretsRemembered(
  widgetId: string,
  rememberOnDevice: boolean,
  storage?: Storage,
) {
  if (!widgetId.trim()) {
    return;
  }
  if (rememberOnDevice) {
    rememberedWidgetIds.add(widgetId);
  } else {
    rememberedWidgetIds.delete(widgetId);
  }
  const targetStorage = ensureStorage(storage);
  if (targetStorage) {
    writePayload(targetStorage);
  }
  emitChange();
}

export function forgetWidgetSecrets(widgetId: string, storage?: Storage) {
  memorySecrets.delete(widgetId);
  rememberedWidgetIds.delete(widgetId);
  const targetStorage = ensureStorage(storage);
  if (targetStorage) {
    writePayload(targetStorage);
  }
  emitChange();
}

export function clearAllWidgetSecrets(storage?: Storage) {
  memorySecrets.clear();
  rememberedWidgetIds.clear();
  const targetStorage = ensureStorage(storage);
  targetStorage?.removeItem(WIDGET_SECRETS_STORAGE_KEY);
  targetStorage?.removeItem(LEGACY_WIDGET_SECRETS_STORAGE_KEY);
  emitChange();
}

export function useWidgetSecrets(widgetId: string | undefined) {
  const version = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => storeVersion,
    () => storeVersion,
  );
  return useMemo(
    () => ({
      values: widgetId ? getWidgetSecrets(widgetId) : {},
      rememberOnDevice: widgetId ? isWidgetSecretsRemembered(widgetId) : false,
    }),
    [version, widgetId],
  );
}

export function stripWidgetSecretsFromWidgets(widgets: Widget[]): Widget[] {
  return widgets.map((widget) => {
    const legacyWidget = widget as Widget & WidgetSecretRecord;
    const {
      alarmUnlockCode: _alarmUnlockCode,
      alarmLocalExtraCode: _alarmLocalExtraCode,
      lockCode: _lockCode,
      ...safeWidget
    } = legacyWidget;
    return safeWidget as Widget;
  });
}

// Legacy compatibility: old values are deliberately discarded, never silently persisted.
export function migrateLegacyWidgetSecretsFromWidgets(_widgets: Widget[], storage: Storage) {
  storage.removeItem(LEGACY_WIDGET_SECRETS_STORAGE_KEY);
}

export function mergeWidgetSecretsIntoWidgets(widgets: Widget[], storage: Storage): Widget[] {
  // Layout hydration can happen while React is rendering. Hydrate the external
  // secret store silently here: notifying useSyncExternalStore subscribers from
  // this call would schedule an update in a different component during render.
  hydrateWidgetSecrets(storage);
  return stripWidgetSecretsFromWidgets(widgets);
}

export function persistWidgetSecretsFromWidgets(_widgets: Widget[], storage: Storage) {
  storage.removeItem(LEGACY_WIDGET_SECRETS_STORAGE_KEY);
}
