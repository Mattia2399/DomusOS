import { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Clock3, Plug, Power, ToggleRight, Zap } from 'lucide-react';
import type { MockEntityState } from '../../types/ha';
import { ContextPanelHeader } from './ContextPanelHeader';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';

const SWITCH_TOGGLE_PENDING_ATTRIBUTE_KEY = '__dashboard_pending_switch_toggle';

type SwitchControlsProps = {
  name: string;
  entityId?: string;
  fallbackStatus?: string;
  entity?: MockEntityState;
  consumptionEntityId?: string;
  consumptionEntity?: MockEntityState;
  consumptionHistory?: number[];
  onToggle: () => void;
};

type ResolvedSwitchState = 'on' | 'off' | 'unavailable' | 'unknown';

const CONSUMPTION_HISTORY_WINDOWS = [3, 6, 12, 24] as const;

function normalizeSwitchState(value: string | undefined): ResolvedSwitchState {
  const normalized = (value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (['on', 'active', 'enabled', 'true', 'acceso', 'accesa', 'attivo', 'attiva'].includes(normalized)) {
    return 'on';
  }
  if (['off', 'inactive', 'disabled', 'false', 'spento', 'spenta', 'disattivo', 'disattiva'].includes(normalized)) {
    return 'off';
  }
  if (normalized === 'unavailable') {
    return 'unavailable';
  }
  return 'unknown';
}

function resolvePendingTarget(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'on') {
    return true;
  }
  if (value === 'off') {
    return false;
  }
  return undefined;
}

function toFiniteNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function formatConsumptionValue(value: number) {
  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 100) {
    return Math.round(value).toLocaleString('it-IT');
  }
  if (absoluteValue >= 10) {
    return value.toLocaleString('it-IT', { maximumFractionDigits: 1 });
  }
  return value.toLocaleString('it-IT', { maximumFractionDigits: 2 });
}

function resolveConsumptionLabel(entity: MockEntityState | undefined) {
  const deviceClass = String(entity?.rawAttributes?.device_class ?? '').trim().toLowerCase();
  const unit = (entity?.unit ?? String(entity?.rawAttributes?.unit_of_measurement ?? '')).trim().toLowerCase();
  if (deviceClass === 'power' || ['w', 'kw', 'mw'].includes(unit)) {
    return 'Potenza';
  }
  if (deviceClass === 'energy' || ['wh', 'kwh', 'mwh'].includes(unit)) {
    return 'Energia';
  }
  return 'Consumo';
}

