import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLightSwitchCommands } from './useLightSwitchCommands';
import type { DeviceCommandRequest } from '../../../hooks/useDeviceCommandCoordinator';
import type { Widget } from '../../../types/dashboardModels';

const lightWidget = {
  id: 'light-card',
  kind: 'light',
  entityId: 'light.test',
  isOn: false,
  value: 20,
  layout: { i: 'light-card', x: 0, y: 0, w: 2, h: 1 },
} as Widget;

function createHarness(overrides: Record<string, unknown> = {}) {
  const requests: DeviceCommandRequest[] = [];
  const callHaService = vi.fn(async () => true);
  const pending = {
    setLightTogglePending: vi.fn(),
    setLightPowerPendingIfChanged: vi.fn(),
    setLightBrightnessPending: vi.fn(),
    setLightColorPending: vi.fn(),
    setSwitchTogglePending: vi.fn(),
    clearLightTogglePending: vi.fn(),
    clearSwitchTogglePending: vi.fn(),
    clearLightCommandPending: vi.fn(),
  };
  const commandCoordinator = {
    cancel: vi.fn(),
    run: vi.fn(async (request: DeviceCommandRequest) => {
      requests.push(request);
      request.onOptimistic?.();
      return true;
    }),
  };
  const updateWidgetWithAutoLayout = vi.fn();
  const actions = {
    toggleLamp: vi.fn(),
    setLampBrightness: vi.fn(),
    setLampColorTemp: vi.fn(),
    setLampHsColor: vi.fn(),
  };

  const props = {
    activeWidget: lightWidget,
    isEditMode: false,
    isHaConnected: true,
    haStatesForUi: {
      'light.test': { state: 'off', toggleOn: false, brightness: 20 },
    },
    commandCoordinator,
    pending,
    callHaService,
    addNotification: vi.fn(),
    actions,
    updateWidgetWithAutoLayout,
    setWidgets: vi.fn(),
    setActiveDevice: vi.fn(),
    resolveLightLayoutForState: (widget: Widget) => widget.layout,
    resolveSwitchLayout: (widget: Widget) => widget.layout,
    resolveAutoWidgetLayoutChanges: (_previous: Widget[], next: Widget[]) => next,
    sameLayout: (left: Widget['layout'], right: Widget['layout']) =>
      left.x === right.x && left.y === right.y && left.w === right.w && left.h === right.h,
    ...overrides,
  };

  return {
    props,
    requests,
    callHaService,
    pending,
    commandCoordinator,
    updateWidgetWithAutoLayout,
    actions,
  };
}

describe('useLightSwitchCommands', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs a coordinated optimistic light toggle', async () => {
    const harness = createHarness();
    const { result } = renderHook(() => useLightSwitchCommands(harness.props));

    act(() => result.current.toggleLightEntity());
    expect(harness.requests[0]).toMatchObject({
      entityId: 'light.test',
      domain: 'light',
      service: 'toggle',
    });
    expect(harness.pending.setLightTogglePending).toHaveBeenCalledWith('light.test', true);
    expect(harness.updateWidgetWithAutoLayout).toHaveBeenCalledWith(
      'light-card',
      expect.any(Function),
    );
  });

  it('debounces brightness and sends the final percentage to HA', async () => {
    const harness = createHarness();
    const { result } = renderHook(() => useLightSwitchCommands(harness.props));

    act(() => {
      result.current.setLightBrightness(72);
      vi.advanceTimersByTime(120);
    });
    const request = harness.requests.at(-1);
    expect(request).toMatchObject({
      entityId: 'light.test',
      domain: 'light',
      service: 'turn_on',
    });
    await act(async () => {
      await request?.send();
    });
    expect(harness.callHaService).toHaveBeenCalledWith('light', 'turn_on', {
      entity_id: 'light.test',
      brightness_pct: 72,
    });
  });

  it('blocks card slider commands while edit mode is active', () => {
    const harness = createHarness({ isEditMode: true });
    const { result } = renderHook(() => useLightSwitchCommands(harness.props));

    act(() => result.current.handleWidgetBrightnessChange(lightWidget, 80));
    expect(harness.commandCoordinator.run).not.toHaveBeenCalled();
    expect(harness.updateWidgetWithAutoLayout).not.toHaveBeenCalled();
  });
});
