const { test, expect } = require('@playwright/test');

const STORAGE_KEY = 'ha.dashboard.builder.layout.v1';
const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

const seededLayout = {
  version: 13,
  widgetTypeLayoutOverrides: {},
  sections: [
    {
      id: 'section-stack-test',
      kind: 'stack-grid',
      title: 'Grid Stack Test',
      stackColumns: 3,
      stackShowBackground: true,
      stackShowBorder: true,
      stackShowHeader: true,
      stackUseFavoritesGrid: false,
      layout: { i: 'section-stack-test', x: 0, y: 3, w: 12, h: 10 },
    },
  ],
  widgets: [
    {
      id: 'light.root_a',
      kind: 'light',
      title: 'Root Light A',
      entityId: 'light.living_room_lamp',
      status: 'Idle',
      isOn: true,
      value: 60,
      unit: '%',
      layout: { i: 'light.root_a', x: 0, y: 0, w: 2, h: 2 },
    },
    {
      id: 'sensor.root_a',
      kind: 'sensor',
      title: 'Root Sensor A',
      entityId: 'sensor.nest_wifi_download',
      status: 'Tracking',
      isOn: true,
      value: 42,
      unit: '%',
      layout: { i: 'sensor.root_a', x: 3, y: 0, w: 2, h: 2 },
    },
    {
      id: 'climate.root_a',
      kind: 'climate',
      title: 'Root Climate A',
      entityId: 'climate.air_conditioner',
      status: 'Idle',
      isOn: true,
      value: 23,
      unit: 'C',
      layout: { i: 'climate.root_a', x: 6, y: 0, w: 3, h: 3 },
    },
    {
      id: 'light.stack_a',
      kind: 'light',
      title: 'Stack Light A',
      entityId: 'light.lamp_2',
      parentSectionId: 'section-stack-test',
      status: 'Idle',
      isOn: true,
      value: 75,
      unit: '%',
      layout: { i: 'light.stack_a', x: 0, y: 0, w: 2, h: 2 },
    },
    {
      id: 'sensor.stack_a',
      kind: 'sensor',
      title: 'Stack Sensor A',
      entityId: 'sensor.living_room_humidity',
      parentSectionId: 'section-stack-test',
      status: 'Tracking',
      isOn: true,
      value: 48,
      unit: '%',
      layout: { i: 'sensor.stack_a', x: 2, y: 0, w: 2, h: 2 },
    },
    {
      id: 'media.stack_a',
      kind: 'media',
      title: 'Stack Media A',
      entityId: 'media_player.living_room_tv',
      parentSectionId: 'section-stack-test',
      status: 'paused',
      isOn: false,
      value: 0,
      unit: '%',
      layout: { i: 'media.stack_a', x: 4, y: 0, w: 2, h: 3 },
    },
  ],
};

async function dragBy(page, locator, dx, dy) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Cannot drag: target has no bounding box');
  }
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 18 });
  await page.mouse.up();
  await page.waitForTimeout(350);
}

async function enterEditMode(page) {
  const directEditButton = page.locator('button[aria-label="Toggle edit mode"]').filter({ visible: true }).first();
  if ((await directEditButton.count()) > 0) {
    await directEditButton.click();
  } else {
    await page.getByLabel('Apri altre sezioni').click();
    await page.locator('button[aria-label="Toggle edit mode"]').filter({ visible: true }).first().click();
  }
  await page.getByRole('button', { name: 'Attiva', exact: true }).click();
  await page.waitForSelector('.sections-grid.is-editing .react-grid-item');
}

async function readRootPositions(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('.sections-grid');
    const gridRect = grid?.getBoundingClientRect();
    return [...document.querySelectorAll('.sections-grid > .react-grid-item')]
      .filter((node) => !node.classList.contains('react-grid-placeholder'))
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const text = [
          node.textContent ?? '',
          ...[...node.querySelectorAll('[aria-label]')].map((child) => child.getAttribute('aria-label') ?? ''),
        ]
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        return {
          text,
          x: Math.round(rect.left - (gridRect?.left ?? 0)),
          y: Math.round(rect.top - (gridRect?.top ?? 0)),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          transform: getComputedStyle(node).transform,
        };
      });
  });
}

async function readStackOverlayPositions(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll('.builder-grid .react-grid-item')]
      .filter((node) => !node.classList.contains('react-grid-placeholder'))
      .map((node) => {
        const button = node.querySelector('button[aria-label^="Muovi"]');
        const rect = node.getBoundingClientRect();
        return {
          label: button?.getAttribute('aria-label') ?? '',
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          transform: getComputedStyle(node).transform,
        };
      });
  });
}

function findByText(items, text) {
  const match = items.find((item) => item.text?.includes(text) || item.label?.includes(text));
  if (!match) {
    throw new Error(`Missing item containing "${text}"`);
  }
  return match;
}

function delta(a, b) {
  return { dx: Math.abs(a.x - b.x), dy: Math.abs(a.y - b.y), dw: Math.abs(a.w - b.w), dh: Math.abs(a.h - b.h) };
}

function assertPositionStable(before, after, label, tolerance = 1) {
  const beforeItem = findByText(before, label);
  const afterItem = findByText(after, label);
  const itemDelta = delta(beforeItem, afterItem);
  expect(itemDelta.dx).toBeLessThanOrEqual(tolerance);
  expect(itemDelta.dy).toBeLessThanOrEqual(tolerance);
  expect(itemDelta.dw).toBeLessThanOrEqual(tolerance);
  expect(itemDelta.dh).toBeLessThanOrEqual(tolerance);
}

