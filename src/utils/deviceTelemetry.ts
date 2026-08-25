import type { HaEntityRegistryEntry } from '../services/haRegistryPresentation';
import type { MockEntityState, MockEntityStateMap } from '../types/ha';

export type DeviceConnectionState = 'online' | 'offline' | 'unknown';

export type DeviceConnectionTelemetry = {
  state: DeviceConnectionState;
  label: string;
};

export type DeviceTelemetryEntitySelection = {
  batteryEntity?: MockEntityState;
  batteryEntityId?: string;
  connectionEntity?: MockEntityState;
  connectionEntityId?: string;
};

const BATTERY_ATTRIBUTE_KEYS = [
  'battery_level',
  'battery',
  'battery_percentage',
  'battery_percent',
  'battery_state_of_charge',
] as const;

const CONNECTION_ATTRIBUTE_KEYS = [
  'connection_status',
  'connectivity',
  'connected',
  'connessa',
  'connesso',
  'online',
  'network_status',
  'linkquality',
  'link_quality',
  'rssi',
] as const;

const CONNECTION_ON_VALUES = new Set([
  'on',
  'online',
  'connected',
  'home',
  'available',
  'ok',
  'true',
  'yes',
  'open',
]);

const CONNECTION_OFF_VALUES = new Set([
  'off',
  'offline',
  'disconnected',
  'disconnessa',
  'disconnesso',
  'not_home',
  'unavailable',
  'down',
  'false',
  'no',
  'closed',
]);

function toFiniteNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || value.trim().length === 0) return undefined;
  const parsed = Number.parseFloat(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readFirstAttribute(attributes: Record<string, unknown> | undefined, keys: readonly string[]) {
  if (!attributes) return undefined;
  for (const key of keys) {
    if (attributes[key] !== undefined && attributes[key] !== null && attributes[key] !== '') {
      return { key, value: attributes[key] };
    }
  }
  return undefined;
}

function resolveRelatedEntityValue(entity: MockEntityState | undefined) {
  if (!entity) return undefined;
  return entity.numericValue ?? entity.state ?? entity.stateLabel ?? entity.secondary;
}

export function resolveDeviceBatteryLevel(
  primaryEntity: MockEntityState | undefined,
  batteryEntity?: MockEntityState,
) {
  const relatedValue = toFiniteNumber(resolveRelatedEntityValue(batteryEntity));
  if (relatedValue !== undefined) {
    return Math.max(0, Math.min(100, Math.round(relatedValue)));
  }

  const attribute = readFirstAttribute(primaryEntity?.rawAttributes, BATTERY_ATTRIBUTE_KEYS);
  const attributeValue = toFiniteNumber(attribute?.value);
  return attributeValue === undefined
    ? undefined
    : Math.max(0, Math.min(100, Math.round(attributeValue)));
}

function normalizeConnectionState(value: unknown): DeviceConnectionState {
  if (typeof value === 'boolean') return value ? 'online' : 'offline';
  if (typeof value === 'number') return Number.isFinite(value) ? 'online' : 'unknown';
  if (typeof value !== 'string') return 'unknown';
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (CONNECTION_ON_VALUES.has(normalized)) return 'online';
  if (CONNECTION_OFF_VALUES.has(normalized)) return 'offline';
  return 'unknown';
}

function normalizeToken(value: unknown) {
  return typeof value === 'string'
    ? value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
    : '';
}

function resolveEntity(haStates: MockEntityStateMap, entityId: string | undefined) {
  const normalized = entityId?.trim();
  return normalized ? haStates[normalized] ?? haStates[normalized.toLowerCase()] : undefined;
}

function scoreBatteryCandidate(entry: HaEntityRegistryEntry, entity: MockEntityState | undefined) {
  const domain = entry.entityId.split('.')[0]?.toLowerCase() ?? '';
  if (domain !== 'sensor' && domain !== 'number') return -1;
  const attributes = entity?.rawAttributes;
  const deviceClass = normalizeToken(entry.deviceClass ?? attributes?.device_class);
  const token = normalizeToken(
    `${entry.entityId} ${entry.name ?? ''} ${entry.originalName ?? ''} ${attributes?.friendly_name ?? ''}`,
  );
  if (deviceClass === 'battery') return 100;
  if (token.includes('battery') || token.includes('batteria')) return 70;
  return -1;
}

function scoreConnectionCandidate(entry: HaEntityRegistryEntry, entity: MockEntityState | undefined) {
  const domain = entry.entityId.split('.')[0]?.toLowerCase() ?? '';
  if (domain !== 'sensor' && domain !== 'binary_sensor' && domain !== 'device_tracker') return -1;
  const attributes = entity?.rawAttributes;
  const deviceClass = normalizeToken(entry.deviceClass ?? attributes?.device_class);
  const token = normalizeToken(
    `${entry.entityId} ${entry.name ?? ''} ${entry.originalName ?? ''} ${attributes?.friendly_name ?? ''}`,
  );
  if (deviceClass === 'connectivity') return 110;
  if (deviceClass === 'signal strength') return 95;
  if (/(connection|connectivity|connected|online|connessione|conness|link quality|linkquality|rssi|wifi|wi fi|segnale)/.test(token)) {
    return domain === 'binary_sensor' ? 90 : 75;
  }
  return -1;
}

function selectBestRelatedEntity(
  candidates: HaEntityRegistryEntry[],
  haStates: MockEntityStateMap,
  scorer: (entry: HaEntityRegistryEntry, entity: MockEntityState | undefined) => number,
) {
  return candidates
    .map((entry) => ({ entry, entity: resolveEntity(haStates, entry.entityId) }))
    .filter((candidate) => Boolean(candidate.entity))
    .map((candidate) => ({ ...candidate, score: scorer(candidate.entry, candidate.entity) }))
    .filter((candidate) => candidate.score >= 0)
    .sort((left, right) => right.score - left.score || left.entry.entityId.localeCompare(right.entry.entityId))[0];
}

export function resolveDeviceTelemetryEntities({
  mainEntityId,
  haStates,
  entityRegistry,
  batteryEntityId,
  connectionEntityId,
}: {
  mainEntityId: string;
  haStates: MockEntityStateMap;
  entityRegistry: HaEntityRegistryEntry[];
  batteryEntityId?: string;
  connectionEntityId?: string;
}): DeviceTelemetryEntitySelection {
  const explicitBatteryEntity = resolveEntity(haStates, batteryEntityId);
  const explicitConnectionEntity = resolveEntity(haStates, connectionEntityId);
  const mainRegistryEntry = entityRegistry.find(
    (entry) => entry.entityId.toLowerCase() === mainEntityId.trim().toLowerCase(),
  );
  const relatedEntries = mainRegistryEntry?.deviceId
    ? entityRegistry.filter(
        (entry) =>
          entry.deviceId === mainRegistryEntry.deviceId &&
          entry.entityId.toLowerCase() !== mainEntityId.trim().toLowerCase() &&
          !entry.disabledBy &&
          !entry.hiddenBy,
      )
    : [];
  const automaticBattery = explicitBatteryEntity
    ? undefined
    : selectBestRelatedEntity(relatedEntries, haStates, scoreBatteryCandidate);
  const automaticConnection = explicitConnectionEntity
    ? undefined
    : selectBestRelatedEntity(relatedEntries, haStates, scoreConnectionCandidate);

  return {
    batteryEntity: explicitBatteryEntity ?? automaticBattery?.entity,
    batteryEntityId: explicitBatteryEntity ? batteryEntityId?.trim() : automaticBattery?.entry.entityId,
    connectionEntity: explicitConnectionEntity ?? automaticConnection?.entity,
    connectionEntityId: explicitConnectionEntity ? connectionEntityId?.trim() : automaticConnection?.entry.entityId,
  };
}

export function resolveDeviceConnection(
  primaryEntity: MockEntityState | undefined,
  connectionEntity?: MockEntityState,
): DeviceConnectionTelemetry | undefined {
  const relatedValue = connectionEntity
    ? connectionEntity.state ?? connectionEntity.stateLabel ?? connectionEntity.secondary
    : undefined;
  const attribute = readFirstAttribute(primaryEntity?.rawAttributes, CONNECTION_ATTRIBUTE_KEYS);
  const source = relatedValue ?? attribute?.value;

  // No explicit related entity and no supported attribute: the capability is absent.
  if (!connectionEntity && !attribute) return undefined;

  const relatedNumeric = connectionEntity
    ? toFiniteNumber(connectionEntity.numericValue ?? connectionEntity.state)
    : undefined;
  const relatedDeviceClass = normalizeToken(connectionEntity?.rawAttributes?.device_class);
  const relatedUnit = connectionEntity?.unit?.trim();
  if (
    connectionEntity &&
    relatedNumeric !== undefined &&
    (relatedDeviceClass === 'signal strength' || normalizeToken(relatedUnit) === 'dbm')
  ) {
    return {
      state: 'online',
      label: `${Math.round(relatedNumeric)} ${relatedUnit || 'dBm'}`,
    };
  }

  if (connectionEntity && relatedNumeric !== undefined) {
    return {
      state: 'online',
      label: `${Math.round(relatedNumeric)}${relatedUnit ? ` ${relatedUnit}` : '%'}`,
    };
  }

  if (attribute?.key === 'rssi') {
    const rssi = toFiniteNumber(source);
    return {
      state: rssi === undefined ? 'unknown' : 'online',
      label: rssi === undefined ? 'Non disponibile' : `${Math.round(rssi)} dBm`,
    };
  }

  if (attribute?.key === 'linkquality' || attribute?.key === 'link_quality') {
    const quality = toFiniteNumber(source);
    return {
      state: quality === undefined ? 'unknown' : 'online',
      label: quality === undefined ? 'Non disponibile' : `${Math.round(quality)}%`,
    };
  }

  const state = normalizeConnectionState(source);
  return {
    state,
    label: state === 'online' ? 'Connessa' : state === 'offline' ? 'Disconnessa' : 'Non disponibile',
  };
}
