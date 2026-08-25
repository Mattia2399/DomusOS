import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type Rgb = [number, number, number];

function luminance([red, green, blue]: Rgb) {
  const channels = [red, green, blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: Rgb, background: Rgb) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function composite(foreground: Rgb, alpha: number, background: Rgb): Rgb {
  return foreground.map((channel, index) =>
    Math.round(channel * alpha + background[index] * (1 - alpha)),
  ) as Rgb;
}

describe('semantic theme contrast', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/assets/index.css'), 'utf8');

  it.each([
    ['Light primary', [28, 28, 30], [242, 242, 247]],
    ['Light secondary', [76, 76, 80], [242, 242, 247]],
    ['Light tertiary', [110, 110, 115], [242, 242, 247]],
    ['Dark primary', [245, 245, 247], [0, 0, 0]],
    ['Dark secondary', composite([235, 235, 245], 0.72, [0, 0, 0]), [0, 0, 0]],
    ['Dark tertiary', composite([235, 235, 245], 0.56, [0, 0, 0]), [0, 0, 0]],
  ] as Array<[string, Rgb, Rgb]>)('%s text meets WCAG AA on the canvas', (_label, text, canvas) => {
    expect(contrast(text, canvas)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the audited semantic colors in the global theme contract', () => {
    expect(css).toContain('--ui-bg-canvas: #f2f2f7');
    expect(css).toContain('--ui-text-primary: #1c1c1e');
    expect(css).toContain('--ui-text-secondary: #4c4c50');
    expect(css).toContain('--ui-text-tertiary: #6e6e73');
    expect(css).toContain('--ui-bg-canvas: #000000');
    expect(css).toContain('--ui-text-primary: #f5f5f7');
    expect(css).toContain('--ui-text-secondary: rgb(235 235 245 / 0.72)');
    expect(css).toContain('--ui-text-tertiary: rgb(235 235 245 / 0.56)');
  });
});
