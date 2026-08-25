import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';

type ContextSecondaryPageProps = {
  title: string;
  subtitle: string;
  backLabel: string;
  icon: ReactNode;
  onBack: () => void;
  iconClassName?: string;
  children: ReactNode;
};

export function ContextSecondaryPage({
  title,
  subtitle,
  backLabel,
  icon,
  onBack,
  iconClassName,
  children,
}: ContextSecondaryPageProps) {
  return (
    <div className={`${CONTEXT_PANEL_LAYOUT.shell} w-full min-w-0 max-w-full overflow-x-hidden`}>
      <button
        type="button"
        onClick={onBack}
        className="glass-button min-h-11 w-fit rounded-full px-3 text-xs font-semibold"
      >
        <ArrowLeft size={15} />
        <span className="truncate">{backLabel}</span>
      </button>

      <div className={`${CONTEXT_PANEL_LAYOUT.section} min-w-0 max-w-full overflow-hidden`}>
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] ${iconClassName ?? 'text-cyan-200'}`}>
            {icon}
          </span>
          <span className="min-w-0">
            <p className="truncate text-base font-semibold text-[color:var(--ui-text-primary)]">{title}</p>
            <p className="mt-0.5 truncate text-xs text-[color:var(--ui-text-tertiary)]">{subtitle}</p>
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}

export default ContextSecondaryPage;
