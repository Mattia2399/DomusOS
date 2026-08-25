import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NotificationProvider, useNotifications } from './NotificationProvider';

afterEach(cleanup);

function NotificationHarness() {
  const { addNotification } = useNotifications();
  return (
    <>
      <button type="button" onClick={() => addNotification('info', 'Luce aggiornata')}>
        Invia info
      </button>
      <button type="button" onClick={() => addNotification('alert', 'Allarme attivo')}>
        Invia allarme
      </button>
    </>
  );
}

describe('NotificationProvider announcements', () => {
  it('announces ordinary feedback politely', () => {
    render(
      <NotificationProvider>
        <NotificationHarness />
      </NotificationProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Invia info' }));

    const announcement = screen.getByRole('status');
    expect(announcement.textContent).toBe('Luce aggiornata');
    expect(announcement.getAttribute('aria-live')).toBe('polite');
  });

  it('announces alerts assertively', () => {
    render(
      <NotificationProvider>
        <NotificationHarness />
      </NotificationProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Invia allarme' }));

    const announcement = screen.getByRole('alert');
    expect(announcement.textContent).toBe('Allarme attivo');
    expect(announcement.getAttribute('aria-live')).toBe('assertive');
  });
});
