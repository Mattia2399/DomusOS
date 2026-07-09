import { describe, expect, it } from 'vitest';
import {
  resolveAlarmPixelDisplayVariant,
  resolveClimatePixelDisplayVariant,
  resolveLightPixelDisplayVariant,
  resolveLockPixelDisplayVariant,
  resolveSensorPixelDisplayVariant,
  resolveSwitchPixelDisplayVariant,
  resolveWidgetDisplayVariant,
} from './widgetDisplayVariant';

describe('resolveWidgetDisplayVariant', () => {
  it('uses mini for one-cell widgets', () => {
    expect(resolveWidgetDisplayVariant({ kind: 'sensor', breakpoint: 'xl', layout: { w: 1, h: 1 } })).toBe('mini');
  });

  it('uses compact for single-row or narrow sensor cards', () => {
    expect(resolveWidgetDisplayVariant({ kind: 'sensor', breakpoint: 'xs', layout: { w: 2, h: 1 } })).toBe('compact');
    expect(resolveWidgetDisplayVariant({ kind: 'sensor', breakpoint: 'md', layout: { w: 1, h: 2 } })).toBe('compact');
  });

  it('keeps medium sensor cards standard on mobile and tablet', () => {
    expect(resolveWidgetDisplayVariant({ kind: 'sensor', breakpoint: 'xs', layout: { w: 2, h: 2 } })).toBe('standard');
    expect(resolveWidgetDisplayVariant({ kind: 'sensor', breakpoint: 'md', layout: { w: 2, h: 2 } })).toBe('standard');
  });

  it('uses full for spacious desktop sensor cards', () => {
    expect(resolveWidgetDisplayVariant({ kind: 'sensor', breakpoint: 'xl', layout: { w: 2, h: 3 } })).toBe('full');
    expect(resolveWidgetDisplayVariant({ kind: 'sensor', breakpoint: 'xl', layout: { w: 3, h: 2 } })).toBe('full');
  });

  it('uses dedicated climate compositions without a mini variant', () => {
    expect(resolveWidgetDisplayVariant({ kind: 'climate', breakpoint: 'xl', layout: { w: 1, h: 1 } })).toBe('compact');
    expect(resolveWidgetDisplayVariant({ kind: 'climate', breakpoint: 'xl', layout: { w: 2, h: 2 } })).toBe('compact');
    expect(resolveWidgetDisplayVariant({ kind: 'climate', breakpoint: 'xl', layout: { w: 3, h: 3 } })).toBe('standard');
    expect(resolveWidgetDisplayVariant({ kind: 'climate', breakpoint: 'xs', layout: { w: 2, h: 3 } })).toBe('standard');
    expect(resolveWidgetDisplayVariant({ kind: 'climate', breakpoint: 'xs', layout: { w: 2, h: 4 } })).toBe('full');
  });

  it('uses dedicated alarm compositions without unsafe narrow variants', () => {
    expect(resolveWidgetDisplayVariant({ kind: 'alarm', breakpoint: 'xl', layout: { w: 1, h: 1 } })).toBe('compact');
    expect(resolveWidgetDisplayVariant({ kind: 'alarm', breakpoint: 'xl', layout: { w: 2, h: 2 } })).toBe('compact');
    expect(resolveWidgetDisplayVariant({ kind: 'alarm', breakpoint: 'xl', layout: { w: 3, h: 3 } })).toBe('standard');
    expect(resolveWidgetDisplayVariant({ kind: 'alarm', breakpoint: 'xs', layout: { w: 2, h: 3 } })).toBe('standard');
    expect(resolveWidgetDisplayVariant({ kind: 'alarm', breakpoint: 'xs', layout: { w: 2, h: 4 } })).toBe('full');
  });

  it('uses dedicated lock compositions with a safe mini variant', () => {
    expect(resolveWidgetDisplayVariant({ kind: 'lock', breakpoint: 'xl', layout: { w: 1, h: 1 } })).toBe('mini');
    expect(resolveWidgetDisplayVariant({ kind: 'lock', breakpoint: 'xl', layout: { w: 1, h: 2 } })).toBe('mini');
    expect(resolveWidgetDisplayVariant({ kind: 'lock', breakpoint: 'xl', layout: { w: 2, h: 1 } })).toBe('compact');
    expect(resolveWidgetDisplayVariant({ kind: 'lock', breakpoint: 'xl', layout: { w: 2, h: 2 } })).toBe('compact');
    expect(resolveWidgetDisplayVariant({ kind: 'lock', breakpoint: 'xl', layout: { w: 2, h: 3 } })).toBe('standard');
    expect(resolveWidgetDisplayVariant({ kind: 'lock', breakpoint: 'xl', layout: { w: 2, h: 4 } })).toBe('full');
    expect(resolveWidgetDisplayVariant({ kind: 'lock', breakpoint: 'xl', layout: { w: 3, h: 2 } })).toBe('full');
  });
});

