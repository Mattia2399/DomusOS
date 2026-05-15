import React from 'react';
import type { MicroWidget } from '../../../types/dashboardModels';
import type { MockEntityState } from '../../../types/ha';

type MicroSliderProps = {
  widget: MicroWidget;
  state?: MockEntityState;
  sendOnRelease?: boolean;
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

function normalizeSliderMeta(state: MockEntityState | undefined) {
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

export function MicroSlider({ widget, state, sendOnRelease = true, onValueChange }: MicroSliderProps) {
  const label = widget.label?.trim() || state?.rawAttributes?.friendly_name?.toString() || widget.entity;
  const unit =
    (state?.unit ?? state?.rawAttributes?.unit_of_measurement ?? state?.rawAttributes?.native_unit_of_measurement)?.toString() ??
    '';
  const { min, max, step } = React.useMemo(() => normalizeSliderMeta(state), [state]);
  const isDisabled = max <= min;
  const incomingValue = React.useMemo(() => resolveCurrentValue(state, min, max), [max, min, state]);
  const [draftValue, setDraftValue] = React.useState(incomingValue);
  const [isDragging, setIsDragging] = React.useState(false);
  const stepDecimals = React.useMemo(() => resolveStepDecimals(step), [step]);
  const displayDecimals = Math.min(stepDecimals, 4);

  React.useEffect(() => {
    if (!isDragging) {
      setDraftValue(incomingValue);
    }
  }, [incomingValue, isDragging]);

  const sliderPercent = max > min ? ((draftValue - min) / (max - min)) * 100 : 0;
  const formattedValue = `${draftValue.toFixed(displayDecimals)}${unit ? ` ${unit}` : ''}`;

  const commitValue = React.useCallback(
    (value: number) => {
      if (!sendOnRelease || isDisabled) {
        return;
      }
      onValueChange?.(clamp(value, min, max));
    },
    [isDisabled, max, min, onValueChange, sendOnRelease],
  );

  const handleDraftChange = (nextValue: number) => {
    const safeValue = clamp(nextValue, min, max);
    setDraftValue(safeValue);
    if (!sendOnRelease && !isDisabled) {
      onValueChange?.(safeValue);
    }
  };

  const commitFromInput = (target: HTMLInputElement) => {
    const safeValue = clamp(Number(target.value), min, max);
    setDraftValue(safeValue);
    commitValue(safeValue);
  };

  return (
    <div
      className={`min-h-[4.25rem] rounded-2xl border px-3 py-2.5 text-white transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.22)] ${
        isDisabled
          ? 'border-white/8 bg-white/[0.05] opacity-70'
          : 'border-white/10 bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.08]'
      }`}
    >
      <div className="flex h-full min-w-0 flex-col justify-between gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium leading-tight text-white/90">{label}</p>
          <p className="shrink-0 text-[11px] font-semibold leading-tight text-white/72">{formattedValue}</p>
        </div>

        <div
          className={`relative h-10 rounded-full border border-white/10 bg-black/35 ${
            isDisabled ? 'opacity-65' : ''
          }`}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-300/80 to-blue-400/85 transition-[width] duration-150"
            style={{ width: `${Math.max(0, Math.min(100, sliderPercent))}%` }}
          />

          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={draftValue}
            onPointerDown={() => setIsDragging(true)}
            onPointerUp={(event) => {
              setIsDragging(false);
              commitFromInput(event.currentTarget);
            }}
            onPointerCancel={(event) => {
              setIsDragging(false);
              commitFromInput(event.currentTarget);
            }}
            onKeyUp={(event) => {
              if (!sendOnRelease) {
                return;
              }
              if (
                event.key === 'ArrowLeft' ||
                event.key === 'ArrowRight' ||
                event.key === 'ArrowUp' ||
                event.key === 'ArrowDown' ||
                event.key === 'Home' ||
                event.key === 'End' ||
                event.key === 'PageUp' ||
                event.key === 'PageDown'
              ) {
                commitFromInput(event.currentTarget);
              }
            }}
            onBlur={(event) => {
              setIsDragging(false);
              commitFromInput(event.currentTarget);
            }}
            onChange={(event) => handleDraftChange(Number(event.target.value))}
            disabled={isDisabled}
            className={`absolute inset-0 h-full w-full cursor-pointer opacity-0 ${
              isDisabled ? 'cursor-not-allowed' : ''
            }`}
            aria-label={`Slider ${label}`}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={draftValue}
          />
        </div>
      </div>
    </div>
  );
}
