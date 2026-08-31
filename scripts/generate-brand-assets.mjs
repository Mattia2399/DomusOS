import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const svg = await readFile(path.resolve('brand/icon.svg'), 'utf8');
const browser = await chromium.launch();

async function renderIcon(size, outputPath) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  await page.locator('svg').screenshot({ path: path.resolve(outputPath), omitBackground: true });
  await page.close();
}

await renderIcon(256, 'brand/icon.png');
await renderIcon(512, 'brand/icon@2x.png');
await browser.close();

const integrationBrandDirectory = path.resolve(
  'custom_components/domusos/brand',
);
await mkdir(integrationBrandDirectory, { recursive: true });
await copyFile(
  path.resolve('brand/icon.png'),
  path.join(integrationBrandDirectory, 'icon.png'),
);
await copyFile(
  path.resolve('brand/icon@2x.png'),
  path.join(integrationBrandDirectory, 'icon@2x.png'),
);

console.log('Generated 1x/2x brand icons for the repository and integration');
