import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMediaCommands, type HaCoordinatedCommandArgs } from './useMediaCommands';
import { MEDIA_COMMAND_TTL_MS } from './mainBoardMediaModel';
import type { Widget } from '../../../types/dashboardModels';
import type { MockEntityStateMap } from '../../../types/ha';

const mediaWidget = {
  id: 'media-card',
  kind: 'media',
  entityId: 'media_player.test',
  isOn: false,
  status: 'idle',
  layout: { i: 'media-card', x: 0, y: 0, w: 2, h: 1 },
} as Widget;

function createHarness(overrides: Record<string, unknown> = {}) {
  const runHaCoordinatedCommand = vi.fn(async (_args: HaCoordinatedCommandArgs) => true);
  const updateWidget = vi.fn();
  const resolveMediaLayout = vi.fn((widget: Widget) => widget.layout);
  const speakerActions = {
    toggleSpeakerPlayback: vi.fn(),
    toggleSpeakerPower: vi.fn(),
    previousSpeakerTrack: vi.fn(),
    nextSpeakerTrack: vi.fn(),
    setSpeakerProgress: vi.fn(),
    setSpeakerVolume: vi.fn(),
    toggleSpeakerMute: vi.fn(),
    toggleSpeakerShuffle: vi.fn(),
    cycleSpeakerRepeatMode: vi.fn(),
    setSpeakerOutputDevice: vi.fn(),
    toggleSpeakerGroupMember: vi.fn(),
  };

  const props = {
    activeWidget: mediaWidget,
    isHaConnected: true,
    haStatesForUi: {} as MockEntityStateMap,
    updateWidget,
    resolveMediaLayout,
    runHaCoordinatedCommand,
    contextSpeaker: { durationSeconds: 180, muted: false, shuffleEnabled: false, repeatMode: 'off' },
    isSpeakerPlaying: false,
    speakerActions,
    ...overrides,
  };

  const hook = renderHook(() => useMediaCommands(props));
  return { ...hook, props, runHaCoordinatedCommand, updateWidget, resolveMediaLayout, speakerActions };
}

describe('useMediaCommands', () => {
  it('turns the device on when it is off/standby, or play/pauses otherwise', () => {
    const context = createHarness({
      haStatesForUi: { 'media_player.test': { state: 'off' } } as MockEntityStateMap,
    });

    act(() => {
      context.result.current.toggleMediaPlayback(mediaWidget);
    });

    expect(context.runHaCoordinatedCommand).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'media-playback', domain: 'media_player', service: 'turn_on', timeoutMs: MEDIA_COMMAND_TTL_MS }),
    );
  });

  it('play/pauses toward the opposite state when already on', () => {
    const context = createHarness({
      haStatesForUi: { 'media_player.test': { state: 'playing' } } as MockEntityStateMap,
    });

    act(() => {
      context.result.current.toggleMediaPlayback(mediaWidget);
    });

    const request = context.runHaCoordinatedCommand.mock.calls[0][0];
    expect(request).toMatchObject({ service: 'media_play_pause' });
    expect(request.confirm({ state: 'paused' })).toBe(true);
    expect(request.confirm({ state: 'playing' })).toBe(false);
  });

  it('falls back to the widget updater when a media widget exists but HA is disconnected', () => {
    const context = createHarness({ isHaConnected: false });

    act(() => {
      context.result.current.toggleMediaPlayback(mediaWidget);
    });

    expect(context.runHaCoordinatedCommand).not.toHaveBeenCalled();
    expect(context.updateWidget).toHaveBeenCalledWith('media-card', expect.any(Function));
    const updater = context.updateWidget.mock.calls[0][1];
    expect(updater({ status: 'idle' })).toMatchObject({ status: 'playing', isOn: true });
  });

  it('falls back to the demo speaker singleton when there is no media widget at all', () => {
    const context = createHarness({ isHaConnected: false, activeWidget: undefined });

    act(() => {
      context.result.current.toggleMediaPlayback();
    });

    expect(context.updateWidget).not.toHaveBeenCalled();
    expect(context.speakerActions.toggleSpeakerPlayback).toHaveBeenCalledTimes(1);
  });

  it('dispatches a coordinated volume_set within tolerance', () => {
    const context = createHarness({
      haStatesForUi: { 'media_player.test': { state: 'playing' } } as MockEntityStateMap,
    });

    act(() => {
      context.result.current.setMediaVolume(42.4);
    });

    const request = context.runHaCoordinatedCommand.mock.calls[0][0];
    expect(request).toMatchObject({
      key: 'media-volume',
      domain: 'media_player',
      service: 'volume_set',
      payload: { volume_level: 0.42 },
    });
    expect(request.confirm({ state: 'playing', volumeLevel: 42.6 })).toBe(true);
    expect(request.confirm({ state: 'playing', volumeLevel: 50 })).toBe(false);
  });

  it('sets the demo speaker volume when HA is disconnected', () => {
    const context = createHarness({ isHaConnected: false });

    act(() => {
      context.result.current.setMediaVolume(150);
    });

    expect(context.runHaCoordinatedCommand).not.toHaveBeenCalled();
    expect(context.speakerActions.setSpeakerVolume).toHaveBeenCalledWith(100);
  });

  it('cycles repeat mode off -> all -> one using the live attribute first', () => {
    const context = createHarness({
      haStatesForUi: {
        'media_player.test': { state: 'playing', rawAttributes: { repeat: 'all' } },
      } as MockEntityStateMap,
    });

    act(() => {
      context.result.current.cycleMediaRepeatMode(mediaWidget);
    });

    expect(context.runHaCoordinatedCommand).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'repeat_set', payload: { repeat: 'one' } }),
    );
  });

  it('stops demo playback only when the speaker is currently playing', () => {
    const context = createHarness({ isHaConnected: false, isSpeakerPlaying: true });

    act(() => {
      context.result.current.stopMediaPlayback(mediaWidget);
    });

    expect(context.updateWidget).toHaveBeenCalledWith('media-card', expect.any(Function));
    expect(context.speakerActions.toggleSpeakerPlayback).toHaveBeenCalledTimes(1);
  });
});
