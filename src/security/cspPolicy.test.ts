import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('production CSP fallback', () => {
  it('contains the required defensive directives and no unsafe-eval', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain("default-src 'self'");
    expect(html).toContain("script-src 'self'");
    expect(html).toContain("object-src 'none'");
    expect(html).toContain("base-uri 'self'");
    expect(html).toContain("form-action 'self'");
    expect(html).toContain("worker-src 'self' blob:");
    expect(html).not.toContain('unsafe-eval');
  });
});
