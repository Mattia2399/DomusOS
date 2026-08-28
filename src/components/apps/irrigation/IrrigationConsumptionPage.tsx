import {
  CalendarClock,
  ChevronRight,
  CircleGauge,
  Droplets,
  Gauge,
  RefreshCw,
  Settings2,
  Sprout,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import GlassSegmentSelect from '../../ui/GlassSegmentSelect';
import type { IrrigationConsumptionPeriod, IrrigationConsumptionPoint } from './irrigationConsumptionModel';

type ConsumptionStatus = 'loading' | 'available' | 'empty' | 'insufficient' | 'error' | 'offline';

export type IrrigationZoneConsumption = {
  id: string;
  name: string;
  liters: number | null;
  share: number;
  plannedMinutes: number;
};

type IrrigationConsumptionPageProps = {
  period: IrrigationConsumptionPeriod;
  onPeriodChange: (period: IrrigationConsumptionPeriod) => void;
  status: ConsumptionStatus;
  totalLiters: number | null;
  dailyAverageLiters: number | null;
  comparisonPct: number | null;
  points: IrrigationConsumptionPoint[];
  zones: IrrigationZoneConsumption[];
  configuredZones: number;
  plannedMinutes: number;
  dataSourceLabel: string;
  isRefreshing?: boolean;
  isStale?: boolean;
  updatedAt?: number | null;
  isEstimatedBreakdown: boolean;
  onOpenSettings?: () => void;
  onManageZones?: () => void;
};

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 giorni' },
  { value: '30d', label: '30 giorni' },
  { value: '12m', label: '12 mesi' },
] as const;

function formatLiters(value: number | null, compact = false) {
  if (value === null || !Number.isFinite(value)) return 'N/D';
  return `${value.toLocaleString('it-IT', { maximumFractionDigits: compact ? 0 : 1 })} L`;
}

function SummaryCard({ icon: Icon, eyebrow, value, detail, tone = 'lime', loading = false }: {
  icon: typeof Droplets;
  eyebrow: string;
  value: string;
  detail: string;
  tone?: 'lime' | 'cyan' | 'neutral';
  loading?: boolean;
}) {
  const iconClass = tone === 'lime' ? 'text-lime-500' : tone === 'cyan' ? 'text-cyan-500' : 'text-[color:var(--ui-text-secondary)]';
  return (
    <article className="rounded-[1.5rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-primary)] p-4 shadow-[var(--ui-shadow-card)] sm:p-5">
      <div className="flex items-center gap-2.5">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--ui-text-tertiary)]">{eyebrow}</p>
      </div>
      {loading ? (
        <>
          <span className="mt-4 block h-7 w-24 animate-pulse rounded-full bg-[color:var(--ui-fill-secondary)]" aria-label="Caricamento valore" />
          <span className="mt-2 block h-3 w-32 animate-pulse rounded-full bg-[color:var(--ui-fill-tertiary)]" />
        </>
      ) : (
        <>
          <p className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[color:var(--ui-text-primary)]">{value}</p>
          <p className="mt-1 text-xs text-[color:var(--ui-text-secondary)]">{detail}</p>
        </>
      )}
    </article>
  );
}

