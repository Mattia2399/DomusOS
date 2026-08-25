import type { MockEntityState } from '../../types/ha';
import { toVacuumFiniteNumber, toVacuumString } from './vacuumCardModel';

export type VacuumDeviceInfo = {
  id?: string;
  name?: string;
  manufacturer?: string;
  model?: string;
  swVersion?: string;
  hwVersion?: string;
  areaId?: string;
  configurationUrl?: string;
};

export type VacuumRelatedEntityInfo = {
  entityId: string;
  domain: string;
  name: string;
  state: string;
  stateLabel: string;
  unit?: string;
  deviceClass?: string;
  entityCategory?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  imageUrl?: string;
  rawAttributes?: Record<string, unknown>;
};

export type VacuumMappedArea = {
  id: string;
  name: string;
  segmentIds?: string[];
};

export type VacuumDeviceSnapshot = {
  batteryLevel?: number;
  mapUrl?: string;
  cleanedArea?: number;
  cleanedAreaUnit?: string;
  cleaningMinutes?: number;
  relatedEntities: VacuumRelatedEntityInfo[];
};

function normalizeToken(value: string | undefined) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((entry) => toVacuumString(entry)).filter((entry): entry is string => Boolean(entry))
    : [];
}

export function resolveVacuumAssetUrl(value: string | undefined, haUrl = '') {
  const candidate = value?.trim();
  if (!candidate) return undefined;
  if (/^(https?:|data:|blob:)/i.test(candidate)) return candidate;
  if (!candidate.startsWith('/')) return candidate;
  const base = haUrl.trim().replace(/\/+$/, '');
  return base ? `${base}${candidate}` : candidate;
}

export function buildVacuumRelatedEntity(
  entityId: string,
  entity: MockEntityState | undefined,
  registry?: {
    name?: string;
    originalName?: string;
    entityCategory?: string;
    deviceClass?: string;
  },
  haUrl = '',
): VacuumRelatedEntityInfo {
  const attributes = entity?.rawAttributes ?? {};
  const domain = entityId.split('.')[0]?.toLowerCase() ?? '';
  const name =
    registry?.name ??
    registry?.originalName ??
    toVacuumString(attributes.friendly_name) ??
    entityId.split('.')[1]?.replace(/[_-]+/g, ' ') ??
    entityId;
  const state = toVacuumString(entity?.state) ?? '';
  const stateLabel = toVacuumString(entity?.stateLabel) ?? state;
  const imageUrl = resolveVacuumAssetUrl(
    toVacuumString(entity?.imageUrl) ??
      toVacuumString(attributes.entity_picture) ??
      toVacuumString(attributes.image_url),
    haUrl,
  );

  return {
    entityId,
    domain,
    name,
    state,
    stateLabel,
    unit: toVacuumString(entity?.unit) ?? toVacuumString(attributes.unit_of_measurement),
    deviceClass: registry?.deviceClass ?? toVacuumString(attributes.device_class),
    entityCategory: registry?.entityCategory ?? toVacuumString(attributes.entity_category),
    options: toStringArray(attributes.options),
    min: toVacuumFiniteNumber(attributes.min),
    max: toVacuumFiniteNumber(attributes.max),
    step: toVacuumFiniteNumber(attributes.step),
    imageUrl,
    rawAttributes: attributes,
  };
}

function findRelated(
  related: VacuumRelatedEntityInfo[],
  predicate: (entity: VacuumRelatedEntityInfo, token: string) => boolean,
) {
  return related.find((entity) => predicate(entity, normalizeToken(`${entity.entityId} ${entity.name}`)));
}

function resolveDurationMinutes(entity: VacuumRelatedEntityInfo | undefined) {
  if (!entity) return undefined;
  const value = toVacuumFiniteNumber(entity.stateLabel) ?? toVacuumFiniteNumber(entity.state);
  if (value === undefined) return undefined;
  const unit = normalizeToken(entity.unit);
  if (unit === 's' || unit.includes('second')) return value / 60;
  if (unit === 'h' || unit.includes('hour') || unit.includes('ora')) return value * 60;
  return value;
}

