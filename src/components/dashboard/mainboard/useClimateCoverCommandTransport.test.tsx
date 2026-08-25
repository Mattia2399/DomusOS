import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CLIMATE_SEND_DELAY_MS,
  useClimateCoverCommandTransport,
} from './useClimateCoverCommandTransport';

function setup() {
  const run = vi.fn();
  const cancel = vi.fn();
  const callHaService = vi.fn(async () => true);
  const clearClimatePendingFields = vi.fn();
  const upsertCoverPending = vi.fn();
  const clearCoverPendingFields = vi.fn();
  const addNotification = vi.fn();
  const hook = renderHook(() =>
    useClimateCoverCommandTransport({
      isHaConnected: true,
      commandCoordinator: { run, cancel },
      callHaService,
      pending: {
        clearClimatePendingFields,
        upsertCoverPending,
        clearCoverPendingFields,
      },
      addNotification,
    }),
  );
  return {
    ...hook,
    run,
    cancel,
    callHaService,
    clearClimatePendingFields,
    upsertCoverPending,
    clearCoverPendingFields,
    addNotification,
  };
}

describe('useClimateCoverCommandTransport', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces climate updates and sends only the latest value', async () => {
    const context = setup();
    act(() => {
      context.result.current.queueClimateCommandDispatch('climate.test', { targetTemp: 21 });
      context.result.current.queueClimateCommandDispatch('climate.test', { targetTemp: 23 });
      vi.advanceTimersByTime(CLIMATE_SEND_DELAY_MS + 1);
    });

    expect(context.run).toHaveBeenCalledTimes(1);
    const request = context.run.mock.calls[0][0];
    await request.send();
    expect(context.callHaService).toHaveBeenCalledWith('climate', 'set_temperature', {
      entity_id: 'climate.test',
      temperature: 23,
    });
    expect(request.confirm({ targetValue: 23 })).toBe(true);
  });

  it('uses the shared optimistic and confirmation lifecycle for cover commands', async () => {
    const context = setup();
    const confirm = vi.fn(() => true);
    act(() => {
      context.result.current.runCoverCommand({
        entityId: 'cover.test',
        key: 'cover-motion',
        service: 'set_cover_position',
        payload: { position: 45 },
        pending: { state: 'opening', position: 45 },
        fields: ['state', 'position'],
        confirm,
      });
    });

    const request = context.run.mock.calls[0][0];
    request.onOptimistic();
    expect(context.upsertCoverPending).toHaveBeenCalledWith('cover.test', {
      state: 'opening',
      position: 45,
    });
    await request.send();
    expect(context.callHaService).toHaveBeenCalledWith('cover', 'set_cover_position', {
      entity_id: 'cover.test',
      position: 45,
    });
    request.onConfirmed();
    expect(context.clearCoverPendingFields).toHaveBeenCalledWith(
      'cover.test',
      ['state', 'position'],
    );
  });
});
