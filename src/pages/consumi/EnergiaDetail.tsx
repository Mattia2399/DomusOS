import React from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Battery, Home, MoonStar, SunMedium, TowerControl } from 'lucide-react';
import type { ConsumptionDashboardData, ConsumptionEntityConfig } from '../../hooks/useConsumptionConfig';
import { ChartCard, DetailScaffold, IntervalKey, IntervalPills, PremiumTooltip, buildSeries } from './shared';
import { MOCK_DEVICES, OrbitalDevices } from './orbitalDevices';

type EnergyMode = 'GIORNO' | 'NOTTE';

const SOLAR_HOME_PATH = 'M 50 18 L 50 50';
const GRID_HOME_PATH = 'M 25 82 L 50 50';
const HOME_BATTERY_PATH = 'M 50 50 L 78 50';
const BATTERY_HOME_PATH = 'M 78 50 L 50 50';

const FALLBACK_DATA: ConsumptionDashboardData = {
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isConfigured(value?: string) {
  if (value === undefined) {
    return true;
  }
  return value.trim().length > 0;
}

function formatKw(value: number) {
  return `${value.toLocaleString('it-IT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} kW`;
}

function buildEnergyData(interval: IntervalKey, productionBase: number, consumptionBase: number) {
  const length = interval === '24H' ? 24 : interval === '7G' ? 7 : 30;
  const production = buildSeries(length, productionBase, interval === '24H' ? 1.3 : 1.1, 0.4);
  const consumption = buildSeries(length, consumptionBase, interval === '24H' ? 1.0 : 0.8, 1.1);

  const labels = Array.from({ length }, (_, index) => {
    if (interval === '24H') {
      return `${String(index).padStart(2, '0')}:00`;
    }
    if (interval === '7G') {
      return ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'][index] ?? `G${index + 1}`;
    }
    return `${index + 1}`;
  });

  return labels.map((label, index) => ({
    label,
    produzione: production[index],
    consumo: consumption[index],
  }));
}

function NodeChip({
  label,
  value,
  icon,
  positionClassName,
  active,
  accentClassName,
  isCenter = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  positionClassName: string;
  active: boolean;
  accentClassName: string;
  isCenter?: boolean;
}) {
  return (
    <motion.div
      className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-2 backdrop-blur-xl ${positionClassName} ${
        isCenter ? 'h-24 w-24 sm:h-28 sm:w-28' : 'h-20 w-20 sm:h-24 sm:w-24'
      }`}
      animate={{
        boxShadow: active
          ? ['0 0 0 rgba(255,255,255,0)', '0 0 32px rgba(255,255,255,0.3)', '0 0 0 rgba(255,255,255,0)']
          : '0 0 0 rgba(255,255,255,0)',
        scale: isCenter && active ? [1, 1.03, 1] : 1,
      }}
      transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className={`absolute inset-0 rounded-full opacity-70 ${accentClassName}`} />
      <div className="relative flex h-full w-full flex-col items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] shadow-lg backdrop-blur-xl">
        <span className="text-white/85">{icon}</span>
        <p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-white/60 sm:text-[9px]">{label}</p>
        <p className="text-[10px] font-semibold text-white sm:text-[11px]">{value}</p>
      </div>
    </motion.div>
  );
}

// "Dardi luminosi" stile laser per il sistema orbitale
function OrbitalLasers({
  pathId,
  color,
  amount,
}: {
  pathId: string;
  color: string;
  amount: number;
}) {
  const count = clamp(Math.round(amount * 1.5), 2, 8);
  const duration = clamp(3.2 - Math.min(amount, 7) * 0.28, 1.1, 3.2);

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <g key={`${pathId}-${index}`}>
          {/* Core dot */}
          <circle r="0.42" fill={color}>
            <animateMotion
              dur={`${duration}s`}
              begin={`${-(index * duration) / count}s`}
              repeatCount="indefinite"
              rotate="auto"
            >
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
          {/* Soft glow */}
          <circle r="0.92" fill={color} fillOpacity="0.22">
            <animateMotion
              dur={`${duration}s`}
              begin={`${-(index * duration) / count}s`}
              repeatCount="indefinite"
              rotate="auto"
            >
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
        </g>
      ))}
    </>
  );
}

export function EnergiaDetail({
  title,
  interval,
  onIntervalChange,
  onBack,
  dashboardData,
  config,
}: {
  title: string;
  interval: IntervalKey;
  onIntervalChange: (value: IntervalKey) => void;
  onBack: () => void;
  dashboardData?: ConsumptionDashboardData;
  config?: ConsumptionEntityConfig;
}) {
  const liveData = dashboardData ?? FALLBACK_DATA;

  const visibleNodes = React.useMemo(
    () => ({
      solar: isConfigured(config?.solarPowerEntityId),
      grid: isConfigured(config?.gridPowerEntityId),
      home: isConfigured(config?.homePowerEntityId),
      battery:
        isConfigured(config?.batteryPowerEntityId) &&
        isConfigured(config?.batterySocEntityId),
    }),
    [
      config?.batteryPowerEntityId,
      config?.batterySocEntityId,
      config?.gridPowerEntityId,
      config?.homePowerEntityId,
      config?.solarPowerEntityId,
    ],
  );

  const solarKw = visibleNodes.solar ? Math.max(0, liveData.solarPowerKw) : 0;
  const gridKw = visibleNodes.grid ? Math.max(0, Math.abs(liveData.gridPowerKw)) : 0;
  const homeKw = visibleNodes.home ? Math.max(0, liveData.homePowerKw) : 0;
  const batteryPowerKw = visibleNodes.battery ? liveData.batteryPowerKw : 0;
  const batteryAbsKw = Math.max(0, Math.abs(batteryPowerKw));
  const batterySocPct = visibleNodes.battery ? clamp(Math.round(liveData.batterySocPct), 0, 100) : 0;

  const canDayFlow = visibleNodes.solar && visibleNodes.home;
  const canNightFlow = visibleNodes.grid && visibleNodes.home;
  const canBatteryFlow = visibleNodes.battery && visibleNodes.home;
  const batteryCharging = canBatteryFlow && batteryPowerKw > 0.05;
  const batteryDischarging = canBatteryFlow && batteryPowerKw < -0.05;
  const hasAnyConfiguredFlow = canDayFlow || canNightFlow || canBatteryFlow;

  const [mode, setMode] = React.useState<EnergyMode>(canDayFlow ? 'GIORNO' : 'NOTTE');

  React.useEffect(() => {
    if (mode === 'GIORNO' && !canDayFlow && canNightFlow) {
      setMode('NOTTE');
      return;
    }
    if (mode === 'NOTTE' && !canNightFlow && canDayFlow) {
      setMode('GIORNO');
    }
  }, [canDayFlow, canNightFlow, mode]);

  const dayFlowKw = canDayFlow ? Math.max(0.8, Math.min(solarKw || 0, homeKw || solarKw || 0)) : 0;
  const nightFlowKw = canNightFlow ? Math.max(0.8, gridKw || homeKw || 0) : 0;
  const energyDevices = React.useMemo(
    () => MOCK_DEVICES.filter((device) => device.type === 'energy'),
    [],
  );

  const chartData = React.useMemo(
    () =>
      buildEnergyData(
        interval,
        Math.max(0.5, canDayFlow ? solarKw : 1.8),
        Math.max(1.2, homeKw || 2.4),
      ),
    [canDayFlow, homeKw, interval, solarKw],
  );

  const pieData = React.useMemo(() => {
    if (!visibleNodes.solar && !visibleNodes.grid) {
      return [{ name: 'Nessuna Fonte', value: 100, color: '#475569' }];
    }
    if (!visibleNodes.grid) {
      return [{ name: 'Solare', value: 100, color: '#34d399' }];
    }
    if (!visibleNodes.solar) {
      return [{ name: 'Rete', value: 100, color: '#60a5fa' }];
    }

    const solarMix = clamp(liveData.solarMixPct, 0, 100);
    const gridMix = clamp(100 - solarMix, 0, 100);
    return [
      { name: 'Solare', value: solarMix, color: '#34d399' },
      { name: 'Rete', value: gridMix, color: '#60a5fa' },
    ];
  }, [liveData.solarMixPct, visibleNodes.grid, visibleNodes.solar]);

  const impactMetrics = React.useMemo(
    () => [
      {
        label: 'Resa Solare',
        value: 'Rendimento odierno: 18.4 kWh',
        compactValue: '18.4 kWh',
      },
      {
        label: 'Stato Batteria',
        value: 'Cicli oggi: 1.2 • Efficienza: 96%',
        compactValue: '1.2 cicli • 96%',
      },
      {
        label: 'Autonomia',
        value: 'Batteria residua: ~5 ore',
        compactValue: '~5 ore',
      },
    ],
    [],
  );

  const left = (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.5rem] bg-[#07131f] bg-[radial-gradient(circle_at_50%_42%,rgba(56,189,248,0.16)_0%,#07131f_72%)]">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.01)_40%,rgba(15,23,42,0.3)_100%)]" />

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-1 pb-14 pt-1 sm:px-3 sm:pb-[4.5rem] sm:pt-2">
        <div className="relative aspect-square h-full max-h-[min(100%,38rem)] w-full max-w-[38rem]">
          {/* ANELLI ORBITALI DI SFONDO */}
          <div className="absolute left-[50%] top-[50%] h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 bg-transparent" />
          <div className="absolute left-[50%] top-[50%] h-[90%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.02] bg-transparent" />

          <OrbitalDevices
            devices={energyDevices}
            centerX={50}
            centerY={50}
            radius={36}
            angleOffsetDeg={60}
            zClassName="z-30"
          />

          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
        <defs>
          <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {canDayFlow ? (
          <path id="orbit-solar-home" d={SOLAR_HOME_PATH} stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : null}
        {canNightFlow ? (
          <path id="orbit-grid-home" d={GRID_HOME_PATH} stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : null}
        {canBatteryFlow ? (
          <>
            <path id="orbit-home-battery-base" d={HOME_BATTERY_PATH} stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path id="orbit-battery-home" d={BATTERY_HOME_PATH} stroke="transparent" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : null}

        {/* LINEE LUMINOSE ATTIVE */}
        {canDayFlow ? (
          <motion.path
            d={SOLAR_HOME_PATH}
            stroke="rgba(250,204,21,0.8)"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            filter="url(#laserGlow)"
            animate={{ opacity: mode === 'GIORNO' ? [0.4, 0.9, 0.4] : 0.1 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : null}

        {canNightFlow ? (
          <motion.path
            d={GRID_HOME_PATH}
            stroke="rgba(96,165,250,0.8)"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            filter="url(#laserGlow)"
            animate={{ opacity: mode === 'NOTTE' ? [0.4, 0.9, 0.4] : 0.1 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : null}
        {batteryCharging ? (
          <motion.path
            d={HOME_BATTERY_PATH}
            stroke="rgba(34,197,94,0.84)"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            filter="url(#laserGlow)"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : null}
        {batteryDischarging ? (
          <motion.path
            d={BATTERY_HOME_PATH}
            stroke="rgba(16,185,129,0.86)"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            filter="url(#laserGlow)"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : null}

        {/* DARDI LASER */}
        {mode === 'GIORNO' && canDayFlow ? (
          <OrbitalLasers pathId="orbit-solar-home" color="rgba(250,204,21,1)" amount={dayFlowKw} />
        ) : null}
        {mode === 'NOTTE' && canNightFlow ? (
          <OrbitalLasers pathId="orbit-grid-home" color="rgba(96,165,250,1)" amount={nightFlowKw} />
        ) : null}
        {batteryCharging ? (
          <OrbitalLasers pathId="orbit-home-battery-base" color="rgba(34,197,94,1)" amount={Math.max(0.8, batteryAbsKw)} />
        ) : null}
        {batteryDischarging ? (
          <OrbitalLasers pathId="orbit-battery-home" color="rgba(16,185,129,1)" amount={Math.max(0.8, batteryAbsKw)} />
        ) : null}
      </svg>

      {/* NODI POSIZIONATI IN MODO ORBITALE CENTRICO */}
      {visibleNodes.solar ? (
        <NodeChip
          label="Solare"
          value={formatKw(solarKw)}
          icon={<SunMedium size={18} />}
          positionClassName="left-[50%] top-[18%]"
          active={mode === 'GIORNO' && canDayFlow}
          accentClassName="bg-[radial-gradient(circle,rgba(250,204,21,0.4)_0%,transparent_72%)]"
        />
      ) : null}

      {visibleNodes.grid ? (
        <NodeChip
          label="Rete"
          value={formatKw(gridKw)}
          icon={<TowerControl size={18} />}
          positionClassName="left-[25%] top-[82%]"
          active={mode === 'NOTTE' && canNightFlow}
          accentClassName="bg-[radial-gradient(circle,rgba(96,165,250,0.42)_0%,transparent_72%)]"
        />
      ) : null}

      {visibleNodes.home ? (
        <NodeChip
          label="Casa"
          value={formatKw(homeKw)}
          icon={<Home size={22} />}
          positionClassName="left-[50%] top-[50%]"
          active={(mode === 'GIORNO' && canDayFlow) || (mode === 'NOTTE' && canNightFlow)}
          accentClassName="bg-[radial-gradient(circle,rgba(255,255,255,0.4)_0%,transparent_72%)]"
          isCenter={true}
        />
      ) : null}
      {visibleNodes.battery ? (
        <NodeChip
          label="Batteria"
          value={`${batterySocPct}%`}
          icon={<Battery size={18} />}
          positionClassName="left-[78%] top-[50%]"
          active={batteryCharging || batteryDischarging}
          accentClassName="bg-[radial-gradient(circle,rgba(34,197,94,0.35)_0%,transparent_72%)]"
        />
      ) : null}
        </div>

        <div className="absolute bottom-3 left-1/2 z-40 -translate-x-1/2">
          <div className="flex rounded-full border border-white/[0.06] bg-white/[0.02] p-0.5">
            <button
              type="button"
              onClick={() => setMode('GIORNO')}
              disabled={!canDayFlow}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all ${
                mode === 'GIORNO'
                  ? 'bg-white/10 font-medium text-white shadow-sm backdrop-blur-md'
                  : 'text-white/40 hover:text-white/70'
              } ${!canDayFlow ? 'cursor-not-allowed opacity-35' : ''}`}
            >
              <SunMedium size={13} />
              Giorno
            </button>
            <button
              type="button"
              onClick={() => setMode('NOTTE')}
              disabled={!canNightFlow}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all ${
                mode === 'NOTTE'
                  ? 'bg-white/10 font-medium text-white shadow-sm backdrop-blur-md'
                  : 'text-white/40 hover:text-white/70'
              } ${!canNightFlow ? 'cursor-not-allowed opacity-35' : ''}`}
            >
              <MoonStar size={13} />
              Notte
            </button>
          </div>
        </div>
      </div>

      {!hasAnyConfiguredFlow ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center px-6">
          <div className="liquid-glass-card px-5 py-4 text-center">
            <p className="text-sm font-medium text-[color:var(--ui-text-primary)]">Configura almeno Casa + Solare, Casa + Rete o Casa + Batteria in modalita edit.</p>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 grid grid-cols-3 gap-1 border-t border-white/[0.04] bg-white/[0.01] px-2 py-2.5 sm:flex sm:justify-around sm:gap-2 sm:p-3">
        {impactMetrics.map((metric) => (
          <div key={metric.label} className="min-w-0 flex-1 px-1 text-center">
            <p className="truncate text-[0.66rem] font-medium leading-tight text-white/50 sm:text-xs">{metric.label}</p>
            <p className="mt-1 text-[0.78rem] font-semibold leading-tight text-white sm:hidden">{metric.compactValue}</p>
            <p className="mt-1 hidden text-sm font-semibold leading-snug text-white sm:block">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const right = (
    <>
      <ChartCard title="Produzione vs Consumo" controls={<IntervalPills value={interval} onChange={onIntervalChange} />}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={192}
          initialDimension={{ width: 320, height: 192 }}
        >
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
            <defs>
              <linearGradient id="energiaProdFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(50,215,75,0.15)" />
                <stop offset="100%" stopColor="rgba(50,215,75,0)" />
              </linearGradient>
              <linearGradient id="energiaConsFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(10,132,255,0.15)" />
                <stop offset="100%" stopColor="rgba(10,132,255,0)" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 500 }}
              minTickGap={16}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 500 }}
              width={32}
            />
            <Tooltip content={<PremiumTooltip suffix=" kW" />} />
            <Area type="monotone" dataKey="consumo" stroke="rgba(10,132,255,0.92)" strokeWidth={2.5} fill="url(#energiaConsFill)" />
            <Area type="monotone" dataKey="produzione" stroke="rgba(50,215,75,0.92)" strokeWidth={2.5} fill="url(#energiaProdFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Mix Energetico">
        <div className="flex h-full flex-col items-center justify-center">
          <div className="relative h-40 min-h-40 w-full min-w-0 sm:h-44">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={160}
              initialDimension={{ width: 320, height: 160 }}
            >
              <PieChart>
                <Tooltip content={<PremiumTooltip suffix="%" />} />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="75%"
                  outerRadius="90%"
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={2}
                  stroke="rgba(255,255,255,0.05)"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--ui-text-tertiary)]">Mix</p>
                <p className="text-xl font-bold tracking-tight text-[color:var(--ui-text-primary)]">
                  {pieData.length > 0
                    ? `${pieData[0].value.toLocaleString('it-IT', { maximumFractionDigits: 0 })}%`
                    : '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[color:var(--ui-text-secondary)]">
            {pieData.map((entry) => (
              <div key={`legend-${entry.name}`} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>
                  {entry.name} {entry.value.toLocaleString('it-IT', { maximumFractionDigits: 0 })}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>
    </>
  );

  return <DetailScaffold title={title} onBack={onBack} left={left} right={right} />;
}

export default EnergiaDetail;
