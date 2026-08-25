import { describe, expect, it } from 'vitest';
import { extractSensorHistoryValues, resolveSensorMeta } from './mainBoardSensorModel';
import type { Widget } from '../../../types/dashboardModels';

describe('mainBoardSensorModel', () => {
  it('sorts and downsamples numeric history values', () => {
    expect(
      extractSensorHistoryValues(
        {
          'sensor.temperature': [
            { s: '20', lu: 100 },
            { s: '21', lu: 200 },
            { s: '22', lu: 300 },
          ],
        },
        'sensor.temperature',
        2,
      ),
    ).toEqual([20, 22]);
  });

  it('prefers explicitly associated telemetry entities', () => {
    const widget = {
      id: 'sensor-card',
      kind: 'sensor',
      sensorBatteryEntityId: 'sensor.device_battery',
      sensorConnectionEntityId: 'binary_sensor.device_online',
    } as Widget;

    expect(
      resolveSensorMeta(
        widget,
        { state: '45', rawAttributes: { battery_level: 10 } },
        {
          'sensor.device_battery': { state: '87', unit: '%' },
          'binary_sensor.device_online': { state: 'on' },
        },
      ),
    ).toMatchObject({
      battery: '87%',
      connection: 'Connesso',
      connectionState: 'online',
    });
  });
});
