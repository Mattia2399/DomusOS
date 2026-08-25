import {
  BatteryLow,
  BellRing,
  DoorOpen,
  EyeOff,
  LockKeyhole,
  RotateCcw,
  ShieldAlert,
  WifiOff,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { HomeAttentionCategory } from '../homeAttention/homeAttentionEngine';
import type { HomeAttentionPreferences } from '../homeAttention/homeAttentionPreferences';
import GlassDropdown, { type GlassDropdownOption } from '../ui/GlassDropdown';
import GlassToggle from '../ui/GlassToggle';

type SettingsAttentionSectionProps = {
  preferences: HomeAttentionPreferences;
  onChange: (
    next:
      | HomeAttentionPreferences
      | ((current: HomeAttentionPreferences) => HomeAttentionPreferences),
  ) => void;
  onReset: () => void;
  suppressedCount?: number;
  onClearSuppressions?: () => void;
};

type CategoryOption = {
  id: HomeAttentionCategory;
  title: string;
  description: string;
  icon: LucideIcon;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: 'safety',
    title: 'Sicurezza critica',
    description: 'Fumo, gas, monossido e possibili perdite.',
    icon: ShieldAlert,
  },
  {
    id: 'security',
    title: 'Allarme e serrature',
    description: 'Allarmi attivi, serrature aperte o inceppate.',
    icon: LockKeyhole,
  },
  {
    id: 'opening',
    title: 'Aperture prolungate',
    description: 'Porte, finestre e garage rimasti aperti.',
    icon: DoorOpen,
  },
  {
    id: 'availability',
    title: 'Dispositivi non raggiungibili',
    description: 'Perdita di connessione o entità della dashboard non disponibili.',
    icon: WifiOff,
  },
  {
    id: 'battery',
    title: 'Batterie basse',
    description: 'Sensori e dispositivi sotto la soglia configurata.',
    icon: BatteryLow,
  },
  {
    id: 'configuration',
    title: 'Problemi di configurazione',
    description: 'Entità configurate nella dashboard ma non più restituite da Home Assistant.',
    icon: Wrench,
  },
];

const OPENING_OPTIONS: GlassDropdownOption[] = [
  { id: '5', name: 'Dopo 5 minuti' },
  { id: '10', name: 'Dopo 10 minuti' },
  { id: '15', name: 'Dopo 15 minuti' },
  { id: '30', name: 'Dopo 30 minuti' },
  { id: '60', name: 'Dopo 1 ora' },
];

const BATTERY_OPTIONS: GlassDropdownOption[] = [
  { id: '10', name: '10%' },
  { id: '15', name: '15%' },
  { id: '20', name: '20%' },
  { id: '25', name: '25%' },
  { id: '30', name: '30%' },
];

