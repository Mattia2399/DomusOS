import { describe, expect, it } from 'vitest';
import {
  APPLICATION_ROUTE_REGISTRY,
  resolveApplicationRoutePath,
  sanitizeSidebarQuickPaths,
} from './applicationRoutes';

describe('application route registry', () => {
  it('restores canonical paths while preserving safe presentation customizations', () => {
    expect(
      sanitizeSidebarQuickPaths([
        {
          id: 'home',
          label: 'La mia casa',
          path: 'https://example.com/phishing',
          icon: 'climate',
        },
      ]),
    ).toEqual([
      {
        id: 'home',
        label: 'La mia casa',
        path: '/home',
        icon: 'climate',
      },
    ]);
  });

  it('drops unknown and duplicate destinations', () => {
    expect(
      sanitizeSidebarQuickPaths([
        { id: 'home', label: 'Casa', path: '/admin', icon: 'home' },
        { id: 'home', label: 'Duplicata', path: '/security', icon: 'security' },
        { id: 'unknown', label: 'Esterna', path: 'javascript:alert(1)', icon: 'help' },
        { id: 'unknown-security', label: 'Protezione', path: '/security', icon: 'security' },
      ]),
    ).toEqual([
      { id: 'home', label: 'Casa', path: '/home', icon: 'home' },
      { id: 'security', label: 'Protezione', path: '/security', icon: 'security' },
    ]);
  });

  it('migrates the complete legacy preset to the current registry', () => {
    const legacy = [
      { id: 'dashboard', label: 'Dashboard', path: '/home', icon: 'dashboard' },
      { id: 'devices', label: 'Dispositivi', path: '/devices', icon: 'devices' },
      { id: 'rooms', label: 'Stanze', path: '/rooms', icon: 'rooms' },
      { id: 'automation', label: 'Automazioni', path: '/automations', icon: 'automation' },
      { id: 'security', label: 'Sicurezza', path: '/security', icon: 'security' },
      { id: 'help', label: 'Aiuto', path: '/help', icon: 'help' },
    ];

    expect(sanitizeSidebarQuickPaths(legacy)).toEqual(
      APPLICATION_ROUTE_REGISTRY.map((route) => ({ ...route })),
    );
  });

  it('allows only registered destinations at the navigation boundary', () => {
    expect(resolveApplicationRoutePath('bottom-home', '/home')).toBe('/home');
    expect(resolveApplicationRoutePath('home', '/rooms')).toBe('/rooms');
    expect(resolveApplicationRoutePath('home', 'https://example.com')).toBe('/home');
    expect(resolveApplicationRoutePath('custom', '/admin')).toBeNull();
    expect(resolveApplicationRoutePath('custom', 'https://example.com')).toBeNull();
    expect(resolveApplicationRoutePath('custom', 'javascript:alert(1)')).toBeNull();
  });
});
