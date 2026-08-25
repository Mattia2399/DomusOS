import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  BatteryMedium,
  Box,
  Camera,
  ChevronRight,
  CircleAlert,
  Clock3,
  DownloadCloud,
  Gauge,
  Lightbulb,
  LockKeyhole,
  Plug,
  Radio,
  Router,
  Search,
  ShieldCheck,
  Signal,
  Speaker,
  Thermometer,
  Wifi,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import type { HaArea } from '../../hooks/useHaLiveConnection';
import type {
  HaDeviceRegistryEntry,
  HaEntityRegistryEntry,
} from '../../services/haRegistryPresentation';
import type { MockEntityStateMap } from '../../types/ha';
import type { Widget } from '../../types/dashboardModels';
import GlassSearchFilterBar, {
  type GlassSearchFilterOption,
} from '../ui/GlassSearchFilterBar';
import { DeviceTelemetryStrip, type DeviceTelemetryStripItem } from './DeviceTelemetryStrip';
import {
  buildDeviceHealthSnapshots,
  summarizeDeviceHealth,
  type DeviceHealthSnapshot,
  type DeviceHealthStatus,
} from './deviceHealthModel';

type DeviceIssueFilter =
  | 'all'
  | 'attention'
  | 'offline'
  | 'battery'
  | 'updates'
  | 'unknown';

const PAGE_SIZE = 60;

const ISSUE_OPTIONS: GlassSearchFilterOption[] = [
  { id: 'all', name: 'Tutti gli stati' },
  { id: 'attention', name: 'Da controllare' },
  { id: 'offline', name: 'Non disponibili' },
  { id: 'battery', name: 'Batteria scarica' },
  { id: 'updates', name: 'Aggiornamenti' },
  { id: 'unknown', name: 'Senza dati' },
];

const STATUS_META: Record<
  DeviceHealthStatus,
  { className: string; dotClassName: string; icon: LucideIcon }
> = {
  operational: {
    className: 'bg-emerald-500/10 text-emerald-500',
    dotClassName: 'bg-emerald-500',
    icon: ShieldCheck,
  },
  warning: {
    className: 'bg-amber-500/10 text-amber-500',
    dotClassName: 'bg-amber-500',
    icon: CircleAlert,
  },
  offline: {
    className: 'bg-rose-500/10 text-rose-500',
    dotClassName: 'bg-rose-500',
    icon: WifiOff,
  },
  unknown: {
    className: 'bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)]',
    dotClassName: 'bg-[color:var(--ui-text-tertiary)]',
    icon: CircleAlert,
  },
};

const DOMAIN_ICONS: Record<string, LucideIcon> = {
  camera: Camera,
  climate: Thermometer,
  light: Lightbulb,
  lock: LockKeyhole,
  media_player: Speaker,
  sensor: Gauge,
  switch: Plug,
};

function deviceIcon(device: DeviceHealthSnapshot) {
  const preferredDomains = ['lock', 'camera', 'climate', 'light', 'media_player', 'switch', 'sensor'];
  const domain = preferredDomains.find((candidate) =>
    device.entities.some((entity) => entity.domain === candidate),
  );
  return domain ? DOMAIN_ICONS[domain] ?? Router : Router;
}

