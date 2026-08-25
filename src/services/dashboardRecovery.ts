import type { DashboardRuntimeMode } from '../security/dashboardAccess';
import {
  classifyDashboardStorageError,
  type DashboardLayoutSaveErrorCode,
} from './dashboardStorage';
import {
  getDashboardLayoutStorageKey,
  getDashboardRecoveryStorageKey,
} from './dashboardRuntime';

const RECOVERY_SCHEMA = 'ha-dashboard-layout-recovery';
const RECOVERY_VERSION = 1;

type StoredDashboardRecoverySnapshot = {
  schema: typeof RECOVERY_SCHEMA;
  version: typeof RECOVERY_VERSION;
  runtimeMode: DashboardRuntimeMode;
  createdAt: number;
  layout: string;
};

export type DashboardRecoverySnapshot = {
  runtimeMode: DashboardRuntimeMode;
  createdAt: number;
};

export type DashboardRecoveryResult =
  | { ok: true }
  | { ok: false; code: DashboardLayoutSaveErrorCode };

function isValidSerializedLayout(value: string) {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return (
      Boolean(parsed) &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.sections) &&
      Array.isArray(parsed.widgets)
    );
  } catch {
    return false;
  }
}

function parseRecoverySnapshot(
  value: string | null,
  runtimeMode: DashboardRuntimeMode,
): StoredDashboardRecoverySnapshot | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as Partial<StoredDashboardRecoverySnapshot>;
    if (
      parsed.schema !== RECOVERY_SCHEMA ||
      parsed.version !== RECOVERY_VERSION ||
      parsed.runtimeMode !== runtimeMode ||
      typeof parsed.createdAt !== 'number' ||
      !Number.isFinite(parsed.createdAt) ||
      typeof parsed.layout !== 'string' ||
      !isValidSerializedLayout(parsed.layout)
    ) {
      return null;
    }
    return parsed as StoredDashboardRecoverySnapshot;
  } catch {
    return null;
  }
}

export function createDashboardRecoverySnapshot(
  runtimeMode: DashboardRuntimeMode,
  storage: Storage,
): DashboardRecoveryResult {
  try {
    const layout = storage.getItem(getDashboardLayoutStorageKey(runtimeMode));
    if (!layout || !isValidSerializedLayout(layout)) {
      return { ok: false, code: 'serialization_error' };
    }
    const snapshot: StoredDashboardRecoverySnapshot = {
      schema: RECOVERY_SCHEMA,
      version: RECOVERY_VERSION,
      runtimeMode,
      createdAt: Date.now(),
      layout,
    };
    storage.setItem(getDashboardRecoveryStorageKey(runtimeMode), JSON.stringify(snapshot));
    return { ok: true };
  } catch (error) {
    return { ok: false, code: classifyDashboardStorageError(error) };
  }
}

export function readPendingDashboardRecoverySnapshot(
  runtimeMode: DashboardRuntimeMode,
  storage: Storage,
): DashboardRecoverySnapshot | null {
  try {
    const recoveryKey = getDashboardRecoveryStorageKey(runtimeMode);
    const snapshot = parseRecoverySnapshot(storage.getItem(recoveryKey), runtimeMode);
    if (!snapshot) {
      storage.removeItem(recoveryKey);
      return null;
    }

    const currentLayout = storage.getItem(getDashboardLayoutStorageKey(runtimeMode));
    if (currentLayout === snapshot.layout) {
      storage.removeItem(recoveryKey);
      return null;
    }

    return {
      runtimeMode: snapshot.runtimeMode,
      createdAt: snapshot.createdAt,
    };
  } catch {
    return null;
  }
}

export function restoreDashboardRecoverySnapshot(
  runtimeMode: DashboardRuntimeMode,
  storage: Storage,
): DashboardRecoveryResult {
  const recoveryKey = getDashboardRecoveryStorageKey(runtimeMode);
  try {
    const snapshot = parseRecoverySnapshot(storage.getItem(recoveryKey), runtimeMode);
    if (!snapshot) {
      return { ok: false, code: 'serialization_error' };
    }
    storage.setItem(getDashboardLayoutStorageKey(runtimeMode), snapshot.layout);
    storage.removeItem(recoveryKey);
    return { ok: true };
  } catch (error) {
    return { ok: false, code: classifyDashboardStorageError(error) };
  }
}

export function discardDashboardRecoverySnapshot(
  runtimeMode: DashboardRuntimeMode,
  storage: Storage,
): DashboardRecoveryResult {
  try {
    storage.removeItem(getDashboardRecoveryStorageKey(runtimeMode));
    return { ok: true };
  } catch (error) {
    return { ok: false, code: classifyDashboardStorageError(error) };
  }
}
