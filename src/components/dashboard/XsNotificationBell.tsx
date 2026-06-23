import React from 'react';
import { AlertTriangle, Bell, Info, OctagonAlert, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationProvider';

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

export function XsNotificationBell() {
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
          className="fixed inset-0 z-[186] bg-black/60 backdrop-blur-3xl"
        />
      ) : null}

      <div className="flex items-center gap-1.5">
        <div className="relative">
          <button
            ref={notificationButtonRef}
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-title)] shadow-[0_10px_26px_var(--profile-sheet-shadow)] backdrop-blur-2xl transition-all hover:bg-[color:var(--profile-sheet-surface-strong)] active:scale-95"
            aria-label="Apri notifiche"
          >
            <Bell size={18} />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-[1.15rem] rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-[1.15rem] text-white shadow-[0_0_0_2px_rgba(11,13,18,0.9)]">
                {badgeValue}
              </span>
            ) : null}
          </button>

          {isNotificationsOpen ? (
            <div
              ref={notificationPopupRef}
              className="absolute right-0 top-[3.15rem] z-[191] flex max-h-[72dvh] w-[21rem] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-[2.1rem] border border-[color:var(--profile-sheet-border)] bg-[var(--profile-sheet-bg)] p-3 text-[color:var(--profile-sheet-text)] shadow-[0_32px_90px_var(--profile-sheet-shadow)] backdrop-blur-3xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--profile-sheet-muted)]">Centro notifiche</p>
                  <h4 className="mt-1 text-sm font-semibold text-[color:var(--profile-sheet-title)]">Notifiche recenti</h4>
                </div>
                {notifications.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearNotifications}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-muted)] transition-colors hover:bg-[color:var(--profile-sheet-surface-strong)] hover:text-[color:var(--profile-sheet-title)]"
                    aria-label="Cancella notifiche"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>

              {notifications.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] px-3 py-3 text-sm text-[color:var(--profile-sheet-muted)]">
                  Nessuna notifica al momento.
                </p>
              ) : (
                <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain glass-scrollbar [touch-action:pan-y] [-webkit-overflow-scrolling:touch] pr-1">
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
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-[11px] text-white/65 transition-colors hover:bg-white/10 hover:text-white"
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
    </>
  );
}