function EmptyConsumption({ status, onOpenSettings }: Pick<IrrigationConsumptionPageProps, 'status' | 'onOpenSettings'>) {
  if (status === 'loading') {
    return (
      <div className="flex min-h-[17rem] items-end gap-2 rounded-[1.4rem] bg-[color:var(--ui-fill-tertiary)] px-5 pb-5 pt-12" aria-label="Caricamento grafico consumi">
        {[38, 64, 48, 82, 56, 72, 44, 68].map((height, index) => (
          <span key={`${height}-${index}`} className="min-w-0 flex-1 animate-pulse rounded-t-xl bg-[color:var(--ui-fill-secondary)]" style={{ height: `${height}%`, animationDelay: `${index * 55}ms` }} />
        ))}
      </div>
    );
  }
  const title = status === 'insufficient'
      ? 'Storico non ancora sufficiente'
    : status === 'offline'
      ? 'Home Assistant non è raggiungibile'
      : status === 'error'
        ? 'Storico non disponibile'
        : 'Collega un contatore dell’acqua';
  const description = status === 'insufficient'
      ? 'Il contatore è configurato correttamente, ma Home Assistant non ha ancora registrato almeno due campioni utili.'
    : status === 'empty'
      ? 'Associa un sensore cumulativo per visualizzare consumi e andamento reali.'
      : 'I dati già disponibili restano al loro posto; riproveremo alla prossima apertura.';
  return (
    <div className="flex min-h-[17rem] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-[color:var(--ui-border)] px-6 text-center">
      <span className="liquid-glass-control flex h-12 w-12 items-center justify-center rounded-full">
        <Droplets className="h-5 w-5 text-[color:var(--ui-text-secondary)]" />
      </span>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[color:var(--ui-text-secondary)]">{description}</p>
      {status === 'empty' && onOpenSettings ? (
        <button type="button" onClick={onOpenSettings} className="liquid-glass-control mt-4 inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold">
          <Settings2 className="h-4 w-4" /> Configura contatore
        </button>
      ) : null}
    </div>
  );
}

