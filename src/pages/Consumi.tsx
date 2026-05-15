import React from 'react';
import { BarChart3, Bolt, Droplets, Flame, Gauge, Leaf, Radio } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GuidedSetupOverlay, type GuidedSetupStep } from '../components/settings/GuidedSetupOverlay';
import type {
  ConsumptionCardId,
  ConsumptionDashboardData,
  ConsumptionEntityConfig,
} from '../hooks/useConsumptionConfig';
import { AcquaDetail } from './consumi/AcquaDetail';
import { EnergiaDetail } from './consumi/EnergiaDetail';
import { GasDetail } from './consumi/GasDetail';
import { ReportDetail } from './consumi/ReportDetail';
import type { IntervalKey } from './consumi/shared';
import { isOnboardingCompleted, markOnboardingCompleted } from '../services/onboardingStorage';

type Props = {
  embedded?: boolean;
  suppressBrowserNavigation?: boolean;
  navigationRoute?: string;
  data?: ConsumptionDashboardData;
  config?: ConsumptionEntityConfig;
  isEditMode?: boolean;
  selectedCardId?: ConsumptionCardId | null;
  onSelectCard?: (cardId: ConsumptionCardId) => void;
};

type ActiveView = 'overview' | ConsumptionCardId;

type UtilityMetric = {
  value: string;
  label: string;
};

type UtilityCardDefinition = {
  id: ConsumptionCardId;
  title: string;
  metrics: UtilityMetric[];
  icon: React.ReactNode;
  glowClassName: string;
  accentClassName: string;
};

type GlobalMetricDefinition = {
  value: string;
  label: string;
  icon: React.ReactNode;
};

const BACKDROP_IMAGE =
  'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=2200&q=80';

const DEFAULT_CARD_TITLES: Record<ConsumptionCardId, string> = {
  electricity: 'Energia',
  water: 'Acqua',
  gas: 'Gas',
  trend: 'Report',
};

const DEFAULT_CARD_ROUTES: Record<ConsumptionCardId, string> = {
  electricity: '/consumi/energia',
  water: '/consumi/acqua',
  gas: '/consumi/gas',
  trend: '/consumi/report',
};

const DEFAULT_DATA: ConsumptionDashboardData = {
  solarPowerKw: 5.0,
  gridPowerKw: 2.5,
  homePowerKw: 2.5,
  batterySocPct: 60,
  batteryPowerKw: 0.5,
  evSocPct: 45,
  evPowerKw: 0,
  solarMixPct: 70,
  waterCurrentLiters: 240,
  waterGoalLiters: 400,
  waterRainRecoveryLitersPerMin: 4.2,
  gasTodayCubicMeters: 1.2,
  weeklyTrendPoints: [46, 54, 48, 66, 60, 72, 68],
};

const FALLBACK_SEGMENT_CARD: Record<string, ConsumptionCardId> = {
  energia: 'electricity',
  elettricita: 'electricity',
  electricity: 'electricity',
  acqua: 'water',
  water: 'water',
  gas: 'gas',
  metano: 'gas',
  report: 'trend',
  trend: 'trend',
};

const DETAIL_INTERVAL_DEFAULT: Record<ConsumptionCardId, IntervalKey> = {
  electricity: '24H',
  water: '24H',
  gas: '24H',
  trend: '30G',
};

const ENERGY_GUIDE_STORAGE_KEY = 'ha.dashboard.onboarding.energy.v1';
const ENERGY_GUIDE_STEPS: GuidedSetupStep[] = [
  {
    title: 'Panoramica energia',
    description:
      'Questa vista mostra produzione, rete, accumulo e consumi in tempo reale con indicatori rapidi di efficienza.',
  },
  {
    title: 'Dettagli e confronto',
    description:
      'Apri la card Energia per entrare nel dettaglio e analizzare andamento, trend e costi stimati della giornata.',
  },
  {
    title: 'Configurazione guidata sensori',
    description:
      'In modalita edit puoi associare le entita Home Assistant per alimentare il pannello con i tuoi dati reali.',
    hint: 'La configurazione del pannello consumi si salva automaticamente.',
  },
];

function cn(...values: Array<string | false | null | undefined>) {
  return twMerge(clsx(values));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeRoute(route: string, fallback: string) {
  const trimmed = route.trim();
  if (!trimmed) {
    return fallback;
  }
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('?') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }
  return `/${trimmed}`;
}

