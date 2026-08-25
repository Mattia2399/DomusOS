// @vitest-environment node

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { evaluateAuditReport } from '../../scripts/audit-release-policy.mjs';
import { validateRouterMode } from '../../scripts/router-mode-contract.mjs';

const projectDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('contratto React Router e audit release', () => {
  it('mantiene il codice applicativo nella sola modalità SPA dichiarativa', () => {
    const violations = validateRouterMode({
      srcDirectory: join(projectDirectory, 'src'),
      packageJsonPath: join(projectDirectory, 'package.json'),
    });

    expect(violations).toEqual([]);
  });

  it('blocca qualsiasi vulnerabilità di livello moderate o superiore senza eccezioni', () => {
    const decision = evaluateAuditReport({
      vulnerabilities: {
        example: {
          name: 'example',
          severity: 'moderate',
          range: '<2.0.0',
          via: [{ url: 'https://example.test/advisory' }],
        },
      },
    });

    expect(decision.blocking.map((item: { name: string }) => item.name)).toEqual(['example']);
  });

  it('mantiene non bloccanti soltanto le vulnerabilità low', () => {
    const decision = evaluateAuditReport({
      vulnerabilities: {
        example: {
          name: 'example',
          severity: 'low',
          range: '<2.0.0',
          via: [{ url: 'https://example.test/advisory' }],
        },
      },
    });

    expect(decision.blocking).toEqual([]);
    expect(decision.ignoredLow.map((item: { name: string }) => item.name)).toEqual(['example']);
  });
});
