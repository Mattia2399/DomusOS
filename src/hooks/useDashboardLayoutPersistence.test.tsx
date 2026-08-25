import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDashboardLayoutPersistence } from './useDashboardLayoutPersistence';
import type { DashboardSection } from '../types/dashboardModels';

const EMPTY_WIDGETS = [];
const EMPTY_WIDGET_TYPE_OVERRIDES = {};
const EMPTY_RESPONSIVE_LAYOUTS = {};
const EMPTY_WIDGET_LAYOUT_OVERRIDES = {};

describe('useDashboardLayoutPersistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('debounces edits and cancels an older queued write before saveNow', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { result, rerender } = renderHook(
      ({ sections }: { sections: DashboardSection[] }) =>
        useDashboardLayoutPersistence({
          enabled: true,
          runtimeMode: 'demo',
          sections,
          widgets: EMPTY_WIDGETS,
          widgetTypeLayoutOverrides: EMPTY_WIDGET_TYPE_OVERRIDES,
          responsiveLayouts: EMPTY_RESPONSIVE_LAYOUTS,
          widgetLayoutOverrides: EMPTY_WIDGET_LAYOUT_OVERRIDES,
          debounceMs: 220,
        }),
      { initialProps: { sections: [] as DashboardSection[] } },
    );

    expect(result.current.status.phase).toBe('saving');
    act(() => {
      vi.advanceTimersByTime(220);
    });
    expect(result.current.status.phase).toBe('saved');
    expect(setItemSpy).toHaveBeenCalledTimes(1);

    rerender({
      sections: [
        {
          id: 'favorites',
          kind: 'stack-grid' as const,
          layout: { i: 'favorites', x: 0, y: 0, w: 4, h: 4 },
        },
      ],
    });
    expect(result.current.status.phase).toBe('saving');

    act(() => {
      expect(result.current.saveNow().ok).toBe(true);
    });
    expect(setItemSpy).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(setItemSpy).toHaveBeenCalledTimes(2);
  });
});
