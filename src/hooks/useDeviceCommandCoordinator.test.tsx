import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDeviceCommandCoordinator } from './useDeviceCommandCoordinator';

describe('useDeviceCommandCoordinator', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits for the entity state before confirming a command', async () => {
    const confirmed = vi.fn();
    const { result, rerender } = renderHook(
      ({ entities }) => useDeviceCommandCoordinator({ entities, isReliable: true }),
      { initialProps: { entities: { 'light.test': { state: 'off' } } } },
    );

    await act(async () => {
      expect(await result.current.run({
        entityId: 'light.test',
        domain: 'light',
        service: 'turn_on',
        send: async () => true,
        confirm: (entity) => entity?.state === 'on',
        onConfirmed: confirmed,
      })).toBe(true);
    });
    expect(result.current.statuses['light.turn_on:light.test']?.phase).toBe('awaiting_confirmation');

    rerender({ entities: { 'light.test': { state: 'on' } } });
    expect(result.current.statuses['light.turn_on:light.test']?.phase).toBe('confirmed');
    expect(confirmed).toHaveBeenCalledTimes(1);
  });

  it('rolls optimistic state back when the service is rejected', async () => {
    const rollback = vi.fn();
    const { result } = renderHook(() =>
      useDeviceCommandCoordinator({ entities: { 'switch.test': { state: 'off' } }, isReliable: true }),
    );

    await act(async () => {
      expect(await result.current.run({
        entityId: 'switch.test',
        domain: 'switch',
        service: 'turn_on',
        send: async () => false,
        confirm: () => false,
        onRollback: rollback,
      })).toBe(false);
    });
    expect(result.current.statuses['switch.turn_on:switch.test']).toMatchObject({
      phase: 'error',
      rollbackReason: 'service_rejected',
    });
    expect(rollback).toHaveBeenCalledWith('service_rejected', { state: 'off' });
  });

  it('rolls back after a confirmation timeout', async () => {
    vi.useFakeTimers();
    const rollback = vi.fn();
    const { result } = renderHook(() =>
      useDeviceCommandCoordinator({ entities: { 'lock.test': { state: 'locked' } }, isReliable: true }),
    );

    await act(async () => {
      await result.current.run({
        entityId: 'lock.test',
        domain: 'lock',
        service: 'unlock',
        timeoutMs: 600,
        send: async () => true,
        confirm: (entity) => entity?.state === 'unlocked',
        onRollback: rollback,
      });
    });
    act(() => vi.advanceTimersByTime(601));
    expect(result.current.statuses['lock.unlock:lock.test']).toMatchObject({
      phase: 'rollback',
      rollbackReason: 'confirmation_timeout',
    });
    expect(rollback).toHaveBeenCalledTimes(1);
  });

  it('confirms momentary commands from the accepted service response', async () => {
    const confirmed = vi.fn();
    const { result } = renderHook(() =>
      useDeviceCommandCoordinator({ entities: { 'media_player.test': { state: 'playing' } }, isReliable: true }),
    );

    await act(async () => {
      expect(await result.current.run({
        key: 'media-next:media_player.test',
        entityId: 'media_player.test',
        domain: 'media_player',
        service: 'media_next_track',
        confirmation: 'service_response',
        send: async () => true,
        onConfirmed: confirmed,
      })).toBe(true);
    });

    expect(result.current.statuses['media-next:media_player.test']?.phase).toBe('confirmed');
    expect(confirmed).toHaveBeenCalledTimes(1);
  });

  it('does not send commands over an unreliable connection', async () => {
    const send = vi.fn(async () => true);
    const rollback = vi.fn();
    const { result } = renderHook(() =>
      useDeviceCommandCoordinator({ entities: {}, isReliable: false }),
    );

    await act(async () => {
      expect(await result.current.run({
        entityId: 'light.test',
        domain: 'light',
        service: 'turn_on',
        send,
        confirm: () => false,
        onRollback: rollback,
      })).toBe(false);
    });
    expect(send).not.toHaveBeenCalled();
    expect(result.current.statuses['light.turn_on:light.test']?.rollbackReason).toBe('connection_lost');
    expect(rollback).toHaveBeenCalledWith('connection_lost', undefined);
  });

  it('supersedes an older command with the same key and confirms only the latest value', async () => {
    const firstRollback = vi.fn();
    const secondConfirmed = vi.fn();
    const { result, rerender } = renderHook(
      ({ entities }) => useDeviceCommandCoordinator({ entities, isReliable: true }),
      { initialProps: { entities: { 'light.test': { state: 'on', brightness: 20 } } } },
    );

    await act(async () => {
      await result.current.run({
        key: 'light-brightness:light.test',
        entityId: 'light.test',
        domain: 'light',
        service: 'turn_on',
        send: async () => true,
        confirm: (entity) => entity?.brightness === 40,
        onRollback: firstRollback,
      });
      await result.current.run({
        key: 'light-brightness:light.test',
        entityId: 'light.test',
        domain: 'light',
        service: 'turn_on',
        send: async () => true,
        confirm: (entity) => entity?.brightness === 70,
        onConfirmed: secondConfirmed,
      });
    });

    expect(firstRollback).toHaveBeenCalledWith('superseded', { state: 'on', brightness: 20 });
    rerender({ entities: { 'light.test': { state: 'on', brightness: 70 } } });
    expect(result.current.statuses['light-brightness:light.test']?.phase).toBe('confirmed');
    expect(secondConfirmed).toHaveBeenCalledTimes(1);
  });

  it('rolls back an awaiting command when the connection becomes unreliable', async () => {
    const rollback = vi.fn();
    const { result, rerender } = renderHook(
      ({ reliable }) => useDeviceCommandCoordinator({
        entities: { 'cover.test': { state: 'closed' } },
        isReliable: reliable,
      }),
      { initialProps: { reliable: true } },
    );

    await act(async () => {
      await result.current.run({
        entityId: 'cover.test',
        domain: 'cover',
        service: 'open_cover',
        send: async () => true,
        confirm: (entity) => entity?.state === 'open',
        onRollback: rollback,
      });
    });
    rerender({ reliable: false });

    expect(result.current.statuses['cover.open_cover:cover.test']).toMatchObject({
      phase: 'rollback',
      rollbackReason: 'connection_lost',
    });
    expect(rollback).toHaveBeenCalledTimes(1);
  });
});
