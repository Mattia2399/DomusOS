import type { GridItem, WidgetKind } from './dashboardModels';

export const DASHBOARD_GRID_BREAKPOINT_ORDER = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'] as const;
export type DashboardGridBreakpoint = (typeof DASHBOARD_GRID_BREAKPOINT_ORDER)[number];

export type WidgetTypeBreakpointLayoutOverride = {
  w?: number;
  h?: number;
  hOn?: number;
  hOff?: number;
  autoExpand?: boolean;
};

export type WidgetTypeLayoutOverrides = Partial<
  Record<WidgetKind, Partial<Record<DashboardGridBreakpoint, WidgetTypeBreakpointLayoutOverride>>>
>;

export type DashboardBreakpointLayouts = Partial<Record<DashboardGridBreakpoint, GridItem[]>>;

export type DashboardResponsiveLayouts = {
  root?: DashboardBreakpointLayouts;
  stacks?: Record<string, DashboardBreakpointLayouts>;
};

export type WidgetLayoutOverrides = Partial<
  Record<string, Partial<Record<DashboardGridBreakpoint, WidgetTypeBreakpointLayoutOverride>>>
>;
