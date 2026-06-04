import React from 'react';
import { Blinds } from 'lucide-react';
import type { MockEntityState } from '../../types/ha';
import type { Widget } from '../../types/dashboardModels';
import {
  normalizeCoverState,
  resolveCoverPosition,
  resolveCoverTiltPosition,
  translateCoverState,
} from '../../utils/coverUtils';
import { useCardSize } from './useCardSize';
import './CoverCard.css';

const COVER_PENDING_ATTRIBUTE_KEY = '__dashboard_pending_cover';

type CoverCardProps = {
  widget: Widget;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  liveEntity?: MockEntityState;
};

function buildStatusLabel(state: string, position: number) {
  const translated = translateCoverState(state);
  if (state === 'unavailable' || state === 'unknown') {
    return translated;
  }
  return `${translated} ${position}%`;
}

export function CoverCard({
  widget,
  isSelected,
  isEditMode,
  onClick,
  liveEntity,
}: CoverCardProps) {
  const { ref: cardRef, density: cardDensity, hasSize: hasCardSize } = useCardSize({
    tinyWidth: 230,
    tinyHeight: 150,
    compactWidth: 340,
    compactHeight: 225,
  });
  const rawAttributes = liveEntity?.rawAttributes;
  const stateValue = normalizeCoverState(
    liveEntity?.stateLabel ??
      liveEntity?.state ??
      widget.status,
  );
  const currentPosition = resolveCoverPosition(
    stateValue,
    rawAttributes?.current_position ?? rawAttributes?.position ?? widget.value,
    typeof widget.value === 'number' ? widget.value : 70,
  );
  const tiltPosition = resolveCoverTiltPosition(
    rawAttributes?.current_tilt_position ?? rawAttributes?.tilt_position ?? widget.coverTiltPosition,
    typeof widget.coverTiltPosition === 'number' ? widget.coverTiltPosition : 50,
  );
  const hasTilt = rawAttributes?.current_tilt_position !== undefined || rawAttributes?.tilt_position !== undefined;
  const blindCoverage = Math.max(0, Math.min(100, 100 - currentPosition));
  const pendingUpdate = rawAttributes?.[COVER_PENDING_ATTRIBUTE_KEY] === true;
  const movingClass =
    stateValue === 'opening'
      ? 'cover-card__blind--moving cover-card__blind--opening'
      : stateValue === 'closing'
        ? 'cover-card__blind--moving cover-card__blind--closing'
        : '';
  const statusLabel = pendingUpdate
    ? `${buildStatusLabel(stateValue, currentPosition)} - Aggiornamento...`
    : buildStatusLabel(stateValue, currentPosition);
  const auraClass =
    stateValue === 'open' || stateValue === 'opening'
      ? 'bg-cyan-500/10'
      : stateValue === 'closing'
        ? 'bg-amber-500/10'
        : 'bg-white/5';
  const isLayoutDense = widget.layout.w <= 1 || widget.layout.h <= 1;
  const isTinyCard = hasCardSize && cardDensity === 'tiny';
  const isDenseCard = isLayoutDense || (hasCardSize && cardDensity !== 'regular');
  const cardRadiusClass = isDenseCard ? 'rounded-[1.55rem]' : 'rounded-3xl';
  const cardPaddingClass = isTinyCard ? 'p-2.5' : isDenseCard ? 'p-3.5' : 'p-5';
  const contentGapClass = isTinyCard ? 'gap-2' : isDenseCard ? 'gap-2.5' : 'gap-4';
  const iconShellClass = isTinyCard ? 'h-7 w-7' : isDenseCard ? 'h-8 w-8' : 'h-9 w-9';
  const iconSize = isTinyCard ? 13 : isDenseCard ? 14 : 16;
  const titleClass = isTinyCard
    ? 'text-[0.88rem] font-semibold text-white leading-tight truncate'
    : isDenseCard
      ? 'text-[0.95rem] font-semibold text-white leading-tight truncate'
      : 'text-base font-semibold text-white leading-tight truncate';
  const statusClass = isTinyCard
    ? 'mt-0.5 text-[0.68rem] text-white/55 truncate'
    : isDenseCard
      ? 'mt-0.5 text-[0.76rem] text-white/55 truncate'
      : 'mt-1 text-sm text-white/55 truncate';
  const pendingClass = isTinyCard
    ? 'mt-0.5 text-[9px] text-slate-200/80'
    : isDenseCard
      ? 'mt-0.5 text-[10px] text-slate-200/80'
      : 'mt-1 text-[11px] text-slate-200/80';
  const tiltClass = isTinyCard
    ? 'mt-0.5 text-[9px] text-white/45'
    : isDenseCard
      ? 'mt-0.5 text-[10px] text-white/45'
      : 'mt-1 text-[11px] text-white/45';
  const railClass = isTinyCard
    ? 'relative h-full min-h-0 w-8 rounded-lg border border-white/10 bg-white/[0.04] overflow-hidden shadow-[inset_0_6px_14px_rgba(0,0,0,0.26)]'
    : isDenseCard
      ? 'relative h-full min-h-0 w-9 rounded-lg border border-white/10 bg-white/[0.04] overflow-hidden shadow-[inset_0_8px_18px_rgba(0,0,0,0.28)]'
      : 'relative h-full min-h-0 w-12 rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden shadow-[inset_0_8px_18px_rgba(0,0,0,0.28)]';
  const showTilt = hasTilt && !isTinyCard;

  return (
    <div
      ref={cardRef}
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden ${cardRadiusClass} ${isSelected ? 'selection-corners' : ''}`}
      onClick={(event) => {
        if (isEditMode) {
          return;
        }
        event.stopPropagation();
        onClick();
      }}
    >
      <div
        className={`relative h-full w-full min-h-0 min-w-0 ${cardRadiusClass} border border-white/5 ${cardPaddingClass} overflow-hidden ${auraClass}`}
      >
        <div className={`pointer-events-none absolute inset-0 ${cardRadiusClass} bg-[radial-gradient(82%_76%_at_0%_0%,rgba(255,255,255,0.08),transparent_72%)]`} />
        <div className={`relative flex h-full min-h-0 min-w-0 items-stretch justify-between ${contentGapClass}`}>
          <div className="flex min-w-0 flex-col justify-between">
            <div className={`${iconShellClass} rounded-full border border-white/10 bg-white/10 flex items-center justify-center text-white/85`}>
              <Blinds size={iconSize} />
            </div>
            <div className="min-w-0">
              <p className={titleClass}>
                {widget.title || 'Tapparella Salotto'}
              </p>
              <p className={statusClass}>{statusLabel}</p>
              {pendingUpdate ? <p className={pendingClass}>Stato in aggiornamento</p> : null}
              {showTilt ? (
                <p className={tiltClass}>{`Tilt ${Math.round((tiltPosition / 100) * 90)} deg`}</p>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 flex items-end">
            <div className={railClass}>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.18))]" />
              <div
                className={`cover-card__blind absolute inset-x-0 top-0 border-b border-white/35 bg-white/30 shadow-[0_8px_16px_rgba(15,23,42,0.22)] ${movingClass}`}
                style={{
                  height: `${blindCoverage}%`,
                  backgroundImage:
                    'repeating-linear-gradient(180deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_1px,rgba(255,255,255,0.08)_1px,rgba(255,255,255,0.08)_8px)',
                }}
              />
            </div>
          </div>
        </div>
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
          className={`absolute inset-0 ${cardRadiusClass} widget-card-handle cursor-grab`}
          aria-label={`Apri ${widget.title}`}
        />
      ) : null}
    </div>
  );
}
