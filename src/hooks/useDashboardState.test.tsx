import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDashboardState } from './useDashboardState';

describe('useDashboardState weather authority', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('does not fabricate weather data for a real dashboard without a weather entity', async () => {
    const { result } = renderHook(() =>
      useDashboardState({
        haStates: {},
        haStatus: 'connected',
        allowMockFallback: false,
      }),
    );

    await waitFor(() => {
      expect(result.current.state.weather.source).toBe('unavailable');
    });
    expect(result.current.state.weather.available).toBe(false);
    expect(result.current.state.weather.forecast).toEqual([]);
  });

  it('keeps the explicit mock forecast available in Demo', () => {
    const { result } = renderHook(() =>
      useDashboardState({
        haStates: {},
        haStatus: 'disconnected',
        allowMockFallback: true,
      }),
    );

    expect(result.current.state.weather.source).toBe('mock');
    expect(result.current.state.weather.available).toBe(true);
    expect(result.current.state.weather.forecast.length).toBeGreaterThan(0);
  });

  it('distinguishes an offline real dashboard from a missing weather configuration', () => {
    const { result } = renderHook(() =>
      useDashboardState({
        haStates: {},
        haStatus: 'disconnected',
        allowMockFallback: false,
      }),
    );

    expect(result.current.state.weather.source).toBe('offline');
    expect(result.current.state.weather.available).toBe(false);
  });

  it('does not invent a default user name and removes an empty preference', () => {
    window.localStorage.setItem('ha.dashboard.userName', 'Ahang');

    const { result } = renderHook(() => useDashboardState());

    expect(result.current.state.userName).toBe('');
    expect(window.localStorage.getItem('ha.dashboard.userName')).toBeNull();

    act(() => {
      result.current.actions.setUserName('  Mattia  ');
    });
    expect(result.current.state.userName).toBe('Mattia');
    expect(window.localStorage.getItem('ha.dashboard.userName')).toBe('Mattia');

    act(() => {
      result.current.actions.setUserName('   ');
    });
    expect(result.current.state.userName).toBe('');
    expect(window.localStorage.getItem('ha.dashboard.userName')).toBeNull();
  });
});
