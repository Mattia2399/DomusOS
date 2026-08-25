import React from 'react';
import {
  Bell,
  MoreHorizontal,
  PencilLine,
  Settings,
} from 'lucide-react';
import type { SidebarQuickPath } from '../../hooks/useProfileSettings';
import type { HaConnectionStatus } from '../../hooks/useHaLiveConnection';
import { useNotifications } from '../../context/NotificationProvider';
import { DashboardProfileAvatar } from './DashboardProfileAvatar';
import { DashboardNotificationsPanel } from './DashboardNotificationsPanel';
import {
  getDashboardNavigationIcon,
  isDashboardNavigationEntryActive,
  isPrimaryDashboardNavigationEntry,
  PRIMARY_DASHBOARD_ROUTE_IDS,
  resolveDashboardNavigationEntries,
} from './dashboardNavigation';

type LeftSidebarProps = {
  isEditMode: boolean;
  userAvatarUrl?: string;
  userAvatarAlt?: string;
  haStatus: HaConnectionStatus;
  quickPaths: SidebarQuickPath[];
  selectedPathId?: string | null;
  activeRoute?: string;
  isSettingsActive?: boolean;
  isEditTourActive?: boolean;
  canToggleEditMode: boolean;
  onPathClick: (entry: SidebarQuickPath) => void;
  onToggleEditMode: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onPrefetchRoute?: (path: string) => void;
  onPrefetchEditMode?: () => void;
};

const COMPACT_SIDEBAR_MIN_WIDTH_PX = 768;
const COMPACT_SIDEBAR_MAX_WIDTH_PX = 1535;
const COMPACT_SIDEBAR_MAX_HEIGHT_PX = 760;

function resolveCompactQuickPathGroups(paths: SidebarQuickPath[]) {
  return {
    visibleQuickPaths: resolveDashboardNavigationEntries(paths, PRIMARY_DASHBOARD_ROUTE_IDS),
    hiddenQuickPaths: paths.filter((entry) => !isPrimaryDashboardNavigationEntry(entry)),
  };
}

