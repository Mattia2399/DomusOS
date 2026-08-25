import type { DashboardGridBreakpoint } from '../types/widgetTypeLayout';
import {
  parseDashboardLayout,
  type DashboardLayoutConfiguration,
  type DashboardRevisionSource,
  type SharedHouseConfiguration,
} from './dashboardConfigurationRepository';
import { projectDashboardForPersistence } from './dashboardPersistenceProjection';
import { stripWidgetSecretsFromWidgets } from './widgetSecrets';

export const DASHBOARD_REVISION_HISTORY_SCHEMA = 'premium-home-dashboard-revision-history';
export const DASHBOARD_REVISION_HISTORY_VERSION = 1;
export const HA_DASHBOARD_REVISION_HISTORY_KEY = 'premium-home.dashboard-revisions.v1';

/** The current revision plus these four snapshots produce five visible versions. */
export const DASHBOARD_ARCHIVED_REVISION_LIMIT = 4;

export type DashboardRevisionRecord = {
  revision: number;
  createdAt: string;
  createdByUserId: string;
  source: DashboardRevisionSource;
  restoredFromRevision?: number;
  dashboard: DashboardLayoutConfiguration;
};

export type DashboardRevisionHistoryDocument = {
  schema: typeof DASHBOARD_REVISION_HISTORY_SCHEMA;
  version: typeof DASHBOARD_REVISION_HISTORY_VERSION;
  updatedAt: string;
  entries: DashboardRevisionRecord[];
};

export type DashboardRevisionHistoryLoadResult =
  | { status: 'found'; document: DashboardRevisionHistoryDocument }
  | { status: 'empty' }
  | { status: 'unauthorized' }
  | { status: 'offline' }
  | { status: 'unsupported' }
  | { status: 'error'; reason?: string };

export type DashboardRevisionHistoryStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'offline'
  | 'unsupported'
  | 'error';

export type DashboardRevisionArchiveResult =
  | { status: 'archived'; document: DashboardRevisionHistoryDocument }
  | { status: 'unauthorized' }
  | { status: 'offline' }
  | { status: 'unsupported' }
  | { status: 'error'; reason?: string };

export type DashboardRevisionSummary = {
  addedWidgets: number;
  removedWidgets: number;
  changedWidgets: number;
  movedWidgets: number;
  changedSections: number;
  changedBreakpoints: DashboardGridBreakpoint[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stableJson(value: unknown) {
  return JSON.stringify(value);
}

function widgetConfigurationJson(widget: DashboardLayoutConfiguration['widgets'][number]) {
  const { layout: _layout, ...configuration } = widget;
  return stableJson(configuration);
}

function sanitizeDashboard(dashboard: DashboardLayoutConfiguration): DashboardLayoutConfiguration {
  const projected = projectDashboardForPersistence(dashboard);
  return {
    ...projected,
    widgets: stripWidgetSecretsFromWidgets(projected.widgets),
  };
}

function parseSource(value: unknown): DashboardRevisionSource {
  return value === 'rollback' || value === 'migration' ? value : 'edit';
}

export function createDashboardRevisionRecord(
  document: SharedHouseConfiguration,
): DashboardRevisionRecord {
  const restoredFromRevision = document.publication?.restoredFromRevision;
  return {
    revision: document.revision,
    createdAt: document.updatedAt,
    createdByUserId: document.updatedByUserId,
    source: document.publication?.source ?? (document.revision === 1 ? 'migration' : 'edit'),
    ...(Number.isSafeInteger(restoredFromRevision) && Number(restoredFromRevision) > 0
      ? { restoredFromRevision: Number(restoredFromRevision) }
      : {}),
    dashboard: sanitizeDashboard(document.dashboard),
  };
}

export function parseDashboardRevisionRecord(value: unknown): DashboardRevisionRecord | null {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.revision) ||
    Number(value.revision) < 1 ||
    typeof value.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    typeof value.createdByUserId !== 'string'
  ) {
    return null;
  }
  const dashboard = parseDashboardLayout(value.dashboard);
  if (!dashboard) return null;
  const restoredFromRevision = Number(value.restoredFromRevision);
  return {
    revision: Number(value.revision),
    createdAt: value.createdAt,
    createdByUserId: value.createdByUserId.trim(),
    source: parseSource(value.source),
    ...(Number.isSafeInteger(restoredFromRevision) && restoredFromRevision > 0
      ? { restoredFromRevision }
      : {}),
    dashboard: sanitizeDashboard(dashboard),
  };
}

export function parseDashboardRevisionHistory(
  value: unknown,
): DashboardRevisionHistoryDocument | null {
  if (
    !isRecord(value) ||
    value.schema !== DASHBOARD_REVISION_HISTORY_SCHEMA ||
    value.version !== DASHBOARD_REVISION_HISTORY_VERSION ||
    typeof value.updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.updatedAt)) ||
    !Array.isArray(value.entries)
  ) {
    return null;
  }
  if (value.entries.length > DASHBOARD_ARCHIVED_REVISION_LIMIT) return null;
  const parsedEntries = value.entries.map(parseDashboardRevisionRecord);
  if (parsedEntries.some((entry) => entry === null)) return null;
  const entries = (parsedEntries as DashboardRevisionRecord[])
    .sort((first, second) => second.revision - first.revision);
  if (new Set(entries.map((entry) => entry.revision)).size !== entries.length) return null;
  return {
    schema: DASHBOARD_REVISION_HISTORY_SCHEMA,
    version: DASHBOARD_REVISION_HISTORY_VERSION,
    updatedAt: value.updatedAt,
    entries,
  };
}

