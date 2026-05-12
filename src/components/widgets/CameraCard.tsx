import React, { useMemo } from 'react';
import { HaCameraCard } from './HaCameraCard';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';

function toTrimmedString(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function isCameraOfflineState(value: string | undefined) {
  const normalized = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalized) {
    return false;
  }
  return ['off', 'offline', 'idle', 'unavailable', 'unknown', 'error', 'problem', 'disconnected'].includes(
    normalized,
  );
}

type CameraCardProps = {
  widget: Widget;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  liveEntity?: MockEntityState;
};

export function CameraCard({ widget, isSelected, isEditMode, onClick, liveEntity }: CameraCardProps) {
  const liveAttributes = liveEntity?.rawAttributes;
  const resolvedName = toTrimmedString(liveAttributes?.friendly_name) ?? widget.title;
  const livePicture = toTrimmedString(liveEntity?.imageUrl) ?? toTrimmedString(liveAttributes?.entity_picture);
  const isLive = !isCameraOfflineState(
    toTrimmedString(liveEntity?.stateLabel) ?? toTrimmedString(liveEntity?.state) ?? widget.status,
  );
  const cardAttributes = useMemo(
    () => ({
      ...(liveAttributes ?? {}),
      entity_id: widget.entityId,
      camera_entity_id: widget.entityId,
      entity_picture: livePicture ?? toTrimmedString(liveAttributes?.entity_picture),
    }),
    [liveAttributes, livePicture, widget.entityId],
  );

  return (
    <div
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl ${
        isSelected ? 'selection-corners' : ''
      }`}
    >
      <div className="pointer-events-none h-full w-full min-h-0 min-w-0">
        <HaCameraCard
          entityId={widget.entityId}
          name={resolvedName}
          attributes={cardAttributes}
          compact={false}
          isLive={isLive}
        />
      </div>
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
        className={`absolute inset-0 rounded-3xl widget-card-handle ${
          isEditMode ? 'cursor-grab' : 'cursor-pointer'
        }`}
        aria-label={`Apri ${widget.title}`}
      />
    </div>
  );
}
