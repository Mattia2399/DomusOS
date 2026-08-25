import { describe, expect, it } from 'vitest';
import { resolveMediaRepeatMode, resolveMediaState } from './mainBoardMediaModel';

describe('mainBoardMediaModel', () => {
  describe('resolveMediaState', () => {
    it('delegates to the shared media player state normalizer', () => {
      expect(resolveMediaState('playing')).toBe('playing');
      expect(resolveMediaState(undefined)).toBe('unknown');
    });
  });

  describe('resolveMediaRepeatMode', () => {
    it('maps one/single/track/1 aliases to one', () => {
      expect(resolveMediaRepeatMode('one')).toBe('one');
      expect(resolveMediaRepeatMode('single')).toBe('one');
      expect(resolveMediaRepeatMode('track')).toBe('one');
      expect(resolveMediaRepeatMode('1')).toBe('one');
    });

    it('maps all/playlist/on/true aliases to all', () => {
      expect(resolveMediaRepeatMode('all')).toBe('all');
      expect(resolveMediaRepeatMode('playlist')).toBe('all');
      expect(resolveMediaRepeatMode('on')).toBe('all');
      expect(resolveMediaRepeatMode('true')).toBe('all');
    });

    it('falls back to off for anything else', () => {
      expect(resolveMediaRepeatMode('off')).toBe('off');
      expect(resolveMediaRepeatMode(undefined)).toBe('off');
      expect(resolveMediaRepeatMode('garbage')).toBe('off');
    });
  });
});
