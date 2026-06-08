const DASHBOARD_STORAGE_PREFIX = 'ha.dashboard.';
const EXCLUDED_SYNC_KEYS = new Set([
  // Device-specific toggle, should not leak across phones/tablets.
  'ha.dashboard.assistant.mic.enabled.v1',
  // Legacy WebAuthn credential id, device-bound.
  'ha.dashboard.security.biometricCredentialId',
]);
const EXCLUDED_SYNC_KEY_PREFIXES = [
  // WebAuthn credential ids are origin/device-bound.
  'ha.dashboard.deviceAuth.credentialId.',
];

export const HA_DASHBOARD_USER_DATA_KEY = 'ha-dashboard-builder';
const DASHBOARD_USER_DATA_SCHEMA = 'ha-dashboard-builder-user-data';
const DASHBOARD_USER_DATA_VERSION = 1;

export type DashboardUserDataPayload = {
  schema: typeof DASHBOARD_USER_DATA_SCHEMA;
  version: typeof DASHBOARD_USER_DATA_VERSION;
  updatedAt: string;
  entries: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isSyncableStorageKey(key: string) {
  return (
    key.startsWith(DASHBOARD_STORAGE_PREFIX) &&
    !EXCLUDED_SYNC_KEYS.has(key) &&
    !EXCLUDED_SYNC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
}

function listSyncableStorageKeys(storage: Storage) {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !isSyncableStorageKey(key)) {
      continue;
    }
    keys.push(key);
  }
  keys.sort((first, second) => first.localeCompare(second, 'it-IT'));
  return keys;
}

function normalizePayloadEntries(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }
  const entries: Record<string, string> = {};
  Object.entries(value).forEach(([key, entryValue]) => {
    if (!isSyncableStorageKey(key) || typeof entryValue !== 'string') {
      return;
    }
    entries[key] = entryValue;
  });
  return entries;
}

function extractPayloadCandidate(payload: unknown) {
  if (payload === null || payload === undefined) {
    return null;
  }
  if (isRecord(payload) && Object.prototype.hasOwnProperty.call(payload, 'value')) {
    return (payload as { value?: unknown }).value ?? null;
  }
  return payload;
}

export function buildDashboardUserDataPayload(storage: Storage): DashboardUserDataPayload {
  const entries: Record<string, string> = {};
  const keys = listSyncableStorageKeys(storage);
  keys.forEach((key) => {
    const value = storage.getItem(key);
    if (value === null) {
      return;
    }
    entries[key] = value;
  });

  return {
    schema: DASHBOARD_USER_DATA_SCHEMA,
    version: DASHBOARD_USER_DATA_VERSION,
    updatedAt: new Date().toISOString(),
    entries,
  };
}

export function getDashboardUserDataEntriesFingerprint(payload: DashboardUserDataPayload) {
  return JSON.stringify(payload.entries);
}

export function parseDashboardUserDataPayload(rawPayload: unknown): DashboardUserDataPayload | null {
  const payloadCandidate = extractPayloadCandidate(rawPayload);
  if (payloadCandidate === null) {
    return null;
  }
  if (!isRecord(payloadCandidate)) {
    return null;
  }

  const schema = payloadCandidate.schema;
  const version = payloadCandidate.version;
  const entries = normalizePayloadEntries(payloadCandidate.entries);
  if (schema !== DASHBOARD_USER_DATA_SCHEMA || version !== DASHBOARD_USER_DATA_VERSION || entries === null) {
    return null;
  }

  const updatedAt =
    typeof payloadCandidate.updatedAt === 'string' && payloadCandidate.updatedAt.trim().length > 0
      ? payloadCandidate.updatedAt
      : new Date(0).toISOString();

  return {
    schema: DASHBOARD_USER_DATA_SCHEMA,
    version: DASHBOARD_USER_DATA_VERSION,
    updatedAt,
    entries,
  };
}

export function applyDashboardUserDataPayload(
  payload: DashboardUserDataPayload,
  storage: Storage,
) {
  const currentKeys = listSyncableStorageKeys(storage);
  const nextKeys = new Set(Object.keys(payload.entries));
  let removedCount = 0;
  let updatedCount = 0;

  currentKeys.forEach((key) => {
    if (!nextKeys.has(key)) {
      storage.removeItem(key);
      removedCount += 1;
    }
  });

  Object.entries(payload.entries).forEach(([key, value]) => {
    if (!isSyncableStorageKey(key)) {
      return;
    }
    if (storage.getItem(key) === value) {
      return;
    }
    storage.setItem(key, value);
    updatedCount += 1;
  });

  return {
    changed: removedCount > 0 || updatedCount > 0,
    removedCount,
    updatedCount,
  };
}
