import React from 'react';
import { AlertTriangle, Battery, Bot, Home, Pause, Play, RotateCw, Square } from 'lucide-react';
import type { VacuumCardModel } from './vacuumCardModel';
import type { WidgetDisplayVariant } from './widgetDisplayVariant';
import './VacuumCard.css';

type VacuumCardViewProps = {
  model: VacuumCardModel;
  layoutVariant: WidgetDisplayVariant;
  isSelected: boolean;
  isEditMode: boolean;
  rootRef?: React.Ref<HTMLDivElement>;
  onOpen: () => void;
  onStartPause?: () => void;
  onStop?: () => void;
  onReturnToBase?: () => void;
};

function PrimaryIcon({ model }: { model: VacuumCardModel }) {
  if (model.primaryAction === 'pause') return <Pause size={15} />;
  if (model.primaryAction === 'details') return <AlertTriangle size={15} />;
  if (model.primaryAction === 'start' || model.primaryAction === 'resume') return <Play size={15} />;
  if (model.state === 'returning') return <RotateCw size={15} />;
  return <Bot size={15} />;
}

export function VacuumCardView({
  model,
  layoutVariant,
  isSelected,
  isEditMode,
  rootRef,
  onOpen,
  onStartPause,
  onStop,
  onReturnToBase,
}: VacuumCardViewProps) {
  const handlePrimaryAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isEditMode || !model.primaryActionEnabled) return;
    if (model.primaryAction === 'details' || model.primaryAction === 'none') {
      onOpen();
      return;
    }
    onStartPause?.();
  };

  const stats = [
    model.cleanedAreaLabel ? { label: 'Area', value: model.cleanedAreaLabel } : null,
    model.cleaningTimeLabel ? { label: 'Tempo', value: model.cleaningTimeLabel } : null,
    model.fanSpeedLabel ? { label: 'Potenza', value: model.fanSpeedLabel } : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

  return (
    <div
      ref={rootRef}
      className={`vacuum-card ${isSelected ? 'selection-corners' : ''}`}
      data-vacuum-variant={layoutVariant}
      data-vacuum-tone={model.tone}
      data-vacuum-state={model.state}
      data-command-pending={model.commandPending ? 'true' : 'false'}
      aria-busy={model.commandPending || undefined}
      data-vacuum-map={model.mapUrl ? 'true' : 'false'}
      onClick={(event) => {
        if (isEditMode) return;
        event.stopPropagation();
        onOpen();
      }}
    >
      <div className="vacuum-card__surface">
        <div className="vacuum-card__glow" aria-hidden="true" />

        <div className="vacuum-card__meta">
          <p className="vacuum-card__title">{model.title}</p>
          <p className="vacuum-card__subtitle">{model.subtitle}</p>
        </div>

        {model.batteryLevel !== undefined ? (
          <div className="vacuum-card__battery" aria-label={`Batteria ${model.batteryLevel}%`}>
            <Battery size={11} />
            <span>{model.batteryLevel}%</span>
          </div>
        ) : null}

        <div className="vacuum-card__visual" aria-hidden="true">
          {model.mapUrl ? <img src={model.mapUrl} alt="" className="vacuum-card__map" /> : null}
          <div className="vacuum-card__floor" />
          <div className="vacuum-card__route vacuum-card__route--one" />
          <div className="vacuum-card__route vacuum-card__route--two" />
          <div className="vacuum-card__robot">
            <span className="vacuum-card__robot-sensor" />
            <Bot size={18} />
          </div>
        </div>

        {stats.length > 0 ? (
          <div className="vacuum-card__stats">
            {stats.slice(0, 3).map((item) => (
              <div key={item.label} className="vacuum-card__stat">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        ) : null}

        <div className="vacuum-card__controls">
          <button
            type="button"
            className="vacuum-card__primary"
            disabled={!model.primaryActionEnabled}
            onClick={handlePrimaryAction}
            aria-label={`${model.primaryActionLabel}: ${model.title}`}
          >
            <PrimaryIcon model={model} />
            <span>{model.primaryActionLabel}</span>
          </button>

          {(layoutVariant === 'standard' || layoutVariant === 'full') && model.supportsReturnHome ? (
            <button
              type="button"
              className="vacuum-card__secondary"
              disabled={!model.isAvailable || model.state === 'docked'}
              onClick={(event) => {
                event.stopPropagation();
                if (!isEditMode) onReturnToBase?.();
              }}
              aria-label={`Torna alla base: ${model.title}`}
            >
              <Home size={15} />
              <span>Base</span>
            </button>
          ) : null}

          {layoutVariant === 'full' && model.supportsStop ? (
            <button
              type="button"
              className="vacuum-card__secondary"
              disabled={!model.isAvailable || !model.isActive}
              onClick={(event) => {
                event.stopPropagation();
                if (!isEditMode) onStop?.();
              }}
              aria-label={`Ferma: ${model.title}`}
            >
              <Square size={13} />
              <span>Stop</span>
            </button>
          ) : null}
        </div>
      </div>

      {isEditMode ? (
        <div
          role="button"
          tabIndex={0}
          className="vacuum-card__edit-handle widget-card-handle"
          aria-label={`Apri ${model.title}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onOpen();
            }
          }}
        />
      ) : null}
    </div>
  );
}
