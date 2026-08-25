// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardSidebarPlaceholder } from './DashboardSidebarPlaceholder';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('DashboardSidebarPlaceholder', () => {
  it('preserves the empty desktop context sidebar before its controls are requested', () => {
    render(<DashboardSidebarPlaceholder isCompactViewport={false} />);

    expect(screen.getByText('Nessuna card selezionata')).toBeVisible();
    expect(screen.getByText('Clicca una card per vedere le informazioni')).toBeVisible();
  });

  it('does not reserve sidebar space on compact viewports', () => {
    const { container } = render(
      <DashboardSidebarPlaceholder isCompactViewport />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('blocks compact controls immediately but delays the visible loader', () => {
    vi.useFakeTimers();
    render(<DashboardSidebarPlaceholder isCompactViewport loading />);

    expect(screen.queryByRole('status', { name: 'Apertura controlli…' })).not.toBeInTheDocument();
    expect(screen.getByTestId('deferred-glass-loader')).toHaveClass('pointer-events-auto');
    expect(screen.queryByText('Nessuna card selezionata')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole('status', { name: 'Apertura controlli…' })).toBeVisible();
  });
});
