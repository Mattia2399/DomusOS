import {
  parseSharedHouseConfiguration,
  type DashboardConfigurationCache,
  type SharedHouseConfiguration,
} from './dashboardConfigurationRepository';
import { stripWidgetSecretsFromWidgets } from './widgetSecrets';
import { projectDashboardForPersistence } from './dashboardPersistenceProjection';

export const SHARED_HOUSE_CONFIGURATION_CACHE_KEY =
  'ha.dashboard.cache.sharedHouseConfiguration.v1';

export class LocalDashboardConfigurationCache implements DashboardConfigurationCache {
  constructor(private readonly storage: Storage) {}

  loadSharedHouseConfiguration(): SharedHouseConfiguration | null {
    try {
      const raw = this.storage.getItem(SHARED_HOUSE_CONFIGURATION_CACHE_KEY);
      if (!raw) return null;
      return parseSharedHouseConfiguration(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  saveSharedHouseConfiguration(document: SharedHouseConfiguration): void {
    try {
      const projectedDashboard = projectDashboardForPersistence(document.dashboard);
      this.storage.setItem(
        SHARED_HOUSE_CONFIGURATION_CACHE_KEY,
        JSON.stringify({
          ...document,
          dashboard: {
            ...projectedDashboard,
            widgets: stripWidgetSecretsFromWidgets(projectedDashboard.widgets),
          },
        }),
      );
    } catch {
      // Cache failures never change the result of an authoritative HA save.
    }
  }

  clearSharedHouseConfiguration(): void {
    try {
      this.storage.removeItem(SHARED_HOUSE_CONFIGURATION_CACHE_KEY);
    } catch {
      // The cache is best-effort only.
    }
  }
}

export function createLocalDashboardConfigurationCache(storage: Storage) {
  return new LocalDashboardConfigurationCache(storage);
}
