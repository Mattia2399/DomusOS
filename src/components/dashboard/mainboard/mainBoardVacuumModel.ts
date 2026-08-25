export const VACUUM_COMMAND_TTL_MS = 12000;

export function normalizeVacuumState(value: string | undefined) {
  const normalized = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalized) {
    return 'unknown';
  }
  if (normalized === 'returning_to_base') {
    return 'returning';
  }
  if (normalized === 'charging') {
    return 'docked';
  }
  return normalized;
}

export function translateVacuumState(state: string) {
  if (state === 'cleaning') {
    return 'Pulizia';
  }
  if (state === 'paused') {
    return 'In pausa';
  }
  if (state === 'returning') {
    return 'Rientro base';
  }
  if (state === 'docked') {
    return 'In base';
  }
  if (state === 'idle') {
    return 'Inattivo';
  }
  if (state === 'error') {
    return 'Errore';
  }
  if (state === 'unavailable') {
    return 'Non disponibile';
  }
  return 'Sconosciuto';
}
