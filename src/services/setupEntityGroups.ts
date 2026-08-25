import type { MockEntityState } from '../types/ha';

export type SetupEntityGroupId =
  | 'lights'
  | 'locks'
  | 'covers'
  | 'climate'
  | 'security'
  | 'cameras'
  | 'energy'
  | 'sensors'
  | 'controls'
  | 'media'
  | 'cleaning'
  | 'presence'
  | 'scenes'
  | 'weather'
  | 'updates'
  | 'other';

export type SetupEntityGroup = {
  id: SetupEntityGroupId;
  label: string;
  count: number;
};

const GROUP_LABELS: Record<SetupEntityGroupId, string> = {
  lights: 'Luci',
  locks: 'Serrature',
  covers: 'Tapparelle e coperture',
  climate: 'Clima e aria',
  security: 'Sicurezza',
  cameras: 'Telecamere',
  energy: 'Energia e consumi',
  sensors: 'Sensori',
  controls: 'Interruttori e comandi',
  media: 'Media',
  cleaning: 'Pulizia',
  presence: 'Persone e presenza',
  scenes: 'Scene e automazioni',
  weather: 'Meteo',
  updates: 'Aggiornamenti',
  other: 'Altro',
};

const GROUP_ORDER = Object.keys(GROUP_LABELS) as SetupEntityGroupId[];

const ENERGY_DEVICE_CLASSES = new Set([
  'current',
  'energy',
  'gas',
  'monetary',
  'power',
  'voltage',
  'water',
]);

const SECURITY_BINARY_DEVICE_CLASSES = new Set([
  'door',
  'garage_door',
  'gas',
  'lock',
  'moisture',
  'motion',
  'occupancy',
  'opening',
  'problem',
  'safety',
  'smoke',
  'tamper',
  'window',
]);

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function resolveSetupEntityGroup(entityId: string, entity?: MockEntityState): SetupEntityGroupId {
  const domain = normalize(entityId.split('.')[0]);
  const deviceClass = normalize(entity?.rawAttributes?.device_class);

  if (domain === 'light') return 'lights';
  if (domain === 'lock') return 'locks';
  if (domain === 'cover') return 'covers';
  if (['climate', 'fan', 'humidifier', 'water_heater'].includes(domain)) return 'climate';
  if (['alarm_control_panel', 'siren'].includes(domain)) return 'security';
  if (domain === 'camera') return 'cameras';
  if (domain === 'sensor' && ENERGY_DEVICE_CLASSES.has(deviceClass)) return 'energy';
  if (domain === 'binary_sensor' && SECURITY_BINARY_DEVICE_CLASSES.has(deviceClass)) return 'security';
  if (['sensor', 'binary_sensor'].includes(domain)) return 'sensors';
  if (['switch', 'input_boolean', 'button', 'input_button', 'select', 'input_select', 'number', 'input_number'].includes(domain)) return 'controls';
  if (['media_player', 'remote'].includes(domain)) return 'media';
  if (['vacuum', 'lawn_mower'].includes(domain)) return 'cleaning';
  if (['person', 'device_tracker', 'zone'].includes(domain)) return 'presence';
  if (['automation', 'scene', 'script'].includes(domain)) return 'scenes';
  if (['weather', 'sun'].includes(domain)) return 'weather';
  if (domain === 'update') return 'updates';
  return 'other';
}

export function buildSetupEntityGroupCounts(entries: Array<[string, MockEntityState]>) {
  return entries.reduce<Record<string, number>>((groups, [entityId, entity]) => {
    const groupId = resolveSetupEntityGroup(entityId, entity);
    groups[groupId] = (groups[groupId] ?? 0) + 1;
    return groups;
  }, {});
}

function readRegistryEntries(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const entities = (payload as Record<string, unknown>).entities;
  return Array.isArray(entities) ? entities : [];
}

export function buildSetupEntityGroupCountsFromRegistry(payload: unknown) {
  const entries = readRegistryEntries(payload).flatMap<[string, MockEntityState]>((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const record = entry as Record<string, unknown>;
    // list_for_display uses compact keys (ei/dc), while the full registry uses
    // entity_id/device_class. Supporting both avoids waiting for live states.
    const entityId = normalize(record.entity_id) || normalize(record.ei);
    if (!entityId) return [];
    const deviceClass = normalize(record.device_class) || normalize(record.dc);
    return [[entityId, { state: '', rawAttributes: deviceClass ? { device_class: deviceClass } : undefined }]];
  });
  return buildSetupEntityGroupCounts(entries);
}

export function groupLegacySetupDomains(domains: Record<string, number>) {
  return Object.entries(domains).reduce<Record<string, number>>((groups, [domain, count]) => {
    const groupId = resolveSetupEntityGroup(`${domain}.placeholder`);
    groups[groupId] = (groups[groupId] ?? 0) + count;
    return groups;
  }, {});
}

export function listSetupEntityGroups(groups: Record<string, number>): SetupEntityGroup[] {
  return GROUP_ORDER
    .map((id) => ({ id, label: GROUP_LABELS[id], count: groups[id] ?? 0 }))
    .filter((group) => group.count > 0)
    .sort((left, right) => {
      if (left.id === 'other') return 1;
      if (right.id === 'other') return -1;
      return right.count - left.count || GROUP_ORDER.indexOf(left.id) - GROUP_ORDER.indexOf(right.id);
    });
}
