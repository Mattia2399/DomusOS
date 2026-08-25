import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ALLOWED_ROUTER_IMPORTS = new Set([
  'BrowserRouter',
  'Route',
  'Routes',
  'useLocation',
  'useNavigate',
]);

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const FORBIDDEN_ROUTER_SYMBOLS = [
  'RouterProvider',
  'createBrowserRouter',
  'createHashRouter',
  'createMemoryRouter',
  'createStaticRouter',
  'createRequestHandler',
  'RSCStaticRouter',
  'routeRSCServerRequest',
  'matchRSCServerRequest',
  'unstable_matchRSCServerRequest',
];

function collectSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }

    if (
      !SOURCE_EXTENSIONS.has(extname(entry.name))
      || entry.name.includes('.test.')
      || entry.name.includes('.spec.')
      || entry.name.endsWith('.d.ts')
    ) {
      return [];
    }

    return [entryPath];
  });
}

function importedNames(importClause) {
  const trimmedClause = importClause.trim();
  if (!trimmedClause.startsWith('{') || !trimmedClause.endsWith('}')) {
    return { names: [], unsupportedSyntax: true };
  }

  const names = trimmedClause
    .slice(1, -1)
    .split(',')
    .map((name) => name.trim().replace(/^type\s+/, '').split(/\s+as\s+/u)[0])
    .filter(Boolean);

  return { names, unsupportedSyntax: false };
}

export function validateRouterMode({ srcDirectory, packageJsonPath }) {
  const violations = [];
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const routerRange = packageJson.dependencies?.['react-router'];
  const routerDomRange = packageJson.dependencies?.['react-router-dom'];

  if (typeof routerRange !== 'string' || !/^\D*8(?:\.|$)/u.test(routerRange)) {
    violations.push(
      'Il rilascio richiede React Router 8 come dipendenza diretta.',
    );
  }
  if (routerDomRange !== undefined) {
    violations.push('react-router-dom è stato rimosso in React Router 8 e non deve essere installato.');
  }

  for (const filePath of collectSourceFiles(srcDirectory)) {
    const source = readFileSync(filePath, 'utf8');
    const displayPath = relative(process.cwd(), filePath);
    const importPattern =
      /import\s+([^;]+?)\s+from\s+['"]((?:react-router(?:-dom|\/[^'"]*)?)|(?:@react-router\/[^'"]+))['"];?/gu;

    for (const match of source.matchAll(importPattern)) {
      const [, importClause, moduleName] = match;
      if (moduleName !== 'react-router') {
        violations.push(`${displayPath}: import Router non consentito da "${moduleName}".`);
        continue;
      }

      const parsedImport = importedNames(importClause);
      if (parsedImport.unsupportedSyntax) {
        violations.push(
          `${displayPath}: sono ammessi soltanto import nominati da "react-router".`,
        );
        continue;
      }

      for (const name of parsedImport.names) {
        if (!ALLOWED_ROUTER_IMPORTS.has(name)) {
          violations.push(`${displayPath}: API Router non consentita "${name}".`);
        }
      }
    }

    const dynamicRouterImport =
      /import\s*\(\s*['"](?:react-router(?:-dom|\/[^'"]*)?|@react-router\/[^'"]+)['"]\s*\)/u;
    if (dynamicRouterImport.test(source)) {
      violations.push(`${displayPath}: import dinamico Router non consentito.`);
    }

    for (const symbol of FORBIDDEN_ROUTER_SYMBOLS) {
      if (new RegExp(`\\b${symbol}\\b`, 'u').test(source)) {
        violations.push(`${displayPath}: simbolo Router server/Data/RSC vietato "${symbol}".`);
      }
    }

    if (/\bunstable_\w*RSC\w*\b/u.test(source)) {
      violations.push(`${displayPath}: API RSC instabile non consentita.`);
    }
  }

  return violations;
}
