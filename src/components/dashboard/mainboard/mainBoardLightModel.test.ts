import { describe, expect, it } from 'vitest';
import {
  buildLightColorServicePayload,
  buildLightCommandOptionsPayload,
  percentToHaBrightness,
  resolveLightCapabilities,
} from './mainBoardLightModel';

describe('mainBoardLightModel', () => {
  it('builds payloads for the color mode exposed by Home Assistant', () => {
    expect(buildLightColorServicePayload('hs', [220, 75])).toEqual({
      hs_color: [220, 75],
    });
    expect(buildLightColorServicePayload('rgb', [0, 100])).toEqual({
      rgb_color: [255, 0, 0],
    });
    expect(buildLightColorServicePayload('xy', [0, 100])).toHaveProperty('xy_color');
  });

  it('sanitizes transition and brightness service values', () => {
    expect(buildLightCommandOptionsPayload({ transition: 1.26 })).toEqual({ transition: 1.3 });
    expect(buildLightCommandOptionsPayload({ transition: 0 })).toEqual({});
    expect(percentToHaBrightness(100)).toBe(255);
    expect(percentToHaBrightness(-10)).toBe(0);
  });

  it('derives capabilities from modern color modes and effects', () => {
    expect(
      resolveLightCapabilities({
        state: 'on',
        supportedColorModes: ['brightness', 'color_temp', 'rgb'],
        effectList: ['Pulse', 'pulse', 'Colorloop'],
        rawAttributes: {
          min_color_temp_kelvin: 2200,
          max_color_temp_kelvin: 6000,
        },
      }),
    ).toMatchObject({
      preferredColorMode: 'rgb',
      supportsBrightness: true,
      supportsColorTemp: true,
      supportsRgb: true,
      supportsEffects: true,
      minColorTempKelvin: 2200,
      maxColorTempKelvin: 6000,
      effectList: ['Pulse', 'Colorloop'],
    });
  });
});
