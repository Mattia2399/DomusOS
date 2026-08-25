import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NestedPageHeader from './NestedPageHeader';

afterEach(cleanup);

describe('NestedPageHeader', () => {
  it('keeps back, title and subtitle in the same navigation row', () => {
    const onBack = vi.fn();
    render(
      <div data-testid="scroll-parent">
        <NestedPageHeader
          title="Entità"
          subtitle="Consulta e filtra le entità"
          backLabel="Impostazioni"
          onBack={onBack}
        />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Indietro' }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Entità' })).toBeTruthy();
    expect(screen.getByText('Consulta e filtra le entità')).toBeTruthy();
  });

  it('moves focus to the new page title without scrolling', () => {
    render(<NestedPageHeader title="Entità" onBack={vi.fn()} />);

    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Entità' }));
  });

  it('can preserve the current focus when requested', () => {
    const existingControl = document.createElement('button');
    existingControl.textContent = 'Origine';
    document.body.appendChild(existingControl);
    existingControl.focus();

    render(<NestedPageHeader title="Entità" onBack={vi.fn()} focusOnMount={false} />);

    expect(document.activeElement).toBe(existingControl);
    existingControl.remove();
  });

  it('reveals the glass material progressively while its parent scrolls', () => {
    render(
      <div data-testid="scroll-parent">
        <NestedPageHeader title="Sicurezza" onBack={vi.fn()} />
      </div>,
    );

    const parent = screen.getByTestId('scroll-parent');
    const header = screen.getByTestId('nested-page-header');
    parent.scrollTop = 24;
    fireEvent.scroll(parent);
    expect(header.getAttribute('data-glass-progress')).toBe('0.50');

    parent.scrollTop = 48;
    fireEvent.scroll(parent);
    expect(header.getAttribute('data-glass-progress')).toBe('1.00');
  });
});
