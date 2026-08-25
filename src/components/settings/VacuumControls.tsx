import React, { useEffect, useMemo, useState } from 'react';
import {
  Battery,
  Bot,
  ChevronRight,
  Home,
  LocateFixed,
  Map as MapIcon,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Square,
  Wrench,
} from 'lucide-react';
import {
  formatVacuumOption,
  normalizeVacuumState,
  translateVacuumState,
} from '../widgets/vacuumCardModel';
import type {
  VacuumDeviceInfo,
  VacuumMappedArea,
  VacuumRelatedEntityInfo,
} from '../widgets/vacuumDeviceModel';
import GlassDropdown, { type GlassDropdownOption } from '../ui/GlassDropdown';
import GlassToggle from '../ui/GlassToggle';
import GlassSlider from '../ui/GlassSlider';
import GlassSegmentSelect from '../ui/GlassSegmentSelect';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';
import { ContextPanelHeader } from './ContextPanelHeader';
import { ContextSecondaryPage } from './ContextSecondaryPage';

export type VacuumRelatedEntityActionRequest = {
  entityId: string;
  action: 'toggle' | 'select' | 'number' | 'press';
  value?: string | number | boolean;
};

type VacuumControlsProps = {
  vacuum: {
    name: string;
    state: string;
    status?: string;
    batteryLevel?: number;
    cleanedArea?: number;
    cleanedAreaUnit?: string;
    cleaningMinutes?: number;
    fanSpeed?: string;
    fanSpeedList?: string[];
    mapUrl?: string;
    supportedFeatures?: number;
    supportsStart?: boolean;
    supportsPause?: boolean;
    supportsStop?: boolean;
    supportsReturnToBase?: boolean;
    supportsLocate?: boolean;
    supportsCleanSpot?: boolean;
    supportsCleanArea?: boolean;
    supportsFanSpeed?: boolean;
    supportsMap?: boolean;
    supportsSendCommand?: boolean;
    deviceInfo?: VacuumDeviceInfo;
    relatedEntities?: VacuumRelatedEntityInfo[];
    rawAttributes?: Record<string, unknown>;
  };
  areaOptions?: VacuumMappedArea[];
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReturnToBase: () => void;
  onLocate: () => void;
  onCleanSpot: () => void;
  onCleanArea: (areaIds: string[]) => void;
  onSetFanSpeed: (fanSpeed: string) => void;
  onSendCommand: (command: string, params?: unknown) => void;
  onRelatedEntityAction?: (request: VacuumRelatedEntityActionRequest) => boolean | void | Promise<boolean | void>;
  onSecondaryPageChange?: (open: boolean) => void;
};

