import React from 'react';
import { Activity, Droplets, Gauge, SunMedium, Thermometer, Wifi } from 'lucide-react';
import type { Widget } from '../../types/dashboardModels';
import { getWidgetLogicalSize } from './cardLayout';
import {
  resolveCardDensityByBreakpoint,
  type GridEngineBreakpoint,
} from '../dashboard/dashboardBreakpointConfig';

type SensorCardProps = {
  widget: Widget;
  isSelected: boolean;
  value: number;
  isEditMode: boolean;
  onClick: () => void;
  gridBreakpoint?: GridEngineBreakpoint;
};

function resolveSensorTone(unit: string | undefined, iconHint?: string) {
  const normalizedUnit = (unit ?? '').toLowerCase();
  const normalizedHint = (iconHint ?? '').toLowerCase();
  const hint = `${normalizedUnit} ${normalizedHint}`;
  if (hint.includes('temp') || hint.includes('thermo') || hint.includes('deg')) {
    return 'bg-orange-500/18 border-orange-300/35 text-orange-100';
  }
  if (hint.includes('humid') || hint.includes('water') || hint.includes('drop') || normalizedUnit === '%') {
    return 'bg-blue-500/18 border-blue-300/35 text-blue-100';
  }
  if (hint.includes('light') || hint.includes('illumin') || normalizedUnit === 'lx') {
    return 'bg-amber-500/18 border-amber-300/35 text-amber-100';
  }
  if (hint.includes('wifi') || hint.includes('mbps') || hint.includes('download')) {
    return 'bg-cyan-500/18 border-cyan-300/35 text-cyan-100';
  }
  return 'bg-indigo-500/18 border-indigo-300/35 text-indigo-100';
}

function resolveSensorIcon(unit: string | undefined, iconHint?: string) {
  const normalizedUnit = (unit ?? '').toLowerCase();
  const normalizedHint = (iconHint ?? '').toLowerCase();
  const hint = `${normalizedUnit} ${normalizedHint}`;
  if (hint.includes('temp') || hint.includes('thermo') || hint.includes('deg')) {
    return Thermometer;
  }
  if (hint.includes('humid') || hint.includes('water') || hint.includes('drop') || normalizedUnit === '%') {
    return Droplets;
  }
  if (hint.includes('light') || hint.includes('illumin') || normalizedUnit === 'lx') {
    return SunMedium;
  }
  if (hint.includes('wifi') || hint.includes('mbps') || hint.includes('download')) {
    return Wifi;
  }
  if (hint.includes('pressure') || hint.includes('speed') || hint.includes('gauge') || hint.includes('bar')) {
    return Gauge;
  }
  return Activity;
}

