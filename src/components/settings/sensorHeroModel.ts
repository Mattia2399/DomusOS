export type SensorHeroStatusTone = 'good' | 'warning' | 'critical' | 'neutral';

export type SensorHeroPresentation = {
  progress: number;
  status?: {
    label: string;
    tone: SensorHeroStatusTone;
  };
  trend?: {
    direction: 'up' | 'down' | 'stable';
    label: string;
  };
};

type SensorHeroPresentationInput = {
  value?: number;
  unit?: string;
  deviceClass?: string;
  history?: number[];
  status?: string;
};

type NumericRange = {
  min: number;
  max: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: string | undefined) {
  return (value ?? '').trim().toLowerCase();
}

function resolveKnownRange(deviceClass: string, unit: string): NumericRange | undefined {
  if (unit === '%' || ['humidity', 'moisture', 'battery', 'power_factor'].includes(deviceClass)) {
    return { min: 0, max: 100 };
  }
  if (deviceClass === 'aqi') return { min: 0, max: 500 };
  if (deviceClass === 'carbon_dioxide') return { min: 400, max: 2000 };
  if (deviceClass === 'ph') return { min: 0, max: 14 };
  if (deviceClass === 'pm25') return { min: 0, max: 100 };
  if (['pm1', 'pm4', 'pm10'].includes(deviceClass)) return { min: 0, max: 250 };
  if (deviceClass === 'wind_direction') return { min: 0, max: 360 };
  if (deviceClass === 'signal_strength') return { min: -100, max: -30 };
  if (['atmospheric_pressure', 'pressure'].includes(deviceClass)) {
    if (unit.includes('kpa')) return { min: 95, max: 105 };
    if (unit.includes('hpa') || unit.includes('mbar') || deviceClass === 'atmospheric_pressure') {
      return { min: 950, max: 1050 };
    }
    if (unit === 'bar') return { min: 0.95, max: 1.05 };
    return undefined;
  }
  if (['temperature', 'temperature_delta'].includes(deviceClass)) {
    return unit.includes('f') ? { min: 14, max: 104 } : { min: -10, max: 40 };
  }
  return undefined;
}

function resolveAdaptiveRange(value: number, history: number[]): NumericRange {
  const values = [...history, value].filter(Number.isFinite);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = maxValue - minValue;

  if (spread > 0) {
    const padding = Math.max(spread * 0.12, Math.abs(maxValue) * 0.02, 0.1);
    return { min: minValue - padding, max: maxValue + padding };
  }
  if (value > 0) return { min: 0, max: value / 0.72 };
  if (value < 0) return { min: value / 0.72, max: 0 };
  return { min: 0, max: 100 };
}

function resolveProgress(value: number | undefined, deviceClass: string, unit: string, history: number[]) {
  if (value === undefined || !Number.isFinite(value)) return 0;
  const range = resolveKnownRange(deviceClass, unit) ?? resolveAdaptiveRange(value, history);
  const span = range.max - range.min;
  if (span <= 0) return 0;
  return clamp((value - range.min) / span, 0, 1);
}

function resolveConfiguredStatus(status: string | undefined, value: number | undefined) {
  const label = status?.trim();
  if (!label) return undefined;
  const normalized = normalize(label);
  if (['on', 'off', 'unknown', 'unavailable', 'sconosciuto', 'non disponibile'].includes(normalized)) {
    return undefined;
  }
  const numericStatus = Number.parseFloat(normalized.replace(',', '.'));
  if (Number.isFinite(numericStatus) && (value === undefined || Math.abs(numericStatus - value) < 0.0001)) {
    return undefined;
  }
  return { label, tone: 'neutral' as const };
}

