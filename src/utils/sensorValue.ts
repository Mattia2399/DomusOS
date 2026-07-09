import type { MockEntityState } from '../types/ha';

export const MAX_SENSOR_DISPLAY_PRECISION = 6;

const SENSOR_UNAVAILABLE_STATES = new Set(['unknown', 'unavailable']);
const DEFAULT_PRECISION_LIMIT = 2;

type SensorPrecisionSpec = {
  baseUnit: string;
  basePrecision: number;
  unitScale?: Record<string, number>;
};

const APPARENT_POWER_SCALE = { mVA: 0.001, VA: 1, kVA: 1_000 };
const AREA_SCALE = {
  'mm²': 0.000001,
  'cm²': 0.0001,
  'm²': 1,
  'km²': 1_000_000,
  'in²': 0.00064516,
  'ft²': 0.09290304,
  'yd²': 0.83612736,
  'mi²': 2_589_988.110336,
  ac: 4_046.8564224,
  ha: 10_000,
};
const PRESSURE_SCALE = {
  mPa: 0.001,
  Pa: 1,
  hPa: 100,
  mbar: 100,
  cbar: 1_000,
  kPa: 1_000,
  bar: 100_000,
  mmHg: 133.322387415,
  mmHG: 133.322387415,
  inHg: 3_386.389,
  'inH₂O': 249.08891,
  psi: 6_894.757293,
};
const CURRENT_SCALE = { 'µA': 0.000001, mA: 0.001, A: 1 };
const DATA_RATE_SCALE = {
  'bit/s': 1,
  'kbit/s': 1_000,
  'Mbit/s': 1_000_000,
  'Gbit/s': 1_000_000_000,
  'B/s': 8,
  'kB/s': 8_000,
  'MB/s': 8_000_000,
  'GB/s': 8_000_000_000,
  'KiB/s': 8_192,
  'MiB/s': 8_388_608,
  'GiB/s': 8_589_934_592,
};
const DATA_SIZE_SCALE = {
  bit: 1,
  kbit: 1_000,
  Mbit: 1_000_000,
  Gbit: 1_000_000_000,
  B: 8,
  kB: 8_000,
  MB: 8_000_000,
  GB: 8_000_000_000,
  TB: 8_000_000_000_000,
  PB: 8_000_000_000_000_000,
  EB: 8_000_000_000_000_000_000,
  ZB: 8_000_000_000_000_000_000_000,
  YB: 8_000_000_000_000_000_000_000_000,
  KiB: 8_192,
  MiB: 8_388_608,
  GiB: 8_589_934_592,
  TiB: 8_796_093_022_208,
  PiB: 9_007_199_254_740_992,
  EiB: 9_223_372_036_854_775_808,
  ZiB: 9_444_732_965_739_290_427_392,
  YiB: 9_671_406_556_917_033_397_649_408,
};
const DISTANCE_SCALE = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1_000,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1_609.344,
  nmi: 1_852,
};
const DURATION_SCALE = { 'µs': 0.000001, ms: 0.001, s: 1, min: 60, h: 3_600, d: 86_400 };
const ENERGY_SCALE = {
  mWh: 0.001,
  Wh: 1,
  kWh: 1_000,
  MWh: 1_000_000,
  GWh: 1_000_000_000,
  TWh: 1_000_000_000_000,
  J: 1 / 3_600,
  kJ: 1 / 3.6,
  MJ: 1_000 / 3.6,
  GJ: 1_000_000 / 3.6,
  cal: 0.001162222,
  kcal: 1.162222,
  Mcal: 1_162.222,
  Gcal: 1_162_222,
};
const FREQUENCY_SCALE = { mHz: 0.001, Hz: 1, kHz: 1_000, MHz: 1_000_000, GHz: 1_000_000_000 };
const VOLUME_SCALE = {
  mL: 0.001,
  L: 1,
  'fl. oz.': 0.0295735295625,
  gal: 3.785411784,
  'ft³': 28.316846592,
  'm³': 1_000,
  CCF: 2_831.6846592,
  MCF: 28_316.846592,
};
const POWER_SCALE = { mW: 0.001, W: 1, kW: 1_000, MW: 1_000_000, GW: 1_000_000_000, TW: 1_000_000_000_000 };
const PRECIPITATION_SCALE = { mm: 0.001, cm: 0.01, in: 0.0254 };
const PRECIPITATION_INTENSITY_SCALE = {
  'mm/d': 1 / 24,
  'mm/h': 1,
  'in/d': 25.4 / 24,
  'in/h': 25.4,
};
const REACTIVE_POWER_SCALE = { mvar: 0.001, var: 1, kvar: 1_000 };
const SPEED_SCALE = {
  'mm/d': 0.001 / 86_400,
  'mm/h': 0.001 / 3_600,
  'mm/s': 0.001,
  'in/d': 0.0254 / 86_400,
  'in/h': 0.0254 / 3_600,
  'in/s': 0.0254,
  'ft/s': 0.3048,
  'm/s': 1,
  'km/h': 1 / 3.6,
  mph: 0.44704,
  kn: 0.514444444,
};
const VOLTAGE_SCALE = { 'µV': 0.000001, mV: 0.001, V: 1, kV: 1_000, MV: 1_000_000 };
const VOLUME_FLOW_RATE_SCALE = {
  'mL/s': 0.001,
  'L/s': 1,
  'L/min': 1 / 60,
  'L/h': 1 / 3_600,
  'm³/s': 1_000,
  'm³/min': 1_000 / 60,
  'm³/h': 1_000 / 3_600,
  'ft³/min': 28.316846592 / 60,
  'gal/min': 3.785411784 / 60,
  'gal/h': 3.785411784 / 3_600,
  'gal/d': 3.785411784 / 86_400,
};
const WEIGHT_SCALE = { 'µg': 0.000001, mg: 0.001, g: 1, kg: 1_000, oz: 28.349523125, lb: 453.59237, st: 6_350.29318 };

