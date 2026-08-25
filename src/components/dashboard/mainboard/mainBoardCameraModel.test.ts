import { describe, expect, it } from 'vitest';
import {
  extractCameraHistoryEntries,
  isCameraOfflineState,
  resolveCameraPtzButtonPressSequence,
  resolveCameraPtzServiceTarget,
} from './mainBoardCameraModel';

describe('mainBoardCameraModel', () => {
  it('normalizes unavailable camera states', () => {
    expect(isCameraOfflineState(' unavailable ')).toBe(true);
    expect(isCameraOfflineState('streaming')).toBe(false);
  });

  it('resolves the first supported PTZ service and its fields', () => {
    const target = resolveCameraPtzServiceTarget({
      onvif: {
        ptz: {
          fields: {
            pan: {},
            tilt: {},
          },
        },
      },
    });

    expect(target?.domain).toBe('onvif');
    expect(target?.service).toBe('ptz');
    expect(target?.fields).toEqual(new Set(['pan', 'tilt']));
  });

  it('maps diagonal PTZ movement to two button presses', () => {
    expect(
      resolveCameraPtzButtonPressSequence('up_right', {
        up: 'button.camera_up',
        right: 'button.camera_right',
      }),
    ).toEqual(['button.camera_up', 'button.camera_right']);
  });

  it('normalizes and sorts camera history', () => {
    expect(
      extractCameraHistoryEntries(
        {
          'binary_sensor.camera_motion': [
            { s: 'off', lu: 100 },
            { s: 'on', lu: 200 },
          ],
        },
        ['binary_sensor.camera_motion'],
      ).map((entry) => entry.state),
    ).toEqual(['on', 'off']);
  });
});
