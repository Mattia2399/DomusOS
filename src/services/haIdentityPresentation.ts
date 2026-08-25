export type HaAuthUser = {
  id: string;
  name: string;
  username?: string;
  email?: string;
  isOwner?: boolean;
  isAdmin?: boolean;
};

export type HaLogbookEvent = {
  when?: string;
  message?: string;
  name?: string;
  state?: string;
  entity_id?: string;
  context_user_id?: string;
  context_user_name?: string;
  user_id?: string;
  user_name?: string;
  context?: { user_id?: string; user_name?: string };
};

function toTrimmedString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseUserEntry(value: unknown): HaAuthUser | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const id = toTrimmedString(source.id);
  const name = toTrimmedString(source.name) ?? toTrimmedString(source.username);
  if (!id || !name) return null;
  const username = toTrimmedString(source.username);
  const explicitEmail = toTrimmedString(source.email);
  return {
    id,
    name,
    username,
    email: explicitEmail ?? (username?.includes('@') ? username : undefined),
    isOwner: source.is_owner === true,
    isAdmin: source.is_admin === true,
  };
}

export function parseHaAuthUsers(payload: unknown): HaAuthUser[] {
  if (!Array.isArray(payload)) return [];
  const seen = new Set<string>();
  return payload.flatMap((entry) => {
    const user = parseUserEntry(entry);
    if (!user || seen.has(user.id)) return [];
    seen.add(user.id);
    return [user];
  });
}

export function parseHaCurrentUser(payload: unknown) {
  return parseUserEntry(payload);
}

export function parseHaLogbookEvents(payload: unknown): HaLogbookEvent[] {
  return Array.isArray(payload)
    ? payload.filter((entry): entry is HaLogbookEvent => Boolean(entry) && typeof entry === 'object')
    : [];
}
