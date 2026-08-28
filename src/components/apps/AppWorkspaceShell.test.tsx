import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Gauge, LayoutDashboard, Settings2 } from 'lucide-react';
import AppWorkspaceShell from './AppWorkspaceShell';

afterEach(() => cleanup());

const navigationItems = [
  { id: 'overview', label: 'Panoramica', icon: LayoutDashboard },
  { id: 'usage', label: 'Consumi', icon: Gauge },
  { id: 'configuration', label: 'Configura', icon: Settings2, placement: 'footer' as const, mobileHidden: true },
];

describe('AppWorkspaceShell', () => {
  it('exposes contextual navigation and a route back to DomusOS', () => {
    const onBack = vi.fn();
    const onNavigationChange = vi.fn();

    render(
      <AppWorkspaceShell
        appName="Irrigazione Smart"
        appSubtitle="Giardino e zone"
        appIcon={LayoutDashboard}
        navigationItems={navigationItems}
        activeNavigationId="overview"
        onNavigationChange={onNavigationChange}
        onBack={onBack}
      >
        <p>Contenuto applicazione</p>
      </AppWorkspaceShell>,
    );

    expect(screen.getByTestId('app-workspace-shell')).toBeTruthy();
    expect(screen.getByText('Contenuto applicazione')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Panoramica' })[0]?.getAttribute('aria-current')).toBe('page');

    fireEvent.click(screen.getAllByRole('button', { name: 'Consumi' })[0]);
    expect(onNavigationChange).toHaveBeenCalledWith('usage');

    fireEvent.click(screen.getAllByRole('button', { name: 'Configura' })[0]);
    expect(onNavigationChange).toHaveBeenCalledWith('configuration');

    fireEvent.click(screen.getAllByRole('button', { name: 'Torna a DomusOS' })[0]);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('moves the mobile exit into the contextual navigation when the app owns its header', () => {
    const onBack = vi.fn();
    render(
      <AppWorkspaceShell
        appName="Irrigazione Smart"
        appIcon={LayoutDashboard}
        navigationItems={navigationItems}
        activeNavigationId="overview"
        onNavigationChange={vi.fn()}
        onBack={onBack}
        mobileHeaderHidden
        mobileBackInNavigation
        backLabel="Torna alla libreria"
      >
        <p>Giardino intelligente</p>
      </AppWorkspaceShell>,
    );

    expect(screen.getByTestId('app-workspace-shell').querySelector('header')).toBeNull();
    const mobileNavigation = screen.getAllByRole('navigation', { name: 'Navigazione Irrigazione Smart' }).at(-1);
    expect(mobileNavigation?.textContent).toContain('Libreria');
    expect(mobileNavigation?.textContent).not.toContain('Configura');
    fireEvent.click(screen.getAllByRole('button', { name: 'Torna alla libreria' }).at(-1)!);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
