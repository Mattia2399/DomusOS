import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export type GlassToggleTone = 'green' | 'blue' | 'accent';

export type GlassToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  busy?: boolean;
  size?: 'default' | 'compact';
  tone?: GlassToggleTone;
  className?: string;
};

const ACTIVE_TONE_CLASS: Record<GlassToggleTone, string> = {
  green: 'ios-glass-switch-on',
  blue: 'ios-glass-switch-blue-on',
  accent:
    'border-[color:rgb(var(--ui-accent-rgb)/0.72)] bg-[color:var(--ui-accent)] shadow-[0_0_22px_rgb(var(--ui-accent-rgb)/0.34),inset_0_1px_0_rgba(255,255,255,0.32)] focus-visible:ring-[rgb(var(--ui-accent-rgb)/0.42)]',
};

export function GlassToggle({
  checked,
  onChange,
  label,
  disabled = false,
  busy = false,
  size = 'default',
  tone = 'green',
  className,
}: GlassToggleProps) {
  const compact = size === 'compact';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
      className={clsx(
        'ios-glass-switch',
        compact && 'h-7 w-12',
        checked && ACTIVE_TONE_CLASS[tone],
        busy && 'cursor-wait opacity-75',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'ios-glass-switch-thumb flex items-center justify-center',
          compact && 'left-[3px] h-[1.375rem] w-[1.375rem]',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin text-black/45" /> : null}
      </span>
    </button>
  );
}

export default GlassToggle;
