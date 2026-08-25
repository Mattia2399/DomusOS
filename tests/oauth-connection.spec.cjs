const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const OAUTH_STATE_KEY = 'ha.dashboard.oauth.state';

test('OAuth callback is completed once under React StrictMode', async ({ page }) => {
  let tokenExchangeCount = 0;
  await page.route('http://homeassistant.local:8123/auth/token', async (route) => {
    tokenExchangeCount += 1;
    await route.fulfill({
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': BASE_URL,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: 'oauth-access-token',
        refresh_token: 'oauth-refresh-token',
        expires_in: 1800,
        token_type: 'Bearer',
      }),
    });
  });

  await page.goto('/home');
  await page.evaluate(({ oauthStateKey }) => {
    const state = JSON.stringify({
      nonce: 'strict-mode-oauth-test',
      hassUrl: 'http://homeassistant.local:8123',
      returnTo: '/home',
      issuedAt: Date.now(),
    });
    window.sessionStorage.setItem(oauthStateKey, state);
    window.location.assign(
      `/home?ha_oauth_callback=1&code=test-authorization-code&state=${encodeURIComponent(state)}`,
    );
  }, { oauthStateKey: OAUTH_STATE_KEY });

  await expect
    .poll(async () => {
      try {
        return await page.evaluate(() => {
          const raw = window.localStorage.getItem('hass_auth_tokens');
          return raw ? JSON.parse(raw).refresh_token : null;
        });
      } catch {
        return null;
      }
    })
    .toBe('oauth-refresh-token');

  expect(tokenExchangeCount).toBe(1);
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem('ha.dashboard.runtimeMode.v1')))
    .toBe('real');
});
