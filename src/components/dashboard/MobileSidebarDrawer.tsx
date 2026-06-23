import React from 'react';
import {
  BarChart3,
  DoorOpen,
  HelpCircle,
  Home,
  LayoutGrid,
  Lightbulb,
  LogOut,
  MonitorSmartphone,
  Music2,
  Rocket,
  Settings,
  ShieldCheck,
  Thermometer,
  X,
} from 'lucide-react';
import type { SidebarQuickPath, SidebarQuickPathIconKey } from '../../hooks/useProfileSettings';
import { isPathActiveForCurrentLocation } from '../../utils/navigationPathMatch';

type MobileSidebarDrawerProps = {
  isOpen: boolean;
  isEditMode: boolean;
  quickPaths: SidebarQuickPath[];
  selectedPathId?: string | null;
  userAvatarUrl?: string;
  userAvatarAlt?: string;
  userEmail?: string;
  onPathClick: (entry: SidebarQuickPath) => void;
  onDisconnectHomeAssistant: () => void | Promise<void>;
  onClose: () => void;
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

const DEFAULT_MOBILE_SIDEBAR_PATHS: SidebarQuickPath[] = [
  { id: 'mobile-dashboard', label: 'Dashboard', path: '/home', icon: 'home' },
  { id: 'mobile-rooms', label: 'Stanze', path: '/rooms', icon: 'rooms' },
  { id: 'mobile-security', label: 'Sicurezza', path: '/security', icon: 'security' },
  { id: 'mobile-consumi', label: 'Consumi', path: '/consumi', icon: 'chart' },
  { id: 'mobile-appgallery', label: 'App Gallery', path: '/appgallery', icon: 'dashboard' },
  { id: 'mobile-automations', label: 'Automazioni', path: '/automations', icon: 'automation' },
];

const MOBILE_MENU_PATH_CONFIG: Array<Pick<SidebarQuickPath, 'id' | 'label' | 'path' | 'icon'>> = [
  { id: 'mobile-menu-dashboard', label: 'Dashboard', path: '/home', icon: 'home' },
  { id: 'mobile-menu-rooms', label: 'Stanze', path: '/rooms', icon: 'rooms' },
  { id: 'mobile-menu-security', label: 'Sicurezza', path: '/security', icon: 'security' },
  { id: 'mobile-menu-consumi', label: 'Consumi', path: '/consumi', icon: 'chart' },
  { id: 'mobile-menu-appgallery', label: 'App Gallery', path: '/appgallery', icon: 'dashboard' },
  { id: 'mobile-menu-automations', label: 'Automazioni', path: '/automations', icon: 'automation' },
];

const DEFAULT_PROFILE_AVATAR_URL =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop';

function normalizeMobileSidebarPath(path: string) {
  const trimmed = path.trim().toLowerCase();
  if (!trimmed) {
    return '/';
  }
  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
}

export function MobileSidebarDrawer({
  isOpen,
  isEditMode,
  quickPaths,
  selectedPathId = null,
  userAvatarUrl,
  userAvatarAlt,
  userEmail,
  onPathClick,
  onDisconnectHomeAssistant,
  onClose,
}: MobileSidebarDrawerProps) {
  const drawerRef = React.useRef<HTMLElement | null>(null);
  const [avatarSrc, setAvatarSrc] = React.useState(userAvatarUrl ?? DEFAULT_PROFILE_AVATAR_URL);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);
  const effectiveQuickPaths = quickPaths.length > 0 ? quickPaths : DEFAULT_MOBILE_SIDEBAR_PATHS;
  const quickPathByNormalizedPath = new Map(
    effectiveQuickPaths.map((entry) => [normalizeMobileSidebarPath(entry.path), entry] as const),
  );
  const menuEntries = MOBILE_MENU_PATH_CONFIG.map((configEntry) => {
    const matchedEntry = quickPathByNormalizedPath.get(normalizeMobileSidebarPath(configEntry.path));
    return matchedEntry
      ? {
          ...matchedEntry,
          label: configEntry.label,
          icon: configEntry.icon,
        }
      : configEntry;
  });
  const displayUserName = userAvatarAlt?.trim() || 'Utente';
  const displayUserEmail = userEmail?.trim() || 'Email non disponibile';

  const handlePathClick = (entry: SidebarQuickPath) => {
    onPathClick(entry);
    onClose();
  };

  const handleLogoutConfirm = () => {
    void onDisconnectHomeAssistant();
    setIsLogoutConfirmOpen(false);
    onClose();
  };

  React.useEffect(() => {
    setAvatarSrc(userAvatarUrl ?? DEFAULT_PROFILE_AVATAR_URL);
  }, [userAvatarUrl]);

  React.useEffect(() => {
    if (!isOpen) {
      setIsLogoutConfirmOpen(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Chiudi menu laterale"
        className={`fixed inset-0 z-[176] bg-[color:var(--profile-sheet-overlay)] backdrop-blur-md transition-opacity duration-200 md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        ref={drawerRef}
        className={`fixed left-0 top-0 z-[181] flex h-[100dvh] w-[min(84vw,21rem)] max-w-[21rem] flex-col overflow-hidden border-r border-[color:var(--profile-sheet-border)] bg-[var(--profile-sheet-bg)] px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)] text-[color:var(--profile-sheet-text)] shadow-[24px_0_70px_var(--profile-sheet-shadow)] backdrop-blur-3xl transition-transform duration-250 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-[105%]'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--profile-sheet-border-strong)] bg-[color:var(--profile-sheet-surface-strong)] shadow-[0_16px_30px_var(--profile-sheet-shadow)]">
              <img
                src={avatarSrc}
                alt={displayUserName ? `Profilo ${displayUserName}` : 'Profilo utente'}
                onError={() => setAvatarSrc(DEFAULT_PROFILE_AVATAR_URL)}
                className="h-full w-full object-cover"
              />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[1.15rem] font-semibold tracking-[-0.01em] text-[color:var(--profile-sheet-title)]">
                {displayUserName}
              </h2>
              <p className="mt-0.5 truncate text-xs font-medium text-[color:var(--profile-sheet-muted)]">{displayUserEmail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-muted)] transition-colors hover:bg-[color:var(--profile-sheet-surface-strong)] hover:text-[color:var(--profile-sheet-title)]"
            aria-label="Chiudi menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 h-px bg-[color:var(--profile-sheet-border)]" />

        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1 glass-scrollbar">
              {menuEntries.map((entry) => {
                const Icon = PATH_ICONS[entry.icon] ?? LayoutGrid;
                const active = isEditMode
                  ? selectedPathId === entry.id
                  : isPathActiveForCurrentLocation(entry.path);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handlePathClick(entry)}
                    className={`group relative flex w-full min-w-0 items-center gap-3 rounded-xl px-0 py-3 text-left transition-colors ${
                      active
                        ? 'text-[color:var(--profile-sheet-title)]'
                        : 'text-[color:var(--profile-sheet-muted)] hover:text-[color:var(--profile-sheet-title)]'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span
                      className={`absolute -left-5 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition-opacity ${
                        active ? 'bg-[color:rgb(var(--profile-sheet-accent-rgb)/0.9)] opacity-100' : 'opacity-0'
                      }`}
                      aria-hidden
                    />
                    <span
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        active
                          ? 'text-[color:rgb(var(--profile-sheet-accent-rgb)/0.98)]'
                          : 'text-[color:var(--profile-sheet-muted)] group-hover:text-[color:var(--profile-sheet-title)]'
                      }`}
                    >
                      <Icon size={19} strokeWidth={active ? 1.85 : 2} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[0.95rem] font-semibold">{entry.label}</span>
                  </button>
                );
              })}
            </nav>

          <div className="mt-5 border-t border-[color:var(--profile-sheet-border)] pt-4">
            {isLogoutConfirmOpen ? (
              <div className="mb-3 rounded-2xl border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] p-3 shadow-[0_14px_36px_var(--profile-sheet-shadow-soft)]">
                <p className="text-sm font-semibold text-[color:var(--profile-sheet-title)]">Disconnettere Home Assistant?</p>
                <p className="mt-1 text-xs font-medium text-[color:var(--profile-sheet-muted)]">
                  La dashboard perdera la connessione finche non effettui un nuovo accesso.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLogoutConfirmOpen(false)}
                    className="rounded-xl border border-[color:var(--profile-sheet-border)] px-3 py-2 text-xs font-bold text-[color:var(--profile-sheet-title)] transition-colors hover:bg-[color:var(--profile-sheet-surface-strong)]"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleLogoutConfirm}
                    className="rounded-xl bg-red-500/90 px-3 py-2 text-xs font-bold text-white shadow-[0_10px_22px_rgba(220,38,38,0.28)] transition-colors hover:bg-red-500"
                  >
                    Esci
                  </button>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/28 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-500/16"
            >
              <LogOut size={17} />
              Log out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
