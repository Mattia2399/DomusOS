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
  primary: 'glass-button glass-button-primary',
  danger: 'glass-button glass-button-danger',
  ghost: 'glass-button glass-button-ghost',
};

const sizeClass: Record<GlassButtonSize, string> = {
  sm: 'min-h-10 rounded-xl px-3 py-2 text-xs',
  md: 'min-h-11',
  icon: 'h-11 w-11 rounded-full p-0',
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
