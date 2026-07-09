import React from 'react';
import { X } from 'lucide-react';
import type { ConsumptionCardId, ConsumptionEntityConfig } from '../../hooks/useConsumptionConfig';
import GlassCombobox from '../ui/GlassCombobox';

type ConsumptionEditorSidebarProps = {
  selectedCardId: ConsumptionCardId | null;
  onSelectCard: (cardId: ConsumptionCardId) => void;
  config: ConsumptionEntityConfig;
  haEntityIds: string[];
  haConnected: boolean;
  onUpdateConfigField: (field: keyof ConsumptionEntityConfig, value: string) => void;
  onResetConfig: () => void;
  variant?: 'sidebar' | 'sheet';
  onClose?: () => void;
};

type ConfigField = {
  field: keyof ConsumptionEntityConfig;
  label: string;
  placeholder: string;
  kind?: 'entity' | 'text' | 'route';
};

const ELECTRICITY_FIELDS: ConfigField[] = [
  { field: 'solarPowerEntityId', label: 'Entita produzione solare', placeholder: 'sensor.solar_power_kw', kind: 'entity' },
  { field: 'gridPowerEntityId', label: 'Entita potenza rete', placeholder: 'sensor.grid_power_kw', kind: 'entity' },
  { field: 'homePowerEntityId', label: 'Entita consumo casa', placeholder: 'sensor.home_power_kw', kind: 'entity' },
  { field: 'solarMixEntityId', label: 'Entita percentuale solare', placeholder: 'sensor.solar_mix_percent', kind: 'entity' },
  { field: 'batteryPowerEntityId', label: 'Entita potenza batteria', placeholder: 'sensor.battery_power_kw', kind: 'entity' },
  { field: 'batterySocEntityId', label: 'Entita carica batteria', placeholder: 'sensor.battery_soc', kind: 'entity' },
];

const WATER_FIELDS: ConfigField[] = [
  { field: 'waterCurrentEntityId', label: 'Entita consumo acqua', placeholder: 'sensor.water_today_liters', kind: 'entity' },
  { field: 'waterGoalEntityId', label: 'Entita obiettivo giornaliero', placeholder: 'input_number.water_daily_goal_liters', kind: 'entity' },
  { field: 'waterRainRecoveryEntityId', label: 'Entita recupero pioggia', placeholder: 'sensor.water_rain_recovery_lpm', kind: 'entity' },
];

const GAS_FIELDS: ConfigField[] = [
  { field: 'gasTodayEntityId', label: 'Entita consumo gas giornaliero', placeholder: 'sensor.gas_today_m3', kind: 'entity' },
];

const CARD_META_FIELDS: Record<ConsumptionCardId, ConfigField[]> = {
  electricity: [
    { field: 'electricityCardTitle', label: 'Titolo scheda', placeholder: 'Energia', kind: 'text' },
    { field: 'electricityCardRoute', label: 'Percorso scheda', placeholder: '/consumi/energia', kind: 'route' },
  ],
  water: [
    { field: 'waterCardTitle', label: 'Titolo scheda', placeholder: 'Acqua', kind: 'text' },
    { field: 'waterCardRoute', label: 'Percorso scheda', placeholder: '/consumi/acqua', kind: 'route' },
  ],
  gas: [
    { field: 'gasCardTitle', label: 'Titolo scheda', placeholder: 'Gas', kind: 'text' },
    { field: 'gasCardRoute', label: 'Percorso scheda', placeholder: '/consumi/gas', kind: 'route' },
  ],
  trend: [
    { field: 'trendCardTitle', label: 'Titolo scheda', placeholder: 'Report', kind: 'text' },
    { field: 'trendCardRoute', label: 'Percorso scheda', placeholder: '/consumi/report', kind: 'route' },
  ],
};

const CARD_OPTIONS: Array<{ id: ConsumptionCardId; label: string }> = [
  { id: 'electricity', label: 'Energia' },
  { id: 'water', label: 'Acqua' },
  { id: 'gas', label: 'Gas' },
  { id: 'trend', label: 'Report' },
];

