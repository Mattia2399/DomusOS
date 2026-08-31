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
};

const ELECTRICITY_FIELDS: ConfigField[] = [
  { field: 'solarPowerEntityId', label: 'Entita produzione solare', placeholder: 'sensor.solar_power_kw' },
  { field: 'gridPowerEntityId', label: 'Entita potenza rete', placeholder: 'sensor.grid_power_kw' },
  { field: 'homePowerEntityId', label: 'Entita consumo casa', placeholder: 'sensor.home_power_kw' },
  { field: 'solarMixEntityId', label: 'Entita percentuale solare', placeholder: 'sensor.solar_mix_percent' },
  { field: 'batteryPowerEntityId', label: 'Entita potenza batteria', placeholder: 'sensor.battery_power_kw' },
  { field: 'batterySocEntityId', label: 'Entita carica batteria', placeholder: 'sensor.battery_soc' },
];

const WATER_FIELDS: ConfigField[] = [
  { field: 'waterCurrentEntityId', label: 'Entita consumo acqua', placeholder: 'sensor.water_today_liters' },
  { field: 'waterGoalEntityId', label: 'Entita obiettivo giornaliero', placeholder: 'input_number.water_daily_goal_liters' },
  { field: 'waterRainRecoveryEntityId', label: 'Entita recupero pioggia', placeholder: 'sensor.water_rain_recovery_lpm' },
];

const GAS_FIELDS: ConfigField[] = [
  { field: 'gasTodayEntityId', label: 'Entita consumo gas giornaliero', placeholder: 'sensor.gas_today_m3' },
];

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
  return (
    <label key={item.field} className="block">
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[color:var(--ui-text-tertiary)]">{item.label}</p>
      <GlassCombobox
        value={value}
        options={entitySuggestions}
        onChange={(nextValue) => onUpdate(item.field, nextValue)}
        placeholder={item.placeholder}
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
          : 'liquid-glass-panel h-full min-h-0 w-[clamp(17rem,28vw,25rem)] shrink-0 rounded-[2rem] p-5'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ui-text-tertiary)]">Configurazione</p>
          <h3 className="mt-2 text-xl font-semibold">Dettagli consumi</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetConfig}
            className="glass-button rounded-xl px-3 py-2 text-xs uppercase tracking-[0.16em] text-[color:var(--ui-text-secondary)] transition-colors"
          >
            Ripristina
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="glass-button inline-flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--ui-text-secondary)] transition-colors hover:text-[color:var(--ui-text-primary)]"
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
                  ? 'liquid-glass-selection border-[color:var(--ui-border-strong)] text-[color:var(--ui-text-primary)]'
                  : 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)] hover:bg-[color:var(--ui-fill-secondary)]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex h-[calc(100%-9.5rem)] min-h-0 flex-col">
        <div className="glass-scrollbar space-y-5 overflow-y-auto pr-1">
          {fields.length > 0 ? (
            <div className="dashboard-content-surface space-y-4 rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--ui-text-tertiary)]">Sorgenti dati</p>
              {fields.map((item) => renderField(item, config[item.field], onUpdateConfigField, entitySuggestions))}
            </div>
          ) : (
            <div className="dashboard-content-surface rounded-2xl border-dashed p-4">
              <p className="text-sm text-[color:var(--ui-text-secondary)]">
                Il report utilizza automaticamente i dati configurati nelle sezioni Energia, Acqua e Gas.
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 text-[11px] text-[color:var(--ui-text-tertiary)]">
          {haConnected && entitySuggestions.length > 0
            ? 'Suggerimenti da Home Assistant disponibili.'
            : 'Nessun suggerimento live: collega Home Assistant o inserisci manualmente le entita.'}
        </p>
      </div>
    </aside>
  );
}

export default ConsumptionEditorSidebar;
