import type { Widget } from '../types/dashboardModels';
import type { DashboardLayoutConfiguration } from './dashboardConfigurationRepository';

export const DASHBOARD_RUNTIME_WIDGET_FIELDS = [
  'status',
  'isOn',
  'value',
  'unit',
  'vacuumCleanedArea',
  'vacuumCleaningMinutes',
  'coverTiltPosition',
] as const satisfies ReadonlyArray<keyof Widget>;

const runtimeFieldSet = new Set<string>(DASHBOARD_RUNTIME_WIDGET_FIELDS);
const layoutBreakpointPreference = ['xl', '2xl', 'lg', 'md', 'sm', 'xs'] as const;

function canonicalizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeJsonValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalizeJsonValue(entry)]),
  );
}

export function createCanonicalJsonFingerprint(value: unknown): string {
  try {
    return JSON.stringify(canonicalizeJsonValue(value));
  } catch {
    return '';
  }
}

function resolvePersistedLightHeight(
  dashboard: DashboardLayoutConfiguration,
  widget: Widget,
) {
  for (const breakpoint of layoutBreakpointPreference) {
    const override =
      dashboard.widgetLayoutOverrides[widget.id]?.[breakpoint] ??
      dashboard.widgetTypeLayoutOverrides.light?.[breakpoint];
    if (!override) continue;
    const autoExpand = override.autoExpand ?? true;
    const candidate = autoExpand
      ? override.hOff ?? override.h
      : override.h ?? override.hOff ?? override.hOn;
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return Math.max(1, Math.round(candidate));
    }
  }
  return 1;
}

export function stripWidgetRuntimeState(
  widget: Widget,
  preserveMockFixture = true,
): Widget {
  if (preserveMockFixture && widget.dataSource === 'mock') {
    return { ...widget };
  }
  return Object.fromEntries(
    Object.entries(widget).filter(([key]) => !runtimeFieldSet.has(key)),
  ) as Widget;
}

export function hydrateWidgetRuntimeDefaults(widget: Widget): Widget {
  return {
    ...widget,
    status: typeof widget.status === 'string' ? widget.status : 'unavailable',
    isOn: typeof widget.isOn === 'boolean' ? widget.isOn : false,
  };
}

export function projectDashboardForPersistence(
  dashboard: DashboardLayoutConfiguration,
): DashboardLayoutConfiguration {
  return {
    ...dashboard,
    widgets: dashboard.widgets.map((widget) => {
      const projected = stripWidgetRuntimeState(widget, true);
      if (projected.kind !== 'light') return projected;
      return {
        ...projected,
        layout: {
          ...projected.layout,
          h: resolvePersistedLightHeight(dashboard, projected),
        },
      };
    }),
  };
}

/**
 * Structural comparison used by an Edit session. Runtime values never make a
 * draft dirty. Light height is rendered dynamically when auto-expansion is on;
 * its configured sizes live in the breakpoint override collections.
 */
export function createDashboardStructuralFingerprint(
  dashboard: DashboardLayoutConfiguration,
): string {
  return createCanonicalJsonFingerprint({
    ...dashboard,
    widgets: dashboard.widgets.map((widget) => {
      const projected = stripWidgetRuntimeState(widget, false);
      if (projected.kind !== 'light') return projected;
      return {
        ...projected,
        layout: {
          ...projected.layout,
          h: resolvePersistedLightHeight(dashboard, projected),
        },
      };
    }),
  });
}
