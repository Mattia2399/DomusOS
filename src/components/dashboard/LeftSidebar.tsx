import React from 'react';
import {
  BarChart3,
  Bell,
  DoorOpen,
  HelpCircle,
  Home,
  LayoutGrid,
  Lightbulb,
  MoreHorizontal,
  Music2,
  MonitorSmartphone,
  PencilLine,
  Rocket,
  Settings,
  ShieldCheck,
  Thermometer,
  Trash2,
  X,
} from 'lucide-react';
import type { SidebarQuickPath, SidebarQuickPathIconKey } from '../../hooks/useProfileSettings';
import type { HaConnectionStatus } from '../../hooks/useHaLiveConnection';
import { useNotifications } from '../../context/NotificationProvider';
import { isPathActiveForCurrentLocation } from '../../utils/navigationPathMatch';
import { NotificationLiquidItem } from './NotificationLiquidItem';

type LeftSidebarProps = {
  isEditMode: boolean;
  userAvatarUrl?: string;
  userAvatarAlt?: string;
  haStatus: HaConnectionStatus;
  quickPaths: SidebarQuickPath[];
  selectedPathId?: string | null;
  isSettingsActive?: boolean;
  canToggleEditMode: boolean;
  onPathClick: (entry: SidebarQuickPath) => void;
  onToggleEditMode: () => void;
  onOpenProfile: () => void;
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

const DEFAULT_PROFILE_AVATAR_URL =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop';

type NotificationFilter = 'all' | 'unread' | 'alert';

const NOTIFICATION_FILTERS: Array<{ id: NotificationFilter; label: string }> = [
  { id: 'all', label: 'Tutte' },
  { id: 'unread', label: 'Non lette' },
  { id: 'alert', label: 'Alert' },
];

const COMPACT_PRIMARY_PATH_KEYS = ['home', 'rooms', 'security', 'consumi'] as const;
type CompactPrimaryPathKey = (typeof COMPACT_PRIMARY_PATH_KEYS)[number];
const COMPACT_SIDEBAR_MIN_WIDTH_PX = 768;
const COMPACT_SIDEBAR_MAX_WIDTH_PX = 1535;
const COMPACT_SIDEBAR_MAX_HEIGHT_PX = 760;
const COMPACT_PRIMARY_PATHS: Record<CompactPrimaryPathKey, SidebarQuickPath> = {
  home: { id: 'compact-home', label: 'Home', path: '/home', icon: 'home' },
  rooms: { id: 'compact-rooms', label: 'Stanze', path: '/rooms', icon: 'rooms' },
  security: { id: 'compact-security', label: 'Sicurezza', path: '/security', icon: 'security' },
  consumi: { id: 'compact-consumi', label: 'Consumi', path: '/consumi', icon: 'chart' },
};

function resolveCompactPathKey(entry: SidebarQuickPath): CompactPrimaryPathKey | null {
  const path = entry.path.trim().toLowerCase();
  const identity = `${entry.id} ${entry.label}`.trim().toLowerCase();

  if (
    path.includes('/home') ||
    path.includes('#home') ||
    path.includes('view=home') ||
    identity.includes('home')
  ) {
    return 'home';
  }

  if (
    path.includes('/rooms') ||
    path.includes('#rooms') ||
    path.includes('view=rooms') ||
    identity.includes('rooms') ||
    identity.includes('stanze')
  ) {
    return 'rooms';
  }

  if (
    path.includes('/security') ||
    path.includes('#security') ||
    path.includes('view=security') ||
    identity.includes('security') ||
    identity.includes('sicurezza')
  ) {
    return 'security';
  }

  if (
    path.includes('/consumi') ||
    path.includes('#consumi') ||
    path.includes('view=consumi') ||
    identity.includes('consumi')
  ) {
    return 'consumi';
  }

  return null;
}

function resolveCompactQuickPathGroups(paths: SidebarQuickPath[]) {
  return {
    visibleQuickPaths: COMPACT_PRIMARY_PATH_KEYS.map((key) => {
      const savedEntry = paths.find((entry) => resolveCompactPathKey(entry) === key);
      return {
        ...COMPACT_PRIMARY_PATHS[key],
        id: savedEntry?.id ?? COMPACT_PRIMARY_PATHS[key].id,
      };
    }),
    hiddenQuickPaths: paths.filter((entry) => resolveCompactPathKey(entry) === null),
  };
}

export function LeftSidebar({
  isEditMode,
  userAvatarUrl,
  userAvatarAlt,
  haStatus,
  quickPaths,
  selectedPathId = null,
  isSettingsActive = false,
  canToggleEditMode,
  onPathClick,
  onToggleEditMode,
  onOpenProfile,
  onOpenSettings,
}: LeftSidebarProps) {
  const statusDotClass =
    haStatus === 'connected'
      ? 'bg-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]'
      : haStatus === 'connecting'
        ? 'bg-amber-300 animate-pulse shadow-[0_0_0_2px_rgba(245,158,11,0.2)]'
        : haStatus === 'error'
          ? 'bg-rose-400 shadow-[0_0_0_2px_rgba(244,63,94,0.22)]'
          : 'bg-white/45 shadow-[0_0_0_2px_rgba(255,255,255,0.14)]';
  const [profileAvatarSrc, setProfileAvatarSrc] = React.useState(userAvatarUrl ?? DEFAULT_PROFILE_AVATAR_URL);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isCompactSidebar, setIsCompactSidebar] = React.useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);
  const [notificationFilter, setNotificationFilter] = React.useState<NotificationFilter>('all');
  const {
    notifications,
    unreadCount,
    removeNotification,
    clearNotifications,
    markNotificationAsRead,
    markAllAsRead,
  } = useNotifications();

  React.useEffect(() => {
    setProfileAvatarSrc(userAvatarUrl ?? DEFAULT_PROFILE_AVATAR_URL);
  }, [userAvatarUrl]);

  React.useEffect(() => {
    const updateSidebarDensity = () => {
      setIsCompactSidebar(
        window.innerWidth >= COMPACT_SIDEBAR_MIN_WIDTH_PX &&
          (window.innerWidth <= COMPACT_SIDEBAR_MAX_WIDTH_PX || window.innerHeight <= COMPACT_SIDEBAR_MAX_HEIGHT_PX),
      );
    };

    updateSidebarDensity();
    window.addEventListener('resize', updateSidebarDensity);
    return () => window.removeEventListener('resize', updateSidebarDensity);
  }, []);

  React.useEffect(() => {
    if (!isNotificationsOpen && !isMoreMenuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsMoreMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMoreMenuOpen, isNotificationsOpen]);

  React.useEffect(() => {
    if (!isCompactSidebar) {
      setIsMoreMenuOpen(false);
    }
  }, [isCompactSidebar]);

  const badgeValue = unreadCount > 99 ? '99+' : `${unreadCount}`;
  const alertCount = notifications.filter((notification) => notification.type === 'alert').length;
  const visibleNotifications = notifications.filter((notification) => {
    if (notificationFilter === 'unread') {
      return !notification.read;
    }
    if (notificationFilter === 'alert') {
      return notification.type === 'alert';
    }
    return true;
  });
  const emptyNotificationText =
    notifications.length === 0
      ? 'Nessuna notifica al momento.'
      : notificationFilter === 'unread'
        ? 'Nessuna notifica non letta.'
        : notificationFilter === 'alert'
          ? 'Nessun alert da mostrare.'
          : 'Nessuna notifica per questo filtro.';
  const { visibleQuickPaths, hiddenQuickPaths } = isCompactSidebar
    ? resolveCompactQuickPathGroups(quickPaths)
    : { visibleQuickPaths: quickPaths, hiddenQuickPaths: [] };
  const isPathEntryActive = (entry: SidebarQuickPath) =>
    isEditMode ? selectedPathId === entry.id : isPathActiveForCurrentLocation(entry.path);
  const moreMenuActionCount = hiddenQuickPaths.length + (isCompactSidebar ? 1 : 0);
  const shouldShowMoreMenu = isCompactSidebar && moreMenuActionCount > 0;
  const isMoreActive = hiddenQuickPaths.some(isPathEntryActive) || (isCompactSidebar && isEditMode);
  const sidebarWidthClass = isCompactSidebar ? 'w-14 sm:w-[3.75rem] lg:w-[4.25rem]' : 'w-14 sm:w-16 lg:w-20';
  const sidebarPaddingClass = isCompactSidebar ? 'py-4 sm:py-5' : 'py-5 sm:py-7';
  const profileMarginClass = isCompactSidebar ? 'mb-5 sm:mb-6' : 'mb-8 sm:mb-10';
  const navGapClass = isCompactSidebar ? 'gap-2 sm:gap-3' : 'gap-4 sm:gap-6';
  const navButtonSizeClass = isCompactSidebar
    ? 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl'
    : 'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl';
  const iconSize = isCompactSidebar ? 19 : 21;
  const utilityIconSize = isCompactSidebar ? 18 : 20;

  return (
    <>
      {isMoreMenuOpen ? (
        <button
          type="button"
          onClick={() => setIsMoreMenuOpen(false)}
          aria-label="Chiudi menu altre sezioni"
          className="fixed inset-0 z-[45] bg-transparent"
        />
      ) : null}

      {isNotificationsOpen ? (
        <button
          type="button"
          onClick={() => setIsNotificationsOpen(false)}
          aria-label="Chiudi notifiche"
          className="fixed inset-0 z-[160] bg-black/35 backdrop-blur-[2px]"
        />
      ) : null}

      {isNotificationsOpen ? (
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Centro notifiche"
          className="fixed bottom-4 right-4 top-4 z-[170] flex w-[min(28rem,calc(100vw-7rem))] flex-col overflow-hidden rounded-[2rem] border border-[color:var(--profile-sheet-border)] bg-[var(--profile-sheet-bg)] text-[color:var(--profile-sheet-text)] shadow-[0_32px_90px_var(--profile-sheet-shadow)] backdrop-blur-3xl"
        >
          <header className="shrink-0 border-b border-[color:var(--profile-sheet-border)] px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--profile-sheet-muted)]">Centro notifiche</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.01em] text-[color:var(--profile-sheet-title)]">Notifiche</h2>
                <p className="mt-1 text-xs font-semibold text-[color:var(--profile-sheet-muted)]">
                  {notifications.length} totali / {unreadCount} non lette / {alertCount} alert
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="rounded-full border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] px-3 py-2 text-xs font-bold text-[color:var(--profile-sheet-title)] transition-colors hover:bg-[color:var(--profile-sheet-surface-strong)]"
                  >
                    Segna lette
                  </button>
                ) : null}
                {notifications.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearNotifications}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-muted)] transition-colors hover:bg-[color:var(--profile-sheet-surface-strong)] hover:text-[color:var(--profile-sheet-title)]"
                    aria-label="Cancella notifiche"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-muted)] transition-colors hover:bg-[color:var(--profile-sheet-surface-strong)] hover:text-[color:var(--profile-sheet-title)]"
                  aria-label="Chiudi notifiche"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="liquid-segmented-control mt-4 grid grid-cols-3 gap-1">
              {NOTIFICATION_FILTERS.map((filter) => {
                const active = notificationFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setNotificationFilter(filter.id)}
                    className={`rounded-full px-3 py-2 text-xs font-bold transition-all active:scale-[0.96] ${
                      active
                        ? 'liquid-segmented-option-active'
                        : 'liquid-segmented-option-inactive'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 glass-scrollbar">
            {visibleNotifications.length === 0 ? (
              <div className="flex min-h-[18rem] flex-col items-center justify-center text-center">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-muted)]">
                  <Bell size={22} />
                </span>
                <p className="mt-4 text-sm font-semibold text-[color:var(--profile-sheet-title)]">{emptyNotificationText}</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {visibleNotifications.map((notification) => (
                  <NotificationLiquidItem
                    key={notification.id}
                    notification={notification}
                    onRead={markNotificationAsRead}
                    onRemove={removeNotification}
                  />
                ))}
              </ul>
            )}
          </div>
        </aside>
      ) : null}

      <aside className={`liquid-glass-panel relative z-50 ${sidebarWidthClass} h-full min-h-0`}>
      {isMoreMenuOpen && shouldShowMoreMenu ? (
        <div className="absolute left-[calc(100%+0.7rem)] top-1/2 z-[70] w-56 -translate-y-1/2 rounded-2xl border border-white/12 bg-[#10131c]/92 p-2 shadow-[0_22px_60px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
          <button
            type="button"
            onClick={() => {
              setIsMoreMenuOpen(false);
              onToggleEditMode();
            }}
            disabled={!canToggleEditMode}
            aria-label="Toggle edit mode"
            aria-pressed={isEditMode}
            title={
              canToggleEditMode
                ? isEditMode
                  ? 'Esci da modifica'
                  : 'Modalita modifica'
                : 'Modifica disponibile su Home, Consumi, App Gallery e Sicurezza'
            }
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
              isEditMode
                ? 'bg-blue-500/20 text-blue-100'
                : 'text-white/68 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
              <PencilLine size={17} />
            </span>
            <span className="min-w-0 flex-1 truncate">Edit</span>
          </button>
          {hiddenQuickPaths.length > 0 ? <div className="my-1.5 h-px bg-white/10" /> : null}
          {hiddenQuickPaths.map((entry) => {
            const Icon = PATH_ICONS[entry.icon] ?? LayoutGrid;
            const active = isPathEntryActive(entry);
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onPathClick(entry);
                }}
                title={`${entry.label} (${entry.path})`}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-blue-500/20 text-blue-100'
                    : 'text-white/68 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                  <Icon size={17} strokeWidth={active ? 1.85 : 2} fill={active ? 'currentColor' : 'none'} />
                </span>
                <span className="min-w-0 flex-1 truncate">{entry.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className={`relative z-10 h-full min-h-0 flex flex-col items-center ${sidebarPaddingClass}`}>
        <button
          type="button"
          onClick={onOpenProfile}
          className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-visible ${profileMarginClass} border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/60`}
          aria-label="Apri profilo"
          title={`Home Assistant: ${haStatus}`}
        >
          <img
            src={profileAvatarSrc}
            alt={userAvatarAlt ? `Profilo ${userAvatarAlt}` : 'Profilo utente'}
            onError={() => setProfileAvatarSrc(DEFAULT_PROFILE_AVATAR_URL)}
            className="w-full h-full rounded-full object-cover"
          />
          <span
            className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border border-[#0b0d12] ${statusDotClass}`}
            aria-hidden="true"
          />
        </button>

        <nav className={`flex flex-col ${navGapClass} flex-1 overflow-y-auto hide-scrollbar`}>
          {visibleQuickPaths.map((entry) => {
            const Icon = PATH_ICONS[entry.icon] ?? LayoutGrid;
            const active = isPathEntryActive(entry);
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onPathClick(entry)}
                title={`${entry.label} (${entry.path})`}
                className={`group ${navButtonSizeClass} flex items-center justify-center transition-colors ${
                  active
                    ? 'text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                aria-label={`Apri ${entry.label}`}
              >
                <Icon
                  size={iconSize}
                  strokeWidth={active ? 1.85 : 2}
                  fill={active ? 'currentColor' : 'none'}
                  className={active ? '' : 'group-hover:scale-105 transition-transform'}
                />
              </button>
            );
          })}
          {shouldShowMoreMenu ? (
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen(false);
                setIsMoreMenuOpen((prev) => !prev);
              }}
              aria-label="Apri altre sezioni"
              aria-expanded={isMoreMenuOpen}
              title="Altre sezioni"
              className={`group relative ${navButtonSizeClass} flex items-center justify-center transition-colors ${
                isMoreActive || isMoreMenuOpen
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <MoreHorizontal size={utilityIconSize} />
              <span className="absolute -right-1 -top-1 min-w-[1.05rem] h-[1.05rem] px-1 rounded-full bg-white/[0.12] text-[9px] font-semibold leading-[1.05rem] text-white/80 text-center shadow-[0_0_0_2px_rgba(11,13,18,0.88)]">
                {moreMenuActionCount}
              </span>
            </button>
          ) : null}
        </nav>

        {!isCompactSidebar ? (
          <div className="relative mb-3">
            <button
              type="button"
              onClick={onToggleEditMode}
              disabled={!canToggleEditMode}
              aria-label="Toggle edit mode"
              aria-pressed={isEditMode}
              title={
                canToggleEditMode
                  ? isEditMode
                    ? 'Esci da modifica'
                    : 'Modalita modifica'
                  : 'Modifica disponibile su Home, Consumi, App Gallery e Sicurezza'
              }
              className={`${navButtonSizeClass} flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                isEditMode
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <PencilLine size={utilityIconSize} />
            </button>
          </div>
        ) : null}

        <div className={`relative ${isCompactSidebar ? 'mb-2' : 'mb-4'}`}>
          <button
            type="button"
            onClick={() => {
              setIsMoreMenuOpen(false);
              setIsNotificationsOpen((prev) => !prev);
            }}
            className={`relative ${navButtonSizeClass} flex items-center justify-center transition-colors ${
              isNotificationsOpen
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            aria-label="Apri notifiche"
          >
            <Bell size={utilityIconSize} />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-[10px] font-semibold leading-[1.15rem] text-white text-center shadow-[0_0_0_2px_rgba(11,13,18,0.9)]">
                {badgeValue}
              </span>
            ) : null}
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className={`${navButtonSizeClass} flex items-center justify-center transition-colors ${
            isSettingsActive
              ? 'bg-blue-500/20 text-blue-300'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
          aria-label="Apri impostazioni"
          title="Impostazioni"
        >
          <Settings size={utilityIconSize} />
        </button>

      </div>
      </aside>
    </>
  );
}
