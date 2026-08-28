const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/home');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
});

test('fresh users can enter the isolated Demo and only open Home or Rooms', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Tutta la casa\.\s*Un solo gesto\./ })).toBeVisible();
  await page.getByRole('button', { name: 'Inizia ora' }).click();
  await expect(page.getByRole('heading', { name: 'Come vuoi iniziare?' })).toBeVisible();
  await page.getByRole('button', { name: /Esplora la Demo/ }).click();

  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('ha.dashboard.runtimeMode.v1'))).toBe('demo');
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('button', { name: /Demo · Collega la tua casa/i })).toBeVisible();

  await page.goto('/rooms');
  await expect(page).toHaveURL(/\/rooms$/);
  await page.goto('/security');
  await expect(page.getByRole('heading', { name: 'Questa sezione richiede una casa collegata' })).toBeVisible();
  await expect(page.getByText('Nella Demo puoi esplorare Home e Stanze.', { exact: false })).toBeVisible();
});

test('configuration path searches automatically before exposing OAuth setup', async ({ page }) => {
  await page.getByRole('button', { name: 'Inizia ora' }).click();
  await page.getByRole('button', { name: /Collega la tua casa/ }).click();
  await expect(page.getByRole('heading', { name: 'Cerchiamo la tua casa' })).toBeVisible();
  await expect(page.getByLabel('Rilevamento della casa')).toBeVisible();
  await expect(page).toHaveURL(/\/setup$/);
  await expect(page.getByRole('heading', { name: 'Collega Home Assistant' })).toBeVisible();
  await expect(page.getByPlaceholder('http://homeassistant.local:8123')).toBeVisible();
});

test('a first panel installation confirms the detected home and still completes setup steps', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = '<iframe title="Home Assistant panel" src="/local/dashboard/index.html" style="width:100vw;height:100vh;border:0"></iframe>';
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin || !event.source || !event.data) return;
      if (event.data.type === 'ha-panel-ready' || event.data.type === 'ha-panel-request-sync') {
        event.source.postMessage({
          type: 'ha-panel-context',
          hassUrl: 'http://homeassistant.local:8123',
        }, window.location.origin);
        event.source.postMessage({
          type: 'ha-panel-snapshot',
          hassUrl: 'http://homeassistant.local:8123',
          states: {
            'light.kitchen': {
              entity_id: 'light.kitchen',
              state: 'on',
              attributes: { friendly_name: 'Cucina' },
              last_changed: new Date().toISOString(),
              last_updated: new Date().toISOString(),
            },
          },
          areas: [{ area_id: 'kitchen', name: 'Cucina' }],
        }, window.location.origin);
        return;
      }
      if (event.data.type !== 'ha-panel-call-api') return;
      const type = event.data.message?.type;
      const result =
        type === 'frontend/get_system_data'
          ? { value: null }
          : type === 'auth/current_user'
          ? { name: 'Mattia', is_owner: true, is_admin: true }
          : type?.includes('entity_registry')
            ? { entities: [{ entity_id: 'light.kitchen' }] }
            : type?.includes('device_registry')
              ? { devices: [{ id: 'device-kitchen' }] }
              : type === 'config/area_registry/list'
                ? [{ area_id: 'kitchen', name: 'Cucina' }]
                : [];
      event.source.postMessage({
        type: 'ha-panel-call-api-result',
        requestId: event.data.requestId,
        ok: true,
        result,
      }, window.location.origin);
    });
  });

  const panel = page.frameLocator('iframe[title="Home Assistant panel"]');
  await expect(panel.getByRole('heading', { name: /Tutta la casa\.\s*Un solo gesto\./ })).toBeVisible();
  await panel.getByRole('button', { name: 'Inizia ora' }).click();
  await expect(panel.getByRole('heading', { name: 'Come vuoi iniziare?' })).toBeVisible();
  await panel.getByRole('button', { name: /Collega la tua casa/ }).click();
  await expect(panel.getByRole('heading', { name: 'Cerchiamo la tua casa' })).toBeVisible();
  await expect(panel.getByLabel('Rilevamento della casa')).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Abbiamo trovato la tua casa' })).toBeVisible();
  await expect(page.locator('iframe[title="Home Assistant panel"]')).toHaveAttribute('src', '/local/dashboard/index.html');
  await expect(panel.getByText('Casa collegata tramite pannello')).toBeVisible();
  await panel.getByRole('button', { name: /Usa questa casa/ }).click();

  await expect(panel.getByRole('heading', { name: /Casa trovata, Mattia/ })).toBeVisible();
  expect(page.frames().find((frame) => frame !== page.mainFrame())?.url()).toContain('/local/dashboard/index.html');
  await panel.getByRole('button', { name: 'Continua' }).click();
  await expect(panel.getByRole('heading', { name: 'Scegli il punto di partenza' })).toBeVisible();
  expect(page.frames().find((frame) => frame !== page.mainFrame())?.url()).toContain('/local/dashboard/index.html');
  await panel.getByRole('button', { name: 'Continua' }).click();
  await expect(panel.getByRole('heading', { name: 'Organizza la tua casa' })).toBeVisible();
  await expect(panel.getByText('Nessun piano configurato. Puoi crearne uno ora.')).toBeVisible();
  await expect(panel.getByText(/non ha restituito tutti i registri necessari/i)).toHaveCount(0);
});

