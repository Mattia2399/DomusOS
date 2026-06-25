import React from 'react';
import { ArrowLeft, Bell, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationProvider';
import { NotificationLiquidItem } from './NotificationLiquidItem';

export function XsNotificationBell() {
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
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

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isNotificationsOpen]);

  const badgeValue = unreadCount > 99 ? '99+' : `${unreadCount}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsNotificationsOpen(true)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-title)] shadow-[0_10px_26px_var(--profile-sheet-shadow)] backdrop-blur-2xl transition-all hover:bg-[color:var(--profile-sheet-surface-strong)] active:scale-95"
        aria-label="Apri notifiche"
        aria-expanded={isNotificationsOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-[1.15rem] rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold leading-[1.15rem] text-white shadow-[0_0_0_2px_rgba(11,13,18,0.9)]">
            {badgeValue}
          </span>
        ) : null}
      </button>

      {isNotificationsOpen ? (
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Notifiche"
          className="fixed inset-0 z-[220] flex h-[100dvh] flex-col bg-[var(--profile-sheet-bg)] text-[color:var(--profile-sheet-text)] backdrop-blur-3xl md:hidden"
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-[color:var(--profile-sheet-border)] px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(false)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-title)] shadow-[0_8px_20px_var(--profile-sheet-shadow)] transition-colors hover:bg-[color:var(--profile-sheet-surface-strong)]"
              aria-label="Torna indietro"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-[-0.01em] text-[color:var(--profile-sheet-title)]">
              Notifiche
            </h1>
            {notifications.length > 0 ? (
              <button
                type="button"
                onClick={clearNotifications}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-muted)] transition-colors hover:bg-[color:var(--profile-sheet-surface-strong)] hover:text-[color:var(--profile-sheet-title)]"
                aria-label="Cancella tutte le notifiche"
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] glass-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex min-h-[45dvh] flex-col items-center justify-center text-center">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-muted)]">
                  <Bell size={22} />
                </span>
                <p className="mt-4 text-base font-semibold text-[color:var(--profile-sheet-title)]">Nessuna notifica</p>
                <p className="mt-1 max-w-[16rem] text-sm font-medium text-[color:var(--profile-sheet-muted)]">
                  Quando arriva qualcosa di nuovo lo troverai qui.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {notifications.map((notification) => (
                  <NotificationLiquidItem
                    key={notification.id}
                    notification={notification}
                    onRead={markNotificationAsRead}
                    onRemove={removeNotification}
                  />
                ))}
              </ul>
            )}
          </main>
        </section>
      ) : null}
    </>
  );
}