export default function IrrigationConsumptionPage({
  period,
  onPeriodChange,
  status,
  totalLiters,
  dailyAverageLiters,
  comparisonPct,
  points,
  zones,
  configuredZones,
  plannedMinutes,
  dataSourceLabel,
  isRefreshing = false,
  isStale = false,
  updatedAt = null,
  isEstimatedBreakdown,
  onOpenSettings,
  onManageZones,
}: IrrigationConsumptionPageProps) {
  const maxPoint = Math.max(1, ...points.map((point) => point.value));
  const comparisonPositive = comparisonPct !== null && comparisonPct <= 0;
  const ComparisonIcon = comparisonPositive ? TrendingDown : TrendingUp;
  const comparisonValue = comparisonPct === null ? 'N/D' : `${comparisonPct > 0 ? '+' : ''}${comparisonPct}%`;
  const isInitialLoading = status === 'loading';
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="mx-auto w-full max-w-[92rem] pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-h-5 items-center gap-2 text-xs text-[color:var(--ui-text-secondary)]">
          {isRefreshing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
          <span>{isRefreshing ? 'Aggiornamento in background' : isStale ? `Ultimi dati${updatedLabel ? ` · ${updatedLabel}` : ''}` : 'Seleziona il periodo da analizzare'}</span>
        </div>
        <GlassSegmentSelect
          value={period}
          onChange={onPeriodChange}
          options={PERIOD_OPTIONS}
          ariaLabel="Periodo consumi"
          className="w-full sm:w-[22rem]"
          optionClassName="!h-9 !px-2"
        />
      </div>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard icon={Droplets} eyebrow="Acqua erogata" value={formatLiters(totalLiters, true)} detail={dataSourceLabel} loading={isInitialLoading} />
        <SummaryCard icon={Gauge} eyebrow="Media giornaliera" value={formatLiters(dailyAverageLiters)} detail="Nel periodo selezionato" tone="cyan" loading={isInitialLoading} />
        <SummaryCard icon={ComparisonIcon} eyebrow="Rispetto al riferimento" value={comparisonValue} detail={comparisonPct === null ? 'Sensore media non configurato' : comparisonPositive ? 'Consumo inferiore' : 'Consumo superiore'} tone={comparisonPositive ? 'lime' : 'neutral'} loading={isInitialLoading} />
      </section>

      <section className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <article className="rounded-[1.65rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-primary)] p-4 shadow-[var(--ui-shadow-card)] sm:p-5 xl:col-span-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--ui-text-tertiary)]">Andamento</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">Distribuzione nel tempo</h2>
            </div>
            {status === 'available' ? <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${isStale ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300' : 'bg-lime-500/12 text-lime-700 dark:text-lime-300'}`}>{isRefreshing ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}{isRefreshing ? 'Aggiornamento' : isStale ? 'Cache' : 'Dati HA'}</span> : null}
          </div>
          {status !== 'available' || points.length === 0 ? (
            <div className="mt-4"><EmptyConsumption status={status} onOpenSettings={onOpenSettings} /></div>
          ) : (
            <div className="mt-6">
              <div className="flex h-56 items-end gap-1.5 sm:gap-2" aria-label="Grafico consumi irrigazione">
                {points.map((point) => (
                  <div key={point.key} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
                    <div className="relative flex min-h-0 flex-1 items-end">
                      <span className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-[color:var(--ui-text-primary)] px-2 py-1 text-[9px] font-semibold text-[color:var(--ui-bg-canvas)] group-hover:block">{formatLiters(point.value)}</span>
                      <span className="block w-full rounded-t-xl bg-[linear-gradient(180deg,rgba(132,204,22,0.95),rgba(34,197,94,0.4))] transition-[height] duration-500" style={{ height: `${Math.max(4, (point.value / maxPoint) * 100)}%` }} />
                    </div>
                    <span className="mt-2 truncate text-center text-[8px] font-semibold uppercase text-[color:var(--ui-text-tertiary)]">{point.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        <article className="rounded-[1.65rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-primary)] p-4 shadow-[var(--ui-shadow-card)] sm:p-5 xl:col-span-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--ui-text-tertiary)]">Ripartizione per zona</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">Dove va l’acqua</h2>
            </div>
            {isEstimatedBreakdown ? <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-[9px] font-semibold text-amber-700 dark:text-amber-300">Stima</span> : null}
          </div>
          <div className="mt-5 space-y-4">
            {zones.length ? zones.map((zone) => (
              <div key={zone.id}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate font-semibold">{zone.name}</span>
                  <span className="shrink-0 text-[color:var(--ui-text-secondary)]">{formatLiters(zone.liters, true)} · {zone.share}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--ui-fill-tertiary)]"><span className="block h-full rounded-full bg-lime-500" style={{ width: `${Math.max(zone.share > 0 ? 4 : 0, zone.share)}%` }} /></div>
                <p className="mt-1 text-[9px] text-[color:var(--ui-text-tertiary)]">{zone.plannedMinutes} min programmati/settimana</p>
              </div>
            )) : (
              <button type="button" onClick={onManageZones} disabled={!onManageZones} className="flex min-h-36 w-full flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-[color:var(--ui-border)] px-4 text-center disabled:cursor-default">
                <Sprout className="h-5 w-5 text-[color:var(--ui-text-secondary)]" />
                <span className="mt-2 text-sm font-semibold">Configura le zone</span>
                <span className="mt-1 text-[10px] text-[color:var(--ui-text-secondary)]">La ripartizione apparirà qui.</span>
              </button>
            )}
          </div>
          {isEstimatedBreakdown && zones.length ? <p className="mt-5 border-t border-[color:var(--ui-border)] pt-3 text-[10px] leading-4 text-[color:var(--ui-text-tertiary)]">Stima proporzionale ai minuti programmati. I cicli manuali possono modificare il consumo reale.</p> : null}
        </article>
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard icon={CalendarClock} eyebrow="Durata pianificata" value={`${plannedMinutes} min`} detail="Ogni settimana" tone="neutral" />
        <SummaryCard icon={Sprout} eyebrow="Zone collegate" value={`${configuredZones}`} detail="Con comando Home Assistant" tone="lime" />
        <SummaryCard icon={CircleGauge} eyebrow="Copertura dati" value={status === 'available' ? 'Attiva' : 'Da completare'} detail={status === 'available' ? 'Storico disponibile' : 'Apri le impostazioni'} tone="cyan" />
        <button type="button" onClick={onOpenSettings} disabled={!onOpenSettings} className="group rounded-[1.5rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-primary)] p-4 text-left shadow-[var(--ui-shadow-card)] disabled:cursor-default sm:p-5">
          <Settings2 className="h-4 w-4 text-[color:var(--ui-text-secondary)]" />
          <p className="mt-4 text-sm font-semibold">Sorgenti consumo</p>
          <p className="mt-1 text-xs text-[color:var(--ui-text-secondary)]">{onOpenSettings ? 'Configura contatore e riferimento' : 'Gestite da Owner e Admin'}</p>
          {onOpenSettings ? <ChevronRight className="mt-3 h-4 w-4 text-[color:var(--ui-text-tertiary)] transition-transform group-hover:translate-x-1" /> : null}
        </button>
      </section>
    </div>
  );
}
