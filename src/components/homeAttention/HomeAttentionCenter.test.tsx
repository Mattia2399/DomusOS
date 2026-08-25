import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomeAttentionCenter from './HomeAttentionCenter';
import {
  DEFAULT_HOME_ATTENTION_PREFERENCES,
  saveHomeAttentionPreferences,
} from './homeAttentionPreferences';

afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

describe('HomeAttentionCenter', () => {
  it('opens a clearly simulated responsive panel in Demo', () => {
    render(
      <HomeAttentionCenter
        runtimeMode="demo"
        connected={false}
        states={{}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Apri Centro Attenzione/ }));

    expect(screen.getByRole('dialog', { name: 'Centro Attenzione' })).toBeTruthy();
    expect(screen.getAllByText('Demo').length).toBeGreaterThan(0);
    expect(screen.getByText(/nessuno di questi avvisi proviene dalla tua casa/i)).toBeTruthy();
    expect(screen.getByText('Finestra studio aperta')).toBeTruthy();
  });

  it('stays absent when the real home has no actionable state', () => {
    const { container } = render(
      <HomeAttentionCenter
        runtimeMode="real"
        connected
        states={{
          'light.kitchen': {
            state: 'on',
            rawAttributes: { friendly_name: 'Luce cucina' },
          },
        }}
      />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('opens a configured entity without executing a command', () => {
    const onOpenItem = vi.fn();
    render(
      <HomeAttentionCenter
        runtimeMode="real"
        connected
        states={{
          'lock.front_door': {
            state: 'unlocked',
            rawAttributes: { friendly_name: 'Porta ingresso' },
          },
        }}
        onOpenItem={onOpenItem}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Apri Centro Attenzione/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Controlla Porta ingresso sbloccata' }));

    expect(onOpenItem).toHaveBeenCalledTimes(1);
    expect(onOpenItem.mock.calls[0][0].entityId).toBe('lock.front_door');
  });

  it('does not render categories disabled from Settings', () => {
    saveHomeAttentionPreferences('real', {
      ...DEFAULT_HOME_ATTENTION_PREFERENCES,
      categories: {
        ...DEFAULT_HOME_ATTENTION_PREFERENCES.categories,
        security: false,
      },
    });

    const { container } = render(
      <HomeAttentionCenter
        runtimeMode="real"
        connected
        states={{
          'lock.front_door': {
            state: 'unlocked',
            rawAttributes: { friendly_name: 'Porta ingresso' },
          },
        }}
      />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('can ignore a non-critical item until Home Assistant changes its state', async () => {
    render(
      <HomeAttentionCenter
        runtimeMode="real"
        connected
        states={{
          'lock.front_door': {
            state: 'unlocked',
            rawAttributes: {
              friendly_name: 'Porta ingresso',
              __last_changed: '2026-07-30T10:00:00Z',
            },
          },
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Apri Centro Attenzione/ }));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Ignora finché cambia stato: Porta ingresso sbloccata',
      }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /Apri Centro Attenzione/ }),
      ).toBeNull(),
    );
  });

  it('keeps critical safety events visible without snooze controls', () => {
    render(
      <HomeAttentionCenter
        runtimeMode="real"
        connected
        states={{
          'binary_sensor.smoke': {
            state: 'on',
            rawAttributes: {
              friendly_name: 'Fumo cucina',
              device_class: 'smoke',
              __last_changed: '2026-07-30T10:00:00Z',
            },
          },
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Apri Centro Attenzione/ }));

    expect(screen.getByText('Sempre visibile')).toBeTruthy();
    expect(screen.queryByText('Ricordamelo')).toBeNull();
    expect(screen.queryByRole('button', { name: /Ignora finché cambia stato/ })).toBeNull();
  });
});