test('GridEngine preserves XL while editing XS/SM and keeps stack reflow stable', async ({ page }) => {
  test.setTimeout(120000);
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.clear();
      localStorage.setItem(key, JSON.stringify(value));
      localStorage.setItem('ha.dashboard.onboarding.welcome.v1', 'done');
      localStorage.setItem('ha.dashboard.onboarding.context.v1', 'done');
    },
    { key: STORAGE_KEY, value: seededLayout },
  );

  await page.goto(`${BASE_URL}/?view=home`);
  await enterEditMode(page);

  const xlRootBeforeClick = await readRootPositions(page);
  await page.locator('.sections-grid > .react-grid-item').filter({ hasText: 'Root Light A' }).first().click();
  await page.waitForTimeout(250);
  const xlRootAfterClick = await readRootPositions(page);
  assertPositionStable(xlRootBeforeClick, xlRootAfterClick, 'Root Light A');
  assertPositionStable(xlRootBeforeClick, xlRootAfterClick, 'Root Sensor A');

  const rootLightBeforeLayoutPicker = findByText(xlRootAfterClick, 'Root Light A');
  await page.getByRole('button', { name: 'Layout', exact: true }).click();
  await page.getByRole('button', { name: /Mini, 1 per 1/ }).click();
  await page.waitForTimeout(350);
  const xlRootAfterLayoutPicker = await readRootPositions(page);
  const rootLightAfterLayoutPicker = findByText(xlRootAfterLayoutPicker, 'Root Light A');
  expect(rootLightAfterLayoutPicker.w).toBeLessThan(rootLightBeforeLayoutPicker.w);
  expect(rootLightAfterLayoutPicker.h).toBeLessThanOrEqual(rootLightBeforeLayoutPicker.h);

  await expect(page.getByLabel('Muovi Stack Light A')).toBeVisible({ timeout: 5000 });
  const xlStackBeforeClick = await readStackOverlayPositions(page);
  await page.getByLabel('Muovi Stack Light A').click();
  await page.waitForTimeout(250);
  const xlStackAfterClick = await readStackOverlayPositions(page);
  assertPositionStable(xlStackBeforeClick, xlStackAfterClick, 'Stack Light A');
  assertPositionStable(xlStackBeforeClick, xlStackAfterClick, 'Stack Sensor A');

  await dragBy(page, page.locator('.sections-grid > .react-grid-item').filter({ hasText: 'Root Light A' }).first(), 260, 120);
  const xlAfterRootDrag = await readRootPositions(page);
  const xlRootLight = findByText(xlAfterRootDrag, 'Root Light A');

  const moveLabels = await page.locator('button[aria-label^="Muovi"]').evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute('aria-label')),
  );
  console.log(`GRID_ENGINE_MOVE_LABELS ${JSON.stringify(moveLabels)}`);
  await page.getByLabel('Muovi Stack Light A').scrollIntoViewIfNeeded();
  await dragBy(page, page.getByLabel('Muovi Stack Light A'), 180, 140);
  const xlStackAfterDrag = await readStackOverlayPositions(page);
  const xlStackLight = findByText(xlStackAfterDrag, 'Stack Light A');

  await page.setViewportSize({ width: 520, height: 820 });
  await page.waitForTimeout(700);
  await dragBy(page, page.locator('.sections-grid > .react-grid-item').filter({ hasText: 'Root Sensor A' }).first(), 20, 180);
  const smAfterRootDrag = await readRootPositions(page);
  const smRootSensor = findByText(smAfterRootDrag, 'Root Sensor A');

  await page.setViewportSize({ width: 390, height: 820 });
  await page.waitForTimeout(700);
  await page.getByLabel('Muovi Stack Sensor A').scrollIntoViewIfNeeded();
  await dragBy(page, page.getByLabel('Muovi Stack Sensor A'), 10, 160);
  const xsStackAfterDrag = await readStackOverlayPositions(page);
  const xsStackSensor = findByText(xsStackAfterDrag, 'Stack Sensor A');

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.waitForTimeout(900);
  const xlAfterReturnRoot = await readRootPositions(page);
  const xlRootLightReturned = findByText(xlAfterReturnRoot, 'Root Light A');
  const xlAfterReturnStack = await readStackOverlayPositions(page);
  const xlStackLightReturned = findByText(xlAfterReturnStack, 'Stack Light A');

  const rootDelta = delta(xlRootLight, xlRootLightReturned);
  const stackDelta = delta(xlStackLight, xlStackLightReturned);
  const report = {
    rootDeltaAfterMobileRoundTrip: rootDelta,
    stackDeltaAfterMobileRoundTrip: stackDelta,
    smRootSensor,
    xsStackSensor,
    consoleErrors: consoleErrors.slice(0, 5),
  };
  console.log(`GRID_ENGINE_TEST_REPORT ${JSON.stringify(report, null, 2)}`);

  expect(consoleErrors).toEqual([]);
  expect(smRootSensor.x).toBeGreaterThan(100);
  expect(rootDelta.dx).toBeLessThanOrEqual(3);
  expect(rootDelta.dy).toBeLessThanOrEqual(3);
  expect(stackDelta.dx).toBeLessThanOrEqual(3);
  expect(stackDelta.dy).toBeLessThanOrEqual(3);
});