export function archiveDashboardRevision(
  current: DashboardRevisionHistoryDocument | null,
  document: SharedHouseConfiguration,
  updatedAt = new Date().toISOString(),
): DashboardRevisionHistoryDocument {
  const record = createDashboardRevisionRecord(document);
  const entries = [record, ...(current?.entries ?? [])]
    .sort((first, second) => second.revision - first.revision)
    .filter((entry, index, collection) => (
      collection.findIndex((candidate) => candidate.revision === entry.revision) === index
    ))
    .slice(0, DASHBOARD_ARCHIVED_REVISION_LIMIT);
  return {
    schema: DASHBOARD_REVISION_HISTORY_SCHEMA,
    version: DASHBOARD_REVISION_HISTORY_VERSION,
    updatedAt,
    entries,
  };
}

function countChangedWidgetPositions(
  older: DashboardLayoutConfiguration,
  newer: DashboardLayoutConfiguration,
) {
  const changedIds = new Set<string>();
  const olderWidgets = new Map(older.widgets.map((widget) => [widget.id, widget]));
  const newerWidgets = new Map(newer.widgets.map((widget) => [widget.id, widget]));
  for (const [id, widget] of newerWidgets) {
    const previous = olderWidgets.get(id);
    if (previous && stableJson(previous.layout) !== stableJson(widget.layout)) changedIds.add(id);
  }
  const breakpoints: DashboardGridBreakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  for (const breakpoint of breakpoints) {
    const olderRoot = new Map((older.responsiveLayouts.root?.[breakpoint] ?? []).map((item) => [item.i, item]));
    const newerRoot = new Map((newer.responsiveLayouts.root?.[breakpoint] ?? []).map((item) => [item.i, item]));
    const stackIds = new Set([
      ...Object.keys(older.responsiveLayouts.stacks ?? {}),
      ...Object.keys(newer.responsiveLayouts.stacks ?? {}),
    ]);
    const compareLayouts = (olderItems: Map<string, unknown>, newerItems: Map<string, unknown>) => {
      for (const id of new Set([...olderItems.keys(), ...newerItems.keys()])) {
        const before = olderItems.get(id);
        const after = newerItems.get(id);
        if (before && after && stableJson(before) !== stableJson(after)) changedIds.add(id);
      }
    };
    compareLayouts(olderRoot, newerRoot);
    for (const stackId of stackIds) {
      compareLayouts(
        new Map((older.responsiveLayouts.stacks?.[stackId]?.[breakpoint] ?? []).map((item) => [item.i, item])),
        new Map((newer.responsiveLayouts.stacks?.[stackId]?.[breakpoint] ?? []).map((item) => [item.i, item])),
      );
    }
  }
  return changedIds.size;
}

export function summarizeDashboardRevision(
  olderDashboard: DashboardLayoutConfiguration,
  newerDashboard: DashboardLayoutConfiguration,
): DashboardRevisionSummary {
  const older = sanitizeDashboard(olderDashboard);
  const newer = sanitizeDashboard(newerDashboard);
  const olderWidgets = new Map(older.widgets.map((widget) => [widget.id, widget]));
  const newerWidgets = new Map(newer.widgets.map((widget) => [widget.id, widget]));
  const addedWidgets = [...newerWidgets.keys()].filter((id) => !olderWidgets.has(id)).length;
  const removedWidgets = [...olderWidgets.keys()].filter((id) => !newerWidgets.has(id)).length;
  const changedWidgets = [...newerWidgets.entries()].filter(([id, widget]) => {
    const previous = olderWidgets.get(id);
    return previous && widgetConfigurationJson(previous) !== widgetConfigurationJson(widget);
  }).length;
  const olderSections = new Map(older.sections.map((section) => [section.id, section]));
  const newerSections = new Map(newer.sections.map((section) => [section.id, section]));
  const changedSections = new Set([...olderSections.keys(), ...newerSections.keys()]);
  const breakpoints: DashboardGridBreakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  return {
    addedWidgets,
    removedWidgets,
    changedWidgets,
    movedWidgets: countChangedWidgetPositions(older, newer),
    changedSections: [...changedSections].filter((id) => (
      stableJson(olderSections.get(id)) !== stableJson(newerSections.get(id))
    )).length,
    changedBreakpoints: breakpoints.filter((breakpoint) => (
      stableJson(older.responsiveLayouts.root?.[breakpoint] ?? []) !==
        stableJson(newer.responsiveLayouts.root?.[breakpoint] ?? []) ||
      stableJson(Object.fromEntries(Object.entries(older.responsiveLayouts.stacks ?? {}).map(
        ([stackId, layouts]) => [stackId, layouts[breakpoint] ?? []],
      ))) !== stableJson(Object.fromEntries(Object.entries(newer.responsiveLayouts.stacks ?? {}).map(
        ([stackId, layouts]) => [stackId, layouts[breakpoint] ?? []],
      )))
    )),
  };
}
