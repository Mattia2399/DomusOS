import type { ReactNode } from 'react';
import type { WidgetDisplayVariant } from '../widgets/widgetDisplayVariant';

type CameraDisplayVariantSkeletonProps = {
  variant: WidgetDisplayVariant;
  active?: boolean;
  disabled?: boolean;
};

const glow = 'bg-[linear-gradient(135deg,rgba(114,184,255,0.28),rgba(255,255,255,0.045)_52%,rgba(0,0,0,0.22))]';
const muted = 'bg-white/[0.09]';

function StatusPill({ label = true }: { label?: boolean }) {
  return (
    <span className="inline-flex h-4 min-w-0 items-center gap-1 rounded-full border border-white/[0.10] bg-black/25 px-1.5">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.72)]" />
      {label ? <span className="h-1 w-6 rounded-full bg-white/45" /> : null}
    </span>
  );
}

function CameraFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`relative block min-w-0 overflow-hidden rounded-[0.82rem] border border-white/[0.08] ${glow} ${className}`}>
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_16%,rgba(255,255,255,0.18),transparent_44%),linear-gradient(180deg,transparent_28%,rgba(0,0,0,0.48))]" />
      {children}
    </span>
  );
}

export function CameraDisplayVariantSkeleton({ variant, active, disabled }: CameraDisplayVariantSkeletonProps) {
  const opacity = disabled ? 'opacity-45' : active ? 'opacity-100' : 'opacity-75';

  if (variant === 'mini') {
    return (
      <CameraFrame className={`h-14 ${opacity}`}>
        <span className="absolute left-2 top-2">
          <StatusPill label={false} />
        </span>
        <span className="absolute bottom-2 left-2 h-1.5 w-14 rounded-full bg-white/70" />
      </CameraFrame>
    );
  }

  if (variant === 'compact') {
    return (
      <CameraFrame className={`h-16 ${opacity}`}>
        <span className="absolute left-2 top-2">
          <StatusPill />
        </span>
        <span className="absolute bottom-4 left-2 h-1.5 w-16 rounded-full bg-white/72" />
        <span className="absolute bottom-2 left-2 h-1 w-20 rounded-full bg-white/32" />
      </CameraFrame>
    );
  }

  if (variant === 'standard') {
    return (
      <CameraFrame className={`h-20 ${opacity}`}>
        <span className="absolute left-2 top-2">
          <StatusPill />
        </span>
        <span className="absolute bottom-6 left-2 h-1.5 w-20 rounded-full bg-white/76" />
        <span className="absolute bottom-4 left-2 h-1 w-24 rounded-full bg-white/34" />
        <span className="absolute bottom-2 left-2 flex gap-1">
          <span className={`h-3 w-9 rounded-full ${muted}`} />
          <span className={`h-3 w-10 rounded-full ${muted}`} />
        </span>
      </CameraFrame>
    );
  }

  return (
    <CameraFrame className={`h-24 ${opacity}`}>
      <span className="absolute left-2 top-2">
        <StatusPill />
      </span>
      <span className="absolute right-2 top-2 h-4 w-9 rounded-full border border-rose-200/20 bg-rose-400/18" />
      <span className="absolute bottom-7 left-2 h-2 w-24 rounded-full bg-white/78" />
      <span className="absolute bottom-5 left-2 h-1 w-28 rounded-full bg-white/36" />
      <span className="absolute bottom-2 left-2 right-2 flex gap-1">
        <span className={`h-3 flex-1 rounded-full ${muted}`} />
        <span className={`h-3 flex-1 rounded-full ${muted}`} />
        <span className={`h-3 flex-1 rounded-full ${muted}`} />
      </span>
    </CameraFrame>
  );
}
