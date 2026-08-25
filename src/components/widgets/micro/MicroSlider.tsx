import React from 'react';
import GlassSlider from '../../ui/GlassSlider';
import type { MicroWidget } from '../../../types/dashboardModels';
import type { MockEntityState } from '../../../types/ha';

type MicroSliderProps = {
  widget: MicroWidget;
  state?: MockEntityState;
  sendOnRelease?: boolean;
  onValueChange?: (value: number) => void;
};

type CommandPhase = 'idle' | 'pending' | 'sent';

const SEND_DELAY_MS = 2200;
const SENT_BADGE_MS = 900;

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
  const [commandPhase, setCommandPhase] = React.useState<CommandPhase>('idle');
  const stepDecimals = React.useMemo(() => resolveStepDecimals(step), [step]);
  const displayDecimals = Math.min(stepDecimals, 4);
  const sendTimerRef = React.useRef<number | null>(null);
  const sentTimerRef = React.useRef<number | null>(null);
  const queuedValueRef = React.useRef<number | null>(null);

  const clearSendTimer = React.useCallback(() => {
    if (sendTimerRef.current !== null) {
      window.clearTimeout(sendTimerRef.current);
      sendTimerRef.current = null;
    }
  }, []);

  const clearSentTimer = React.useCallback(() => {
    if (sentTimerRef.current !== null) {
      window.clearTimeout(sentTimerRef.current);
      sentTimerRef.current = null;
    }
  }, []);

  const queueSend = React.useCallback(
    (value: number, delayMs: number) => {
      if (!onValueChange) {
        return;
      }
      queuedValueRef.current = value;
      setCommandPhase('pending');
      clearSendTimer();
      clearSentTimer();
      sendTimerRef.current = window.setTimeout(() => {
        const queued = queuedValueRef.current;
        if (queued !== null) {
          onValueChange(queued);
        }
        setCommandPhase('sent');
        sendTimerRef.current = null;
        clearSentTimer();
        sentTimerRef.current = window.setTimeout(() => {
          setCommandPhase('idle');
          sentTimerRef.current = null;
        }, SENT_BADGE_MS);
      }, delayMs);
    },
    [clearSendTimer, clearSentTimer, onValueChange],
  );

  React.useEffect(() => {
    if (commandPhase === 'idle' && !isDragging) {
      setDraftValue(incomingValue);
    }
  }, [commandPhase, incomingValue, isDragging]);

  React.useEffect(
    () => () => {
      clearSendTimer();
      clearSentTimer();
    },
    [clearSendTimer, clearSentTimer],
  );

  const sliderPercent = max > min ? ((draftValue - min) / (max - min)) * 100 : 0;
  const formattedValue = `${draftValue.toFixed(displayDecimals)}${unit ? ` ${unit}` : ''}`;

  const handleDraftChange = (nextValue: number) => {
    const safeValue = clamp(nextValue, min, max);
    setDraftValue(safeValue);
    if (!sendOnRelease && !isDisabled) {
      queueSend(safeValue, 360);
    }
  };

  const commitFromInput = (target: HTMLInputElement) => {
    const safeValue = clamp(Number(target.value), min, max);
    setDraftValue(safeValue);
    if (!isDisabled) {
      queueSend(safeValue, SEND_DELAY_MS);
    }
  };

  const isPending = commandPhase === 'pending';
  const isSent = commandPhase === 'sent';

  return (
    <div
      className={`min-h-[4.25rem] rounded-2xl border px-3 py-2.5 text-[color:var(--ui-text-primary)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_8px_24px_var(--ui-shadow-soft)] ${
        isDisabled
          ? 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] opacity-70'
          : 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] hover:border-[color:var(--ui-border-strong)] hover:bg-[color:var(--ui-fill-secondary)]'
      }`}
    >
      <div className="flex h-full min-w-0 flex-col justify-between gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium leading-tight text-[color:var(--ui-text-primary)]">{label}</p>
          <div className="inline-flex items-center gap-1.5">
            {isPending ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-200/90 border-t-transparent" />
            ) : isSent ? (
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.85)]" />
            ) : null}
            <p className="shrink-0 text-[11px] font-semibold leading-tight text-[color:var(--ui-text-secondary)]">{formattedValue}</p>
          </div>
        </div>

        <div className={`relative h-10 rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] ${isDisabled ? 'opacity-65' : ''}`}>
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-300/80 to-blue-400/85 transition-[width] duration-150"
            style={{ width: `${Math.max(0, Math.min(100, sliderPercent))}%` }}
          />

          <GlassSlider
            variant="overlay"
            min={min}
            max={max}
            step={step}
            value={draftValue}
            onPointerDown={() => setIsDragging(true)}
            onPointerUp={(event) => {
              setIsDragging(false);
              if (sendOnRelease) {
                commitFromInput(event.currentTarget);
              }
            }}
            onPointerCancel={(event) => {
              setIsDragging(false);
              if (sendOnRelease) {
                commitFromInput(event.currentTarget);
              }
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
              if (sendOnRelease) {
                commitFromInput(event.currentTarget);
              }
            }}
            onChange={(event) => handleDraftChange(Number(event.target.value))}
            disabled={isDisabled}
            className={`absolute inset-0 h-full w-full cursor-pointer opacity-0 ${isDisabled ? 'cursor-not-allowed' : ''}`}
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
