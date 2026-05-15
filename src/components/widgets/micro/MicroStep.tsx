import React from 'react';
import type { MicroWidget } from '../../../types/dashboardModels';
import type { MockEntityState } from '../../../types/ha';

type MicroStepProps = {
  widget: MicroWidget;
  state?: MockEntityState;
  onValueChange?: (value: number) => void;
};

function parseNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function resolveAttributeNumber(rawAttributes: Record<string, unknown> | undefined, keys: string[]) {
  if (!rawAttributes) {
    return undefined;
  }
  for (const key of keys) {
    const parsed = parseNumber(rawAttributes[key]);
    if (parsed !== undefined) {
      return parsed;
    }
  }
  return undefined;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeStepMeta(state: MockEntityState | undefined) {
  const rawAttributes = state?.rawAttributes;
  const minAttr = resolveAttributeNumber(rawAttributes, ['min', 'native_min_value', 'min_value', 'min_temp']);
  const maxAttr = resolveAttributeNumber(rawAttributes, ['max', 'native_max_value', 'max_value', 'max_temp']);
  const stepAttr = resolveAttributeNumber(rawAttributes, ['step', 'native_step', 'target_temp_step']);

  const hasValidBounds = minAttr !== undefined && maxAttr !== undefined && maxAttr > minAttr;
  const min = hasValidBounds ? minAttr : 0;
  const max = hasValidBounds ? maxAttr : 100;
  const step = stepAttr !== undefined && stepAttr > 0 ? stepAttr : 1;
  return { min, max, step };
}

function resolveCurrentValue(state: MockEntityState | undefined, min: number, max: number) {
  const rawAttributes = state?.rawAttributes;
  const numericState =
    parseNumber(state?.numericValue) ??
    parseNumber(state?.state) ??
    resolveAttributeNumber(rawAttributes, ['value', 'current_value', 'temperature']);
  return clamp(numericState ?? min, min, max);
}

function resolveStepDecimals(step: number) {
  const normalizedStep = Number.isFinite(step) ? Math.abs(step) : 1;
  const stepString = normalizedStep.toString().toLowerCase();
  if (stepString.includes('e-')) {
    const exponent = Number.parseInt(stepString.split('e-')[1] ?? '0', 10);
    return Number.isFinite(exponent) ? Math.max(0, exponent) : 0;
  }
  const decimals = stepString.split('.')[1];
  return decimals ? decimals.length : 0;
}

function alignToStep(value: number, min: number, step: number) {
  const relative = (value - min) / step;
  const aligned = min + Math.round(relative) * step;
  return aligned;
}

export function MicroStep({ widget, state, onValueChange }: MicroStepProps) {
  const label = widget.label?.trim() || state?.rawAttributes?.friendly_name?.toString() || widget.entity;
  const unit =
    (state?.unit ?? state?.rawAttributes?.unit_of_measurement ?? state?.rawAttributes?.native_unit_of_measurement)?.toString() ??
    '';
  const { min, max, step } = React.useMemo(() => normalizeStepMeta(state), [state]);
  const isDisabled = max <= min;
  const currentValue = React.useMemo(() => resolveCurrentValue(state, min, max), [max, min, state]);
  const stepDecimals = React.useMemo(() => resolveStepDecimals(step), [step]);
  const displayDecimals = Math.min(stepDecimals, 4);
  const formattedValue = `${currentValue.toFixed(displayDecimals)}${unit ? ` ${unit}` : ''}`;

  const canDecrease = !isDisabled && currentValue > min;
  const canIncrease = !isDisabled && currentValue < max;

  const handleStep = (direction: 'up' | 'down') => {
    if (isDisabled) {
      return;
    }
    const rawNextValue = direction === 'up' ? currentValue + step : currentValue - step;
    const safeNextValue = clamp(alignToStep(rawNextValue, min, step), min, max);
    onValueChange?.(safeNextValue);
  };

  return (
    <div
      className={`min-h-[4.25rem] rounded-2xl border px-3 py-2.5 text-white transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.22)] ${
        isDisabled
          ? 'border-white/8 bg-white/[0.05] opacity-70'
          : 'border-white/10 bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.08]'
      }`}
    >
      <div className="flex h-full min-w-0 flex-col gap-2">
        <p className="truncate text-sm font-medium leading-tight text-white/90">{label}</p>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2 py-1.5">
          <button
            type="button"
            onClick={() => handleStep('down')}
            disabled={!canDecrease}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/[0.04] text-base font-semibold text-white/88 transition-colors hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-45"
            aria-label={`Riduci ${label}`}
          >
            -
          </button>

          <p className="min-w-0 flex-1 truncate text-center text-[11px] font-semibold leading-tight text-white/78">{formattedValue}</p>

          <button
            type="button"
            onClick={() => handleStep('up')}
            disabled={!canIncrease}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/[0.04] text-base font-semibold text-white/88 transition-colors hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-45"
            aria-label={`Aumenta ${label}`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
