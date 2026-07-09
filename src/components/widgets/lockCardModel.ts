import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';

export type LockCardState =
  | 'locked'
  | 'unlocked'
  | 'locking'
  | 'unlocking'
  | 'opening'
  | 'open'
  | 'jammed'
  | 'unavailable'
  | 'unknown';

export type LockCardTone = 'secure' | 'open' | 'warning' | 'transition' | 'offline';
export type LockCardPrimaryAction = 'lock' | 'unlock' | 'none';
export type LockPendingAction = 'lock' | 'unlock' | 'open';

export type LockCardModel = {
  title: string;
  state: LockCardState;
  stateLabel: string;
  compactStateLabel: string;
  caption: string;
  hint: string;
  changedBy?: string;
  batteryLevel?: number;
  supportsOpen: boolean;
  pendingAction?: LockPendingAction;
  isLocked: boolean;
  isUnlocked: boolean;
  isOpen: boolean;
  isJammed: boolean;
  isTransitioning: boolean;
  isUnavailable: boolean;
  primaryAction: LockCardPrimaryAction;
  primaryActionLabel: string;
  primaryActionHint: string;
  secondaryActionLabel?: string;
  tone: LockCardTone;
};

const LOCK_FEATURE_OPEN = 1;
const LOCK_PENDING_ATTRIBUTE_KEY = '__dashboard_pending_lock';

function toFiniteNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.trim().replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toTrimmedString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export function normalizeLockCardState(value: string | undefined): LockCardState {
  const normalized = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalized) return 'unknown';

  if (normalized === 'locked' || normalized === 'closed' || normalized === 'bloccata' || normalized === 'bloccato' || normalized === 'chiusa' || normalized === 'chiuso') {
    return 'locked';
  }
  if (normalized === 'unlocked' || normalized === 'sbloccata' || normalized === 'sbloccato') {
    return 'unlocked';
  }
  if (normalized === 'open' || normalized === 'opened' || normalized === 'aperta' || normalized === 'aperto') {
    return 'open';
  }
  if (normalized === 'opening' || normalized === 'apertura' || normalized === 'in_apertura') {
    return 'opening';
  }
  if (normalized === 'locking' || normalized === 'closing' || normalized === 'chiusura' || normalized === 'in_chiusura') {
    return 'locking';
  }
  if (normalized === 'unlocking' || normalized === 'in_sblocco') {
    return 'unlocking';
  }
  if (normalized === 'jammed' || normalized === 'inceppata' || normalized === 'inceppato' || normalized === 'blocked') {
    return 'jammed';
  }
  if (normalized === 'unavailable' || normalized === 'offline' || normalized === 'not_available') {
    return 'unavailable';
  }
  if (normalized.includes('sblocc')) {
    return normalized.includes('in_corso') || normalized.includes('ing') ? 'unlocking' : 'unlocked';
  }
  if (normalized.includes('apert')) {
    return normalized.includes('in_corso') || normalized.includes('ing') ? 'opening' : 'open';
  }
  if (normalized.includes('chius') || normalized.includes('blocc')) {
    return normalized.includes('in_corso') || normalized.includes('ing') ? 'locking' : 'locked';
  }
  return 'unknown';
}

export function translateLockCardState(state: LockCardState) {
  if (state === 'locked') return 'Bloccata';
  if (state === 'unlocked') return 'Sbloccata';
  if (state === 'locking') return 'Blocco...';
  if (state === 'unlocking') return 'Sblocco...';
  if (state === 'opening') return 'Apertura...';
  if (state === 'open') return 'Aperta';
  if (state === 'jammed') return 'Inceppata';
  if (state === 'unavailable') return 'Non disponibile';
  return 'Sconosciuta';
}

function resolvePendingAction(value: unknown): LockPendingAction | undefined {
  return value === 'lock' || value === 'unlock' || value === 'open' ? value : undefined;
}

function resolvePendingState(action: LockPendingAction): LockCardState {
  if (action === 'lock') return 'locking';
  if (action === 'open') return 'opening';
  return 'unlocking';
}

