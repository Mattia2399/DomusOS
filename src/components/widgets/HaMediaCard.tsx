import React, { useEffect, useRef } from 'react';
import { Pause, Play, Speaker } from 'lucide-react';
import './HaMediaCard.css';

export interface HaMediaCardProps {
  entityId?: string;
  name: string;
  state: 'playing' | 'paused' | 'idle' | 'unavailable';
  attributes: {
    media_title?: string;
    media_artist?: string;
    entity_picture?: string;
    media_duration?: number;
    media_position?: number;
  };
  onTogglePlay?: () => void;
  onSeek?: (position: number) => void;
  onLongPress?: (entityId: string) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function statusLabel(state: HaMediaCardProps['state']) {
  if (state === 'playing') {
    return 'Riproduzione';
  }
  if (state === 'paused') {
    return 'In pausa';
  }
  if (state === 'unavailable') {
    return 'Non disponibile';
  }
  return 'Inattivo';
}

function formatTime(totalSeconds?: number) {
  if (!Number.isFinite(totalSeconds) || (totalSeconds ?? 0) <= 0) {
    return '00:00';
  }
  const safe = Math.max(0, Math.floor(totalSeconds ?? 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function HaMediaCard({
  entityId,
  name,
  state,
  attributes,
  onTogglePlay,
  onSeek,
  onLongPress,
}: HaMediaCardProps) {
  const longPressTimerRef = useRef<number | null>(null);
  const hasCover = typeof attributes.entity_picture === 'string' && attributes.entity_picture.trim().length > 0;
  const coverUrl = hasCover ? attributes.entity_picture!.trim() : '';
  const rawDuration = Math.floor(Number(attributes.media_duration) || 0);
  const duration = Math.max(0, rawDuration);
  const rawPosition = Math.floor(Number(attributes.media_position) || 0);
  const position = duration > 0 ? clamp(rawPosition, 0, duration) : 0;
  const progress = duration > 0 ? (position / duration) * 100 : 0;
  const hasTiming = duration > 0;
  const playbackStatus = hasTiming
    ? `${statusLabel(state)} - ${formatTime(position)} / ${formatTime(duration)}`
    : statusLabel(state);
  const mediaTitle = attributes.media_title?.trim();
  const mediaArtist = attributes.media_artist?.trim();
  const primaryTrackText = mediaTitle || mediaArtist;
  const secondaryTrackText = mediaTitle && mediaArtist ? mediaArtist : undefined;
  const isExpanded = true;
  const showTrack = Boolean(primaryTrackText || hasCover);
  const showProgress = true;
  const canSeek = Boolean(onSeek) && state !== 'unavailable';
  const canToggle = Boolean(onTogglePlay) && state !== 'unavailable';
  const ActionIcon = state === 'playing' ? Pause : Play;
  const actionLabel = state === 'playing' ? 'Pausa' : 'Riproduci';
  const supportsLongPress = Boolean(onLongPress && entityId);
  const useCoverBackground = state === 'playing' && hasCover;

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startLongPress = () => {
    if (!supportsLongPress) {
      return;
    }
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      onLongPress?.(entityId!);
    }, 500);
  };

  const stopLongPress = () => {
    clearLongPressTimer();
  };

  useEffect(
    () => () => {
      clearLongPressTimer();
    },
    [],
  );

  return (
    <div className={`ha-media-card ha-media-card--${state}`}>
      <div
        className={`ha-media-card__surface ${isExpanded ? 'ha-media-card__surface--expanded' : 'ha-media-card__surface--compact'}`}
        onPointerDown={startLongPress}
        onPointerUp={stopLongPress}
        onPointerLeave={stopLongPress}
        onPointerCancel={stopLongPress}
      >
        <div
          className="ha-media-card__bg"
          style={useCoverBackground ? { backgroundImage: `url("${coverUrl}")` } : undefined}
          aria-hidden="true"
        />
        <div className="ha-media-card__overlay" aria-hidden="true" />

        <div className="ha-media-card__content">
          <div className="ha-media-card__header">
            <div className="ha-media-card__header-left">
              <span className="ha-media-card__icon-shell" aria-hidden="true">
                <Speaker className="ha-media-card__icon" />
              </span>
              <div className="ha-media-card__header-meta">
                <div className="ha-media-card__name">{name}</div>
                <div className="ha-media-card__status">{playbackStatus}</div>
              </div>
            </div>

            <button
              className="ha-media-card__play-toggle"
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onTogglePlay?.();
              }}
              disabled={!canToggle}
              aria-label={actionLabel}
            >
              <ActionIcon className="ha-media-card__play-icon" />
            </button>
          </div>

          {showTrack || showProgress ? (
            <div className="ha-media-card__expand" aria-hidden={!isExpanded}>
              {showTrack ? (
                <div className="ha-media-card__track">
                  <div className="ha-media-card__art">
                    {hasCover ? (
                      <img className="ha-media-card__art-image" src={coverUrl} alt={`Copertina ${name}`} />
                    ) : (
                      <Speaker className="ha-media-card__art-fallback" aria-hidden="true" />
                    )}
                  </div>

                  <div className="ha-media-card__track-meta">
                    {primaryTrackText ? <div className="ha-media-card__track-title">{primaryTrackText}</div> : null}
                    {secondaryTrackText ? (
                      <div className="ha-media-card__track-artist">{secondaryTrackText}</div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {showProgress ? (
                <div className="ha-media-card__progress-block">
                  <input
                    className="ha-media-card__progress"
                    type="range"
                    min={0}
                    max={duration > 0 ? duration : 100}
                    step={1}
                    value={duration > 0 ? position : 0}
                    disabled={!canSeek}
                    onPointerDown={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      event.stopPropagation();
                      if (!onSeek) {
                        return;
                      }
                      const nextPosition = Number(event.target.value);
                      if (!Number.isFinite(nextPosition)) {
                        return;
                      }
                      onSeek(Math.max(0, Math.round(nextPosition)));
                    }}
                    style={
                      {
                        ['--ha-media-progress' as string]: `${progress}%`,
                      } as React.CSSProperties
                    }
                    aria-label={`Posizione ${name}`}
                    aria-valuemin={0}
                    aria-valuemax={duration > 0 ? duration : 100}
                    aria-valuenow={duration > 0 ? position : 0}
                  />

                  <div className="ha-media-card__times">
                    <span>{formatTime(position)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default HaMediaCard;
