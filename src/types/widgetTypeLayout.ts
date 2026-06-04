import type { WidgetKind } from './dashboardModels';

export const DASHBOARD_GRID_BREAKPOINT_ORDER = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'] as const;
export type DashboardGridBreakpoint = (typeof DASHBOARD_GRID_BREAKPOINT_ORDER)[number];

export type WidgetTypeBreakpointLayoutOverride = {
  w?: number;
  h?: number;
  hOn?: number;
  hOff?: number;
};

export type WidgetTypeLayoutOverrides = Partial<
  Record<WidgetKind, Partial<Record<DashboardGridBreakpoint, WidgetTypeBreakpointLayoutOverride>>>
>;
