import type { MockEntityState, MockEntityStateMap } from '../../types/ha';

export const LOCK_MOCK_STATES = [
  'locked',
  'unlocked',
  'locking',
  'unlocking',
  'open',
  'opening',
  'jammed',
  'unavailable',
  'unknown',
] as const;

export type LockMockState = (typeof LOCK_MOCK_STATES)[number];

export const LOCK_MAX_COMPAT_MOCK_ENTITY_ID = 'lock.max_compat_locked';

export function getLockMockEntityId(state: LockMockState) {
  return `lock.max_compat_${state}`;
}

function getFriendlyStateLabel(state: LockMockState) {
  if (state === 'locked') return 'Bloccata';
  if (state === 'unlocked') return 'Sbloccata';
  if (state === 'locking') return 'Blocco in corso';
  if (state === 'unlocking') return 'Sblocco in corso';
  if (state === 'open') return 'Aperta';
  if (state === 'opening') return 'Apertura in corso';
  if (state === 'jammed') return 'Bloccata meccanicamente';
  if (state === 'unavailable') return 'Non disponibile';
  return 'Stato sconosciuto';
}

export function createLockMock(state: LockMockState = 'locked'): MockEntityState {
  const rawAttributes: Record<string, unknown> = {
    friendly_name: `Lock demo · ${getFriendlyStateLabel(state)}`,
    supported_features: 1,
    changed_by: 'Mock diagnostico',
  };

  if (state === 'locked') {
    rawAttributes.battery_level = 78;
    rawAttributes.connection_status = 'connected';
  }

  return {
    state,
    stateLabel: state,
    supportedFeatures: 1,
    toggleOn: state === 'locked' || state === 'locking',
    rawAttributes,
  };
}

export function createLockStateMocks(): MockEntityStateMap {
  return LOCK_MOCK_STATES.reduce<MockEntityStateMap>((states, state) => {
    states[getLockMockEntityId(state)] = createLockMock(state);
    return states;
  }, {});
}
