const BACKUP_SCHEMA = 'ha-dashboard-builder-backup';
const BACKUP_VERSION = 1;
const HA_LIVE_STORAGE_KEY = 'ha-external-dashboard:ha-live:v1';
const HA_OAUTH_TOKENS_STORAGE_KEY = 'hass_auth_tokens';

const MANAGED_STORAGE_PREFIXES = ['ha.dashboard.'];
const MANAGED_STORAGE_KEYS = [HA_LIVE_STORAGE_KEY, HA_OAUTH_TOKENS_STORAGE_KEY];

export type DashboardBackupPayload = {
  schema: typeof BACKUP_SCHEMA;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  entries: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeBackupEntries(rawEntries: unknown) {
  if (!isRecord(rawEntries)) {
    return null;
  }

  const entries: Record<string, string> = {};
  Object.entries(rawEntries).forEach(([key, value]) => {
    if (!isManagedStorageKey(key)) {
      return;
    }
    if (typeof value === 'string') {
      entries[key] = sanitizeSensitiveStorageValue(key, value);
      return;
    }
    if (value === undefined) {
      return;
    }
    try {
      entries[key] = sanitizeSensitiveStorageValue(key, JSON.stringify(value));
    } catch {
      // ignore invalid legacy entry values
    }
  });

  return entries;
}

function sanitizeSensitiveStorageValue(key: string, value: string) {
  if (key === HA_OAUTH_TOKENS_STORAGE_KEY) {
    return JSON.stringify({
      hassUrl: '',
      clientId: '',
      expires: 0,
      refresh_token: '',
      access_token: '',
      expires_in: 0,
    });
  }

  if (key !== HA_LIVE_STORAGE_KEY) {
    return value;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {
      ...parsed,
      token: '',
      rememberToken: false,
    };
    if (Object.prototype.hasOwnProperty.call(sanitized, 'refreshToken')) {
      sanitized.refreshToken = '';
    }
    if (Object.prototype.hasOwnProperty.call(sanitized, 'accessToken')) {
      sanitized.accessToken = '';
    }
    return JSON.stringify(sanitized);
  } catch {
    return JSON.stringify({
      url: '',
      token: '',
      rememberToken: false,
    });
  }
}

export function isManagedStorageKey(key: string) {
  if (MANAGED_STORAGE_KEYS.includes(key)) {
    return true;
  }
  return MANAGED_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function listManagedStorageKeys(storage: Storage) {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !isManagedStorageKey(key)) {
      continue;
    }
    keys.push(key);
  }
  keys.sort((a, b) => a.localeCompare(b));
  return keys;
}

export function createDashboardBackupPayload(storage: Storage): DashboardBackupPayload {
  const keys = listManagedStorageKeys(storage);
  const entries: Record<string, string> = {};

  keys.forEach((key) => {
    const value = storage.getItem(key);
    if (value !== null) {
      entries[key] = sanitizeSensitiveStorageValue(key, value);
    }
  });

  return {
    schema: BACKUP_SCHEMA,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    entries,
  };
}

export function serializeDashboardBackup(payload: DashboardBackupPayload) {
  return JSON.stringify(payload, null, 2);
}

export function parseDashboardBackup(raw: string): DashboardBackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Il file selezionato non contiene JSON valido.');
  }

  if (!isRecord(parsed)) {
    throw new Error('Formato backup non valido.');
  }

  const schema = parsed.schema;
  const version = parsed.version;
  const exportedAt = parsed.exportedAt;
  const strictEntries = normalizeBackupEntries(parsed.entries);
  if (schema === BACKUP_SCHEMA && version === BACKUP_VERSION) {
    if (typeof exportedAt !== 'string' || exportedAt.trim().length === 0) {
      throw new Error('Il backup non contiene la data di esportazione.');
    }
    if (!strictEntries || Object.keys(strictEntries).length === 0) {
      throw new Error('Il backup non contiene configurazioni dashboard ripristinabili.');
    }
    return {
      schema: BACKUP_SCHEMA,
      version: BACKUP_VERSION,
      exportedAt,
      entries: strictEntries,
    };
  }

  const legacyEntries = strictEntries ?? normalizeBackupEntries(parsed);
  if (legacyEntries && Object.keys(legacyEntries).length > 0) {
    return {
      schema: BACKUP_SCHEMA,
      version: BACKUP_VERSION,
      exportedAt:
        typeof exportedAt === 'string' && exportedAt.trim().length > 0
          ? exportedAt
          : new Date().toISOString(),
      entries: legacyEntries,
    };
  }

  if (schema !== BACKUP_SCHEMA) {
    throw new Error('Formato backup non riconosciuto.');
  }
  if (version !== BACKUP_VERSION) {
    throw new Error(`Versione backup non supportata: ${String(version)}.`);
  }
  throw new Error('Il backup non contiene configurazioni dashboard ripristinabili.');
}

export function clearManagedDashboardStorage(storage: Storage) {
  const keys = listManagedStorageKeys(storage);
  keys.forEach((key) => storage.removeItem(key));
  return keys.length;
}

export function restoreDashboardBackup(payload: DashboardBackupPayload, storage: Storage) {
  const managedEntries = Object.entries(payload.entries).filter(
    ([key, value]) => isManagedStorageKey(key) && typeof value === 'string',
  );
  if (!managedEntries.length) {
    return 0;
  }

  clearManagedDashboardStorage(storage);
  let restoredCount = 0;
  managedEntries.forEach(([key, value]) => {
    storage.setItem(key, value);
    restoredCount += 1;
  });

  return restoredCount;
}
