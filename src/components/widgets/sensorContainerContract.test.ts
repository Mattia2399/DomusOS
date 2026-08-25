import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sensorCss = readFileSync(resolve(process.cwd(), 'src/components/widgets/SensorCard.css'), 'utf8');
const sensorView = readFileSync(resolve(process.cwd(), 'src/components/widgets/SensorCardView.tsx'), 'utf8');

describe('SensorCard container contract', () => {
  it('owns its visual layout through size container queries', () => {
    expect(sensorCss).toContain('container-name: sensor-card');
    expect(sensorCss).toContain('container-type: size');
    expect(sensorCss).toContain('@container sensor-card (min-width: 132px) and (min-height: 44px)');
    expect(sensorCss).toContain('@container sensor-card (min-width: 88px) and (min-height: 96px)');
    expect(sensorCss).toContain('@container sensor-card (min-width: 170px) and (min-height: 104px)');
    expect(sensorCss).toContain('@container sensor-card (min-width: 260px) and (min-height: 104px)');
    expect(sensorCss).toContain('@container sensor-card (min-width: 176px) and (min-height: 160px)');
  });

  it('does not couple visual composition to a JS variant attribute', () => {
    expect(sensorCss).not.toContain('data-sensor-variant');
    expect(sensorView).not.toContain('data-sensor-variant');
  });
});
