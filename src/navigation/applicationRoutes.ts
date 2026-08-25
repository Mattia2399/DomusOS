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

export const APPLICATION_ROUTE_IDS = [
  'appgallery',
  'home',
  'rooms',
  'automation',
  'security',
  'consumi',
] as const;

export type ApplicationRouteId = (typeof APPLICATION_ROUTE_IDS)[number];

export type SidebarQuickPath = {
  id: string;
  label: string;
  readonly path: string;
  icon: SidebarQuickPathIconKey;
};

export type SidebarQuickPathCustomization = Partial<Pick<SidebarQuickPath, 'label' | 'icon'>>;

type ApplicationRouteDefinition = Readonly<{
  id: ApplicationRouteId;
  label: string;
  path: string;
  icon: SidebarQuickPathIconKey;
}>;

export const APPLICATION_ROUTE_REGISTRY: readonly ApplicationRouteDefinition[] = [
  { id: 'appgallery', label: 'App Gallery', path: '/appgallery', icon: 'dashboard' },
  { id: 'home', label: 'Home', path: '/home', icon: 'home' },
  { id: 'rooms', label: 'Stanze', path: '/rooms', icon: 'rooms' },
  { id: 'automation', label: 'Automazioni', path: '/automations', icon: 'automation' },
  { id: 'security', label: 'Sicurezza', path: '/security', icon: 'security' },
  { id: 'consumi', label: 'Consumi', path: '/consumi', icon: 'chart' },
] as const;

const ROUTE_BY_ID = new Map(APPLICATION_ROUTE_REGISTRY.map((route) => [route.id, route] as const));
const ROUTE_BY_PATH = new Map(APPLICATION_ROUTE_REGISTRY.map((route) => [route.path, route] as const));

const LEGACY_ID_ALIASES: Readonly<Record<string, ApplicationRouteId>> = {
  dashboard: 'home',
  devices: 'appgallery',
};

const LEGACY_PATH_ALIASES: Readonly<Record<string, string>> = {
  '/example': '/home',
  '/automation': '/automations',
  '/appgalley': '/appgallery',
  '/devices': '/appgallery',
};

function normalizeRoutePath(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return '';
  }
  const withoutTrailingSlash =
    normalized.length > 1 && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  return LEGACY_PATH_ALIASES[withoutTrailingSlash] ?? withoutTrailingSlash;
}

function resolveRouteDefinition(idValue: unknown, pathValue: unknown) {
  const normalizedId = typeof idValue === 'string' ? idValue.trim().toLowerCase() : '';
  const aliasedId = LEGACY_ID_ALIASES[normalizedId] ?? normalizedId;
  if (APPLICATION_ROUTE_IDS.includes(aliasedId as ApplicationRouteId)) {
    return ROUTE_BY_ID.get(aliasedId as ApplicationRouteId) ?? null;
  }

  if (typeof pathValue !== 'string') {
    return null;
  }
  return ROUTE_BY_PATH.get(normalizeRoutePath(pathValue)) ?? null;
}

function normalizeSidebarIcon(value: unknown, fallback: SidebarQuickPathIconKey): SidebarQuickPathIconKey {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if ((SIDEBAR_PATH_ICON_KEYS as readonly string[]).includes(normalized)) {
      return normalized as SidebarQuickPathIconKey;
    }
  }
  return fallback;
}

function isLegacyDefaultSidebarPreset(value: unknown[]) {
  const expected = [
    ['dashboard', '/home'],
    ['devices', '/devices'],
    ['rooms', '/rooms'],
    ['automation', '/automations'],
    ['security', '/security'],
    ['help', '/help'],
  ] as const;

  return (
    value.length === expected.length &&
    expected.every(([id, path], index) => {
      const entry = value[index];
      if (!entry || typeof entry !== 'object') {
        return false;
      }
      const candidate = entry as Record<string, unknown>;
      return (
        candidate.id === id &&
        typeof candidate.path === 'string' &&
        candidate.path.trim().toLowerCase().replace(/\/+$/, '') === path
      );
    })
  );
}

export function createDefaultSidebarPaths(): SidebarQuickPath[] {
  return APPLICATION_ROUTE_REGISTRY.map((route) => ({ ...route }));
}

export function sanitizeSidebarQuickPaths(value: unknown): SidebarQuickPath[] {
  if (!Array.isArray(value)) {
    return createDefaultSidebarPaths();
  }
  if (isLegacyDefaultSidebarPreset(value)) {
    return createDefaultSidebarPaths();
  }

  const routeIds = new Set<ApplicationRouteId>();
  const sanitized: SidebarQuickPath[] = [];

  value.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const candidate = entry as Record<string, unknown>;
    const route = resolveRouteDefinition(candidate.id, candidate.path);
    if (!route || routeIds.has(route.id)) {
      return;
    }

    routeIds.add(route.id);
    sanitized.push({
      id: route.id,
      label:
        typeof candidate.label === 'string' && candidate.label.trim()
          ? candidate.label.trim()
          : route.label,
      path: route.path,
      icon: normalizeSidebarIcon(candidate.icon, route.icon),
    });
  });

  return sanitized.length > 0 ? sanitized : createDefaultSidebarPaths();
}

export function resolveApplicationRoutePath(id: unknown, path?: unknown): string | null {
  if (typeof path === 'string') {
    const routeFromPath = ROUTE_BY_PATH.get(normalizeRoutePath(path));
    if (routeFromPath) {
      return routeFromPath.path;
    }
  }
  return resolveRouteDefinition(id, undefined)?.path ?? null;
}

export function getApplicationRoute(id: ApplicationRouteId): SidebarQuickPath {
  const route = ROUTE_BY_ID.get(id);
  if (!route) {
    throw new Error(`Unknown application route: ${id}`);
  }
  return { ...route };
}