function renderField(
  item: ConfigField,
  value: string,
  onUpdate: (field: keyof ConsumptionEntityConfig, value: string) => void,
  entitySuggestions: string[],
) {
  const isEntityField = item.kind === 'entity';
  return (
    <label key={item.field} className="block">
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">{item.label}</p>
      {isEntityField ? (
        <GlassCombobox
          value={value}
          options={entitySuggestions}
          onChange={(nextValue) => onUpdate(item.field, nextValue)}
          placeholder={item.placeholder}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onUpdate(item.field, event.target.value)}
          placeholder={item.placeholder}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
        />
      )}
    </label>
  );
}

export function ConsumptionEditorSidebar({
  selectedCardId,
  onSelectCard,
  config,
  haEntityIds,
  haConnected,
  onUpdateConfigField,
  onResetConfig,
  variant = 'sidebar',
  onClose,
}: ConsumptionEditorSidebarProps) {
  const entitySuggestions = haEntityIds.filter(
    (entityId) =>
      entityId.startsWith('sensor.') ||
      entityId.startsWith('number.') ||
      entityId.startsWith('input_number.') ||
      entityId.startsWith('utility_meter.'),
  );
  const activeCardId = selectedCardId ?? 'electricity';
  const cardMetaFields = CARD_META_FIELDS[activeCardId];

  let fields: ConfigField[] = [];
  if (activeCardId === 'electricity') {
    fields = ELECTRICITY_FIELDS;
  } else if (activeCardId === 'water') {
    fields = WATER_FIELDS;
  } else if (activeCardId === 'gas') {
    fields = GAS_FIELDS;
  }

  const isSheet = variant === 'sheet';

  return (
    <aside
      className={
        isSheet
          ? 'flex h-full min-h-0 w-full flex-col p-3 pt-1 sm:p-4'
          : 'h-full min-h-0 w-[clamp(17rem,28vw,25rem)] shrink-0 rounded-[2rem] border border-white/8 bg-white/5 p-5 backdrop-blur-xl'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Configurazione</p>
          <h3 className="mt-2 text-xl font-semibold">Dettagli consumi</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetConfig}
            className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white/70 transition-colors hover:bg-white/10"
          >
            Ripristina
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              aria-label="Chiudi configurazione consumi"
              title="Chiudi"
            >
              <X size={15} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {CARD_OPTIONS.map((item) => {
          const active = activeCardId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCard(item.id)}
              className={`rounded-xl border px-3 py-2 text-xs uppercase tracking-[0.16em] transition-colors ${
                active
                  ? 'border-blue-300/45 bg-blue-500/20 text-blue-100'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex h-[calc(100%-9.5rem)] min-h-0 flex-col">
        <div className="glass-scrollbar space-y-5 overflow-y-auto pr-1">
            <div className="liquid-glass-card space-y-4 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Scheda</p>
            {cardMetaFields.map((item) => renderField(item, config[item.field], onUpdateConfigField, entitySuggestions))}
            </div>

          {fields.length > 0 ? (
            <div className="liquid-glass-card space-y-4 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Sorgenti dati</p>
              {fields.map((item) => renderField(item, config[item.field], onUpdateConfigField, entitySuggestions))}
            </div>
          ) : (
            <div className="liquid-glass-card rounded-2xl border-dashed p-4">
              <p className="text-sm text-white/65">
                Nessuna entita da configurare per questa scheda. Puoi personalizzare titolo e percorso.
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 text-[11px] text-white/45">
          {haConnected && entitySuggestions.length > 0
            ? 'Suggerimenti da Home Assistant disponibili.'
            : 'Nessun suggerimento live: collega Home Assistant o inserisci manualmente le entita.'}
        </p>
      </div>
    </aside>
  );
}

export default ConsumptionEditorSidebar;
