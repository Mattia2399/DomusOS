import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FeatureAvailabilityPage from './FeatureAvailabilityPage';

afterEach(() => cleanup());

describe('FeatureAvailabilityPage', () => {
  it('uses the shared nested-page header for secondary destinations', () => {
    const onBack = vi.fn();

    render(
      <FeatureAvailabilityPage
        nested
        title="Locale Tecnico"
        description="Pompe di calore e stato rete"
        backLabel="App Library"
        onBack={onBack}
      />,
    );

    const header = screen.getByTestId('nested-page-header');
    expect(header).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Locale Tecnico', level: 1 })).toBeTruthy();
    expect(within(header).getByText('Pompe di calore e stato rete')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Indietro' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
