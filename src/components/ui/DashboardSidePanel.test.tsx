import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DashboardSidePanel from './DashboardSidePanel';

afterEach(cleanup);

describe('DashboardSidePanel', () => {
  it('provides the shared accessible shell and closes from its header', () => {
    const onClose = vi.fn();

    render(
      <DashboardSidePanel
        isOpen
        onClose={onClose}
        eyebrow="Centro"
        title="Attenzione"
        description="Due elementi"
      >
        <p>Contenuto pannello</p>
      </DashboardSidePanel>,
    );

    expect(screen.getByRole('dialog', { name: 'Attenzione' })).toBeTruthy();
    expect(screen.getByText('Contenuto pannello')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Chiudi pannello' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
