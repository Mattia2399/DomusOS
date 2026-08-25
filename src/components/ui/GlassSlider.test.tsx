import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GlassSlider } from './GlassSlider';

describe('GlassSlider', () => {
  it('renders the shared glass track and calculates its progress', () => {
    const onChange = vi.fn();
    const { container, getByRole } = render(
      <GlassSlider min={0} max={200} value={50} aria-label="Volume" onChange={onChange} />,
    );

    expect(container.firstElementChild?.classList.contains('liquid-glass-control')).toBe(true);
    expect(container.querySelector('span')?.getAttribute('style')).toContain('width: 25%');

    const slider = getByRole('slider', { name: 'Volume' });
    fireEvent.change(slider, { target: { value: '75' } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('keeps custom card geometry in overlay mode', () => {
    const { container, getByRole } = render(
      <GlassSlider variant="overlay" min={0} max={100} value={40} className="custom-slider" aria-label="Posizione" readOnly />,
    );

    expect(container.children).toHaveLength(1);
    expect(getByRole('slider', { name: 'Posizione' }).classList.contains('custom-slider')).toBe(true);
  });
});
