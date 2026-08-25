// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SetupJourney } from '../../services/setupJourney';
import { OnboardingExperience } from './OnboardingExperience';

const panelCallApi = vi.fn(async () => null);
const panelConnect = vi.fn(async () => undefined);
const panelDisconnect = vi.fn();

vi.mock('../../hooks/useHaLiveConnection', () => ({
  useHaLiveConnection: () => ({
    status: 'disconnected',
    error: null,
    haStates: {},
    haAreas: [],
    connect: vi.fn(async () => undefined),
    disconnect: vi.fn(),
    callApi: vi.fn(async () => null),
  }),
}));

vi.mock('../../hooks/useHaPanelBridgeConnection', () => ({
  useHaPanelBridgeConnection: () => ({
    isManagedByParent: true,
    hassUrl: 'https://ha.example.test',
    status: 'connected',
    error: null,
    haStates: {
      'light.kitchen': { state: 'on', attributes: {} },
      'lock.front_door': { state: 'locked', attributes: {} },
    },
    haAreas: [{ area_id: 'kitchen', name: 'Cucina' }],
    connect: panelConnect,
    disconnect: panelDisconnect,
    callApi: panelCallApi,
  }),
}));

describe('OnboardingExperience panel discovery', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows discovery before confirmation and continues with the panel transport', async () => {
    const onJourneyChange = vi.fn();
    const journey: SetupJourney = {
      version: 2,
      phase: 'discover',
      mode: 'real',
      connectionMethod: 'panel',
      updatedAt: Date.now(),
    };

    render(
      <MemoryRouter initialEntries={['/setup']}>
        <OnboardingExperience journey={journey} onJourneyChange={onJourneyChange} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Cerchiamo la tua casa' })).toBeTruthy();
    expect(screen.getByRole('status', { name: 'Rilevamento della casa' })).toBeTruthy();
    await waitFor(
      () => expect(screen.getByRole('heading', { name: 'Abbiamo trovato la tua casa' })).toBeTruthy(),
      { timeout: 2_000 },
    );
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Usa questa casa/ }));

    expect(onJourneyChange).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'scan',
        mode: 'real',
        hassUrl: 'https://ha.example.test',
        connectionMethod: 'panel',
      }),
    );
  });
});
