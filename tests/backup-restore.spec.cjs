const { test, expect } = require('@playwright/test');

const SETUP_JOURNEY_KEY = 'ha.dashboard.setupJourney.v2';
const RUNTIME_MODE_KEY = 'ha.dashboard.runtimeMode.v1';
const DEMO_MARKER_KEY = 'ha.dashboard.demo.e2e.backup-marker';
const DEMO_STALE_KEY = 'ha.dashboard.demo.e2e.stale';
const WIDGET_SECRETS_KEY = 'ha.dashboard.secrets.widgetCodes.v2';

function installCompletedDemo(page) {
  return page.addInitScript(({ journeyKey, runtimeKey }) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem(journeyKey, JSON.stringify({
      version: 2,
      phase: 'done',
      mode: 'demo',
      updatedAt: Date.now(),
    }));
    localStorage.setItem(runtimeKey, 'demo');
    localStorage.setItem('ha.dashboard.onboarding.welcome.v1', 'done');
    localStorage.setItem('ha.dashboard.onboarding.context.v1', 'done');
  }, {
    journeyKey: SETUP_JOURNEY_KEY,
    runtimeKey: RUNTIME_MODE_KEY,
  });
}

test('backup moves a Demo workspace between isolated browsers without exporting secrets', async ({ browser, page }) => {
  await installCompletedDemo(page);
  await page.goto('/home');
  const origin = new URL(page.url()).origin;

  await page.evaluate(({ markerKey, secretsKey }) => {
    localStorage.setItem(markerKey, 'layout-from-browser-a');
    localStorage.setItem(
      secretsKey,
      JSON.stringify({ widgets: { alarm: { haCode: '1234', localCode: '5678' } } }),
    );
    localStorage.setItem('hass_auth_tokens', JSON.stringify({
      access_token: 'oauth-access-secret',
      refresh_token: 'oauth-refresh-secret',
    }));
  }, {
    markerKey: DEMO_MARKER_KEY,
    secretsKey: WIDGET_SECRETS_KEY,
  });

  const backupText = await page.evaluate(async () => {
    const backupService = await import('/src/services/configBackup.ts');
    return backupService.serializeDashboardBackup(
      backupService.createDashboardBackupPayload(localStorage, 'demo'),
    );
  });
  const backup = JSON.parse(backupText);

  expect(backup.scope).toBe('demo');
  expect(backup.entries[DEMO_MARKER_KEY]).toBe('layout-from-browser-a');
  expect(backupText).not.toContain('1234');
  expect(backupText).not.toContain('5678');
  expect(backupText).not.toContain('oauth-access-secret');
  expect(backupText).not.toContain('oauth-refresh-secret');

  const targetContext = await browser.newContext();
  const targetPage = await targetContext.newPage();
  await installCompletedDemo(targetPage);
  await targetPage.goto(`${origin}/home`);
  await targetPage.evaluate(({ staleKey }) => {
    localStorage.setItem(staleKey, 'remove-me');
    localStorage.setItem('third.party.keep', 'untouched');
  }, { staleKey: DEMO_STALE_KEY });

  const restoredCount = await targetPage.evaluate(async (serializedBackup) => {
    const backupService = await import('/src/services/configBackup.ts');
    const payload = backupService.parseDashboardBackup(serializedBackup);
    return backupService.restoreDashboardBackup(payload, localStorage, 'demo');
  }, backupText);
  expect(restoredCount).toBeGreaterThan(0);

  const restoredStorage = await targetPage.evaluate(({ markerKey, staleKey, secretsKey }) => ({
    marker: localStorage.getItem(markerKey),
    stale: localStorage.getItem(staleKey),
    unrelated: localStorage.getItem('third.party.keep'),
    secrets: localStorage.getItem(secretsKey),
    oauth: localStorage.getItem('hass_auth_tokens'),
    runtimeMode: localStorage.getItem('ha.dashboard.runtimeMode.v1'),
  }), {
    markerKey: DEMO_MARKER_KEY,
    staleKey: DEMO_STALE_KEY,
    secretsKey: WIDGET_SECRETS_KEY,
  });

  expect(restoredStorage).toEqual({
    marker: 'layout-from-browser-a',
    stale: null,
    unrelated: 'untouched',
    secrets: null,
    oauth: null,
    runtimeMode: 'demo',
  });

  await targetContext.close();
});
