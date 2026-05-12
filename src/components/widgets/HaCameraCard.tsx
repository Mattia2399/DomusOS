import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import './HaCameraCard.css';

export interface HaCameraCardProps {
  entityId?: string;
  name: string;
  attributes?: Record<string, unknown>;
  onLongPress?: (entityId: string) => void;
  compact?: boolean;
  isLive?: boolean;
}

function resolveStringAttribute(attributes: Record<string, unknown> | undefined, key: string) {
  const value = attributes?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

export function HaCameraCard({
  entityId,
  name,
  attributes = {},
  onLongPress,
  compact = false,
  isLive = true,
}: HaCameraCardProps) {
  const longPressTimerRef = useRef<number | null>(null);
  const [streamFailed, setStreamFailed] = useState(false);
  const supportsLongPress = Boolean(onLongPress && entityId);

  const cameraEntityId = useMemo(() => {
    const attributeEntity =
      resolveStringAttribute(attributes, 'camera_entity_id') ||
      resolveStringAttribute(attributes, 'entity_id');
    return attributeEntity || entityId || '';
  }, [attributes, entityId]);

  const streamUrl = cameraEntityId
    ? `/api/camera_proxy_stream/${encodeURIComponent(cameraEntityId)}`
    : '';
  const fallbackImage =
    resolveStringAttribute(attributes, 'entity_picture') ||
    resolveStringAttribute(attributes, 'cameraUrl');
  const visualUrl = streamFailed ? fallbackImage : streamUrl || fallbackImage;
  const hasVisual = visualUrl.length > 0;

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

  useEffect(() => {
    setStreamFailed(false);
  }, [cameraEntityId, streamUrl, fallbackImage]);

  return (
    <div className={`ha-camera-card ${compact ? 'ha-camera-card--compact' : ''}`}>
      <div
        className="ha-camera-card__surface"
        onPointerDown={startLongPress}
        onPointerUp={stopLongPress}
        onPointerLeave={stopLongPress}
        onPointerCancel={stopLongPress}
      >
        <div className="ha-camera-card__glow" aria-hidden="true" />
        {hasVisual ? (
          <img
            src={visualUrl}
            alt={name || 'Camera stream'}
            className="ha-camera-card__stream"
            onError={() => {
              if (!streamFailed && fallbackImage) {
                setStreamFailed(true);
              }
            }}
          />
        ) : (
          <div className="ha-camera-card__placeholder" aria-hidden="true">
            <Camera className="ha-camera-card__placeholder-icon" />
          </div>
        )}

        <div className="ha-camera-card__scrim" aria-hidden="true" />

        <div className={`ha-camera-card__live-badge ${isLive ? '' : 'ha-camera-card__live-badge--offline'}`}>
          <span className={`ha-camera-card__live-dot ${isLive ? '' : 'ha-camera-card__live-dot--offline'}`} />
          <span className={`ha-camera-card__live-label ${isLive ? '' : 'ha-camera-card__live-label--offline'}`}>
            {isLive ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        <div className="ha-camera-card__footer">
          <div className="ha-camera-card__name">{name || cameraEntityId || 'Camera'}</div>
        </div>
      </div>
    </div>
  );
}

export default HaCameraCard;
