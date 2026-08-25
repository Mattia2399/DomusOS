import {
  HA_SHARED_HOUSE_CONFIGURATION_KEY,
  parseSharedHouseConfiguration,
  type DashboardConfigurationLoadResult,
  type DashboardConfigurationRepository,
  type DashboardConfigurationSaveResult,
  type SharedHouseConfiguration,
} from './dashboardConfigurationRepository';
import { stripWidgetSecretsFromWidgets } from './widgetSecrets';
import {
  createCanonicalJsonFingerprint,
  createDashboardStructuralFingerprint,
  projectDashboardForPersistence,
} from './dashboardPersistenceProjection';
import {
  HA_DASHBOARD_REVISION_HISTORY_KEY,
  archiveDashboardRevision,
  parseDashboardRevisionHistory,
  type DashboardRevisionArchiveResult,
  type DashboardRevisionHistoryLoadResult,
} from './dashboardRevisionHistory';

export type DashboardHaApiCaller = (
  message: Record<string, unknown>,
  options?: { reportError?: boolean; throwOnError?: boolean },
) => Promise<unknown | null | undefined>;

export type HaDashboardConfigurationRepositoryOptions = {
  callApi: DashboardHaApiCaller;
  isConnected: () => boolean;
  canManageSharedConfiguration: () => boolean;
};

export type HaDashboardStorageCapability =
  | 'available_read_write'
  | 'available_read_only'
  | 'offline'
  | 'unsupported'
  | 'error';

type HaStoredValueResponse = { value: unknown };
type PersistenceLogLevel = 'info' | 'warn' | 'error';

