import React, { useEffect, useRef } from 'react';
import { Pause, Play, SkipBack, SkipForward, Speaker } from 'lucide-react';
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
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
  onSeek?: (position: number) => void;
  onLongPress?: (entityId: string) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
  onPreviousTrack,
  onNextTrack,
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
  const mediaTitle = attributes.media_title?.trim();
  const mediaArtist = attributes.media_artist?.trim();
  const primaryTrackText = mediaTitle || mediaArtist;
  const secondaryTrackText = mediaTitle && mediaArtist ? mediaArtist : undefined;
  const headerTitle = primaryTrackText || name;
  const headerSubtitle = state === 'idle' ? headerTitle : name;
  const shouldScrollHeaderTitle = headerTitle.length > 24;
  const isExpanded = true;
  const showTrack = Boolean(primaryTrackText || hasCover);
  const showProgress = state === 'playing' || state === 'paused';
  const showTransport = Boolean(onPreviousTrack || onTogglePlay || onNextTrack);
  const canSeek = Boolean(onSeek) && state !== 'unavailable';
  const canToggle = Boolean(onTogglePlay) && state !== 'unavailable';
  const canPrevious = Boolean(onPreviousTrack) && state !== 'unavailable';
  const canNext = Boolean(onNextTrack) && state !== 'unavailable';
  const ActionIcon = state === 'playing' ? Pause : Play;
  const actionLabel = state === 'playing' ? 'Pausa' : 'Riproduci';
  const supportsLongPress = Boolean(onLongPress && entityId);
  const useCoverBackground = hasCover && state !== 'unavailable';

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
                {state === 'playing' && hasCover ? (
                  <img className="ha-media-card__icon-cover" src={coverUrl} alt="" />
                ) : (
                  <Speaker className="ha-media-card__icon" />
                )}
              </span>
              <div className="ha-media-card__header-meta">
                <div className="ha-media-card__name" title={headerTitle}>
                  {shouldScrollHeaderTitle ? (
                    <span className="ha-media-card__name-marquee">
                      <span className="ha-media-card__name-marquee-segment">{headerTitle}</span>
                      <span className="ha-media-card__name-marquee-segment" aria-hidden="true">
                        {headerTitle}
                      </span>
                    </span>
                  ) : (
                    headerTitle
                  )}
                </div>
                <div className="ha-media-card__status" title={headerSubtitle}>
                  {headerSubtitle}
                </div>
              </div>
            </div>
          </div>

          {showTrack || showTransport || showProgress ? (
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

              {showTransport ? (
                <div className="ha-media-card__transport">
                  <button
                    className="ha-media-card__transport-button"
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerUp={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onPreviousTrack?.();
                    }}
                    disabled={!canPrevious}
                    aria-label="Brano precedente"
                  >
                    <SkipBack className="ha-media-card__transport-icon" />
                  </button>

                  <button
                    className="ha-media-card__transport-button ha-media-card__transport-button--primary"
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
                    <ActionIcon className="ha-media-card__transport-icon ha-media-card__transport-icon--primary" />
                  </button>

                  <button
                    className="ha-media-card__transport-button"
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerUp={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onNextTrack?.();
                    }}
                    disabled={!canNext}
                    aria-label="Brano successivo"
                  >
                    <SkipForward className="ha-media-card__transport-icon" />
                  </button>
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