export function LeftSidebar({
  isEditMode,
  userAvatarUrl,
  userAvatarAlt,
  haStatus,
  quickPaths,
  selectedPathId = null,
  activeRoute,
  isSettingsActive = false,
  isEditTourActive = false,
  canToggleEditMode,
  onPathClick,
  onToggleEditMode,
  onOpenProfile,
  onOpenSettings,
  onPrefetchRoute,
  onPrefetchEditMode,
}: LeftSidebarProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isCompactSidebar, setIsCompactSidebar] = React.useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);
  const { unreadCount } = useNotifications();

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
    if (!isMoreMenuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMoreMenuOpen]);

  React.useEffect(() => {
    if (!isCompactSidebar) {
      setIsMoreMenuOpen(false);
    }
  }, [isCompactSidebar]);

  React.useEffect(() => {
    if (isEditTourActive && isCompactSidebar) {
      setIsMoreMenuOpen(true);
    }
  }, [isCompactSidebar, isEditTourActive]);

  const badgeValue = unreadCount > 99 ? '99+' : `${unreadCount}`;
  const { visibleQuickPaths, hiddenQuickPaths } = isCompactSidebar
    ? resolveCompactQuickPathGroups(quickPaths)
    : { visibleQuickPaths: quickPaths, hiddenQuickPaths: [] };
  const isPathEntryActive = (entry: SidebarQuickPath) =>
    isDashboardNavigationEntryActive({ entry, isEditMode, selectedPathId, activeRoute });
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

      <DashboardNotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <aside className={`liquid-glass-panel relative z-50 ${sidebarWidthClass} h-full min-h-0`}>
      {isMoreMenuOpen && shouldShowMoreMenu ? (
        <div className="liquid-glass-navigation absolute left-[calc(100%+0.7rem)] top-1/2 z-[70] w-56 -translate-y-1/2 rounded-2xl p-2 text-[color:var(--ui-text-primary)]">
          <button
            type="button"
            data-tour-target="edit-mode"
            onPointerEnter={onPrefetchEditMode}
            onPointerDown={onPrefetchEditMode}
            onFocus={onPrefetchEditMode}
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
                ? 'bg-[color:rgb(var(--ui-accent-rgb)/0.18)] text-[color:var(--ui-accent)]'
                : 'text-[color:var(--ui-text-secondary)] hover:bg-[color:var(--ui-fill-tertiary)] hover:text-[color:var(--ui-text-primary)]'
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--ui-fill-tertiary)]">
              <PencilLine size={17} />
            </span>
            <span className="min-w-0 flex-1 truncate">Edit</span>
          </button>
          {hiddenQuickPaths.length > 0 ? <div className="my-1.5 h-px bg-[color:var(--ui-separator)]" /> : null}
          {hiddenQuickPaths.map((entry) => {
            const Icon = getDashboardNavigationIcon(entry.icon);
            const active = isPathEntryActive(entry);
            return (
              <button
                key={entry.id}
                type="button"
                onPointerEnter={() => onPrefetchRoute?.(entry.path)}
                onPointerDown={() => onPrefetchRoute?.(entry.path)}
                onFocus={() => onPrefetchRoute?.(entry.path)}
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onPathClick(entry);
                }}
                aria-current={active ? 'page' : undefined}
                title={`${entry.label} (${entry.path})`}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  active
                    ? 'liquid-glass-selection text-[color:var(--ui-accent)]'
                    : 'text-[color:var(--ui-text-secondary)] hover:bg-[color:var(--ui-fill-tertiary)] hover:text-[color:var(--ui-text-primary)]'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--ui-fill-tertiary)]">
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
          onPointerEnter={() => onPrefetchRoute?.('/profile')}
          onPointerDown={() => onPrefetchRoute?.('/profile')}
          onFocus={() => onPrefetchRoute?.('/profile')}
          onClick={onOpenProfile}
          className={`relative h-9 w-9 overflow-visible rounded-full sm:h-10 sm:w-10 ${profileMarginClass} focus:outline-none focus:ring-2 focus:ring-[color:var(--ui-focus-ring)]`}
          aria-label="Apri profilo"
          title={`Home Assistant: ${haStatus}`}
        >
          <DashboardProfileAvatar
            userAvatarUrl={userAvatarUrl}
            userName={userAvatarAlt}
            haStatus={haStatus}
          />
        </button>

        <nav className={`flex flex-col ${navGapClass} flex-1 overflow-y-auto hide-scrollbar`}>
          {visibleQuickPaths.map((entry) => {
            const Icon = getDashboardNavigationIcon(entry.icon);
            const active = isPathEntryActive(entry);
            return (
              <button
                key={entry.id}
                type="button"
                onPointerEnter={() => onPrefetchRoute?.(entry.path)}
                onPointerDown={() => onPrefetchRoute?.(entry.path)}
                onFocus={() => onPrefetchRoute?.(entry.path)}
                onClick={() => onPathClick(entry)}
                title={`${entry.label} (${entry.path})`}
                aria-current={active ? 'page' : undefined}
                className={`group ${navButtonSizeClass} flex items-center justify-center transition-colors ${
                  active
                    ? 'liquid-glass-selection text-[color:var(--ui-accent)]'
                    : 'text-[color:var(--ui-text-secondary)] hover:text-[color:var(--ui-text-primary)] hover:bg-[color:var(--ui-fill-tertiary)]'
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
                  ? 'liquid-glass-selection text-[color:var(--ui-accent)]'
                  : 'text-[color:var(--ui-text-secondary)] hover:text-[color:var(--ui-text-primary)] hover:bg-[color:var(--ui-fill-tertiary)]'
              }`}
            >
              <MoreHorizontal size={utilityIconSize} />
              <span className="absolute -right-1 -top-1 min-w-[1.05rem] h-[1.05rem] px-1 rounded-full bg-[color:var(--ui-fill-primary)] text-[9px] font-semibold leading-[1.05rem] text-[color:var(--ui-text-primary)] text-center shadow-[0_0_0_2px_var(--ui-bg-elevated)]">
                {moreMenuActionCount}
              </span>
            </button>
          ) : null}
        </nav>

        {!isCompactSidebar ? (
          <div className="relative mb-3">
            <button
              type="button"
              data-tour-target="edit-mode"
              onPointerEnter={onPrefetchEditMode}
              onPointerDown={onPrefetchEditMode}
              onFocus={onPrefetchEditMode}
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
                  ? 'liquid-glass-selection text-[color:var(--ui-accent)]'
                  : 'text-[color:var(--ui-text-secondary)] hover:text-[color:var(--ui-text-primary)] hover:bg-[color:var(--ui-fill-tertiary)]'
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
                ? 'liquid-glass-selection text-[color:var(--ui-accent)]'
                : 'text-[color:var(--ui-text-secondary)] hover:text-[color:var(--ui-text-primary)] hover:bg-[color:var(--ui-fill-tertiary)]'
            }`}
            aria-label="Apri notifiche"
          >
            <Bell size={utilityIconSize} />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-[color:var(--ui-danger)] text-[10px] font-semibold leading-[1.15rem] text-[color:var(--ui-danger-contrast)] text-center shadow-[0_0_0_2px_var(--ui-bg-elevated)]">
                {badgeValue}
              </span>
            ) : null}
          </button>
        </div>

        <button
          type="button"
          onPointerEnter={() => onPrefetchRoute?.('/settings')}
          onPointerDown={() => onPrefetchRoute?.('/settings')}
          onFocus={() => onPrefetchRoute?.('/settings')}
          onClick={onOpenSettings}
          className={`${navButtonSizeClass} flex items-center justify-center transition-colors ${
            isSettingsActive
              ? 'liquid-glass-selection text-[color:var(--ui-accent)]'
              : 'text-[color:var(--ui-text-secondary)] hover:text-[color:var(--ui-text-primary)] hover:bg-[color:var(--ui-fill-tertiary)]'
          }`}
          aria-label="Apri impostazioni"
          aria-current={isSettingsActive ? 'page' : undefined}
          title="Impostazioni"
        >
          <Settings size={utilityIconSize} />
        </button>

      </div>
      </aside>
    </>
  );
}
