import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_VIEWPORT_PREVIEW_WIDTHS,
  resolveDashboardViewportPreviewWidth,
  resolveGridBreakpointFromWidth,
} from './dashboardViewport';

describe('dashboard viewport preview', () => {
  it('maps presets to real grid widths without changing the automatic mode', () => {
    expect(resolveDashboardViewportPreviewWidth('auto')).toBeUndefined();
    expect(resolveDashboardViewportPreviewWidth('desktop')).toBe(DASHBOARD_VIEWPORT_PREVIEW_WIDTHS.desktop);
    expect(resolveDashboardViewportPreviewWidth('tablet')).toBe(DASHBOARD_VIEWPORT_PREVIEW_WIDTHS.tablet);
    expect(resolveDashboardViewportPreviewWidth('compact')).toBe(DASHBOARD_VIEWPORT_PREVIEW_WIDTHS.compact);
    expect(resolveDashboardViewportPreviewWidth('mobile')).toBe(390);
  });

  it('uses the same breakpoint resolver as the runtime canvas', () => {
    expect(resolveGridBreakpointFromWidth(DASHBOARD_VIEWPORT_PREVIEW_WIDTHS.desktop)).toBe('xl');
    expect(resolveGridBreakpointFromWidth(DASHBOARD_VIEWPORT_PREVIEW_WIDTHS.tablet)).toBe('md');
    expect(resolveGridBreakpointFromWidth(DASHBOARD_VIEWPORT_PREVIEW_WIDTHS.compact)).toBe('sm');
    expect(resolveGridBreakpointFromWidth(DASHBOARD_VIEWPORT_PREVIEW_WIDTHS.mobile)).toBe('xs');
  });
});