export function buildVacuumDeviceSnapshot({
  vacuumEntity,
  relatedEntities,
  haUrl = '',
}: {
  vacuumEntity?: MockEntityState;
  relatedEntities: VacuumRelatedEntityInfo[];
  haUrl?: string;
}): VacuumDeviceSnapshot {
  const attributes = vacuumEntity?.rawAttributes ?? {};
  const batteryEntity = findRelated(relatedEntities, (entity, token) =>
    entity.domain === 'sensor' && (normalizeToken(entity.deviceClass) === 'battery' || token.includes('batter')),
  );
  const mapEntity =
    findRelated(relatedEntities, (entity, token) => entity.domain === 'image' && token.includes('map')) ??
    findRelated(relatedEntities, (entity) => entity.domain === 'image');
  const areaEntity = findRelated(relatedEntities, (entity, token) =>
    entity.domain === 'sensor' &&
    (token.includes('cleaned area') || token.includes('cleaning area') || token.includes('area pulita')),
  );
  const timeEntity = findRelated(relatedEntities, (entity, token) =>
    entity.domain === 'sensor' &&
    (normalizeToken(entity.deviceClass) === 'duration' || token.includes('cleaning time') || token.includes('tempo pulizia')),
  );
  const batteryLevel =
    toVacuumFiniteNumber(batteryEntity?.stateLabel) ??
    toVacuumFiniteNumber(batteryEntity?.state) ??
    toVacuumFiniteNumber(attributes.battery_level) ??
    toVacuumFiniteNumber(attributes.battery);
  const cleanedArea =
    toVacuumFiniteNumber(areaEntity?.stateLabel) ??
    toVacuumFiniteNumber(areaEntity?.state) ??
    toVacuumFiniteNumber(attributes.cleaned_area) ??
    toVacuumFiniteNumber(attributes.clean_area);
  const cleaningMinutes =
    resolveDurationMinutes(timeEntity) ??
    toVacuumFiniteNumber(attributes.cleaning_time) ??
    toVacuumFiniteNumber(attributes.clean_time);
  const mapUrl =
    mapEntity?.imageUrl ??
    resolveVacuumAssetUrl(
      toVacuumString(vacuumEntity?.imageUrl) ??
        toVacuumString(attributes.entity_picture) ??
        toVacuumString(attributes.map_url) ??
        toVacuumString(attributes.map_image),
      haUrl,
    );

  return {
    batteryLevel,
    mapUrl,
    cleanedArea,
    cleanedAreaUnit:
      areaEntity?.unit ??
      toVacuumString(attributes.cleaned_area_unit) ??
      toVacuumString(attributes.area_unit) ??
      (cleanedArea === undefined ? undefined : 'm²'),
    cleaningMinutes,
    relatedEntities,
  };
}

export function enrichVacuumEntity(
  entity: MockEntityState,
  snapshot: VacuumDeviceSnapshot,
): MockEntityState {
  return {
    ...entity,
    rawAttributes: {
      ...(entity.rawAttributes ?? {}),
      ...(snapshot.batteryLevel !== undefined ? { __dashboard_battery_level: snapshot.batteryLevel } : {}),
      ...(snapshot.mapUrl ? { __dashboard_map_url: snapshot.mapUrl } : {}),
      ...(snapshot.cleanedArea !== undefined ? { __dashboard_cleaned_area: snapshot.cleanedArea } : {}),
      ...(snapshot.cleanedAreaUnit ? { __dashboard_cleaned_area_unit: snapshot.cleanedAreaUnit } : {}),
      ...(snapshot.cleaningMinutes !== undefined ? { __dashboard_cleaning_minutes: snapshot.cleaningMinutes } : {}),
    },
  };
}

export function parseVacuumMappedAreas(
  options: Record<string, unknown> | undefined,
  areaNames: Map<string, string>,
): VacuumMappedArea[] {
  const vacuumOptions = isRecord(options?.vacuum) ? options.vacuum : undefined;
  const areaMapping = isRecord(vacuumOptions?.area_mapping) ? vacuumOptions.area_mapping : undefined;
  if (!areaMapping) return [];
  return Object.entries(areaMapping)
    .map(([id, rawSegments]) => ({
      id,
      name: areaNames.get(id) ?? id.replace(/[_-]+/g, ' '),
      segmentIds: toStringArray(rawSegments),
    }))
    .sort((first, second) => first.name.localeCompare(second.name, 'it-IT'));
}

export function isVacuumSecondaryControl(entity: VacuumRelatedEntityInfo) {
  if (entity.entityCategory === 'diagnostic') return true;
  return ['switch', 'select', 'number', 'button', 'sensor'].includes(entity.domain);
}
