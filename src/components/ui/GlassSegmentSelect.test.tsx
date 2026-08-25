import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GlassSegmentSelect } from './GlassSegmentSelect';

const options = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Chiaro' },
  { value: 'dark', label: 'Scuro' },
] as const;

afterEach(cleanup);

describe('GlassSegmentSelect', () => {
  it('exposes a labelled radio group and emits the selected value', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <GlassSegmentSelect ariaLabel="Tema" options={options} value="auto" onChange={onChange} />,
    );

    expect(getByRole('radiogroup', { name: 'Tema' })).toBeTruthy();
    expect(getByRole('radio', { name: 'Auto' }).getAttribute('aria-checked')).toBe('true');

    fireEvent.click(getByRole('radio', { name: 'Scuro' }));
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('supports arrow navigation and skips disabled options', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <GlassSegmentSelect
        ariaLabel="Tema"
        options={[options[0], { ...options[1], disabled: true }, options[2]]}
        value="auto"
        onChange={onChange}
      />,
    );

    fireEvent.keyDown(getByRole('radiogroup', { name: 'Tema' }), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('dark');
  });
});
