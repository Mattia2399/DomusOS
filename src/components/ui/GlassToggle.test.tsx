import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GlassToggle } from './GlassToggle';

describe('GlassToggle', () => {
  it('exposes switch semantics and emits the next checked value', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <GlassToggle checked={false} label="Modalità test" onChange={onChange} />,
    );

    const toggle = getByRole('switch', { name: 'Modalità test' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('blocks interaction while busy', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <GlassToggle checked label="Sincronizzazione" onChange={onChange} busy size="compact" />,
    );

    const toggle = getByRole('switch', { name: 'Sincronizzazione' });
    expect(toggle.hasAttribute('disabled')).toBe(true);
    expect(toggle.getAttribute('aria-busy')).toBe('true');

    fireEvent.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });
});
