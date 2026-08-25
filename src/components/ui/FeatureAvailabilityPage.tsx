import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Clock3, Sparkles } from 'lucide-react';

export type FeatureAvailabilityPageProps = {
  title: string;
  description: string;
  headline?: string;
  statusLabel?: string;
  icon?: LucideIcon;
  onBack?: () => void;
  backLabel?: string;
  nested?: boolean;
};

export function FeatureAvailabilityPage({
  title,
  description,
  headline = 'Stiamo preparando qualcosa di speciale',
  statusLabel = 'Prossimamente',
  icon: Icon = Sparkles,
  onBack,
  backLabel = 'Indietro',
  nested = false,
}: FeatureAvailabilityPageProps) {
  const preview = (
    <div className="relative isolate flex min-h-[28rem] w-full items-center justify-center overflow-hidden rounded-[2rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-bg-grouped)] p-4 shadow-[var(--ui-shadow-card)] sm:min-h-[34rem] sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-80" style={{ background: 'radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--ui-info) 17%, transparent), transparent 34%), radial-gradient(circle at 84% 86%, color-mix(in srgb, var(--ui-accent) 14%, transparent), transparent 38%)' }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-5 grid grid-cols-1 gap-4 opacity-35 blur-[2px] sm:inset-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-[1.75rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] p-5">
          <div className="h-4 w-28 rounded-full bg-[color:var(--ui-fill-secondary)]" />
          <div className="h-14 rounded-2xl bg-[color:var(--ui-fill-secondary)]" />
          <div className="h-24 rounded-2xl bg-[color:var(--ui-fill-secondary)]" />
          <div className="h-14 rounded-2xl bg-[color:var(--ui-fill-secondary)]" />
        </div>
        <div className="hidden space-y-4 lg:block">
          <div className="h-32 rounded-[1.75rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)]" />
          <div className="h-48 rounded-[1.75rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)]" />
        </div>
      </div>
      <section className="liquid-glass-panel relative z-10 w-full max-w-xl rounded-[2rem] border border-[color:var(--ui-border-strong)] px-6 py-8 text-center shadow-[var(--ui-shadow-elevated)] sm:px-10 sm:py-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-secondary)] text-[color:var(--ui-accent)] shadow-[var(--ui-shadow-control)]">
          <Icon className="h-7 w-7" strokeWidth={1.8} />
        </span>
        <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--ui-text-secondary)]">
          <Clock3 className="h-3.5 w-3.5" />
          {statusLabel}
        </span>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--ui-text-primary)] sm:text-3xl">{headline}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[color:var(--ui-text-secondary)] sm:text-base">{description}</p>
      </section>
    </div>
  );

  if (!nested) {
    return (
      <div className="dashboard-page-scroll">
        <div className="dashboard-page-content dashboard-page-content-wide gap-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pb-10">
          <header>
            <p className="dashboard-page-eyebrow">Anteprima</p>
            <h1 className="dashboard-page-title">{title}</h1>
            <p className="dashboard-page-subtitle">{description}</p>
          </header>
          {preview}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page-content dashboard-page-content-wide gap-5 pb-8">
      {onBack ? (
        <header className="flex min-h-12 items-center gap-3">
          <button type="button" onClick={onBack} className="liquid-glass-control inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[color:var(--ui-text-primary)] transition-transform active:scale-[0.97]">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </button>
          <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight text-[color:var(--ui-text-primary)] sm:text-2xl">{title}</h1>
        </header>
      ) : null}
      {preview}
    </div>
  );
}

export default FeatureAvailabilityPage;
