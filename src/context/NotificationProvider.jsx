import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const NOTIFICATION_TYPES = ['info', 'warning', 'alert'];
const MAX_NOTIFICATIONS = 40;

const NotificationContext = createContext(undefined);

let notificationCounter = 0;

function createNotificationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  notificationCounter += 1;
  return `notification-${Date.now()}-${notificationCounter}`;
}

function normalizeType(type) {
  return NOTIFICATION_TYPES.includes(type) ? type : 'info';
}

function normalizeMessage(message) {
  if (typeof message === 'string' && message.trim().length > 0) {
    return message.trim();
  }
  return 'Hai una nuova notifica.';
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [announcement, setAnnouncement] = useState(null);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const addNotification = useCallback((type, message) => {
    const id = createNotificationId();
    const nextNotification = {
      id,
      type: normalizeType(type),
      message: normalizeMessage(message),
      createdAt: Date.now(),
      read: false,
    };

    setNotifications((prev) => [nextNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
    setAnnouncement(nextNotification);

    return id;
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markNotificationAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  }, []);

  const unreadCount = useMemo(
    () => notifications.reduce((count, notification) => count + (notification.read ? 0 : 1), 0),
    [notifications],
  );

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      removeNotification,
      clearNotifications,
      markNotificationAsRead,
      markAllAsRead,
    }),
    [
      notifications,
      unreadCount,
      addNotification,
      removeNotification,
      clearNotifications,
      markNotificationAsRead,
      markAllAsRead,
    ],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div
        className="sr-only"
        role={announcement?.type === 'alert' ? 'alert' : 'status'}
        aria-live={announcement?.type === 'alert' ? 'assertive' : 'polite'}
        aria-atomic="true"
      >
        {announcement?.message ?? ''}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve essere usato dentro NotificationProvider.');
  }
  return context;
}