function formatLastUpdate(timestamp: number | undefined) {
  if (timestamp === undefined) return 'Non disponibile';
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (elapsedMinutes < 1) return 'Adesso';
  if (elapsedMinutes < 60) return `${elapsedMinutes} min fa`;
  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} h fa`;
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
  }).format(timestamp);
}

function DeviceSummary({
  devices,
}: {
  devices: DeviceHealthSnapshot[];
}) {
  const summary = summarizeDeviceHealth(devices);
  const items = [
    { label: 'Operativi', value: summary.operational, tone: 'text-emerald-500' },
    {
      label: 'Da controllare',
      value: summary.warning,
      tone: 'text-amber-500',
    },
    { label: 'Non disponibili', value: summary.offline, tone: 'text-rose-500' },
    {
      label: 'Senza dati',
      value: summary.unknown,
      tone: 'text-[color:var(--ui-text-secondary)]',
    },
  ];
  return (
    <section
      className="dashboard-content-surface-soft grid grid-cols-2 gap-px overflow-hidden rounded-[1.35rem] p-1 sm:grid-cols-4"
      aria-label="Riepilogo dispositivi"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 rounded-[1.05rem] px-3.5 py-3 sm:px-4"
        >
          <strong className={`block text-xl font-semibold tracking-[-0.04em] ${item.tone}`}>
            {item.value}
          </strong>
          <span className="mt-0.5 block truncate text-[11px] font-medium text-[color:var(--ui-text-secondary)]">
            {item.label}
          </span>
        </div>
      ))}
    </section>
  );
}

function DeviceRow({
  device,
  onOpen,
}: {
  device: DeviceHealthSnapshot;
  onOpen: () => void;
}) {
  const Icon = deviceIcon(device);
  const status = STATUS_META[device.status];
  const secondaryTelemetry = [
    device.batteryLevel !== undefined ? `Batteria ${device.batteryLevel}%` : '',
    device.connectionState === 'online'
      ? 'Connesso'
      : device.connectionState === 'offline'
        ? 'Disconnesso'
        : '',
    device.updateAvailable ? 'Firmware disponibile' : '',
  ].filter(Boolean);

  return (
    <li className="border-t border-[color:var(--ui-separator)] first:border-t-0">
      <button
        type="button"
        onClick={onOpen}
        className="group flex min-h-[5.35rem] w-full min-w-0 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[color:var(--ui-fill-tertiary)] sm:px-5"
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)]">
          <Icon size={19} aria-hidden />
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[color:var(--ui-surface-solid)] ${status.dotClassName}`}
            aria-hidden
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <strong className="truncate text-sm font-semibold text-[color:var(--ui-text-primary)]">
              {device.name}
            </strong>
            <span
              className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-flex ${status.className}`}
            >
              {device.statusLabel}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-[color:var(--ui-text-secondary)]">
            {[device.areaName, device.manufacturer, device.model].filter(Boolean).join(' · ') ||
              `${device.entityCount} ${device.entityCount === 1 ? 'entità' : 'entità'}`}
          </span>
          <span className="mt-1 block truncate text-[10px] font-medium text-[color:var(--ui-text-tertiary)]">
            {secondaryTelemetry.join(' · ') ||
              `${device.entityCount} ${device.entityCount === 1 ? 'entità associata' : 'entità associate'}`}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold sm:hidden ${status.className}`}
          >
            {device.statusLabel}
          </span>
          <ChevronRight
            size={17}
            aria-hidden
            className="text-[color:var(--ui-text-tertiary)] transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </button>
    </li>
  );
}