function resolveQualitativeStatus(value: number | undefined, deviceClass: string, unit: string) {
  if (value === undefined || !Number.isFinite(value)) return undefined;

  if (deviceClass === 'humidity') {
    if (value < 30) return { label: 'Molto bassa', tone: 'critical' as const };
    if (value < 40) return { label: 'Bassa', tone: 'warning' as const };
    if (value <= 60) return { label: 'Ottimale', tone: 'good' as const };
    if (value <= 70) return { label: 'Elevata', tone: 'warning' as const };
    return { label: 'Molto elevata', tone: 'critical' as const };
  }
  if (deviceClass === 'moisture') {
    if (value < 30) return { label: 'Bassa', tone: 'warning' as const };
    if (value <= 70) return { label: 'Ottimale', tone: 'good' as const };
    return { label: 'Elevata', tone: 'warning' as const };
  }
  if (deviceClass === 'aqi') {
    if (value <= 50) return { label: 'Buona', tone: 'good' as const };
    if (value <= 100) return { label: 'Discreta', tone: 'neutral' as const };
    if (value <= 150) return { label: 'Scadente', tone: 'warning' as const };
    return { label: 'Critica', tone: 'critical' as const };
  }
  if (deviceClass === 'carbon_dioxide') {
    if (value <= 800) return { label: 'Ottimale', tone: 'good' as const };
    if (value <= 1200) return { label: 'Moderata', tone: 'neutral' as const };
    if (value <= 2000) return { label: 'Elevata', tone: 'warning' as const };
    return { label: 'Critica', tone: 'critical' as const };
  }
  if (deviceClass === 'pm25') {
    if (value <= 15) return { label: 'Buona', tone: 'good' as const };
    if (value <= 35) return { label: 'Moderata', tone: 'neutral' as const };
    if (value <= 55) return { label: 'Elevata', tone: 'warning' as const };
    return { label: 'Critica', tone: 'critical' as const };
  }
  if (deviceClass === 'pm10') {
    if (value <= 45) return { label: 'Buona', tone: 'good' as const };
    if (value <= 90) return { label: 'Moderata', tone: 'neutral' as const };
    if (value <= 180) return { label: 'Elevata', tone: 'warning' as const };
    return { label: 'Critica', tone: 'critical' as const };
  }
  if (deviceClass === 'temperature') {
    const celsiusValue = unit.includes('f') ? ((value - 32) * 5) / 9 : value;
    if (celsiusValue < 10) return { label: 'Molto bassa', tone: 'critical' as const };
    if (celsiusValue < 18) return { label: 'Bassa', tone: 'warning' as const };
    if (celsiusValue <= 26) return { label: 'Ottimale', tone: 'good' as const };
    if (celsiusValue <= 30) return { label: 'Elevata', tone: 'warning' as const };
    return { label: 'Molto elevata', tone: 'critical' as const };
  }
  if (deviceClass === 'battery' || (unit === '%' && deviceClass.includes('battery'))) {
    if (value <= 20) return { label: 'Critica', tone: 'critical' as const };
    if (value <= 40) return { label: 'Bassa', tone: 'warning' as const };
    return { label: 'Buona', tone: 'good' as const };
  }
  return undefined;
}

function formatTrendPercentage(value: number) {
  const precision = value < 10 ? 1 : 0;
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

function resolveTrend(value: number | undefined, history: number[]) {
  const values = history.filter(Number.isFinite);
  if (value === undefined || !Number.isFinite(value) || values.length === 0) return undefined;

  const lastValue = values[values.length - 1];
  const sameAsCurrent = Math.abs(lastValue - value) < 0.0001;
  const previousValue = sameAsCurrent ? values[values.length - 2] : lastValue;
  if (previousValue === undefined || !Number.isFinite(previousValue)) return undefined;

  const delta = value - previousValue;
  const relativeDelta = Math.abs(previousValue) > 0.0001
    ? (Math.abs(delta) / Math.abs(previousValue)) * 100
    : undefined;
  if (Math.abs(delta) < 0.0001 || (relativeDelta !== undefined && relativeDelta < 0.05)) {
    return { direction: 'stable' as const, label: '→ Stabile nell’ultima ora' };
  }

  const direction = delta > 0 ? 'up' as const : 'down' as const;
  const arrow = direction === 'up' ? '↑' : '↓';
  const deltaLabel = relativeDelta === undefined ? 'variazione' : `${formatTrendPercentage(relativeDelta)}%`;
  return { direction, label: `${arrow} ${deltaLabel} nell’ultima ora` };
}

export function buildSensorHeroPresentation({
  value,
  unit,
  deviceClass,
  history = [],
  status,
}: SensorHeroPresentationInput): SensorHeroPresentation {
  const normalizedDeviceClass = normalize(deviceClass);
  const normalizedUnit = normalize(unit).replace(/°/g, '');
  const finiteHistory = history.filter(Number.isFinite);

  return {
    progress: resolveProgress(value, normalizedDeviceClass, normalizedUnit, finiteHistory),
    status:
      resolveConfiguredStatus(status, value) ??
      resolveQualitativeStatus(value, normalizedDeviceClass, normalizedUnit),
    trend: resolveTrend(value, finiteHistory),
  };
}
