import { useEffect, useState } from 'react';
import { loadHaLiveConfig, saveHaLiveConfig } from '../services/haLive';

export type DashboardTheme = 'dark' | 'light';
export type DashboardThemeMode = DashboardTheme | 'auto';
export const DASHBOARD_WALLPAPER_PRESETS = [
  { id: 'home-hub', label: 'Home Hub', description: 'Glow oro su base premium' },
  { id: 'ocean-mist', label: 'Ocean Mist', description: 'Freddo azzurro con riflessi' },
  { id: 'sunset-amber', label: 'Sunset Amber', description: 'Caldo tramonto morbido' },
  { id: 'forest-glass', label: 'Forest Glass', description: 'Toni naturali e profondi' },
  { id: 'total-white', label: 'Total White', description: 'Bianco pieno pulito' },
  { id: 'total-black', label: 'Total Black', description: 'Nero pieno minimale' },
] as const;
export type DashboardWallpaperPreset = (typeof DASHBOARD_WALLPAPER_PRESETS)[number]['id'];
export const SIDEBAR_PATH_ICON_KEYS = [
  'dashboard',
  'devices',
  'settings',
  'automation',
  'security',
  'help',
  'home',
  'rooms',
  'chart',
  'light',
  'climate',
  'media',
] as const;
export type SidebarQuickPathIconKey = (typeof SIDEBAR_PATH_ICON_KEYS)[number];
export type SidebarQuickPath = {
  id: string;
  label: string;
  path: string;
  icon: SidebarQuickPathIconKey;
};

const THEME_STORAGE_KEY = 'ha.dashboard.theme';
const WALLPAPER_STORAGE_KEY = 'ha.dashboard.wallpaper';
const SIDEBAR_PATHS_STORAGE_KEY = 'ha.dashboard.sidebarPaths';
const DEVELOPER_MODE_STORAGE_KEY = 'ha.dashboard.developerMode';

function resolveSystemTheme(): DashboardTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolveThemeMode(mode: DashboardThemeMode): DashboardTheme {
  return mode === 'auto' ? resolveSystemTheme() : mode;
}

function readStoredThemeMode(): DashboardThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'auto' || stored === 'light' || stored === 'dark' ? stored : 'dark';
}

const DEFAULT_WALLPAPER_ID: DashboardWallpaperPreset = DASHBOARD_WALLPAPER_PRESETS[0].id;
const DASHBOARD_WALLPAPER_IDS = DASHBOARD_WALLPAPER_PRESETS.map((preset) => preset.id);

function normalizeDashboardWallpaper(value: unknown): DashboardWallpaperPreset {
  if (typeof value === 'string' && DASHBOARD_WALLPAPER_IDS.includes(value as DashboardWallpaperPreset)) {
    return value as DashboardWallpaperPreset;
  }
  return DEFAULT_WALLPAPER_ID;
}

function readStoredWallpaper(): DashboardWallpaperPreset {
  if (typeof window === 'undefined') {
    return DEFAULT_WALLPAPER_ID;
  }
  return normalizeDashboardWallpaper(window.localStorage.getItem(WALLPAPER_STORAGE_KEY));
}

function readStoredDeveloperMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const stored = window.localStorage.getItem(DEVELOPER_MODE_STORAGE_KEY);
  return stored === '1' || stored === 'true';
}

function createDefaultSidebarPaths(): SidebarQuickPath[] {
  return [
    { id: 'appgallery', label: 'App Gallery', path: '/appgallery', icon: 'dashboard' },
    { id: 'home', label: 'Home', path: '/home', icon: 'home' },
    { id: 'rooms', label: 'Stanze', path: '/rooms', icon: 'rooms' },
    { id: 'automation', label: 'Automazioni', path: '/automations', icon: 'automation' },
    { id: 'security', label: 'Sicurezza', path: '/security', icon: 'security' },
    { id: 'consumi', label: 'Consumi', path: '/consumi', icon: 'chart' },
  ];
}

function isLegacyDefaultSidebarPaths(paths: SidebarQuickPath[]) {
  if (paths.length !== 6) {
    return false;
  }

  const legacyDefaultPaths = [
    { id: 'dashboard', path: '/home' },
    { id: 'devices', path: '/devices' },
    { id: 'rooms', path: '/rooms' },
    { id: 'automation', path: '/automations' },
    { id: 'security', path: '/security' },
    { id: 'help', path: '/help' },
  ] as const;

  return legacyDefaultPaths.every(
    (entry, index) => paths[index]?.id === entry.id && paths[index]?.path.toLowerCase() === entry.path,
  );
}

function migrateLegacyDashboardPath(path: string) {
  const normalized = path.toLowerCase();
  if (normalized === '/example') {
    return '/home';
  }
  if (normalized === '#example') {
    return '#home';
  }
  if (normalized === '?view=example') {
    return '?view=home';
  }
  if (normalized === '/automation') {
    return '/automations';
  }
  if (normalized === '#automation') {
    return '#automations';
  }
  if (normalized === '?view=automation') {
    return '?view=automations';
  }
  if (normalized === '/appgalley') {
    return '/appgallery';
  }
  if (normalized === '#appgalley') {
    return '#appgallery';
  }
  if (normalized === '?view=appgalley') {
    return '?view=appgallery';
  }
  return path;
}

function normalizeQuickPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '/';
  }

  let normalized: string;
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('?') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    normalized = trimmed;
  } else {
    normalized = `/${trimmed}`;
  }

  return migrateLegacyDashboardPath(normalized);
}

function normalizeSidebarIcon(value: unknown, index = 0): SidebarQuickPathIconKey {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if ((SIDEBAR_PATH_ICON_KEYS as readonly string[]).includes(normalized)) {
      return normalized as SidebarQuickPathIconKey;
    }
  }
  return SIDEBAR_PATH_ICON_KEYS[index % SIDEBAR_PATH_ICON_KEYS.length];
}

