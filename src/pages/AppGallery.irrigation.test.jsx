import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppGallery } from './AppGallery';
import { HA_APP_CONFIGURATIONS_KEY } from '../services/haAppConfigurationsRepository';

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/appgallery/irrigation');
});

afterEach(() => cleanup());

describe('Irrigation App Library configuration', () => {
  it('shows the house configuration only to authorized editors and confirms it through HA', async () => {
    let stored = null;
    const onCallApi = vi.fn(async (message) => {
      if (message.type === 'frontend/get_system_data') return { value: stored };
      if (message.type === 'frontend/set_system_data') {
        stored = message.value;
        return null;
      }
      return null;
    });
    const onNotify = vi.fn();

    render(
      <AppGallery
        suppressBrowserNavigation
        navigationRoute="/appgallery/irrigation"
        canConfigureApps
        currentUserId="owner-1"
        haConnected
        haEntityIds={[
          'binary_sensor.rain_sensor',
          'weather.home',
          'sensor.soil_moisture',
          'switch.irrigation_north_lawn',
        ]}
        onCallApi={onCallApi}
        onNotify={onNotify}
      />,
    );

    await waitFor(() => expect(onCallApi).toHaveBeenCalledWith(
      { type: 'frontend/get_system_data', key: HA_APP_CONFIGURATIONS_KEY },
      { reportError: false, throwOnError: true },
    ));
    fireEvent.click(screen.getAllByRole('button', { name: 'Zone', exact: true })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Gestisci zone irrigazione' }));
    expect(screen.getByRole('heading', { name: 'Gestisci zone' })).toBeTruthy();
    expect(screen.getAllByRole('navigation', { name: 'Navigazione Irrigazione Smart' })).toHaveLength(1);

    fireEvent.change(screen.getAllByLabelText('Nome')[0], { target: { value: 'Prato condiviso' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Panoramica' })[0]);
    expect(screen.queryByText('Prato condiviso')).toBeNull();
    expect(screen.getAllByText('Prato Nord').length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Zone', exact: true })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Gestisci zone irrigazione' }));

    fireEvent.click(screen.getAllByRole('button', { name: 'Salva zone' })[0]);
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith(
      'success',
      'Configurazione irrigazione salvata per tutta la casa.',
    ));
    expect(stored).toMatchObject({
      schema: 'domusos-app-configurations',
      revision: 1,
      updatedByUserId: 'owner-1',
      apps: { irrigation: expect.any(Object) },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Panoramica' })[0]);
    expect(screen.getAllByText('Prato condiviso').length).toBeGreaterThan(0);
  });

  it('does not expose configuration navigation to a limited user', () => {
    render(
      <AppGallery
        suppressBrowserNavigation
        navigationRoute="/appgallery/irrigation"
        canConfigureApps={false}
        currentUserId="limited-1"
        haConnected={false}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Impostazioni' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Gestisci zone irrigazione' })).toBeNull();
  });

  it('resolves irrigation nested routes and keeps protected settings fail-closed', () => {
    const { rerender } = render(
      <AppGallery
        suppressBrowserNavigation
        navigationRoute="/appgallery/irrigation/calendar"
        canConfigureApps
        currentUserId="owner-1"
        haConnected={false}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Calendario irrigazione' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Calendario' }).some((button) => button.getAttribute('aria-current') === 'page')).toBe(true);

    rerender(
      <AppGallery
        suppressBrowserNavigation
        navigationRoute="/appgallery/irrigation/zones/manage"
        canConfigureApps
        currentUserId="owner-1"
        haConnected={false}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Gestisci zone' })).toBeTruthy();

    rerender(
      <AppGallery
        suppressBrowserNavigation
        navigationRoute="/appgallery/irrigation/settings"
        canConfigureApps={false}
        currentUserId="limited-1"
        haConnected={false}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Il giardino è pronto' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Impostazioni irrigazione' })).toBeNull();
  });

  it('loads real Home Assistant history only when the consumption route is opened', async () => {
    const onCallApi = vi.fn(async (message) => {
      if (message.type === 'frontend/get_system_data') return null;
      if (message.type === 'history/history_during_period') {
        return [[
          { entity_id: 'sensor.irrigation_water_usage_l', state: '100', last_changed: '2026-08-20T08:00:00Z' },
          { entity_id: 'sensor.irrigation_water_usage_l', state: '125', last_changed: '2026-08-21T08:00:00Z' },
        ]];
      }
      return null;
    });

    render(
      <AppGallery
        suppressBrowserNavigation
        navigationRoute="/appgallery/irrigation/consumption"
        runtimeMode="real"
        canConfigureApps
        currentUserId="owner-1"
        haConnected
        haStates={{
          'sensor.irrigation_water_usage_l': {
            state: '125',
            rawAttributes: { unit_of_measurement: 'L', state_class: 'total_increasing' },
          },
        }}
        haEntityIds={['sensor.irrigation_water_usage_l']}
        onCallApi={onCallApi}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Consumi irrigazione' })).toBeTruthy();
    await waitFor(() => expect(onCallApi).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'history/history_during_period',
        entity_ids: ['sensor.irrigation_water_usage_l'],
      }),
      { reportError: false },
    ));
    await waitFor(() => expect(screen.getByLabelText('Grafico consumi irrigazione')).toBeTruthy());
    expect(screen.getByText('Storico Home Assistant')).toBeTruthy();
  });

  it('caches each consumption period and reuses it when the user goes back', async () => {
    const onCallApi = vi.fn(async (message) => {
      if (message.type === 'frontend/get_system_data') return null;
      if (message.type === 'history/history_during_period') {
        return {
          'sensor.irrigation_water_usage_l': [
            { s: '100', lu: 1787817600 },
            { s: '140', lu: 1787821200 },
          ],
        };
      }
      return null;
    });

    render(
      <AppGallery
        suppressBrowserNavigation
        navigationRoute="/appgallery/irrigation/consumption"
        runtimeMode="real"
        canConfigureApps
        currentUserId="owner-1"
        haConnected
        haStates={{
          'sensor.irrigation_water_usage_l': {
            state: '140',
            rawAttributes: { unit_of_measurement: 'L', state_class: 'total_increasing' },
          },
        }}
        haEntityIds={['sensor.irrigation_water_usage_l']}
        onCallApi={onCallApi}
      />,
    );

    await waitFor(() => expect(screen.getByLabelText('Grafico consumi irrigazione')).toBeTruthy());
    fireEvent.click(screen.getByRole('radio', { name: '30 giorni' }));
    await waitFor(() => expect(onCallApi.mock.calls.filter(([message]) => message.type === 'history/history_during_period')).toHaveLength(2));
    await waitFor(() => expect(screen.getByLabelText('Grafico consumi irrigazione')).toBeTruthy());

    fireEvent.click(screen.getByRole('radio', { name: '7 giorni' }));
    await waitFor(() => expect(screen.getByRole('radio', { name: '7 giorni' }).getAttribute('aria-checked')).toBe('true'));
    expect(onCallApi.mock.calls.filter(([message]) => message.type === 'history/history_during_period')).toHaveLength(2);
  });
});
