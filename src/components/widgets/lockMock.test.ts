import { describe, expect, it } from 'vitest';
import {
  LOCK_MAX_COMPAT_MOCK_ENTITY_ID,
  LOCK_MOCK_STATES,
  createLockStateMocks,
  getLockMockEntityId,
} from './lockMock';

describe('lock diagnostic mocks', () => {
  it('exposes every supported visual state as a distinct entity', () => {
    const states = createLockStateMocks();

    expect(Object.keys(states)).toHaveLength(LOCK_MOCK_STATES.length);
    for (const state of LOCK_MOCK_STATES) {
      expect(states[getLockMockEntityId(state)]?.state).toBe(state);
    }
  });

  it('keeps battery optional instead of inventing it for every lock', () => {
    const states = createLockStateMocks();

    expect(states[LOCK_MAX_COMPAT_MOCK_ENTITY_ID]?.rawAttributes?.battery_level).toBe(78);
    expect(states[LOCK_MAX_COMPAT_MOCK_ENTITY_ID]?.rawAttributes?.connection_status).toBe('connected');
    expect(states[getLockMockEntityId('jammed')]?.rawAttributes?.battery_level).toBeUndefined();
    expect(states[getLockMockEntityId('jammed')]?.rawAttributes?.connection_status).toBeUndefined();
  });
});
