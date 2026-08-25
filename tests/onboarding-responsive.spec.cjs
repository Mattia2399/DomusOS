const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'mobile', width: 390, height: 844, desktopRail: false },
  { name: 'tablet', width: 820, height: 1180, desktopRail: false },
  { name: 'desktop', width: 1440, height: 900, desktopRail: true },
];

for (const viewport of viewports) {
  test(`setup assistant adapts to ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('ha.dashboard.theme', 'dark');
      localStorage.setItem('ha.dashboard.wallpaper', 'sunset-amber');
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Tutta la casa\.\s*Un solo gesto\./ })).toBeVisible();
    await expect(page.locator('.onboarding-brand')).toHaveCount(0);
    await expect(page.locator('main[data-appearance-source="device"].onboarding-accent-neutral')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.getByRole('button', { name: 'Inizia ora' }).click();
    await expect(page.getByRole('button', { name: 'Indietro' })).toBeVisible();
    await expect(page.locator('.onboarding-brand')).toHaveCount(0);
    await page.getByRole('button', { name: /Collega la tua casa/ }).click();
    await expect(page.getByRole('heading', { name: 'Cerchiamo la tua casa' })).toBeVisible();
    await expect(page.getByLabel('Rilevamento della casa')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Collega Home Assistant' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    const desktopRail = page.locator('.onboarding-step-rail');
    const mobileHeader = page.locator('.onboarding-mobile-header');
    if (viewport.desktopRail) {
      await expect(desktopRail).toBeVisible();
      await expect(mobileHeader).toBeHidden();
    } else {
      await expect(desktopRail).toBeHidden();
      await expect(mobileHeader).toBeVisible();
    }

    if (viewport.name === 'mobile') {
      const setupWindow = page.locator('.onboarding-window');
      const actions = page.locator('.onboarding-actions');
      const continueButton = page.getByRole('button', { name: 'Continua su Home Assistant' });
      await expect(setupWindow).toHaveCSS('border-radius', '0px');
      await expect(actions).toHaveCSS('position', 'fixed');
      await expect(continueButton).toBeVisible();
      const bounds = await setupWindow.boundingBox();
      expect(bounds?.x).toBe(0);
      expect(bounds?.width).toBe(viewport.width);
    }
  });
}

test('setup follows the device appearance instead of the stored profile theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('ha.dashboard.theme', 'dark');
  });

  await page.goto('/');
  const setup = page.locator('main[data-appearance-source="device"]');
  await expect(setup).toHaveClass(/dashboard-theme-light/);
  await expect(setup).not.toHaveClass(/dashboard-theme-dark/);
  await expect.poll(() => setup.evaluate((element) => getComputedStyle(element).getPropertyValue('--ui-accent-rgb').trim())).toBe('0 122 255');

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(setup).toHaveClass(/dashboard-theme-dark/);
  await expect(setup).not.toHaveClass(/dashboard-theme-light/);
  await expect.poll(() => setup.evaluate((element) => getComputedStyle(element).getPropertyValue('--ui-accent-rgb').trim())).toBe('245 245 247');
});

test('summary groups scroll without pushing the continue action below the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 720 });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('ha.dashboard.setupJourney.v2', JSON.stringify({
      version: 2,
      phase: 'scan',
      mode: 'real',
      updatedAt: Date.now(),
      summary: {
        entities: 540,
        devices: 80,
        areas: 12,
        unavailable: 4,
        canManageHa: true,
        groups: {
          lights: 70,
          locks: 5,
          covers: 12,
          climate: 8,
          security: 22,
          cameras: 9,
          energy: 28,
          sensors: 130,
          controls: 55,
          media: 18,
          cleaning: 3,
          presence: 4,
          scenes: 21,
          weather: 2,
          updates: 7,
          other: 134,
        },
        domains: {},
      },
    }));
  });

  await page.goto('/setup');
  const groups = page.locator('.onboarding-summary-groups');
  const continueButton = page.getByRole('button', { name: 'Continua' });
  await expect(groups).toBeVisible();
  await expect(continueButton).toBeVisible();
  await expect.poll(() => groups.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  const buttonBounds = await continueButton.boundingBox();
  expect((buttonBounds?.y ?? 0) + (buttonBounds?.height ?? 0)).toBeLessThanOrEqual(720);
});

test('mobile summary keeps the continue action fixed to the device viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('ha.dashboard.setupJourney.v2', JSON.stringify({
      version: 2,
      phase: 'scan',
      mode: 'real',
      updatedAt: Date.now(),
      summary: {
        entities: 540,
        devices: 80,
        areas: 12,
        unavailable: 4,
        canManageHa: true,
        groups: {
          lights: 70,
          locks: 5,
          covers: 12,
          climate: 8,
          security: 22,
          cameras: 9,
          energy: 28,
          sensors: 130,
          controls: 55,
          media: 18,
          cleaning: 3,
          presence: 4,
          scenes: 21,
          weather: 2,
          updates: 7,
          other: 134,
        },
        domains: {},
      },
    }));
  });

  await page.goto('/setup');
  const actions = page.locator('.onboarding-actions');
  const continueButton = page.getByRole('button', { name: 'Continua' });
  await expect(page.locator('.onboarding-summary-groups')).toBeVisible();
  await expect(actions).toHaveCSS('position', 'fixed');
  await expect(continueButton).toBeVisible();
  const buttonBounds = await continueButton.boundingBox();
  expect((buttonBounds?.y ?? 0) + (buttonBounds?.height ?? 0)).toBeLessThanOrEqual(844);
  expect(buttonBounds?.y ?? 844).toBeGreaterThan(740);
});
