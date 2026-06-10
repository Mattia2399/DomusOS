import { describe, expect, it } from 'vitest';
import {
  formatAuthRateLimitMessage,
  getAuthRateLimitStatus,
  recordAuthFailure,
  recordAuthSuccess,
} from './securityAuth';

describe('security auth rate limiting', () => {
  it('soft-locks after three failed attempts', () => {
    const now = 1_000;
    let state = recordAuthFailure(undefined, now);
    state = recordAuthFailure(state, now + 1);
    state = recordAuthFailure(state, now + 2);

    const status = getAuthRateLimitStatus(state, now + 3);

    expect(status.isLocked).toBe(true);
    expect(status.failedCount).toBe(3);
    expect(formatAuthRateLimitMessage(status)).toContain('Riprova tra');
  });

  it('hard-locks after five failed attempts', () => {
    const now = 1_000;
    let state = recordAuthFailure(undefined, now);
    state = recordAuthFailure(state, now + 1);
    state = recordAuthFailure(state, now + 2);
    state = recordAuthFailure(state, now + 3);
    state = recordAuthFailure(state, now + 4);

    const status = getAuthRateLimitStatus(state, now + 5);

    expect(status.isLocked).toBe(true);
    expect(status.failedCount).toBe(5);
    expect(status.remainingMs).toBeGreaterThan(4 * 60_000);
  });

  it('resets counters after successful auth', () => {
    const failed = recordAuthFailure(undefined, 1_000);
    const reset = recordAuthSuccess();

    expect(failed.failedCount).toBe(1);
    expect(getAuthRateLimitStatus(reset, 2_000).isLocked).toBe(false);
    expect(reset.failedCount).toBe(0);
  });
});
