import { describe, expect, it } from 'vitest';
import {
  isAppGalleryNavigationTarget,
  isAutomationNavigationTarget,
  isConsumptionDetailNavigationTarget,
  isConsumptionNavigationTarget,
  isHomeNavigationTarget,
  isNestedDashboardNavigationTarget,
  isProfileNavigationTarget,
  isRoomsNavigationTarget,
  isSecurityCamerasNavigationTarget,
  isSecurityNavigationTarget,
  isSettingsNavigationTarget,
  normalizeNavigationPathname,
} from './mainBoardNavigation';

describe('mainBoardNavigation', () => {
  it('recognizes path, hash and view navigation aliases', () => {
    expect(isHomeNavigationTarget('/home')).toBe(true);
    expect(isRoomsNavigationTarget('/#rooms')).toBe(true);
    expect(isAutomationNavigationTarget('/?view=automation')).toBe(true);
    expect(isAppGalleryNavigationTarget('/appgalley')).toBe(true);
    expect(isProfileNavigationTarget('/profilo')).toBe(true);
    expect(isSettingsNavigationTarget('/?view=impostazioni')).toBe(true);
  });

  it('keeps security and camera detail routes distinct', () => {
    expect(isSecurityNavigationTarget('/security/cameras')).toBe(true);
    expect(isSecurityNavigationTarget('/settings/security')).toBe(false);
    expect(isSettingsNavigationTarget('/settings/security')).toBe(true);
    expect(isSecurityCamerasNavigationTarget('/security/cameras')).toBe(true);
    expect(isSecurityCamerasNavigationTarget('/security')).toBe(false);
    expect(isSecurityCamerasNavigationTarget('/#security/telecamere')).toBe(true);
  });

  it('keeps consumption overview and detail routes compatible', () => {
    expect(isConsumptionNavigationTarget('/consumi/energia')).toBe(true);
    expect(isConsumptionDetailNavigationTarget('/consumi/energia')).toBe(true);
    expect(isConsumptionDetailNavigationTarget('/consumi')).toBe(false);
    expect(isConsumptionDetailNavigationTarget('/?view=consumi-water')).toBe(true);
  });

  it('normalizes local and absolute paths without accepting malformed values', () => {
    expect(normalizeNavigationPathname('/Rooms/')).toBe('/rooms');
    expect(normalizeNavigationPathname('https://example.test/Home/')).toBe('/home');
    expect(normalizeNavigationPathname('')).toBe('');
  });

  it('distinguishes main destinations from nested dashboard pages', () => {
    expect(isNestedDashboardNavigationTarget('/settings')).toBe(false);
    expect(isNestedDashboardNavigationTarget('/rooms/')).toBe(false);
    expect(isNestedDashboardNavigationTarget('/settings/entities')).toBe(true);
    expect(isNestedDashboardNavigationTarget('/profile/appearance')).toBe(true);
    expect(isNestedDashboardNavigationTarget('/rooms/living-room')).toBe(true);
    expect(isNestedDashboardNavigationTarget('/security/cameras')).toBe(true);
    expect(isNestedDashboardNavigationTarget('/appgallery/irrigation')).toBe(true);
    expect(isNestedDashboardNavigationTarget('/appgallery')).toBe(false);
  });

  it('recognizes nested routes in embedded and query-based navigation', () => {
    expect(isNestedDashboardNavigationTarget('/panel_iframe/domusos#/settings/entities')).toBe(
      true,
    );
    expect(isNestedDashboardNavigationTarget('/?view=settings-entities')).toBe(true);
    expect(isNestedDashboardNavigationTarget('/?view=settings')).toBe(false);
  });
});
