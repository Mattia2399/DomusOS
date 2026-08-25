import { describe, expect, it } from 'vitest';
import type { SidebarQuickPath } from '../../navigation/applicationRoutes';
import {
  isDashboardNavigationEntryActive,
  isPrimaryDashboardNavigationEntry,
  PRIMARY_DASHBOARD_ROUTE_IDS,
  resolveDashboardNavigationEntries,
} from './dashboardNavigation';

describe('dashboardNavigation', () => {
  it('uses one canonical primary route set on every navigation surface', () => {
    const entries = resolveDashboardNavigationEntries([], PRIMARY_DASHBOARD_ROUTE_IDS);

    expect(entries.map(({ id, path, label }) => ({ id, path, label }))).toEqual([
      { id: 'home', path: '/home', label: 'Dashboard' },
      { id: 'rooms', path: '/rooms', label: 'Stanze' },
      { id: 'security', path: '/security', label: 'Sicurezza' },
      { id: 'consumi', path: '/consumi', label: 'Consumi' },
    ]);
  });

  it('preserves user labels and icons while keeping the canonical route', () => {
    const configured: SidebarQuickPath[] = [
      { id: 'home', path: '/home', label: 'La mia casa', icon: 'light' },
    ];

    const [home] = resolveDashboardNavigationEntries(configured, ['home']);
    expect(home).toMatchObject({ id: 'home', path: '/home', label: 'La mia casa', icon: 'light' });
  });

  it('resolves active routes from the embedded location and editor selection', () => {
    const [rooms] = resolveDashboardNavigationEntries([], ['rooms']);
    expect(isDashboardNavigationEntryActive({
      entry: rooms,
      isEditMode: false,
      activeRoute: '/rooms',
    })).toBe(true);
    expect(isDashboardNavigationEntryActive({
      entry: rooms,
      isEditMode: true,
      selectedPathId: rooms.id,
      activeRoute: '/home',
    })).toBe(true);
  });

  it('separates primary routes from drawer-only tools', () => {
    const [home] = resolveDashboardNavigationEntries([], ['home']);
    const [automation] = resolveDashboardNavigationEntries([], ['automation']);
    expect(isPrimaryDashboardNavigationEntry(home)).toBe(true);
    expect(isPrimaryDashboardNavigationEntry(automation)).toBe(false);
  });
});
