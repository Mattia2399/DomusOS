import { describe, expect, it } from 'vitest';
import { normalizeMediaPlayerStateKey, translateMediaPlayerState } from './mediaPlayerState';

describe('media player state translation', () => {
  it('translates official media-player states to Italian', () => {
    expect(translateMediaPlayerState('playing')).toBe('In riproduzione');
    expect(translateMediaPlayerState('paused')).toBe('In pausa');
    expect(translateMediaPlayerState('idle')).toBe('Inattivo');
    expect(translateMediaPlayerState('buffering')).toBe('Caricamento');
    expect(translateMediaPlayerState('on')).toBe('Acceso');
    expect(translateMediaPlayerState('off')).toBe('Spento');
    expect(translateMediaPlayerState('standby')).toBe('Standby');
    expect(translateMediaPlayerState('unavailable')).toBe('Non disponibile');
    expect(translateMediaPlayerState('unknown')).toBe('Sconosciuto');
  });

  it('keeps translated labels normalizable for downstream UI logic', () => {
    expect(normalizeMediaPlayerStateKey('In riproduzione')).toBe('playing');
    expect(normalizeMediaPlayerStateKey('In pausa')).toBe('paused');
    expect(normalizeMediaPlayerStateKey('Non disponibile')).toBe('unavailable');
    expect(normalizeMediaPlayerStateKey('Spento')).toBe('off');
  });
});
