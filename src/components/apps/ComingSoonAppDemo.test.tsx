import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ComingSoonAppDemo from './ComingSoonAppDemo';

afterEach(() => cleanup());

describe('ComingSoonAppDemo', () => {
  it.each([
    ['pool', 'Acqua pronta, sempre', 'pool-spa-preview'],
    ['technical', 'L’energia lavora per te', 'technical-room-preview'],
  ] as const)('renders the %s preview as an explicit non-interactive demo', (variant, headline, assetName) => {
    const { container } = render(<ComingSoonAppDemo variant={variant} />);

    expect(screen.getByRole('heading', { name: headline })).toBeTruthy();
    expect(screen.getAllByText('Demo').length).toBeGreaterThan(0);
    expect(screen.getByText('Disponibile prossimamente')).toBeTruthy();
    expect(screen.getByText(/Valori e controlli non sono collegati a Home Assistant/)).toBeTruthy();
    expect(container.querySelector('img')?.getAttribute('src')).toContain(assetName);
  });
});
