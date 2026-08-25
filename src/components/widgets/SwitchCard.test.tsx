import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Widget } from '../../types/dashboardModels';
import { SwitchCard } from './SwitchCard';

const widget: Widget = {
  id: 'switch-card-test',
  kind: 'switch',
  title: 'Presa test',
  entityId: 'switch.test',
  status: 'on',
  isOn: true,
  layout: { i: 'switch-card-test', x: 0, y: 0, w: 2, h: 1 },
};

describe('SwitchCard', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders switch-specific slots and toggles from the whole surface', () => {
    const onToggleSwitch = vi.fn();
    const { container, getByRole } = render(
      <SwitchCard
        widget={widget}
        isSelected={false}
        isEditMode={false}
        onClick={() => undefined}
        onToggleSwitch={onToggleSwitch}
        liveEntity={{ state: 'on', toggleOn: true, rawAttributes: { device_class: 'outlet' } }}
        consumptionEntity={{ state: '18', numericValue: 18, unit: 'W' }}
      />,
    );

    expect(container.querySelector('.switch-card__icon-shell')).not.toBeNull();
    expect(container.querySelector('.switch-card__control')).toBeNull();
    expect(container.querySelector('.switch-card__consumption')).not.toBeNull();
    expect(container.firstElementChild?.hasAttribute('data-switch-variant')).toBe(false);
    fireEvent.click(getByRole('switch'));
    expect(onToggleSwitch).toHaveBeenCalledOnce();
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
    render(
      <SwitchCard
        widget={widget}
        isSelected={false}
        isEditMode={false}
        onClick={() => undefined}
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

    await waitFor(() => expect(onDisplayMetricsChange).toHaveBeenLastCalledWith({
      widgetId: widget.id,
      width: 192,
      height: 112,
      variant: 'standard',
    }));
  });
});
