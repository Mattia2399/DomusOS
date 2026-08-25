import { beforeEach, describe, expect, it } from 'vitest';
import {
  isDemoRouteAllowed,
  readSetupJourney,
  saveSetupJourney,
  SETUP_JOURNEY_STORAGE_KEY,
} from './setupJourney';

describe('setup journey', () => {
  beforeEach(() => window.localStorage.clear());

  it('starts a fresh installation from the welcome experience', () => {
    expect(readSetupJourney(window.localStorage)).toMatchObject({ phase: 'welcome', mode: null });
  });

  it('migrates an existing real installation without replaying onboarding', () => {
    window.localStorage.setItem('hass_auth_tokens', '{}');
    expect(readSetupJourney(window.localStorage)).toMatchObject({ phase: 'done', mode: 'real' });
    expect(window.localStorage.getItem(SETUP_JOURNEY_STORAGE_KEY)).not.toBeNull();
  });

  it('always starts a first embedded installation from the welcome screen even when HA tokens are visible', () => {
    window.localStorage.setItem('hass_auth_tokens', '{}');

    expect(readSetupJourney(window.localStorage, { embedded: true })).toMatchObject({
      phase: 'welcome',
      mode: null,
    });
    expect(window.localStorage.getItem(SETUP_JOURNEY_STORAGE_KEY)).toBeNull();
  });

  it('migrates the old automatic panel detection state back to the mandatory welcome screen', () => {
    window.localStorage.setItem(
      SETUP_JOURNEY_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        phase: 'detected',
        mode: 'real',
        connectionMethod: 'panel',
        updatedAt: Date.now(),
      }),
    );

    expect(readSetupJourney(window.localStorage, { embedded: true })).toMatchObject({
      phase: 'welcome',
      mode: null,
    });
  });

  it('does not replay onboarding for an embedded installation with an existing real layout', () => {
    window.localStorage.setItem('ha.dashboard.builder.layout.v1', '{"version":13}');

    expect(readSetupJourney(window.localStorage, { embedded: true })).toMatchObject({
      phase: 'done',
      mode: 'real',
      connectionMethod: 'panel',
    });
  });

  it('adds the panel transport to an existing embedded setup without replaying it', () => {
    window.localStorage.setItem(
      SETUP_JOURNEY_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        phase: 'done',
        mode: 'real',
        updatedAt: Date.now(),
      }),
    );

    expect(readSetupJourney(window.localStorage, { embedded: true })).toMatchObject({
      phase: 'done',
      connectionMethod: 'panel',
    });
  });

  it('restores the selected setup transport across refreshes', () => {
    saveSetupJourney(
      {
        phase: 'scan',
        mode: 'real',
        hassUrl: 'https://ha.example.test',
        connectionMethod: 'panel',
      },
      window.localStorage,
    );

    expect(readSetupJourney(window.localStorage, { embedded: true })).toMatchObject({
      phase: 'scan',
      connectionMethod: 'panel',
      hassUrl: 'https://ha.example.test',
    });
  });

  it('keeps Demo navigation limited to Home and Rooms', () => {
    expect(isDemoRouteAllowed('/home')).toBe(true);
    expect(isDemoRouteAllowed('/rooms/kitchen')).toBe(true);
    expect(isDemoRouteAllowed('/security')).toBe(false);
    expect(isDemoRouteAllowed('/settings')).toBe(false);
  });

  it('persists runtime mode with the journey', () => {
    saveSetupJourney({ phase: 'done', mode: 'demo' }, window.localStorage);
    expect(window.localStorage.getItem('ha.dashboard.runtimeMode.v1')).toBe('demo');
  });
});
