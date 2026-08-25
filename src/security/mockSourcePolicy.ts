export function requestTargetsMockEntity(value: unknown, mockEntityIds: ReadonlySet<string>, depth = 0): boolean {
  if (depth > 6 || value === null || value === undefined) return false;
  if (typeof value === 'string') return mockEntityIds.has(value.trim());
  if (Array.isArray(value)) {
    return value.some((entry) => requestTargetsMockEntity(entry, mockEntityIds, depth + 1));
  }
  if (typeof value !== 'object') return false;
  return Object.entries(value as Record<string, unknown>).some(([, entry]) =>
    requestTargetsMockEntity(entry, mockEntityIds, depth + 1),
  );
}

const MOCK_SAFE_CONFIGURATION_API_TYPES = new Set([
  'frontend/get_system_data',
  'frontend/set_system_data',
]);

/**
 * Persisting a card that references a mock entity is configuration, not an
 * entity command. Operational API requests remain blocked, while the shared
 * DomusOS document may safely describe mock cards.
 */
export function shouldBlockMockEntityApiRequest(
  message: Record<string, unknown>,
  mockEntityIds: ReadonlySet<string>,
) {
  const type = typeof message.type === 'string' ? message.type : '';
  if (MOCK_SAFE_CONFIGURATION_API_TYPES.has(type)) return false;
  return requestTargetsMockEntity(message, mockEntityIds);
}

function normalizeEntityId(value: string) {
  return value.trim().toLowerCase();
}

export function resolveCardDataSource(params: {
  entityId: string;
  homeAssistantEntityIds: readonly string[];
  demoEntityIds: readonly string[];
}): 'ha' | 'mock' {
  const entityId = normalizeEntityId(params.entityId);
  if (!entityId) return 'ha';

  const isHomeAssistantEntity = params.homeAssistantEntityIds.some(
    (candidate) => normalizeEntityId(candidate) === entityId,
  );
  if (isHomeAssistantEntity) return 'ha';

  const isDemoEntity = params.demoEntityIds.some(
    (candidate) => normalizeEntityId(candidate) === entityId,
  );
  return isDemoEntity ? 'mock' : 'ha';
}