function readStoredSidebarPaths(): SidebarQuickPath[] {
  if (typeof window === 'undefined') {
    return createDefaultSidebarPaths();
  }

  const raw = window.localStorage.getItem(SIDEBAR_PATHS_STORAGE_KEY);
  if (!raw) {
    return createDefaultSidebarPaths();
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return createDefaultSidebarPaths();
    }
    const normalized = parsed
      .map((entry, index) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }
        const id =
          typeof entry.id === 'string' && entry.id.trim().length > 0
            ? entry.id
            : `path-${index + 1}`;
        const label =
          typeof entry.label === 'string' && entry.label.trim().length > 0
            ? entry.label.trim()
            : `Path ${index + 1}`;
        const path =
          typeof entry.path === 'string' ? normalizeQuickPath(entry.path) : '/';
        const icon = normalizeSidebarIcon((entry as { icon?: unknown }).icon, index);
        return { id, label, path, icon };
      })
      .filter((entry): entry is SidebarQuickPath => entry !== null);

    if (normalized.length === 0) {
      return createDefaultSidebarPaths();
    }

    // Migrate old stock sidebar presets to the new route order/paths.
    if (isLegacyDefaultSidebarPaths(normalized)) {
      return createDefaultSidebarPaths();
    }

    return normalized;
  } catch {
    return createDefaultSidebarPaths();
  }
}

export function useProfileSettings() {
  const initialHaConfig = loadHaLiveConfig();
  const initialThemeMode = readStoredThemeMode();
  const [themeMode, setThemeModeState] = useState<DashboardThemeMode>(initialThemeMode);
  const [theme, setThemeState] = useState<DashboardTheme>(() => resolveThemeMode(initialThemeMode));
  const [wallpaper, setWallpaperState] = useState<DashboardWallpaperPreset>(readStoredWallpaper);
  const [developerMode, setDeveloperModeState] = useState<boolean>(readStoredDeveloperMode);
  const [haUrl, setHaUrlState] = useState<string>(initialHaConfig.url);
  const [haToken, setHaTokenState] = useState<string>(initialHaConfig.token);
  const [haRememberToken, setHaRememberTokenState] = useState<boolean>(initialHaConfig.rememberToken);
  const [sidebarPaths, setSidebarPathsState] = useState<SidebarQuickPath[]>(readStoredSidebarPaths);

  const setTheme = (next: DashboardTheme) => {
    setThemeModeState(next);
    setThemeState(next);
  };

  const setThemeMode = (next: DashboardThemeMode) => {
    setThemeModeState(next);
    setThemeState(resolveThemeMode(next));
  };

  const setWallpaper = (next: DashboardWallpaperPreset) => {
    setWallpaperState(normalizeDashboardWallpaper(next));
  };

  const setDeveloperMode = (next: boolean) => {
    setDeveloperModeState(Boolean(next));
  };

  const setHaToken = (next: string) => {
    setHaTokenState(next);
  };

  const setHaUrl = (next: string) => {
    setHaUrlState(next);
  };

  const setHaRememberToken = (next: boolean) => {
    setHaRememberTokenState(next);
  };

  const addSidebarPath = () => {
    const id = `path-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    setSidebarPathsState((current) => [
      ...current,
      {
        id,
        label: `Path ${current.length + 1}`,
        path: '/',
        icon: SIDEBAR_PATH_ICON_KEYS[current.length % SIDEBAR_PATH_ICON_KEYS.length],
      },
    ]);
  };

  const updateSidebarPath = (id: string, patch: Partial<Omit<SidebarQuickPath, 'id'>>) => {
    setSidebarPathsState((current) =>
      current.map((entry) => {
        if (entry.id !== id) {
          return entry;
        }
        return {
          ...entry,
          label:
            patch.label === undefined
              ? entry.label
              : patch.label.trim().length > 0
                ? patch.label.trim()
                : entry.label,
          path: patch.path === undefined ? entry.path : normalizeQuickPath(patch.path),
          icon: patch.icon === undefined ? entry.icon : normalizeSidebarIcon(patch.icon),
        };
      }),
    );
  };

  const removeSidebarPath = (id: string) => {
    setSidebarPathsState((current) => {
      const next = current.filter((entry) => entry.id !== id);
      if (next.length > 0) {
        return next;
      }
      return [
        {
          id: `path-${Date.now()}-fallback`,
          label: 'Dashboard',
          path: '/home',
          icon: 'dashboard',
        },
      ];
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode !== 'auto' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const updateSystemTheme = () => setThemeState(mediaQuery.matches ? 'light' : 'dark');

    updateSystemTheme();
    mediaQuery.addEventListener('change', updateSystemTheme);
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(WALLPAPER_STORAGE_KEY, wallpaper);
  }, [wallpaper]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(DEVELOPER_MODE_STORAGE_KEY, developerMode ? '1' : '0');
  }, [developerMode]);

  useEffect(() => {
    saveHaLiveConfig({
      url: haUrl,
      token: haToken,
      rememberToken: haRememberToken,
    });
  }, [haRememberToken, haToken, haUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(SIDEBAR_PATHS_STORAGE_KEY, JSON.stringify(sidebarPaths));
  }, [sidebarPaths]);

  return {
    theme,
    themeMode,
    setTheme,
    setThemeMode,
    wallpaper,
    setWallpaper,
    developerMode,
    setDeveloperMode,
    haUrl,
    setHaUrl,
    haToken,
    setHaToken,
    haRememberToken,
    setHaRememberToken,
    sidebarPaths,
    addSidebarPath,
    updateSidebarPath,
    removeSidebarPath,
  };
}
