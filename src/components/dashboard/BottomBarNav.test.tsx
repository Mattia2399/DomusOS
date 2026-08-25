import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BottomBarNav } from './BottomBarNav';

describe('BottomBarNav', () => {
  afterEach(cleanup);

  it('uses the adaptive navigation material and exposes the active route', () => {
    window.history.replaceState({}, '', '/home');
    const onPathClick = vi.fn();
    const onPrefetchRoute = vi.fn();

    const { container } = render(
      <BottomBarNav
        isEditMode={false}
        quickPaths={[]}
        onPathClick={onPathClick}
        onOpenSettings={vi.fn()}
        onPrefetchRoute={onPrefetchRoute}
      />,
    );

    expect(container.querySelector('nav.liquid-glass-navigation')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Apri Dashboard' }).getAttribute('aria-current')).toBe('page');

    const roomsButton = screen.getByRole('button', { name: 'Apri Stanze' });
    fireEvent.pointerEnter(roomsButton);
    expect(onPrefetchRoute).toHaveBeenCalledWith('/rooms');

    fireEvent.click(roomsButton);
    expect(onPathClick).toHaveBeenCalledWith(expect.objectContaining({ path: '/rooms' }));
  });

  it('uses the internal route when the dashboard runs inside the Home Assistant iframe', () => {
    window.history.replaceState({}, '', '/local/ha-dashboard-builder/index.html?dashboard_mode=embedded');

    render(
      <BottomBarNav
        isEditMode={false}
        quickPaths={[]}
        activeRoute="/rooms"
        onPathClick={vi.fn()}
        onOpenSettings={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Apri Stanze' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Apri Dashboard' }).getAttribute('aria-current')).toBeNull();
  });

  it('exposes Settings as the active destination', () => {
    render(
      <BottomBarNav
        isEditMode={false}
        quickPaths={[]}
        activeRoute="/settings"
        isSettingsActive
        onPathClick={vi.fn()}
        onOpenSettings={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Apri impostazioni' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Apri Dashboard' }).getAttribute('aria-current')).toBeNull();
  });
});
