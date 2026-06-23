import {
  BarChart3,
  DoorOpen,
  HelpCircle,
  Home,
  LayoutGrid,
  Lightbulb,
  MonitorSmartphone,
  Music2,
  Rocket,
  Settings,
  ShieldCheck,
  Thermometer,
} from 'lucide-react';
import type { SidebarQuickPath, SidebarQuickPathIconKey } from '../../hooks/useProfileSettings';
import { isPathActiveForCurrentLocation } from '../../utils/navigationPathMatch';

type BottomBarNavProps = {
  isEditMode: boolean;
  quickPaths: SidebarQuickPath[];
  selectedPathId?: string | null;
  onPathClick: (entry: SidebarQuickPath) => void;
  onOpenSettings: () => void;
};

const PATH_ICONS: Record<SidebarQuickPathIconKey, typeof LayoutGrid> = {
  dashboard: LayoutGrid,
  devices: MonitorSmartphone,
  settings: Settings,
  automation: Rocket,
  security: ShieldCheck,
  help: HelpCircle,
  home: Home,
  rooms: DoorOpen,
  chart: BarChart3,
  light: Lightbulb,
  climate: Thermometer,
  media: Music2,
};

type BottomBarPrimaryAction = {
  entry: SidebarQuickPath;
};

const DEFAULT_BOTTOM_BAR_PATHS: SidebarQuickPath[] = [
  { id: 'bottom-dashboard', label: 'Dashboard', path: '/home', icon: 'home' },
  { id: 'bottom-rooms', label: 'Stanze', path: '/rooms', icon: 'rooms' },
  { id: 'bottom-security', label: 'Sicurezza', path: '/security', icon: 'security' },
  { id: 'bottom-consumi', label: 'Consumi', path: '/consumi', icon: 'chart' },
  { id: 'bottom-appgallery', label: 'App Gallery', path: '/appgallery', icon: 'dashboard' },
  { id: 'bottom-automations', label: 'Automazioni', path: '/automations', icon: 'automation' },
];

const XS_PRIMARY_PATH_CONFIG: Array<Pick<SidebarQuickPath, 'id' | 'label' | 'path' | 'icon'>> = [
  { id: 'bottom-dashboard', label: 'Dashboard', path: '/home', icon: 'home' },
  { id: 'bottom-rooms', label: 'Stanze', path: '/rooms', icon: 'rooms' },
  { id: 'bottom-security', label: 'Sicurezza', path: '/security', icon: 'security' },
  { id: 'bottom-consumi', label: 'Consumi', path: '/consumi', icon: 'chart' },
];

function normalizeBottomNavPath(path: string) {
  const trimmed = path.trim().toLowerCase();
  if (!trimmed) {
    return '/';
  }
  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
}

export function BottomBarNav({
  isEditMode,
  quickPaths,
  selectedPathId = null,
  onPathClick,
  onOpenSettings,
}: BottomBarNavProps) {
  const effectiveQuickPaths = quickPaths.length > 0 ? quickPaths : DEFAULT_BOTTOM_BAR_PATHS;
  const quickPathByNormalizedPath = new Map(
    effectiveQuickPaths.map((entry) => [normalizeBottomNavPath(entry.path), entry] as const),
  );

  const primaryActions = XS_PRIMARY_PATH_CONFIG.map((configEntry) => {
    const matchedEntry = quickPathByNormalizedPath.get(normalizeBottomNavPath(configEntry.path));
    const entry: SidebarQuickPath = matchedEntry
      ? {
          ...matchedEntry,
          label: configEntry.label,
          icon: configEntry.icon,
        }
      : {
          id: configEntry.id,
          label: configEntry.label,
          path: configEntry.path,
          icon: configEntry.icon,
        };
    return { entry } satisfies BottomBarPrimaryAction;
  });

  return (
    <div className="fixed inset-x-0 bottom-0 z-[170] px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <div className="relative mx-auto max-w-xl">
          <div className="liquid-glass-panel relative overflow-hidden rounded-[1.35rem]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.26),rgba(255,255,255,0.1)_22%,rgba(255,255,255,0.03)_58%,rgba(8,16,30,0.14))]" />
          <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <div className="pointer-events-none absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />
          <div className="relative grid grid-cols-5 gap-1 p-1.5">
            {primaryActions.map((action) => {
              const entry = action.entry;
              const Icon = PATH_ICONS[entry.icon] ?? LayoutGrid;
              const active = isEditMode
                ? selectedPathId === entry.id
                : isPathActiveForCurrentLocation(entry.path);
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    onPathClick(entry);
                  }}
                  className={`group relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[0.85rem] px-1 py-1.5 transition-all ${
                    active
                      ? 'text-white'
                      : 'text-white/62 hover:text-white/90 hover:bg-white/[0.06]'
                  }`}
                  aria-label={`Apri ${entry.label}`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all ${
                      active ? 'bg-transparent' : 'bg-transparent group-hover:bg-white/10'
                    }`}
                  >
                    <Icon
                      size={16}
                      strokeWidth={active ? 1.85 : 2}
                      fill={active ? 'currentColor' : 'none'}
                      className={active ? '' : 'group-hover:scale-105 transition-transform'}
                    />
                  </span>
                  <span className={`max-w-full truncate text-[9.5px] leading-none tracking-[0.01em] ${active ? 'font-semibold' : 'font-medium'}`}>
                    {entry.label}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onOpenSettings}
              className="group relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[0.85rem] px-1 py-1.5 text-white/78 transition-all hover:bg-white/[0.06] hover:text-white/95"
              aria-label="Apri impostazioni"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-transparent transition-all group-hover:bg-white/10">
                <Settings size={16} strokeWidth={2} className="transition-transform group-hover:scale-105" />
              </span>
              <span className="max-w-full truncate text-[9.5px] font-medium leading-none tracking-[0.01em]">Impostazioni</span>
            </button>
          </div>
        </div>
        </div>
      </div>
  );
}