export function SensorCard({ widget, isSelected, value, isEditMode, onClick, gridBreakpoint }: SensorCardProps) {
  const cardDensity = resolveCardDensityByBreakpoint(gridBreakpoint);
  const numeric = Number.isFinite(value) ? Math.round(value) : 0;
  const displayValue = String(numeric);
  const isWifi = widget.unit?.toLowerCase() === 'mbps';
  const unitLabel = isWifi ? `${widget.unit} Download` : widget.unit;
  const logicalSize = getWidgetLogicalSize(widget);
  const isSingleCell = logicalSize.widthUnits <= 1 && logicalSize.heightUnits <= 1;
  const isTinyCard = cardDensity === 'tiny';
  const isCompactCard = cardDensity !== 'regular';
  const cardRadiusClass = isCompactCard ? 'rounded-[1.55rem]' : 'rounded-3xl';
  const sensorTone = resolveSensorTone(unitLabel, widget.title);
  const SensorIcon = resolveSensorIcon(unitLabel, widget.title);
  const statusLine = widget.status?.trim().length ? widget.status : 'Monitoraggio';
  const lastUpdatedLine = 'Ultimo aggiornamento: ora';

  return (
    <div
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden ${cardRadiusClass} ${
        isSelected ? 'selection-corners' : ''
      }`}
    >
      {isSingleCell ? (
        <div
          className={`pointer-events-none relative h-full w-full min-h-0 min-w-0 ${cardRadiusClass} border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden ${
            isTinyCard ? 'px-2 py-1.5' : 'px-2.5 py-2'
          }`}
        >
          <div className={`absolute inset-0 ${cardRadiusClass} bg-[radial-gradient(95%_78%_at_0%_0%,rgba(255,255,255,0.14),transparent_65%)]`} />
          <div className="relative h-full w-full min-h-0 min-w-0 flex flex-col items-center justify-center text-center">
            <div className="flex items-end justify-center gap-1 leading-none">
              <p
                className={`font-semibold tracking-tight text-white ${isTinyCard ? 'text-[1.34rem]' : 'text-[1.52rem]'}`}
              >
                {displayValue}
              </p>
              {unitLabel ? (
                <p className={`pb-[0.1rem] font-semibold text-white/68 ${isTinyCard ? 'text-[0.56rem]' : 'text-[0.62rem]'}`}>
                  {unitLabel}
                </p>
              ) : null}
            </div>
            <p className={`mt-1 max-w-full truncate leading-tight text-white/82 ${isTinyCard ? 'text-[0.65rem]' : 'text-[0.74rem]'}`}>
              {widget.title}
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`pointer-events-none relative h-full w-full min-h-0 min-w-0 ${cardRadiusClass} border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden ${
            isTinyCard ? 'px-2.5 py-2' : isCompactCard ? 'px-3 py-2' : 'px-3.5 py-2.5'
          }`}
        >
          <div className={`absolute inset-0 ${cardRadiusClass} bg-[radial-gradient(95%_78%_at_0%_0%,rgba(255,255,255,0.14),transparent_65%)]`} />
          <div className="relative h-full flex items-center gap-3 min-w-0">
            <div
              className={`${
                isTinyCard ? 'h-8 w-8' : isCompactCard ? 'h-8 w-8' : 'h-9 w-9'
              } shrink-0 rounded-full border flex items-center justify-center ${sensorTone}`}
            >
              <SensorIcon size={isTinyCard ? 14 : isCompactCard ? 15 : 16} />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p
                className={`truncate leading-tight font-normal text-white ${
                  isTinyCard ? 'text-[0.9rem]' : isCompactCard ? 'text-[0.95rem]' : 'text-[1rem]'
                }`}
              >
                {widget.title}
              </p>
              <p
                className={`line-clamp-1 mt-0.5 overflow-hidden text-white/68 ${
                  isTinyCard ? 'text-[0.68rem]' : isCompactCard ? 'text-[0.72rem]' : 'text-[0.78rem]'
                }`}
              >
                {statusLine}
              </p>
              <p className={`mt-0.5 text-white/48 ${isTinyCard ? 'text-[9px]' : isCompactCard ? 'text-[9px]' : 'text-[10px]'}`}>
                {lastUpdatedLine}
              </p>
            </div>
            <div className="min-w-0 shrink-0 text-right">
              <p
                className={`leading-none font-semibold tracking-tight text-white ${
                  isTinyCard ? 'text-[1.22rem]' : isCompactCard ? 'text-[1.3rem]' : 'text-[1.45rem]'
                }`}
              >
                {displayValue}
              </p>
              {unitLabel ? (
                <p
                  className={`mt-0.5 text-white/58 uppercase tracking-[0.14em] ${
                    isTinyCard ? 'text-[0.56rem]' : isCompactCard ? 'text-[0.6rem]' : 'text-[0.66rem]'
                  }`}
                >
                  {unitLabel}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
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
        className={`absolute inset-0 ${cardRadiusClass} widget-card-handle ${
          isEditMode ? 'cursor-grab' : 'cursor-pointer'
        }`}
        aria-label={`Apri ${widget.title}`}
      />
    </div>
  );
}
