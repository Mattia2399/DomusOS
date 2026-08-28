import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DetailScaffold } from './shared';

afterEach(cleanup);

describe('Consumption detail scaffold', () => {
  it('uses the shared nested-page header and returns to the overview', () => {
    const onBack = vi.fn();

    render(
      <DetailScaffold
        title="Dettaglio Energia"
        onBack={onBack}
        left={<div>Flusso energia</div>}
        right={<div>Statistiche</div>}
      />,
    );

    expect(screen.getByTestId('nested-page-header')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Dettaglio Energia' })).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Torna a Consumi' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
