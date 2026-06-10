export type AuthAttemptState = {
  failedCount: number;
  lockedUntil: number;
  lastFailedAt: number;
};

export type AuthRateLimitStatus = {
  isLocked: boolean;
  remainingMs: number;
  failedCount: number;
};

export type SecurityAuditTone = 'info' | 'success' | 'warning' | 'alert';

export type SecurityAuditEvent = {
  id: string;
  createdAt: string;
  tone: SecurityAuditTone;
  message: string;
  context?: string;
};

const AUTH_SOFT_LOCK_FAILURES = 3;
const AUTH_HARD_LOCK_FAILURES = 5;
const AUTH_SOFT_LOCK_MS = 30_000;
const AUTH_HARD_LOCK_MS = 5 * 60_000;
const AUTH_FAILURE_WINDOW_MS = 10 * 60_000;
const SECURITY_AUDIT_STORAGE_KEY = 'ha.dashboard.security.auditLog.v1';
const SECURITY_AUDIT_MAX_ENTRIES = 80;

export const INITIAL_AUTH_ATTEMPT_STATE: AuthAttemptState = {
  failedCount: 0,
  lockedUntil: 0,
  lastFailedAt: 0,
};

function normalizeAttemptState(state: Partial<AuthAttemptState> | undefined): AuthAttemptState {
  return {
    failedCount: Math.max(0, Math.round(state?.failedCount ?? 0)),
    lockedUntil: Math.max(0, Math.round(state?.lockedUntil ?? 0)),
    lastFailedAt: Math.max(0, Math.round(state?.lastFailedAt ?? 0)),
  };
}

export function getAuthRateLimitStatus(
  state: Partial<AuthAttemptState> | undefined,
  now = Date.now(),
): AuthRateLimitStatus {
  const normalized = normalizeAttemptState(state);
  const remainingMs = Math.max(0, normalized.lockedUntil - now);
  return {
    isLocked: remainingMs > 0,
    remainingMs,
    failedCount: normalized.failedCount,
  };
}

export function recordAuthFailure(
  state: Partial<AuthAttemptState> | undefined,
  now = Date.now(),
): AuthAttemptState {
  const normalized = normalizeAttemptState(state);
  const failureWindowExpired =
    normalized.lastFailedAt > 0 && now - normalized.lastFailedAt > AUTH_FAILURE_WINDOW_MS;
  const failedCount = failureWindowExpired ? 1 : normalized.failedCount + 1;
  const lockDuration =
    failedCount >= AUTH_HARD_LOCK_FAILURES
      ? AUTH_HARD_LOCK_MS
      : failedCount >= AUTH_SOFT_LOCK_FAILURES
        ? AUTH_SOFT_LOCK_MS
        : 0;

  return {
    failedCount,
    lockedUntil: lockDuration > 0 ? now + lockDuration : 0,
    lastFailedAt: now,
  };
}

export function recordAuthSuccess(): AuthAttemptState {
  return INITIAL_AUTH_ATTEMPT_STATE;
}

export function formatAuthRateLimitMessage(status: AuthRateLimitStatus) {
  if (!status.isLocked) {
    return '';
  }
  const totalSeconds = Math.max(1, Math.ceil(status.remainingMs / 1000));
  if (totalSeconds < 60) {
    return `Troppi tentativi non riusciti. Riprova tra ${totalSeconds}s.`;
  }
  const minutes = Math.ceil(totalSeconds / 60);
  return `Troppi tentativi non riusciti. Riprova tra ${minutes} min.`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeAuditEvent(value: unknown): SecurityAuditEvent | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = typeof value.id === 'string' && value.id.trim() ? value.id : '';
  const createdAt = typeof value.createdAt === 'string' && value.createdAt.trim() ? value.createdAt : '';
  const message = typeof value.message === 'string' && value.message.trim() ? value.message.trim() : '';
  const tone =
    value.tone === 'success' || value.tone === 'warning' || value.tone === 'alert' || value.tone === 'info'
      ? value.tone
      : 'info';
  const context = typeof value.context === 'string' && value.context.trim() ? value.context.trim() : undefined;
  if (!id || !createdAt || !message) {
    return null;
  }
  return { id, createdAt, message, tone, context };
}

function readAuditEventsFromStorage(storage: Storage): SecurityAuditEvent[] {
  try {
    const parsed = JSON.parse(storage.getItem(SECURITY_AUDIT_STORAGE_KEY) ?? '[]') as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeAuditEvent).filter((event): event is SecurityAuditEvent => Boolean(event));
  } catch {
    return [];
  }
}

function writeAuditEventsToStorage(storage: Storage, events: SecurityAuditEvent[]) {
  storage.setItem(SECURITY_AUDIT_STORAGE_KEY, JSON.stringify(events.slice(0, SECURITY_AUDIT_MAX_ENTRIES)));
}

function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

export function readSecurityAuditEvents(storage = getBrowserStorage()) {
  if (!storage) {
    return [];
  }
  return readAuditEventsFromStorage(storage);
}

export function appendSecurityAuditEvent(
  event: Omit<SecurityAuditEvent, 'id' | 'createdAt'>,
  storage = getBrowserStorage(),
) {
  if (!storage) {
    return [];
  }
  const nextEvent: SecurityAuditEvent = {
    id: `security-audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    tone: event.tone,
    message: event.message.trim(),
    context: event.context?.trim() || undefined,
  };
  const events = [nextEvent, ...readAuditEventsFromStorage(storage)].slice(0, SECURITY_AUDIT_MAX_ENTRIES);
  writeAuditEventsToStorage(storage, events);
  return events;
}
