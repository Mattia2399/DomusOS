import {
  Bug,
  ExternalLink,
  FileJson,
  HelpCircle,
  Lightbulb,
  LockKeyhole,
  MessagesSquare,
  ShieldAlert,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { HaConnectionStatus } from '../../hooks/useHaLiveConnection';

const REPOSITORY_URL = 'https://github.com/Mattia2399/DomusUI';

type SupportFeedbackSectionProps = {
  appVersion: string;
  haStatus: HaConnectionStatus;
  onDownloadDiagnostics: () => void;
  diagnosticsFeedback?: string;
};

type SupportLinkProps = {
  href: string;
  label: string;
  tone?: 'default' | 'danger';
};

function SupportLink({ href, label, tone = 'default' }: SupportLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-[transform,background-color,border-color] active:scale-[0.98] ${
        tone === 'danger'
          ? 'border-rose-400/30 bg-rose-500/[0.08] text-rose-500 hover:bg-rose-500/[0.13]'
          : 'liquid-glass-selection border-[color:var(--ui-border-strong)] text-[color:var(--ui-text-primary)]'
      }`}
    >
      {label}
      <ExternalLink size={15} aria-hidden="true" />
    </a>
  );
}

function ChannelCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: typeof Bug;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="dashboard-content-surface flex min-h-[15rem] flex-col rounded-[1.5rem] p-5 sm:p-6">
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)]">
          <Icon size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ui-text-tertiary)]">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-[color:var(--ui-text-primary)]">
            {title}
          </h2>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[color:var(--ui-text-secondary)]">{description}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">{children}</div>
    </section>
  );
}

function connectionLabel(status: HaConnectionStatus) {
  if (status === 'connected') return 'Home Assistant connesso';
  if (status === 'connecting' || status === 'reconnecting') return 'Connessione in corso';
  if (status === 'reauth_required') return 'Nuovo accesso richiesto';
  return 'Home Assistant non connesso';
}

export default function SupportFeedbackSection({
  appVersion,
  haStatus,
  onDownloadDiagnostics,
  diagnosticsFeedback,
}: SupportFeedbackSectionProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="dashboard-content-surface relative overflow-hidden rounded-[1.65rem] p-5 sm:p-7">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[color:rgb(var(--ui-accent-rgb)/0.12)] blur-3xl"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ui-text-tertiary)]">
              Domus UI · beta pubblica
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] sm:text-2xl">
              Il tuo feedback costruisce la prossima versione
            </h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--ui-text-secondary)]">
              Scegli il canale corretto: i problemi riproducibili diventano issue, mentre idee e
              domande restano conversazioni aperte alla community.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-[15rem] sm:justify-end">
            <span className="inline-flex min-h-8 items-center rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] px-3 text-[11px] font-semibold text-[color:var(--ui-text-secondary)]">
              Versione {appVersion}
            </span>
            <span className="inline-flex min-h-8 items-center rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] px-3 text-[11px] font-semibold text-[color:var(--ui-text-secondary)]">
              {connectionLabel(haStatus)}
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <ChannelCard
          icon={Bug}
          eyebrow="Problemi"
          title="Segnala un bug"
          description="Usa il modulo guidato per descrivere il problema, i passaggi per riprodurlo e il dispositivo coinvolto."
        >
          <SupportLink
            href={`${REPOSITORY_URL}/issues/new?template=bug_report.yml`}
            label="Apri una segnalazione"
          />
          <SupportLink href={`${REPOSITORY_URL}/issues`} label="Controlla i bug noti" />
        </ChannelCard>

        <ChannelCard
          icon={MessagesSquare}
          eyebrow="Community"
          title="Idee e domande"
          description="Proponi una funzione, confrontati su un flusso o chiedi aiuto senza trasformare subito la conversazione in un bug."
        >
          <SupportLink
            href={`${REPOSITORY_URL}/discussions/new?category=ideas`}
            label="Proponi un’idea"
          />
          <SupportLink
            href={`${REPOSITORY_URL}/discussions/new?category=q-a`}
            label="Chiedi aiuto"
          />
        </ChannelCard>
      </div>

      <section className="dashboard-content-surface rounded-[1.5rem] p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)] lg:items-center">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)]">
              <FileJson size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ui-text-tertiary)]">
                Diagnostica locale
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em]">Allega un contesto sicuro</h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--ui-text-secondary)]">
                Il file contiene versione, stato della connessione e soli conteggi aggregati. Non
                include token, PIN, URL, nomi di entità, stanze o valori della casa.
              </p>
            </div>
          </div>
          <div className="rounded-[1.2rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] p-4">
            <button
              type="button"
              onClick={onDownloadDiagnostics}
              className="liquid-glass-selection flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[color:var(--ui-border-strong)] px-4 text-sm font-semibold"
            >
              <FileJson size={16} aria-hidden="true" />
              Scarica diagnostica
            </button>
            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[color:var(--ui-text-secondary)]">
              <LockKeyhole size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              Il download resta sul dispositivo e non viene inviato automaticamente.
            </p>
            {diagnosticsFeedback ? (
              <p role="status" className="mt-2 text-xs font-medium text-emerald-500">
                {diagnosticsFeedback}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-rose-400/20 bg-rose-500/[0.055] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-2xl items-start gap-3.5">
            <ShieldAlert size={21} className="mt-0.5 shrink-0 text-rose-500" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-[color:var(--ui-text-primary)]">Problema di sicurezza?</h2>
              <p className="mt-1 text-sm leading-6 text-[color:var(--ui-text-secondary)]">
                Non pubblicare vulnerabilità, token o dati sensibili nelle issue. Invia una
                segnalazione privata direttamente ai maintainer.
              </p>
            </div>
          </div>
          <SupportLink
            href={`${REPOSITORY_URL}/security/advisories/new`}
            label="Segnala in privato"
            tone="danger"
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs text-[color:var(--ui-text-secondary)]">
        <span className="inline-flex items-center gap-1.5"><HelpCircle size={14} /> Supporto pubblico e trasparente</span>
        <span className="inline-flex items-center gap-1.5"><Lightbulb size={14} /> Idee discusse prima dello sviluppo</span>
      </div>
    </div>
  );
}
