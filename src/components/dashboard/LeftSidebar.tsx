import React from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  DoorOpen,
  HelpCircle,
  Home,
  Info,
  LayoutGrid,
  Lightbulb,
  Music2,
  MonitorSmartphone,
  OctagonAlert,
  PencilLine,
  Rocket,
  Settings,
  ShieldCheck,
  Thermometer,
  Trash2,
} from 'lucide-react';
import type { SidebarQuickPath, SidebarQuickPathIconKey } from '../../hooks/useProfileSettings';
import type { HaConnectionStatus } from '../../hooks/useHaLiveConnection';
import { useNotifications } from '../../context/NotificationProvider';
import { isPathActiveForCurrentLocation } from '../../utils/navigationPathMatch';

type LeftSidebarProps = {
  isEditMode: boolean;
  canToggleEditMode: boolean;
  userAvatarUrl?: string;
  userAvatarAlt?: string;
  haStatus: HaConnectionStatus;
  quickPaths: SidebarQuickPath[];
  selectedPathId?: string | null;
  onPathClick: (entry: SidebarQuickPath) => void;
  onToggleEditMode: () => void;
  onOpenProfile: () => void;
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

const NOTIFICATION_TYPE_META = {
  info: {
    Icon: Info,
    iconClassName: 'text-blue-300',
    rowClassName: 'bg-blue-900/25 border-blue-300/15',
  },
  warning: {
    Icon: AlertTriangle,
    iconClassName: 'text-orange-300',
    rowClassName: 'bg-orange-900/25 border-orange-300/15',
  },
  alert: {
    Icon: OctagonAlert,
    iconClassName: 'text-red-300',
    rowClassName: 'bg-red-900/25 border-red-300/15',
  },
} as const;

function formatNotificationTime(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '';
  }
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

export function LeftSidebar({
  isEditMode,
  canToggleEditMode,
  userAvatarUrl,
  userAvatarAlt,
  haStatus,
  quickPaths,
  selectedPathId = null,
  onPathClick,
  onToggleEditMode,
  onOpenProfile,
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
  const notificationPopupRef = React.useRef<HTMLDivElement | null>(null);
  const notificationButtonRef = React.useRef<HTMLButtonElement | null>(null);
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
    if (!isNotificationsOpen) {
      return;
    }
    markAllAsRead();
  }, [isNotificationsOpen, markAllAsRead, notifications.length]);

  React.useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) {
        return;
      }
      if (notificationPopupRef.current?.contains(targetNode)) {
        return;
      }
      if (notificationButtonRef.current?.contains(targetNode)) {
        return;
      }
      setIsNotificationsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isNotificationsOpen]);

  const badgeValue = unreadCount > 99 ? '99+' : `${unreadCount}`;

  return (
    <>
      {isNotificationsOpen ? (
        <button
          type="button"
          onClick={() => setIsNotificationsOpen(false)}
          aria-label="Chiudi notifiche"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]"
        />
      ) : null}

      <aside className="liquid-glass-panel relative z-50 w-14 sm:w-16 lg:w-20 h-full min-h-0">
      <div className="relative z-10 h-full min-h-0 flex flex-col items-center py-5 sm:py-7">
        <button
          type="button"
          onClick={onOpenProfile}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-visible mb-8 sm:mb-10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
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

        <nav className="flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto hide-scrollbar">
          {quickPaths.map((entry) => {
            const Icon = PATH_ICONS[entry.icon] ?? LayoutGrid;
            const active = isEditMode
              ? selectedPathId === entry.id
              : isPathActiveForCurrentLocation(entry.path);
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onPathClick(entry)}
                title={`${entry.label} (${entry.path})`}
                className={`group w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-colors ${
                  active
                    ? 'text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                aria-label={`Apri ${entry.label}`}
              >
                <Icon
                  size={21}
                  strokeWidth={active ? 1.85 : 2}
                  fill={active ? 'currentColor' : 'none'}
                  className={active ? '' : 'group-hover:scale-105 transition-transform'}
                />
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onToggleEditMode}
          disabled={!canToggleEditMode}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4 ${
            !canToggleEditMode
              ? 'text-white/20 cursor-not-allowed'
              : isEditMode
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
          aria-label="Toggle edit mode"
          title={canToggleEditMode ? 'Attiva/disattiva modalita modifica' : 'Disponibile solo nelle view supportate'}
        >
          <PencilLine size={20} />
        </button>

        <div className="relative mb-4">
          <button
            ref={notificationButtonRef}
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-colors ${
              isNotificationsOpen
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            aria-label="Apri notifiche"
          >
            <Bell size={20} />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-[10px] font-semibold leading-[1.15rem] text-white text-center shadow-[0_0_0_2px_rgba(11,13,18,0.9)]">
                {badgeValue}
              </span>
            ) : null}
          </button>

          {isNotificationsOpen ? (
            <div
              ref={notificationPopupRef}
              className="liquid-glass-panel absolute z-[60] bottom-0 left-full ml-5 w-[22rem] max-w-[calc(100vw-7rem)] rounded-[1.5rem] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Centro notifiche</p>
                  <h4 className="mt-1 text-sm font-semibold text-white">Notifiche recenti</h4>
                </div>
                {notifications.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearNotifications}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Cancella notifiche"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>

              {notifications.length === 0 ? (
                <p className="liquid-glass-card mt-4 rounded-xl px-3 py-3 text-sm text-white/60">
                  Nessuna notifica al momento.
                </p>
              ) : (
                <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto glass-scrollbar pr-1">
                  {notifications.map((notification) => {
                    const meta =
                      NOTIFICATION_TYPE_META[
                        notification.type as keyof typeof NOTIFICATION_TYPE_META
                      ] ?? NOTIFICATION_TYPE_META.info;
                    const NotificationIcon = meta.Icon;
                    const timeLabel = formatNotificationTime(notification.createdAt);

                    return (
                      <li
                        key={notification.id}
                        onMouseEnter={() => markNotificationAsRead(notification.id)}
                        className={`rounded-2xl border p-3 transition-colors ${meta.rowClassName} ${
                          notification.read ? 'opacity-70' : 'opacity-100'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <NotificationIcon size={16} className={`mt-0.5 shrink-0 ${meta.iconClassName}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white/95">{notification.message}</p>
                            <p className="mt-1 text-[11px] text-white/45">{timeLabel}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNotification(notification.id)}
                            className="btn-premium inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] text-[11px] text-white/65 shadow-lg backdrop-blur-xl transition-colors hover:bg-white/[0.08] hover:text-white"
                            aria-label="Rimuovi notifica"
                          >
                            x
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>

      </div>
      </aside>
    </>
  );
}
