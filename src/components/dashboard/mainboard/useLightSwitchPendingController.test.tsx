import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LIGHT_BRIGHTNESS_PENDING_TTL_MS,
  useLightSwitchPendingController,
} from './useLightSwitchPendingController';
import type { MockEntityStateMap } from '../../../types/ha';

describe('useLightSwitchPendingController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clamps pending brightness and expires it after the configured TTL', () => {
    const { result } = renderHook(() =>
      useLightSwitchPendingController({
        haStates: { 'light.test': { state: 'on', brightness: 20 } },
        isHaConnected: true,
      }),
    );

    act(() => result.current.setLightBrightnessPending('light.test', 140));
    expect(result.current.lightBrightnessPendingByEntity['light.test']?.brightness).toBe(100);

    act(() => vi.advanceTimersByTime(LIGHT_BRIGHTNESS_PENDING_TTL_MS + 1));
    expect(result.current.lightBrightnessPendingByEntity['light.test']).toBeUndefined();
  });

  it('clears optimistic state when Home Assistant confirms it', () => {
    const initialStates: MockEntityStateMap = {
      'switch.test': { state: 'off', toggleOn: false },
    };
    const { result, rerender } = renderHook(
      ({ haStates }) =>
        useLightSwitchPendingController({
          haStates,
          isHaConnected: true,
        }),
      { initialProps: { haStates: initialStates } },
    );

    act(() => result.current.setSwitchTogglePending('switch.test', true));
    expect(result.current.switchTogglePendingByEntity['switch.test']?.targetOn).toBe(true);

    rerender({
      haStates: {
        'switch.test': { state: 'on', toggleOn: true },
      },
    });
    expect(result.current.switchTogglePendingByEntity['switch.test']).toBeUndefined();
  });

  it('drops every pending value when the HA connection is lost', () => {
    const { result, rerender } = renderHook(
      ({ isHaConnected }) =>
        useLightSwitchPendingController({
          haStates: { 'light.test': { state: 'off' } },
          isHaConnected,
        }),
      { initialProps: { isHaConnected: true } },
    );

    act(() => {
      result.current.setLightTogglePending('light.test', true);
      result.current.setLightColorPending('light.test', [210, 80]);
    });

    rerender({ isHaConnected: false });
    expect(result.current.lightTogglePendingByEntity).toEqual({});
    expect(result.current.lightColorPendingByEntity).toEqual({});
  });
});
