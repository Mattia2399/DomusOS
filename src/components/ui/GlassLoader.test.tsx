import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GlassLoader } from './GlassLoader';

describe('GlassLoader', () => {
  it('exposes a meaningful loading status and its copy', () => {
    render(<GlassLoader size="lg" label="Carico stanze" description="Sincronizzo aree e dispositivi" />);

    const status = screen.getByRole('status', { name: 'Carico stanze' });
    expect(status.getAttribute('data-size')).toBe('lg');
    expect(screen.getByText('Sincronizzo aree e dispositivi')).toBeTruthy();
  });

  it('uses a distinct gradient reference for every instance', () => {
    const { container } = render(
      <>
        <GlassLoader ariaLabel="Primo caricamento" />
        <GlassLoader ariaLabel="Secondo caricamento" />
      </>,
    );

    const gradients = Array.from(container.querySelectorAll('linearGradient')).map((gradient) => gradient.id);
    expect(new Set(gradients).size).toBe(2);
  });
});
