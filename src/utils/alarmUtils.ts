import type { MockEntityState } from '../types/ha';

export const ALARM_FEATURE_ARM_HOME = 1;
export const ALARM_FEATURE_ARM_AWAY = 2;
export const ALARM_FEATURE_ARM_NIGHT = 4;
export const ALARM_FEATURE_TRIGGER = 8;
export const ALARM_FEATURE_ARM_CUSTOM_BYPASS = 16;
export const ALARM_FEATURE_ARM_VACATION = 32;

export type AlarmServiceName =
  | 'alarm_disarm'
  | 'alarm_arm_home'
  | 'alarm_arm_away'
  | 'alarm_arm_night'
  | 'alarm_arm_vacation'
  | 'alarm_arm_custom_bypass'
  | 'alarm_trigger';

export function toTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeAlarmState(value: unknown): string {
  const raw = toTrimmedString(value)?.toLowerCase().replace(/[\s-]+/g, '_');
  if (!raw) {
    return 'unknown';
  }
  if (raw === 'off') {
    return 'disarmed';
  }
  if (raw === 'on') {
    return 'armed_away';
  }
  return raw;
}

export function getAlarmStateLabel(state: string): string {
  const normalized = normalizeAlarmState(state);
  if (normalized === 'disarmed') {
    return 'Disinserito';
  }
  if (normalized === 'armed_home') {
    return 'Inserito Casa';
  }
  if (normalized === 'armed_away') {
    return 'Inserito Fuori';
  }
  if (normalized === 'armed_night') {
    return 'Inserito Notte';
  }
  if (normalized === 'armed_vacation') {
    return 'Inserito Vacanza';
  }
  if (normalized === 'armed_custom_bypass') {
    return 'Inserito Bypass';
  }
  if (normalized === 'pending') {
    return 'In attesa';
  }
  if (normalized === 'arming') {
    return 'Inserimento';
  }
  if (normalized === 'disarming') {
    return 'Disinserimento';
  }
  if (normalized === 'triggered') {
    return 'Allarme';
  }
  if (normalized === 'unavailable') {
    return 'Non disponibile';
  }
  return state || 'Sconosciuto';
}

export function isAlarmArmedState(state: string): boolean {
  const normalized = normalizeAlarmState(state);
  return !['disarmed', 'off', 'unknown', 'unavailable'].includes(normalized);
}

export function resolveAlarmSupportedFeatures(entity: MockEntityState | undefined): number | undefined {
  if (!entity) {
    return undefined;
  }
  if (typeof entity.supportedFeatures === 'number' && Number.isFinite(entity.supportedFeatures)) {
    return Math.round(entity.supportedFeatures);
  }
  const rawSupported = entity.rawAttributes?.supported_features;
  if (typeof rawSupported === 'number' && Number.isFinite(rawSupported)) {
    return Math.round(rawSupported);
  }
  return undefined;
}

export function alarmSupportsFeature(supportedFeatures: number | undefined, feature: number): boolean {
  if (typeof supportedFeatures !== 'number') {
    return false;
  }
  return (supportedFeatures & feature) !== 0;
}

export function resolveAlarmNextState(service: AlarmServiceName): string {
  if (service === 'alarm_disarm') {
    return 'disarmed';
  }
  if (service === 'alarm_arm_home') {
    return 'armed_home';
  }
  if (service === 'alarm_arm_away') {
    return 'armed_away';
  }
  if (service === 'alarm_arm_night') {
    return 'armed_night';
  }
  if (service === 'alarm_arm_vacation') {
    return 'armed_vacation';
  }
  if (service === 'alarm_arm_custom_bypass') {
    return 'armed_custom_bypass';
  }
  return 'triggered';
}
