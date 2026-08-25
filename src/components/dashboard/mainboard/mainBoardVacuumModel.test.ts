import { describe, expect, it } from 'vitest';
import { normalizeVacuumState, translateVacuumState } from './mainBoardVacuumModel';

describe('mainBoardVacuumModel', () => {
  describe('normalizeVacuumState', () => {
    it('falls back to unknown for empty/undefined input', () => {
      expect(normalizeVacuumState(undefined)).toBe('unknown');
      expect(normalizeVacuumState('   ')).toBe('unknown');
    });

    it('normalizes casing and whitespace', () => {
      expect(normalizeVacuumState('  Cleaning ')).toBe('cleaning');
      expect(normalizeVacuumState('Returning To Base')).toBe('returning');
    });

    it('aliases returning_to_base to returning', () => {
      expect(normalizeVacuumState('returning_to_base')).toBe('returning');
    });

    it('aliases charging to docked', () => {
      expect(normalizeVacuumState('charging')).toBe('docked');
    });

    it('passes through unrecognized states unchanged', () => {
      expect(normalizeVacuumState('error')).toBe('error');
      expect(normalizeVacuumState('idle')).toBe('idle');
    });
  });

  describe('translateVacuumState', () => {
    it('translates every known state', () => {
      expect(translateVacuumState('cleaning')).toBe('Pulizia');
      expect(translateVacuumState('paused')).toBe('In pausa');
      expect(translateVacuumState('returning')).toBe('Rientro base');
      expect(translateVacuumState('docked')).toBe('In base');
      expect(translateVacuumState('idle')).toBe('Inattivo');
      expect(translateVacuumState('error')).toBe('Errore');
      expect(translateVacuumState('unavailable')).toBe('Non disponibile');
    });

    it('falls back to Sconosciuto for unrecognized states', () => {
      expect(translateVacuumState('unknown')).toBe('Sconosciuto');
      expect(translateVacuumState('')).toBe('Sconosciuto');
    });
  });
});