function formatDuration(minutes: number | undefined) {
  if (minutes === undefined || !Number.isFinite(minutes)) return 'N/D';
  const rounded = Math.max(0, Math.round(minutes));
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function formatRelatedValue(entity: VacuumRelatedEntityInfo) {
  const value = entity.stateLabel || entity.state || 'N/D';
  return entity.unit && !value.endsWith(entity.unit) ? `${value} ${entity.unit}` : value;
}

function VacuumHero({
  name,
  state,
  mapUrl,
  batteryLevel,
}: {
  name: string;
  state: ReturnType<typeof normalizeVacuumState>;
  mapUrl?: string;
  batteryLevel?: number;
}) {
  return (
    <div className="relative aspect-[4/3] min-h-[13rem] overflow-hidden rounded-[1.55rem] border border-white/10 bg-slate-950/30 shadow-[inset_0_18px_44px_rgba(0,0,0,0.25)]">
      {mapUrl ? <img src={mapUrl} alt={`Mappa di ${name}`} className="absolute inset-0 h-full w-full object-cover opacity-90" /> : null}
      {!mapUrl ? (
        <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:26px_26px]" />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,24,0.04),rgba(5,12,24,0.48))]" />
      <div className={`absolute left-[58%] top-[58%] grid h-[4.4rem] w-[4.4rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-gradient-to-br from-teal-200/80 to-cyan-500/60 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,.4),0_14px_34px_rgba(0,0,0,.3),0_0_30px_rgba(45,212,191,.2)] ${state === 'cleaning' ? 'animate-[pulse_3.8s_ease-in-out_infinite]' : ''}`}>
        <span className="absolute top-2 h-2 w-2 rounded-full bg-white/80" />
        <Bot size={25} />
      </div>
      <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
        <span className="min-w-0 rounded-full border border-white/12 bg-black/28 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur-xl">
          {translateVacuumState(state)}
        </span>
        {batteryLevel !== undefined ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-black/28 px-2.5 py-1.5 text-[11px] font-semibold text-white/75 backdrop-blur-xl">
            <Battery size={12} /> {Math.round(batteryLevel)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}

function RelatedControl({
  entity,
  onAction,
}: {
  entity: VacuumRelatedEntityInfo;
  onAction?: VacuumControlsProps['onRelatedEntityAction'];
}) {
  const [draftNumber, setDraftNumber] = useState(Number(entity.state) || entity.min || 0);
  useEffect(() => setDraftNumber(Number(entity.state) || entity.min || 0), [entity.entityId, entity.min, entity.state]);

  if (entity.domain === 'switch') {
    const enabled = entity.state === 'on';
    return (
      <div
        className="dashboard-content-surface flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left"
      >
        <span className="min-w-0"><span className="block truncate text-sm font-semibold text-[color:var(--ui-text-primary)]">{entity.name}</span><span className="mt-0.5 block text-[11px] text-[color:var(--ui-text-tertiary)]">{enabled ? 'Attivo' : 'Disattivato'}</span></span>
        <GlassToggle
          checked={enabled}
          label={entity.name}
          onChange={(checked) => onAction?.({ entityId: entity.entityId, action: 'toggle', value: checked })}
          size="compact"
          tone="accent"
        />
      </div>
    );
  }

  if (entity.domain === 'select' && entity.options?.length) {
    const options: GlassDropdownOption[] = entity.options.map((option) => ({ id: option, name: formatVacuumOption(option) }));
    const selected = options.find((option) => option.id === entity.state) ?? options[0] ?? null;
    return (
      <div className="dashboard-content-surface block rounded-2xl px-3 py-2.5">
        <span className="mb-2 block text-sm font-semibold text-[color:var(--ui-text-primary)]">{entity.name}</span>
        <GlassDropdown
          ariaLabel={entity.name}
          options={options}
          selected={selected}
          onChange={(option) => onAction?.({ entityId: entity.entityId, action: 'select', value: option.id })}
          size="compact"
        />
      </div>
    );
  }

  if (entity.domain === 'number' && entity.min !== undefined && entity.max !== undefined) {
    return (
      <label className="dashboard-content-surface block rounded-2xl px-3 py-2.5">
        <span className="flex items-center justify-between gap-3 text-sm font-semibold text-[color:var(--ui-text-primary)]"><span>{entity.name}</span><span className="text-xs text-[color:var(--ui-text-tertiary)]">{draftNumber}{entity.unit ?? ''}</span></span>
        <GlassSlider
          min={entity.min}
          max={entity.max}
          step={entity.step ?? 1}
          value={draftNumber}
          onChange={(event) => setDraftNumber(Number(event.target.value))}
          onPointerUp={() => onAction?.({ entityId: entity.entityId, action: 'number', value: draftNumber })}
          onKeyUp={(event) => {
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) onAction?.({ entityId: entity.entityId, action: 'number', value: draftNumber });
          }}
          className="mt-3"
          tone="accent"
          aria-label={entity.name}
        />
      </label>
    );
  }

  if (entity.domain === 'button') {
    return (
      <button type="button" onClick={() => onAction?.({ entityId: entity.entityId, action: 'press' })} className="glass-button flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-xs font-semibold text-[color:var(--ui-text-secondary)] transition">
        <RotateCcw size={14} /> {entity.name}
      </button>
    );
  }

  return (
    <div className="dashboard-content-surface min-w-0 rounded-2xl p-3">
      <p className="truncate text-[11px] font-medium text-[color:var(--ui-text-tertiary)]">{entity.name}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[color:var(--ui-text-primary)]">{formatRelatedValue(entity)}</p>
    </div>
  );
}

export function VacuumControls({
  vacuum,
  areaOptions = [],
  onStart,
  onPause,
  onStop,
  onReturnToBase,
  onLocate,
  onCleanSpot,
  onCleanArea,
  onSetFanSpeed,
  onRelatedEntityAction,
  onSecondaryPageChange,
}: VacuumControlsProps) {
  const state = normalizeVacuumState(vacuum.state);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [fanSpeed, setFanSpeed] = useState(vacuum.fanSpeed ?? '');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const fanSpeedOptions = useMemo(
    () => Array.from(new Set((vacuum.fanSpeedList ?? []).map((item) => item.trim()).filter(Boolean))),
    [vacuum.fanSpeedList],
  );
  const relatedControls = useMemo(
    () => (vacuum.relatedEntities ?? []).filter((entity) => !['image'].includes(entity.domain)),
    [vacuum.relatedEntities],
  );
  const configurationEntities = relatedControls.filter((entity) => ['switch', 'select', 'number', 'button'].includes(entity.domain));
  const diagnosticEntities = relatedControls.filter((entity) => !['switch', 'select', 'number', 'button'].includes(entity.domain));

  useEffect(() => setFanSpeed(vacuum.fanSpeed ?? ''), [vacuum.fanSpeed]);
  useEffect(() => {
    onSecondaryPageChange?.(detailsOpen);
    return () => onSecondaryPageChange?.(false);
  }, [detailsOpen, onSecondaryPageChange]);

  if (detailsOpen) {
    return (
      <ContextSecondaryPage
        title="Dispositivo e manutenzione"
        subtitle={`Controlli associati a ${vacuum.name}`}
        backLabel="Robot"
        icon={<Wrench size={18} />}
        iconClassName="text-teal-200"
        onBack={() => setDetailsOpen(false)}
      >

        {configurationEntities.length > 0 ? (
          <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--ui-text-primary)]"><SlidersHorizontal size={16} className="text-[color:var(--ui-accent)]" /> Configurazione</div>
            <div className="grid gap-2.5">{configurationEntities.map((entity) => <RelatedControl key={entity.entityId} entity={entity} onAction={onRelatedEntityAction} />)}</div>
          </div>
        ) : null}

        {diagnosticEntities.length > 0 ? (
          <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
            <p className="mb-3 text-sm font-semibold text-[color:var(--ui-text-primary)]">Manutenzione e diagnostica</p>
            <div className="grid grid-cols-2 gap-2">{diagnosticEntities.map((entity) => <RelatedControl key={entity.entityId} entity={entity} onAction={onRelatedEntityAction} />)}</div>
          </div>
        ) : null}

        {vacuum.supportsLocate ? (
          <button type="button" onClick={onLocate} className="glass-button flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-[color:var(--ui-text-primary)] transition"><LocateFixed size={16} /> Localizza robot</button>
        ) : null}

        {vacuum.deviceInfo ? (
          <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--ui-text-tertiary)]">Informazioni</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <span className="text-[color:var(--ui-text-tertiary)]">Produttore</span><span className="text-right font-semibold text-[color:var(--ui-text-secondary)]">{vacuum.deviceInfo.manufacturer ?? 'N/D'}</span>
              <span className="text-[color:var(--ui-text-tertiary)]">Modello</span><span className="text-right font-semibold text-[color:var(--ui-text-secondary)]">{vacuum.deviceInfo.model ?? 'N/D'}</span>
              <span className="text-[color:var(--ui-text-tertiary)]">Firmware</span><span className="text-right font-semibold text-[color:var(--ui-text-secondary)]">{vacuum.deviceInfo.swVersion ?? 'N/D'}</span>
            </div>
          </div>
        ) : null}
      </ContextSecondaryPage>
    );
  }

  const showPrimaryStart = (state === 'docked' || state === 'idle' || state === 'paused') && vacuum.supportsStart;
  const showPause = state === 'cleaning' && vacuum.supportsPause;
  const stats = [
    { label: 'Batteria', value: vacuum.batteryLevel === undefined ? 'N/D' : `${Math.round(vacuum.batteryLevel)}%` },
    { label: 'Area', value: vacuum.cleanedArea === undefined ? 'N/D' : `${Math.round(vacuum.cleanedArea * 10) / 10} ${vacuum.cleanedAreaUnit ?? 'm²'}` },
    { label: 'Tempo', value: formatDuration(vacuum.cleaningMinutes) },
  ];

  return (
    <div className={CONTEXT_PANEL_LAYOUT.shell}>
      <ContextPanelHeader title={vacuum.name} subtitle={vacuum.status?.trim() || translateVacuumState(state)} icon={<Bot size={21} />} fallbackTitle="Robot aspirapolvere" />

      <div className={`${CONTEXT_PANEL_LAYOUT.section} p-2 sm:p-2.5`}>
        <VacuumHero name={vacuum.name} state={state} mapUrl={vacuum.mapUrl} batteryLevel={vacuum.batteryLevel} />
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {stats.map((item) => <div key={item.label} className="dashboard-content-surface min-w-0 rounded-2xl px-2 py-2.5 text-center"><p className="text-[10px] font-medium text-[color:var(--ui-text-tertiary)]">{item.label}</p><p className="mt-1 truncate text-xs font-semibold text-[color:var(--ui-text-primary)]">{item.value}</p></div>)}
        </div>
      </div>

      <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
        <p className="mb-3 text-sm font-semibold text-[color:var(--ui-text-primary)]">Controlli</p>
        <div className="grid grid-flow-col auto-cols-fr gap-2">
          {showPrimaryStart ? <button type="button" onClick={onStart} className="liquid-glass-selection flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl border border-[color:var(--ui-border-strong)] text-xs font-semibold text-[color:var(--ui-accent)]"><Play size={16} /> <span className="truncate">{state === 'paused' ? 'Riprendi' : 'Avvia'}</span></button> : null}
          {showPause ? <button type="button" onClick={onPause} className="glass-button flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl text-xs font-semibold text-[color:var(--ui-text-primary)]"><Pause size={16} /> Pausa</button> : null}
          {vacuum.supportsStop ? <button type="button" onClick={onStop} disabled={!['cleaning', 'paused', 'returning'].includes(state)} className="glass-button flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl text-xs font-semibold text-[color:var(--ui-text-secondary)] disabled:opacity-35"><Square size={14} /> Stop</button> : null}
          {vacuum.supportsReturnToBase ? <button type="button" onClick={onReturnToBase} disabled={state === 'docked' || state === 'unavailable'} className="glass-button flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl text-xs font-semibold text-[color:var(--ui-text-secondary)] disabled:opacity-35"><Home size={15} /> Base</button> : null}
        </div>
      </div>

      {(vacuum.supportsCleanArea || vacuum.supportsCleanSpot) ? (
        <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
          <div className="mb-3 flex items-center justify-between gap-3"><span><p className="text-sm font-semibold text-[color:var(--ui-text-primary)]">Pulizia mirata</p><p className="mt-0.5 text-[11px] text-[color:var(--ui-text-tertiary)]">Scegli una o più aree mappate</p></span><MapIcon size={17} className="text-[color:var(--ui-accent)]" /></div>
          {vacuum.supportsCleanArea && areaOptions.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {areaOptions.map((area) => {
                const selected = selectedAreas.includes(area.id);
                return <button key={area.id} type="button" aria-pressed={selected} onClick={() => setSelectedAreas((current) => selected ? current.filter((id) => id !== area.id) : [...current, area.id])} className={`min-w-0 rounded-2xl border px-3 py-3 text-left transition ${selected ? 'border-[color:rgb(var(--ui-accent-rgb)/0.38)] bg-[color:rgb(var(--ui-accent-rgb)/0.16)] text-[color:var(--ui-text-primary)]' : 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)] hover:bg-[color:var(--ui-fill-secondary)]'}`}><span className="block truncate text-xs font-semibold">{area.name}</span>{area.segmentIds?.length ? <span className="mt-1 block text-[10px] opacity-55">{area.segmentIds.length} {area.segmentIds.length === 1 ? 'segmento' : 'segmenti'}</span> : null}</button>;
              })}
            </div>
          ) : vacuum.supportsCleanArea ? <p className="dashboard-content-surface rounded-2xl p-3 text-xs leading-relaxed text-[color:var(--ui-text-tertiary)]">Configura la mappatura delle aree nell’entità Vacuum di Home Assistant per abilitarne la selezione.</p> : null}
          <div className="mt-3 grid grid-flow-col auto-cols-fr gap-2">
            {vacuum.supportsCleanArea && selectedAreas.length > 0 ? <button type="button" onClick={() => onCleanArea(selectedAreas)} className="liquid-glass-selection flex h-11 min-w-0 items-center justify-center gap-2 rounded-2xl border border-[color:var(--ui-border-strong)] px-3 text-xs font-semibold text-[color:var(--ui-accent)]"><Sparkles size={15} /><span className="truncate">Pulisci {selectedAreas.length} {selectedAreas.length === 1 ? 'area' : 'aree'}</span></button> : null}
            {vacuum.supportsCleanSpot ? <button type="button" onClick={onCleanSpot} className="glass-button flex h-11 min-w-0 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-semibold text-[color:var(--ui-text-secondary)]"><Sparkles size={15} /> Pulizia spot</button> : null}
          </div>
        </div>
      ) : null}

      {vacuum.supportsFanSpeed && fanSpeedOptions.length > 0 ? (
        <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
          <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[color:var(--ui-text-primary)]">Potenza aspirazione</p><span className="text-xs font-semibold text-[color:var(--ui-text-tertiary)]">{formatVacuumOption(fanSpeed) ?? 'N/D'}</span></div>
          <GlassSegmentSelect
            ariaLabel="Potenza aspirazione"
            options={fanSpeedOptions.map((option) => ({ value: option, label: formatVacuumOption(option) }))}
            value={fanSpeedOptions.find((option) => option.toLowerCase() === fanSpeed.toLowerCase())}
            onChange={(option) => { setFanSpeed(option); onSetFanSpeed(option); }}
            minOptionWidth="3.7rem"
            scrollable
          />
        </div>
      ) : null}

      <button type="button" onClick={() => setDetailsOpen(true)} className={`${CONTEXT_PANEL_LAYOUT.sectionCompact} flex w-full items-center justify-between gap-3 text-left transition hover:bg-[color:var(--ui-fill-secondary)]`}>
        <span className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-accent)]"><SlidersHorizontal size={16} /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[color:var(--ui-text-primary)]">Dispositivo e manutenzione</span><span className="mt-0.5 block truncate text-[11px] text-[color:var(--ui-text-tertiary)]">{relatedControls.length} entità associate</span></span></span><ChevronRight size={17} className="shrink-0 text-[color:var(--ui-text-tertiary)]" />
      </button>
    </div>
  );
}
