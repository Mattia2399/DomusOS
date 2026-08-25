import { describe, expect, it } from 'vitest';
import { buildProductionCsp } from './contentSecurityPolicy';

describe('generated production CSP', () => {
  it('includes only configured HA origins and their websocket equivalents', () => {
    const policy = buildProductionCsp(['https://ha.example.test', 'javascript:alert(1)']);
    expect(policy).toContain("connect-src 'self' https://ha.example.test wss://ha.example.test");
    expect(policy).not.toContain('javascript:');
    expect(policy).not.toContain('unsafe-eval');
    expect(policy).not.toContain('https:;');
  });
});
