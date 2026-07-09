import { describe, expect, it } from 'vitest';
import { buildSensorHeroPresentation } from './sensorHeroModel';

describe('buildSensorHeroPresentation', () => {
  it('maps humidity to its real percentage, qualitative status and latest hourly trend', () => {
    const presentation = buildSensorHeroPresentation({
      value: 45,
      unit: '%',
      deviceClass: 'humidity',
      history: [41, 42, 43, 45],
    });

    expect(presentation.progress).toBe(0.45);
    expect(presentation.status).toEqual({ label: 'Ottimale', tone: 'good' });
    expect(presentation.trend).toEqual({
      direction: 'up',
      label: '↑ 4,7% nell’ultima ora',
    });
  });

  it('does not invent a qualitative status for an unknown sensor class', () => {
    const presentation = buildSensorHeroPresentation({
      value: 12,
      unit: 'unità',
      deviceClass: 'custom',
      history: [10, 11],
    });

    expect(presentation.status).toBeUndefined();
    expect(presentation.progress).toBeGreaterThan(0);
    expect(presentation.trend?.direction).toBe('up');
  });

  it('uses a configured textual status but ignores the sensor value repeated as status', () => {
    expect(buildSensorHeroPresentation({ value: 45, status: 'Comfort' }).status).toEqual({
      label: 'Comfort',
      tone: 'neutral',
    });
    expect(buildSensorHeroPresentation({ value: 45, status: '45 %' }).status).toBeUndefined();
  });
});
