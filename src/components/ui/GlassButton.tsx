import React from 'react';
import clsx from 'clsx';

type GlassButtonVariant = 'default' | 'primary' | 'danger' | 'ghost';
type GlassButtonSize = 'sm' | 'md' | 'icon';

export type GlassButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
};

const variantClass: Record<GlassButtonVariant, string> = {
  default: 'glass-button',
  primary:
    'glass-button border-[#0A84FF]/40 bg-[#0A84FF]/18 text-blue-50 shadow-[0_0_22px_rgba(10,132,255,0.28),inset_0_1px_0_rgba(255,255,255,0.16)] hover:border-[#0A84FF]/55 hover:bg-[#0A84FF]/26',
  danger:
    'glass-button border-rose-300/35 bg-rose-500/14 text-rose-50 shadow-[0_0_22px_rgba(244,63,94,0.22),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-rose-300/50 hover:bg-rose-500/22',
  ghost: 'glass-button border-white/[0.06] bg-white/[0.02] text-white/72 hover:bg-white/[0.07] hover:text-white',
};

const sizeClass: Record<GlassButtonSize, string> = {
  sm: 'min-h-9 rounded-xl px-3 py-2 text-xs',
  md: 'min-h-11',
  icon: 'h-10 w-10 rounded-full p-0',
};

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { className, variant = 'default', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(variantClass[variant], sizeClass[size], className)}
      {...props}
    />
  );
});

export default GlassButton;
