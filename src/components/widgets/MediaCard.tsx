import React, { useEffect, useState } from 'react';
import { HaMediaCard } from './HaMediaCard';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';

type MediaCardProps = {
  widget: Widget;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  onTogglePlayback?: () => void;
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
  onSeek?: (position: number) => void;
  liveEntity?: MockEntityState;
};

type MediaCardState = 'playing' | 'paused' | 'idle' | 'unavailable';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function resolveLiveMediaPosition(
  basePosition: number,
  duration: number,
  state: string | undefined,
  updatedAt: number | undefined,
  nowMs: number,
) {
  if (!(duration > 0)) {
    return 0;
  }
  const safeBase = clamp(Math.round(basePosition || 0), 0, duration);
  const mediaState = (state ?? '').trim().toLowerCase();
  if (mediaState !== 'playing' || !updatedAt || nowMs <= updatedAt) {
    return safeBase;
  }
  const elapsedSeconds = Math.floor((nowMs - updatedAt) / 1000);
  if (elapsedSeconds <= 0) {
    return safeBase;
  }
  return clamp(safeBase + elapsedSeconds, 0, duration);
}

function resolveMediaCardState(status: string | undefined, isOn: boolean): MediaCardState {
  const normalized = (status ?? '').trim().toLowerCase();
  if (normalized.includes('unavailable') || normalized.includes('offline')) {
    return 'unavailable';
  }
  if (normalized.includes('play') || normalized === 'on' || normalized === 'opening') {
    return 'playing';
  }
  if (normalized.includes('pause')) {
    return 'paused';
  }
  if (normalized.includes('idle') || normalized === 'off' || normalized === 'closed') {
    return 'idle';
  }
  return isOn ? 'playing' : 'idle';
}

export function MediaCard({
  widget,
  isSelected,
  isEditMode,
  onClick,
  onTogglePlayback,
  onPreviousTrack,
  onNextTrack,
  onSeek,
  liveEntity,
}: MediaCardProps) {
  const mediaState = resolveMediaCardState(liveEntity?.stateLabel ?? liveEntity?.state ?? widget.status, widget.isOn);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const mediaTitle = liveEntity?.mediaTitle?.trim() || liveEntity?.nowPlaying?.trim();
  const mediaArtist = liveEntity?.mediaArtist?.trim();
  const hasLiveDuration = typeof liveEntity?.mediaDuration === 'number' && Number.isFinite(liveEntity.mediaDuration);
  const hasLivePosition = typeof liveEntity?.mediaPosition === 'number' && Number.isFinite(liveEntity.mediaPosition);
  const hasLiveProgress = typeof liveEntity?.progress === 'number' && Number.isFinite(liveEntity.progress);
  const mediaDuration = hasLiveDuration ? Math.max(1, Math.round(liveEntity!.mediaDuration!)) : 100;
  const progressPercent = hasLiveProgress ? clamp(Math.round(liveEntity!.progress!), 0, 100) : 0;
  const mediaBasePosition = hasLivePosition
    ? clamp(Math.round(liveEntity!.mediaPosition!), 0, Math.max(0, mediaDuration))
    : mediaDuration > 0
      ? clamp(Math.round((progressPercent / 100) * mediaDuration), 0, mediaDuration)
      : 0;
  const mediaPositionUpdatedAt =
    typeof liveEntity?.mediaPositionUpdatedAt === 'number' && Number.isFinite(liveEntity.mediaPositionUpdatedAt)
      ? liveEntity.mediaPositionUpdatedAt
      : undefined;
  const mediaPosition = resolveLiveMediaPosition(
    mediaBasePosition,
    mediaDuration,
    liveEntity?.stateLabel ?? liveEntity?.state ?? widget.status,
    mediaPositionUpdatedAt,
    nowMs,
  );
  const coverUrl = liveEntity?.imageUrl;

  useEffect(() => {
    if (mediaState !== 'playing' || mediaDuration <= 0) {
      return;
    }
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(timerId);
    };
  }, [mediaDuration, mediaState]);

  useEffect(() => {
    setNowMs(Date.now());
  }, [liveEntity?.mediaPositionUpdatedAt, liveEntity?.mediaPosition, liveEntity?.state, liveEntity?.stateLabel]);

  return (
    <div
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl ${isSelected ? 'selection-corners' : ''} ${
        isEditMode ? '' : 'cursor-pointer'
      }`}
      onClick={(event) => {
        if (isEditMode) {
          return;
        }
        event.stopPropagation();
        onClick();
      }}
    >
      <div className={`flex h-full w-full min-h-0 min-w-0 flex-col ${isEditMode ? 'pointer-events-none' : ''}`}>
        <HaMediaCard
          entityId={widget.entityId}
          name={widget.title}
          state={mediaState}
          attributes={{
            media_title: mediaTitle,
            media_artist: mediaArtist,
            entity_picture: coverUrl,
            media_duration: mediaDuration,
            media_position: mediaPosition,
          }}
          onTogglePlay={!isEditMode ? onTogglePlayback : undefined}
          onPreviousTrack={!isEditMode ? onPreviousTrack : undefined}
          onNextTrack={!isEditMode ? onNextTrack : undefined}
          onSeek={!isEditMode ? onSeek : undefined}
        />
      </div>

      {isEditMode ? (
        <div
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              onClick();
            }
          }}
          className="absolute inset-0 rounded-3xl widget-card-handle cursor-grab"
          aria-label={`Apri ${widget.title}`}
        />
      ) : null}
    </div>
  );
}
