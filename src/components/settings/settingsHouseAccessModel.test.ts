import { describe, expect, it } from 'vitest';
import {
  createDashboardRoleSharePayload,
  normalizeHouseMembers,
  parseDashboardRoleSharePayload,
  resolveDashboardShareRoleKey,
  resolveDashboardShareRoleLabel,
} from './settingsHouseAccessModel';

describe('settingsHouseAccessModel', () => {
  it('normalizes, deduplicates and prioritizes the current house member', () => {
    const members = normalizeHouseMembers([
      { id: ' user-2 ', name: ' Zoe ' },
      { id: 'user-1', name: 'Mattia', isCurrent: true },
      { id: 'user-2', name: 'Duplicato' },
      { id: '', name: 'Ignorato' },
    ]);

    expect(members.map((member) => member.id)).toEqual(['user-1', 'user-2']);
    expect(members[1]?.name).toBe('Zoe');
  });

  it('maps Home Assistant role labels to the sharing contract', () => {
    expect(resolveDashboardShareRoleKey('Owner')).toBe('creator');
    expect(resolveDashboardShareRoleKey('Amministratore Admin')).toBe('admin');
    expect(resolveDashboardShareRoleKey('Utente')).toBe('member');
    expect(resolveDashboardShareRoleLabel('creator')).toBe('Creatore');
  });

  it('round-trips a valid role-scoped sharing payload', () => {
    const payload = createDashboardRoleSharePayload({
      roleKey: 'admin',
      roleLabel: 'Admin',
      createdBy: 'Mattia',
      createdAt: '2026-07-29T12:00:00.000Z',
      data: { preferences: { compact: true } },
    });

    expect(parseDashboardRoleSharePayload(JSON.stringify(payload))).toEqual(payload);
    expect(parseDashboardRoleSharePayload('{"schema":"unknown"}')).toBeNull();
  });
});
