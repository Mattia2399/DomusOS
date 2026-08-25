export type DashboardResetStage =
  | 'preparing'
  | 'publishing_reset'
  | 'clearing_history'
  | 'clearing_shared_configuration'
  | 'verifying_server'
  | 'finalizing_reset'
  | 'clearing_device'
  | 'restarting';

export type DashboardResetProgressReporter = (stage: DashboardResetStage) => void;

export const HA_DASHBOARD_RESET_MARKER_KEY = 'premium-home.dashboard-reset.v1';
export const DASHBOARD_RESET_MARKER_SCHEMA = 'domusos-dashboard-reset';
export const DASHBOARD_RESET_MARKER_VERSION = 1;

export type DashboardResetMarker = {
  schema: typeof DASHBOARD_RESET_MARKER_SCHEMA;
  version: typeof DASHBOARD_RESET_MARKER_VERSION;
  resetId: string;
  status: 'pending' | 'complete';
  requestedAt: string;
  completedAt?: string;
  requestedByUserId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 64 && Number.isFinite(Date.parse(value));
}

export function parseDashboardResetMarker(value: unknown): DashboardResetMarker | null {
  if (!isRecord(value)) return null;
  if (
    value.schema !== DASHBOARD_RESET_MARKER_SCHEMA ||
    value.version !== DASHBOARD_RESET_MARKER_VERSION ||
    (value.status !== 'pending' && value.status !== 'complete') ||
    typeof value.resetId !== 'string' ||
    !/^[a-z0-9-]{8,160}$/i.test(value.resetId) ||
    typeof value.requestedByUserId !== 'string' ||
    value.requestedByUserId.trim().length === 0 ||
    value.requestedByUserId.length > 160 ||
    !isIsoTimestamp(value.requestedAt)
  ) {
    return null;
  }
  if (value.status === 'complete' && !isIsoTimestamp(value.completedAt)) return null;
  if (value.completedAt !== undefined && !isIsoTimestamp(value.completedAt)) return null;
  return {
    schema: DASHBOARD_RESET_MARKER_SCHEMA,
    version: DASHBOARD_RESET_MARKER_VERSION,
    resetId: value.resetId,
    status: value.status,
    requestedAt: value.requestedAt,
    ...(typeof value.completedAt === 'string' ? { completedAt: value.completedAt } : {}),
    requestedByUserId: value.requestedByUserId.trim(),
  };
}

export function createDashboardResetMarker(
  requestedByUserId: string,
  resetId = `reset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
): DashboardResetMarker {
  return {
    schema: DASHBOARD_RESET_MARKER_SCHEMA,
    version: DASHBOARD_RESET_MARKER_VERSION,
    resetId,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    requestedByUserId: requestedByUserId.trim(),
  };
}

export function completeDashboardResetMarker(marker: DashboardResetMarker): DashboardResetMarker {
  return {
    ...marker,
    status: 'complete',
    completedAt: new Date().toISOString(),
  };
}
