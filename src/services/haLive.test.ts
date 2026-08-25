import { describe, expect, it } from 'vitest';
import {
  HASS_TOKENS_KEY,
  loadHaLiveConfig,
  mapHassEntitiesToMock,
  normalizeHassUrl,
  persistHaOAuthSession,
  validateHassUrl,
} from './haLive';
import type { HassEntities } from 'home-assistant-js-websocket';

describe('Home Assistant URL validation', () => {
  it.each([
    'javascript:alert(1)',
    'ftp://ha.local/file',
    'https://user:pass@ha.example.test',
    'https://ha.example.test?token=secret',
    'https://ha.example.test/#fragment',
    'http://ha.example.test',
  ])('rejects dangerous or insecure public URL %s', (value) => {
    expect(validateHassUrl(value).ok).toBe(false);
    expect(normalizeHassUrl(value)).toBe('');
  });

  it('allows HTTPS and warns for HTTP only on local/LAN hosts', () => {
    expect(validateHassUrl('https://ha.example.test/')).toEqual({ ok: true, url: 'https://ha.example.test' });
    expect(validateHassUrl('http://homeassistant.local:8123').ok).toBe(true);
    expect(validateHassUrl('http://192.168.1.10:8123')).toMatchObject({ ok: true, warning: expect.any(String) });
  });
});

describe('Home Assistant OAuth persistence', () => {
  it('stores refreshable OAuth auth separately and clears the manual-token mode', () => {
    window.localStorage.clear();
    window.localStorage.setItem(
      'ha-external-dashboard:ha-live:v1',
      JSON.stringify({
        url: 'https://old.example.test',
        token: 'old-manual-token',
        rememberToken: true,
      }),
    );

    persistHaOAuthSession({
      hassUrl: 'https://ha.example.test',
      clientId: 'https://dashboard.example.test',
      tokens: {
        accessToken: 'oauth-access-token',
        refreshToken: 'oauth-refresh-token',
        expiresIn: 1800,
        tokenType: 'Bearer',
      },
    });

    expect(loadHaLiveConfig()).toEqual({
      url: 'https://ha.example.test',
      token: '',
      rememberToken: false,
    });
    expect(JSON.parse(window.localStorage.getItem(HASS_TOKENS_KEY) ?? '{}')).toMatchObject({
      hassUrl: 'https://ha.example.test',
      access_token: 'oauth-access-token',
      refresh_token: 'oauth-refresh-token',
    });
  });
});

describe('Home Assistant climate mapping', () => {
  it('reads a target setpoint alias when an integration omits the standard temperature attribute', () => {
    const entities = {
      'climate.test': {
        entity_id: 'climate.test',
        state: 'heat',
        attributes: {
          current_temperature: 20.5,
          target_temperature: 22,
          min_temp: 7,
          max_temp: 35,
        },
      },
    } as unknown as HassEntities;

    expect(mapHassEntitiesToMock(entities, 'https://ha.example.test')['climate.test']?.targetValue).toBe(22);
  });
});
