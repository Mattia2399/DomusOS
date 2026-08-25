import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  AlarmClock,
  Bot,
  Box,
  CalendarDays,
  Camera,
  CloudSun,
  Fan,
  Gauge,
  Lightbulb,
  LockKeyhole,
  MapPin,
  Radio,
  Search,
  Shield,
  Sparkles,
  Speaker,
  Thermometer,
  ToggleRight,
  UserRound,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { MockEntityState, MockEntityStateMap } from '../../types/ha';
import type { HaArea } from '../../hooks/useHaLiveConnection';
import type {
  HaDeviceRegistryEntry,
  HaEntityRegistryEntry,
} from '../../services/haRegistryPresentation';
import GlassSearchFilterBar, {
  type GlassSearchFilterOption,
} from '../ui/GlassSearchFilterBar';

const PAGE_SIZE = 80;

const DOMAIN_LABELS: Record<string, string> = {
  alarm_control_panel: 'Allarmi',
  automation: 'Automazioni',
  binary_sensor: 'Sensori binari',
  button: 'Pulsanti',
  calendar: 'Calendari',
  camera: 'Telecamere',
  climate: 'Clima',
  cover: 'Coperture',
  device_tracker: 'Localizzatori',
  fan: 'Ventole',
  humidifier: 'Umidificatori',
  light: 'Luci',
  lock: 'Serrature',
  media_player: 'Media player',
  person: 'Persone',
  scene: 'Scene',
  script: 'Script',
  select: 'Selettori',
  sensor: 'Sensori',
  siren: 'Sirene',
  sun: 'Sole',
  switch: 'Interruttori',
  update: 'Aggiornamenti',
  vacuum: 'Aspirapolvere',
  weather: 'Meteo',
  zone: 'Zone',
};

const DOMAIN_ICONS: Record<string, LucideIcon> = {
  alarm_control_panel: Shield,
  automation: Workflow,
  binary_sensor: Radio,
  calendar: CalendarDays,
  camera: Camera,
  climate: Thermometer,
  cover: Box,
  device_tracker: MapPin,
  fan: Fan,
  light: Lightbulb,
  lock: LockKeyhole,
  media_player: Speaker,
  person: UserRound,
  scene: Sparkles,
  sensor: Gauge,
  siren: AlarmClock,
  switch: ToggleRight,
  vacuum: Bot,
  weather: CloudSun,
};

type AvailabilityFilter = 'all' | 'available' | 'unavailable';

type EntityListEntry = {
  id: string;
  domain: string;
  domainLabel: string;
  name: string;
  value: string;
  unavailable: boolean;
  areaId: string;
  areaLabel: string;
};

const AVAILABILITY_OPTIONS: GlassSearchFilterOption[] = [
  { id: 'all', name: 'Qualsiasi stato' },
  { id: 'available', name: 'Disponibili' },
  { id: 'unavailable', name: 'Non disponibili' },
];

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveDomain(entityId: string) {
  return entityId.split('.', 1)[0] || 'other';
}