export function SwitchControls({
  name,
  entityId,
  fallbackStatus,
  entity,
  consumptionEntityId,
  consumptionEntity,
  consumptionHistory,
  onToggle,
}: SwitchControlsProps) {
  const [historyHours, setHistoryHours] = useState<(typeof CONSUMPTION_HISTORY_WINDOWS)[number]>(24);
  const pendingTarget = resolvePendingTarget(entity?.rawAttributes?.[SWITCH_TOGGLE_PENDING_ATTRIBUTE_KEY]);
  const resolvedState = normalizeSwitchState(
    typeof entity?.toggleOn === 'boolean'
      ? entity.toggleOn
        ? 'on'
        : 'off'
      : entity?.stateLabel ?? entity?.state ?? fallbackStatus,
  );
  const isUnavailable = resolvedState === 'unavailable' || resolvedState === 'unknown';
  const isOn = pendingTarget ?? (resolvedState === 'on');
  const isPending = pendingTarget !== undefined;
  const stateLabel = isUnavailable
    ? resolvedState === 'unavailable'
      ? 'Non disponibile'
      : 'Stato sconosciuto'
    : isPending
      ? pendingTarget
        ? 'Accensione in corso'
        : 'Spegnimento in corso'
      : isOn
        ? 'Acceso'
        : 'Spento';
  const deviceClass = String(entity?.rawAttributes?.device_class ?? '').trim().toLowerCase();
  const deviceSearchText = `${entityId ?? ''} ${name}`.trim().toLowerCase();
  const isOutlet =
    deviceClass === 'outlet' ||
    ['outlet', 'socket', 'plug', 'presa'].some((token) => deviceSearchText.includes(token));
  const HeaderIcon = isOutlet ? Plug : ToggleRight;
  const deviceTypeLabel = isOutlet ? 'Presa' : 'Interruttore';
  const consumptionValue =
    toFiniteNumber(consumptionEntity?.numericValue) ?? toFiniteNumber(consumptionEntity?.state);
  const consumptionUnit =
    consumptionEntity?.unit?.trim() ||
    String(consumptionEntity?.rawAttributes?.unit_of_measurement ?? '').trim();
  const consumptionName = String(consumptionEntity?.rawAttributes?.friendly_name ?? '').trim();
  const consumptionChartData = useMemo(() => {
    const historyValues = (consumptionHistory ?? []).filter((value) => Number.isFinite(value));
    if (historyValues.length < 2) {
      return [];
    }
    const visiblePoints = Math.max(2, Math.ceil((historyValues.length * historyHours) / 24));
    const values = historyValues.slice(-visiblePoints);
    return values.map((value, index) => ({ index, value }));
  }, [consumptionHistory, historyHours]);
  const consumptionAverage =
    consumptionChartData.length > 0
      ? consumptionChartData.reduce((sum, point) => sum + point.value, 0) / consumptionChartData.length
      : undefined;

  return (
    <div className={CONTEXT_PANEL_LAYOUT.shell}>
      <ContextPanelHeader
        title={name}
        subtitle={stateLabel}
        icon={<HeaderIcon size={21} />}
        fallbackTitle="Switch"
      />

      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <span className="text-sm font-medium text-white/72">Stato</span>
          <span className="text-xs font-semibold text-white/48">{stateLabel}</span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={isUnavailable || isPending}
          className={`group flex min-h-[5rem] w-full items-center justify-between gap-4 rounded-[1.55rem] border px-4 text-left transition-all active:scale-[0.985] disabled:cursor-not-allowed ${
            isOn && !isUnavailable
              ? 'border-white/[0.18] bg-white/[0.15] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_14px_35px_rgba(0,0,0,0.12)]'
              : 'border-white/[0.07] bg-black/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
          } ${isUnavailable ? 'opacity-55' : 'hover:bg-white/[0.12]'}`}
          aria-label={isOn ? `Spegni ${name}` : `Accendi ${name}`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
                isOn && !isUnavailable
                  ? 'border-white bg-white text-slate-950 shadow-[0_8px_22px_rgba(255,255,255,0.18)]'
                  : 'border-white/[0.12] bg-white/[0.06] text-white/65'
              }`}
            >
              <HeaderIcon size={19} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-semibold text-white/92">{stateLabel}</span>
              <span className="mt-0.5 block truncate text-xs text-white/48">{deviceTypeLabel}</span>
            </span>
          </span>
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
              isOn && !isUnavailable
                ? 'border-white/80 bg-white text-slate-950'
                : 'border-white/[0.12] bg-white/[0.05] text-white/68'
            }`}
          >
            <Power size={17} />
          </span>
        </button>
      </div>

      {consumptionEntityId ? (
        <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-white/72">
              <Zap size={15} className="text-[#FFD60A]" />
              {resolveConsumptionLabel(consumptionEntity)}
            </span>
            <span className="max-w-[9rem] truncate text-xs text-white/42">
              {consumptionName || consumptionEntityId}
            </span>
          </div>
          <div className="rounded-[1.55rem] border border-white/[0.07] bg-black/[0.14] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]">
            {consumptionValue !== undefined ? (
              <div className="flex items-end gap-2">
                <span className="text-[2.65rem] font-light leading-none text-white">
                  {formatConsumptionValue(consumptionValue)}
                </span>
                {consumptionUnit ? (
                  <span className="pb-1 text-sm font-semibold text-white/52">{consumptionUnit}</span>
                ) : null}
              </div>
            ) : (
              <p className="text-sm font-medium text-white/58">Dato non disponibile</p>
            )}
            <p className="mt-2 truncate text-xs text-white/38">{consumptionEntityId}</p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 px-1">
            <span className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-white/48">
              <Clock3 size={14} />
              Andamento
            </span>
            <span className="shrink-0 text-xs font-semibold text-white/52">
              {consumptionAverage !== undefined
                ? `Media ${formatConsumptionValue(consumptionAverage)}${consumptionUnit ? ` ${consumptionUnit}` : ''}`
                : 'Media --'}
            </span>
          </div>

          <div className="liquid-segmented-control mt-2">
            <div className="grid grid-cols-4 gap-1">
              {CONSUMPTION_HISTORY_WINDOWS.map((hours) => {
                const active = historyHours === hours;
                return (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setHistoryHours(hours)}
                    className={`flex h-9 min-w-0 items-center justify-center rounded-full text-xs font-semibold transition-all active:scale-[0.96] ${
                      active
                        ? 'liquid-segmented-option-active'
                        : 'liquid-segmented-option-inactive'
                    }`}
                    aria-pressed={active}
                    aria-label={`Mostra ultime ${hours} ore`}
                  >
                    {hours}h
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 h-36 overflow-hidden rounded-[1.55rem] border border-white/[0.07] bg-black/[0.14] px-2 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]">
            {consumptionChartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={consumptionChartData} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="rgba(255,214,10,0.86)"
                    strokeWidth={2.2}
                    fill="rgba(255,214,10,0.10)"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-xs text-white/42">
                Nessun dato storico disponibile
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
