import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DashboardStateShape } from '../../hooks/useDashboardState';
import type { Widget } from '../../types/dashboardModels';
import { LightCard } from './LightCard';

const widget: Widget = {
  id: 'light-card-test',
  kind: 'light',
  title: 'Luce test',
  entityId: 'light.test',
  status: 'on',
  isOn: true,
  value: 62,
  layout: { i: 'light-card-test', x: 0, y: 0, w: 2, h: 2 },
};

const state = {
  lamp: {
    name: 'Luce test',
    isOn: true,
    brightness: 62,
    status: 'on',
    hsColor: [214, 76],
    colorTemp: 3200,
  },
} as DashboardStateShape;

describe('LightCard', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders stable slots and switches the shared slider to color mode', () => {
    const { container, getByRole } = render(
      <LightCard
        widget={widget}
        state={state}
        isSelected={false}
        isEditMode={false}
        onClick={() => undefined}
        onBrightnessChange={() => undefined}
        onColorChange={() => undefined}
        liveLightState={{ state: 'on', toggleOn: true, brightness: 62, supportedColorModes: ['brightness', 'hs'] }}
      />,
    );

    expect(container.querySelector('.light-card__controls')).not.toBeNull();
    expect(container.querySelector('.light-card__details')).not.toBeNull();
    fireEvent.click(getByRole('button', { name: 'Passa al controllo colore' }));
    expect(container.firstElementChild?.getAttribute('data-light-mode')).toBe('color');
    expect(getByRole('slider').getAttribute('max')).toBe('360');
  });

  it('reports the variant derived from its measured border box', async () => {
    let resizeCallback: ResizeObserverCallback | null = null;
    class ResizeObserverMock {
      constructor(callback: ResizeObserverCallback) { resizeCallback = callback; }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal('cancelAnimationFrame', () => undefined);
    const onDisplayMetricsChange = vi.fn();
    const { container } = render(
      <LightCard
        widget={widget}
        state={state}
        isSelected={false}
        isEditMode={false}
        onClick={() => undefined}
        displayVariant="mini"
        onDisplayMetricsChange={onDisplayMetricsChange}
      />,
    );

    act(() => {
      const callback = resizeCallback as ResizeObserverCallback | null;
      if (!callback) throw new Error('ResizeObserver callback not registered');
      callback([{
        borderBoxSize: [{ inlineSize: 192, blockSize: 112 }],
        contentRect: { width: 192, height: 112 },
      } as unknown as ResizeObserverEntry], {} as ResizeObserver);
    });

    await waitFor(() => expect(container.firstElementChild?.getAttribute('data-light-variant')).toBe('standard'));
    await waitFor(() => expect(onDisplayMetricsChange).toHaveBeenLastCalledWith({
      widgetId: widget.id,
      width: 192,
      height: 112,
      variant: 'standard',
    }));
  });
});
