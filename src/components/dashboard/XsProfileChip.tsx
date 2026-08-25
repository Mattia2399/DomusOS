import type { HaConnectionStatus } from '../../services/haConnectionState';
import { DashboardProfileAvatar } from './DashboardProfileAvatar';

type XsProfileChipProps = {
  userAvatarUrl?: string;
  userName?: string;
  haStatus: HaConnectionStatus;
  onOpenProfile: () => void;
};

export function XsProfileChip({
  userAvatarUrl,
  userName,
  haStatus,
  onOpenProfile,
}: XsProfileChipProps) {
  const normalizedName = userName?.trim() ?? '';

  return (
    <button
      type="button"
      onClick={onOpenProfile}
      className="liquid-glass-control group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-1.5 text-[color:var(--ui-text-primary)] transition-all hover:brightness-110 active:scale-95"
      aria-label={normalizedName ? `Apri profilo di ${normalizedName}` : 'Apri profilo'}
      title={normalizedName || 'Profilo'}
    >
      <span className="relative inline-flex h-8 w-8 shrink-0">
        <DashboardProfileAvatar
          userAvatarUrl={userAvatarUrl}
          userName={normalizedName}
          haStatus={haStatus}
          size="sm"
        />
      </span>
    </button>
  );
}
