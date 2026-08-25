import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVacuumCommands, type HaCoordinatedCommandArgs } from './useVacuumCommands';
import { VACUUM_COMMAND_TTL_MS } from './mainBoardVacuumModel';
import type { DeviceCommandRequest } from '../../../hooks/useDeviceCommandCoordinator';
import type { Widget } from '../../../types/dashboardModels';
import type { MockEntityStateMap } from '../../../types/ha';

const vacuumWidget = {
  id: 'vacuum-card',
  kind: 'vacuum',
  entityId: 'vacuum.test',
  isOn: false,
  status: 'idle',
  layout: { i: 'vacuum-card', x: 0, y: 0, w: 2, h: 1 },
} as Widget;

function createHarness(overrides: Record<string, unknown> = {}) {
  const runHaCoordinatedCommand = vi.fn(async (_args: HaCoordinatedCommandArgs) => true);
  const reportUnconfirmedCommand = vi.fn();
  const callHaService = vi.fn(async () => true);
  const run = vi.fn(async (_request: DeviceCommandRequest) => true);
  const setWidgets = vi.fn();
  const setVacuumStateMocks = vi.fn();
  const updateWidget = vi.fn();
  const vacuumReturnToBaseTimeoutRef = { current: {} as Record<string, number> };

  const props = {
    activeWidget: vacuumWidget,
    isHaConnected: true,
    haStates: {} as MockEntityStateMap,
    haStatesForUi: {} as MockEntityStateMap,
    vacuumStateMocks: {} as MockEntityStateMap,
    setVacuumStateMocks,
    setWidgets,
    updateWidget,
    commandCoordinator: { run },
    callHaService,
    runHaCoordinatedCommand,
    reportUnconfirmedCommand,
    vacuumReturnToBaseTimeoutRef,
    ...overrides,
  };

  const hook = renderHook(() => useVacuumCommands(props));
  return {
    ...hook,
    props,
    runHaCoordinatedCommand,
    reportUnconfirmedCommand,
    callHaService,
    run,
    setWidgets,
    setVacuumStateMocks,
    updateWidget,
  };
}

describe('useVacuumCommands', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('dispatches a coordinated command when HA is connected and the entity is real', () => {
    const context = createHarness({
      haStates: { 'vacuum.test': { state: 'idle' } } as MockEntityStateMap,
    });

    act(() => {
      context.result.current.startVacuum(vacuumWidget);
    });

    expect(context.runHaCoordinatedCommand).toHaveBeenCalledTimes(1);
    const request = context.runHaCoordinatedCommand.mock.calls[0][0];
    expect(request).toMatchObject({
      key: 'vacuum-state',
      entityId: 'vacuum.test',
      domain: 'vacuum',
      service: 'start',
      timeoutMs: VACUUM_COMMAND_TTL_MS,
    });
    expect(request.confirm({ state: 'cleaning' })).toBe(true);
    expect(request.confirm({ state: 'idle' })).toBe(false);
  });

  it('sends locate as a service-response confirmation', () => {
    const context = createHarness({
      haStates: { 'vacuum.test': { state: 'docked' } } as MockEntityStateMap,
    });

    act(() => {
      context.result.current.locateVacuum(vacuumWidget);
    });

    expect(context.runHaCoordinatedCommand).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'vacuum-locate', service: 'locate', confirmation: 'service_response' }),
    );
  });

  it('falls back to local widget/mock mutation when HA is not connected', () => {
    const context = createHarness({ isHaConnected: false });

    act(() => {
      context.result.current.startVacuum(vacuumWidget);
    });

    expect(context.runHaCoordinatedCommand).not.toHaveBeenCalled();
    expect(context.updateWidget).toHaveBeenCalledWith('vacuum-card', expect.any(Function));
    const updater = context.updateWidget.mock.calls[0][1];
    expect(updater({ status: 'idle', isOn: false })).toMatchObject({ status: 'cleaning', isOn: true });
  });

  it('schedules docking after a demo return-to-base command', () => {
    const context = createHarness({ isHaConnected: false });

    act(() => {
      context.result.current.returnVacuumToBase(vacuumWidget);
    });
    expect(context.setWidgets).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3800);
    });

    expect(context.setWidgets).toHaveBeenCalledTimes(1);
    const updater = context.setWidgets.mock.calls[0][0];
    expect(
      updater([{ id: 'vacuum-card', kind: 'vacuum', status: 'returning', isOn: true } as Widget]),
    ).toEqual([{ id: 'vacuum-card', kind: 'vacuum', status: 'docked', isOn: false }]);
  });

  it('toggles between pause and start based on the current state', () => {
    const context = createHarness({
      isHaConnected: true,
      haStates: { 'vacuum.test': { state: 'cleaning' } } as MockEntityStateMap,
      haStatesForUi: { 'vacuum.test': { state: 'cleaning', stateLabel: 'cleaning' } } as MockEntityStateMap,
    });

    act(() => {
      context.result.current.toggleVacuumStartPause(vacuumWidget);
    });

    expect(context.runHaCoordinatedCommand).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'pause' }),
    );
  });

  it('mutates the local mock state for a related-entity action when the entity is a mock', async () => {
    const context = createHarness({
      vacuumStateMocks: {
        'sensor.vacuum_side_brush': { state: '10', stateLabel: '10', toggleOn: false },
      } as MockEntityStateMap,
    });

    await act(async () => {
      await context.result.current.controlVacuumRelatedEntity({
        entityId: 'sensor.vacuum_side_brush',
        action: 'number',
        value: 42,
      });
    });

    expect(context.setVacuumStateMocks).toHaveBeenCalledTimes(1);
    const updater = context.setVacuumStateMocks.mock.calls[0][0];
    expect(
      updater({ 'sensor.vacuum_side_brush': { state: '10', stateLabel: '10', toggleOn: false } }),
    ).toEqual({
      'sensor.vacuum_side_brush': { state: '42', stateLabel: '42', toggleOn: false, numericValue: 42 },
    });
    expect(context.run).not.toHaveBeenCalled();
  });

  it('dispatches a coordinated toggle for a live related entity', async () => {
    const context = createHarness({
      haStatesForUi: {
        'switch.vacuum_child_lock': { state: 'off', toggleOn: false },
      } as MockEntityStateMap,
    });

    await act(async () => {
      await context.result.current.controlVacuumRelatedEntity({
        entityId: 'switch.vacuum_child_lock',
        action: 'toggle',
      });
    });

    expect(context.run).toHaveBeenCalledTimes(1);
    const request = context.run.mock.calls[0][0];
    expect(request).toMatchObject({ entityId: 'switch.vacuum_child_lock', domain: 'switch', service: 'turn_on' });
    await request.send();
    expect(context.callHaService).toHaveBeenCalledWith('switch', 'turn_on', { entity_id: 'switch.vacuum_child_lock' });
  });
});
