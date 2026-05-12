import React, { useEffect, useMemo, useRef } from 'react';
import { Activity, Droplets, Gauge, SunMedium, Thermometer, Wifi } from 'lucide-react';
import './HaMetricCard.css';

export interface HaMetricCardProps {
  entityId?: string;
  name: string;
  description?: string;
  state: string | number;
  attributes?: {
    unit_of_measurement?: string;
    icon?: string;
  };
  onLongPress?: (entityId: string) => void;
}

function resolveMetricValue(value: string | number) {
  const raw = typeof value === 'number' ? String(value) : String(value ?? '').trim();
  const normalized = raw.toLowerCase();
  if (!raw || normalized === 'unknown' || normalized === 'unavailable' || normalized === 'none') {
    return '--';
  }
  return raw;
}

function resolveMetricTone(unit: string | undefined, icon: string | undefined) {
  const normalizedUnit = (unit ?? '').toLowerCase();
  const normalizedIcon = (icon ?? '').toLowerCase();
  const hint = `${normalizedUnit} ${normalizedIcon}`;

  if (hint.includes('temp') || hint.includes('thermo') || hint.includes('°')) {
    return {
      start: '#FF9C63',
      end: '#FF6B3D',
      glow: 'rgba(255, 120, 77, 0.32)',
    };
  }

  if (hint.includes('humid') || hint.includes('water') || hint.includes('drop') || normalizedUnit === '%') {
    return {
      start: '#4D89FF',
      end: '#2D63F5',
      glow: 'rgba(74, 122, 255, 0.34)',
    };
  }

  if (hint.includes('light') || hint.includes('illumin') || normalizedUnit === 'lx') {
    return {
      start: '#F7C24A',
      end: '#F39A2E',
      glow: 'rgba(246, 176, 65, 0.33)',
    };
  }

  return {
    start: '#85ADFF',
    end: '#5B7DFF',
    glow: 'rgba(133, 173, 255, 0.34)',
  };
}

function MetricGlyph({ unit, icon }: { unit: string | undefined; icon: string | undefined }) {
  const normalizedUnit = (unit ?? '').toLowerCase();
  const normalizedIcon = (icon ?? '').toLowerCase();
  const hint = `${normalizedUnit} ${normalizedIcon}`;

  if (hint.includes('temp') || hint.includes('thermo') || hint.includes('°')) {
    return <Thermometer className="ha-metric-card__icon" />;
  }

  if (hint.includes('humid') || hint.includes('water') || hint.includes('drop') || normalizedUnit === '%') {
    return <Droplets className="ha-metric-card__icon" />;
  }

  if (hint.includes('light') || hint.includes('illumin') || normalizedUnit === 'lx') {
    return <SunMedium className="ha-metric-card__icon" />;
  }

  if (hint.includes('wifi') || hint.includes('mbps') || hint.includes('download')) {
    return <Wifi className="ha-metric-card__icon" />;
  }

  if (hint.includes('pressure') || hint.includes('speed') || hint.includes('gauge') || hint.includes('bar')) {
    return <Gauge className="ha-metric-card__icon" />;
  }

  return <Activity className="ha-metric-card__icon" />;
}

export function HaMetricCard({
  entityId,
  name,
  description,
  state,
  attributes,
  onLongPress,
}: HaMetricCardProps) {
  const longPressTimerRef = useRef<number | null>(null);
  const supportsLongPress = Boolean(onLongPress && entityId);
  const metricValue = useMemo(() => resolveMetricValue(state), [state]);
  const metricUnit = attributes?.unit_of_measurement?.trim() || '';
  const metricIcon = attributes?.icon;
  const tone = useMemo(
    () => resolveMetricTone(metricUnit, metricIcon),
    [metricIcon, metricUnit],
  );

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

  const helperText = description ?? name;

  return (
    <div className="ha-metric-card">
      <div
        className="ha-metric-card__surface"
        style={
          {
            ['--ha-metric-start' as string]: tone.start,
            ['--ha-metric-end' as string]: tone.end,
            ['--ha-metric-glow' as string]: tone.glow,
          } as React.CSSProperties
        }
        onPointerDown={startLongPress}
        onPointerUp={stopLongPress}
        onPointerLeave={stopLongPress}
        onPointerCancel={stopLongPress}
      >
        <div className="ha-metric-card__top-row">
          <span className="ha-metric-card__icon-shell" aria-hidden="true">
            <MetricGlyph unit={metricUnit} icon={metricIcon} />
          </span>
          <span className="ha-metric-card__title-badge">{name}</span>
        </div>

        <div className="ha-metric-card__value-row">
          <span className="ha-metric-card__value">{metricValue}</span>
          {metricUnit ? <span className="ha-metric-card__unit">{metricUnit}</span> : null}
        </div>

        <div className="ha-metric-card__name">{helperText}</div>
      </div>
    </div>
  );
}

export default HaMetricCard;