// Mirrors Home Assistant's UNITS_PRECISION base table. Unit scales are used to
// apply the same precision adjustment when the displayed unit differs.
const SENSOR_PRECISION_BY_DEVICE_CLASS: Record<string, SensorPrecisionSpec> = {
  absolute_humidity: { baseUnit: 'g/m³', basePrecision: 1, unitScale: { 'mg/m³': 0.001, 'g/m³': 1 } },
  apparent_power: { baseUnit: 'VA', basePrecision: 0, unitScale: APPARENT_POWER_SCALE },
  area: { baseUnit: 'cm²', basePrecision: 0, unitScale: AREA_SCALE },
  atmospheric_pressure: { baseUnit: 'Pa', basePrecision: 0, unitScale: PRESSURE_SCALE },
  blood_glucose_concentration: { baseUnit: 'mg/dL', basePrecision: 0, unitScale: { 'mg/dL': 1, 'mmol/L': 18.0182 } },
  conductivity: { baseUnit: 'µS/cm', basePrecision: 1, unitScale: { 'µS/cm': 1, 'mS/cm': 1_000, 'S/cm': 1_000_000 } },
  current: { baseUnit: 'mA', basePrecision: 0, unitScale: CURRENT_SCALE },
  data_rate: { baseUnit: 'kbit/s', basePrecision: 0, unitScale: DATA_RATE_SCALE },
  data_size: { baseUnit: 'kbit', basePrecision: 0, unitScale: DATA_SIZE_SCALE },
  distance: { baseUnit: 'cm', basePrecision: 0, unitScale: DISTANCE_SCALE },
  duration: { baseUnit: 'ms', basePrecision: 0, unitScale: DURATION_SCALE },
  energy: { baseUnit: 'Wh', basePrecision: 0, unitScale: ENERGY_SCALE },
  energy_distance: { baseUnit: 'km/kWh', basePrecision: 0 },
  energy_storage: { baseUnit: 'Wh', basePrecision: 0, unitScale: ENERGY_SCALE },
  frequency: { baseUnit: 'Hz', basePrecision: 0, unitScale: FREQUENCY_SCALE },
  gas: { baseUnit: 'mL', basePrecision: 0, unitScale: VOLUME_SCALE },
  irradiance: { baseUnit: 'W/m²', basePrecision: 0, unitScale: { 'W/m²': 1, 'BTU/(h·ft²)': 3.15459075 } },
  power: { baseUnit: 'W', basePrecision: 0, unitScale: POWER_SCALE },
  precipitation: { baseUnit: 'cm', basePrecision: 0, unitScale: PRECIPITATION_SCALE },
  precipitation_intensity: { baseUnit: 'mm/h', basePrecision: 0, unitScale: PRECIPITATION_INTENSITY_SCALE },
  pressure: { baseUnit: 'Pa', basePrecision: 0, unitScale: PRESSURE_SCALE },
  reactive_power: { baseUnit: 'var', basePrecision: 0, unitScale: REACTIVE_POWER_SCALE },
  sound_pressure: { baseUnit: 'dB', basePrecision: 0, unitScale: { dB: 1, dBA: 1 } },
  speed: { baseUnit: 'mm/s', basePrecision: 0, unitScale: SPEED_SCALE },
  temperature: { baseUnit: 'K', basePrecision: 1, unitScale: { K: 1, '°C': 1, '°F': 1 } },
  temperature_delta: { baseUnit: 'K', basePrecision: 1, unitScale: { K: 1, '°C': 1, '°F': 1 } },
  voltage: { baseUnit: 'V', basePrecision: 0, unitScale: VOLTAGE_SCALE },
  volume: { baseUnit: 'mL', basePrecision: 0, unitScale: VOLUME_SCALE },
  volume_flow_rate: { baseUnit: 'L/s', basePrecision: 0, unitScale: VOLUME_FLOW_RATE_SCALE },
  volume_storage: { baseUnit: 'mL', basePrecision: 0, unitScale: VOLUME_SCALE },
  water: { baseUnit: 'mL', basePrecision: 0, unitScale: VOLUME_SCALE },
  weight: { baseUnit: 'g', basePrecision: 0, unitScale: WEIGHT_SCALE },
  wind_speed: { baseUnit: 'mm/s', basePrecision: 0, unitScale: SPEED_SCALE },
};

