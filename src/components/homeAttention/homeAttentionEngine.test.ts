import { describe, expect, it } from 'vitest';
import { buildHomeAttentionItems, createDemoHomeAttentionItems } from './homeAttentionEngine';

const NOW = Date.parse('2026-07-30T10:00:00Z');

describe('homeAttentionEngine', () => {
  it('detects and prioritizes safety, security, openings and low batteries', () => {
    const items = buildHomeAttentionItems({
      runtimeMode: 'real',
      connected: true,
      now: NOW,
      states: {
        'binary_sensor.laundry_leak': {
          state: 'on',
          rawAttributes: {
            friendly_name: 'Sensore lavanderia',
            device_class: 'moisture',
            __last_changed: '2026-07-30T09:58:00Z',
          },
        },
        'lock.front_door': {
          state: 'unlocked',
          rawAttributes: { friendly_name: 'Porta ingresso' },
        },
        'binary_sensor.studio_window': {
          state: 'on',
          rawAttributes: {
            friendly_name: 'Finestra studio',
            device_class: 'window',
            __last_changed: '2026-07-30T09:40:00Z',
          },
        },
        'sensor.motion_battery': {
          state: '9',
          numericValue: 9,
          rawAttributes: { friendly_name: 'Movimento ingresso', device_class: 'battery' },
        },
      },
    });

    expect(items.map((item) => item.category)).toEqual([
      'safety',
      'security',
      'opening',
      'battery',
    ]);
    expect(items[0].severity).toBe('critical');
    expect(items[3].value).toBe(9);
  });

  it('reports unavailable or missing entities only when they are configured in the real dashboard', () => {
    const items = buildHomeAttentionItems({
      runtimeMode: 'real',
      connected: true,
      states: {
        'light.kitchen': {
          state: 'unavailable',
          rawAttributes: { friendly_name: 'Luce cucina' },
        },
        'sensor.unrelated': {
          state: 'unavailable',
          rawAttributes: { friendly_name: 'Sensore non usato' },
        },
      },
      widgets: [
        {
          id: 'light.kitchen',
          kind: 'light',
          title: 'Luce cucina',
          entityId: 'light.kitchen',
          dataSource: 'ha',
          status: 'unavailable',
          isOn: false,
          layout: { i: 'light.kitchen', x: 0, y: 0, w: 1, h: 1 },
        },
        {
          id: 'sensor.missing',
          kind: 'sensor',
          title: 'Sensore esterno',
          entityId: 'sensor.missing',
          dataSource: 'ha',
          status: 'unknown',
          isOn: false,
          layout: { i: 'sensor.missing', x: 1, y: 0, w: 1, h: 1 },
        },
        {
          id: 'sensor.demo',
          kind: 'sensor',
          title: 'Mock',
          entityId: 'sensor.demo',
          dataSource: 'mock',
          status: 'demo',
          isOn: false,
          layout: { i: 'sensor.demo', x: 2, y: 0, w: 1, h: 1 },
        },
      ],
    });

    expect(items.map((item) => item.entityId)).toEqual(['light.kitchen', 'sensor.missing']);
    expect(items.map((item) => item.category)).toEqual(['availability', 'configuration']);
  });

  it('ignores hidden registry entities', () => {
    const items = buildHomeAttentionItems({
      runtimeMode: 'real',
      connected: true,
      states: {
        'binary_sensor.hidden_smoke': {
          state: 'on',
          rawAttributes: { device_class: 'smoke' },
        },
      },
      entityRegistry: [
        {
          entityId: 'binary_sensor.hidden_smoke',
          hiddenBy: 'user',
          deviceClass: 'smoke',
        },
      ],
    });

    expect(items).toEqual([]);
  });

  it('reuses device health for diagnostic entities and primary battery attributes', () => {
    const items = buildHomeAttentionItems({
      runtimeMode: 'real',
      connected: true,
      states: {
        'lock.garage': {
          state: 'locked',
          rawAttributes: { friendly_name: 'Garage', battery_level: 12 },
        },
        'binary_sensor.garage_connectivity': {
          state: 'off',
          rawAttributes: {
            friendly_name: 'Connessione garage',
            device_class: 'connectivity',
          },
        },
      },
      entityRegistry: [
        { entityId: 'lock.garage', deviceId: 'garage-lock' },
        {
          entityId: 'binary_sensor.garage_connectivity',
          deviceId: 'garage-lock',
          deviceClass: 'connectivity',
          entityCategory: 'diagnostic',
        },
      ],
      deviceRegistry: [{ id: 'garage-lock', name: 'Serratura garage' }],
      batteryWarningThreshold: 20,
    });

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'availability',
          deviceId: 'garage-lock',
          entityId: 'binary_sensor.garage_connectivity',
        }),
        expect.objectContaining({
          category: 'battery',
          deviceId: 'garage-lock',
          entityId: 'lock.garage',
          value: 12,
        }),
      ]),
    );
  });

  it('uses explicit simulated items in Demo and never scans live states', () => {
    const items = buildHomeAttentionItems({
      runtimeMode: 'demo',
      connected: true,
      states: {
        'binary_sensor.real_smoke': {
          state: 'on',
          rawAttributes: { device_class: 'smoke' },
        },
      },
      now: NOW,
    });

    expect(items).toEqual(createDemoHomeAttentionItems(NOW));
    expect(items.every((item) => item.source === 'demo')).toBe(true);
    expect(items.some((item) => item.entityId === 'binary_sensor.real_smoke')).toBe(false);
  });

  it('stays silent while the real connection is unavailable', () => {
    expect(buildHomeAttentionItems({
      runtimeMode: 'real',
      connected: false,
      states: {
        'binary_sensor.smoke': {
          state: 'on',
          rawAttributes: { device_class: 'smoke' },
        },
      },
    })).toEqual([]);
  });
});
