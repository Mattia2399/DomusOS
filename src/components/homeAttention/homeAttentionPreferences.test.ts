import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_HOME_ATTENTION_PREFERENCES,
  DEMO_HOME_ATTENTION_STORAGE_KEY,
  REAL_HOME_ATTENTION_STORAGE_KEY,
  readHomeAttentionPreferences,
  saveHomeAttentionPreferences,
} from './homeAttentionPreferences';

beforeEach(() => window.localStorage.clear());

describe('homeAttentionPreferences', () => {
  it('keeps Demo and real-home preferences isolated', () => {
    saveHomeAttentionPreferences('demo', {
      ...DEFAULT_HOME_ATTENTION_PREFERENCES,
      enabled: false,
    });

    expect(readHomeAttentionPreferences('demo').enabled).toBe(false);
    expect(readHomeAttentionPreferences('real').enabled).toBe(true);
    expect(window.localStorage.getItem(DEMO_HOME_ATTENTION_STORAGE_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(REAL_HOME_ATTENTION_STORAGE_KEY)).toBeNull();
  });

  it('repairs unsupported thresholds and incomplete categories', () => {
    window.localStorage.setItem(
      REAL_HOME_ATTENTION_STORAGE_KEY,
      JSON.stringify({
        enabled: true,
        categories: { battery: false },
        batteryWarningThreshold: 99,
        openingWarningMinutes: 12,
      }),
    );

    expect(readHomeAttentionPreferences('real')).toEqual({
      ...DEFAULT_HOME_ATTENTION_PREFERENCES,
      categories: {
        ...DEFAULT_HOME_ATTENTION_PREFERENCES.categories,
        battery: false,
      },
    });
  });
});
