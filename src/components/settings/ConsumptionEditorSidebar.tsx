import React from 'react';
import type { ConsumptionCardId, ConsumptionEntityConfig } from '../../hooks/useConsumptionConfig';

type ConsumptionEditorSidebarProps = {
  selectedCardId: ConsumptionCardId | null;
  onSelectCard: (cardId: ConsumptionCardId) => void;
  config: ConsumptionEntityConfig;
  haEntityIds: string[];
  haConnected: boolean;
  onUpdateConfigField: (field: keyof ConsumptionEntityConfig, value: string) => void;
  onResetConfig: () => void;
};

type ConfigField = {
  field: keyof ConsumptionEntityConfig;
  label: string;
  placeholder: string;
  kind?: 'entity' | 'text' | 'route';
};

const ELECTRICITY_FIELDS: ConfigField[] = [
  { field: 'solarPowerEntityId', label: 'Solar Power Entity', placeholder: 'sensor.solar_power_kw', kind: 'entity' },
  { field: 'gridPowerEntityId', label: 'Grid Power Entity', placeholder: 'sensor.grid_power_kw', kind: 'entity' },
  { field: 'homePowerEntityId', label: 'Home Power Entity', placeholder: 'sensor.home_power_kw', kind: 'entity' },
  { field: 'solarMixEntityId', label: 'Solar Mix % Entity', placeholder: 'sensor.solar_mix_percent', kind: 'entity' },
  { field: 'batteryPowerEntityId', label: 'Battery Power Entity', placeholder: 'sensor.battery_power_kw', kind: 'entity' },
  { field: 'batterySocEntityId', label: 'Battery SoC Entity', placeholder: 'sensor.battery_soc', kind: 'entity' },
];

const WATER_FIELDS: ConfigField[] = [
  { field: 'waterCurrentEntityId', label: 'Water Current Entity', placeholder: 'sensor.water_today_liters', kind: 'entity' },
  { field: 'waterGoalEntityId', label: 'Water Goal Entity', placeholder: 'input_number.water_daily_goal_liters', kind: 'entity' },
  { field: 'waterRainRecoveryEntityId', label: 'Rain Recovery Entity', placeholder: 'sensor.water_rain_recovery_lpm', kind: 'entity' },
];

const GAS_FIELDS: ConfigField[] = [
  { field: 'gasTodayEntityId', label: 'Gas Today Entity', placeholder: 'sensor.gas_today_m3', kind: 'entity' },
];

const CARD_META_FIELDS: Record<ConsumptionCardId, ConfigField[]> = {
  electricity: [
    { field: 'electricityCardTitle', label: 'Card Title', placeholder: 'Energia', kind: 'text' },
    { field: 'electricityCardRoute', label: 'Card Route', placeholder: '/consumi/energia', kind: 'route' },
  ],
  water: [
    { field: 'waterCardTitle', label: 'Card Title', placeholder: 'Acqua', kind: 'text' },
    { field: 'waterCardRoute', label: 'Card Route', placeholder: '/consumi/acqua', kind: 'route' },
  ],
  gas: [
    { field: 'gasCardTitle', label: 'Card Title', placeholder: 'Gas', kind: 'text' },
    { field: 'gasCardRoute', label: 'Card Route', placeholder: '/consumi/gas', kind: 'route' },
  ],
  trend: [
    { field: 'trendCardTitle', label: 'Card Title', placeholder: 'Report', kind: 'text' },
    { field: 'trendCardRoute', label: 'Card Route', placeholder: '/consumi/report', kind: 'route' },
  ],
};

const CARD_OPTIONS: Array<{ id: ConsumptionCardId; label: string }> = [
  { id: 'electricity', label: 'Electricity' },
  { id: 'water', label: 'Water' },
  { id: 'gas', label: 'Gas' },
  { id: 'trend', label: 'Trend' },
];

function renderField(
  item: ConfigField,
  value: string,
  onUpdate: (field: keyof ConsumptionEntityConfig, value: string) => void,
  datalistId: string,
) {
  const isEntityField = item.kind === 'entity';
  return (
    <label key={item.field} className="block">
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">{item.label}</p>
      <input
        list={isEntityField ? datalistId : undefined}
        value={value}
        onChange={(event) => onUpdate(item.field, event.target.value)}
        placeholder={item.placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
      />
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
}: ConsumptionEditorSidebarProps) {
  const datalistId = 'consumi-entity-options';
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

  return (
    <aside className="h-full min-h-0 w-[clamp(17rem,28vw,25rem)] shrink-0 rounded-[2rem] border border-white/8 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Builder</p>
          <h3 className="mt-2 text-xl font-semibold">Consumi Config</h3>
        </div>
        <button
          type="button"
          onClick={onResetConfig}
          className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white/70 transition-colors hover:bg-white/10"
        >
          Reset
        </button>
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

      <div className="mt-5 flex h-[calc(100%-9.5rem)] flex-col min-h-0">
        <div className="custom-scrollbar space-y-5 overflow-y-auto pr-1">
          <div className="liquid-glass-card space-y-4 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Card</p>
            {cardMetaFields.map((item) => renderField(item, config[item.field], onUpdateConfigField, datalistId))}
          </div>

          {fields.length > 0 ? (
            <div className="liquid-glass-card space-y-4 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Data Source</p>
              {fields.map((item) => renderField(item, config[item.field], onUpdateConfigField, datalistId))}
            </div>
          ) : (
            <div className="liquid-glass-card rounded-2xl border-dashed p-4">
              <p className="text-sm text-white/65">
                Nessuna entita da configurare per questa card. Puoi personalizzare titolo e route.
              </p>
            </div>
          )}
        </div>

        <datalist id={datalistId}>
          {entitySuggestions.map((entityId) => (
            <option key={entityId} value={entityId} />
          ))}
        </datalist>

        <p className="mt-4 text-[11px] text-white/45">
          {haConnected && entitySuggestions.length > 0
            ? 'Suggerimenti live da Home Assistant disponibili.'
            : 'Nessun suggerimento live: collega Home Assistant o inserisci manualmente le entita.'}
        </p>
      </div>
    </aside>
  );
}

export default ConsumptionEditorSidebar;