function logPersistence(
  level: PersistenceLogLevel,
  event: string,
  details: Record<string, unknown> = {},
) {
  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  logger(`[DomusOS:persistence] ${event}`, details);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasStoredValue(value: unknown): value is HaStoredValueResponse {
  return isRecord(value) && Object.prototype.hasOwnProperty.call(value, 'value');
}

function failureMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (isRecord(error)) {
    for (const key of ['message', 'error', 'code']) {
      const value = error[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
  }
  return '';
}

function waitForVerification(delayMs: number) {
  if (delayMs <= 0) return Promise.resolve();
  return new Promise<void>((resolve) => globalThis.setTimeout(resolve, delayMs));
}

function classifyFailure(error: unknown, connected: boolean): Exclude<
  DashboardConfigurationLoadResult['status'],
  'found' | 'empty'
> {
  if (!connected) return 'offline';
  const message = failureMessage(error).toLowerCase();
  if (/unauthor|forbidden|permission|\b401\b|\b403\b/.test(message)) return 'unauthorized';
  if (/unknown command|not found|unsupported|not supported|non ammesso|not allowed/.test(message)) return 'unsupported';
  return 'error';
}

function sanitizeForTransport(document: SharedHouseConfiguration): SharedHouseConfiguration {
  const projectedDashboard = projectDashboardForPersistence(document.dashboard);
  return {
    ...document,
    dashboard: {
      ...projectedDashboard,
      widgets: stripWidgetSecretsFromWidgets(projectedDashboard.widgets),
    },
  };
}

function isConfirmedDocument(
  actual: SharedHouseConfiguration,
  expected: SharedHouseConfiguration,
) {
  // originClientId is an ephemeral delivery hint. Older panel bridges and HA
  // transports may omit it, so it must not turn an otherwise identical,
  // authoritative server document into a false write conflict.
  const actualPublication = actual.publication
    ? { source: actual.publication.source, restoredFromRevision: actual.publication.restoredFromRevision }
    : null;
  const expectedPublication = expected.publication
    ? { source: expected.publication.source, restoredFromRevision: expected.publication.restoredFromRevision }
    : null;
  return actual.revision === expected.revision &&
    actual.updatedAt === expected.updatedAt &&
    actual.updatedByUserId === expected.updatedByUserId &&
    createDashboardStructuralFingerprint(actual.dashboard) ===
      createDashboardStructuralFingerprint(expected.dashboard) &&
    createCanonicalJsonFingerprint(actual.security) === createCanonicalJsonFingerprint(expected.security) &&
    createCanonicalJsonFingerprint(actual.rooms) === createCanonicalJsonFingerprint(expected.rooms) &&
    createCanonicalJsonFingerprint(actualPublication) === createCanonicalJsonFingerprint(expectedPublication);
}

function confirmationMismatchReasons(
  actual: SharedHouseConfiguration,
  expected: SharedHouseConfiguration,
) {
  const reasons: string[] = [];
  if (actual.revision !== expected.revision) reasons.push('revision');
  if (actual.updatedAt !== expected.updatedAt) reasons.push('updatedAt');
  if (actual.updatedByUserId !== expected.updatedByUserId) reasons.push('updatedByUserId');
  if (createDashboardStructuralFingerprint(actual.dashboard) !== createDashboardStructuralFingerprint(expected.dashboard)) {
    reasons.push('dashboard');
  }
  if (createCanonicalJsonFingerprint(actual.security) !== createCanonicalJsonFingerprint(expected.security)) reasons.push('security');
  if (createCanonicalJsonFingerprint(actual.rooms) !== createCanonicalJsonFingerprint(expected.rooms)) reasons.push('rooms');
  const actualPublication = actual.publication
    ? { source: actual.publication.source, restoredFromRevision: actual.publication.restoredFromRevision }
    : null;
  const expectedPublication = expected.publication
    ? { source: expected.publication.source, restoredFromRevision: expected.publication.restoredFromRevision }
    : null;
  if (createCanonicalJsonFingerprint(actualPublication) !== createCanonicalJsonFingerprint(expectedPublication)) {
    reasons.push('publication');
  }
  return reasons;
}

export class HaDashboardConfigurationRepository implements DashboardConfigurationRepository {
  readonly kind = 'home_assistant' as const;

  constructor(private readonly options: HaDashboardConfigurationRepositoryOptions) {}

  private async readRaw(): Promise<DashboardConfigurationLoadResult> {
    if (!this.options.isConnected()) {
      logPersistence('warn', 'read:skipped', { reason: 'offline' });
      return { status: 'offline' };
    }
    try {
      const response = await this.options.callApi(
        {
          type: 'frontend/get_system_data',
          key: HA_SHARED_HOUSE_CONFIGURATION_KEY,
        },
        { reportError: false, throwOnError: true },
      );
      if (response === null || response === undefined) {
        logPersistence('warn', 'read:empty-transport-response', {
          responseType: response === null ? 'null' : 'undefined',
        });
        return this.options.isConnected() ? { status: 'unsupported' } : { status: 'offline' };
      }
      if (!hasStoredValue(response)) {
        logPersistence('error', 'read:invalid-response', {
          responseType: Array.isArray(response) ? 'array' : typeof response,
        });
        return { status: 'error', reason: 'invalid_response' };
      }
      if (response.value === null || response.value === undefined) {
        logPersistence('info', 'read:empty-store');
        return { status: 'empty' };
      }
      const document = parseSharedHouseConfiguration(response.value);
      logPersistence(document ? 'info' : 'error', document ? 'read:found' : 'read:invalid-document', {
        revision: document?.revision ?? null,
        storageVersion: document?.dashboard.storageVersion ?? null,
      });
      return document
        ? { status: 'found', document }
        : { status: 'error', reason: 'invalid_document' };
    } catch (error) {
      const status = classifyFailure(error, this.options.isConnected());
      logPersistence(status === 'error' ? 'error' : 'warn', 'read:failed', {
        status,
        reason: failureMessage(error) || 'unknown',
      });
      return status === 'error'
        ? { status, reason: failureMessage(error) || undefined }
        : { status };
    }
  }

  loadSharedHouseConfiguration(): Promise<DashboardConfigurationLoadResult> {
    return this.readRaw();
  }

  async loadDashboardRevisionHistory(): Promise<DashboardRevisionHistoryLoadResult> {
    if (!this.options.isConnected()) return { status: 'offline' };
    try {
      const response = await this.options.callApi(
        {
          type: 'frontend/get_system_data',
          key: HA_DASHBOARD_REVISION_HISTORY_KEY,
        },
        { reportError: false, throwOnError: true },
      );
      if (response === null || response === undefined) {
        return this.options.isConnected() ? { status: 'unsupported' } : { status: 'offline' };
      }
      if (!hasStoredValue(response)) return { status: 'error', reason: 'invalid_response' };
      if (response.value === null || response.value === undefined) return { status: 'empty' };
      const document = parseDashboardRevisionHistory(response.value);
      return document
        ? { status: 'found', document }
        : { status: 'error', reason: 'invalid_document' };
    } catch (error) {
      const status = classifyFailure(error, this.options.isConnected());
      return status === 'error'
        ? { status, reason: failureMessage(error) || undefined }
        : { status };
    }
  }

  async archiveDashboardRevision(
    document: SharedHouseConfiguration,
  ): Promise<DashboardRevisionArchiveResult> {
    if (!this.options.isConnected()) return { status: 'offline' };
    if (!this.options.canManageSharedConfiguration()) return { status: 'unauthorized' };

    const current = await this.loadDashboardRevisionHistory();
    if (
      current.status !== 'found' &&
      current.status !== 'empty'
    ) {
      return current;
    }
    const nextHistory = archiveDashboardRevision(
      current.status === 'found' ? current.document : null,
      sanitizeForTransport(document),
    );
    try {
      await this.options.callApi(
        {
          type: 'frontend/set_system_data',
          key: HA_DASHBOARD_REVISION_HISTORY_KEY,
          value: nextHistory,
        },
        { reportError: false, throwOnError: true },
      );
    } catch (error) {
      const status = classifyFailure(error, this.options.isConnected());
      return status === 'error'
        ? { status, reason: failureMessage(error) || undefined }
        : { status };
    }

    for (const delayMs of [0, 150, 400]) {
      await waitForVerification(delayMs);
      const verified = await this.loadDashboardRevisionHistory();
      if (
        verified.status === 'found' &&
        verified.document.entries.some((entry) => entry.revision === document.revision)
      ) {
        return { status: 'archived', document: verified.document };
      }
      if (
        verified.status === 'unauthorized' ||
        verified.status === 'offline' ||
        verified.status === 'unsupported'
      ) {
        return verified;
      }
    }
    return { status: 'error', reason: 'history_write_not_confirmed' };
  }

  async probeSharedHouseConfiguration(): Promise<HaDashboardStorageCapability> {
    const result = await this.readRaw();
    if (result.status === 'found' || result.status === 'empty') {
      return this.options.canManageSharedConfiguration()
        ? 'available_read_write'
        : 'available_read_only';
    }
    if (result.status === 'offline') return 'offline';
    if (result.status === 'unsupported') return 'unsupported';
    return 'error';
  }

  async saveSharedHouseConfiguration(
    document: SharedHouseConfiguration,
    expectedRevision: number | null,
  ): Promise<DashboardConfigurationSaveResult> {
    const operationId = `save-${Date.now().toString(36)}`;
    logPersistence('info', 'save:start', {
      operationId,
      expectedRevision,
      nextRevision: document.revision,
      sections: document.dashboard.sections.length,
      widgets: document.dashboard.widgets.length,
    });
    if (!this.options.isConnected()) {
      logPersistence('warn', 'save:blocked', { operationId, reason: 'offline' });
      return { status: 'offline' };
    }
    if (!this.options.canManageSharedConfiguration()) {
      logPersistence('warn', 'save:blocked', { operationId, reason: 'unauthorized' });
      return { status: 'unauthorized' };
    }

    const safeDocument = sanitizeForTransport(document);
    if (!parseSharedHouseConfiguration(safeDocument)) {
      logPersistence('error', 'save:invalid-document', { operationId });
      return { status: 'error', reason: 'invalid_document' };
    }
    const expectedNextRevision = expectedRevision === null ? 1 : expectedRevision + 1;
    if (safeDocument.revision !== expectedNextRevision) {
      logPersistence('error', 'save:invalid-revision', {
        operationId,
        expectedNextRevision,
        receivedRevision: safeDocument.revision,
      });
      return { status: 'error', reason: 'invalid_revision' };
    }

    const currentResult = await this.readRaw();
    logPersistence('info', 'save:preflight', {
      operationId,
      status: currentResult.status,
      currentRevision: currentResult.status === 'found' ? currentResult.document.revision : null,
    });
    if (currentResult.status === 'found') {
      if (expectedRevision === null || currentResult.document.revision !== expectedRevision) {
        return { status: 'conflict', current: currentResult.document };
      }
    } else if (currentResult.status === 'empty') {
      if (expectedRevision !== null) return { status: 'conflict', current: null };
    } else {
      return currentResult;
    }

    try {
      const response = await this.options.callApi(
        {
          type: 'frontend/set_system_data',
          key: HA_SHARED_HOUSE_CONFIGURATION_KEY,
          value: safeDocument,
        },
        { reportError: false, throwOnError: true },
      );
      logPersistence('info', 'save:transport-accepted', {
        operationId,
        responseType: response === null ? 'null' : response === undefined ? 'undefined' : typeof response,
      });
      // HA sends a successful result without a payload. Depending on the
      // transport this is exposed as null or undefined; errors are exceptions.
    } catch (error) {
      const status = classifyFailure(error, this.options.isConnected());
      logPersistence(status === 'error' ? 'error' : 'warn', 'save:transport-failed', {
        operationId,
        status,
        reason: failureMessage(error) || 'unknown',
      });
      return status === 'error'
        ? { status, reason: failureMessage(error) || undefined }
        : { status };
    }

    let lastVerification: DashboardConfigurationLoadResult = { status: 'empty' };
    for (const [attemptIndex, delayMs] of [0, 150, 400, 900].entries()) {
      await waitForVerification(delayMs);
      const verified = await this.readRaw();
      lastVerification = verified;
      logPersistence('info', 'save:verify', {
        operationId,
        attempt: attemptIndex + 1,
        delayMs,
        status: verified.status,
        revision: verified.status === 'found' ? verified.document.revision : null,
      });
      if (
        verified.status === 'found' &&
        isConfirmedDocument(verified.document, safeDocument)
      ) {
        logPersistence('info', 'save:confirmed', {
          operationId,
          revision: verified.document.revision,
          attempts: attemptIndex + 1,
        });
        return { status: 'saved', document: verified.document };
      }
      if (verified.status === 'found') {
        logPersistence('warn', 'save:conflict', {
          operationId,
          expectedRevision: safeDocument.revision,
          currentRevision: verified.document.revision,
          mismatches: confirmationMismatchReasons(verified.document, safeDocument),
        });
        return { status: 'conflict', current: verified.document };
      }
      if (
        verified.status === 'unauthorized' ||
        verified.status === 'offline' ||
        verified.status === 'unsupported'
      ) {
        return verified;
      }
    }
    if (lastVerification.status === 'found') {
      return { status: 'conflict', current: lastVerification.document };
    }
    if (lastVerification.status === 'empty') {
      logPersistence('error', 'save:not-confirmed', { operationId, reason: 'empty_after_retries' });
      return { status: 'error', reason: 'write_not_confirmed' };
    }
    logPersistence('error', 'save:not-confirmed', {
      operationId,
      reason: lastVerification.status === 'error' ? lastVerification.reason ?? 'unknown' : lastVerification.status,
    });
    return lastVerification;
  }
}

export function createHaDashboardConfigurationRepository(
  options: HaDashboardConfigurationRepositoryOptions,
) {
  return new HaDashboardConfigurationRepository(options);
}
