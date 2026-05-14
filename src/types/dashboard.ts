import type { DashboardSection, Widget } from './dashboardModels';
export type { MicroWidget } from './dashboardModels';

export interface LayoutData {
  cards: unknown[]; // Definizione serializzata delle card/griglia.
  sections?: DashboardSection[];
  widgets?: Widget[];
  background?: string;
  updated_at?: string;
}

export interface DashboardUserConfig {
  default_layout: string;
  devices: {
    [deviceId: string]: string;
  };
  allow_edits?: boolean;
  allowed_sidebar_paths?: string[];
}

export interface DashboardConfig {
  layouts: {
    [layoutId: string]: LayoutData;
  };
  users: {
    [userId: string]: DashboardUserConfig;
  };
}

export type DashboardResolvedLayout = {
  layoutId: string | null;
  layout: LayoutData | null;
  source: 'device' | 'default' | 'none';
};
