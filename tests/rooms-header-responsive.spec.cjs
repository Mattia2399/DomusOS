const { test, expect } = require('@playwright/test');

function installCompletedDemo(page) {
  return page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('ha.dashboard.setupJourney.v2', JSON.stringify({
      version: 2,
      phase: 'done',
      mode: 'demo',
      updatedAt: Date.now(),
    }));
    localStorage.setItem('ha.dashboard.runtimeMode.v1', 'demo');
    localStorage.setItem('ha.dashboard.onboarding.welcome.v1', 'done');
    localStorage.setItem('ha.dashboard.onboarding.context.v1', 'done');
  });
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 820, height: 1180 },
]) {
  test(`Rooms keeps its compact header visible at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await installCompletedDemo(page);
    await page.goto('/rooms');

    const dashboard = page.locator('.rooms-dashboard');
    const header = page.getByTestId('rooms-page-header');
    const title = header.locator('h1');
    const titleScroller = page.getByTestId('rooms-title-scroller');

    await expect(header).toBeVisible();
    await expect(title).toBeVisible();
    await expect(header).toHaveAttribute('data-compact', 'false');

    await page.getByRole('button', { name: 'Camera', exact: true }).click();
    await expect(title).toHaveText('Camera');

    const initialHeaderTop = (await header.boundingBox()).y;
    await dashboard.evaluate((element) => {
      element.scrollTop = 180;
      element.dispatchEvent(new Event('scroll', { bubbles: true }));
    });

    await expect(header).toHaveAttribute('data-compact', 'true');
    await expect(title).toBeVisible();
    const compactHeaderTop = (await header.boundingBox()).y;
    expect(Math.abs(compactHeaderTop - initialHeaderTop)).toBeLessThanOrEqual(2);

    const touchAction = await titleScroller.evaluate((element) => getComputedStyle(element).touchAction);
    expect(touchAction).toBe('auto');
  });
}
