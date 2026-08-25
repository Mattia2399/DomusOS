export type DynamicUrlKind = 'image' | 'media' | 'link' | 'iframe';

function isSafeDataImage(value: string) {
  return /^data:image\/(?:png|jpeg|jpg|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(value);
}

export function sanitizeDynamicUrl(
  rawValue: unknown,
  kind: DynamicUrlKind,
  options: { baseUrl?: string; allowedOrigins?: readonly string[] } = {},
) {
  if (typeof rawValue !== 'string' || !rawValue.trim()) return undefined;
  const value = rawValue.trim();
  if (kind === 'image' && isSafeDataImage(value)) return value;
  if ((kind === 'image' || kind === 'media') && value.startsWith('blob:')) return value;

  let parsed: URL;
  try {
    parsed = new URL(value, options.baseUrl);
  } catch {
    return undefined;
  }
  if (parsed.username || parsed.password) return undefined;
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
  if (kind === 'iframe' && parsed.protocol !== 'https:' && parsed.origin !== options.baseUrl) return undefined;

  if (options.allowedOrigins?.length) {
    const allowed = new Set(options.allowedOrigins.map((origin) => {
      try { return new URL(origin).origin; } catch { return ''; }
    }));
    if (!allowed.has(parsed.origin)) return undefined;
  }
  return parsed.toString();
}

export const EXTERNAL_LINK_REL = 'noopener noreferrer' as const;
