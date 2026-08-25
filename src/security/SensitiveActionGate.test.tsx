import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DashboardSecurityProvider, createDashboardSecurityValue } from './dashboardAccess';
import { SensitiveActionGateProvider, useSensitiveActionGate } from './SensitiveActionGate';

function Probe() {
  const gate = useSensitiveActionGate();
  return (
    <button
      onClick={() => {
        void gate.authorize({
          action: 'reset_dashboard',
          capability: 'reset_dashboard',
          title: 'Reset test',
          description: 'Riepilogo distruttivo',
          confirmationPhrase: 'RESET',
        });
      }}
    >
      Avvia reset
    </button>
  );
}

describe('SensitiveActionGate destructive confirmation', () => {
  it('always displays the summary and requires the RESET phrase', async () => {
    const security = createDashboardSecurityValue({
      runtimeMode: 'real', haStatus: 'connected', user: { id: 'owner', isOwner: true },
    });
    render(
      <DashboardSecurityProvider value={security}>
        <SensitiveActionGateProvider user={{ id: 'owner' }}>
          <Probe />
        </SensitiveActionGateProvider>
      </DashboardSecurityProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Avvia reset' }));
    expect(await screen.findByText('Riepilogo distruttivo')).toBeTruthy();
    const confirm = screen.getByRole('button', { name: 'Conferma' }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'RESET' } });
    await waitFor(() => expect(confirm.disabled).toBe(false));
  });
});
