import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const baseUrl = process.env.PREMIUM_HOME_PREVIEW_URL ?? 'http://127.0.0.1:3000';
const outputDirectory = path.resolve('docs/images');

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch();

async function capture(name, viewport, deviceScaleFactor = 1, selectCard = false) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem(
      'ha.dashboard.setupJourney.v2',
      JSON.stringify({ version: 2, phase: 'done', mode: 'demo', updatedAt: Date.now() }),
    );
    localStorage.setItem('ha.dashboard.runtimeMode.v1', 'demo');
    localStorage.setItem('ha.dashboard.onboarding.welcome.v1', 'done');
    localStorage.setItem('ha.dashboard.onboarding.context.v1', 'done');
    localStorage.setItem('ha.dashboard.theme', 'dark');
    localStorage.setItem('ha.dashboard.background', 'neutral');
  });
  await page.goto(`${baseUrl}/home`, { waitUntil: 'domcontentloaded' });
  await page.locator('.dashboard-shell').first().waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForTimeout(2_500);
  if (selectCard) {
    const cardTitle = page.getByText('Lamp', { exact: true }).first();
    if (await cardTitle.isVisible().catch(() => false)) {
      await cardTitle.click({ force: true });
      await page.waitForTimeout(700);
    }
  }
  await page.screenshot({
    path: path.join(outputDirectory, `${name}.jpg`),
    type: 'jpeg',
    quality: 88,
    fullPage: false,
  });
  await context.close();
}

await capture('domusos-desktop', { width: 1440, height: 900 }, 1, true);
await capture('domusos-mobile', { width: 430, height: 932 }, 1.25);
await browser.close();

console.log(`README screenshots written to ${outputDirectory}`);
