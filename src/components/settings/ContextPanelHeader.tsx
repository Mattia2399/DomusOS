import type { ReactNode } from 'react';
import clsx from 'clsx';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';

type ContextPanelHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  icon: ReactNode;
  fallbackTitle?: string;
  className?: string;
  iconClassName?: string;
  subtitleClassName?: string;
};

export function ContextPanelHeader({
  title,
  subtitle,
  icon,
  fallbackTitle = 'Dispositivo',
  className,
  iconClassName,
  subtitleClassName,
}: ContextPanelHeaderProps) {
  const displayTitle = title.trim() || fallbackTitle;

  return (
    <div className={clsx('context-panel-header', CONTEXT_PANEL_LAYOUT.section, 'mb-1', className)}>
      <div className="flex min-w-0 items-center gap-[clamp(0.8rem,2.6vw,1.05rem)] pr-11">
        <span
          className={clsx(
            'flex h-[clamp(3rem,7.2vw,3.5rem)] w-[clamp(3rem,7.2vw,3.5rem)] shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.08] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl',
            iconClassName,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-[clamp(1.08rem,3.1vw,1.36rem)] font-semibold leading-[1.08] tracking-tight text-white [overflow-wrap:anywhere]">
            {displayTitle}
          </h2>
          {subtitle ? (
            <p className={clsx('mt-1 line-clamp-2 text-[clamp(0.78rem,2vw,0.9rem)] leading-snug', subtitleClassName ?? 'text-white/58')}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
