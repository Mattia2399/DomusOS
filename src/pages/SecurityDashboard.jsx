import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Blinds,
  Camera,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock3,
  Eye,
  EyeOff,
  Fingerprint,
  House,
  KeyRound,
  Loader2,
  Lock,
  Plane,
  Search,
  SlidersHorizontal,
  Settings,
  Shield,
  ShieldOff,
  Unlock,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import GlassDropdown from '../components/ui/GlassDropdown';
import SecurityAuthModal from '../components/security/SecurityAuthModal';
import { useDeviceAuth } from '../hooks/useDeviceAuth';
import { getAlarmStateLabel, normalizeAlarmState } from '../utils/alarmUtils';

const STORAGE_KEYS = {
  alarmEntityId: 'ha.dashboard.security.alarmEntityId',
  alarmPin: 'ha.dashboard.security.alarmPin',
  visibleSensorEntityIds: 'ha.dashboard.security.visibleSensorEntityIds',
  visibleCameraEntityIds: 'ha.dashboard.security.visibleCameraEntityIds',
};

const UI_FLAGS = Object.freeze({
  directCallWhenCodeNotRequired: false,
  showSensorSearch: true,
  showEventFeed: true,
});

const DEFAULT_SECURITY_PIN = '2580';
const DEFAULT_ARMING_DELAY_SECONDS = 30;
const SECURITY_OVERVIEW_PATH = '/security';
const SECURITY_CAMERAS_PATH = '/security/cameras';
const MAX_CAMERAS_ON_DASHBOARD = 4;
const SHIELD_SIZE = 304;
const SHIELD_PROGRESS_RADIUS = 146;
const SHIELD_PROGRESS_CIRCUMFERENCE = 2 * Math.PI * SHIELD_PROGRESS_RADIUS;
const SECURITY_SENSOR_DEVICE_CLASSES = new Set([
  'door',
  'window',
  'opening',
  'motion',
  'presence',
  'occupancy',
  'vibration',
  'tamper',
  'smoke',
  'gas',
  'co',
  'co2',
  'heat',
  'moisture',
  'safety',
  'problem',
  'lock',
  'garage_door',
]);
const SECURITY_SENSOR_KEYWORDS = [
  'door',
  'window',
  'motion',
  'presence',
  'occupancy',
  'pir',
  'tamper',
  'smoke',
  'gas',
  'co',
  'alarm',
  'allarme',
  'intrusion',
  'intrusione',
  'perimetro',
  'security',
  'sicurezza',
  'garage',
  'porta',
  'finestra',
];

const ALARM_OPTIONS = [
  { value: 'disarmed', label: 'Disinserisci', icon: ShieldOff },
  { value: 'armed_home', label: 'Casa', icon: House },
  { value: 'armed_away', label: 'Fuori', icon: Plane },
];

const ALARM_SERVICE_BY_STATE = {
  disarmed: 'alarm_disarm',
  armed_home: 'alarm_arm_home',
  armed_away: 'alarm_arm_away',
};

const INITIAL_LOGS = [
  { id: 1, time: '14:20', message: 'Movimento rilevato', type: 'warning' },
  { id: 2, time: '18:30', message: 'Allarme inserito', type: 'info' },
];

const ALARM_VISUALS = {
  disarmed: {
    icon: ShieldOff,
    badge: 'Sistema Disinserito',
    helper: 'Casa in standby',
    backgroundColor: 'rgba(52,199,89,0.18)',
    borderColor: 'rgba(52,199,89,0.52)',
    boxShadow:
      '0 0 0 1px rgba(52,199,89,0.35), 0 0 88px rgba(52,199,89,0.3), inset 0 0 80px rgba(52,199,89,0.18)',
    pulseColor: 'rgba(52,199,89,0.65)',
    ringColor: 'rgba(52,199,89,0.9)',
    ringGlow: 'rgba(52,199,89,0.45)',
  },
  armed_home: {
    icon: House,
    badge: 'Inserito Casa',
    helper: 'Perimetro attivo',
    backgroundColor: 'rgba(255,59,48,0.2)',
    borderColor: 'rgba(255,59,48,0.55)',
    boxShadow:
      '0 0 0 1px rgba(255,59,48,0.4), 0 0 96px rgba(255,59,48,0.35), inset 0 0 78px rgba(255,59,48,0.2)',
    pulseColor: 'rgba(255,59,48,0.72)',
    ringColor: 'rgba(255,59,48,0.92)',
    ringGlow: 'rgba(255,59,48,0.46)',
  },
  armed_away: {
    icon: Plane,
    badge: 'Inserito Fuori',
    helper: 'Protezione totale',
    backgroundColor: 'rgba(255,59,48,0.24)',
    borderColor: 'rgba(255,59,48,0.6)',
    boxShadow:
      '0 0 0 1px rgba(255,59,48,0.45), 0 0 106px rgba(255,59,48,0.4), inset 0 0 88px rgba(255,59,48,0.24)',
    pulseColor: 'rgba(255,59,48,0.8)',
    ringColor: 'rgba(255,59,48,0.94)',
    ringGlow: 'rgba(255,59,48,0.5)',
  },
  pending: {
    icon: Loader2,
    badge: 'Transizione in corso',
    helper: 'Tempo di uscita/entrata',
    backgroundColor: 'rgba(255,159,10,0.26)',
    borderColor: 'rgba(255,159,10,0.62)',
    boxShadow:
      '0 0 0 1px rgba(255,159,10,0.4), 0 0 104px rgba(255,159,10,0.38), inset 0 0 92px rgba(255,159,10,0.24)',
    pulseColor: 'rgba(255,159,10,0.8)',
    ringColor: 'rgba(255,159,10,0.98)',
    ringGlow: 'rgba(255,159,10,0.52)',
  },
};

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function readStorageValue(key) {
  if (typeof window === 'undefined') return '';
  const raw = window.localStorage.getItem(key);
  return typeof raw === 'string' ? raw : '';
}

