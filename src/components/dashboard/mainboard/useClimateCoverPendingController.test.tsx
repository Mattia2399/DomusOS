import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CLIMATE_PENDING_CONFIRMATION_HOLD_MS,
  useClimateCoverPendingController,
} from './useClimateCoverPendingController';

describe('useClimateCoverPendingController', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('keeps a climate target until HA confirms it for the hold interval', () => {
    const { result, rerender } = renderHook(
      ({ target }) =>
        useClimateCoverPendingController({
          haStates: {
            'climate.test': {
              state: 'heat',
              targetValue: target,
              rawAttributes: { temperature: target },
            },
          },
          isHaConnected: true,
        }),
      { initialProps: { target: 20 } },
    );

    act(() => result.current.upsertClimatePending('climate.test', { targetTemp: 23 }));
    rerender({ target: 23 });
    expect(result.current.climatePendingByEntity['climate.test']).toBeDefined();
    act(() => vi.advanceTimersByTime(CLIMATE_PENDING_CONFIRMATION_HOLD_MS + 1));
    expect(result.current.climatePendingByEntity['climate.test']).toBeUndefined();
  });

  it('clears a cover position when the live entity reaches it', () => {
    const { result, rerender } = renderHook(
      ({ position }) =>
        useClimateCoverPendingController({
          haStates: {
            'cover.test': {
              state: position === 100 ? 'open' : 'opening',
              rawAttributes: { current_position: position },
            },
          },
          isHaConnected: true,
        }),
      { initialProps: { position: 30 } },
    );

    act(() => result.current.upsertCoverPending('cover.test', { state: 'opening', position: 100 }));
    rerender({ position: 100 });
    expect(result.current.coverPendingByEntity['cover.test']).toBeUndefined();
  });

  it('drops both domains immediately when HA disconnects', () => {
    const { result, rerender } = renderHook(
      ({ connected }) =>
        useClimateCoverPendingController({
          haStates: {},
          isHaConnected: connected,
        }),
      { initialProps: { connected: true } },
    );
    act(() => {
      result.current.upsertClimatePending('climate.test', { fanMode: 'high' });
      result.current.upsertCoverPending('cover.test', { position: 50 });
    });
    rerender({ connected: false });
    expect(result.current.climatePendingByEntity).toEqual({});
    expect(result.current.coverPendingByEntity).toEqual({});
  });
});
