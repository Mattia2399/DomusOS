import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const svg = await readFile(path.resolve('brand/icon.svg'), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 256, height: 256 }, deviceScaleFactor: 1 });
await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:256px;height:256px}</style>${svg}`);
await page.locator('svg').screenshot({ path: path.resolve('brand/icon.png'), omitBackground: true });
await browser.close();

const integrationBrandDirectory = path.resolve(
  'custom_components/domusos/brand',
);
await mkdir(integrationBrandDirectory, { recursive: true });
await copyFile(
  path.resolve('brand/icon.png'),
  path.join(integrationBrandDirectory, 'icon.png'),
);

console.log('Generated brand/icon.png and integration brand/icon.png');