export function SettingsDevicesList({
  connected,
  haStates,
  entityRegistry = [],
  deviceRegistry = [],
  areas = [],
  widgets = [],
  batteryWarningThreshold = 20,
  onOpenDevice,
}: {
  connected: boolean;
  haStates: MockEntityStateMap;
  entityRegistry?: HaEntityRegistryEntry[];
  deviceRegistry?: HaDeviceRegistryEntry[];
  areas?: HaArea[];
  widgets?: Widget[];
  batteryWarningThreshold?: number;
  onOpenDevice: (deviceId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [issue, setIssue] = useState<DeviceIssueFilter>('all');
  const [area, setArea] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase('it'));
  const devices = useMemo(
    () =>
      buildDeviceHealthSnapshots({
        connected,
        states: haStates,
        entityRegistry,
        deviceRegistry,
        areas,
        widgets,
        batteryWarningThreshold,
      }),
    [
      areas,
      batteryWarningThreshold,
      connected,
      deviceRegistry,
      entityRegistry,
      haStates,
      widgets,
    ],
  );

  const areaOptions = useMemo<GlassSearchFilterOption[]>(() => {
    const availableAreas = new Map<string, string>();
    devices.forEach((device) => {
      if (device.areaId) availableAreas.set(device.areaId, device.areaName || device.areaId);
    });
    return [
      { id: 'all', name: 'Tutte le stanze' },
      { id: 'none', name: 'Senza stanza' },
      ...Array.from(availableAreas, ([id, name]) => ({ id, name })).sort((left, right) =>
        left.name.localeCompare(right.name, 'it'),
      ),
    ];
  }, [devices]);

  const filteredDevices = useMemo(
    () =>
      devices.filter((device) => {
        if (area === 'none' && device.areaId) return false;
        if (area !== 'all' && area !== 'none' && device.areaId !== area) return false;
        if (issue === 'attention' && device.status !== 'warning') return false;
        if (issue === 'offline' && device.status !== 'offline') return false;
        if (
          issue === 'battery' &&
          !device.issues.some((entry) => entry.code === 'battery_low')
        ) {
          return false;
        }
        if (issue === 'updates' && !device.updateAvailable) return false;
        if (issue === 'unknown' && device.status !== 'unknown') return false;
        if (!deferredQuery) return true;
        return [
          device.name,
          device.areaName,
          device.manufacturer,
          device.model,
          ...device.entities.map((entity) => `${entity.name} ${entity.id}`),
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('it')
          .includes(deferredQuery);
      }),
    [area, deferredQuery, devices, issue],
  );

  useEffect(() => setVisibleCount(PAGE_SIZE), [area, deferredQuery, issue]);

  const resetFilters = () => {
    setQuery('');
    setIssue('all');
    setArea('all');
  };
  const visibleDevices = filteredDevices.slice(0, visibleCount);

  return (
    <div>
      <DeviceSummary devices={devices} />
      <div className="sticky top-0 z-30 mt-4">
        <GlassSearchFilterBar
          query={query}
          onQueryChange={setQuery}
          placeholder="Cerca dispositivo, modello o entità"
          resultCount={filteredDevices.length}
          resultLabel={(count) => `${count} dispositivi`}
          onReset={resetFilters}
          filters={[
            {
              id: 'health',
              label: 'Stato',
              ariaLabel: 'Filtra per stato dispositivo',
              options: ISSUE_OPTIONS,
              value: issue,
              defaultValue: 'all',
              onChange: (value) => setIssue(value as DeviceIssueFilter),
            },
            {
              id: 'area',
              label: 'Stanza',
              ariaLabel: 'Filtra dispositivi per stanza',
              options: areaOptions,
              value: area,
              defaultValue: 'all',
              onChange: setArea,
            },
          ]}
        />
      </div>

      <section className="dashboard-content-surface mt-4 overflow-hidden rounded-[1.5rem]">
        {visibleDevices.length > 0 ? (
          <ul aria-label="Elenco dispositivi">
            {visibleDevices.map((device) => (
              <DeviceRow
                key={device.id}
                device={device}
                onOpen={() => onOpenDevice(device.id)}
              />
            ))}
          </ul>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
            <Search size={22} className="text-[color:var(--ui-text-tertiary)]" />
            <h3 className="mt-3 text-sm font-semibold">
              {devices.length === 0 ? 'Nessun dispositivo rilevato' : 'Nessun dispositivo trovato'}
            </h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-[color:var(--ui-text-secondary)]">
              {devices.length === 0
                ? 'Home Assistant non ha restituito dispositivi associati alle entità disponibili.'
                : 'Prova a modificare la ricerca o i filtri.'}
            </p>
          </div>
        )}
      </section>

      {visibleCount < filteredDevices.length ? (
        <button
          type="button"
          onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
          className="liquid-glass-selection mx-auto mt-4 flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
        >
          Mostra altri {Math.min(PAGE_SIZE, filteredDevices.length - visibleCount)}
        </button>
      ) : null}
    </div>
  );
}

export function SettingsDeviceDetail({
  device,
  onOpenUpdates,
}: {
  device: DeviceHealthSnapshot;
  onOpenUpdates: () => void;
}) {
  const Icon = deviceIcon(device);
  const status = STATUS_META[device.status];
  const StatusIcon = status.icon;
  const telemetry = useMemo<DeviceTelemetryStripItem[]>(() => {
    const items: DeviceTelemetryStripItem[] = [];
    if (device.batteryLevel !== undefined) {
      items.push({
        id: 'battery',
        icon: <BatteryMedium size={14} />,
        label: 'Batteria',
        value: `${device.batteryLevel}%`,
        tone:
          device.batteryLevel <= 10
            ? 'danger'
            : device.batteryLevel <= 20
              ? 'warning'
              : 'success',
      });
    }
    if (device.connectionState) {
      items.push({
        id: 'connection',
        icon:
          device.connectionState === 'online' ? <Wifi size={14} /> : <WifiOff size={14} />,
        label: 'Connessione',
        value: device.connectionState === 'online' ? 'Connesso' : 'Disconnesso',
        tone: device.connectionState === 'online' ? 'success' : 'danger',
      });
    }
    if (device.signalStrength !== undefined) {
      items.push({
        id: 'signal',
        icon: <Signal size={14} />,
        label: 'Segnale',
        value: `${device.signalStrength} ${device.signalUnit || 'dBm'}`,
      });
    }
    if (device.lastDataUpdate !== undefined) {
      items.push({
        id: 'last-update',
        icon: <Clock3 size={14} />,
        label: 'Ultimo dato',
        value: formatLastUpdate(device.lastDataUpdate),
      });
    }
    return items;
  }, [device]);

  return (
    <div className="space-y-4">
      <section className="dashboard-content-surface rounded-[1.5rem] p-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)]">
            <Icon size={23} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-[-0.03em]">
                {device.name}
              </h2>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
              >
                <StatusIcon size={12} />
                {device.statusLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-[color:var(--ui-text-secondary)]">
              {[device.areaName, device.manufacturer, device.model].filter(Boolean).join(' · ') ||
                'Informazioni dispositivo non disponibili'}
            </p>
            <p className="mt-2 text-xs text-[color:var(--ui-text-tertiary)]">
              {device.entityCount} {device.entityCount === 1 ? 'entità associata' : 'entità associate'}
              {device.dashboardWidgetCount > 0
                ? ` · usato da ${device.dashboardWidgetCount} ${
                    device.dashboardWidgetCount === 1 ? 'card' : 'card'
                  }`
                : ''}
            </p>
          </div>
        </div>
        {telemetry.length > 0 ? <div className="mt-5"><DeviceTelemetryStrip items={telemetry} /></div> : null}
      </section>

      {device.issues.length > 0 ? (
        <section className="dashboard-content-surface rounded-[1.5rem] p-5 sm:p-6">
          <h2 className="text-base font-semibold tracking-[-0.02em]">Da controllare</h2>
          <div className="mt-3 divide-y divide-[color:var(--ui-separator)]">
            {device.issues.map((issue) => (
              <div key={issue.code} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <CircleAlert
                  size={17}
                  className="mt-0.5 shrink-0 text-[color:var(--ui-warning)]"
                />
                <div>
                  <p className="text-sm font-semibold">{issue.label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[color:var(--ui-text-secondary)]">
                    {issue.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {device.updateAvailable ? (
            <button
              type="button"
              onClick={onOpenUpdates}
              className="liquid-glass-control mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
            >
              <DownloadCloud size={16} />
              Apri Centro Aggiornamenti
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="dashboard-content-surface overflow-hidden rounded-[1.5rem]">
        <div className="px-5 pb-3 pt-5 sm:px-6">
          <h2 className="text-base font-semibold tracking-[-0.02em]">Entità del dispositivo</h2>
          <p className="mt-1 text-xs text-[color:var(--ui-text-secondary)]">
            Dati e diagnostica forniti da Home Assistant.
          </p>
        </div>
        {device.entities.length > 0 ? (
          <ul aria-label={`Entità di ${device.name}`}>
            {device.entities.map((entity) => (
              <li
                key={entity.id}
                className="flex min-w-0 items-center gap-3 border-t border-[color:var(--ui-separator)] px-5 py-3 sm:px-6"
              >
                {entity.diagnostic ? (
                  <Radio size={16} className="shrink-0 text-[color:var(--ui-text-tertiary)]" />
                ) : (
                  <Box size={16} className="shrink-0 text-[color:var(--ui-text-secondary)]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{entity.name}</p>
                  <p className="mt-0.5 truncate text-[10px] text-[color:var(--ui-text-tertiary)]">
                    {entity.id}
                  </p>
                </div>
                <span
                  className={`max-w-[38%] truncate text-xs font-semibold ${
                    entity.unavailable
                      ? 'text-rose-500'
                      : 'text-[color:var(--ui-text-secondary)]'
                  }`}
                >
                  {entity.value}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border-t border-[color:var(--ui-separator)] px-6 py-10 text-center text-sm text-[color:var(--ui-text-secondary)]">
            Nessuna entità associata.
          </div>
        )}
      </section>
    </div>
  );
}

export default SettingsDevicesList;
