import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateAuditReport } from './audit-release-policy.mjs';
import { validateRouterMode } from './router-mode-contract.mjs';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = dirname(scriptsDirectory);
const routerViolations = validateRouterMode({
  srcDirectory: join(projectDirectory, 'src'),
  packageJsonPath: join(projectDirectory, 'package.json'),
});

if (routerViolations.length > 0) {
  console.error('Audit release bloccato: il contratto SPA dichiarativo non è rispettato.');
  for (const violation of routerViolations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

const auditArguments = ['audit', '--omit=dev', '--json', '--audit-level=moderate'];
const npmExecPath = process.env.npm_execpath;
const auditResult = npmExecPath
  ? spawnSync(process.execPath, [npmExecPath, ...auditArguments], {
      cwd: projectDirectory,
      encoding: 'utf8',
    })
  : process.platform === 'win32'
    ? spawnSync(
        'cmd.exe',
        ['/d', '/s', '/c', `npm ${auditArguments.join(' ')}`],
        { cwd: projectDirectory, encoding: 'utf8' },
      )
    : spawnSync('npm', auditArguments, {
        cwd: projectDirectory,
        encoding: 'utf8',
      });

if (auditResult.error) {
  console.error(`Impossibile eseguire npm audit: ${auditResult.error.message}`);
  process.exit(1);
}

let auditReport;
try {
  auditReport = JSON.parse(auditResult.stdout);
} catch {
  console.error('npm audit non ha restituito un report JSON valido.');
  if (auditResult.stderr) {
    console.error(auditResult.stderr.trim());
  }
  process.exit(1);
}

const decision = evaluateAuditReport(auditReport);
if (decision.blocking.length > 0) {
  console.error('Audit release bloccato.');
  for (const vulnerability of decision.blocking) {
    console.error(
      `- ${vulnerability.name}: ${vulnerability.severity} (${vulnerability.range ?? 'range non disponibile'})`,
    );
  }
  process.exit(1);
}

if (decision.ignoredLow.length > 0) {
  console.warn(
    `Audit: ${decision.ignoredLow.length} vulnerabilità low non bloccanti rilevate.`,
  );
}

console.log('Audit dipendenze di produzione conforme alla policy di rilascio.');