function normalizeUnit(value: unknown) {
  return typeof value === 'string'
    ? value.trim().replaceAll('μ', 'µ').replaceAll('⋅', '·')
    : undefined;
}

function resolveDefaultSensorPrecision(attributes: Record<string, unknown> | undefined, unit?: string) {
  const deviceClass = typeof attributes?.device_class === 'string'
    ? attributes.device_class.trim().toLowerCase()
    : '';
  const spec = SENSOR_PRECISION_BY_DEVICE_CLASS[deviceClass];
  if (!spec) {
    return 0;
  }

  const currentUnit = normalizeUnit(unit ?? attributes?.unit_of_measurement);
  const baseUnit = normalizeUnit(spec.baseUnit);
  if (!currentUnit || !baseUnit || currentUnit === baseUnit || !spec.unitScale) {
    return spec.basePrecision;
  }

  const baseScale = spec.unitScale[baseUnit];
  const currentScale = spec.unitScale[currentUnit];
  if (!baseScale || !currentScale) {
    return spec.basePrecision;
  }

  const ratioLog = Math.log10(currentScale / baseScale);
  const precisionAdjustment = ratioLog > 0 ? Math.floor(ratioLog) : Math.ceil(ratioLog);
  const adjustedPrecision = Math.max(0, spec.basePrecision + precisionAdjustment);
  return Math.min(adjustedPrecision, spec.basePrecision + DEFAULT_PRECISION_LIMIT);
}

export function normalizeSensorDisplayPrecision(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return undefined;
  }
  if (value < 0 || value > MAX_SENSOR_DISPLAY_PRECISION) {
    return undefined;
  }
  return value;
}

export function resolveSensorDisplayPrecision(
  configuredPrecision: unknown,
  attributes?: Record<string, unknown>,
  unit?: string,
): number {
  return (
    normalizeSensorDisplayPrecision(configuredPrecision) ??
    normalizeSensorDisplayPrecision(attributes?.display_precision) ??
    normalizeSensorDisplayPrecision(attributes?.suggested_display_precision) ??
    resolveDefaultSensorPrecision(attributes, unit)
  );
}

export function resolveSensorNumericValue(
  fallbackValue: unknown,
  liveEntity?: MockEntityState,
): number | undefined {
  if (liveEntity) {
    const liveState = liveEntity.state.trim().toLowerCase();
    if (SENSOR_UNAVAILABLE_STATES.has(liveState)) {
      return undefined;
    }
    return typeof liveEntity.numericValue === 'number' && Number.isFinite(liveEntity.numericValue)
      ? liveEntity.numericValue
      : undefined;
  }

  return typeof fallbackValue === 'number' && Number.isFinite(fallbackValue)
    ? fallbackValue
    : undefined;
}

export function formatSensorNumericValue(value: unknown, precision: number): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  const safePrecision = normalizeSensorDisplayPrecision(precision) ?? 0;
  return value.toFixed(safePrecision);
}