test('a completed installation uses a focused reconnect screen without first-run steps', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('ha.dashboard.runtimeMode.v1', 'real');
    localStorage.setItem('ha.dashboard.setupJourney.v2', JSON.stringify({
      version: 2,
      phase: 'done',
      mode: 'real',
      hassUrl: 'http://homeassistant.local:8123',
      updatedAt: Date.now(),
    }));
  });

  await page.goto('/setup?reconnect=1');
  await expect(page.getByRole('heading', { name: 'Riconnetti Home Assistant' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accedi di nuovo' })).toBeVisible();
  await expect(page.locator('.onboarding-step-rail')).toHaveCount(0);
  await expect(page.getByText('Organizza', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Analisi', { exact: true })).toHaveCount(0);
});

test('first configuration returns from OAuth to the setup analysis instead of Home', async ({ page }) => {
  let oauthReturnTo = null;
  await page.route('**/auth/authorize**', async (route) => {
    const rawState = new URL(route.request().url()).searchParams.get('state');
    oauthReturnTo = rawState ? JSON.parse(rawState).returnTo : null;
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>OAuth mock</title>' });
  });
  await page.getByRole('button', { name: 'Inizia ora' }).click();
  await page.getByRole('button', { name: /Collega la tua casa/ }).click();
  await expect(page.getByRole('heading', { name: 'Collega Home Assistant' })).toBeVisible();
  await page.getByPlaceholder('http://homeassistant.local:8123').fill('http://homeassistant.local:8123');
  await page.getByRole('button', { name: 'Continua su Home Assistant' }).click({ noWaitAfter: true });

  await expect.poll(() => oauthReturnTo).toBe('/setup');
});

test('scan summary presents entities in Home groups', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('ha.dashboard.runtimeMode.v1', 'real');
    localStorage.setItem('ha.dashboard.setupJourney.v2', JSON.stringify({
      version: 2,
      phase: 'scan',
      mode: 'real',
      hassUrl: 'http://homeassistant.local:8123',
      summary: {
        entities: 28,
        devices: 12,
        areas: 4,
        unavailable: 1,
        domains: { light: 7, lock: 2, climate: 3, sensor: 16 },
        groups: { lights: 7, locks: 2, climate: 3, sensors: 16 },
        canManageHa: true,
      },
      updatedAt: Date.now(),
    }));
  });

  await page.goto('/setup');
  await expect(page.getByRole('heading', { name: 'Entità per gruppo' })).toBeVisible();
  await expect(page.getByText('Luci', { exact: true })).toBeVisible();
  await expect(page.getByText('Serrature', { exact: true })).toBeVisible();
  await expect(page.getByText('Clima e aria', { exact: true })).toBeVisible();
  await expect(page.getByText('Sensori', { exact: true })).toBeVisible();
  await expect(page.getByText('light', { exact: true })).toHaveCount(0);
});

test('organization failure can retry registries or return to Home Assistant login', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('hass_auth_tokens', JSON.stringify({ expired: true }));
    localStorage.setItem('ha.dashboard.runtimeMode.v1', 'real');
    localStorage.setItem('ha.dashboard.setupJourney.v2', JSON.stringify({
      version: 2,
      phase: 'organize',
      mode: 'real',
      hassUrl: 'http://homeassistant.local:8123',
      summary: {
        entities: 28,
        devices: 12,
        areas: 4,
        unavailable: 1,
        domains: {},
        groups: { lights: 7, locks: 2, climate: 3, sensors: 16 },
        canManageHa: true,
      },
      updatedAt: Date.now(),
    }));
  });

  await page.goto('/setup');
  await expect(page.getByRole('button', { name: 'Riprova lettura' })).toBeVisible();
  await expect(page.locator('.onboarding-actions').getByRole('button', { name: 'Riconnetti Home Assistant' })).toBeVisible();

  await page.getByRole('button', { name: 'Riconnetti Home Assistant' }).click();
  await expect(page.getByRole('heading', { name: 'Collega Home Assistant' })).toBeVisible();
  await expect(page.getByPlaceholder('http://homeassistant.local:8123')).toHaveValue('http://homeassistant.local:8123');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('hass_auth_tokens'))).toBeNull();
});