function readStorageStringArray(key) {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(key);
  if (typeof raw !== 'string' || raw.trim().length === 0) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((value) => typeof value === 'string').map((value) => value.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

function toItalianClockTime(date) {
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function isBinarySensorOpen(value) {
  const normalized = `${value ?? ''}`.trim().toLowerCase();
  return normalized === 'on' || normalized === 'open' || normalized === 'detected' || normalized === 'true';
}

function resolveSensorFriendlyName(entityId, liveEntity) {
  const friendlyName =
    typeof liveEntity?.rawAttributes?.friendly_name === 'string' ? liveEntity.rawAttributes.friendly_name.trim() : '';
  if (friendlyName) return friendlyName;
  return (entityId.split('.').pop() ?? entityId)
    .split('_')
    .map((w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : w))
    .join(' ');
}

function resolveSensorType(entityId, liveEntity) {
  const deviceClass = `${liveEntity?.rawAttributes?.device_class ?? ''}`.trim().toLowerCase();
  const token = `${entityId} ${deviceClass}`.toLowerCase();
  if (token.includes('door')) return 'door';
  if (token.includes('window')) return 'window';
  return 'sensor';
}

function isSecuritySensorEntity(entityId, liveEntity) {
  const deviceClass = `${liveEntity?.rawAttributes?.device_class ?? ''}`.trim().toLowerCase();
  if (SECURITY_SENSOR_DEVICE_CLASSES.has(deviceClass)) return true;
  const friendlyName =
    typeof liveEntity?.rawAttributes?.friendly_name === 'string' ? liveEntity.rawAttributes.friendly_name.trim() : '';
  const token = `${entityId} ${friendlyName} ${deviceClass}`.toLowerCase();
  return SECURITY_SENSOR_KEYWORDS.some((keyword) => token.includes(keyword));
}

function resolveCameraFriendlyName(entityId, liveEntity) {
  const friendlyName =
    typeof liveEntity?.rawAttributes?.friendly_name === 'string' ? liveEntity.rawAttributes.friendly_name.trim() : '';
  if (friendlyName) return friendlyName;
  return (entityId.split('.').pop() ?? entityId)
    .split('_')
    .map((w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : w))
    .join(' ');
}

function mapAlarmStateForShield(normalizedState, fallbackState) {
  if (normalizedState === 'pending' || normalizedState === 'arming' || normalizedState === 'disarming') return 'pending';
  if (normalizedState === 'disarmed') return 'disarmed';
  if (normalizedState === 'armed_home') return 'armed_home';
  if (normalizedState.startsWith('armed_')) return 'armed_away';
  return fallbackState;
}

function toPositiveNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim().replace(',', '.'));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function resolveAlarmExitDelaySeconds(rawAttributes) {
  if (!rawAttributes || typeof rawAttributes !== 'object') return null;
  for (const key of ['delay_time', 'arming_time', 'exit_delay', 'pending_time', 'delay']) {
    const parsed = toPositiveNumber(rawAttributes[key]);
    if (parsed !== null) return Math.round(parsed);
  }
  return null;
}

function isSecurityCamerasNavigationTarget(path) {
  const target = `${path ?? ''}`.trim();
  if (!target) return false;

  try {
    const parsed = new URL(target, 'http://dashboard.local');
    const pathname = parsed.pathname.toLowerCase();
    const hash = parsed.hash.toLowerCase();
    const view = (parsed.searchParams.get('view') ?? '').trim().toLowerCase();
    const pathSegments = pathname.split('/').filter(Boolean);
    const hashNormalized = hash.replace(/^#/, '').replace(/^\//, '');
    const hashSegments = hashNormalized.split('/').filter(Boolean);
    const isPathMatch =
      pathSegments.includes('security') && (pathSegments.includes('cameras') || pathSegments.includes('telecamere'));
    const isHashMatch =
      hashSegments.includes('security') &&
      (hashSegments.includes('cameras') || hashSegments.includes('telecamere'));
    return (
      isPathMatch ||
      hash === '#security/cameras' ||
      hash === '#security/telecamere' ||
      isHashMatch ||
      view === 'security-cameras' ||
      view === 'security-telecamere'
    );
  } catch {
    return false;
  }
}

function resolveSecurityCamerasFromLocation() {
  if (typeof window === 'undefined') return false;
  return isSecurityCamerasNavigationTarget(window.location.href);
}

// FeatureDetector (logica capability invariata)
function resolveAlarmCodeFormat(rawAttributes) {
  const raw = `${rawAttributes?.code_format ?? ''}`.trim().toLowerCase();
  if (raw === 'number' || raw === 'numeric') return 'number';
  if (raw === 'text' || raw === 'string') return 'text';
  return null;
}

function sanitizeAlarmCode(value, codeFormat) {
  const raw = `${value ?? ''}`;
  if (codeFormat === 'number') return raw.replace(/[^\d]/g, '').slice(0, 8);
  return raw.trim().slice(0, 24);
}

function isAlarmCodeRequiredForState(nextState, rawAttributes) {
  const codeFormat = resolveAlarmCodeFormat(rawAttributes);
  const codeArmRequired = rawAttributes?.code_arm_required === true;
  const hasCodeCapability = Boolean(codeFormat) || codeArmRequired;
  if (!hasCodeCapability) return false;
  if (nextState === 'disarmed') return true;
  return codeArmRequired;
}
function SecurityMainShield({
  visual,
  statusLabel,
  isTransitioning,
  showDelayProgress,
  delayProgress,
  delayRemainingSeconds,
  onPrimaryAction,
  primaryActionLabel,
  activeState,
  onActionChange,
  disabled,
}) {
  const Icon = visual.icon;
  return (
    <section className="liquid-glass-panel rounded-[26px] p-4 sm:rounded-[32px] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-light uppercase tracking-[0.28em] text-white/60">Shield Core</p>
          <h2 className="mt-2 text-[1.6rem] font-semibold text-white">Hub Sicurezza</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/10 p-2"><Shield className="h-4 w-4 text-white/85" /></span>
      </div>
      <div className="mt-8 flex items-center justify-center">
        <motion.button
          type="button"
          onClick={onPrimaryAction}
          disabled={disabled}
          whileTap={disabled ? undefined : { scale: 0.985 }}
          className={cn('relative flex h-[min(72vw,19rem)] w-[min(72vw,19rem)] min-h-[15.5rem] min-w-[15.5rem] items-center justify-center rounded-full border sm:h-[19rem] sm:w-[19rem]', disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer')}
          animate={{ backgroundColor: visual.backgroundColor, borderColor: visual.borderColor, boxShadow: visual.boxShadow }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="pointer-events-none absolute -inset-4 rounded-full sm:-inset-7"
            animate={{ boxShadow: `0 0 0 2px ${visual.pulseColor}`, opacity: isTransitioning ? [0.22, 0.72, 0.24] : [0.12, 0.36, 0.12], scale: isTransitioning ? [1, 1.1, 1] : [1, 1.04, 1] }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          />
          {showDelayProgress ? (
            <svg className="pointer-events-none absolute inset-0 -rotate-90" viewBox={`0 0 ${SHIELD_SIZE} ${SHIELD_SIZE}`} fill="none">
              <circle cx={SHIELD_SIZE / 2} cy={SHIELD_SIZE / 2} r={SHIELD_PROGRESS_RADIUS} stroke="rgba(255,255,255,0.2)" strokeWidth="4.5" />
              <motion.circle
                cx={SHIELD_SIZE / 2}
                cy={SHIELD_SIZE / 2}
                r={SHIELD_PROGRESS_RADIUS}
                stroke={visual.ringColor}
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray={SHIELD_PROGRESS_CIRCUMFERENCE}
                animate={{ strokeDashoffset: SHIELD_PROGRESS_CIRCUMFERENCE * (1 - delayProgress) }}
                transition={{ duration: 0.2, ease: 'linear' }}
                style={{ filter: `drop-shadow(0 0 10px ${visual.ringGlow})` }}
              />
            </svg>
          ) : null}
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="inline-flex rounded-full border border-white/15 bg-white/[0.04] p-3 sm:p-3.5"><Icon className={cn('h-11 w-11 text-white sm:h-14 sm:w-14', isTransitioning ? 'animate-spin' : '')} /></span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 sm:mt-5 sm:text-sm sm:tracking-[0.2em]">{statusLabel}</p>
            <p className="mt-2 text-xs text-white/65">{visual.helper}</p>
            {showDelayProgress ? <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">Uscita in {delayRemainingSeconds}s</p> : null}
          </div>
        </motion.button>
      </div>
      <p className="mt-6 text-center text-xs font-light text-white/60">Tocca lo shield per <span className="font-semibold text-white">{primaryActionLabel}</span></p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {ALARM_OPTIONS.map((option) => {
          const OptionIcon = option.icon;
          const isActive = activeState === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onActionChange(option.value)}
              disabled={disabled}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-left transition-all',
                isActive
                  ? 'border-white/30 bg-white/15 text-white'
                  : 'border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]',
                disabled ? 'cursor-not-allowed opacity-45' : '',
              )}
            >
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex rounded-full border border-white/15 bg-white/[0.04] p-1.5">
                  <OptionIcon className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-semibold">{option.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SecurityEntityPickerModal({
  isOpen,
  title,
  description,
  entities,
  selectedEntityIds,
  onToggleEntity,
  onSelectAll,
  onSelectNone,
  onClose,
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  const filteredEntities = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return entities;
    return entities.filter((entry) => `${entry.name} ${entry.entityId}`.toLowerCase().includes(normalized));
  }, [entities, query]);

  const selectedSet = useMemo(() => new Set(selectedEntityIds), [selectedEntityIds]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div className="fixed inset-0 z-[290] flex items-center justify-center p-4 sm:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" onClick={onClose} className="absolute inset-0 bg-white/[0.02] backdrop-blur-2xl" aria-label="Chiudi selezione dispositivi" />
          <motion.div className="liquid-glass-panel relative z-10 w-full max-w-2xl rounded-[34px] p-5 sm:p-6" initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.98 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
            <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 p-1.5 text-white/70 hover:text-white" aria-label="Chiudi selezione">
              <X className="h-4 w-4" />
            </button>

            <p className="text-[11px] font-light uppercase tracking-[0.24em] text-white/60">Modalita Edit</p>
            <h3 className="mt-2 pr-10 text-xl font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm text-white/60">{description}</p>

            <div className="liquid-glass-card mt-4 px-4 py-3">
              <label className="flex items-center gap-3">
                <span className="inline-flex rounded-full border border-white/10 bg-white/10 p-2"><Search className="h-3.5 w-3.5 text-white/75" /></span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm text-white placeholder:text-white/45 outline-none" placeholder="Cerca dispositivo per nome o entity_id" />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-xs text-white/60">
                Selezionati: <span className="font-semibold text-white">{selectedEntityIds.length}</span> / {entities.length}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={onSelectAll} className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/85 hover:bg-white/[0.14]">
                  Tutti
                </button>
                <button type="button" onClick={onSelectNone} className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/85 hover:bg-white/[0.14]">
                  Nessuno
                </button>
              </div>
            </div>

            <div className="mt-3 max-h-[22rem] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
              {filteredEntities.length > 0 ? (
                filteredEntities.map((entry) => {
                  const checked = selectedSet.has(entry.entityId);
                  return (
                    <button
                      key={entry.entityId}
                      type="button"
                      onClick={() => onToggleEntity(entry.entityId)}
                      className={cn(
                        'w-full rounded-2xl border px-3 py-2.5 text-left transition-colors',
                        checked ? 'border-white/25 bg-white/[0.12]' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-md border', checked ? 'border-emerald-300/70 bg-emerald-400/20 text-emerald-100' : 'border-white/20 bg-white/[0.04] text-transparent')}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{entry.name}</p>
                          <p className="truncate text-[11px] font-light text-white/50">{entry.entityId}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                  Nessun dispositivo trovato.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SecuritySensorList({ sensors, query, onQueryChange, isEditMode = false, selectedCount = 0, totalCount = 0, onOpenSelector }) {
  const getIcon = (type) => (type === 'door' ? House : Blinds);
  return (
    <section className="liquid-glass-panel rounded-[26px] p-4 sm:rounded-[32px] sm:p-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
        <div><p className="text-[11px] font-light uppercase tracking-[0.28em] text-white/60">Sensori</p><h3 className="mt-2 text-xl font-semibold text-white">Perimetro</h3></div>
        <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-start">
          {isEditMode ? (
            <button type="button" onClick={onOpenSelector} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/85 hover:bg-white/[0.14]">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Seleziona
            </button>
          ) : null}
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">{isEditMode ? `${selectedCount}/${totalCount}` : sensors.length}</span>
        </div>
      </div>
      {UI_FLAGS.showSensorSearch ? (
        <div className="liquid-glass-card mt-4 px-4 py-3">
          <label className="flex items-center gap-3">
            <span className="inline-flex rounded-full border border-white/10 bg-white/10 p-2"><Search className="h-3.5 w-3.5 text-white/75" /></span>
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} className="w-full bg-transparent text-sm text-white placeholder:text-white/45 outline-none" placeholder="Cerca sensore per nome o entity_id" />
          </label>
        </div>
      ) : null}
      <div className="mt-4 max-h-none space-y-3 overflow-visible pr-0 sm:max-h-[28rem] sm:overflow-y-auto sm:pr-1 custom-scrollbar">
        {sensors.length > 0 ? sensors.map((sensor) => {
          const Icon = getIcon(sensor.type);
          return (
            <div key={sensor.entityId} className={cn('liquid-glass-card px-4 py-3', sensor.isOpen ? 'border-[#FF3B30]/40 bg-[#FF3B30]/12' : '')}>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10"><Icon className="h-4.5 w-4.5 text-white/85" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{sensor.name}</p>
                  <p className="truncate text-[11px] font-light text-white/50">{sensor.entityId}</p>
                </div>
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold', sensor.isOpen ? 'border-[#FF3B30]/45 bg-[#FF3B30]/20 text-[#FFD2CF]' : 'border-[#34C759]/45 bg-[#34C759]/18 text-[#CDF9D8]')}>
                  {sensor.isOpen ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {sensor.isOpen ? 'Aperto' : 'Chiuso'}
                </span>
              </div>
            </div>
          );
        }) : <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">Nessun sensore disponibile.</div>}
      </div>
    </section>
  );
}

function SecurityCameraSection({
  cameras,
  previewLimit = MAX_CAMERAS_ON_DASHBOARD,
  isDedicatedPage = false,
  isEditMode = false,
  selectedCount = 0,
  totalCount = 0,
  onOpenSelector,
  onOpenAll,
  onBackToOverview,
}) {
  const [brokenPreviewByEntity, setBrokenPreviewByEntity] = useState({});

  useEffect(() => {
    setBrokenPreviewByEntity({});
  }, [cameras]);

  const visibleCameras = isDedicatedPage ? cameras : cameras.slice(0, previewLimit);
  const hiddenCount = Math.max(0, cameras.length - visibleCameras.length);

  return (
    <section
      className={cn(
        'liquid-glass-card',
        isDedicatedPage ? 'h-full rounded-none border-0 bg-transparent px-4 py-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:p-8' : 'rounded-[26px] p-4 sm:rounded-[32px] sm:p-6',
      )}
    >
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
        <div>
          {isDedicatedPage ? (
            <button
              type="button"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/85 transition-colors hover:bg-white/[0.14]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Indietro
            </button>
          ) : (
            <p className="text-[11px] font-light uppercase tracking-[0.28em] text-white/60">Video</p>
          )}
          {isDedicatedPage ? (
            <h3 className="mt-3 text-[1.65rem] font-semibold text-white">Telecamere</h3>
          ) : isEditMode ? (
            <>
              <h3 className="mt-2 inline-flex items-center gap-2 text-left text-xl font-semibold text-white">
                Telecamere
                <Lock className="h-4 w-4 text-white/60" />
              </h3>
              <p className="mt-1 text-xs text-white/55">Tap action bloccata in modalita edit</p>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAll}
              className="mt-2 inline-flex items-center gap-1 text-left text-xl font-semibold text-white transition-colors hover:text-white/80"
            >
              Telecamere
              <ChevronRight className="h-4 w-4 text-white/70" />
            </button>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-start">
          {!isDedicatedPage && isEditMode ? (
            <button
              type="button"
              onClick={onOpenSelector}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/85 hover:bg-white/[0.14]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Seleziona
            </button>
          ) : null}
          {!isDedicatedPage && hiddenCount > 0 ? (
            <button
              type="button"
              onClick={isEditMode ? onOpenSelector : onOpenAll}
              className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/80 transition-colors hover:bg-white/[0.14]"
            >
              {isEditMode ? `+${hiddenCount} escluse` : `+${hiddenCount} altre`}
            </button>
          ) : null}
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            {isEditMode && !isDedicatedPage ? `${selectedCount}/${totalCount}` : cameras.length}
          </span>
        </div>
      </div>

      <div className={cn('mt-4 pr-0 sm:pr-1 custom-scrollbar', isDedicatedPage ? 'overflow-visible sm:overflow-y-auto' : 'max-h-none overflow-visible sm:max-h-[28rem] sm:overflow-y-auto')}>
        {visibleCameras.length > 0 ? (
          <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', isDedicatedPage ? 'xl:grid-cols-3 2xl:grid-cols-4' : '')}>
            {visibleCameras.map((camera) => (
              (() => {
                const hasRenderablePreview = camera.hasPreview && !brokenPreviewByEntity[camera.entityId];
                return (
              <motion.div
                key={camera.entityId}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border',
                  camera.isOffline ? 'border-white/10 bg-white/[0.03]' : 'border-white/15 bg-black/30',
                )}
              >
                <div className="aspect-video">
                  {hasRenderablePreview ? (
                    <img
                      src={camera.snapshot}
                      alt={camera.name}
                      loading="lazy"
                      onError={() =>
                        setBrokenPreviewByEntity((curr) =>
                          curr[camera.entityId] ? curr : { ...curr, [camera.entityId]: true },
                        )
                      }
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="relative h-full w-full overflow-hidden">
                      <div className="absolute inset-0 scale-110 bg-gradient-to-br from-neutral-700/70 via-neutral-800 to-neutral-900 blur-xl" />
                      <div className="absolute inset-0 bg-black/45" />
                      <div className="absolute inset-0 flex items-center justify-center px-3">
                        <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[11px] font-semibold text-white/80 backdrop-blur-lg">
                          Anteprima non disponibile
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                </div>

                <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      camera.isOffline ? 'bg-amber-300/90 shadow-[0_0_8px_rgba(252,211,77,0.7)]' : 'bg-emerald-300/95 shadow-[0_0_8px_rgba(110,231,183,0.7)]',
                    )}
                  />
                  {camera.isOffline ? 'Offline' : 'Live'}
                </div>

                <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{camera.name}</p>
                    <p className="truncate text-[11px] font-light text-white/55">{camera.entityId}</p>
                  </div>
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/35">
                    <Camera className="h-4 w-4 text-white/85" />
                  </span>
                </div>
              </motion.div>
                );
              })()
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
            Nessuna telecamera `camera.*` trovata.
          </div>
        )}
      </div>
    </section>
  );
}

export function SecurityDashboard({
  isEditMode = false,
  suppressBrowserNavigation = false,
  navigationRoute = '',
  haConnected = false,
  haStates = {},
  alarmEntityOptions = [],
  sensorEntityOptions = [],
  deviceAuthUser = null,
  onCallService,
}) {
  const [alarmState, setAlarmState] = useState('disarmed');
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [sensorSearchQuery, setSensorSearchQuery] = useState('');
  const [isSecurityPinVisible, setIsSecurityPinVisible] = useState(false);
  const [selectedAlarmEntityId, setSelectedAlarmEntityId] = useState(() => readStorageValue(STORAGE_KEYS.alarmEntityId));
  const [securityPin, setSecurityPin] = useState(() => readStorageValue(STORAGE_KEYS.alarmPin).trim() || DEFAULT_SECURITY_PIN);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState('Verifica biometria in corso...');
  const [biometricMessage, setBiometricMessage] = useState('');
  const [isBiometricBusy, setIsBiometricBusy] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAlarmState, setPendingAlarmState] = useState(null);
  const [authPinInput, setAuthPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [armingDelayTotalMs, setArmingDelayTotalMs] = useState(0);
  const [armingDelayEndAtMs, setArmingDelayEndAtMs] = useState(null);
  const [armingDelayNowMs, setArmingDelayNowMs] = useState(() => Date.now());
  const [armingTargetState, setArmingTargetState] = useState(null);
  const [isCameraDirectoryView, setIsCameraDirectoryView] = useState(() => resolveSecurityCamerasFromLocation());
  const [visibleSensorEntityIds, setVisibleSensorEntityIds] = useState(() => readStorageStringArray(STORAGE_KEYS.visibleSensorEntityIds));
  const [visibleCameraEntityIds, setVisibleCameraEntityIds] = useState(() => readStorageStringArray(STORAGE_KEYS.visibleCameraEntityIds));
  const [isSensorSelectorOpen, setIsSensorSelectorOpen] = useState(false);
  const [isCameraSelectorOpen, setIsCameraSelectorOpen] = useState(false);
  const deviceAuth = useDeviceAuth(deviceAuthUser ?? {
    id: selectedAlarmEntityId || 'security_dashboard',
    name: 'security_dashboard',
    displayName: 'Security Dashboard',
  });

  const availableAlarmEntities = useMemo(
    () => (alarmEntityOptions.length > 0 ? [...new Set(alarmEntityOptions)] : Object.keys(haStates).filter((id) => id.startsWith('alarm_control_panel.'))).sort((a, b) => a.localeCompare(b, 'it-IT')),
    [alarmEntityOptions, haStates],
  );
  const alarmDropdownOptions = useMemo(
    () =>
      availableAlarmEntities.map((entityId) => ({
        id: entityId,
        name: `${haStates[entityId]?.rawAttributes?.friendly_name ?? ''}`.trim() || entityId,
      })),
    [availableAlarmEntities, haStates],
  );

  const availableSensorEntities = useMemo(
    () => (sensorEntityOptions.length > 0 ? [...new Set(sensorEntityOptions)] : Object.keys(haStates).filter((id) => id.startsWith('binary_sensor.'))).sort((a, b) => a.localeCompare(b, 'it-IT')),
    [haStates, sensorEntityOptions],
  );

  const availableSecuritySensorEntities = useMemo(
    () => availableSensorEntities.filter((entityId) => isSecuritySensorEntity(entityId, haStates[entityId])),
    [availableSensorEntities, haStates],
  );

  const availableCameraEntities = useMemo(
    () => Object.keys(haStates).filter((id) => id.startsWith('camera.')).sort((a, b) => a.localeCompare(b, 'it-IT')),
    [haStates],
  );

  const selectedSensorEntityIds = useMemo(
    () => (visibleSensorEntityIds === null ? availableSecuritySensorEntities : visibleSensorEntityIds),
    [availableSecuritySensorEntities, visibleSensorEntityIds],
  );

  const selectedCameraEntityIds = useMemo(
    () => (visibleCameraEntityIds === null ? availableCameraEntities : visibleCameraEntityIds),
    [availableCameraEntities, visibleCameraEntityIds],
  );

  const sensors = useMemo(
    () => selectedSensorEntityIds.map((entityId) => ({
      entityId,
      name: resolveSensorFriendlyName(entityId, haStates[entityId]),
      type: resolveSensorType(entityId, haStates[entityId]),
      isOpen: isBinarySensorOpen(haStates[entityId]?.state),
    })),
    [selectedSensorEntityIds, haStates],
  );

  const filteredSensors = useMemo(() => {
    const q = sensorSearchQuery.trim().toLowerCase();
    if (!q) return sensors;
    return sensors.filter((s) => `${s.name}`.toLowerCase().includes(q) || `${s.entityId}`.toLowerCase().includes(q));
  }, [sensorSearchQuery, sensors]);

  const cameras = useMemo(
    () =>
      selectedCameraEntityIds.map((entityId) => {
        const liveEntity = haStates[entityId];
        const state = `${liveEntity?.state ?? ''}`.trim().toLowerCase();
        const snapshot =
          typeof liveEntity?.rawAttributes?.entity_picture === 'string' ? liveEntity.rawAttributes.entity_picture.trim() : '';
        return {
          entityId,
          name: resolveCameraFriendlyName(entityId, liveEntity),
          snapshot,
          hasPreview: snapshot.length > 0,
          isOffline: state === 'unavailable' || state === 'unknown' || state === '',
        };
      }),
    [selectedCameraEntityIds, haStates],
  );

  const sensorSelectionOptions = useMemo(
    () =>
      availableSecuritySensorEntities.map((entityId) => ({
        entityId,
        name: resolveSensorFriendlyName(entityId, haStates[entityId]),
      })),
    [availableSecuritySensorEntities, haStates],
  );

  const cameraSelectionOptions = useMemo(
    () =>
      availableCameraEntities.map((entityId) => ({
        entityId,
        name: resolveCameraFriendlyName(entityId, haStates[entityId]),
      })),
    [availableCameraEntities, haStates],
  );

  const activeAlarmEntity = selectedAlarmEntityId ? haStates[selectedAlarmEntityId] : undefined;
  const activeAlarmAttributes = activeAlarmEntity?.rawAttributes;
  const alarmCodeFormat = resolveAlarmCodeFormat(activeAlarmAttributes);
  const alarmCodeArmRequired = activeAlarmAttributes?.code_arm_required === true;
  const alarmHasCodeCapability = Boolean(alarmCodeFormat) || alarmCodeArmRequired;
  const alarmCodeTypeLabel = alarmCodeFormat === 'text' ? 'Codice' : 'PIN';
  const isAlarmCodeNumeric = alarmCodeFormat === 'number';

  const normalizedLiveAlarmState = normalizeAlarmState(activeAlarmEntity?.state ?? activeAlarmEntity?.stateLabel);
  const isLiveAlarmTransitioning = ['pending', 'arming', 'disarming'].includes(normalizedLiveAlarmState);
  const baseResolvedShieldState = haConnected && activeAlarmEntity ? mapAlarmStateForShield(normalizedLiveAlarmState, alarmState) : alarmState;

  const remainingDelayMs = armingDelayEndAtMs ? Math.max(0, armingDelayEndAtMs - armingDelayNowMs) : 0;
  const hasActiveArmingDelay = armingDelayTotalMs > 0 && remainingDelayMs > 0;
  const delayProgress = hasActiveArmingDelay ? Math.min(1, Math.max(0, 1 - remainingDelayMs / armingDelayTotalMs)) : 0;
  const delayRemainingSeconds = hasActiveArmingDelay ? Math.max(0, Math.ceil(remainingDelayMs / 1000)) : 0;
  const resolvedShieldState = hasActiveArmingDelay && baseResolvedShieldState !== 'pending' ? 'pending' : baseResolvedShieldState;

  const currentVisual = ALARM_VISUALS[resolvedShieldState];
  const alarmStatusLabel = hasActiveArmingDelay ? 'Inserimento in corso' : haConnected && activeAlarmEntity ? getAlarmStateLabel(normalizedLiveAlarmState) : currentVisual.badge;
  const isAlarmTransitioning = (haConnected && activeAlarmEntity && isLiveAlarmTransitioning) || resolvedShieldState === 'pending' || hasActiveArmingDelay;

  const pendingStateRequiresCode = pendingAlarmState ? isAlarmCodeRequiredForState(pendingAlarmState, activeAlarmAttributes) : false;
  const pendingAuthRequiresCode = pendingStateRequiresCode || !biometricAvailable || !deviceAuth.isEnrolled;

  const appendLog = (message, type = 'info') => {
    setLogs((curr) => [{ id: Date.now() + Math.round(Math.random() * 1000), time: toItalianClockTime(new Date()), message, type }, ...curr].slice(0, 10));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const run = async () => {
      const available = await deviceAuth.isBiometricAvailable();
      setBiometricAvailable(Boolean(available));
      setBiometricStatus(
        available
          ? deviceAuth.isEnrolled
            ? 'Passkey dispositivo configurata.'
            : 'Face ID / impronta disponibile: crea una passkey in modalita edit.'
          : 'Biometria non disponibile su questo browser/dispositivo.',
      );
    };
    void run();
  }, [deviceAuth]);

  useEffect(() => {
    if (typeof window === 'undefined' || suppressBrowserNavigation) return undefined;
    const syncFromLocation = () => setIsCameraDirectoryView(resolveSecurityCamerasFromLocation());
    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, [suppressBrowserNavigation]);

  useEffect(() => {
    if (!suppressBrowserNavigation || !navigationRoute) return;
    setIsCameraDirectoryView(isSecurityCamerasNavigationTarget(navigationRoute));
  }, [navigationRoute, suppressBrowserNavigation]);

  useEffect(() => {
    if (availableAlarmEntities.length > 0) {
      setSelectedAlarmEntityId((curr) => (curr && availableAlarmEntities.includes(curr) ? curr : availableAlarmEntities[0]));
    }
  }, [availableAlarmEntities]);

  useEffect(() => {
    setVisibleSensorEntityIds((curr) => {
      if (availableSecuritySensorEntities.length === 0) return curr === null ? null : [];
      const validIds = new Set(availableSecuritySensorEntities);
      if (curr === null) return [...availableSecuritySensorEntities];
      return curr.filter((entityId) => validIds.has(entityId));
    });
  }, [availableSecuritySensorEntities]);

  useEffect(() => {
    setVisibleCameraEntityIds((curr) => {
      if (availableCameraEntities.length === 0) return curr === null ? null : [];
      const validIds = new Set(availableCameraEntities);
      if (curr === null) return [...availableCameraEntities];
      return curr.filter((entityId) => validIds.has(entityId));
    });
  }, [availableCameraEntities]);

  useEffect(() => {
    if (!isEditMode) {
      setIsSensorSelectorOpen(false);
      setIsCameraSelectorOpen(false);
    }
  }, [isEditMode]);

  useEffect(() => {
    const sanitized = sanitizeAlarmCode(securityPin, alarmCodeFormat);
    if (sanitized !== securityPin) setSecurityPin(sanitized);
  }, [alarmCodeFormat, securityPin]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedAlarmEntityId) window.localStorage.setItem(STORAGE_KEYS.alarmEntityId, selectedAlarmEntityId);
      else window.localStorage.removeItem(STORAGE_KEYS.alarmEntityId);
    }
  }, [selectedAlarmEntityId]);

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEYS.alarmPin, securityPin);
  }, [securityPin]);

  useEffect(() => {
    if (typeof window !== 'undefined' && visibleSensorEntityIds !== null) {
      window.localStorage.setItem(STORAGE_KEYS.visibleSensorEntityIds, JSON.stringify(visibleSensorEntityIds));
    }
  }, [visibleSensorEntityIds]);

  useEffect(() => {
    if (typeof window !== 'undefined' && visibleCameraEntityIds !== null) {
      window.localStorage.setItem(STORAGE_KEYS.visibleCameraEntityIds, JSON.stringify(visibleCameraEntityIds));
    }
  }, [visibleCameraEntityIds]);

  useEffect(() => {
    if (!armingDelayEndAtMs || typeof window === 'undefined') return undefined;
    setArmingDelayNowMs(Date.now());
    const id = window.setInterval(() => setArmingDelayNowMs(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [armingDelayEndAtMs]);

  useEffect(() => {
    if (!armingDelayEndAtMs || remainingDelayMs > 0) return;
    setArmingDelayEndAtMs(null);
    setArmingDelayTotalMs(0);
    setArmingDelayNowMs(Date.now());
    if (!haConnected && armingTargetState) setAlarmState(armingTargetState);
    setArmingTargetState(null);
  }, [armingDelayEndAtMs, remainingDelayMs, haConnected, armingTargetState]);

  useEffect(() => {
    if (!haConnected || !activeAlarmEntity || !['pending', 'arming'].includes(normalizedLiveAlarmState) || armingDelayEndAtMs) return;
    const secs = resolveAlarmExitDelaySeconds(activeAlarmEntity.rawAttributes);
    if (!secs) return;
    const now = Date.now();
    const totalMs = Math.max(1000, secs * 1000);
    setArmingDelayTotalMs(totalMs);
    setArmingDelayEndAtMs(now + totalMs);
    setArmingDelayNowMs(now);
  }, [haConnected, activeAlarmEntity, normalizedLiveAlarmState, armingDelayEndAtMs]);

  useEffect(() => {
    if (!haConnected || !activeAlarmEntity || isLiveAlarmTransitioning || (!armingDelayEndAtMs && !armingDelayTotalMs)) return;
    if (armingTargetState && mapAlarmStateForShield(normalizedLiveAlarmState, alarmState) !== armingTargetState) return;
    setArmingDelayEndAtMs(null);
    setArmingDelayTotalMs(0);
    setArmingDelayNowMs(Date.now());
    setArmingTargetState(null);
  }, [haConnected, activeAlarmEntity, isLiveAlarmTransitioning, armingDelayEndAtMs, armingDelayTotalMs, armingTargetState, normalizedLiveAlarmState, alarmState]);

  const closeAuthModal = () => {
    if (!isAuthBusy) {
      setIsAuthModalOpen(false);
      setPendingAlarmState(null);
      setAuthPinInput('');
      setAuthError('');
    }
  };
  const applyAlarmState = async (nextState, authCode) => {
    const service = ALARM_SERVICE_BY_STATE[nextState];
    if (!service) return false;

    const requiresCode = isAlarmCodeRequiredForState(nextState, activeAlarmAttributes);
    const cleanedCode = sanitizeAlarmCode(authCode, alarmCodeFormat);
    if (requiresCode && !cleanedCode) {
      setAuthError(`${alarmCodeTypeLabel} richiesto dall'entita selezionata.`);
      return false;
    }

    if (haConnected && selectedAlarmEntityId && typeof onCallService === 'function') {
      const payload = { entity_id: selectedAlarmEntityId };
      if (cleanedCode) payload.code = cleanedCode;
      const ok = await onCallService('alarm_control_panel', service, payload);
      if (!ok) {
        setAuthError('Comando rifiutato da Home Assistant. Verifica entita e codice.');
        appendLog('Cambio stato allarme non riuscito', 'warning');
        return false;
      }
    }

    if (nextState === 'disarmed') {
      setAlarmState('disarmed');
      setArmingDelayTotalMs(0);
      setArmingDelayEndAtMs(null);
      setArmingDelayNowMs(Date.now());
      setArmingTargetState(null);
      appendLog('Allarme disinserito', 'success');
    } else {
      const delaySeconds = Math.max(1, Math.round(resolveAlarmExitDelaySeconds(activeAlarmEntity?.rawAttributes) ?? DEFAULT_ARMING_DELAY_SECONDS));
      const now = Date.now();
      const totalMs = delaySeconds * 1000;
      setArmingDelayTotalMs(totalMs);
      setArmingDelayEndAtMs(now + totalMs);
      setArmingDelayNowMs(now);
      setArmingTargetState(nextState);
      setAlarmState('pending');
      appendLog(`${nextState === 'armed_home' ? 'Inserimento Casa' : 'Inserimento Fuori'} avviato (${delaySeconds}s)`, 'info');
    }

    closeAuthModal();
    return true;
  };

  const requestAlarmStateChange = (nextState) => {
    if (isAlarmTransitioning) {
      appendLog('Cambio stato in corso: attendi il completamento.', 'info');
      return;
    }
    if (nextState === resolvedShieldState || isAuthBusy) return;

    const requiresCode = isAlarmCodeRequiredForState(nextState, activeAlarmAttributes);
    const storedCode = sanitizeAlarmCode(securityPin, alarmCodeFormat);
    if (biometricAvailable && deviceAuth.isEnrolled && (!requiresCode || storedCode.length > 0)) {
      setIsAuthBusy(true);
      void (async () => {
        try {
          const verified = await deviceAuth.authenticate(`Security Dashboard ${getAlarmStateLabel(nextState)}`);
          if (!verified) {
            appendLog('Autenticazione dispositivo annullata', 'warning');
            return;
          }
          await applyAlarmState(nextState, requiresCode ? storedCode : undefined);
        } finally {
          setIsAuthBusy(false);
        }
      })();
      return;
    }

    if (!requiresCode && UI_FLAGS.directCallWhenCodeNotRequired) {
      setIsAuthBusy(true);
      void (async () => {
        try {
          await applyAlarmState(nextState);
        } finally {
          setIsAuthBusy(false);
        }
      })();
      return;
    }

    setPendingAlarmState(nextState);
    setAuthPinInput('');
    setAuthError('');
    setIsAuthModalOpen(true);
  };

  const verifyWithPin = async () => {
    if (!pendingAlarmState) return;

    if (pendingAuthRequiresCode) {
      const cleanedInput = sanitizeAlarmCode(authPinInput, alarmCodeFormat);
      if (cleanedInput.length === 0) {
        setAuthError(`Inserisci ${alarmCodeTypeLabel.toLowerCase()} di sicurezza.`);
        return;
      }
      if (cleanedInput !== securityPin) {
        setAuthError(`${alarmCodeTypeLabel} non corretto.`);
        appendLog('Tentativo codice non valido', 'warning');
        return;
      }
      setIsAuthBusy(true);
      try {
        await applyAlarmState(pendingAlarmState, pendingStateRequiresCode ? cleanedInput : undefined);
      } finally {
        setIsAuthBusy(false);
      }
      return;
    }

    setIsAuthBusy(true);
    try {
      await applyAlarmState(pendingAlarmState);
    } finally {
      setIsAuthBusy(false);
    }
  };

  const enrollBiometric = async () => {
    if (!isEditMode) return;
    if (!biometricAvailable) {
      setBiometricMessage('Biometria non disponibile su questo dispositivo.');
      return;
    }

    setIsBiometricBusy(true);
    setBiometricMessage('');
    try {
      const wasEnrolled = deviceAuth.isEnrolled;
      const verified = await deviceAuth.verifyOrEnroll('Configurazione Security Dashboard');
      if (!verified) throw new Error('Verifica dispositivo annullata.');
      setBiometricMessage(wasEnrolled ? 'Autenticazione dispositivo verificata.' : 'Passkey dispositivo creata.');
      appendLog(wasEnrolled ? 'Biometria dispositivo verificata' : 'Passkey dispositivo creata', 'success');
    } catch {
      setBiometricMessage('Autenticazione dispositivo annullata o non riuscita.');
    } finally {
      setIsBiometricBusy(false);
    }
  };

  const pushPinDigit = (digit) => {
    if (!isAlarmCodeNumeric) return;
    if (authPinInput.length >= 8) return;
    setAuthPinInput((curr) => `${curr}${digit}`.slice(0, 8));
  };

  const popPinDigit = () => setAuthPinInput((curr) => curr.slice(0, -1));
  const clearPin = () => setAuthPinInput('');

  const primaryShieldActionTarget = resolvedShieldState === 'disarmed' ? 'armed_away' : 'disarmed';
  const primaryShieldActionLabel = primaryShieldActionTarget === 'disarmed' ? 'Disinserire' : 'Inserire Fuori';

  const toggleVisibleSensorEntity = (entityId) => {
    setVisibleSensorEntityIds((curr) => {
      const base = curr === null ? availableSecuritySensorEntities : curr;
      const exists = base.includes(entityId);
      if (exists) return base.filter((id) => id !== entityId);
      return [...base, entityId];
    });
  };

  const toggleVisibleCameraEntity = (entityId) => {
    setVisibleCameraEntityIds((curr) => {
      const base = curr === null ? availableCameraEntities : curr;
      const exists = base.includes(entityId);
      if (exists) return base.filter((id) => id !== entityId);
      return [...base, entityId];
    });
  };

  const selectAllSensors = () => setVisibleSensorEntityIds([...availableSecuritySensorEntities]);
  const selectNoSensors = () => setVisibleSensorEntityIds([]);
  const selectAllCameras = () => setVisibleCameraEntityIds([...availableCameraEntities]);
  const selectNoCameras = () => setVisibleCameraEntityIds([]);

  const navigateSecurityPage = (targetPath) => {
    const normalizedTarget = `${targetPath}`.trim();
    if (!normalizedTarget) return;
    if (suppressBrowserNavigation || typeof window === 'undefined') {
      setIsCameraDirectoryView(isSecurityCamerasNavigationTarget(normalizedTarget));
      return;
    }
    const currentRoute = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentRoute !== normalizedTarget) {
      window.history.pushState({}, '', normalizedTarget);
    }
    window.dispatchEvent(new PopStateEvent('popstate'));
    setIsCameraDirectoryView(isSecurityCamerasNavigationTarget(normalizedTarget));
  };

  const openAllCamerasPage = () => {
    if (isEditMode) return;
    navigateSecurityPage(SECURITY_CAMERAS_PATH);
  };
  const openSecurityOverviewPage = () => navigateSecurityPage(SECURITY_OVERVIEW_PATH);

  return (
    <div className={cn('h-full w-full overflow-y-auto', isCameraDirectoryView ? 'p-0' : 'px-4 py-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:p-6 lg:p-8')} style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      {!isCameraDirectoryView ? (
        <header className="liquid-glass-panel rounded-[26px] p-4 sm:rounded-[32px] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.15rem]">Sicurezza</h1>
              <p className="mt-2 text-sm font-light text-white/60">Controllo perimetrale e videosorveglianza</p>
            </div>
          </div>
        </header>
      ) : null}

      {isCameraDirectoryView ? (
        <div className="h-full">
          <SecurityCameraSection
            cameras={cameras}
            isDedicatedPage
            isEditMode={isEditMode}
            selectedCount={selectedCameraEntityIds.length}
            totalCount={availableCameraEntities.length}
            onOpenSelector={() => setIsCameraSelectorOpen(true)}
            onBackToOverview={openSecurityOverviewPage}
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4 sm:mt-6 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
            {!isEditMode ? (
              <SecurityMainShield
                visual={currentVisual}
                statusLabel={alarmStatusLabel}
                isTransitioning={isAlarmTransitioning}
                showDelayProgress={hasActiveArmingDelay}
                delayProgress={delayProgress}
                delayRemainingSeconds={delayRemainingSeconds}
                onPrimaryAction={() => requestAlarmStateChange(primaryShieldActionTarget)}
                primaryActionLabel={primaryShieldActionLabel}
                activeState={resolvedShieldState}
                onActionChange={requestAlarmStateChange}
                disabled={isAlarmTransitioning}
              />
            ) : (
              <section className="liquid-glass-panel rounded-[26px] p-4 sm:rounded-[32px] sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-light uppercase tracking-[0.28em] text-white/60">Config</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Impostazioni Sicurezza</h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/10 p-2"><Settings className="h-4 w-4 text-white/85" /></span>
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-xs font-light uppercase tracking-[0.16em] text-white/60">Entita allarme</span>
                    <GlassDropdown
                      className="mt-2"
                      options={alarmDropdownOptions}
                      selected={alarmDropdownOptions.find((option) => option.id === selectedAlarmEntityId) ?? null}
                      onChange={(option) => setSelectedAlarmEntityId(option.id)}
                      placeholder="Nessuna entita alarm_control_panel trovata"
                      disabled={alarmDropdownOptions.length === 0}
                    />
                  </label>

                  {alarmHasCodeCapability ? (
                    <label className="block">
                      <span className="text-xs font-light uppercase tracking-[0.16em] text-white/60">{alarmCodeTypeLabel} sicurezza</span>
                      <div className="relative mt-2">
                        <input type={isSecurityPinVisible ? 'text' : 'password'} value={securityPin} onChange={(event) => setSecurityPin(sanitizeAlarmCode(event.target.value, alarmCodeFormat))} className="liquid-glass-card w-full px-3 py-2.5 pr-11 text-sm text-white outline-none focus:border-white/35" placeholder={isAlarmCodeNumeric ? 'Inserisci PIN allarme' : 'Inserisci codice allarme'} />
                        <button type="button" onClick={() => setIsSecurityPinVisible((curr) => !curr)} className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-white/60 hover:text-white" aria-label={isSecurityPinVisible ? 'Nascondi codice' : 'Mostra codice'}>
                          {isSecurityPinVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </label>
                  ) : <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">L'entita selezionata non espone codice allarme.</p>}

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-sm font-semibold text-white">Face ID / Impronta</p>
                    <p className="mt-1 text-xs text-white/55">{biometricStatus}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={enrollBiometric} disabled={isBiometricBusy || !biometricAvailable} className={cn('rounded-xl border px-3 py-2 text-xs font-semibold', isBiometricBusy || !biometricAvailable ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/40' : 'border-white/20 bg-white/[0.1] text-white hover:bg-white/[0.18]')}>
                        {isBiometricBusy ? (deviceAuth.isEnrolled ? 'Verifica...' : 'Creazione...') : deviceAuth.isEnrolled ? 'Verifica dispositivo' : 'Crea passkey'}
                      </button>
                    </div>
                    {biometricMessage ? <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-200/90"><Check className="h-3.5 w-3.5" />{biometricMessage}</p> : null}
                  </div>
                </div>
              </section>
            )}

            <SecurityCameraSection
              cameras={cameras}
              previewLimit={MAX_CAMERAS_ON_DASHBOARD}
              isEditMode={isEditMode}
              selectedCount={selectedCameraEntityIds.length}
              totalCount={availableCameraEntities.length}
              onOpenSelector={() => setIsCameraSelectorOpen(true)}
              onOpenAll={openAllCamerasPage}
            />
          </div>

          <div className={cn('grid grid-cols-1 gap-4 sm:gap-6', UI_FLAGS.showEventFeed ? 'xl:grid-cols-2' : '')}>
            <SecuritySensorList
              sensors={filteredSensors}
              query={sensorSearchQuery}
              onQueryChange={setSensorSearchQuery}
              isEditMode={isEditMode}
              selectedCount={selectedSensorEntityIds.length}
              totalCount={availableSecuritySensorEntities.length}
              onOpenSelector={() => setIsSensorSelectorOpen(true)}
            />

            {UI_FLAGS.showEventFeed ? (
              <section className="liquid-glass-panel rounded-[26px] p-4 sm:rounded-[32px] sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-light uppercase tracking-[0.28em] text-white/60">Eventi Recenti</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">Log Sicurezza</h3>
                  </div>
                  <button type="button" onClick={() => appendLog('S.O.S. Emergenza attivato', 'warning')} className="inline-flex items-center gap-2 rounded-full border border-[#FF3B30]/45 bg-[#FF3B30]/18 px-3 py-1.5 text-xs font-semibold text-[#FFD2CF] hover:bg-[#FF3B30]/30">
                    <AlertTriangle className="h-3.5 w-3.5" />SOS
                  </button>
                </div>
                <ul className="mt-4 space-y-2">
                  {logs.map((log) => (
                    <li key={log.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-xs font-semibold uppercase tracking-[0.14em]', log.type === 'warning' ? 'text-amber-200/95' : log.type === 'success' ? 'text-emerald-200/95' : 'text-sky-200/95')}>
                          {log.message}
                        </p>
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-white/45"><Clock3 className="h-3.5 w-3.5" />{log.time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      )}

      <SecurityEntityPickerModal
        isOpen={isEditMode && isSensorSelectorOpen}
        title="Sensori di Sicurezza"
        description="Seleziona i sensori perimetrali/sicurezza da mostrare nel box."
        entities={sensorSelectionOptions}
        selectedEntityIds={selectedSensorEntityIds}
        onToggleEntity={toggleVisibleSensorEntity}
        onSelectAll={selectAllSensors}
        onSelectNone={selectNoSensors}
        onClose={() => setIsSensorSelectorOpen(false)}
      />

      <SecurityEntityPickerModal
        isOpen={isEditMode && isCameraSelectorOpen}
        title="Telecamere di Sicurezza"
        description="Seleziona le telecamere da mostrare nella dashboard Security."
        entities={cameraSelectionOptions}
        selectedEntityIds={selectedCameraEntityIds}
        onToggleEntity={toggleVisibleCameraEntity}
        onSelectAll={selectAllCameras}
        onSelectNone={selectNoCameras}
        onClose={() => setIsCameraSelectorOpen(false)}
      />

      <SecurityAuthModal
        isOpen={isAuthModalOpen}
        pendingAlarmState={pendingAlarmState}
        pendingStateRequiresCode={pendingAuthRequiresCode}
        authError={authError}
        isAuthBusy={isAuthBusy}
        isAlarmCodeNumeric={isAlarmCodeNumeric}
        alarmCodeTypeLabel={alarmCodeTypeLabel}
        authPinInput={authPinInput}
        onPinInputChange={(value) => setAuthPinInput(sanitizeAlarmCode(value, alarmCodeFormat))}
        onVerifyWithPin={verifyWithPin}
        onPushPinDigit={pushPinDigit}
        onPopPinDigit={popPinDigit}
        onClearPin={clearPin}
        onClose={closeAuthModal}
      />
    </div>
  );
}

export default SecurityDashboard;
