import React from 'react';
import {
  BarChart3,
  Bell,
  Home,
  Lightbulb,
  MonitorSmartphone,
  Rocket,
  Settings,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react';

export type DashboardNotification = {
  id: string;
  type?: string;
  message?: string;
  createdAt?: number;
  read?: boolean;
};

type NotificationContextId =
  | 'home-assistant'
  | 'security'
  | 'automation'
  | 'devices'
  | 'energy'
  | 'home'
  | 'system';

type NotificationContextMeta = {
  label: string;
  Icon: LucideIcon;
  iconClassName: string;
  orbClassName: string;
  ringClassName: string;
};

const CONTEXT_META: Record<NotificationContextId, NotificationContextMeta> = {
  'home-assistant': {
    label: 'Home Assistant',
    Icon: MonitorSmartphone,
    iconClassName: 'text-sky-500',
    orbClassName: 'border-sky-300/45 bg-sky-400/16 shadow-[0_14px_32px_rgba(14,165,233,0.22)]',
    ringClassName: 'bg-sky-400/18',
  },
  security: {
    label: 'Sicurezza',
    Icon: ShieldCheck,
    iconClassName: 'text-rose-500',
    orbClassName: 'border-rose-300/45 bg-rose-400/16 shadow-[0_14px_32px_rgba(244,63,94,0.22)]',
    ringClassName: 'bg-rose-400/18',
  },
  automation: {
    label: 'Automazioni',
    Icon: Rocket,
    iconClassName: 'text-violet-500',
    orbClassName: 'border-violet-300/45 bg-violet-400/16 shadow-[0_14px_32px_rgba(139,92,246,0.22)]',
    ringClassName: 'bg-violet-400/18',
  },
  devices: {
    label: 'Dispositivi',
    Icon: Lightbulb,
    iconClassName: 'text-amber-500',
    orbClassName: 'border-amber-300/50 bg-amber-400/18 shadow-[0_14px_32px_rgba(245,158,11,0.22)]',
    ringClassName: 'bg-amber-400/18',
  },
  energy: {
    label: 'Consumi',
    Icon: BarChart3,
    iconClassName: 'text-emerald-500',
    orbClassName: 'border-emerald-300/45 bg-emerald-400/16 shadow-[0_14px_32px_rgba(16,185,129,0.22)]',
    ringClassName: 'bg-emerald-400/18',
  },
  home: {
    label: 'Casa',
    Icon: Home,
    iconClassName: 'text-cyan-500',
    orbClassName: 'border-cyan-300/45 bg-cyan-400/16 shadow-[0_14px_32px_rgba(6,182,212,0.2)]',
    ringClassName: 'bg-cyan-400/18',
  },
  system: {
    label: 'Sistema',
    Icon: Settings,
    iconClassName: 'text-slate-500',
    orbClassName: 'border-slate-300/45 bg-slate-400/16 shadow-[0_14px_32px_rgba(100,116,139,0.2)]',
    ringClassName: 'bg-slate-400/18',
  },
};

function formatNotificationTime(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '';
  }
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

export function resolveNotificationContext(notification: DashboardNotification): NotificationContextId {
  const message = notification.message?.toLowerCase() ?? '';

  if (/home assistant|riconnession|riconness|connetti|connession|conness/.test(message)) {
    return 'home-assistant';
  }
  if (/allarme|serratur|biometric|autenticaz|passkey|pin|codice|sicurezz|auth/.test(message)) {
    return 'security';
  }
  if (/scena|scene|script|automaz|payload|json/.test(message)) {
    return 'automation';
  }
  if (/consum|energia|corrente|kwh|watt|clima|temperatur/.test(message)) {
    return 'energy';
  }
  if (/luce|luci|switch|interrutt|sensore|camera|dispositivo|entit|entity|shelly/.test(message)) {
    return 'devices';
  }
  if (/casa|stanza|room|area/.test(message)) {
    return 'home';
  }
  return 'system';
}

type NotificationLiquidItemProps = {
  notification: DashboardNotification;
  onRead?: (id: string) => void;
  onRemove?: (id: string) => void;
};

export function NotificationLiquidItem({
  notification,
  onRead,
  onRemove,
}: NotificationLiquidItemProps) {
  const notificationId = String(notification.id);
  const context = resolveNotificationContext(notification);
  const meta = CONTEXT_META[context] ?? CONTEXT_META.system;
  const Icon = meta.Icon;
  const message = notification.message?.trim() || 'Hai una nuova notifica.';
  const timeLabel = formatNotificationTime(notification.createdAt);
  const isRead = notification.read === true;

  return (
    <li
      onClick={() => onRead?.(notificationId)}
      className={`group relative pl-6 transition-opacity ${isRead ? 'opacity-72' : 'opacity-100'}`}
    >
      <div className="relative min-h-[4.6rem] cursor-pointer overflow-visible rounded-[2rem] border border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.38),rgba(255,255,255,0.14))] py-3 pl-11 pr-12 text-left shadow-[0_18px_44px_rgba(3,8,20,0.16),inset_0_1px_0_rgba(255,255,255,0.38)] backdrop-blur-2xl transition-transform duration-200 group-hover:scale-[1.01]">
        <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <span
          className={`absolute left-0 top-1/2 flex h-[3.25rem] w-[3.25rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-2xl ${meta.orbClassName}`}
        >
          <span className={`absolute inset-1 rounded-full ${meta.ringClassName}`} />
          <Icon size={23} strokeWidth={2.2} className={`relative z-10 ${meta.iconClassName}`} />
        </span>

        {!isRead ? (
          <span className="absolute right-11 top-3 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.18)]" />
        ) : null}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-semibold tracking-[-0.01em] text-[color:var(--profile-sheet-title)]">
              {meta.label}
            </p>
            {notification.type === 'alert' ? (
              <span className="rounded-full bg-red-500/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-red-500">
                Alert
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-[color:var(--profile-sheet-muted)]">
            {message}
          </p>
          {timeLabel ? (
            <p className="mt-1.5 text-[11px] font-semibold text-[color:var(--profile-sheet-muted)]">{timeLabel}</p>
          ) : null}
        </div>

        {onRemove ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(notificationId);
            }}
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/24 bg-white/16 text-[color:var(--profile-sheet-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-xl transition-colors hover:bg-white/24 hover:text-[color:var(--profile-sheet-title)]"
            aria-label="Rimuovi notifica"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>
    </li>
  );
}
