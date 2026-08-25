import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeferredGlassLoader from './DeferredGlassLoader';

describe('DeferredGlassLoader', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('keeps short waits visually silent', () => {
    vi.useFakeTimers();
    render(<DeferredGlassLoader label="Apertura sezione…" delayMs={200} />);

    expect(screen.queryByText('Apertura sezione…')).toBeNull();
    expect(screen.getByTestId('deferred-glass-loader').dataset.visible).toBe('false');

    act(() => vi.advanceTimersByTime(199));
    expect(screen.queryByText('Apertura sezione…')).toBeNull();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText('Apertura sezione…')).toBeTruthy();
  });

  it('blocks a sensitive overlay immediately without showing a premature spinner', () => {
    vi.useFakeTimers();
    render(<DeferredGlassLoader label="Preparazione verifica…" overlay />);

    const fallback = screen.getByTestId('deferred-glass-loader');
    expect(fallback.className).toContain('pointer-events-auto');
    expect(fallback.className).toContain('bg-transparent');
    expect(screen.queryByText('Preparazione verifica…')).toBeNull();
  });
});
