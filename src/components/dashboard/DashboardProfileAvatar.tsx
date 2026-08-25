import React from 'react';
import type { HaConnectionStatus } from '../../services/haConnectionState';

type DashboardProfileAvatarProps = {
  userAvatarUrl?: string;
  userName?: string;
  haStatus: HaConnectionStatus;
  size?: 'sm' | 'md';
  className?: string;
};

const STATUS_DOT_CLASS: Record<HaConnectionStatus, string> = {
  connected: 'bg-[color:var(--ui-success)]',
  connecting: 'animate-pulse bg-[color:var(--ui-warning)]',
  reconnecting: 'animate-pulse bg-[color:var(--ui-warning)]',
  offline: 'bg-[color:var(--ui-warning)]',
  reauth_required: 'bg-[color:var(--ui-danger)]',
  error: 'bg-[color:var(--ui-danger)]',
  disconnected: 'bg-[color:var(--ui-text-disabled)]',
  disconnected_by_user: 'bg-[color:var(--ui-text-disabled)]',
};

export function resolveDashboardProfileInitials(userName = '') {
  const parts = userName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function DashboardProfileAvatar({
  userAvatarUrl,
  userName,
  haStatus,
  size = 'md',
  className = '',
}: DashboardProfileAvatarProps) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const normalizedAvatarUrl = userAvatarUrl?.trim() ?? '';
  const canShowImage = Boolean(normalizedAvatarUrl) && !imageFailed;

  React.useEffect(() => {
    setImageFailed(false);
  }, [normalizedAvatarUrl]);

  return (
    <span
      className={`relative inline-flex h-full w-full shrink-0 items-center justify-center rounded-full border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-fill-secondary)] shadow-[0_6px_16px_var(--ui-shadow-soft)] ${className}`}
    >
      {canShowImage ? (
        <img
          src={normalizedAvatarUrl}
          alt=""
          onError={() => setImageFailed(true)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span
          className={`${size === 'sm' ? 'text-[10px]' : 'text-xs'} font-semibold tracking-[0.06em] text-[color:var(--ui-text-secondary)]`}
          aria-hidden="true"
        >
          {resolveDashboardProfileInitials(userName)}
        </span>
      )}
      <span
        data-ha-status={haStatus}
        className={`absolute -bottom-0.5 -right-0.5 rounded-full border border-[color:var(--ui-bg-elevated)] shadow-[0_0_0_1px_var(--ui-border)] ${
          size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
        } ${STATUS_DOT_CLASS[haStatus]}`}
        aria-hidden="true"
      />
    </span>
  );
}