function formatDomain(domain: string) {
  return (
    DOMAIN_LABELS[domain] ??
    domain
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function formatEntityName(
  entityId: string,
  entity: MockEntityState | undefined,
  registryEntry?: HaEntityRegistryEntry,
) {
  return (
    normalizeText(entity?.rawAttributes?.friendly_name) ||
    normalizeText(registryEntry?.name) ||
    normalizeText(registryEntry?.originalName) ||
    entityId
      .replace(/^[^.]+\./, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function formatEntityValue(entity: MockEntityState | undefined, registryEntry?: HaEntityRegistryEntry) {
  if (registryEntry?.disabledBy) {
    return 'Disabilitata';
  }
  if (!entity) {
    return 'Stato non disponibile';
  }
  const label = normalizeText(entity.stateLabel);
  if (label) {
    return label;
  }
  const state = normalizeText(entity.state) || 'Sconosciuto';
  return entity.unit ? `${state} ${entity.unit}` : state;
}

function isEntityUnavailable(entity: MockEntityState | undefined, registryEntry?: HaEntityRegistryEntry) {
  if (!entity || registryEntry?.disabledBy) {
    return true;
  }
  const state = normalizeText(entity.state).toLowerCase();
  return state === 'unavailable' || state === 'unknown' || state.length === 0;
}

function EntityRow({ entry }: { entry: EntityListEntry }) {
  const Icon = DOMAIN_ICONS[entry.domain] ?? Box;
  return (
    <li className="flex min-w-0 items-center gap-3 border-t border-[color:var(--ui-separator)] px-4 py-3 first:border-t-0 sm:px-5">
      <Icon
        size={18}
        aria-hidden="true"
        className="shrink-0 text-[color:var(--ui-text-secondary)]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold text-[color:var(--ui-text-primary)]">
            {entry.name}
          </p>
          {entry.unavailable ? (
            <span className="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-500">
              Non disponibile
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[11px] font-medium text-[color:var(--ui-text-tertiary)]">
          {entry.id}
        </p>
      </div>
      <div className="min-w-0 max-w-[38%] shrink-0 text-right">
        <p className="truncate text-xs font-semibold text-[color:var(--ui-text-primary)]">
          {entry.value}
        </p>
        <p className="mt-0.5 truncate text-[10px] font-medium text-[color:var(--ui-text-tertiary)]">
          {entry.areaLabel ? `${entry.domainLabel} · ${entry.areaLabel}` : entry.domainLabel}
        </p>
      </div>
    </li>
  );
}

export function SettingsEntitiesList({
  haStates,
  entityRegistry = [],
  deviceRegistry = [],
  areas = [],
}: {
  haStates: MockEntityStateMap;
  entityRegistry?: HaEntityRegistryEntry[];
  deviceRegistry?: HaDeviceRegistryEntry[];
  areas?: HaArea[];
}) {
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('all');
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  const [area, setArea] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase('it'));

  const entities = useMemo<EntityListEntry[]>(
    () => {
      const registryByEntityId = new Map(entityRegistry.map((entry) => [entry.entityId, entry]));
      const deviceAreaById = new Map(deviceRegistry.map((entry) => [entry.id, entry.areaId ?? '']));
      const areaNameById = new Map(areas.map((entry) => [entry.area_id, entry.name]));
      const entityIds = Array.from(
        new Set([...Object.keys(haStates), ...entityRegistry.map((entry) => entry.entityId)]),
      );
      return entityIds
        .map((id) => {
          const entity = haStates[id];
          const registryEntry = registryByEntityId.get(id);
          const entityDomain = resolveDomain(id);
          const areaId =
            registryEntry?.areaId ||
            (registryEntry?.deviceId ? deviceAreaById.get(registryEntry.deviceId) : '') ||
            '';
          return {
            id,
            domain: entityDomain,
            domainLabel: formatDomain(entityDomain),
            name: formatEntityName(id, entity, registryEntry),
            value: formatEntityValue(entity, registryEntry),
            unavailable: isEntityUnavailable(entity, registryEntry),
            areaId,
            areaLabel: areaId ? areaNameById.get(areaId) ?? areaId : '',
          };
        })
        .sort((left, right) =>
          left.name.localeCompare(right.name, 'it', { sensitivity: 'base' }),
        );
    },
    [areas, deviceRegistry, entityRegistry, haStates],
  );

  const domainOptions = useMemo<GlassSearchFilterOption[]>(() => {
    const domains = Array.from(new Set(entities.map((entry) => entry.domain))).sort((left, right) =>
      formatDomain(left).localeCompare(formatDomain(right), 'it'),
    );
    return [
      { id: 'all', name: 'Tutti i tipi' },
      ...domains.map((id) => ({ id, name: formatDomain(id) })),
    ];
  }, [entities]);

  const areaOptions = useMemo<GlassSearchFilterOption[]>(() => {
    const availableAreas = new Map<string, string>();
    entities.forEach((entry) => {
      if (entry.areaId) {
        availableAreas.set(entry.areaId, entry.areaLabel || entry.areaId);
      }
    });
    return [
      { id: 'all', name: 'Tutte le stanze' },
      { id: 'none', name: 'Senza stanza' },
      ...Array.from(availableAreas, ([id, name]) => ({ id, name })).sort((left, right) =>
        left.name.localeCompare(right.name, 'it'),
      ),
    ];
  }, [entities]);

  const filteredEntities = useMemo(
    () =>
      entities.filter((entry) => {
        if (domain !== 'all' && entry.domain !== domain) {
          return false;
        }
        if (availability === 'available' && entry.unavailable) {
          return false;
        }
        if (availability === 'unavailable' && !entry.unavailable) {
          return false;
        }
        if (area === 'none' && entry.areaId) {
          return false;
        }
        if (area !== 'all' && area !== 'none' && entry.areaId !== area) {
          return false;
        }
        if (!deferredQuery) {
          return true;
        }
        return `${entry.name} ${entry.id} ${entry.value} ${entry.domainLabel} ${entry.areaLabel}`
          .toLocaleLowerCase('it')
          .includes(deferredQuery);
      }),
    [area, availability, deferredQuery, domain, entities],
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [area, availability, deferredQuery, domain]);

  const visibleEntities = filteredEntities.slice(0, visibleCount);
  const resetFilters = () => {
    setQuery('');
    setDomain('all');
    setAvailability('all');
    setArea('all');
  };

  return (
    <div>
      <div className="sticky top-0 z-30">
        <GlassSearchFilterBar
          query={query}
          onQueryChange={setQuery}
          placeholder="Cerca per nome, ID o stato"
          resultCount={filteredEntities.length}
          resultLabel={(count) => `${count} entità`}
          onReset={resetFilters}
          filters={[
            {
              id: 'domain',
              label: 'Tipo',
              ariaLabel: 'Filtra per tipo',
              options: domainOptions,
              value: domain,
              defaultValue: 'all',
              onChange: setDomain,
            },
            {
              id: 'availability',
              label: 'Disponibilità',
              ariaLabel: 'Filtra per disponibilità',
              options: AVAILABILITY_OPTIONS,
              value: availability,
              defaultValue: 'all',
              onChange: (value) => setAvailability(value as AvailabilityFilter),
            },
            {
              id: 'area',
              label: 'Stanza',
              ariaLabel: 'Filtra per stanza',
              options: areaOptions,
              value: area,
              defaultValue: 'all',
              onChange: setArea,
            },
          ]}
        />
      </div>

      <section className="dashboard-content-surface mt-4 overflow-hidden rounded-[1.5rem]">
        {visibleEntities.length > 0 ? (
          <ul aria-label="Elenco entità">
            {visibleEntities.map((entry) => (
              <EntityRow key={entry.id} entry={entry} />
            ))}
          </ul>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
            <Search size={22} className="text-[color:var(--ui-text-tertiary)]" />
            <h3 className="mt-3 text-sm font-semibold">Nessuna entità trovata</h3>
            <p className="mt-1 text-xs text-[color:var(--ui-text-secondary)]">
              Prova a modificare la ricerca o i filtri.
            </p>
          </div>
        )}
      </section>

      {visibleCount < filteredEntities.length ? (
        <button
          type="button"
          onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
          className="liquid-glass-selection mx-auto mt-4 flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
        >
          Mostra altre {Math.min(PAGE_SIZE, filteredEntities.length - visibleCount)}
        </button>
      ) : null}
    </div>
  );
}

export default SettingsEntitiesList;
