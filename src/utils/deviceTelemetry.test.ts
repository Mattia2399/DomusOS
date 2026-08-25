import { describe, expect, it } from 'vitest';
import {
  resolveDeviceBatteryLevel,
  resolveDeviceConnection,
  resolveDeviceTelemetryEntities,
} from './deviceTelemetry';

describe('device telemetry', () => {
  it('does not invent battery or connection capabilities', () => {
    const entity = { state: 'locked', rawAttributes: { friendly_name: 'Porta' } };

    expect(resolveDeviceBatteryLevel(entity)).toBeUndefined();
    expect(resolveDeviceConnection(entity)).toBeUndefined();
  });

  it('reads battery and connection from the primary entity attributes', () => {
    const entity = {
      state: 'locked',
      rawAttributes: { battery_level: 76.6, connection_status: 'connected' },
    };

    expect(resolveDeviceBatteryLevel(entity)).toBe(77);
    expect(resolveDeviceConnection(entity)).toEqual({ state: 'online', label: 'Connessa' });
  });

  it('uses explicitly associated entities when the main entity has no telemetry', () => {
    const entity = { state: 'locked', rawAttributes: {} };
    const batteryEntity = { state: '42', numericValue: 42, unit: '%' };
    const connectionEntity = { state: 'off', stateLabel: 'Disconnessa' };

    expect(resolveDeviceBatteryLevel(entity, batteryEntity)).toBe(42);
    expect(resolveDeviceConnection(entity, connectionEntity)).toEqual({ state: 'offline', label: 'Disconnessa' });
  });

  it('preserves signal information when RSSI is the supported connection source', () => {
    const entity = { state: 'locked', rawAttributes: { rssi: -67 } };

    expect(resolveDeviceConnection(entity)).toEqual({ state: 'online', label: '-67 dBm' });
  });

  it('automatically discovers diagnostic entities belonging to the same HA device', () => {
    const haStates = {
      'lock.front_door': { state: 'locked' },
      'sensor.front_door_battery': { state: '81', numericValue: 81, rawAttributes: { device_class: 'battery' } },
      'binary_sensor.front_door_connectivity': { state: 'on', rawAttributes: { device_class: 'connectivity' } },
      'sensor.other_battery': { state: '12', numericValue: 12, rawAttributes: { device_class: 'battery' } },
    };
    const entityRegistry = [
      { entityId: 'lock.front_door', deviceId: 'front-door' },
      { entityId: 'sensor.front_door_battery', deviceId: 'front-door', deviceClass: 'battery' },
      { entityId: 'binary_sensor.front_door_connectivity', deviceId: 'front-door', deviceClass: 'connectivity' },
      { entityId: 'sensor.other_battery', deviceId: 'other-device', deviceClass: 'battery' },
    ];

    const selection = resolveDeviceTelemetryEntities({
      mainEntityId: 'lock.front_door',
      haStates,
      entityRegistry,
    });

    expect(selection.batteryEntityId).toBe('sensor.front_door_battery');
    expect(selection.connectionEntityId).toBe('binary_sensor.front_door_connectivity');
    expect(resolveDeviceBatteryLevel(haStates['lock.front_door'], selection.batteryEntity)).toBe(81);
    expect(resolveDeviceConnection(haStates['lock.front_door'], selection.connectionEntity)).toEqual({
      state: 'online',
      label: 'Connessa',
    });
  });

  it('keeps a configured override ahead of automatic device discovery', () => {
    const haStates = {
      'lock.front_door': { state: 'locked' },
      'sensor.front_door_battery': { state: '81', numericValue: 81 },
      'sensor.external_battery': { state: '55', numericValue: 55 },
    };
    const selection = resolveDeviceTelemetryEntities({
      mainEntityId: 'lock.front_door',
      haStates,
      entityRegistry: [
        { entityId: 'lock.front_door', deviceId: 'front-door' },
        { entityId: 'sensor.front_door_battery', deviceId: 'front-door', deviceClass: 'battery' },
      ],
      batteryEntityId: 'sensor.external_battery',
    });

    expect(selection.batteryEntityId).toBe('sensor.external_battery');
    expect(resolveDeviceBatteryLevel(haStates['lock.front_door'], selection.batteryEntity)).toBe(55);
  });
});
