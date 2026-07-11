export type MediaPlayerStateKey =
  | 'playing'
  | 'paused'
  | 'idle'
  | 'buffering'
  | 'on'
  | 'off'
  | 'standby'
  | 'unavailable'
  | 'unknown';

function normalizeStateText(value: string | undefined) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function normalizeMediaPlayerStateKey(value: string | undefined): MediaPlayerStateKey {
  const normalized = normalizeStateText(value);
  if (!normalized) return 'unknown';
  if (
    normalized === 'unavailable' ||
    normalized === 'not available' ||
    normalized === 'non disponibile' ||
    normalized === 'offline'
  ) {
    return 'unavailable';
  }
  if (normalized === 'unknown' || normalized === 'sconosciuto') return 'unknown';
  if (normalized === 'standby' || normalized === 'stand by') return 'standby';
  if (normalized === 'buffering' || normalized === 'buffer' || normalized === 'caricamento') return 'buffering';
  if (
    normalized === 'playing' ||
    normalized === 'play' ||
    normalized === 'in riproduzione' ||
    normalized === 'riproduzione'
  ) {
    return 'playing';
  }
  if (normalized === 'paused' || normalized === 'pause' || normalized === 'in pausa' || normalized === 'pausa') {
    return 'paused';
  }
  if (normalized === 'idle' || normalized === 'inactive' || normalized === 'inattivo') return 'idle';
  if (normalized === 'on' || normalized === 'acceso' || normalized === 'attivo') return 'on';
  if (normalized === 'off' || normalized === 'spento') return 'off';
  return 'unknown';
}

export function translateMediaPlayerState(value: string | undefined, fallback = 'Sconosciuto') {
  const state = normalizeMediaPlayerStateKey(value);
  if (state === 'playing') return 'In riproduzione';
  if (state === 'paused') return 'In pausa';
  if (state === 'idle') return 'Inattivo';
  if (state === 'buffering') return 'Caricamento';
  if (state === 'on') return 'Acceso';
  if (state === 'off') return 'Spento';
  if (state === 'standby') return 'Standby';
  if (state === 'unavailable') return 'Non disponibile';
  if (state === 'unknown') return fallback;
  return fallback;
}