function PreferenceRow({
  option,
  checked,
  disabled,
  onChange,
}: {
  option: CategoryOption;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const Icon = option.icon;
  return (
    <div className="flex min-h-[5.25rem] items-center gap-3 border-t border-[color:var(--ui-separator)] py-3.5 first:border-t-0">
      <Icon
        size={19}
        className="shrink-0 text-[color:var(--ui-text-secondary)]"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[color:var(--ui-text-primary)]">
          {option.title}
        </p>
        <p className="mt-0.5 text-xs leading-5 text-[color:var(--ui-text-secondary)]">
          {option.description}
        </p>
      </div>
      <GlassToggle
        checked={checked}
        onChange={onChange}
        label={`Mostra ${option.title.toLowerCase()}`}
        disabled={disabled}
        size="compact"
        tone={option.id === 'safety' ? 'accent' : 'green'}
      />
    </div>
  );
}

export function SettingsAttentionPreview({
  preferences,
}: {
  preferences: HomeAttentionPreferences;
}) {
  const activeCount = Object.values(preferences.categories).filter(Boolean).length;
  return (
    <span className="relative flex min-h-[4.4rem] w-full items-center gap-3 overflow-hidden rounded-[1rem] bg-[color:var(--ui-fill-tertiary)] px-3 py-2.5 sm:min-h-[4.9rem] sm:rounded-[1.15rem] sm:px-3.5">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--ui-warning)]/12 text-[color:var(--ui-warning)]">
        <BellRing size={18} />
        {preferences.enabled ? (
          <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-[color:var(--ui-bg-elevated)] bg-emerald-500" />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-[color:var(--ui-text-primary)]">
          {preferences.enabled ? `${activeCount} categorie attive` : 'Centro disattivato'}
        </span>
        <span className="mt-0.5 block truncate text-[10px] text-[color:var(--ui-text-secondary)]">
          Aperture {preferences.openingWarningMinutes} min · Batterie {preferences.batteryWarningThreshold}%
        </span>
      </span>
    </span>
  );
}

export function SettingsAttentionSection({
  preferences,
  onChange,
  onReset,
  suppressedCount = 0,
  onClearSuppressions,
}: SettingsAttentionSectionProps) {
  const selectedOpening =
    OPENING_OPTIONS.find(
      (option) => Number(option.id) === preferences.openingWarningMinutes,
    ) ?? OPENING_OPTIONS[1];
  const selectedBattery =
    BATTERY_OPTIONS.find(
      (option) => Number(option.id) === preferences.batteryWarningThreshold,
    ) ?? BATTERY_OPTIONS[2];

  const updateCategory = (category: HomeAttentionCategory, checked: boolean) => {
    onChange((current) => ({
      ...current,
      categories: {
        ...current.categories,
        [category]: checked,
      },
    }));
  };

  return (
    <div className="space-y-4">
      <section className="dashboard-content-surface rounded-[1.5rem] p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <BellRing
            size={22}
            className="shrink-0 text-[color:var(--ui-text-secondary)]"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[color:var(--ui-text-primary)]">
              Mostra il Centro Attenzione
            </h2>
            <p className="mt-1 text-sm leading-6 text-[color:var(--ui-text-secondary)]">
              La fascia appare nella Home soltanto quando esiste qualcosa da controllare.
            </p>
          </div>
          <GlassToggle
            checked={preferences.enabled}
            onChange={(enabled) => onChange((current) => ({ ...current, enabled }))}
            label="Mostra Centro Attenzione"
            tone="accent"
          />
        </div>
      </section>

      {!preferences.enabled ? (
        <div
          role="status"
          className="rounded-[1.25rem] border border-[color:var(--ui-warning)]/25 bg-[color:var(--ui-warning)]/10 px-4 py-3 text-sm leading-6 text-[color:var(--ui-text-secondary)]"
        >
          Il Centro è disattivato: nessuna categoria verrà mostrata nella Home.
        </div>
      ) : !preferences.categories.safety ? (
        <div
          role="status"
          className="rounded-[1.25rem] border border-[color:var(--ui-danger)]/25 bg-[color:var(--ui-danger)]/10 px-4 py-3 text-sm leading-6 text-[color:var(--ui-text-secondary)]"
        >
          Gli avvisi critici di fumo, gas, monossido e perdite sono nascosti. I sistemi Home Assistant
          continuano comunque a funzionare.
        </div>
      ) : null}

      <section className="dashboard-content-surface rounded-[1.5rem] px-5 py-2 sm:px-6">
        <div className="pb-2 pt-4">
          <h2 className="font-semibold text-[color:var(--ui-text-primary)]">
            Cosa mostrare
          </h2>
          <p className="mt-1 text-sm text-[color:var(--ui-text-secondary)]">
            Scegli quali situazioni devono comparire nel riepilogo.
          </p>
        </div>
        {CATEGORY_OPTIONS.map((option) => (
          <PreferenceRow
            key={option.id}
            option={option}
            checked={preferences.categories[option.id]}
            disabled={!preferences.enabled}
            onChange={(checked) => updateCategory(option.id, checked)}
          />
        ))}
      </section>

      <section className="dashboard-content-surface rounded-[1.5rem] p-5 sm:p-6">
        <h2 className="font-semibold text-[color:var(--ui-text-primary)]">
          Quando avvisare
        </h2>
        <p className="mt-1 text-sm leading-6 text-[color:var(--ui-text-secondary)]">
          Regola soltanto le soglie del riepilogo, senza modificare Home Assistant.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <GlassDropdown
            label="Apertura prolungata"
            options={OPENING_OPTIONS}
            selected={selectedOpening}
            disabled={!preferences.enabled || !preferences.categories.opening}
            onChange={(option) =>
              onChange((current) => ({
                ...current,
                openingWarningMinutes: Number(option.id),
              }))
            }
          />
          <GlassDropdown
            label="Batteria bassa"
            options={BATTERY_OPTIONS}
            selected={selectedBattery}
            disabled={!preferences.enabled || !preferences.categories.battery}
            onChange={(option) =>
              onChange((current) => ({
                ...current,
                batteryWarningThreshold: Number(option.id),
              }))
            }
          />
        </div>
      </section>

      {suppressedCount > 0 && onClearSuppressions ? (
        <section className="dashboard-content-surface rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <EyeOff
              size={20}
              className="shrink-0 text-[color:var(--ui-text-secondary)]"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-[color:var(--ui-text-primary)]">
                Avvisi rimandati
              </h2>
              <p className="mt-1 text-sm leading-6 text-[color:var(--ui-text-secondary)]">
                {suppressedCount === 1
                  ? 'Un avviso è temporaneamente nascosto.'
                  : `${suppressedCount} avvisi sono temporaneamente nascosti.`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearSuppressions}
              className="liquid-glass-selection inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-4 text-sm font-semibold"
            >
              Mostra di nuovo
            </button>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <p className="max-w-2xl text-xs leading-5 text-[color:var(--ui-text-tertiary)]">
          Queste preferenze controllano soltanto la visualizzazione del Centro Attenzione. Non
          disattivano allarmi, automazioni o notifiche configurate in Home Assistant.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="liquid-glass-control inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-[color:var(--ui-text-primary)]"
        >
          <RotateCcw size={16} />
          Ripristina consigliate
        </button>
      </div>
    </div>
  );
}

export default SettingsAttentionSection;
