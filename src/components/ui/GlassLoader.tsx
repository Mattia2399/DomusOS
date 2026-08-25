import { useId, type ReactNode } from 'react';
import clsx from 'clsx';

export type GlassLoaderSize = 'xs' | 'sm' | 'md' | 'lg';

export type GlassLoaderProps = {
  size?: GlassLoaderSize;
  label?: ReactNode;
  description?: ReactNode;
  ariaLabel?: string;
  className?: string;
};

/**
 * Shared loading indicator for page, panel and card-level asynchronous states.
 * Its colors are inherited from the active dashboard/onboarding theme.
 */
export function GlassLoader({
  size = 'md',
  label,
  description,
  ariaLabel,
  className,
}: GlassLoaderProps) {
  const gradientId = `glass-loader-gradient-${useId().replace(/:/g, '')}`;
  const statusLabel = ariaLabel ?? (typeof label === 'string' ? label : 'Caricamento');

  return (
    <div
      className={clsx('glass-loader', className)}
      data-size={size}
      role="status"
      aria-label={statusLabel}
      aria-live="polite"
    >
      <svg
        className="glass-loader__graphic"
        viewBox="0 0 128 128"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop className="glass-loader__stop-start" offset="0%" />
            <stop className="glass-loader__stop-end" offset="100%" />
          </linearGradient>
        </defs>
        <circle
          className="glass-loader__ring"
          r="56"
          cx="64"
          cy="64"
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          className="glass-loader__worm"
          d="M92,15.492S78.194,4.967,66.743,16.887c-17.231,17.938-28.26,96.974-28.26,96.974L119.85,59.892l-99-31.588,57.528,89.832L97.8,19.349,13.636,88.51l89.012,16.015S81.908,38.332,66.1,22.337C50.114,6.156,36,15.492,36,15.492a56,56,0,1,0,56,0Z"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {label || description ? (
        <div className="glass-loader__copy">
          {label ? <div className="glass-loader__label">{label}</div> : null}
          {description ? <div className="glass-loader__description">{description}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

export default GlassLoader;
