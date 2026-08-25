import { beforeEach, describe, expect, it } from 'vitest';
import {
  LEGACY_WIDGET_SECRETS_STORAGE_KEY,
  WIDGET_SECRETS_STORAGE_KEY,
  getWidgetSecrets,
  initializeWidgetSecrets,
  setWidgetSecrets,
  setWidgetSecretsRemembered,
} from './widgetSecrets';

beforeEach(() => {
  window.localStorage.clear();
  initializeWidgetSecrets(window.localStorage);
});

describe('widget secret store', () => {
  it('uses memory by default and erases it on a page-like reinitialization', () => {
    setWidgetSecrets('alarm-1', { alarmUnlockCode: '1234' }, window.localStorage);
    expect(getWidgetSecrets('alarm-1')).toEqual({ alarmUnlockCode: '1234' });
    expect(window.localStorage.getItem(WIDGET_SECRETS_STORAGE_KEY)).toBeNull();
    initializeWidgetSecrets(window.localStorage);
    expect(getWidgetSecrets('alarm-1')).toEqual({});
  });

  it('persists only after explicit consent and deletes persistence when revoked', () => {
    setWidgetSecrets('lock-1', { lockCode: '2580' }, window.localStorage);
    setWidgetSecretsRemembered('lock-1', true, window.localStorage);
    expect(window.localStorage.getItem(WIDGET_SECRETS_STORAGE_KEY)).not.toContain('undefined');
    initializeWidgetSecrets(window.localStorage);
    expect(getWidgetSecrets('lock-1')).toEqual({ lockCode: '2580' });
    setWidgetSecretsRemembered('lock-1', false, window.localStorage);
    expect(window.localStorage.getItem(WIDGET_SECRETS_STORAGE_KEY)).toBeNull();
  });

  it('deletes the v1 archive without migrating old codes', () => {
    window.localStorage.setItem(LEGACY_WIDGET_SECRETS_STORAGE_KEY, JSON.stringify({ lock: '9999' }));
    initializeWidgetSecrets(window.localStorage);
    expect(window.localStorage.getItem(LEGACY_WIDGET_SECRETS_STORAGE_KEY)).toBeNull();
    expect(getWidgetSecrets('lock')).toEqual({});
  });
});
