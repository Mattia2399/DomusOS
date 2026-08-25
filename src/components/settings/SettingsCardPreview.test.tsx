import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import SettingsCardPreview from './SettingsCardPreview';

afterEach(cleanup);

describe('SettingsCardPreview', () => {
  it('uses real member images and exposes their presence', () => {
    render(
      <SettingsCardPreview
        variant="people"
        members={[
          {
            id: 'person.mattia',
            name: 'Mattia',
            avatarUrl: '/avatar.jpg',
            presence: 'home',
          },
        ]}
      />,
    );

    expect(screen.getByRole('img', { name: 'Mattia' })).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('A casa')).toBeTruthy();
  });

  it('keeps missing Home Assistant data explicit', () => {
    const { rerender } = render(
      <SettingsCardPreview variant="home" areas={[]} entityCount={0} />,
    );
    expect(screen.getByText('Nessuna stanza configurata')).toBeTruthy();

    rerender(
      <SettingsCardPreview
        variant="system"
        statusLabel="Operativo"
        tone="ok"
        cpuPercent={null}
        ramPercent={null}
      />,
    );
    expect(screen.getAllByText('ND')).toHaveLength(2);
  });

  it('summarizes alarm and lock state without adding controls', () => {
    render(
      <SettingsCardPreview
        variant="security"
        alarmCount={2}
        armedAlarmCount={1}
        lockCount={3}
        lockedLockCount={2}
      />,
    );

    expect(screen.getByText('1/2')).toBeTruthy();
    expect(screen.getByText('2/3')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