function isConsumptionRoute(route: string) {
  try {
    const parsed = new URL(route, 'http://dashboard.local');
    const pathname = parsed.pathname.toLowerCase();
    const hash = parsed.hash.toLowerCase();
    const view = (parsed.searchParams.get('view') ?? '').trim().toLowerCase();
    const pathSegments = pathname.split('/').filter(Boolean);
    const hashNormalized = hash.replace(/^#/, '').replace(/^\//, '');
    const hashSegments = hashNormalized.split('/').filter(Boolean);
    const pathHasConsumi = pathSegments.includes('consumi');
    const hashHasConsumi = hashSegments.includes('consumi') || hashNormalized === 'consumi';

    return pathHasConsumi || hash === '#consumi' || hashHasConsumi || view === 'consumi';
  } catch {
    return false;
  }
}

function isRouteMatch(currentHref: string, route: string) {
  try {
    const current = new URL(currentHref, 'http://dashboard.local');
    const target = new URL(route, 'http://dashboard.local');
    const currentPath = current.pathname.toLowerCase();
    const targetPath = target.pathname.toLowerCase();

    if (currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)) {
      return true;
    }

    const currentHash = current.hash.toLowerCase().replace(/^#/, '').replace(/^\//, '');
    const targetHash = target.hash.toLowerCase().replace(/^#/, '').replace(/^\//, '');
    return Boolean(targetHash) && (currentHash === targetHash || currentHash.startsWith(`${targetHash}/`));
  } catch {
    return false;
  }
}

function resolveOverviewRoute(href: string) {
  try {
    const parsed = new URL(href, 'http://dashboard.local');
    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    const hashNormalized = parsed.hash.replace(/^#/, '').replace(/^\//, '');
    const hashSegments = hashNormalized.split('/').filter(Boolean);

    const pathIndex = pathSegments.findIndex((segment) => segment.toLowerCase() === 'consumi');
    if (pathIndex >= 0) {
      return `/${pathSegments.slice(0, pathIndex + 1).join('/')}`;
    }

    const hashIndex = hashSegments.findIndex((segment) => segment.toLowerCase() === 'consumi');
    if (hashIndex >= 0) {
      return `#/${hashSegments.slice(0, hashIndex + 1).join('/')}`;
    }
  } catch {
    return '/consumi';
  }

  return '/consumi';
}

function resolveActiveViewFromLocation(
  href: string,
  routesByCard: Record<ConsumptionCardId, string>,
): ActiveView {
  const match = (Object.entries(routesByCard) as Array<[ConsumptionCardId, string]>).find(([, route]) =>
    isRouteMatch(href, route),
  );
  if (match) {
    return match[0];
  }

  try {
    const parsed = new URL(href, 'http://dashboard.local');
    const pathSegments = parsed.pathname.toLowerCase().split('/').filter(Boolean);
    const hashNormalized = parsed.hash.toLowerCase().replace(/^#/, '').replace(/^\//, '');
    const hashSegments = hashNormalized.split('/').filter(Boolean);

    const pathIndex = pathSegments.indexOf('consumi');
    if (pathIndex >= 0) {
      const next = pathSegments[pathIndex + 1];
      return next && FALLBACK_SEGMENT_CARD[next] ? FALLBACK_SEGMENT_CARD[next] : 'overview';
    }

    const hashIndex = hashSegments.indexOf('consumi');
    if (hashIndex >= 0) {
      const next = hashSegments[hashIndex + 1];
      return next && FALLBACK_SEGMENT_CARD[next] ? FALLBACK_SEGMENT_CARD[next] : 'overview';
    }
  } catch {
    return 'overview';
  }

  return 'overview';
}

function formatDecimal(value: number, digits = 1) {
  return value.toLocaleString('it-IT', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatCurrency(value: number) {
  return value.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function GlobalMetric({ value, label, icon }: GlobalMetricDefinition) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_12px_30px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/80">
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-white/50">{label}</p>
        </div>
      </div>
    </div>
  );
}

function UtilityCard({
  title,
  metrics,
  icon,
  glowClassName,
  accentClassName,
  active,
  onClick,
}: {
  title: string;
  metrics: UtilityMetric[];
  icon: React.ReactNode;
  glowClassName: string;
  accentClassName: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative min-h-[13.75rem] cursor-pointer overflow-hidden rounded-[1.65rem] border border-white/10 bg-white/[0.06] p-5 text-left backdrop-blur-2xl sm:min-h-[16rem] sm:rounded-[2rem] sm:p-6 xl:h-80 xl:p-8',
        'flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:bg-white/[0.1] active:scale-95',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_24px_50px_rgba(0,0,0,0.3)]',
        active ? 'border-sky-300/45 bg-sky-400/12 shadow-[0_0_0_1px_rgba(125,211,252,0.32)]' : '',
      )}
    >
      <div className={cn('pointer-events-none absolute inset-0 opacity-80', accentClassName)} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_38%,rgba(15,23,42,0.18)_100%)]" />

      <h3 className="relative z-10 text-2xl font-medium tracking-tight text-white sm:text-3xl">{title}</h3>

      <div className="relative z-10 space-y-3 sm:space-y-4">
        {metrics.map((metric) => (
          <div key={`${title}-${metric.label}`}>
            <p className="text-xl font-bold leading-none text-white sm:text-2xl">{metric.value}</p>
            <p className="mt-1 text-xs text-white/50 sm:text-sm">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className={cn('pointer-events-none absolute -bottom-8 -right-8 h-36 w-36 rounded-full blur-2xl sm:h-44 sm:w-44', glowClassName)} />
      <div className="pointer-events-none absolute bottom-4 right-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/85 shadow-[0_14px_28px_rgba(0,0,0,0.32)] sm:bottom-5 sm:right-5 sm:h-24 sm:w-24 sm:rounded-3xl">
        {icon}
      </div>
    </button>
  );
}

export function ConsumptionDashboardPage({
  embedded,
  suppressBrowserNavigation = false,
  navigationRoute,
  data,
  config,
  isEditMode = false,
  selectedCardId = null,
  onSelectCard,
}: Props) {
  const dashboardData = data ?? DEFAULT_DATA;

  const cardTitles = React.useMemo<Record<ConsumptionCardId, string>>(
    () => ({
      electricity: config?.electricityCardTitle?.trim() || DEFAULT_CARD_TITLES.electricity,
      water: config?.waterCardTitle?.trim() || DEFAULT_CARD_TITLES.water,
      gas: config?.gasCardTitle?.trim() || DEFAULT_CARD_TITLES.gas,
      trend: config?.trendCardTitle?.trim() || DEFAULT_CARD_TITLES.trend,
    }),
    [config?.electricityCardTitle, config?.waterCardTitle, config?.gasCardTitle, config?.trendCardTitle],
  );

  const routesByCard = React.useMemo<Record<ConsumptionCardId, string>>(
    () => ({
      electricity: normalizeRoute(
        config?.electricityCardRoute ?? DEFAULT_CARD_ROUTES.electricity,
        DEFAULT_CARD_ROUTES.electricity,
      ),
      water: normalizeRoute(config?.waterCardRoute ?? DEFAULT_CARD_ROUTES.water, DEFAULT_CARD_ROUTES.water),
      gas: normalizeRoute(config?.gasCardRoute ?? DEFAULT_CARD_ROUTES.gas, DEFAULT_CARD_ROUTES.gas),
      trend: normalizeRoute(config?.trendCardRoute ?? DEFAULT_CARD_ROUTES.trend, DEFAULT_CARD_ROUTES.trend),
    }),
    [config?.electricityCardRoute, config?.waterCardRoute, config?.gasCardRoute, config?.trendCardRoute],
  );

  const [activeView, setActiveView] = React.useState<ActiveView>(() => {
    if (typeof window === 'undefined') {
      return 'overview';
    }
    return resolveActiveViewFromLocation(window.location.href, routesByCard);
  });

  const [detailIntervals, setDetailIntervals] =
    React.useState<Record<ConsumptionCardId, IntervalKey>>(DETAIL_INTERVAL_DEFAULT);
  const [isEnergyGuideCompleted, setIsEnergyGuideCompleted] = React.useState(() =>
    isOnboardingCompleted(ENERGY_GUIDE_STORAGE_KEY),
  );
  const shouldShowEnergyGuide = activeView === 'electricity' && !isEditMode && !isEnergyGuideCompleted;

  const dismissEnergyGuide = React.useCallback(() => {
    markOnboardingCompleted(ENERGY_GUIDE_STORAGE_KEY);
    setIsEnergyGuideCompleted(true);
  }, []);

  const todayLabel = React.useMemo(
    () =>
      new Intl.DateTimeFormat('it-IT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    [],
  );

  const overviewRoute = React.useMemo(() => {
    if (typeof window === 'undefined') {
      return '/consumi';
    }
    const fromLocation = resolveOverviewRoute(window.location.href);
    if (fromLocation !== '/consumi') {
      return fromLocation;
    }
    return resolveOverviewRoute(routesByCard.electricity);
  }, [routesByCard.electricity]);

  const pushRoute = React.useCallback((targetRoute: string, replace = false) => {
    if (typeof window === 'undefined' || suppressBrowserNavigation) {
      return;
    }

    const normalizedTarget = normalizeRoute(targetRoute, '/consumi');
    if (/^https?:\/\//i.test(normalizedTarget)) {
      if (normalizedTarget !== window.location.href) {
        window.location.assign(normalizedTarget);
      }
      return;
    }

    try {
      const target = new URL(normalizedTarget, window.location.origin);
      const next = `${target.pathname}${target.search}${target.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (next === current) {
        return;
      }
      if (replace) {
        window.history.replaceState({}, '', next);
      } else {
        window.history.pushState({}, '', next);
      }
    } catch {
      if (replace) {
        window.history.replaceState({}, '', normalizedTarget);
      } else {
        window.history.pushState({}, '', normalizedTarget);
      }
    }
  }, [suppressBrowserNavigation]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || suppressBrowserNavigation) {
      return undefined;
    }

    const handlePopState = () => {
      setActiveView(resolveActiveViewFromLocation(window.location.href, routesByCard));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [routesByCard, suppressBrowserNavigation]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || suppressBrowserNavigation) {
      return;
    }
    setActiveView(resolveActiveViewFromLocation(window.location.href, routesByCard));
  }, [routesByCard, suppressBrowserNavigation]);

  React.useEffect(() => {
    if (!suppressBrowserNavigation || !navigationRoute) {
      return;
    }
    setActiveView(resolveActiveViewFromLocation(navigationRoute, routesByCard));
  }, [navigationRoute, routesByCard, suppressBrowserNavigation]);

  React.useEffect(() => {
    if (!isEditMode || activeView === 'overview') {
      return;
    }
    setActiveView('overview');
    pushRoute(overviewRoute, true);
  }, [activeView, isEditMode, overviewRoute, pushRoute]);

  const setIntervalForCard = React.useCallback((cardId: ConsumptionCardId, value: IntervalKey) => {
    setDetailIntervals((current) => ({
      ...current,
      [cardId]: value,
    }));
  }, []);

  const handleCardClick = React.useCallback(
    (cardId: ConsumptionCardId) => {
      onSelectCard?.(cardId);
      if (isEditMode) {
        return;
      }

      const targetRoute = routesByCard[cardId];
      if (!isConsumptionRoute(targetRoute)) {
        if (suppressBrowserNavigation) {
          return;
        }
        if (typeof window !== 'undefined') {
          window.location.assign(normalizeRoute(targetRoute, '/'));
        }
        return;
      }

      setActiveView(cardId);
      pushRoute(targetRoute);
    },
    [isEditMode, onSelectCard, pushRoute, routesByCard, suppressBrowserNavigation],
  );

  const handleBackToOverview = React.useCallback(() => {
    setActiveView('overview');
    pushRoute(overviewRoute);
  }, [overviewRoute, pushRoute]);

  const potenzaAttualeKw = Number(
    (Math.max(dashboardData.solarPowerKw, dashboardData.homePowerKw) + 0.2).toFixed(1),
  );
  const autosufficienzaPct = clamp(Number((dashboardData.solarMixPct * 0.91 + 23.6).toFixed(1)), 0, 100);
  const efficienzaSistemaPct = clamp(Number((90 + (dashboardData.solarMixPct / 100) * 6.8).toFixed(1)), 0, 100);

  const energiaTotale = Number((dashboardData.homePowerKw * 4.96).toFixed(1));
  const energiaCosto = Number((energiaTotale * 0.174).toFixed(2));
  const ritornoSolare = clamp(Number((dashboardData.solarMixPct * 0.267).toFixed(1)), 0, 100);

  const efficienzaAcqua = clamp(
    Number(
      (
        100 -
        (dashboardData.waterCurrentLiters / Math.max(1, dashboardData.waterGoalLiters)) * 28.5
      ).toFixed(1),
    ),
    0,
    100,
  );
  const flussoMassimo = Math.max(1, Math.round(dashboardData.waterCurrentLiters / 16));

  const consumoGas = Number((dashboardData.gasTodayCubicMeters * 3.5).toFixed(1));
  const potenzaTermica = Number((consumoGas * 4.14).toFixed(1));
  const utilizzoGas = clamp(Number((consumoGas * 8.5).toFixed(1)), 0, 100);

  const globalMetrics = React.useMemo<GlobalMetricDefinition[]>(
    () => [
      {
        value: `${formatDecimal(potenzaAttualeKw)} kW`,
        label: 'POTENZA ATTUALE',
        icon: <Bolt size={20} />,
      },
      {
        value: '50.0 Hz',
        label: 'FREQUENZA RETE',
        icon: <Radio size={20} />,
      },
      {
        value: `${formatDecimal(autosufficienzaPct)}%`,
        label: 'AUTOSUFFICIENZA',
        icon: <Leaf size={20} />,
      },
      {
        value: `${formatDecimal(efficienzaSistemaPct)}%`,
        label: 'EFFICIENZA SISTEMA',
        icon: <Gauge size={20} />,
      },
    ],
    [autosufficienzaPct, efficienzaSistemaPct, potenzaAttualeKw],
  );

  const utilityCards = React.useMemo<UtilityCardDefinition[]>(
    () => [
      {
        id: 'electricity',
        title: cardTitles.electricity,
        metrics: [
          { value: `${formatDecimal(energiaTotale)} kWh`, label: 'Totale Odierno' },
          { value: `EUR ${formatCurrency(energiaCosto)}`, label: 'Costo Stimato' },
          { value: `${formatDecimal(ritornoSolare)}%`, label: 'Ritorno Solare' },
        ],
        icon: <Bolt size={48} />,
        glowClassName: 'bg-emerald-400/45',
        accentClassName: 'bg-[radial-gradient(circle_at_22%_24%,rgba(16,185,129,0.28)_0%,transparent_62%)]',
      },
      {
        id: 'water',
        title: cardTitles.water,
        metrics: [
          { value: `${Math.round(dashboardData.waterCurrentLiters)} L`, label: 'Erogazione Totale' },
          { value: `${flussoMassimo} L/m`, label: 'Flusso Massimo' },
          { value: `${formatDecimal(efficienzaAcqua)}%`, label: 'Efficienza Rete' },
        ],
        icon: <Droplets size={48} />,
        glowClassName: 'bg-cyan-400/45',
        accentClassName: 'bg-[radial-gradient(circle_at_20%_24%,rgba(34,211,238,0.3)_0%,transparent_60%)]',
      },
      {
        id: 'gas',
        title: cardTitles.gas,
        metrics: [
          { value: `${formatDecimal(consumoGas)} Sm3`, label: 'Consumo Attivo' },
          { value: `${formatDecimal(potenzaTermica)} kW`, label: 'Potenza Termica' },
          { value: `${formatDecimal(utilizzoGas)}%`, label: 'Utilizzo Medio' },
        ],
        icon: <Flame size={48} />,
        glowClassName: 'bg-orange-400/45',
        accentClassName: 'bg-[radial-gradient(circle_at_24%_26%,rgba(251,146,60,0.3)_0%,transparent_62%)]',
      },
      {
        id: 'trend',
        title: cardTitles.trend,
        metrics: [
          { value: '24', label: 'Report Attivi' },
          { value: '147', label: 'Download Totali' },
          { value: '12', label: 'Condivisi' },
        ],
        icon: <BarChart3 size={48} />,
        glowClassName: 'bg-sky-400/45',
        accentClassName: 'bg-[radial-gradient(circle_at_22%_24%,rgba(56,189,248,0.3)_0%,transparent_62%)]',
      },
    ],
    [
      cardTitles.electricity,
      cardTitles.gas,
      cardTitles.trend,
      cardTitles.water,
      consumoGas,
      dashboardData.waterCurrentLiters,
      efficienzaAcqua,
      energiaCosto,
      energiaTotale,
      flussoMassimo,
      potenzaTermica,
      ritornoSolare,
      utilizzoGas,
    ],
  );

  const progressTicks = React.useMemo(() => {
    const total = 40;
    const activeCount = Math.round((total * clamp(dashboardData.solarMixPct, 0, 100)) / 100);
    return Array.from({ length: total }, (_, index) => index < activeCount);
  }, [dashboardData.solarMixPct]);

  const detailContent = React.useMemo(() => {
    if (activeView === 'overview') {
      return null;
    }

    const interval = detailIntervals[activeView];
    const title = `Dettaglio ${cardTitles[activeView]}`;
    const onIntervalChange = (value: IntervalKey) => setIntervalForCard(activeView, value);

    if (activeView === 'electricity') {
      return (
        <EnergiaDetail
          title={title}
          interval={interval}
          onIntervalChange={onIntervalChange}
          onBack={handleBackToOverview}
          dashboardData={dashboardData}
          config={config}
        />
      );
    }
    if (activeView === 'water') {
      return (
        <AcquaDetail
          title={title}
          interval={interval}
          onIntervalChange={onIntervalChange}
          onBack={handleBackToOverview}
          dashboardData={dashboardData}
          config={config}
        />
      );
    }
    if (activeView === 'gas') {
      return (
        <GasDetail
          title={title}
          interval={interval}
          onIntervalChange={onIntervalChange}
          onBack={handleBackToOverview}
        />
      );
    }
    return (
      <ReportDetail
        title={title}
        interval={interval}
        onIntervalChange={onIntervalChange}
        onBack={handleBackToOverview}
      />
    );
  }, [activeView, cardTitles, config, dashboardData, detailIntervals, handleBackToOverview, setIntervalForCard]);

  return (
    <div className={cn('relative h-full w-full overflow-hidden text-white', embedded ? '' : 'min-h-screen')}>
      <div
        className={cn(
          'pointer-events-none absolute -inset-16 transition-opacity duration-500',
          activeView === 'overview' ? 'opacity-100' : 'opacity-35',
        )}
      >
        <img
          src={BACKDROP_IMAGE}
          alt="Sfondo sostenibilita"
          className="h-full w-full object-cover opacity-52 saturate-[0.95] contrast-[1.02]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.2)_0%,rgba(2,6,23,0.12)_36%,rgba(2,6,23,0.2)_100%)]" />
        <div className="absolute inset-0 backdrop-blur-[0.6px]" />
      </div>

      <div className="relative z-10 h-full min-h-0">
        {activeView === 'overview' ? (
          <div className="h-full min-h-0 overflow-y-auto px-4 py-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:p-6 lg:p-10">
            <div className="flex min-h-full flex-col">
              <header>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Hub Sostenibilità e Consumi
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 sm:text-lg">
                  Ottieni insight in tempo reale sui consumi della tua casa. Oggi hai risparmiato il 14% rispetto alla
                  media settimanale.
                </p>
              </header>

              <section className="mt-5 w-full max-w-[1280px] sm:mt-7">
                <div className="rounded-full border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] sm:p-2">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {progressTicks.map((isActive, index) => (
                      <span
                        key={`tick-${index}`}
                        className={cn(
                          'h-4 flex-1 rounded-full transition-colors duration-300 sm:h-7',
                          isActive ? 'bg-emerald-400/92 shadow-[0_0_18px_rgba(52,211,153,0.46)]' : 'bg-white/12',
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {globalMetrics.map((metric) => (
                    <GlobalMetric key={metric.label} value={metric.value} label={metric.label} icon={metric.icon} />
                  ))}
                </div>
              </section>

              <section className="mt-7 pt-0 lg:mt-auto lg:pt-10">
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
                  {utilityCards.map((card) => (
                    <UtilityCard
                      key={card.id}
                      title={card.title}
                      metrics={card.metrics}
                      icon={card.icon}
                      glowClassName={card.glowClassName}
                      accentClassName={card.accentClassName}
                      active={isEditMode && selectedCardId === card.id}
                      onClick={() => handleCardClick(card.id)}
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>
        ) : (
          detailContent
        )}
      </div>

      <GuidedSetupOverlay
        isOpen={shouldShowEnergyGuide}
        tag="Pannello energia"
        heading="Configurazione guidata energia"
        steps={ENERGY_GUIDE_STEPS}
        onDismiss={dismissEnergyGuide}
        completeLabel="Inizia monitoraggio"
        skipLabel="Chiudi"
      />
    </div>
  );
}

export default ConsumptionDashboardPage;
