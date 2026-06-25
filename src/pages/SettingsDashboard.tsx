import React, { useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowDownUp,
  Box,
  Database,
  Download,
  Gauge,
  HardDrive,
  Home,
  Layers3,
  RefreshCw,
  RotateCcw,
  Server,
  Settings,
  ShieldCheck,
  Upload,
  Users,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import type { HaArea, HaConnectionStatus } from '../hooks/useHaLiveConnection';
import type { ProfileHouseMember } from '../components/settings/ProfilePanel';
import type { DashboardSection, Widget } from '../types/dashboardModels';
import type { MockEntityState, MockEntityStateMap } from '../types/ha';
import { MembersCard } from '../components/widgets/MembersCard';
import type { GridEngineBreakpoint } from '../components/dashboard/dashboardBreakpointConfig';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type SettingsDashboardProps = {
  developerMode: boolean;
  haStatus: HaConnectionStatus;
  haError: string | null;
  haStates: MockEntityStateMap;
  haAreas: HaArea[];
  sections: DashboardSection[];
  widgets: Widget[];
  houseMembers: ProfileHouseMember[];
  currentLayoutId?: string;
  sensorHistoryByEntity?: Record<string, number[]>;
  onDeveloperModeChange: (value: boolean) => void;
  onDownloadBackup: () => void;
  onRestoreBackup: (file: File) => Promise<void>;
  onResetAll: () => Promise<void>;
  onCallService: (domain: string, service: string, serviceData: Record<string, unknown>) => Promise<boolean>;
};

type SystemSensorKind =
  | 'diskUsage'
  | 'diskFree'
  | 'diskUse'
  | 'memoryUsage'
  | 'processorUse'
  | 'processorTemperature'
  | 'uptime'
  | 'networkIn'
  | 'networkOut';

type SystemSensorMatch = {
  entityId: string;
  entity: MockEntityState;
  kind: SystemSensorKind;
};

type UpdateEntityMatch = {
  entityId: string;
  entity: MockEntityState;
  title: string;
  available: boolean;
};

type ServerChartPoint = {
  label: string;
  cpu: number | null;
  temperature: number | null;
};

const SETTINGS_GRID_BREAKPOINTS: readonly GridEngineBreakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeLower(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function entityName(entityId: string, entity: MockEntityState) {
  const friendlyName = normalizeText(entity.rawAttributes?.friendly_name);
  if (friendlyName) {
    return friendlyName;
  }
  return entityId
    .replace(/^[^.]+\./, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseNumericState(entity: MockEntityState) {
  if (typeof entity.numericValue === 'number' && Number.isFinite(entity.numericValue)) {
    return entity.numericValue;
  }
  const parsed = Number(String(entity.state).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatEntityValue(entity: MockEntityState) {
  const value = parseNumericState(entity);
  if (value === null) {
    return entity.state || 'n/d';
  }
  const rounded = Math.abs(value) >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded}${entity.unit ? ` ${entity.unit}` : ''}`;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function formatLastRestart(entity: SystemSensorMatch | null) {
  if (!entity) {
    return 'Ultimo riavvio non disponibile';
  }

  const rawState = normalizeText(entity.entity.state);
  const rawDeviceClass = normalizeLower(entity.entity.rawAttributes?.device_class);
  const parsedDate = Date.parse(rawState);
  if ((rawDeviceClass === 'timestamp' || rawState.includes('T')) && Number.isFinite(parsedDate)) {
    return `Ultimo riavvio: ${formatDateTime(new Date(parsedDate))}`;
  }

  return `Ultimo riavvio: ${formatEntityValue(entity.entity)}`;
}

function resolveGridBreakpoint(value: string | undefined): GridEngineBreakpoint | undefined {
  return SETTINGS_GRID_BREAKPOINTS.includes(value as GridEngineBreakpoint)
    ? (value as GridEngineBreakpoint)
    : undefined;
}

function resolveHistoryForEntity(historyMap: Record<string, number[]> | undefined, entityId: string | undefined) {
  const normalizedEntityId = entityId?.trim();
  if (!normalizedEntityId) {
    return [];
  }
  const direct = historyMap?.[normalizedEntityId];
  const lower = historyMap?.[normalizedEntityId.toLowerCase()];
  return (direct ?? lower ?? []).filter((value) => Number.isFinite(value));
}

function valueAtAlignedIndex(values: number[], index: number, length: number, fallback: number | null) {
  if (values.length === 0) {
    return fallback;
  }
  const offset = length - values.length;
  if (index < offset) {
    return null;
  }
  return values[index - offset] ?? null;
}

function buildServerChartData({
  cpuHistory,
  temperatureHistory,
  cpuCurrent,
  temperatureCurrent,
}: {
  cpuHistory: number[];
  temperatureHistory: number[];
  cpuCurrent: number | null;
  temperatureCurrent: number | null;
}): ServerChartPoint[] {
  const cpuSeries = cpuHistory.length >= 2 ? cpuHistory.slice(-18) : [];
  const temperatureSeries = temperatureHistory.length >= 2 ? temperatureHistory.slice(-18) : [];
  const length = Math.max(cpuSeries.length, temperatureSeries.length, 12);

  return Array.from({ length }, (_, index) => ({
    label: `${index + 1}`,
    cpu: valueAtAlignedIndex(cpuSeries, index, length, cpuCurrent),
    temperature: valueAtAlignedIndex(temperatureSeries, index, length, temperatureCurrent),
  }));
}

function classifySystemSensor(entityId: string, entity: MockEntityState): SystemSensorKind | null {
  const id = entityId.toLowerCase();
  const name = `${id} ${normalizeLower(entity.rawAttributes?.friendly_name)} ${normalizeLower(entity.rawAttributes?.device_class)}`;
  if (!entityId.startsWith('sensor.')) {
    return null;
  }
  if ((name.includes('disk') || name.includes('disco')) && (name.includes('usage') || name.includes('percent') || name.includes('percentuale') || entity.unit === '%')) {
    return 'diskUsage';
  }
  if ((name.includes('disk') || name.includes('disco')) && (name.includes('free') || name.includes('liber'))) {
    return 'diskFree';
  }
  if ((name.includes('disk') || name.includes('disco')) && (name.includes('use') || name.includes('used') || name.includes('usato'))) {
    return 'diskUse';
  }
  if (name.includes('memory') || name.includes('memoria')) {
    return 'memoryUsage';
  }
  if (name.includes('processor temperature') || name.includes('cpu temperature') || name.includes('temperatura processore')) {
    return 'processorTemperature';
  }
  if (name.includes('processor') || name.includes('cpu')) {
    return 'processorUse';
  }
  if (name.includes('uptime') || name.includes('ultimo avvio')) {
    return 'uptime';
  }
  if (name.includes('throughput in') || name.includes('network in') || name.includes('rete in')) {
    return 'networkIn';
  }
  if (name.includes('throughput out') || name.includes('network out') || name.includes('rete out')) {
    return 'networkOut';
  }
  return null;
}

function pickSystemSensors(haStates: MockEntityStateMap) {
  const matches: SystemSensorMatch[] = [];
  Object.entries(haStates).forEach(([entityId, entity]) => {
    const kind = classifySystemSensor(entityId, entity);
    if (kind) {
      matches.push({ entityId, entity, kind });
    }
  });
  return matches;
}

function pickPreferredSensor(matches: SystemSensorMatch[], kind: SystemSensorKind) {
  return matches.find((match) => match.kind === kind) ?? null;
}

function collectUpdateEntities(haStates: MockEntityStateMap): UpdateEntityMatch[] {
  return Object.entries(haStates)
    .filter(([entityId]) => entityId.startsWith('update.'))
    .map(([entityId, entity]) => {
      const state = normalizeLower(entity.state);
      const available = state === 'on' || state === 'update_available' || state === 'available';
      return {
        entityId,
        entity,
        title: entityName(entityId, entity),
        available,
      };
    })
    .sort((first, second) => Number(second.available) - Number(first.available) || first.title.localeCompare(second.title));
}

function statusLabel(status: HaConnectionStatus) {
  if (status === 'connected') {
    return 'Online';
  }
  if (status === 'connecting') {
    return 'Connessione';
  }
  if (status === 'error') {
    return 'Errore';
  }
  return 'Offline';
}

function statusToneClass(status: HaConnectionStatus) {
  if (status === 'connected') {
    return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  }
  if (status === 'connecting') {
    return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
  }
  if (status === 'error') {
    return 'border-rose-400/30 bg-rose-400/10 text-rose-100';
  }
  return 'border-white/10 bg-white/5 text-white/60';
}

function SettingsMetric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-[1.6rem] border border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/75">
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold text-white">{value}</p>
        </div>
      </div>
      {hint ? <p className="mt-1 truncate text-xs text-white/50">{hint}</p> : null}
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-2xl">
      <div className="flex items-center gap-3 px-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/75">
          <Icon size={17} />
        </span>
        <h2 className="text-base font-semibold tracking-normal text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SettingsRow({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[3.85rem] items-center gap-3 border-b border-white/10 px-1 py-3 last:border-0">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70">
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{title}</p>
        {subtitle ? <p className="mt-0.5 truncate text-xs font-medium text-white/50">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function InlineButton({
  children,
  onClick,
  disabled,
  tone = 'default',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'primary' | 'danger';
}) {
  const toneClass =
    tone === 'primary'
      ? 'border-sky-300/40 bg-sky-400/20 text-sky-100 hover:bg-sky-400/25'
      : tone === 'danger'
        ? 'border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20'
        : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
        checked ? 'border-emerald-300/30 bg-emerald-400/75' : 'border-white/10 bg-white/10'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.28)] transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

type ServerChartTooltipPayload = {
  dataKey?: string | number;
  name?: string | number;
  value?: string | number;
  color?: string;
};

function ServerChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ServerChartTooltipPayload[];
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white shadow-2xl backdrop-blur-xl">
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const isTemperature = entry.dataKey === 'temperature';
          const numericValue = Number(entry.value);
          const formattedValue = Number.isFinite(numericValue)
            ? `${Math.round(numericValue * 10) / 10}${isTemperature ? ' C' : '%'}`
            : '--';
          return (
            <div key={`${entry.dataKey ?? entry.name}`} className="flex min-w-[8.5rem] items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-white/62">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color ?? (isTemperature ? '#fb923c' : '#38bdf8') }}
                />
                {isTemperature ? 'Temperatura' : 'CPU'}
              </span>
              <span className="font-semibold text-white">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServerPerformanceChart({
  cpuSensor,
  temperatureSensor,
  cpuHistory,
  temperatureHistory,
}: {
  cpuSensor: SystemSensorMatch | null;
  temperatureSensor: SystemSensorMatch | null;
  cpuHistory: number[];
  temperatureHistory: number[];
}) {
  const cpuCurrent = cpuSensor ? parseNumericState(cpuSensor.entity) : null;
  const temperatureCurrent = temperatureSensor ? parseNumericState(temperatureSensor.entity) : null;
  const chartData = useMemo(
    () =>
      buildServerChartData({
        cpuHistory,
        temperatureHistory,
        cpuCurrent,
        temperatureCurrent,
      }),
    [cpuCurrent, cpuHistory, temperatureCurrent, temperatureHistory],
  );
  const hasChartData = chartData.some((point) => point.cpu !== null || point.temperature !== null);

  return (
    <div className="rounded-[1.45rem] border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Prestazioni server</p>
          <p className="mt-1 text-xs font-medium text-white/50">Uso CPU e temperatura nelle ultime letture</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-sky-100">
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            {cpuCurrent === null ? '--' : `${Math.round(cpuCurrent * 10) / 10}%`}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/20 bg-orange-400/10 px-2.5 py-1 text-orange-100">
            <span className="h-2 w-2 rounded-full bg-orange-300" />
            {temperatureCurrent === null ? '--' : `${Math.round(temperatureCurrent * 10) / 10} C`}
          </span>
        </div>
      </div>

      <div className="mt-4 h-56 min-w-0 sm:h-64">
        {hasChartData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 2, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="settings-server-cpu-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(56,189,248,0.46)" />
                  <stop offset="100%" stopColor="rgba(56,189,248,0.02)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.38)', fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="cpu"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.38)', fontSize: 10 }}
                width={30}
              />
              <YAxis
                yAxisId="temperature"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.38)', fontSize: 10 }}
                width={34}
              />
              <Tooltip content={<ServerChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.16)' }} />
              <Area
                yAxisId="cpu"
                type="monotone"
                dataKey="cpu"
                name="CPU"
                stroke="rgba(125,211,252,0.98)"
                strokeWidth={2.4}
                fill="url(#settings-server-cpu-fill)"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                yAxisId="temperature"
                type="monotone"
                dataKey="temperature"
                name="Temperatura"
                stroke="rgba(251,146,60,0.98)"
                strokeWidth={2.4}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-[1.25rem] border border-white/10 bg-white/5 text-sm font-medium text-white/50">
            Nessun dato CPU o temperatura disponibile.
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsDashboard({
  developerMode,
  haStatus,
  haError,
  haStates,
  haAreas,
  sections,
  widgets,
  houseMembers,
  currentLayoutId,
  sensorHistoryByEntity,
  onDeveloperModeChange,
  onDownloadBackup,
  onRestoreBackup,
  onResetAll,
  onCallService,
}: SettingsDashboardProps) {
  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [isRestoreBusy, setIsRestoreBusy] = useState(false);
  const isConnected = haStatus === 'connected';
  const systemSensors = useMemo(() => pickSystemSensors(haStates), [haStates]);
  const updateEntities = useMemo(() => collectUpdateEntities(haStates), [haStates]);
  const availableUpdates = updateEntities.filter((entry) => entry.available);
  const diskUsage = pickPreferredSensor(systemSensors, 'diskUsage');
  const diskFree = pickPreferredSensor(systemSensors, 'diskFree');
  const diskUse = pickPreferredSensor(systemSensors, 'diskUse');
  const memoryUsage = pickPreferredSensor(systemSensors, 'memoryUsage');
  const processorUse = pickPreferredSensor(systemSensors, 'processorUse');
  const processorTemperature = pickPreferredSensor(systemSensors, 'processorTemperature');
  const uptime = pickPreferredSensor(systemSensors, 'uptime');
  const networkIn = pickPreferredSensor(systemSensors, 'networkIn');
  const networkOut = pickPreferredSensor(systemSensors, 'networkOut');
  const systemEntityIds = systemSensors.map((entry) => entry.entityId);
  const processorUseHistory = resolveHistoryForEntity(sensorHistoryByEntity, processorUse?.entityId);
  const processorTemperatureHistory = resolveHistoryForEntity(sensorHistoryByEntity, processorTemperature?.entityId);
  const storagePercent = diskUsage ? parseNumericState(diskUsage.entity) : null;
  const storageBarValue = storagePercent === null ? 0 : Math.min(100, Math.max(0, storagePercent));
  const lastRestartLabel = formatLastRestart(uptime);
  const membersGridBreakpoint = resolveGridBreakpoint(currentLayoutId);
  const membersWidget = useMemo<Widget>(
    () => ({
      id: 'settings-house-members',
      kind: 'members',
      title: 'Persone',
      entityId: 'group.house_members',
      status: `${houseMembers.length} membri`,
      isOn: houseMembers.length > 0,
      layout: { i: 'settings-house-members', x: 0, y: 0, w: 2, h: 2 },
    }),
    [houseMembers.length],
  );

  const runQuickAction = async (action: () => Promise<void>, successText: string) => {
    setActionFeedback('');
    setIsActionBusy(true);
    try {
      await action();
      setActionFeedback(successText);
    } catch (error) {
      setActionFeedback(error instanceof Error ? error.message : 'Azione non completata.');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleRefreshSystemSensors = () => {
    void runQuickAction(async () => {
      if (systemEntityIds.length === 0) {
        throw new Error('Nessun sensore server disponibile.');
      }
      const success = await onCallService('homeassistant', 'update_entity', { entity_id: systemEntityIds });
      if (!success) {
        throw new Error('Aggiornamento sensori non riuscito.');
      }
    }, 'Sensori server aggiornati.');
  };

  const handleRestartServer = () => {
    void runQuickAction(async () => {
      const success = await onCallService('homeassistant', 'restart', {});
      if (!success) {
        throw new Error('Riavvio server non avviato.');
      }
    }, 'Riavvio server avviato.');
  };

  const handleRestartHub = () => {
    setActionFeedback('Riavvio hub in corso.');
    if (typeof window !== 'undefined') {
      window.setTimeout(() => window.location.reload(), 250);
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    setIsRestoreBusy(true);
    setActionFeedback('');
    try {
      await onRestoreBackup(file);
      setActionFeedback('Backup ripristinato.');
    } catch (error) {
      setActionFeedback(error instanceof Error ? error.message : 'Ripristino non riuscito.');
    } finally {
      setIsRestoreBusy(false);
    }
  };

  return (
    <div className="dashboard-page-scroll">
      <div className="dashboard-page-content dashboard-page-content-wide gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="dashboard-page-title">Impostazioni</h1>
            <p className="dashboard-page-subtitle">{lastRestartLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${statusToneClass(haStatus)}`}>
              <span className={`h-2 w-2 rounded-full ${haStatus === 'connected' ? 'bg-emerald-300' : haStatus === 'connecting' ? 'bg-amber-200' : haStatus === 'error' ? 'bg-rose-300' : 'bg-white/40'}`} />
              {statusLabel(haStatus)}
            </span>
            <InlineButton onClick={handleRestartServer} disabled={!isConnected || isActionBusy} tone="primary">
              <Server size={14} />
              Riavvia server
            </InlineButton>
            <InlineButton onClick={handleRestartHub} disabled={isActionBusy}>
              <RotateCcw size={14} />
              Riavvia hub
            </InlineButton>
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.24fr)_minmax(420px,0.76fr)]">
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(13rem,0.58fr)_minmax(0,1.42fr)]">
              <div className="min-h-[9.5rem] sm:min-h-[10.5rem]">
                <MembersCard
                  widget={membersWidget}
                  isSelected={false}
                  isEditMode={false}
                  onClick={() => undefined}
                  houseMembers={houseMembers}
                  gridBreakpoint={membersGridBreakpoint}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SettingsMetric icon={Layers3} label="Sezioni" value={sections.length} />
                <SettingsMetric icon={Box} label="Widget" value={widgets.length} />
                <SettingsMetric icon={Home} label="Stanze" value={haAreas.length} />
                <SettingsMetric icon={Users} label="Membri" value={houseMembers.length} />
              </div>
            </section>

            <SettingsSection icon={Server} title="Server casa">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4 backdrop-blur-2xl md:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">Spazio utilizzato</p>
                      <p className="mt-1 truncate text-xs font-medium text-white/50">
                        {diskUse ? `Usato ${formatEntityValue(diskUse.entity)}` : 'System monitor'}
                        {diskFree ? ` / libero ${formatEntityValue(diskFree.entity)}` : ''}
                      </p>
                    </div>
                    <span className="text-2xl font-semibold text-white">
                      {storagePercent === null ? '--' : `${Math.round(storagePercent)}%`}
                    </span>
                  </div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,rgba(56,189,248,0.9),rgba(52,211,153,0.9))]"
                      style={{ width: `${storageBarValue}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/75">
                      <ArrowDownUp size={18} />
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/50">
                      {availableUpdates.length} update
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-white">Aggiornamenti</p>
                  <p className="mt-1 text-xs font-medium text-white/50">
                    {updateEntities.length > 0 ? `${updateEntities.length} entita update rilevate` : 'Nessuna entita update'}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                <SettingsMetric icon={Gauge} label="CPU" value={processorUse ? formatEntityValue(processorUse.entity) : '--'} />
                <SettingsMetric icon={Database} label="RAM" value={memoryUsage ? formatEntityValue(memoryUsage.entity) : '--'} />
                <SettingsMetric icon={Activity} label="Temp." value={processorTemperature ? formatEntityValue(processorTemperature.entity) : '--'} />
                <SettingsMetric icon={Wifi} label="Rete" value={networkIn || networkOut ? 'Attiva' : '--'} />
              </div>

              <ServerPerformanceChart
                cpuSensor={processorUse}
                temperatureSensor={processorTemperature}
                cpuHistory={processorUseHistory}
                temperatureHistory={processorTemperatureHistory}
              />
            </SettingsSection>

          </div>

          <aside className="space-y-4 xl:sticky xl:top-4">
            <SettingsSection icon={ShieldCheck} title="Tool rapidi">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <InlineButton onClick={handleRefreshSystemSensors} disabled={!isConnected || systemEntityIds.length === 0 || isActionBusy}>
                  <RefreshCw size={14} />
                  Aggiorna sensori
                </InlineButton>
                <InlineButton onClick={onDownloadBackup}>
                  <Download size={14} />
                  Backup dashboard
                </InlineButton>
                <InlineButton onClick={() => restoreInputRef.current?.click()} disabled={isRestoreBusy}>
                  <Upload size={14} />
                  Ripristina
                </InlineButton>
                <InlineButton onClick={() => void onResetAll()} tone="danger">
                  <RotateCcw size={14} />
                  Reset locale
                </InlineButton>
              </div>
              <input
                ref={restoreInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleRestoreBackup}
              />
              {actionFeedback ? <p className="mt-3 text-xs font-semibold text-white/50">{actionFeedback}</p> : null}
            </SettingsSection>

            <SettingsSection icon={Settings} title="Avanzate">
              <div className="rounded-[1.45rem] border border-white/10 bg-white/5 px-3 py-2">
                <SettingsRow
                  icon={Gauge}
                  title="Modalita sviluppatore"
                  subtitle="Debug layout e griglia"
                  action={<Toggle checked={developerMode} onChange={onDeveloperModeChange} label="Modalita sviluppatore" />}
                />
                <SettingsRow
                  icon={Database}
                  title="Entita Home Assistant"
                  subtitle={`${Object.keys(haStates).length} entita disponibili`}
                />
                <SettingsRow
                  icon={HardDrive}
                  title="Supervisor"
                  subtitle="Disponibile solo da ambiente add-on/pannello dedicato"
                />
                {haError ? (
                  <SettingsRow
                    icon={Server}
                    title="Diagnostica Home Assistant"
                    subtitle={haError}
                  />
                ) : null}
              </div>
            </SettingsSection>
          </aside>
        </div>
      </div>
    </div>
  );
}
