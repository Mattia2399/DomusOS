import type { HaConnectionStatus } from './haConnectionState';
import type {
  HaDeviceRegistryEntry,
  HaEntityRegistryEntry,
} from './haRegistryPresentation';
import type { DashboardRuntimeMode } from '../security/dashboardAccess';
import type { DashboardSection, Widget } from '../types/dashboardModels';
import type { MockEntityStateMap } from '../types/ha';
import type { DeviceHealthSnapshot } from '../components/settings/deviceHealthModel';
import { summarizeDeviceHealth } from '../components/settings/deviceHealthModel';

const SUPPORT_DIAGNOSTICS_SCHEMA = 'home-premium-support-diagnostics';
const SUPPORT_DIAGNOSTICS_VERSION = 1;

type SupportRole = 'owner' | 'admin' | 'limited' | 'demo' | 'unverified';

export type SupportDiagnosticsReport = {
  schema: typeof SUPPORT_DIAGNOSTICS_SCHEMA;
  version: typeof SUPPORT_DIAGNOSTICS_VERSION;
  generatedAt: string;
  app: {
    version: string;
    runtimeMode: DashboardRuntimeMode;
    embedded: boolean;
    viewport: {
      width: number | null;
      height: number | null;
      pixelRatio: number | null;
    };
  };
  connection: {
    status: HaConnectionStatus;
    errorPresent: boolean;
    identityRole: SupportRole;
  };
  inventory: {
    liveEntities: number;
    unavailableEntities: number;
    entityRegistryEntries: number;
    devices: number;
    areas: number;
    sections: number;
    widgets: number;
    entityDomains: Record<string, number>;
    widgetKinds: Record<string, number>;
  };
  deviceHealth: ReturnType<typeof summarizeDeviceHealth>;
};

function normalizeState(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function countByKey(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    const key = value.trim().toLowerCase() || 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function resolveIdentityRole({
  runtimeMode,
  identityAuthenticated,
  isOwner,
  isAdmin,
}: {
  runtimeMode: DashboardRuntimeMode;
  identityAuthenticated: boolean;
  isOwner?: boolean;
  isAdmin?: boolean;
}): SupportRole {
  if (runtimeMode === 'demo') return 'demo';
  if (!identityAuthenticated) return 'unverified';
  if (isOwner) return 'owner';
  if (isAdmin) return 'admin';
  return 'limited';
}

export function buildSupportDiagnostics({
  appVersion,
  runtimeMode,
  haStatus,
  connectionErrorPresent,
  identityAuthenticated,
  isOwner,
  isAdmin,
  embedded,
  viewport,
  states,
  entityRegistry,
  deviceRegistry,
  areaCount,
  sections,
  widgets,
  deviceHealth,
  generatedAt = new Date(),
}: {
  appVersion: string;
  runtimeMode: DashboardRuntimeMode;
  haStatus: HaConnectionStatus;
  connectionErrorPresent: boolean;
  identityAuthenticated: boolean;
  isOwner?: boolean;
  isAdmin?: boolean;
  embedded: boolean;
  viewport?: { width?: number; height?: number; pixelRatio?: number };
  states: MockEntityStateMap;
  entityRegistry: HaEntityRegistryEntry[];
  deviceRegistry: HaDeviceRegistryEntry[];
  areaCount: number;
  sections: DashboardSection[];
  widgets: Widget[];
  deviceHealth: DeviceHealthSnapshot[];
  generatedAt?: Date;
}): SupportDiagnosticsReport {
  const stateEntries = Object.entries(states);
  const entityDomains = countByKey(
    stateEntries.map(([entityId]) => entityId.split('.', 1)[0] || 'unknown'),
  );
  const widgetKinds = countByKey(widgets.map((widget) => widget.kind));
  const unavailableEntities = stateEntries.filter(([, entity]) => {
    const state = normalizeState(entity.state);
    return !state || state === 'unknown' || state === 'unavailable';
  }).length;

  return {
    schema: SUPPORT_DIAGNOSTICS_SCHEMA,
    version: SUPPORT_DIAGNOSTICS_VERSION,
    generatedAt: generatedAt.toISOString(),
    app: {
      version: appVersion,
      runtimeMode,
      embedded,
      viewport: {
        width: Number.isFinite(viewport?.width) ? Math.round(viewport!.width!) : null,
        height: Number.isFinite(viewport?.height) ? Math.round(viewport!.height!) : null,
        pixelRatio: Number.isFinite(viewport?.pixelRatio)
          ? Math.round(viewport!.pixelRatio! * 100) / 100
          : null,
      },
    },
    connection: {
      status: haStatus,
      errorPresent: connectionErrorPresent,
      identityRole: resolveIdentityRole({
        runtimeMode,
        identityAuthenticated,
        isOwner,
        isAdmin,
      }),
    },
    inventory: {
      liveEntities: stateEntries.length,
      unavailableEntities,
      entityRegistryEntries: entityRegistry.length,
      devices: deviceRegistry.length,
      areas: areaCount,
      sections: sections.length,
      widgets: widgets.length,
      entityDomains,
      widgetKinds,
    },
    deviceHealth: summarizeDeviceHealth(deviceHealth),
  };
}

export function serializeSupportDiagnostics(report: SupportDiagnosticsReport) {
  return JSON.stringify(report, null, 2);
}

export function createSupportDiagnosticsFilename(generatedAt: string) {
  const safeTimestamp = generatedAt.replace(/[:.]/g, '-');
  return `home-premium-diagnostics-${safeTimestamp}.json`;
}
