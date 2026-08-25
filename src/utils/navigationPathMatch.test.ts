import { describe, expect, it } from 'vitest';
import { isPathActiveForLocation } from './navigationPathMatch';

describe('navigation path matching', () => {
  it('matches a route supplied by embedded navigation state', () => {
    expect(isPathActiveForLocation('/security', '/security')).toBe(true);
    expect(isPathActiveForLocation('/home', '/security')).toBe(false);
  });

  it('keeps matching nested routes to their primary navigation destination', () => {
    expect(isPathActiveForLocation('/consumi', '/consumi/energia')).toBe(true);
  });
});
