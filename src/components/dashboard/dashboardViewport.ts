import type { DashboardGridBreakpoint } from '../../types/widgetTypeLayout';
import { GRID_ENGINE_BREAKPOINTS } from './DashboardGrid';

export const DASHBOARD_VIEWPORT_PREVIEW_MODES = ['auto', 'desktop', 'tablet', 'compact', 'mobile'] as const;
export type DashboardViewportPreviewMode = (typeof DASHBOARD_VIEWPORT_PREVIEW_MODES)[number];

/**
 * Target widths refer to the actual grid content box, not to window.innerWidth.
 * This keeps the preview aligned with the same source of truth observed by
 * GridCanvas when sidebars or embedded shells reduce the available space.
 */
export const DASHBOARD_VIEWPORT_PREVIEW_WIDTHS: Readonly<
  Record<Exclude<DashboardViewportPreviewMode, 'auto'>, number>
> = {
  desktop: GRID_ENGINE_BREAKPOINTS.xl,
  tablet: GRID_ENGINE_BREAKPOINTS.md,
  compact: GRID_ENGINE_BREAKPOINTS.sm,
  mobile: 390,
};

export function resolveDashboardViewportPreviewWidth(mode: DashboardViewportPreviewMode) {
  return mode === 'auto' ? undefined : DASHBOARD_VIEWPORT_PREVIEW_WIDTHS[mode];
}

export function isXsViewportNow() {
  return typeof window !== 'undefined' && window.innerWidth < GRID_ENGINE_BREAKPOINTS.sm;
}

export function isCompactViewportNow() {
  return typeof window !== 'undefined' && window.innerWidth < GRID_ENGINE_BREAKPOINTS.md;
}

export function isDesktopViewportNow() {
  return typeof window !== 'undefined' && window.innerWidth >= GRID_ENGINE_BREAKPOINTS.lg;
}

export function resolveGridBreakpointFromWidth(width: number): DashboardGridBreakpoint {
  if (width >= GRID_ENGINE_BREAKPOINTS['2xl']) return '2xl';
  if (width >= GRID_ENGINE_BREAKPOINTS.xl) return 'xl';
  if (width >= GRID_ENGINE_BREAKPOINTS.lg) return 'lg';
  if (width >= GRID_ENGINE_BREAKPOINTS.md) return 'md';
  return width >= GRID_ENGINE_BREAKPOINTS.sm ? 'sm' : 'xs';
}

export function resolveGridBreakpointNow() {
  return typeof window === 'undefined' ? 'xl' : resolveGridBreakpointFromWidth(window.innerWidth);
}