function resolveBatteryLevel(rawAttributes: Record<string, unknown> | undefined) {
  if (!rawAttributes) return undefined;
  const candidates = [
    rawAttributes.battery_level,
    rawAttributes.battery,
    rawAttributes.battery_percentage,
    rawAttributes.battery_percent,
  ];
  for (const candidate of candidates) {
    const value = toFiniteNumber(candidate);
    if (value !== undefined) {
      return Math.max(0, Math.min(100, Math.round(value)));
    }
  }
  return undefined;
}

function resolveSupportedFeatures(liveEntity: MockEntityState | undefined, rawAttributes: Record<string, unknown> | undefined) {
  if (typeof liveEntity?.supportedFeatures === 'number') {
    return liveEntity.supportedFeatures;
  }
  return toFiniteNumber(rawAttributes?.supported_features);
}

function resolveCaption(state: LockCardState, supportsOpen: boolean) {
  if (state === 'locked') return supportsOpen ? 'Protezione attiva, scrocco chiuso' : 'Protezione attiva';
  if (state === 'unlocked') return 'Accesso consentito';
  if (state === 'open') return 'Varco aperto';
  if (state === 'opening') return 'Apertura dello scrocco in corso';
  if (state === 'locking') return 'Chiusura in corso';
  if (state === 'unlocking') return 'Sblocco in corso';
  if (state === 'jammed') return 'Controlla la serratura';
  if (state === 'unavailable') return 'Entita non raggiungibile';
  return 'Stato non disponibile';
}

function resolveTone(state: LockCardState): LockCardTone {
  if (state === 'locked') return 'secure';
  if (state === 'jammed') return 'warning';
  if (state === 'locking' || state === 'unlocking' || state === 'opening') return 'transition';
  if (state === 'unavailable' || state === 'unknown') return 'offline';
  return 'open';
}

export function buildLockCardModel(widget: Widget, liveEntity?: MockEntityState): LockCardModel {
  const rawAttributes = liveEntity?.rawAttributes;
  const pendingAction = resolvePendingAction(rawAttributes?.[LOCK_PENDING_ATTRIBUTE_KEY]);
  const entityState = normalizeLockCardState(
    toTrimmedString(liveEntity?.state) ??
      toTrimmedString(liveEntity?.stateLabel) ??
      widget.status,
  );
  const state = pendingAction ? resolvePendingState(pendingAction) : entityState;
  const supportedFeatures = resolveSupportedFeatures(liveEntity, rawAttributes);
  const supportsOpen = typeof supportedFeatures === 'number' && (supportedFeatures & LOCK_FEATURE_OPEN) !== 0;
  const stateLabel = translateLockCardState(state);
  const isTransitioning = state === 'locking' || state === 'unlocking' || state === 'opening';
  const isLocked = state === 'locked' || state === 'locking';
  const isOpen = state === 'open' || state === 'opening';
  const isUnlocked = state === 'unlocked' || isOpen;
  const isJammed = state === 'jammed';
  const isUnavailable = state === 'unavailable' || state === 'unknown';
  const primaryAction: LockCardPrimaryAction =
    isTransitioning || isJammed || isUnavailable
      ? 'none'
      : isLocked
        ? 'unlock'
        : 'lock';
  const changedBy = toTrimmedString(rawAttributes?.changed_by);
  const caption = resolveCaption(state, supportsOpen);

  return {
    title: widget.title || toTrimmedString(rawAttributes?.friendly_name) || 'Serratura',
    state,
    stateLabel,
    compactStateLabel: state === 'locked' ? 'Protetta' : stateLabel,
    caption,
    hint:
      primaryAction === 'unlock'
        ? 'Tieni premuto per sbloccare'
        : primaryAction === 'lock'
          ? 'Tocca per bloccare'
          : caption,
    changedBy,
    batteryLevel: resolveBatteryLevel(rawAttributes),
    supportsOpen,
    pendingAction,
    isLocked,
    isUnlocked,
    isOpen,
    isJammed,
    isTransitioning,
    isUnavailable,
    primaryAction,
    primaryActionLabel:
      primaryAction === 'unlock'
        ? 'Sblocca'
        : primaryAction === 'lock'
          ? 'Blocca'
          : 'Non disponibile',
    primaryActionHint:
      primaryAction === 'unlock'
        ? 'Richiede conferma'
        : primaryAction === 'lock'
          ? 'Blocco rapido'
          : caption,
    secondaryActionLabel: supportsOpen ? 'Apri scrocco' : undefined,
    tone: resolveTone(state),
  };
}