describe('resolveAlarmPixelDisplayVariant', () => {
  it('uses equivalent pixel thresholds on desktop and mobile', () => {
    expect(resolveAlarmPixelDisplayVariant({ width: 192, height: 112 })).toBe('compact');
    expect(resolveAlarmPixelDisplayVariant({ width: 296, height: 176 })).toBe('standard');
    expect(resolveAlarmPixelDisplayVariant({ width: 320, height: 176 })).toBe('standard');
    expect(resolveAlarmPixelDisplayVariant({ width: 296, height: 240 })).toBe('full');
    expect(resolveAlarmPixelDisplayVariant({ width: 320, height: 240 })).toBe('full');
  });
});

describe('resolveClimatePixelDisplayVariant', () => {
  it('keeps equivalent content thresholds across desktop and mobile spans', () => {
    expect(resolveClimatePixelDisplayVariant({ width: 192, height: 112 })).toBe('compact');
    expect(resolveClimatePixelDisplayVariant({ width: 296, height: 176 })).toBe('standard');
    expect(resolveClimatePixelDisplayVariant({ width: 320, height: 176 })).toBe('standard');
    expect(resolveClimatePixelDisplayVariant({ width: 296, height: 240 })).toBe('full');
    expect(resolveClimatePixelDisplayVariant({ width: 320, height: 240 })).toBe('full');
  });
});

describe('resolveSensorPixelDisplayVariant', () => {
  it('uses the real rectangle instead of grid units', () => {
    expect(resolveSensorPixelDisplayVariant({ width: 104, height: 48 })).toBe('mini');
    expect(resolveSensorPixelDisplayVariant({ width: 150, height: 48 })).toBe('compact');
    expect(resolveSensorPixelDisplayVariant({ width: 104, height: 112 })).toBe('compact');
    expect(resolveSensorPixelDisplayVariant({ width: 192, height: 112 })).toBe('standard');
  });

  it('supports both wide and tall full layouts', () => {
    expect(resolveSensorPixelDisplayVariant({ width: 296, height: 112 })).toBe('full');
    expect(resolveSensorPixelDisplayVariant({ width: 192, height: 176 })).toBe('full');
  });

  it('does not infer richer content from area alone', () => {
    expect(resolveSensorPixelDisplayVariant({ width: 300, height: 48 })).toBe('compact');
    expect(resolveSensorPixelDisplayVariant({ width: 104, height: 176 })).toBe('compact');
  });

  it('uses hysteresis around thresholds', () => {
    expect(resolveSensorPixelDisplayVariant({ width: 134, height: 48, previousVariant: 'mini' })).toBe('mini');
    expect(resolveSensorPixelDisplayVariant({ width: 141, height: 48, previousVariant: 'mini' })).toBe('compact');
    expect(resolveSensorPixelDisplayVariant({ width: 128, height: 48, previousVariant: 'compact' })).toBe('compact');
    expect(resolveSensorPixelDisplayVariant({ width: 123, height: 48, previousVariant: 'compact' })).toBe('mini');
  });
});

describe('resolveLightPixelDisplayVariant', () => {
  it('matches the light card container-query compositions', () => {
    expect(resolveLightPixelDisplayVariant({ width: 104, height: 48 })).toBe('mini');
    expect(resolveLightPixelDisplayVariant({ width: 192, height: 48 })).toBe('compact');
    expect(resolveLightPixelDisplayVariant({ width: 104, height: 112 })).toBe('compact');
    expect(resolveLightPixelDisplayVariant({ width: 192, height: 112 })).toBe('standard');
    expect(resolveLightPixelDisplayVariant({ width: 296, height: 112 })).toBe('full');
    expect(resolveLightPixelDisplayVariant({ width: 192, height: 176 })).toBe('full');
  });
});

describe('resolveSwitchPixelDisplayVariant', () => {
  it('matches the switch card container-query compositions', () => {
    expect(resolveSwitchPixelDisplayVariant({ width: 104, height: 48 })).toBe('mini');
    expect(resolveSwitchPixelDisplayVariant({ width: 192, height: 48 })).toBe('compact');
    expect(resolveSwitchPixelDisplayVariant({ width: 104, height: 112 })).toBe('compact');
    expect(resolveSwitchPixelDisplayVariant({ width: 192, height: 112 })).toBe('standard');
    expect(resolveSwitchPixelDisplayVariant({ width: 296, height: 112 })).toBe('full');
    expect(resolveSwitchPixelDisplayVariant({ width: 192, height: 176 })).toBe('full');
  });
});

describe('resolveLockPixelDisplayVariant', () => {
  it('matches the lock card internal grid compositions', () => {
    expect(resolveLockPixelDisplayVariant({ width: 104, height: 48 })).toBe('mini');
    expect(resolveLockPixelDisplayVariant({ width: 192, height: 48 })).toBe('compact');
    expect(resolveLockPixelDisplayVariant({ width: 104, height: 112 })).toBe('mini');
    expect(resolveLockPixelDisplayVariant({ width: 192, height: 112 })).toBe('compact');
    expect(resolveLockPixelDisplayVariant({ width: 192, height: 176 })).toBe('standard');
    expect(resolveLockPixelDisplayVariant({ width: 296, height: 196 })).toBe('full');
  });
});
