import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDashboardEditorHistory } from './useDashboardEditorHistory';

describe('useDashboardEditorHistory', () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('undoes and redoes a completed editor transaction', () => {
    const onApply = vi.fn();
    const { result, rerender } = renderHook(
      ({ current }) => useDashboardEditorHistory({ enabled: true, current, onApply }),
      { initialProps: { current: { value: 0 } } },
    );

    act(() => result.current.beginMutation());
    rerender({ current: { value: 1 } });
    act(() => vi.advanceTimersByTime(260));

    expect(result.current.canUndo).toBe(true);
    act(() => expect(result.current.undo()).toBe(true));
    expect(onApply).toHaveBeenLastCalledWith({ value: 0 });

    rerender({ current: { value: 0 } });
    expect(result.current.canRedo).toBe(true);
    act(() => expect(result.current.redo()).toBe(true));
    expect(onApply).toHaveBeenLastCalledWith({ value: 1 });
  });

  it('groups repeated drag-like updates into a single undo step', () => {
    const onApply = vi.fn();
    const { result, rerender } = renderHook(
      ({ current }) => useDashboardEditorHistory({ enabled: true, current, onApply }),
      { initialProps: { current: { x: 0 } } },
    );

    act(() => result.current.beginMutation());
    rerender({ current: { x: 1 } });
    act(() => vi.advanceTimersByTime(120));
    act(() => result.current.beginMutation());
    rerender({ current: { x: 5 } });
    act(() => vi.advanceTimersByTime(260));

    act(() => expect(result.current.undo()).toBe(true));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({ x: 0 });
  });

  it('does not record mutations while the editor is disabled', () => {
    const onApply = vi.fn();
    const { result, rerender } = renderHook(
      ({ current }) => useDashboardEditorHistory({ enabled: false, current, onApply }),
      { initialProps: { current: { value: 0 } } },
    );

    act(() => result.current.beginMutation());
    rerender({ current: { value: 1 } });
    act(() => vi.advanceTimersByTime(500));

    expect(result.current.canUndo).toBe(false);
    expect(result.current.undo()).toBe(false);
    expect(onApply).not.toHaveBeenCalled();
  });
});
