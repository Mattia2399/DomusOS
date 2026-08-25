import React from 'react';
import clsx from 'clsx';

export type GlassSliderTone = 'accent' | 'blue' | 'cyan' | 'green' | 'orange' | 'neutral';
export type GlassSliderVariant = 'default' | 'compact' | 'overlay';

export type GlassSliderProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  variant?: GlassSliderVariant;
  tone?: GlassSliderTone;
  inputClassName?: string;
  fillClassName?: string;
  fillStyle?: React.CSSProperties;
  thumbClassName?: string;
};

const FILL_TONE_CLASS: Record<GlassSliderTone, string> = {
  accent: 'bg-[color:var(--ui-accent)]',
  blue: 'bg-[color:var(--ui-accent)]',
  cyan: 'bg-[color:var(--ui-info)]',
  green: 'bg-[color:var(--ui-success)]',
  orange: 'bg-[color:var(--ui-warning)]',
  neutral: 'bg-[color:var(--ui-fill-primary)]',
};

function resolveProgress(value: GlassSliderProps['value'], min: GlassSliderProps['min'], max: GlassSliderProps['max']) {
  const numericValue = Number(value ?? min ?? 0);
  const numericMin = Number(min ?? 0);
  const numericMax = Number(max ?? 100);
  if (![numericValue, numericMin, numericMax].every(Number.isFinite) || numericMax <= numericMin) return 0;
  return Math.min(100, Math.max(0, ((numericValue - numericMin) / (numericMax - numericMin)) * 100));
}

export const GlassSlider = React.forwardRef<HTMLInputElement, GlassSliderProps>(function GlassSlider(
  {
    variant = 'default',
    tone = 'accent',
    className,
    inputClassName,
    fillClassName,
    fillStyle,
    thumbClassName,
    value,
    min = 0,
    max = 100,
    disabled,
    ...inputProps
  },
  ref,
) {
  if (variant === 'overlay') {
    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        className={className}
        {...inputProps}
      />
    );
  }

  const compact = variant === 'compact';
  const progress = resolveProgress(value, min, max);

  return (
    <div
      className={clsx(
        'liquid-glass-control relative w-full overflow-hidden !rounded-full focus-within:ring-2 focus-within:ring-[color:var(--ui-focus-ring)]',
        compact ? 'h-7' : 'h-10',
        disabled && 'opacity-45',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx('pointer-events-none absolute inset-y-0 left-0 transition-[width] duration-150', FILL_TONE_CLASS[tone], fillClassName)}
        style={{ ...fillStyle, width: `${progress}%` }}
      />
      <span
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute top-1/2 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.9)] transition-[left] duration-150',
          compact ? 'h-5 w-5' : 'h-8 w-8',
          thumbClassName,
        )}
        style={{ left: `clamp(0px, calc(${progress}% - ${compact ? 10 : 16}px), calc(100% - ${compact ? 20 : 32}px))`, transform: 'translateY(-50%)' }}
      />
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        className={clsx('absolute inset-0 h-full w-full cursor-pointer touch-none opacity-0 disabled:cursor-not-allowed', inputClassName)}
        {...inputProps}
      />
    </div>
  );
});

export default GlassSlider;
