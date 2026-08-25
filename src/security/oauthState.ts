export const HA_OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

export type HaOAuthStatePayload = {
  nonce: string;
  hassUrl: string;
  returnTo: string;
  issuedAt: number;
};

export function parseHaOAuthState(rawState: string | null): HaOAuthStatePayload | null {
  if (!rawState) return null;
  try {
    const parsed = JSON.parse(rawState) as Partial<HaOAuthStatePayload>;
    if (
      typeof parsed.nonce !== 'string' || parsed.nonce.length < 16 ||
      typeof parsed.hassUrl !== 'string' ||
      typeof parsed.returnTo !== 'string' ||
      typeof parsed.issuedAt !== 'number' || !Number.isFinite(parsed.issuedAt)
    ) {
      return null;
    }
    return {
      nonce: parsed.nonce,
      hassUrl: parsed.hassUrl,
      returnTo: parsed.returnTo,
      issuedAt: parsed.issuedAt,
    };
  } catch {
    return null;
  }
}

export function resolveOAuthReturnPath(path: string | undefined) {
  const candidate = path?.trim() ?? '';
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return '/home';
  }
  try {
    const parsed = new URL(candidate, 'https://dashboard.invalid');
    return parsed.origin === 'https://dashboard.invalid'
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : '/home';
  } catch {
    return '/home';
  }
}

export function validateHaOAuthCallbackState(
  receivedState: string | null,
  expectedState: string | null,
  now = Date.now(),
): { ok: true; payload: HaOAuthStatePayload } | { ok: false; reason: string } {
  if (!receivedState || !expectedState || receivedState !== expectedState) {
    return { ok: false, reason: 'mismatch' };
  }
  const payload = parseHaOAuthState(receivedState);
  if (!payload) {
    return { ok: false, reason: 'invalid' };
  }
  const age = now - payload.issuedAt;
  if (age < -60_000 || age > HA_OAUTH_STATE_MAX_AGE_MS) {
    return { ok: false, reason: 'expired' };
  }
  if (resolveOAuthReturnPath(payload.returnTo) !== payload.returnTo) {
    return { ok: false, reason: 'unsafe_return' };
  }
  return { ok: true, payload };
}
