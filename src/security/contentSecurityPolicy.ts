function normalizeCspOrigin(value: string) {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.origin : null;
  } catch {
    return null;
  }
}

export function buildProductionCsp(configuredOrigins: readonly string[]) {
  const origins = [...new Set(configuredOrigins.map(normalizeCspOrigin).filter((value): value is string => Boolean(value)))];
  const websocketOrigins = origins.map((origin) => origin.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:'));
  const httpSources = origins.join(' ');
  const connectSources = [...origins, ...websocketOrigins].join(' ');
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${httpSources ? ` ${httpSources}` : ''}`,
    `media-src 'self' blob:${httpSources ? ` ${httpSources}` : ''}`,
    `connect-src 'self'${connectSources ? ` ${connectSources}` : ''}`,
    "worker-src 'self' blob:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self'",
    "manifest-src 'self'",
  ].join('; ');
}
