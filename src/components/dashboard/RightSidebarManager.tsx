import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  DoorOpen,
  HelpCircle,
  Home,
  LayoutGrid,
  Lightbulb,
  MonitorSmartphone,
  Music2,
  Rocket,
  Settings,
  ShieldCheck,
  Thermometer,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { ContextSidebar } from '../settings/ContextSidebar';
import GlassDropdown, { type GlassDropdownOption } from '../ui/GlassDropdown';
import { WidgetCardRenderer } from '../widgets/CardRenderer';
import { MiniRing } from '../widgets/micro/MiniRing';
import { MicroButton } from '../widgets/micro/MicroButton';
import { MicroSuperChart } from '../widgets/micro/MicroSuperChart';
import { MicroStep } from '../widgets/micro/MicroStep';
import { MicroSlider } from '../widgets/micro/MicroSlider';
import { MicroToggle } from '../widgets/micro/MicroToggle';
import { StatusGlow } from '../widgets/micro/StatusGlow';
import { ValuePill } from '../widgets/micro/ValuePill';
import type { CameraPtzDirection } from '../settings/CameraControls';
import type { ActiveDevice } from '../settings/types';
import type { MockEntityState, MockEntityStateMap } from '../../types/ha';
import type { DashboardStateShape } from '../../hooks/useDashboardState';
import type {
  DashboardSection,
  SceneActionConfig,
  SceneActionType,
  SceneIconKey,
  SceneKey,
  WeatherSecondaryInfo,
  Widget,
  WidgetKind,
  MicroWidget,
} from '../../types/dashboardModels';
import { ROOT_CANVAS_COLS } from '../../types/dashboardModels';
import {
  SIDEBAR_PATH_ICON_KEYS,
  type SidebarQuickPath,
  type SidebarQuickPathIconKey,
} from '../../hooks/useProfileSettings';
import type { DashboardTheme } from '../../hooks/useProfileSettings';
import { getGreetingDefaults } from '../widgets/GreetingCard';
import { getSceneIconNode, SCENE_ICON_OPTIONS, SCENES_CATALOG } from '../widgets/ScenesCard';
import { GRID_ENGINE_COLS } from './DashboardGrid';
import { resolveWidgetTypeLayoutSpan } from './dashboardBreakpointConfig';
import type {
  DashboardGridBreakpoint,
  WidgetTypeBreakpointLayoutOverride,
  WidgetTypeLayoutOverrides,
} from '../../types/widgetTypeLayout';

type ContextSidebarActions = {
  toggleLamp: () => void;
  setLampBrightness: (value: number) => void;
  setLampColorTemp: (kelvin: number) => void;
  setLampHsColor: (hs: [number, number]) => void;
  toggleClimatePower: () => void;
  decreaseClimateTarget: () => void;
  increaseClimateTarget: () => void;
  autoAdjustClimate: () => void;
  nudgeClimateCurrent: () => void;
  setClimateTargetTemp: (value: number) => void;
  setClimateTargetRange: (low: number, high: number) => void;
  setClimateMode: (mode: string) => void;
  setClimateFanMode: (mode: string) => void;
  toggleSpeakerPlayback: () => void;
  toggleSpeakerPower: () => void;
  previousSpeakerTrack: () => void;
  nextSpeakerTrack: () => void;
  seekSpeakerPosition: (position: number) => void;
  setSpeakerVolume: (value: number) => void;
  toggleSpeakerMute: () => void;
  toggleSpeakerShuffle: () => void;
  cycleSpeakerRepeatMode: () => void;
  selectSpeakerOutputDevice: (deviceId: string) => void;
  toggleSpeakerGroupMember: (deviceId: string, shouldJoin: boolean) => void;
  disarmAlarm: (code?: string) => boolean | void | Promise<boolean | void>;
  armAlarmHome: (code?: string) => boolean | void | Promise<boolean | void>;
  armAlarmAway: (code?: string) => boolean | void | Promise<boolean | void>;
  armAlarmNight: (code?: string) => boolean | void | Promise<boolean | void>;
  armAlarmVacation: (code?: string) => boolean | void | Promise<boolean | void>;
  armAlarmCustomBypass: (code?: string) => boolean | void | Promise<boolean | void>;
  triggerAlarm: (code?: string) => boolean | void | Promise<boolean | void>;
  startVacuum: () => void;
  pauseVacuum: () => void;
  stopVacuum: () => void;
  returnVacuumToBase: () => void;
  locateVacuum: () => void;
  cleanVacuumSpot: () => void;
  cleanVacuumArea: (areaIds: string[]) => void;
  setVacuumFanSpeed: (fanSpeed: string) => void;
  sendVacuumCommand: (command: string, params?: unknown) => void;
  lockDoor: (code?: string) => void;
  unlockDoor: (code?: string) => boolean | void;
  openDoor: (code?: string) => void;
  openCover: () => void;
  closeCover: () => void;
  stopCover: () => void;
  setCoverPosition: (position: number) => void;
  setCoverTiltPosition: (position: number) => void;
  moveCameraPtz: (direction: CameraPtzDirection) => void;
  stopCameraPtz: () => void;
};

const SIDEBAR_PATH_ICON_MAP: Record<SidebarQuickPathIconKey, typeof LayoutGrid> = {
  dashboard: LayoutGrid,
  devices: MonitorSmartphone,
  settings: Settings,
  automation: Rocket,
  security: ShieldCheck,
  help: HelpCircle,
  home: Home,
  rooms: DoorOpen,
  chart: BarChart3,
  light: Lightbulb,
  climate: Thermometer,
  media: Music2,
};

const STACK_SECTION_MIN_COLUMNS = 2;
const WEATHER_UNIT_OPTIONS: GlassDropdownOption[] = [
  { id: 'C', name: '\u00B0C' },
  { id: 'F', name: '\u00B0F' },
];
const WEATHER_LAYOUT_OPTIONS: GlassDropdownOption[] = [
  { id: 'auto', name: 'Auto' },
  { id: 'card', name: 'Card' },
  { id: 'chip', name: 'Chip' },
];
const WEATHER_FORECAST_TYPE_OPTIONS: GlassDropdownOption[] = [
  { id: 'daily', name: 'Giornaliero' },
  { id: 'hourly', name: 'Orario' },
];
const SCENE_ACTION_TYPE_OPTIONS: GlassDropdownOption[] = [
  { id: 'script', name: 'Script' },
  { id: 'service', name: 'Servizio' },
];

const DEFAULT_ACTIVITY_LOG_HOURS = 24;
const DEFAULT_ACTIVITY_LOG_ENTRIES = 6;
const MIN_ACTIVITY_LOG_HOURS = 1;
const MAX_ACTIVITY_LOG_HOURS = 168;
const MIN_ACTIVITY_LOG_ENTRIES = 1;
const MAX_ACTIVITY_LOG_ENTRIES = 30;
const SCENE_ACTION_SERVICE_SUGGESTIONS = [
  'script.turn_on',
  'scene.turn_on',
  'light.turn_on',
  'light.turn_off',
  'media_player.media_play_pause',
  'vacuum.start',
];
const GRID_LAYOUT_PREVIEW_MAX_ROWS = 6;
const GRID_BREAKPOINT_LABEL: Record<DashboardGridBreakpoint, string> = {
  '2xl': '2XL',
  xs: 'XS',
  sm: 'SM',
  md: 'MD',
  lg: 'LG',
  xl: 'XL',
};

function clampActivityLogHours(value: number) {
  return Math.max(MIN_ACTIVITY_LOG_HOURS, Math.min(MAX_ACTIVITY_LOG_HOURS, Math.round(value)));
}

function clampActivityLogEntries(value: number) {
  return Math.max(MIN_ACTIVITY_LOG_ENTRIES, Math.min(MAX_ACTIVITY_LOG_ENTRIES, Math.round(value)));
}

function findDropdownOption(options: GlassDropdownOption[], id: string | number) {
  return options.find((option) => option.id === String(id)) ?? options[0] ?? null;
}

function clampGridSpan(value: number, max: number) {
  return Math.max(1, Math.min(max, Math.round(value)));
}

const WEATHER_LAYOUT_PREVIEWS: Record<
  'auto' | 'chip' | 'card',
  { title: string; description: string; chips: string[] }
> = {
  auto: {
    title: 'Auto responsive',
    description: 'Passa automaticamente tra chip e card in base allo spazio disponibile.',
    chips: ['Chip 2x2', 'Card 4x4'],
  },
  chip: {
    title: 'Chip fisso 2x2',
    description: 'Formato compatto: temperatura, icona animata e seconda info.',
    chips: ['2 colonne', '2 righe'],
  },
  card: {
    title: 'Card fissa 4x4',
    description: 'Formato esteso: header meteo completo con previsioni sottostanti.',
    chips: ['4 colonne', '4 righe'],
  },
};

type WeatherSecondaryInfoOption = {
  value: WeatherSecondaryInfo;
  label: string;
  description: string;
};

const WEATHER_SECONDARY_INFO_META: Record<WeatherSecondaryInfo, WeatherSecondaryInfoOption> = {
  auto: {
    value: 'auto',
    label: 'Auto',
    description: 'Scelta automatica in base ai dati disponibili.',
  },
  precipitation: {
    value: 'precipitation',
    label: 'Pioggia',
    description: 'Probabilita di precipitazione.',
  },
  wind: {
    value: 'wind',
    label: 'Vento',
    description: 'Velocita del vento.',
  },
  humidity: {
    value: 'humidity',
    label: 'Umidita',
    description: 'Percentuale umidita relativa.',
  },
  pressure: {
    value: 'pressure',
    label: 'Pressione',
    description: 'Pressione atmosferica.',
  },
  visibility: {
    value: 'visibility',
    label: 'Visibilita',
    description: 'Distanza di visibilita.',
  },
  uv_index: {
    value: 'uv_index',
    label: 'Indice UV',
    description: 'Indice UV attuale.',
  },
  cloud_coverage: {
    value: 'cloud_coverage',
    label: 'Nuvolosita',
    description: 'Copertura nuvolosa.',
  },
  dew_point: {
    value: 'dew_point',
    label: 'Dew point',
    description: 'Punto di rugiada.',
  },
  condition: {
    value: 'condition',
    label: 'Condizione',
    description: 'Descrizione meteo sintetica.',
  },
  range: {
    value: 'range',
    label: 'Range H/L',
    description: 'Temperatura minima e massima.',
  },
};

function toFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function hasNumericAttribute(attributes: Record<string, unknown> | undefined, keys: string[]) {
  if (!attributes) {
    return false;
  }
  return keys.some((key) => toFiniteNumber(attributes[key]) !== undefined);
}

function resolveWeatherSecondaryInfoOptions(weather: DashboardStateShape['weather']): WeatherSecondaryInfoOption[] {
  const attrs = weather.rawAttributes;
  const firstForecast = weather.forecast[0];
  const hasPrecipitation =
    hasNumericAttribute(attrs, ['precipitation_probability', 'rain_probability', 'precipitation']) ||
    toFiniteNumber(firstForecast?.precipitationProbability) !== undefined ||
    toFiniteNumber(firstForecast?.precipitationAmount) !== undefined ||
    toFiniteNumber(firstForecast?.precipitation) !== undefined ||
    (toFiniteNumber(weather.precipitation) ?? 0) > 0 ||
    (toFiniteNumber(weather.precipitationAmount) ?? 0) > 0;
  const hasWind =
    hasNumericAttribute(attrs, ['wind_speed', 'native_wind_speed', 'wind_gust_speed']) ||
    toFiniteNumber(firstForecast?.windSpeed) !== undefined ||
    toFiniteNumber(firstForecast?.windGustSpeed) !== undefined ||
    (toFiniteNumber(weather.windSpeed) ?? 0) > 0;
  const hasHumidity =
    hasNumericAttribute(attrs, ['humidity', 'relative_humidity']) ||
    toFiniteNumber(firstForecast?.humidity) !== undefined ||
    toFiniteNumber(weather.humidity) !== undefined;
  const hasPressure =
    hasNumericAttribute(attrs, ['pressure']) ||
    toFiniteNumber(firstForecast?.pressure) !== undefined ||
    toFiniteNumber(weather.pressure) !== undefined;
  const hasVisibility =
    hasNumericAttribute(attrs, ['visibility']) ||
    toFiniteNumber(weather.visibility) !== undefined;
  const hasUv =
    hasNumericAttribute(attrs, ['uv_index']) ||
    toFiniteNumber(firstForecast?.uvIndex) !== undefined ||
    toFiniteNumber(weather.uvIndex) !== undefined;
  const hasCloudCoverage =
    hasNumericAttribute(attrs, ['cloud_coverage']) ||
    toFiniteNumber(firstForecast?.cloudCoverage) !== undefined ||
    toFiniteNumber(weather.cloudCoverage) !== undefined;
  const hasDewPoint =
    hasNumericAttribute(attrs, ['dew_point', 'native_dew_point']) ||
    toFiniteNumber(firstForecast?.dewPoint) !== undefined ||
    toFiniteNumber(weather.dewPoint) !== undefined;

  const options: WeatherSecondaryInfoOption[] = [WEATHER_SECONDARY_INFO_META.auto];
  if (hasPrecipitation) {
    options.push(WEATHER_SECONDARY_INFO_META.precipitation);
  }
  if (hasWind) {
    options.push(WEATHER_SECONDARY_INFO_META.wind);
  }
  if (hasHumidity) {
    options.push(WEATHER_SECONDARY_INFO_META.humidity);
  }
  if (hasPressure) {
    options.push(WEATHER_SECONDARY_INFO_META.pressure);
  }
  if (hasVisibility) {
    options.push(WEATHER_SECONDARY_INFO_META.visibility);
  }
  if (hasUv) {
    options.push(WEATHER_SECONDARY_INFO_META.uv_index);
  }
  if (hasCloudCoverage) {
    options.push(WEATHER_SECONDARY_INFO_META.cloud_coverage);
  }
  if (hasDewPoint) {
    options.push(WEATHER_SECONDARY_INFO_META.dew_point);
  }
  options.push(WEATHER_SECONDARY_INFO_META.condition, WEATHER_SECONDARY_INFO_META.range);
  return options;
}

type RightSidebarManagerProps = {
  isEditMode: boolean;
  isCompactViewport?: boolean;
  theme?: DashboardTheme;
  activeDevice: ActiveDevice | null;
  onCloseContextSidebar: () => void;
  state: DashboardStateShape;
  camera: {
    name: string;
    status?: string;
    entityId?: string;
    streamUrl?: string;
    snapshotUrl?: string;
    isOffline?: boolean;
    supportsPtz?: boolean;
    rawAttributes?: Record<string, unknown>;
  };
  alarm: {
    name: string;
    state: string;
    status?: string;
    codeArmRequired?: boolean;
    unlockCode?: string;
    requireAuthToDisarm?: boolean;
    changedBy?: string;
    activityLogLimit?: number;
    activityLogHours?: number;
    activityTimeline?: Array<{
      id: string;
      text: string;
    }>;
    activityTimelineStatus?: 'idle' | 'loading' | 'available' | 'empty' | 'unavailable' | 'offline';
    supportedFeatures?: number;
    rawAttributes?: Record<string, unknown>;
  };
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
    rawAttributes?: Record<string, unknown>;
  };
  lock: {
    name: string;
    state: string;
    status?: string;
    changedBy?: string;
    activityLogLimit?: number;
    activityLogHours?: number;
    activityTimeline?: Array<{
      id: string;
      text: string;
    }>;
    activityTimelineStatus?: 'idle' | 'loading' | 'available' | 'empty' | 'unavailable' | 'offline';
    supportedFeatures?: number;
    rawAttributes?: Record<string, unknown>;
    lockCode?: string;
  };
  cover: {
    name: string;
    state: string;
    status?: string;
    position?: number;
    tiltPosition?: number;
    supportedFeatures?: number;
    supportsOpen?: boolean;
    supportsClose?: boolean;
    supportsStop?: boolean;
    supportsSetPosition?: boolean;
    supportsSetTiltPosition?: boolean;
    rawAttributes?: Record<string, unknown>;
  };
  vacuumAreas?: Array<{
    id: string;
    name: string;
  }>;
  actions: ContextSidebarActions;
  onToggleMicroWidget?: (entityId: string, nextActive: boolean) => void;
  onSetMicroSliderValue?: (entityId: string, value: number) => void;
  onNavigateMicroWidgetPage?: (path: string) => void;
  microChartHistoryByEntity?: Record<string, number[]>;
  onUpdateUserName: (name: string) => void;
  selectedWidget: Widget | null;
  selectedSection: DashboardSection | null;
  selectedSidebarPath: SidebarQuickPath | null;
  sidebarPaths?: SidebarQuickPath[];
  weatherConfig: DashboardSection | null;
  activeGridBreakpoint: DashboardGridBreakpoint;
  widgetTypeLayoutOverrides?: WidgetTypeLayoutOverrides;
  entityOptions: Record<WidgetKind, string[]>;
  haEntityIds?: string[];
  haConnected?: boolean;
  haStates?: MockEntityStateMap;
  onUpdateWidget: (id: string, updater: (widget: Widget) => Widget) => void;
  onUpdateWidgetTypeLayoutOverride: (
    kind: WidgetKind,
    breakpoint: DashboardGridBreakpoint,
    nextOverride: WidgetTypeBreakpointLayoutOverride | null,
  ) => void;
  onUpdateSection: (id: string, updater: (section: DashboardSection) => DashboardSection) => void;
  onUpdateSidebarPath: (id: string, patch: Partial<Omit<SidebarQuickPath, 'id'>>) => void;
  onRemoveSelectedWidget: () => void;
  onRemoveSection: (id: string) => void;
  onRemoveSidebarPath: (id: string) => void;
};

const MICRO_WIDGET_CATALOG: Array<{
  type: MicroWidget['type'];
  label: string;
  description: string;
}> = [
  {
    type: 'value_pill',
    label: 'Value Pill',
    description: 'Valore principale con label secondaria.',
  },
  {
    type: 'status_glow',
    label: 'Status Glow',
    description: 'Indicatore stato con glow dinamico.',
  },
  {
    type: 'mini_ring',
    label: 'Mini Ring',
    description: 'Ring compatto con progress circolare.',
  },
  {
    type: 'micro_toggle',
    label: 'Micro Toggle',
    description: 'Interruttore mini con stato on/off.',
  },
  {
    type: 'micro_button',
    label: 'Button',
    description: 'Pulsante con azione push, switch o pagina.',
  },
  {
    type: 'micro_slider',
    label: 'Slider',
    description: 'Controllo numerico per entita input_number/number.',
  },
  {
    type: 'micro_step',
    label: 'Step',
    description: 'Controllo orizzontale con incremento/decremento su + e -.',
  },
  {
    type: 'micro_superchart',
    label: 'Superchart',
    description: 'Grafico mini live con scelta tipo line/area/bar.',
  },
];

const MICRO_TOGGLE_COMPATIBLE_DOMAINS = new Set([
  'light',
  'switch',
  'input_boolean',
  'fan',
  'media_player',
  'script',
  'automation',
  'scene',
  'cover',
  'lock',
  'vacuum',
]);
const MINI_RING_COMPATIBLE_DOMAINS = new Set([
  'light',
  'cover',
  'fan',
  'vacuum',
  'media_player',
  'sensor',
  'number',
  'input_number',
  'climate',
]);
const STATUS_GLOW_COMPATIBLE_DOMAINS = new Set([
  'binary_sensor',
  'sensor',
  'switch',
  'light',
  'lock',
  'alarm_control_panel',
  'media_player',
  'person',
  'device_tracker',
  'vacuum',
  'cover',
  'fan',
  'climate',
  'script',
  'automation',
  'scene',
]);
const MICRO_SLIDER_COMPATIBLE_DOMAINS = new Set(['input_number', 'number']);
const MICRO_STEP_COMPATIBLE_DOMAINS = new Set(['input_number', 'number']);
const MICRO_SUPERCHART_COMPATIBLE_DOMAINS = new Set(['sensor', 'number', 'input_number']);
const MICRO_WIDGET_CATALOG_ENTITY_LIMIT = 80;
const MICRO_WIDGET_CATALOG_DOMAIN_LIMIT = 10;

function extractEntityDomain(entityId: string | undefined) {
  const trimmed = (entityId ?? '').trim().toLowerCase();
  if (!trimmed.includes('.')) {
    return '';
  }
  return trimmed.split('.')[0] ?? '';
}

function resolveEntityStateById(haStates: MockEntityStateMap, entityId: string | undefined) {
  const normalizedEntityId = (entityId ?? '').trim();
  if (!normalizedEntityId) {
    return undefined;
  }
  return haStates[normalizedEntityId] ?? haStates[normalizedEntityId.toLowerCase()];
}

function resolveEntityHistoryById(historyMap: Record<string, number[]>, entityId: string | undefined) {
  const normalizedEntityId = (entityId ?? '').trim();
  if (!normalizedEntityId) {
    return undefined;
  }
  return historyMap[normalizedEntityId] ?? historyMap[normalizedEntityId.toLowerCase()];
}

function scoreEntitySearchMatch(entityId: string, query: string) {
  const normalizedEntityId = entityId.trim().toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return 0;
  }
  if (normalizedEntityId === normalizedQuery) {
    return 1000;
  }
  if (normalizedEntityId.startsWith(normalizedQuery)) {
    return 900 - normalizedEntityId.length * 0.01;
  }
  const [domain = '', objectId = ''] = normalizedEntityId.split('.', 2);
  if (objectId === normalizedQuery) {
    return 850;
  }
  if (objectId.startsWith(normalizedQuery)) {
    return 800 - objectId.length * 0.01;
  }
  const dottedQueryIndex = normalizedEntityId.indexOf(`.${normalizedQuery}`);
  if (dottedQueryIndex >= 0) {
    return 650 - dottedQueryIndex * 0.01;
  }
  const includesIndex = normalizedEntityId.indexOf(normalizedQuery);
  if (includesIndex >= 0) {
    return 500 - includesIndex * 0.01;
  }
  if (domain.startsWith(normalizedQuery)) {
    return 250 - domain.length * 0.01;
  }
  return Number.NEGATIVE_INFINITY;
}

function formatEntityDomainLabel(domain: string) {
  return domain.replaceAll('_', ' ');
}

function isMicroWidgetTypeCompatible(type: MicroWidget['type'], entityId: string | undefined) {
  const domain = extractEntityDomain(entityId);
  if (!domain) {
    return true;
  }
  if (type === 'value_pill' || type === 'micro_button') {
    return true;
  }
  if (type === 'micro_slider') {
    return MICRO_SLIDER_COMPATIBLE_DOMAINS.has(domain);
  }
  if (type === 'micro_step') {
    return MICRO_STEP_COMPATIBLE_DOMAINS.has(domain);
  }
  if (type === 'micro_superchart') {
    return MICRO_SUPERCHART_COMPATIBLE_DOMAINS.has(domain);
  }
  if (type === 'status_glow') {
    return STATUS_GLOW_COMPATIBLE_DOMAINS.has(domain);
  }
  if (type === 'mini_ring') {
    return MINI_RING_COMPATIBLE_DOMAINS.has(domain);
  }
  return MICRO_TOGGLE_COMPATIBLE_DOMAINS.has(domain);
}

function buildFallbackMicroWidgetState(type: MicroWidget['type'], label: string): MockEntityState {
  if (type === 'value_pill') {
    return {
      state: 'on',
      stateLabel: 'Attivo',
      numericValue: 24,
      unit: 'C',
      rawAttributes: { friendly_name: label },
    };
  }
  if (type === 'status_glow') {
    return {
      state: 'on',
      stateLabel: 'Connesso',
      rawAttributes: { friendly_name: label },
    };
  }
  if (type === 'mini_ring') {
    return {
      state: 'on',
      numericValue: 72,
      unit: '%',
      rawAttributes: { friendly_name: label },
    };
  }
  if (type === 'micro_button') {
    return {
      state: 'off',
      stateLabel: 'Switch',
      toggleOn: false,
      rawAttributes: { friendly_name: label },
    };
  }
  if (type === 'micro_slider') {
    return {
      state: '42',
      numericValue: 42,
      unit: '%',
      rawAttributes: { friendly_name: label, min: 0, max: 100, step: 1, unit_of_measurement: '%' },
    };
  }
  if (type === 'micro_step') {
    return {
      state: '42',
      numericValue: 42,
      unit: '%',
      rawAttributes: { friendly_name: label, min: 0, max: 100, step: 1, unit_of_measurement: '%' },
    };
  }
  if (type === 'micro_superchart') {
    return {
      state: '31',
      numericValue: 31,
      unit: '',
      rawAttributes: { friendly_name: label, unit_of_measurement: '' },
    };
  }
  return {
    state: 'on',
    stateLabel: 'Acceso',
    toggleOn: true,
    rawAttributes: { friendly_name: label },
  };
}

function renderMicroWidgetPreview(widget: MicroWidget, state: MockEntityState | undefined, history?: number[]) {
  if (widget.type === 'value_pill') {
    return <ValuePill widget={widget} state={state} />;
  }
  if (widget.type === 'status_glow') {
    return <StatusGlow widget={widget} state={state} />;
  }
  if (widget.type === 'mini_ring') {
    return <MiniRing widget={widget} state={state} />;
  }
  if (widget.type === 'micro_button') {
    return <MicroButton widget={widget} state={state} />;
  }
  if (widget.type === 'micro_slider') {
    return <MicroSlider widget={widget} state={state} sendOnRelease={widget.sliderSendOnRelease ?? true} />;
  }
  if (widget.type === 'micro_step') {
    return <MicroStep widget={widget} state={state} />;
  }
  if (widget.type === 'micro_superchart') {
    return <MicroSuperChart widget={widget} state={state} history={history} />;
  }
  return <MicroToggle widget={widget} state={state} />;
}

export function RightSidebarManager({
  isEditMode,
  isCompactViewport = false,
  theme = 'dark',
  activeDevice,
  onCloseContextSidebar,
  state,
  camera,
  alarm,
  vacuum,
  lock,
  cover,
  vacuumAreas = [],
  actions,
  onToggleMicroWidget,
  onSetMicroSliderValue,
  onNavigateMicroWidgetPage,
  microChartHistoryByEntity = {},
  onUpdateUserName,
  selectedWidget,
  selectedSection,
  selectedSidebarPath,
  sidebarPaths = [],
  weatherConfig,
  activeGridBreakpoint,
  widgetTypeLayoutOverrides = {},
  entityOptions,
  haEntityIds = [],
  haConnected = false,
  haStates = {},
  onUpdateWidget,
  onUpdateWidgetTypeLayoutOverride,
  onUpdateSection,
  onUpdateSidebarPath,
  onRemoveSelectedWidget,
  onRemoveSection,
  onRemoveSidebarPath,
}: RightSidebarManagerProps) {
  const sidebarWidthClass =
    'w-[clamp(17.5rem,46vw,22.5rem)] md:w-[clamp(18rem,34vw,24rem)] lg:w-[clamp(18rem,28vw,23rem)] xl:w-[clamp(18.5rem,25vw,24rem)] h-full min-h-0 shrink-0';
  const [isContextSheetDragging, setIsContextSheetDragging] = React.useState(false);
  const [contextSheetDragOffset, setContextSheetDragOffset] = React.useState(0);
  const [isMicroWidgetCatalogOpen, setIsMicroWidgetCatalogOpen] = React.useState(false);
  const [microWidgetCatalogEntity, setMicroWidgetCatalogEntity] = React.useState('');
  const [microWidgetCatalogDomainFilter, setMicroWidgetCatalogDomainFilter] = React.useState('all');
  const [selectedMicroWidgetId, setSelectedMicroWidgetId] = React.useState<string | null>(null);
  const [widgetConfigTab, setWidgetConfigTab] = React.useState<'layout' | 'settings'>('settings');
  const selectedWidgetMicroWidgets = selectedWidget?.widgets;
  const hasEditSelection = Boolean(selectedWidget || selectedSection || selectedSidebarPath);
  const contextSheetStartYRef = React.useRef<number | null>(null);
  const contextSheetPointerIdRef = React.useRef<number | null>(null);
  const contextSheetDragOffsetRef = React.useRef(0);
  const CONTEXT_SHEET_CLOSE_THRESHOLD_PX = 88;
  const shouldShowCompactContextSheet = !isEditMode && isCompactViewport && Boolean(activeDevice);
  const shouldShowCompactEditSheet = isEditMode && isCompactViewport && hasEditSelection;
  const shouldShowAnyCompactSheet = shouldShowCompactContextSheet || shouldShowCompactEditSheet;
  const isLightTheme = theme === 'light';

  React.useEffect(() => {
    setWidgetConfigTab('settings');
  }, [selectedWidget?.id]);

  const resetContextSheetDrag = React.useCallback(() => {
    setIsContextSheetDragging(false);
    setContextSheetDragOffset(0);
    contextSheetStartYRef.current = null;
    contextSheetPointerIdRef.current = null;
    contextSheetDragOffsetRef.current = 0;
  }, []);

  const handleContextSheetDragStart = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    contextSheetStartYRef.current = event.clientY;
    contextSheetPointerIdRef.current = event.pointerId;
    contextSheetDragOffsetRef.current = 0;
    setContextSheetDragOffset(0);
    setIsContextSheetDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const handleContextSheetDragMove = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (contextSheetPointerIdRef.current !== event.pointerId || contextSheetStartYRef.current === null) {
      return;
    }
    const nextOffset = Math.max(0, event.clientY - contextSheetStartYRef.current);
    contextSheetDragOffsetRef.current = nextOffset;
    setContextSheetDragOffset(nextOffset);
  }, []);

  const finishContextSheetDrag = React.useCallback(
    (event?: React.PointerEvent<HTMLDivElement>) => {
      if (event && contextSheetPointerIdRef.current !== event.pointerId) {
        return;
      }
      if (event) {
        try {
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        } catch {
          // no-op: some browsers throw if capture was already released
        }
      }
      const shouldClose = contextSheetDragOffsetRef.current >= CONTEXT_SHEET_CLOSE_THRESHOLD_PX;
      if (shouldClose) {
        onCloseContextSidebar();
      }
      resetContextSheetDrag();
    },
    [onCloseContextSidebar, resetContextSheetDrag],
  );
  React.useEffect(() => {
    if (!shouldShowAnyCompactSheet) {
      resetContextSheetDrag();
    }
  }, [resetContextSheetDrag, shouldShowAnyCompactSheet]);
  React.useEffect(() => {
    setIsMicroWidgetCatalogOpen(false);
  }, [isEditMode, selectedWidget?.id]);
  React.useEffect(() => {
    setMicroWidgetCatalogEntity('');
    setMicroWidgetCatalogDomainFilter('all');
  }, [selectedWidget?.id]);
  React.useEffect(() => {
    setSelectedMicroWidgetId(null);
  }, [selectedWidget?.id]);
  React.useEffect(() => {
    if (!selectedWidgetMicroWidgets || selectedWidgetMicroWidgets.length === 0) {
      setSelectedMicroWidgetId((current) => (current === null ? current : null));
      return;
    }
    setSelectedMicroWidgetId((current) => {
      if (!current) {
        return current;
      }
      return selectedWidgetMicroWidgets.some((entry) => entry.id === current) ? current : null;
    });
  }, [selectedWidgetMicroWidgets]);

  const applyWidgetTypeLayoutSelection = React.useCallback(
    (nextW: number, nextH: number) => {
      if (!selectedWidget) {
        return;
      }
      const layoutCols = Math.max(1, Math.round(GRID_ENGINE_COLS[activeGridBreakpoint] ?? 1));
      const safeW = clampGridSpan(nextW, layoutCols);
      const safeH = clampGridSpan(nextH, GRID_LAYOUT_PREVIEW_MAX_ROWS);
      const runtimeH =
        selectedWidget.kind === 'light' && selectedWidget.isOn && safeH <= 1
          ? 2
          : safeH;

      onUpdateWidget(selectedWidget.id, (widget) => ({
        ...widget,
        layout: {
          ...widget.layout,
          w: safeW,
          h: runtimeH,
        },
      }));

      if (selectedWidget.kind === 'light') {
        onUpdateWidgetTypeLayoutOverride(selectedWidget.kind, activeGridBreakpoint, {
          w: safeW,
          hOn: safeH,
          hOff: safeH,
        });
        return;
      }
      onUpdateWidgetTypeLayoutOverride(selectedWidget.kind, activeGridBreakpoint, {
        w: safeW,
        h: safeH,
      });
    },
    [activeGridBreakpoint, onUpdateWidget, onUpdateWidgetTypeLayoutOverride, selectedWidget],
  );

  const resetWidgetTypeLayoutSelection = React.useCallback(() => {
    if (!selectedWidget) {
      return;
    }
    onUpdateWidgetTypeLayoutOverride(selectedWidget.kind, activeGridBreakpoint, null);
  }, [activeGridBreakpoint, onUpdateWidgetTypeLayoutOverride, selectedWidget]);

  const contextDeviceTitle = activeDevice?.name?.trim() || 'Dispositivo';
  const contextDeviceSubtitle =
    typeof activeDevice?.status === 'string' && activeDevice.status.trim().length > 0
      ? activeDevice.status.trim()
      : 'Controlli dispositivo';
  const renderAppleSwitch = ({
    checked,
    onChange,
    disabled = false,
    label,
  }: {
    checked: boolean;
    onChange: (nextChecked: boolean) => void;
    disabled?: boolean;
    label: string;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-[3.25rem] shrink-0 items-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300/60 disabled:cursor-not-allowed disabled:opacity-45 ${
        checked
          ? 'bg-lime-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]'
          : isLightTheme
            ? 'bg-slate-300'
            : 'bg-white/18'
      }`}
    >
      <span
        className={`absolute left-[3px] h-[1.625rem] w-[1.625rem] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.28)] transition-transform duration-200 ${
          checked ? 'translate-x-[1.25rem]' : 'translate-x-0'
        }`}
      />
    </button>
  );
  const contextSidebarPanel = (
    <ContextSidebar
      activeDevice={activeDevice}
      isEditMode={isEditMode}
      theme={theme}
      onClose={onCloseContextSidebar}
      showCloseButton={false}
      externalScrollContainer
      haStates={haStates}
      microChartHistoryByEntity={microChartHistoryByEntity}
      lamp={state.lamp}
      climate={state.climate}
      camera={camera}
      speaker={state.speaker}
      vacuum={vacuum}
      vacuumAreas={vacuumAreas}
      weather={state.weather}
      alarm={alarm}
      lock={lock}
      cover={cover}
      weatherConfig={
        weatherConfig
          ? {
              unit: weatherConfig.weatherUnit,
              forecastType: weatherConfig.weatherForecastType,
              forecastDays: weatherConfig.weatherForecastDays,
              forecastDensity: weatherConfig.weatherForecastDensity,
              conditionOverride: weatherConfig.weatherCondition,
              showPrecipitation: weatherConfig.weatherShowPrecipitation,
              showWind: weatherConfig.weatherShowWind,
            }
          : undefined
      }
      actions={actions}
      onToggleMicroWidget={onToggleMicroWidget}
      onSetMicroSliderValue={onSetMicroSliderValue}
      onNavigateMicroWidgetPage={onNavigateMicroWidgetPage}
    />
  );

  if (!isEditMode) {
    if (isCompactViewport) {
      return (
        <AnimatePresence>
          {activeDevice ? (
            <React.Fragment>
              <motion.button
                key="device-context-overlay"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onCloseContextSidebar}
                className="fixed inset-0 z-[188] bg-black/60 backdrop-blur-sm transition-opacity"
                aria-label="Chiudi pannello contestuale"
              />

              <div className="fixed inset-0 z-[189] pointer-events-none flex items-end">
                <motion.section
                  key="device-context-mobile"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full"
                >
                  <div
                    className="device-context-surface pointer-events-auto flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-[2rem] border-l border-white/[0.08] bg-white/[0.02] shadow-[0_0_40px_rgba(0,0,0,0.3)] backdrop-blur-3xl"
                    style={
                      contextSheetDragOffset > 0
                        ? { transform: `translateY(${contextSheetDragOffset}px)`, transitionDuration: '0ms' }
                        : undefined
                    }
                  >
                    <div
                      className={`touch-none ${isContextSheetDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                      onPointerDown={handleContextSheetDragStart}
                      onPointerMove={handleContextSheetDragMove}
                      onPointerUp={finishContextSheetDrag}
                      onPointerCancel={finishContextSheetDrag}
                    >
                      <span className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2" />
                    </div>

                    <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-3 md:px-5 md:pt-5 md:pb-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-white font-semibold tracking-tight text-xl">{contextDeviceTitle}</h2>
                        <p className="mt-1 text-[#8E8E93] text-sm">{contextDeviceSubtitle}</p>
                      </div>
                      <button
                        type="button"
                        onClick={onCloseContextSidebar}
                        className="btn-premium w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 active:scale-95 transition-all"
                        aria-label="Chiudi popup dispositivo"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scrollbar [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]">
                      {contextSidebarPanel}
                    </div>
                  </div>
                </motion.section>
              </div>

              <style
                dangerouslySetInnerHTML={{
                  __html: `
                    .device-context-surface button {
                      transition-property: transform, background-color, color, border-color;
                      transition-duration: 300ms;
                    }
                    .device-context-surface button:active {
                      transform: scale(0.95);
                    }
                  `,
                }}
              />
            </React.Fragment>
          ) : null}
        </AnimatePresence>
      );
    }

    return (
      <div className={`${sidebarWidthClass} overflow-hidden rounded-[2rem] border-l border-white/[0.08] bg-white/[0.02] shadow-[0_0_40px_rgba(0,0,0,0.3)] backdrop-blur-3xl`}>
        <ContextSidebar
          activeDevice={activeDevice}
          isEditMode={isEditMode}
          theme={theme}
          onClose={onCloseContextSidebar}
          haStates={haStates}
          microChartHistoryByEntity={microChartHistoryByEntity}
          lamp={state.lamp}
          climate={state.climate}
          camera={camera}
          speaker={state.speaker}
          vacuum={vacuum}
          vacuumAreas={vacuumAreas}
          weather={state.weather}
          alarm={alarm}
          lock={lock}
          cover={cover}
          weatherConfig={
            weatherConfig
              ? {
                  unit: weatherConfig.weatherUnit,
                  forecastType: weatherConfig.weatherForecastType,
                  forecastDays: weatherConfig.weatherForecastDays,
                  forecastDensity: weatherConfig.weatherForecastDensity,
                  conditionOverride: weatherConfig.weatherCondition,
                  showPrecipitation: weatherConfig.weatherShowPrecipitation,
                  showWind: weatherConfig.weatherShowWind,
                }
              : undefined
          }
          actions={actions}
          onToggleMicroWidget={onToggleMicroWidget}
          onSetMicroSliderValue={onSetMicroSliderValue}
          onNavigateMicroWidgetPage={onNavigateMicroWidgetPage}
        />
      </div>
    );
  }

  const greetingDefaults = selectedSection?.kind === 'greeting' ? getGreetingDefaults(state) : null;
  const titleAuto = selectedSection?.titleAuto ?? true;
  const subtitleAuto = selectedSection?.subtitleAuto ?? true;
  const showWeather = selectedSection?.kind === 'greeting' ? selectedSection.showWeather ?? true : selectedSection?.kind === 'weather';
  const sectionTitleValue = titleAuto ? greetingDefaults?.title ?? '' : selectedSection?.title ?? '';
  const sectionSubtitleValue = subtitleAuto ? greetingDefaults?.subtitle ?? '' : selectedSection?.subtitle ?? '';
  const weatherLayout = selectedSection?.weatherLayout ?? 'auto';
  const weatherUnit = selectedSection?.weatherUnit ?? 'C';
  const weatherEntityId = selectedSection?.weatherEntityId ?? '';
  const weatherForecastType = selectedSection?.weatherForecastType === 'hourly' ? 'hourly' : 'daily';
  const weatherForecastDays = selectedSection?.weatherForecastDays ?? 4;
  const weatherSecondaryInfo = selectedSection?.weatherSecondaryInfo ?? 'auto';
  const weatherSecondaryInfoOptions = resolveWeatherSecondaryInfoOptions(state.weather);
  const weatherSecondaryDropdownOptions = weatherSecondaryInfoOptions.map((option) => ({
    id: option.value,
    name: option.label,
  }));
  const weatherSecondaryInfoValues = new Set(weatherSecondaryInfoOptions.map((option) => option.value));
  const safeWeatherSecondaryInfo = weatherSecondaryInfoValues.has(weatherSecondaryInfo)
    ? weatherSecondaryInfo
    : 'auto';
  const weatherSelectedInfoMeta = WEATHER_SECONDARY_INFO_META[safeWeatherSecondaryInfo];
  const weatherLayoutPreview = WEATHER_LAYOUT_PREVIEWS[weatherLayout];
  const weatherForecastDayOptions = (weatherForecastType === 'hourly' ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7]).map(
    (days) => ({
      id: String(days),
      name: `${days} ${weatherForecastType === 'hourly' ? 'ore' : 'giorni'}`,
    }),
  );
  const isStackGridSection = selectedSection?.kind === 'stack-grid';
  const activeCanvasCols = Math.max(1, Math.round(GRID_ENGINE_COLS[activeGridBreakpoint] ?? 1));
  const stackColumnOptionMax = ROOT_CANVAS_COLS;
  const stackManualColumnOptions = Array.from({ length: stackColumnOptionMax - STACK_SECTION_MIN_COLUMNS + 1 }, (_, index) => {
    const option = STACK_SECTION_MIN_COLUMNS + index;
    return {
      id: String(option),
      name: `${option} colonne`,
    };
  });
  const stackColumnsAutoMode = isStackGridSection && selectedSection?.stackColumnsMode !== 'manual';
  const stackCanvasColumnOptions = isStackGridSection
    ? [
        {
          id: 'auto',
          name: 'Auto (da contenuto)',
        },
        ...stackManualColumnOptions,
      ]
    : stackManualColumnOptions;
  const weatherEntitySuggestions = haConnected
    ? haEntityIds.filter((entityId) => entityId.startsWith('weather.'))
    : [];
  const scenesSelected = selectedSection?.scenes ?? SCENES_CATALOG.slice(0, 4).map((scene) => scene.id);
  const sceneLabels: Partial<Record<SceneKey, string>> = selectedSection?.sceneLabels ?? {};
  const sceneIcons: Partial<Record<SceneKey, SceneIconKey>> = selectedSection?.sceneIcons ?? {};
  const sceneActions: Partial<Record<SceneKey, SceneActionConfig>> = selectedSection?.sceneActions ?? {};
  const sceneScripts: Partial<Record<SceneKey, string>> = selectedSection?.sceneScripts ?? {};
  const sceneScriptSuggestions = haConnected
    ? haEntityIds.filter((entityId) => entityId.startsWith('script.'))
    : [];
  const sceneScriptDatalistId = selectedSection
    ? `scene-script-options-${selectedSection.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`
    : 'scene-script-options';
  const sceneServiceDatalistId = selectedSection
    ? `scene-service-options-${selectedSection.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`
    : 'scene-service-options';
  const scenesShowBackground = selectedSection?.scenesShowBackground ?? true;
  const scenesShowBorder = selectedSection?.scenesShowBorder ?? true;
  const stackShowBackground = selectedSection?.stackShowBackground ?? true;
  const stackShowBorder = selectedSection?.stackShowBorder ?? true;
  const stackShowHeader = selectedSection?.stackShowHeader ?? true;
  const stackUseFavoritesGrid = selectedSection?.stackUseFavoritesGrid ?? false;
  const stackCanvasColumns =
    selectedSection?.kind === 'stack-vertical' || !selectedSection
      ? 1
      : Math.max(STACK_SECTION_MIN_COLUMNS, Math.min(stackColumnOptionMax, Math.round(selectedSection.layout.w)));
  const stackCanvasColumnSelectionId =
    selectedSection?.kind === 'stack-vertical' || !selectedSection
      ? '1'
      : stackColumnsAutoMode
        ? 'auto'
        : String(stackCanvasColumns);
  const layoutEditorCols = activeCanvasCols;
  const selectedWidgetLayoutSpan = selectedWidget
    ? resolveWidgetTypeLayoutSpan(selectedWidget.kind, activeGridBreakpoint, widgetTypeLayoutOverrides)
    : null;
  const selectedWidgetTypeOverride = selectedWidget
    ? widgetTypeLayoutOverrides[selectedWidget.kind]?.[activeGridBreakpoint]
    : undefined;
  const layoutPickerWidth = clampGridSpan(selectedWidgetLayoutSpan?.w ?? 1, layoutEditorCols);
  const layoutPickerHeight = clampGridSpan(selectedWidgetLayoutSpan?.h ?? 1, GRID_LAYOUT_PREVIEW_MAX_ROWS);
  const layoutPreviewRows = Math.max(GRID_LAYOUT_PREVIEW_MAX_ROWS, layoutPickerHeight);
  const isCompactLayoutEditor = activeGridBreakpoint === 'sm' || activeGridBreakpoint === 'xs';
  const layoutGridCompactCellPx = 38;
  const layoutGridCompactMaxWidth = isCompactLayoutEditor
    ? layoutEditorCols * layoutGridCompactCellPx + Math.max(0, layoutEditorCols - 1) * 6 + 16
    : null;
  const selectedWidgetLiveEntity = selectedWidget
    ? resolveEntityStateById(haStates, selectedWidget.entityId)
    : undefined;
  const selectedWidgetSensorHistory =
    selectedWidget?.kind === 'sensor'
      ? resolveEntityHistoryById(microChartHistoryByEntity, selectedWidget.entityId)
      : undefined;
  const selectedWidgetPreviewValue =
    toFiniteNumber(selectedWidgetLiveEntity?.numericValue) ??
    toFiniteNumber(selectedWidget?.value) ??
    0;
  const layoutPreviewCardGapPx = isCompactLayoutEditor ? 10 : 12;
  const layoutPreviewCellWidthPx = isCompactLayoutEditor ? 96 : 88;
  const layoutPreviewCellHeightPx = isCompactLayoutEditor ? 54 : 58;
  const layoutPreviewCardWidthPx = Math.max(
    isCompactLayoutEditor ? 96 : 104,
    Math.min(
      isCompactLayoutEditor ? 312 : 368,
      layoutPickerWidth * layoutPreviewCellWidthPx + Math.max(0, layoutPickerWidth - 1) * layoutPreviewCardGapPx,
    ),
  );
  const layoutPreviewCardHeightPx = Math.max(
    isCompactLayoutEditor ? 96 : 110,
    Math.min(
      isCompactLayoutEditor ? 312 : 368,
      layoutPickerHeight * layoutPreviewCellHeightPx + Math.max(0, layoutPickerHeight - 1) * layoutPreviewCardGapPx,
    ),
  );
  const isLightLayoutType = selectedWidget?.kind === 'light';
  const selectedWidgetPreview = selectedWidget
    ? {
        ...selectedWidget,
        layout: {
          ...selectedWidget.layout,
          w: layoutPickerWidth,
          h: isLightLayoutType && selectedWidget.isOn && layoutPickerHeight <= 1
            ? 2
            : layoutPickerHeight,
        },
      }
    : null;

  const entityDomain = selectedWidget
    ? selectedWidget.kind === 'media'
      ? 'media_player.'
      : selectedWidget.kind === 'alarm'
        ? 'alarm_control_panel.'
      : `${selectedWidget.kind}.`
    : '';
  const liveEntitySuggestions = haConnected
    ? haEntityIds.filter((entityId) => (entityDomain ? entityId.startsWith(entityDomain) : true))
    : [];
  const staticSuggestions = selectedWidget ? entityOptions[selectedWidget.kind] ?? [] : [];
  const entitySuggestions = Array.from(new Set([...liveEntitySuggestions, ...staticSuggestions]));
  const microWidgets = selectedWidget?.widgets ?? [];
  const selectedMicroWidget = selectedMicroWidgetId
    ? microWidgets.find((entry) => entry.id === selectedMicroWidgetId) ?? null
    : null;
  const selectedMicroWidgetIndex = selectedMicroWidget
    ? microWidgets.findIndex((entry) => entry.id === selectedMicroWidget.id)
    : -1;
  const selectedMicroButtonMode =
    selectedMicroWidget?.type === 'micro_button'
      ? selectedMicroWidget.buttonMode ?? 'switch'
      : null;
  const selectedMicroSliderSendOnRelease =
    selectedMicroWidget?.type === 'micro_slider'
      ? selectedMicroWidget.sliderSendOnRelease ?? true
      : true;
  const selectedMicroSuperChartType =
    selectedMicroWidget?.type === 'micro_superchart'
      ? selectedMicroWidget.superChartType ?? 'line'
      : 'line';
  const microWidgetEntitySuggestions = haConnected ? haEntityIds : [];
  const configuredMicroWidgetEntities = microWidgets
    .map((microWidget) => microWidget.entity.trim())
    .filter((entityId) => entityId.length > 0);
  const microWidgetEntityOptions = Array.from(
    new Set([
      ...configuredMicroWidgetEntities,
      ...microWidgetEntitySuggestions,
      selectedWidget?.entityId?.trim() ?? '',
    ].filter((entityId) => entityId.length > 0)),
  );
  const microWidgetDatalistId = selectedWidget
    ? `micro-widget-entities-${selectedWidget.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`
    : 'micro-widget-entities';
  const microWidgetPagePathDatalistId = selectedWidget
    ? `micro-widget-pages-${selectedWidget.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`
    : 'micro-widget-pages';
  const microWidgetPageOptions = Array.from(
    new Set(
      [
        ...sidebarPaths
          .map((entry) => entry.path.trim())
          .filter((path) => path.length > 0),
        '/home',
        '/automations',
        '/security',
        '/consumi',
        '/appgallery',
      ].filter((path) => path.length > 0),
    ),
  );
  const defaultMicroWidgetPagePath = microWidgetPageOptions[0] ?? '/home';
  const microWidgetPathLabelByPath = new Map(
    sidebarPaths
      .map((entry) => [entry.path.trim(), entry.label.trim()] as const)
      .filter(([path]) => path.length > 0),
  );
  const catalogEntityId = microWidgetCatalogEntity.trim();
  const normalizedCatalogEntityQuery = catalogEntityId.toLowerCase();
  const catalogDomainFilter = microWidgetCatalogDomainFilter === 'all' ? '' : microWidgetCatalogDomainFilter;
  const catalogEntityDomainOptions = (() => {
    const counts = new Map<string, number>();
    microWidgetEntityOptions.forEach((entityId) => {
      const domain = extractEntityDomain(entityId);
      if (!domain) {
        return;
      }
      counts.set(domain, (counts.get(domain) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((first, second) => {
        if (second[1] !== first[1]) {
          return second[1] - first[1];
        }
        return first[0].localeCompare(second[0]);
      })
      .slice(0, MICRO_WIDGET_CATALOG_DOMAIN_LIMIT);
  })();
  const filteredCatalogEntityOptions = (() => {
    const scopedOptions = microWidgetEntityOptions.filter((entityId) => {
      if (!catalogDomainFilter) {
        return true;
      }
      return entityId.toLowerCase().startsWith(`${catalogDomainFilter}.`);
    });
    const sortedOptions = scopedOptions
      .map((entityId) => ({
        entityId,
        score: scoreEntitySearchMatch(entityId, normalizedCatalogEntityQuery),
      }))
      .filter((entry) => (normalizedCatalogEntityQuery ? Number.isFinite(entry.score) : true))
      .sort((first, second) => {
        if (second.score !== first.score) {
          return second.score - first.score;
        }
        return first.entityId.localeCompare(second.entityId);
      })
      .slice(0, MICRO_WIDGET_CATALOG_ENTITY_LIMIT);
    return sortedOptions.map((entry) => entry.entityId);
  })();
  const hasCatalogEntitySelection = catalogEntityId.length > 0;
  const compatibleMicroWidgetCatalog = MICRO_WIDGET_CATALOG.filter((catalogItem) =>
    isMicroWidgetTypeCompatible(catalogItem.type, catalogEntityId),
  );
  const appendMicroWidget = (type: MicroWidget['type'], entityId = catalogEntityId) => {
    if (!selectedWidget) {
      return;
    }
    const normalizedEntityId = entityId.trim();
    if (!normalizedEntityId) {
      return;
    }
    const nextMicroWidgetId = `micro-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
    onUpdateWidget(selectedWidget.id, (widget) => {
      const nextIndex = (widget.widgets ?? []).length + 1;
      const nextMicroWidget: MicroWidget = {
        id: nextMicroWidgetId,
        type,
        entity: normalizedEntityId,
        label: `Widget ${nextIndex}`,
        buttonMode: type === 'micro_button' ? 'switch' : undefined,
        buttonHoldWhilePressed: type === 'micro_button' ? false : undefined,
        buttonPagePath: type === 'micro_button' ? defaultMicroWidgetPagePath : undefined,
        sliderSendOnRelease: type === 'micro_slider' ? true : undefined,
        superChartType: type === 'micro_superchart' ? 'line' : undefined,
      };
      return {
        ...widget,
        widgets: [...(widget.widgets ?? []), nextMicroWidget],
      };
    });
    setSelectedMicroWidgetId(nextMicroWidgetId);
  };
  const sensorMetaSuggestions = haConnected
    ? haEntityIds.filter(
        (entityId) =>
          entityId.startsWith('sensor.') ||
          entityId.startsWith('binary_sensor.') ||
          entityId.startsWith('device_tracker.') ||
          entityId.startsWith('switch.'),
      )
    : [];
  const sensorBatterySuggestions = haConnected
    ? haEntityIds.filter((entityId) => entityId.startsWith('sensor.') || entityId.startsWith('number.'))
    : [];
  const sensorDatalistId =
    selectedWidget?.kind === 'sensor'
      ? selectedWidget.id.replace(/[^a-zA-Z0-9_-]/g, '-')
      : 'sensor-widget';
  const resolveSceneAction = (sceneId: SceneKey): SceneActionConfig => {
    const configured = sceneActions[sceneId];
    if (configured) {
      return configured;
    }
    const legacyScript = sceneScripts[sceneId];
    if (legacyScript?.trim().length) {
      return {
        type: 'script',
        scriptEntityId: legacyScript,
      };
    }
    return {
      type: 'script',
    };
  };
  const resolveSceneLabel = (sceneId: SceneKey, fallback: string) => {
    const customLabel = sceneLabels[sceneId]?.trim();
    return customLabel && customLabel.length > 0 ? customLabel : fallback;
  };
  const resolveSceneIconKey = (sceneId: SceneKey, fallback: SceneIconKey): SceneIconKey => {
    return sceneIcons[sceneId] ?? fallback;
  };
  const resolveSceneIconLabel = (iconKey: SceneIconKey) => {
    return SCENE_ICON_OPTIONS.find((option) => option.id === iconKey)?.label ?? iconKey;
  };
  const upsertSceneLabel = (section: DashboardSection, sceneId: SceneKey, nextLabel: string): DashboardSection => {
    const nextSceneLabels: Partial<Record<SceneKey, string>> = {
      ...(section.sceneLabels ?? {}),
    };
    if (nextLabel.trim().length === 0) {
      delete nextSceneLabels[sceneId];
    } else {
      nextSceneLabels[sceneId] = nextLabel;
    }
    return {
      ...section,
      sceneLabels: Object.keys(nextSceneLabels).length ? nextSceneLabels : undefined,
    };
  };
  const upsertSceneIcon = (
    section: DashboardSection,
    sceneId: SceneKey,
    nextIconKey: SceneIconKey | '',
  ): DashboardSection => {
    const nextSceneIcons: Partial<Record<SceneKey, SceneIconKey>> = {
      ...(section.sceneIcons ?? {}),
    };
    if (!nextIconKey) {
      delete nextSceneIcons[sceneId];
    } else {
      nextSceneIcons[sceneId] = nextIconKey;
    }
    return {
      ...section,
      sceneIcons: Object.keys(nextSceneIcons).length ? nextSceneIcons : undefined,
    };
  };
  const upsertSceneAction = (
    section: DashboardSection,
    sceneId: SceneKey,
    updater: (current: SceneActionConfig) => SceneActionConfig,
  ): DashboardSection => {
    const nextSceneActions: Partial<Record<SceneKey, SceneActionConfig>> = {
      ...(section.sceneActions ?? {}),
    };
    const currentAction =
      nextSceneActions[sceneId] ??
      (section.sceneScripts?.[sceneId]?.trim().length
        ? {
            type: 'script' as const,
            scriptEntityId: section.sceneScripts?.[sceneId],
          }
        : {
            type: 'script' as const,
          });
    const nextAction = updater(currentAction);
    const hasMeaningfulValue =
      Boolean(nextAction.type) ||
      (nextAction.scriptEntityId?.trim().length ?? 0) > 0 ||
      (nextAction.service?.trim().length ?? 0) > 0 ||
      (nextAction.entityId?.trim().length ?? 0) > 0 ||
      (nextAction.payloadJson?.trim().length ?? 0) > 0;

    if (hasMeaningfulValue) {
      nextSceneActions[sceneId] = nextAction;
    } else {
      delete nextSceneActions[sceneId];
    }

    return {
      ...section,
      sceneActions: Object.keys(nextSceneActions).length ? nextSceneActions : undefined,
    };
  };
  const isCompactEditOverlayMode = isEditMode && isCompactViewport;
  const compactEditPanelVisible = isCompactEditOverlayMode && hasEditSelection;
  const editSidebarContainerClass = isCompactEditOverlayMode
    ? `fixed inset-x-0 bottom-0 z-[219] flex max-h-[92dvh] min-h-[16rem] w-full flex-col rounded-t-[2rem] border border-white/[0.08] bg-white/[0.02] p-3 py-2 shadow-[0_0_40px_rgba(0,0,0,0.3)] backdrop-blur-3xl transition-all duration-250 ${
        compactEditPanelVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
      }`
    : `${sidebarWidthClass} flex flex-col rounded-[2rem] border-l border-white/[0.08] bg-white/[0.02] p-3 py-1 shadow-[0_0_40px_rgba(0,0,0,0.3)] backdrop-blur-3xl sm:p-4 sm:py-2 lg:p-5`;
  const editSidebarStyle =
    isCompactEditOverlayMode && contextSheetDragOffset > 0
      ? { transform: `translateY(${contextSheetDragOffset}px)`, transitionDuration: '0ms' }
      : undefined;

  return (
    <>
      <AnimatePresence>
        {compactEditPanelVisible ? (
          <motion.button
            key="edit-sidebar-overlay"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCloseContextSidebar}
            className="fixed inset-0 z-[218] bg-black/60 backdrop-blur-sm transition-opacity"
            aria-label="Chiudi pannello configurazione"
          />
        ) : null}
      </AnimatePresence>
      <aside className={editSidebarContainerClass} style={editSidebarStyle}>
      {isCompactEditOverlayMode ? (
        <div
          className={`mb-2 flex justify-center touch-none ${isContextSheetDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={handleContextSheetDragStart}
          onPointerMove={handleContextSheetDragMove}
          onPointerUp={finishContextSheetDrag}
          onPointerCancel={finishContextSheetDrag}
        >
          <span className="h-1.5 w-12 rounded-full bg-white/20" />
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Builder</p>
          <h3 className="text-xl font-semibold mt-2">Card Properties</h3>
        </div>
        {hasEditSelection ? (
          <button
            type="button"
            onClick={onCloseContextSidebar}
            className="-mt-1 -mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/80 transition-colors hover:bg-white/15 hover:text-white active:scale-95"
            aria-label="Chiudi pannello contestuale"
            title="Chiudi"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>
      {!selectedWidget && !selectedSection && !selectedSidebarPath ? (
        <div className="liquid-glass-card flex-1 mt-5 rounded-2xl border-dashed flex items-center justify-center text-center p-6">
          <p className="text-sm text-white/60">
            Seleziona una card, sezione o path
            <br />
            per configurarne le proprieta.
          </p>
        </div>
      ) : selectedSidebarPath ? (
        <div className="flex-1 mt-5 flex flex-col min-h-0">
          <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
            <label className="block">
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Nome Path</p>
              <input
                value={selectedSidebarPath.label}
                onChange={(event) =>
                  onUpdateSidebarPath(selectedSidebarPath.id, {
                    label: event.target.value,
                  })
                }
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
              />
            </label>
            <label className="block">
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Path</p>
              <input
                value={selectedSidebarPath.path}
                onChange={(event) =>
                  onUpdateSidebarPath(selectedSidebarPath.id, {
                    path: event.target.value,
                  })
                }
                placeholder="/home, #home, ?view=home"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
              />
              <p className="mt-2 text-[11px] text-white/45">
                In edit mode cliccando il path selezioni questa configurazione, in dashboard mode navighi alla destinazione.
              </p>
            </label>
            <div className="block">
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Icona</p>
              <div className="grid grid-cols-5 gap-2">
                {SIDEBAR_PATH_ICON_KEYS.map((iconKey) => {
                  const Icon = SIDEBAR_PATH_ICON_MAP[iconKey] ?? LayoutGrid;
                  const active = selectedSidebarPath.icon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() =>
                        onUpdateSidebarPath(selectedSidebarPath.id, {
                          icon: iconKey,
                        })
                      }
                      className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-colors ${
                        active
                          ? 'border-blue-300/45 bg-blue-500/18 text-blue-100'
                          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                      title={iconKey}
                      aria-label={`Imposta icona ${iconKey}`}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRemoveSidebarPath(selectedSidebarPath.id)}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/45 bg-rose-500/16 px-4 py-2.5 text-sm font-semibold text-rose-100 hover:bg-rose-500/26"
          >
            <X size={16} />
            Rimuovi Path
          </button>
        </div>
      ) : selectedSection ? (
        <div className="flex-1 mt-5 flex flex-col min-h-0">
          {selectedSection.kind === 'greeting' ? (
            <>
              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                <label className="block">
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Nome utente</p>
                  <input
                    value={state.userName}
                    onChange={(event) => onUpdateUserName(event.target.value)}
                    placeholder="Nome"
                    disabled={haConnected}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <p className="mt-2 text-[11px] text-white/45">
                    {haConnected
                      ? 'Con Home Assistant connesso, il saluto usa automaticamente l utente autenticato.'
                      : 'Usato nei saluti automatici.'}
                  </p>
                </label>
                <label className="block">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/50">Titolo</p>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSection(selectedSection.id, (section) => {
                          const nextAuto = !(section.titleAuto ?? true);
                          const nextTitle =
                            !nextAuto && (!section.title || section.title.trim().length === 0)
                              ? greetingDefaults?.title ?? ''
                              : section.title;
                          return {
                            ...section,
                            titleAuto: nextAuto,
                            title: nextTitle,
                          };
                        })
                      }
                      className={`text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full border transition-colors ${
                        titleAuto
                          ? 'border-blue-300/40 bg-blue-500/20 text-blue-100'
                          : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10'
                      }`}
                    >
                      Auto
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={sectionTitleValue}
                    onChange={(event) =>
                      onUpdateSection(selectedSection.id, (section) => ({
                        ...section,
                        title: event.target.value,
                      }))
                    }
                    disabled={titleAuto}
                    className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </label>
                <label className="block">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/50">Subtitle</p>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSection(selectedSection.id, (section) => {
                          const nextAuto = !(section.subtitleAuto ?? true);
                          const nextSubtitle =
                            !nextAuto && (!section.subtitle || section.subtitle.trim().length === 0)
                              ? greetingDefaults?.subtitle ?? ''
                              : section.subtitle;
                          return {
                            ...section,
                            subtitleAuto: nextAuto,
                            subtitle: nextSubtitle,
                          };
                        })
                      }
                      className={`text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full border transition-colors ${
                        subtitleAuto
                          ? 'border-blue-300/40 bg-blue-500/20 text-blue-100'
                          : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10'
                      }`}
                    >
                      Auto
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={sectionSubtitleValue}
                    onChange={(event) =>
                      onUpdateSection(selectedSection.id, (section) => ({
                        ...section,
                        subtitle: event.target.value,
                      }))
                    }
                    disabled={subtitleAuto}
                    className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </label>
                <div className="liquid-glass-card p-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/55">Meteo nella card</p>
                      <p className="mt-1 text-[11px] text-white/45">
                        Mostra il widget meteo dentro la card saluto.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSection(selectedSection.id, (section) => ({
                          ...section,
                          showWeather: !(section.showWeather ?? true),
                        }))
                      }
                      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                        showWeather
                          ? 'border-emerald-300/45 bg-emerald-500/20 text-emerald-100'
                          : 'border-white/15 bg-white/6 text-white/60 hover:bg-white/12'
                      }`}
                    >
                      {showWeather ? 'Attivo' : 'Disattivo'}
                    </button>
                  </div>
                  {showWeather ? (
                    <div className="space-y-3 border-t border-white/10 pt-3">
                      <div className="liquid-glass-card rounded-xl px-3 py-2.5">
                        <p className="text-[11px] font-medium text-white/78">Layout meteo responsive</p>
                        <p className="mt-1 text-[11px] text-white/52">
                          In questa card unificata il meteo usa chip su xs/sm e card previsioni su md/lg.
                        </p>
                      </div>
                      <label className="block">
                        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Unita</p>
                        <GlassDropdown
                          options={WEATHER_UNIT_OPTIONS}
                          selected={findDropdownOption(WEATHER_UNIT_OPTIONS, weatherUnit)}
                          onChange={(option) =>
                            onUpdateSection(selectedSection.id, (section) => ({
                              ...section,
                              weatherUnit: option.id as typeof weatherUnit,
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Entita meteo</p>
                        <input
                          list="weather-entity-options"
                          value={weatherEntityId}
                          onChange={(event) =>
                            onUpdateSection(selectedSection.id, (section) => ({
                              ...section,
                              weatherEntityId: event.target.value,
                            }))
                          }
                          placeholder="weather.home"
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                        />
                        <datalist id="weather-entity-options">
                          {weatherEntitySuggestions.map((entity) => (
                            <option key={entity} value={entity} />
                          ))}
                        </datalist>
                      </label>
                      <label className="block">
                        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Seconda info</p>
                        <GlassDropdown
                          options={weatherSecondaryDropdownOptions}
                          selected={findDropdownOption(weatherSecondaryDropdownOptions, safeWeatherSecondaryInfo)}
                          onChange={(option) =>
                            onUpdateSection(selectedSection.id, (section) => ({
                              ...section,
                              weatherSecondaryInfo: option.id as WeatherSecondaryInfo,
                            }))
                          }
                        />
                        <p className="mt-2 text-[11px] text-white/52">{weatherSelectedInfoMeta.description}</p>
                      </label>
                      <label className="block">
                        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Forecast</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <GlassDropdown
                            options={WEATHER_FORECAST_TYPE_OPTIONS}
                            selected={findDropdownOption(WEATHER_FORECAST_TYPE_OPTIONS, weatherForecastType)}
                            onChange={(option) =>
                              onUpdateSection(selectedSection.id, (section) => ({
                                ...section,
                                weatherForecastType: option.id as typeof weatherForecastType,
                                weatherForecastDays: Math.max(
                                  1,
                                  Math.min(
                                    option.id === 'hourly' ? 8 : 7,
                                    section.weatherForecastDays ?? 4,
                                  ),
                                ),
                              }))
                            }
                          />
                          <GlassDropdown
                            options={weatherForecastDayOptions}
                            selected={findDropdownOption(weatherForecastDayOptions, weatherForecastDays)}
                            onChange={(option) =>
                              onUpdateSection(selectedSection.id, (section) => ({
                                ...section,
                                weatherForecastDays: Number(option.id),
                              }))
                            }
                          />
                        </div>
                      </label>
                    </div>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveSection(selectedSection.id)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/45 bg-rose-500/16 px-4 py-2.5 text-sm font-semibold text-rose-100 hover:bg-rose-500/26"
              >
                <X size={16} />
                Rimuovi Titolo
              </button>
            </>
          ) : selectedSection.kind === 'weather' ? (
            <>
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
              <label className="block">
                <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Layout</p>
                <GlassDropdown
                  options={WEATHER_LAYOUT_OPTIONS}
                  selected={findDropdownOption(WEATHER_LAYOUT_OPTIONS, weatherLayout)}
                  onChange={(option) =>
                    onUpdateSection(selectedSection.id, (section) => ({
                      ...section,
                      weatherLayout: option.id as typeof weatherLayout,
                    }))
                  }
                />
                <div className="liquid-glass-card mt-2 rounded-xl px-3 py-2.5">
                  <p className="text-[11px] font-medium text-white/78">{weatherLayoutPreview.title}</p>
                  <p className="mt-1 text-[11px] text-white/52">{weatherLayoutPreview.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {weatherLayoutPreview.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-white/12 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/60"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </label>
              <label className="block">
                <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Unita</p>
                <GlassDropdown
                  options={WEATHER_UNIT_OPTIONS}
                  selected={findDropdownOption(WEATHER_UNIT_OPTIONS, weatherUnit)}
                  onChange={(option) =>
                    onUpdateSection(selectedSection.id, (section) => ({
                      ...section,
                      weatherUnit: option.id as typeof weatherUnit,
                    }))
                  }
                />
              </label>
              <label className="block">
                <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Entita meteo</p>
                <input
                  list="weather-entity-options"
                  value={weatherEntityId}
                  onChange={(event) =>
                    onUpdateSection(selectedSection.id, (section) => ({
                      ...section,
                      weatherEntityId: event.target.value,
                    }))
                  }
                  placeholder="weather.home"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                />
                <datalist id="weather-entity-options">
                  {weatherEntitySuggestions.map((entity) => (
                    <option key={entity} value={entity} />
                  ))}
                </datalist>
                <p className="mt-2 text-[11px] text-white/45">
                  {haConnected && weatherEntitySuggestions.length > 0
                    ? 'Suggerimenti live dalle entita weather.* di Home Assistant.'
                    : 'Inserisci manualmente l\'entity id weather.* da usare per questa card.'}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-white/55">
                  <span>Consiglio provider</span>
                  <span className="group relative inline-flex items-center">
                    <button
                      type="button"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Suggerimento OpenWeatherMap"
                    >
                      <HelpCircle size={12} />
                    </button>
                    <span className="liquid-glass-card pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-72 -translate-x-1/2 rounded-xl px-3 py-2 text-[11px] leading-relaxed text-white/80 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      Per forecast live completi (giornaliero + orario) e dati meteo piu ricchi, consigliamo
                      l'integrazione OpenWeatherMap in modalita v3.0.
                      <a
                        href="https://www.home-assistant.io/integrations/openweathermap/"
                        target="_blank"
                        rel="noreferrer"
                        className="pointer-events-auto ml-1 font-semibold text-cyan-200 underline underline-offset-2 hover:text-cyan-100"
                      >
                        Documentazione ufficiale
                      </a>
                    </span>
                  </span>
                </div>
              </label>
              <label className="block">
                <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Seconda info</p>
                <GlassDropdown
                  options={weatherSecondaryDropdownOptions}
                  selected={findDropdownOption(weatherSecondaryDropdownOptions, safeWeatherSecondaryInfo)}
                  onChange={(option) =>
                    onUpdateSection(selectedSection.id, (section) => ({
                      ...section,
                      weatherSecondaryInfo: option.id as WeatherSecondaryInfo,
                    }))
                  }
                />
                <p className="mt-2 text-[11px] text-white/52">{weatherSelectedInfoMeta.description}</p>
              </label>
              <label className="block">
                <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Forecast</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <GlassDropdown
                    options={WEATHER_FORECAST_TYPE_OPTIONS}
                    selected={findDropdownOption(WEATHER_FORECAST_TYPE_OPTIONS, weatherForecastType)}
                    onChange={(option) =>
                      onUpdateSection(selectedSection.id, (section) => ({
                        ...section,
                        weatherForecastType: option.id as typeof weatherForecastType,
                        weatherForecastDays: Math.max(
                          1,
                          Math.min(
                            option.id === 'hourly' ? 8 : 7,
                            section.weatherForecastDays ?? 4,
                          ),
                        ),
                      }))
                    }
                  />
                  <GlassDropdown
                    options={weatherForecastDayOptions}
                    selected={findDropdownOption(weatherForecastDayOptions, weatherForecastDays)}
                    onChange={(option) =>
                      onUpdateSection(selectedSection.id, (section) => ({
                        ...section,
                        weatherForecastDays: Number(option.id),
                      }))
                    }
                  />
                </div>
                <p className="mt-2 text-[11px] text-white/50">
                  Le opzioni forecast sono visibili in modalita card e in auto quando la card ha spazio sufficiente.
                </p>
              </label>
            </div>
            <button
              type="button"
              onClick={() => onRemoveSection(selectedSection.id)}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/45 bg-rose-500/16 px-4 py-2.5 text-sm font-semibold text-rose-100 hover:bg-rose-500/26"
            >
              <X size={16} />
              Rimuovi Meteo
            </button>
            </>
          ) : selectedSection.kind === 'scenes' ? (
            <>
              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                <label className="block">
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Titolo</p>
                  <input
                    value={selectedSection.title ?? 'Scenes'}
                    onChange={(event) =>
                      onUpdateSection(selectedSection.id, (section) => ({
                        ...section,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Scenes"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                  />
                </label>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/50">Configura Scene</p>
                  {SCENES_CATALOG.map((scene) => {
                    const isActive = scenesSelected.includes(scene.id);
                    const displayLabel = resolveSceneLabel(scene.id, scene.label);
                    const displayIconKey = resolveSceneIconKey(scene.id, scene.defaultIcon);
                    const actionConfig = resolveSceneAction(scene.id);
                    const actionType: SceneActionType = actionConfig.type === 'service' ? 'service' : 'script';
                    return (
                      <div
                        key={`scene-config-${scene.id}`}
                        className={`rounded-2xl border p-3 space-y-3 transition-colors ${
                          isActive
                            ? 'border-blue-300/40 bg-blue-500/15'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`inline-flex w-10 h-10 rounded-full bg-gradient-to-br ${scene.color} items-center justify-center text-white shadow-md shrink-0`}
                            >
                              {getSceneIconNode(displayIconKey)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">{displayLabel}</p>
                              <p className="truncate text-[11px] text-white/55">{scene.label}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateSection(selectedSection.id, (section) => {
                                const currentScenes = section.scenes ?? scenesSelected;
                                return {
                                  ...section,
                                  scenes: isActive
                                    ? currentScenes.filter((item) => item !== scene.id)
                                    : [...currentScenes, scene.id],
                                };
                              })
                            }
                            className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                              isActive
                                ? 'border-blue-300/45 bg-blue-500/20 text-blue-100'
                                : 'border-white/15 bg-white/8 text-white/65 hover:bg-white/12'
                            }`}
                          >
                            {isActive ? 'Visibile' : 'Nascosta'}
                          </button>
                        </div>

                        <label className="block">
                          <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-white/45">Nome scena</p>
                          <input
                            value={sceneLabels[scene.id] ?? ''}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              onUpdateSection(selectedSection.id, (section) =>
                                upsertSceneLabel(section, scene.id, nextValue),
                              );
                            }}
                            placeholder={scene.label}
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-300/60"
                          />
                        </label>

                        <label className="block">
                          <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-white/45">Icona</p>
                          <GlassDropdown
                            options={[
                              { id: '', name: `Predefinita (${resolveSceneIconLabel(scene.defaultIcon)})` },
                              ...SCENE_ICON_OPTIONS.map((iconOption) => ({
                                id: iconOption.id,
                                name: iconOption.label,
                              })),
                            ]}
                            selected={findDropdownOption(
                              [
                                { id: '', name: `Predefinita (${resolveSceneIconLabel(scene.defaultIcon)})` },
                                ...SCENE_ICON_OPTIONS.map((iconOption) => ({
                                  id: iconOption.id,
                                  name: iconOption.label,
                                })),
                              ],
                              sceneIcons[scene.id] ?? '',
                            )}
                            onChange={(option) => {
                              const nextValue = option.id as SceneIconKey | '';
                              onUpdateSection(selectedSection.id, (section) =>
                                upsertSceneIcon(section, scene.id, nextValue),
                              );
                            }}
                          />
                        </label>

                        <label className="block">
                          <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-white/45">Tipo azione</p>
                          <GlassDropdown
                            options={SCENE_ACTION_TYPE_OPTIONS}
                            selected={findDropdownOption(SCENE_ACTION_TYPE_OPTIONS, actionType)}
                            onChange={(option) => {
                              const nextType = option.id as SceneActionType;
                              onUpdateSection(selectedSection.id, (section) =>
                                upsertSceneAction(section, scene.id, (current) => ({
                                  ...current,
                                  type: nextType,
                                })),
                              );
                            }}
                          />
                        </label>

                        {actionType === 'script' ? (
                          <label className="block">
                            <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-white/45">Script entity_id</p>
                            <input
                              list={sceneScriptDatalistId}
                              value={actionConfig.scriptEntityId ?? ''}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                onUpdateSection(selectedSection.id, (section) =>
                                  upsertSceneAction(section, scene.id, (current) => ({
                                    ...current,
                                    type: 'script',
                                    scriptEntityId: nextValue,
                                  })),
                                );
                              }}
                              placeholder={`script.${scene.id.replace(/-/g, '_')}`}
                              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-300/60"
                            />
                          </label>
                        ) : (
                          <div className="space-y-2">
                            <label className="block">
                              <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-white/45">Servizio</p>
                              <input
                                list={sceneServiceDatalistId}
                                value={actionConfig.service ?? ''}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  onUpdateSection(selectedSection.id, (section) =>
                                    upsertSceneAction(section, scene.id, (current) => ({
                                      ...current,
                                      type: 'service',
                                      service: nextValue,
                                    })),
                                  );
                                }}
                                placeholder="light.turn_on"
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-300/60"
                              />
                            </label>
                            <label className="block">
                              <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-white/45">Entity ID (opzionale)</p>
                              <input
                                value={actionConfig.entityId ?? ''}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  onUpdateSection(selectedSection.id, (section) =>
                                    upsertSceneAction(section, scene.id, (current) => ({
                                      ...current,
                                      type: 'service',
                                      entityId: nextValue,
                                    })),
                                  );
                                }}
                                placeholder="light.salone"
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-300/60"
                              />
                            </label>
                            <label className="block">
                              <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-white/45">Payload JSON (opzionale)</p>
                              <textarea
                                rows={2}
                                value={actionConfig.payloadJson ?? ''}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  onUpdateSection(selectedSection.id, (section) =>
                                    upsertSceneAction(section, scene.id, (current) => ({
                                      ...current,
                                      type: 'service',
                                      payloadJson: nextValue,
                                    })),
                                  );
                                }}
                                placeholder='{"brightness_pct": 35}'
                                className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-300/60"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <datalist id={sceneScriptDatalistId}>
                    {sceneScriptSuggestions.map((entityId) => (
                      <option key={entityId} value={entityId} />
                    ))}
                  </datalist>
                  <datalist id={sceneServiceDatalistId}>
                    {SCENE_ACTION_SERVICE_SUGGESTIONS.map((serviceId) => (
                      <option key={serviceId} value={serviceId} />
                    ))}
                  </datalist>
                  <p className="text-[11px] text-white/45">
                    Ogni scena puo essere configurata in autonomia: visibilita, nome, icona e azione.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSection(selectedSection.id, (section) => ({
                        ...section,
                        scenesShowBackground: !(section.scenesShowBackground ?? true),
                      }))
                    }
                    className={`rounded-xl border px-3 py-2 text-xs uppercase tracking-[0.16em] transition-colors ${
                      scenesShowBackground
                        ? 'border-blue-300/40 bg-blue-500/20 text-blue-100'
                        : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10'
                    }`}
                  >
                    Background
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSection(selectedSection.id, (section) => ({
                        ...section,
                        scenesShowBorder: !(section.scenesShowBorder ?? true),
                      }))
                    }
                    className={`rounded-xl border px-3 py-2 text-xs uppercase tracking-[0.16em] transition-colors ${
                      scenesShowBorder
                        ? 'border-blue-300/40 bg-blue-500/20 text-blue-100'
                        : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10'
                    }`}
                  >
                    Border
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveSection(selectedSection.id)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/45 bg-rose-500/16 px-4 py-2.5 text-sm font-semibold text-rose-100 hover:bg-rose-500/26"
              >
                <X size={16} />
                Rimuovi Scenes
              </button>
            </>
          ) : selectedSection.kind === 'stack-vertical' ||
            selectedSection.kind === 'stack-horizontal' ||
            selectedSection.kind === 'stack-grid' ? (
            <>
              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                <label className="block">
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Titolo</p>
                  <input
                    value={selectedSection.title ?? ''}
                    onChange={(event) =>
                      onUpdateSection(selectedSection.id, (section) => ({
                        ...section,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Stack"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                  />
                </label>
                {selectedSection.kind !== 'stack-vertical' ? (
                  <label className="block">
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Colonne</p>
                    <GlassDropdown
                      options={stackCanvasColumnOptions}
                      selected={findDropdownOption(stackCanvasColumnOptions, stackCanvasColumnSelectionId)}
                      onChange={(option) => {
                        if (selectedSection.kind === 'stack-grid' && option.id === 'auto') {
                          onUpdateSection(selectedSection.id, (section) => ({
                            ...section,
                            stackColumnsMode: 'auto',
                          }));
                          return;
                        }
                        const requestedCols = Math.max(
                          STACK_SECTION_MIN_COLUMNS,
                          Math.min(stackColumnOptionMax, Math.round(Number(option.id) || STACK_SECTION_MIN_COLUMNS)),
                        );
                        onUpdateSection(selectedSection.id, (section) => {
                          const safeW = Math.max(
                            STACK_SECTION_MIN_COLUMNS,
                            Math.min(stackColumnOptionMax, requestedCols),
                          );
                          const maxX = Math.max(0, ROOT_CANVAS_COLS - safeW);
                          return {
                            ...section,
                            ...(section.kind === 'stack-grid'
                              ? {
                                  stackColumnsMode: 'manual' as const,
                                  stackColumns: safeW,
                                }
                              : {}),
                            layout: {
                              ...section.layout,
                              w: safeW,
                              x: Math.min(section.layout.x, maxX),
                            },
                          };
                        });
                      }}
                    />
                    <p className="mt-2 text-[11px] text-white/55">
                      {selectedSection.kind === 'stack-grid'
                        ? stackColumnsAutoMode
                          ? 'Auto: la larghezza viene calcolata dalle card interne.'
                          : 'Manuale: imposta quante colonne canvas deve occupare lo stack.'
                        : 'Imposta quante colonne canvas deve occupare lo stack.'}
                    </p>
                  </label>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSection(selectedSection.id, (section) => ({
                        ...section,
                        stackShowHeader: !(section.stackShowHeader ?? true),
                      }))
                    }
                    className={`rounded-xl border px-3 py-2 text-xs uppercase tracking-[0.16em] transition-colors ${
                      stackShowHeader
                        ? 'border-blue-300/40 bg-blue-500/20 text-blue-100'
                        : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10'
                    }`}
                  >
                    Header
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSection(selectedSection.id, (section) => ({
                        ...section,
                        stackShowBackground: !(section.stackShowBackground ?? true),
                      }))
                    }
                    className={`rounded-xl border px-3 py-2 text-xs uppercase tracking-[0.16em] transition-colors ${
                      stackShowBackground
                        ? 'border-blue-300/40 bg-blue-500/20 text-blue-100'
                        : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10'
                    }`}
                  >
                    Background
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSection(selectedSection.id, (section) => ({
                        ...section,
                        stackShowBorder: !(section.stackShowBorder ?? true),
                      }))
                    }
                    className={`rounded-xl border px-3 py-2 text-xs uppercase tracking-[0.16em] transition-colors ${
                      stackShowBorder
                        ? 'border-blue-300/40 bg-blue-500/20 text-blue-100'
                        : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10'
                    }`}
                  >
                    Border
                  </button>
                  {selectedSection.kind === 'stack-grid' ? (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSection(selectedSection.id, (section) => ({
                          ...section,
                          stackUseFavoritesGrid: !(section.stackUseFavoritesGrid ?? false),
                        }))
                      }
                      className={`col-span-2 rounded-xl border px-3 py-2 text-xs uppercase tracking-[0.16em] transition-colors ${
                        stackUseFavoritesGrid
                          ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100'
                          : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10'
                      }`}
                    >
                      Usa come grid preferiti
                    </button>
                  ) : null}
                </div>
                {selectedSection.kind === 'stack-grid' ? (
                  <p className="text-[11px] text-white/45">
                    Quando attivo, lo stack mostra automaticamente le entita con label Home Assistant "preferiti/favorites" (fallback al flag locale se assente).
                  </p>
                ) : null}
                <p className="text-[11px] text-white/45">
                  {selectedSection.kind === 'stack-vertical'
                    ? 'Stack verticale con una sola colonna.'
                    : selectedSection.kind === 'stack-horizontal'
                      ? 'Stack orizzontale: usa la griglia derivata dal canvas.'
                      : stackColumnsAutoMode
                        ? 'Stack a griglia: larghezza automatica derivata dalle card interne.'
                        : 'Stack a griglia: larghezza manuale impostata dal pannello.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveSection(selectedSection.id)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/45 bg-rose-500/16 px-4 py-2.5 text-sm font-semibold text-rose-100 hover:bg-rose-500/26"
              >
                <X size={16} />
                Rimuovi Stack
              </button>
            </>
          ) : (
            <div className="liquid-glass-card flex-1 rounded-2xl border-dashed flex items-center justify-center text-center p-6">
              <p className="text-sm text-white/60">Questa sezione non e configurabile.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 mt-5 flex flex-col min-h-0">
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setWidgetConfigTab('layout')}
              className={`rounded-lg px-3 py-2 text-xs uppercase tracking-[0.16em] transition-colors ${
                widgetConfigTab === 'layout'
                  ? 'border border-blue-300/45 bg-blue-500/20 text-blue-100'
                  : 'border border-transparent bg-transparent text-white/60 hover:bg-white/8 hover:text-white'
              }`}
            >
              Layout
            </button>
            <button
              type="button"
              onClick={() => setWidgetConfigTab('settings')}
              className={`rounded-lg px-3 py-2 text-xs uppercase tracking-[0.16em] transition-colors ${
                widgetConfigTab === 'settings'
                  ? 'border border-blue-300/45 bg-blue-500/20 text-blue-100'
                  : 'border border-transparent bg-transparent text-white/60 hover:bg-white/8 hover:text-white'
              }`}
            >
              Setting
            </button>
          </div>

          {widgetConfigTab === 'layout' ? (
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
              <div className="liquid-glass-card p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/55">Layout per tipo card</p>
                <p className="mt-1 text-[11px] text-white/50">
                  Questa configurazione si applica a tutte le card di tipo {selectedWidget.kind}.
                </p>
              </div>
              <div className="liquid-glass-card p-3">
                <p className="text-[11px] text-white/55">
                  La griglia si adatta automaticamente allo schermo corrente ({layoutEditorCols} colonne disponibili).
                </p>
              </div>
              <div className="hidden flex-wrap gap-1.5">
                {[activeGridBreakpoint].map((breakpoint) => {
                  const active = true;
                  return (
                    <button
                      key={breakpoint}
                      type="button"
                      onClick={() => void breakpoint}
                      className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                        active
                          ? 'border-blue-300/55 bg-blue-500/20 text-blue-100'
                          : 'border-white/14 bg-white/[0.04] text-white/70 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {GRID_BREAKPOINT_LABEL[breakpoint]} · {GRID_ENGINE_COLS[breakpoint]} col
                    </button>
                  );
                })}
              </div>
              <div className="liquid-glass-card p-3">
                <div
                  className="grid w-full gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-2"
                  style={{
                    gridTemplateColumns: `repeat(${layoutEditorCols}, minmax(0, 1fr))`,
                    ...(layoutGridCompactMaxWidth
                      ? { maxWidth: `${layoutGridCompactMaxWidth}px`, marginInline: 'auto' }
                      : null),
                  }}
                >
                  {Array.from({ length: layoutPreviewRows }).map((_, rowIndex) =>
                    Array.from({ length: layoutEditorCols }).map((__, colIndex) => {
                      const cellW = colIndex + 1;
                      const cellH = rowIndex + 1;
                      const isActive = cellW === layoutPickerWidth && cellH === layoutPickerHeight;
                      const isInside = colIndex < layoutPickerWidth && rowIndex < layoutPickerHeight;
                      return (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          type="button"
                          onClick={() => applyWidgetTypeLayoutSelection(cellW, cellH)}
                          className={`${isCompactLayoutEditor ? 'aspect-square rounded-[5px]' : 'aspect-square rounded-[6px]'} border transition-colors ${
                            isActive
                              ? 'border-blue-200 bg-blue-400/55'
                              : isInside
                                ? 'border-blue-300/30 bg-blue-500/22'
                                : 'border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08]'
                          }`}
                          aria-label={`Imposta ${cellW} colonne per ${cellH} righe`}
                        />
                      );
                    }),
                  )}
                </div>
                <p className="mt-3 text-[11px] text-white/55">
                  Selezione attiva: {layoutPickerWidth} colonne × {layoutPickerHeight} righe
                  {isLightLayoutType ? ' (luce on/off allineate)' : ''}.
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-white/45">
                    {selectedWidgetTypeOverride ? 'Override attivo su questa vista.' : 'Usi il preset base del sistema.'}
                  </p>
                  <button
                    type="button"
                    onClick={resetWidgetTypeLayoutSelection}
                    className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/70 transition-colors hover:bg-white/[0.1] hover:text-white"
                    disabled={!selectedWidgetTypeOverride}
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="liquid-glass-card p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-white/55">Preview card</p>
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                  <div
                    className="mx-auto overflow-hidden rounded-[1.45rem] transition-[width,height] duration-200"
                    style={{
                      width: `${layoutPreviewCardWidthPx}px`,
                      height: `${layoutPreviewCardHeightPx}px`,
                    }}
                  >
                    <WidgetCardRenderer
                      widget={selectedWidgetPreview ?? selectedWidget}
                      dashboardState={state}
                      isEditMode={false}
                      isSelected={false}
                      value={selectedWidgetPreviewValue}
                      sensorHistory={selectedWidgetSensorHistory}
                      onClick={() => undefined}
                      liveEntity={selectedWidgetLiveEntity}
                      gridBreakpoint={activeGridBreakpoint}
                    />
                  </div>
                  <p className="mt-2 text-center text-[10px] uppercase tracking-[0.14em] text-white/45">
                    Preview: {layoutPickerWidth}x{layoutPickerHeight}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <div className={widgetConfigTab === 'settings' ? 'contents' : 'hidden'}>
          <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
            <label className="block">
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Titolo</p>
              <input
                value={selectedWidget.title}
                onChange={(event) =>
                  onUpdateWidget(selectedWidget.id, (widget) => ({
                    ...widget,
                    title: event.target.value,
                  }))
                }
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
              />
            </label>
            <label className="block">
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Entita</p>
              <input
                list={`entity-options-${selectedWidget.kind}`}
                value={selectedWidget.entityId}
                onChange={(event) =>
                  onUpdateWidget(selectedWidget.id, (widget) => ({
                    ...widget,
                    entityId: event.target.value,
                  }))
                }
                placeholder="Es. light.sala, climate.ac"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
              />
              <datalist id={`entity-options-${selectedWidget.kind}`}>
                {entitySuggestions.map((entity) => (
                  <option key={entity} value={entity} />
                ))}
              </datalist>
              <p className="mt-2 text-[11px] text-white/45">
                {haConnected && entitySuggestions.length > 0
                  ? 'Suggerimenti live da Home Assistant + catalogo locale.'
                  : 'Puoi scegliere dal catalogo o digitare una entita personalizzata.'}
              </p>
            </label>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3 shadow-lg backdrop-blur-xl">
              <div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/50">Dispositivi correlati</p>
                  <p className="mt-1 text-[11px] text-white/45">
                    Aggiungi widget dal catalogo, con anteprima uguale alla modalita live.
                  </p>
                </div>
              </div>

              <datalist id={microWidgetDatalistId}>
                {microWidgetEntityOptions.map((entity) => (
                  <option key={entity} value={entity} />
                ))}
              </datalist>
              <datalist id={microWidgetPagePathDatalistId}>
                {microWidgetPageOptions.map((path) => (
                  <option key={path} value={path} />
                ))}
              </datalist>

              <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3 shadow-lg backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/52">Anteprima pannello live</p>
                <div className="mt-2 grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5">
                  {microWidgets.map((microWidget, microWidgetIndex) => {
                    const fallbackLabel = microWidget.label?.trim() || `Widget ${microWidgetIndex + 1}`;
                    const livePreviewState = resolveEntityStateById(haStates, microWidget.entity);
                    const livePreviewHistory = resolveEntityHistoryById(microChartHistoryByEntity, microWidget.entity);
                    const previewState =
                      livePreviewState ??
                      buildFallbackMicroWidgetState(microWidget.type, fallbackLabel);
                    const isSelected = selectedMicroWidgetId === microWidget.id;
                    const previewFrameRadius = microWidget.type === 'value_pill' ? 'rounded-full' : 'rounded-2xl';
                    return (
                      <button
                        key={`preview-grid-${microWidget.id}`}
                        type="button"
                        onClick={() => setSelectedMicroWidgetId(microWidget.id)}
                        className={`relative w-full text-left transition-all ${
                          isSelected ? 'scale-[1.01]' : 'hover:scale-[1.005]'
                        }`}
                        aria-label={`Configura ${fallbackLabel}`}
                        title={`Configura ${fallbackLabel}`}
                      >
                        <div
                          className={`${previewFrameRadius} overflow-hidden transition-all ${
                            isSelected
                              ? 'ring-1 ring-blue-300/55 shadow-[0_0_0_1px_rgba(147,197,253,0.18),0_10px_28px_rgba(37,99,235,0.25)]'
                              : 'ring-1 ring-transparent hover:ring-white/15'
                          }`}
                        >
                          <div className="pointer-events-none">{renderMicroWidgetPreview(microWidget, previewState, livePreviewHistory)}</div>
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      if (!isMicroWidgetCatalogOpen) {
                        setMicroWidgetCatalogEntity('');
                        setMicroWidgetCatalogDomainFilter('all');
                      }
                      setIsMicroWidgetCatalogOpen((current) => !current);
                    }}
                    className={`min-h-[4.25rem] rounded-2xl border border-dashed bg-white/[0.03] text-white/60 transition-colors ${
                      isMicroWidgetCatalogOpen
                        ? 'border-blue-300/45 bg-blue-500/14 text-blue-100'
                        : 'border-white/20 hover:border-white/35 hover:bg-white/[0.07] hover:text-white'
                    }`}
                    aria-label="Apri catalogo micro-widget"
                    title="Apri catalogo micro-widget"
                  >
                    <span className="flex h-full items-center justify-center">
                      <Plus size={18} />
                    </span>
                  </button>
                </div>
              </div>

              {microWidgets.length > 0 ? (
                <div className="mt-3 space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/52">Configurazione widget selezionato</p>
                  {selectedMicroWidget ? (
                    <div key={selectedMicroWidget.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                          Micro-widget {selectedMicroWidgetIndex >= 0 ? selectedMicroWidgetIndex + 1 : 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const nextSelection =
                              microWidgets.find((entry) => entry.id !== selectedMicroWidget.id)?.id ?? null;
                            setSelectedMicroWidgetId(nextSelection);
                            onUpdateWidget(selectedWidget.id, (widget) => {
                              const nextWidgets = (widget.widgets ?? []).filter(
                                (entry) => entry.id !== selectedMicroWidget.id,
                              );
                              return {
                                ...widget,
                                widgets: nextWidgets.length > 0 ? nextWidgets : undefined,
                              };
                            });
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-300/30 bg-rose-500/12 text-rose-100 transition-colors hover:bg-rose-500/20"
                          aria-label="Rimuovi micro-widget"
                          title="Rimuovi micro-widget"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {selectedMicroWidget.type === 'micro_button' ? (
                          <label className="block">
                            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Funzione</p>
                            <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                              {(['switch', 'push', 'page'] as const).map((mode) => {
                                const isModeActive = (selectedMicroButtonMode ?? 'switch') === mode;
                                const modeLabel = mode === 'switch' ? 'Switch' : mode === 'push' ? 'Push' : 'Page';
                                return (
                                  <button
                                    key={mode}
                                    type="button"
                                    onClick={() =>
                                      onUpdateWidget(selectedWidget.id, (widget) => ({
                                        ...widget,
                                        widgets: (widget.widgets ?? []).map((entry) => {
                                          if (entry.id !== selectedMicroWidget.id) {
                                            return entry;
                                          }
                                          return {
                                            ...entry,
                                            buttonMode: mode,
                                            buttonPagePath:
                                              mode === 'page'
                                                ? entry.buttonPagePath?.trim() || defaultMicroWidgetPagePath
                                                : entry.buttonPagePath,
                                            buttonHoldWhilePressed:
                                              mode === 'push'
                                                ? entry.buttonHoldWhilePressed ?? false
                                                : entry.buttonHoldWhilePressed,
                                          };
                                        }),
                                      }))
                                    }
                                    className={`rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                                      isModeActive
                                        ? 'border border-blue-300/55 bg-blue-500/24 text-blue-100 shadow-[0_6px_18px_rgba(37,99,235,0.24)]'
                                        : 'border border-transparent bg-white/[0.03] text-white/72 hover:border-white/14 hover:bg-white/[0.08]'
                                    }`}
                                  >
                                    {modeLabel}
                                  </button>
                                );
                              })}
                            </div>
                          </label>
                        ) : null}

                        {selectedMicroButtonMode !== 'page' ? (
                          <label className="block">
                            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Entita</p>
                            <input
                              list={microWidgetDatalistId}
                              value={selectedMicroWidget.entity}
                              onChange={(event) =>
                                onUpdateWidget(selectedWidget.id, (widget) => ({
                                  ...widget,
                                  widgets: (widget.widgets ?? []).map((entry) =>
                                    entry.id === selectedMicroWidget.id
                                      ? { ...entry, entity: event.target.value }
                                      : entry,
                                  ),
                                }))
                              }
                              placeholder="Es. sensor.bollitore_temperature"
                              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                            />
                          </label>
                        ) : null}

                        {selectedMicroButtonMode === 'push' ? (
                          <label className="block">
                            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Invio segnale</p>
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateWidget(selectedWidget.id, (widget) => ({
                                    ...widget,
                                    widgets: (widget.widgets ?? []).map((entry) =>
                                      entry.id === selectedMicroWidget.id
                                        ? {
                                            ...entry,
                                            buttonHoldWhilePressed: !(entry.buttonHoldWhilePressed === true),
                                          }
                                        : entry,
                                    ),
                                  }))
                                }
                                className="group inline-flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 transition-colors hover:bg-white/[0.06]"
                                aria-pressed={selectedMicroWidget.buttonHoldWhilePressed === true}
                                title="Mantieni segnale durante pressione"
                              >
                                <span className="text-left text-sm text-white/90">
                                  Mantieni il segnale finche il dito resta premuto
                                </span>
                                <span
                                  className={`relative inline-flex h-6 w-10 shrink-0 rounded-full border transition-colors ${
                                    selectedMicroWidget.buttonHoldWhilePressed === true
                                      ? 'border-sky-300/65 bg-sky-400/50 shadow-[0_0_16px_rgba(56,189,248,0.35)]'
                                      : 'border-white/25 bg-white/12'
                                  }`}
                                >
                                <span
                                  className={`absolute left-[2px] top-[2px] h-[1.125rem] w-[1.125rem] rounded-full bg-white shadow-[0_2px_6px_rgba(15,23,42,0.4)] transition-transform ${
                                    selectedMicroWidget.buttonHoldWhilePressed === true ? 'translate-x-[1rem]' : 'translate-x-0'
                                  }`}
                                />
                                </span>
                              </button>
                            </div>
                          </label>
                        ) : null}

                        {selectedMicroButtonMode === 'page' ? (
                          <label className="block">
                            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Pagina destinazione</p>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                              <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                                {microWidgetPageOptions.map((path) => {
                                  const pathLabel = microWidgetPathLabelByPath.get(path);
                                  const optionLabel = pathLabel && pathLabel.length > 0 ? `${pathLabel}  ${path}` : path;
                                  const isPathSelected =
                                    (selectedMicroWidget.buttonPagePath?.trim() || defaultMicroWidgetPagePath) === path;
                                  return (
                                    <button
                                      key={path}
                                      type="button"
                                      onClick={() =>
                                        onUpdateWidget(selectedWidget.id, (widget) => ({
                                          ...widget,
                                          widgets: (widget.widgets ?? []).map((entry) =>
                                            entry.id === selectedMicroWidget.id
                                              ? { ...entry, buttonPagePath: path }
                                              : entry,
                                          ),
                                        }))
                                      }
                                      className={`w-full rounded-lg border px-2.5 py-2 text-left text-sm transition-colors ${
                                        isPathSelected
                                          ? 'border-blue-300/50 bg-blue-500/22 text-blue-100'
                                          : 'border-transparent bg-white/[0.03] text-white/78 hover:border-white/15 hover:bg-white/[0.07]'
                                      }`}
                                    >
                                      {optionLabel}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <input
                              list={microWidgetPagePathDatalistId}
                              value={selectedMicroWidget.buttonPagePath?.trim() || defaultMicroWidgetPagePath}
                              onChange={(event) =>
                                onUpdateWidget(selectedWidget.id, (widget) => ({
                                  ...widget,
                                  widgets: (widget.widgets ?? []).map((entry) =>
                                    entry.id === selectedMicroWidget.id
                                      ? { ...entry, buttonPagePath: event.target.value }
                                      : entry,
                                  ),
                                }))
                              }
                              placeholder="/home"
                              className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                            />
                          </label>
                        ) : null}

                        {selectedMicroWidget.type === 'micro_slider' ? (
                          <label className="block">
                            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Invio valore</p>
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateWidget(selectedWidget.id, (widget) => ({
                                    ...widget,
                                    widgets: (widget.widgets ?? []).map((entry) =>
                                      entry.id === selectedMicroWidget.id
                                        ? {
                                            ...entry,
                                            sliderSendOnRelease: !(entry.sliderSendOnRelease ?? true),
                                          }
                                        : entry,
                                    ),
                                  }))
                                }
                                className="group inline-flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 transition-colors hover:bg-white/[0.06]"
                                aria-pressed={selectedMicroSliderSendOnRelease}
                                title="Invia solo quando rilasci lo slider"
                              >
                                <span className="text-left text-sm text-white/90">
                                  Invia solo al rilascio
                                </span>
                                <span
                                  className={`relative inline-flex h-6 w-10 shrink-0 rounded-full border transition-colors ${
                                    selectedMicroSliderSendOnRelease
                                      ? 'border-sky-300/65 bg-sky-400/50 shadow-[0_0_16px_rgba(56,189,248,0.35)]'
                                      : 'border-white/25 bg-white/12'
                                  }`}
                                >
                                  <span
                                    className={`absolute left-[2px] top-[2px] h-[1.125rem] w-[1.125rem] rounded-full bg-white shadow-[0_2px_6px_rgba(15,23,42,0.4)] transition-transform ${
                                      selectedMicroSliderSendOnRelease ? 'translate-x-[1rem]' : 'translate-x-0'
                                    }`}
                                  />
                                </span>
                              </button>
                            </div>
                          </label>
                        ) : null}

                        {selectedMicroWidget.type === 'micro_superchart' ? (
                          <label className="block">
                            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Tipo grafico</p>
                            <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                              {(['line', 'area', 'bar'] as const).map((chartType) => {
                                const isTypeActive = selectedMicroSuperChartType === chartType;
                                const typeLabel = chartType === 'line' ? 'Line' : chartType === 'area' ? 'Area' : 'Bar';
                                return (
                                  <button
                                    key={chartType}
                                    type="button"
                                    onClick={() =>
                                      onUpdateWidget(selectedWidget.id, (widget) => ({
                                        ...widget,
                                        widgets: (widget.widgets ?? []).map((entry) =>
                                          entry.id === selectedMicroWidget.id
                                            ? { ...entry, superChartType: chartType }
                                            : entry,
                                        ),
                                      }))
                                    }
                                    className={`rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                                      isTypeActive
                                        ? 'border border-blue-300/55 bg-blue-500/24 text-blue-100 shadow-[0_6px_18px_rgba(37,99,235,0.24)]'
                                        : 'border border-transparent bg-white/[0.03] text-white/72 hover:border-white/14 hover:bg-white/[0.08]'
                                    }`}
                                  >
                                    {typeLabel}
                                  </button>
                                );
                              })}
                            </div>
                          </label>
                        ) : null}

                        <label className="block">
                          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Label</p>
                          <input
                            value={selectedMicroWidget.label ?? ''}
                            onChange={(event) =>
                              onUpdateWidget(selectedWidget.id, (widget) => ({
                                ...widget,
                                widgets: (widget.widgets ?? []).map((entry) =>
                                  entry.id === selectedMicroWidget.id
                                    ? { ...entry, label: event.target.value || undefined }
                                    : entry,
                                ),
                              }))
                            }
                            placeholder="Es. Bollitore"
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.03] px-3 py-3 text-sm text-white/55">
                      Seleziona un widget dalla preview live per aprire la sua configurazione.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            {selectedWidget.kind === 'sensor' ? (
              <>
                <div className="liquid-glass-card p-3">
                  <p className="text-[11px] text-white/55">
                    Entita opzionali per metadati sensore. Se lasci vuoto, il pannello contestuale prova a leggere
                    batteria, stato e connessione dagli attributi dell&apos;entita principale.
                  </p>
                </div>
                <label className="block">
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Entita batteria</p>
                  <input
                    list={`entity-options-sensor-battery-${sensorDatalistId}`}
                    value={selectedWidget.sensorBatteryEntityId ?? ''}
                    onChange={(event) =>
                      onUpdateWidget(selectedWidget.id, (widget) => ({
                        ...widget,
                        sensorBatteryEntityId: event.target.value,
                      }))
                    }
                    placeholder="Es. sensor.living_room_sensor_battery"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                  />
                  <datalist id={`entity-options-sensor-battery-${sensorDatalistId}`}>
                    {sensorBatterySuggestions.map((entity) => (
                      <option key={entity} value={entity} />
                    ))}
                  </datalist>
                </label>
                <label className="block">
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Entita stato</p>
                  <input
                    list={`entity-options-sensor-status-${sensorDatalistId}`}
                    value={selectedWidget.sensorStatusEntityId ?? ''}
                    onChange={(event) =>
                      onUpdateWidget(selectedWidget.id, (widget) => ({
                        ...widget,
                        sensorStatusEntityId: event.target.value,
                      }))
                    }
                    placeholder="Es. binary_sensor.sensor_status"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                  />
                  <datalist id={`entity-options-sensor-status-${sensorDatalistId}`}>
                    {sensorMetaSuggestions.map((entity) => (
                      <option key={entity} value={entity} />
                    ))}
                  </datalist>
                </label>
                <label className="block">
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Entita connessione</p>
                  <input
                    list={`entity-options-sensor-connection-${sensorDatalistId}`}
                    value={selectedWidget.sensorConnectionEntityId ?? ''}
                    onChange={(event) =>
                      onUpdateWidget(selectedWidget.id, (widget) => ({
                        ...widget,
                        sensorConnectionEntityId: event.target.value,
                      }))
                    }
                    placeholder="Es. binary_sensor.sensor_connected"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                  />
                  <datalist id={`entity-options-sensor-connection-${sensorDatalistId}`}>
                    {sensorMetaSuggestions.map((entity) => (
                      <option key={entity} value={entity} />
                    ))}
                  </datalist>
                </label>
              </>
            ) : null}
            {selectedWidget.kind === 'alarm' ? (
              <div className="space-y-3">
                <label className="block">
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Codice Sicurezza Locale</p>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={selectedWidget.alarmUnlockCode ?? ''}
                    onChange={(event) =>
                      onUpdateWidget(selectedWidget.id, (widget) => ({
                        ...widget,
                        alarmUnlockCode: event.target.value.slice(0, 24),
                      }))
                    }
                    placeholder="Es. 1234"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                  />
                  <p className="mt-2 text-[11px] text-white/45">
                    I pulsanti allarme in dashboard saranno attivi solo quando il codice inserito nel pannello contestuale combacia.
                  </p>
                </label>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                  <span className="min-w-0">
                    <span className="block text-xs uppercase tracking-[0.16em] text-white/50">Biometria cambio stato</span>
                    <span className="mt-1 block text-[11px] leading-snug text-white/45">
                      Richiede Face ID / impronta nativa prima di modificare lo stato dell&apos;allarme.
                    </span>
                  </span>
                  {renderAppleSwitch({
                    checked: selectedWidget.alarmRequireAuthToDisarm ?? false,
                    label: 'Attiva biometria cambio stato allarme',
                    onChange: (nextChecked) =>
                      onUpdateWidget(selectedWidget.id, (widget) => ({
                        ...widget,
                        alarmRequireAuthToDisarm: nextChecked,
                      })),
                  })}
                </div>
              </div>
            ) : null}
            {selectedWidget.kind === 'lock' ? (
              <div className="space-y-3">
                <label className="block">
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Codice Serratura Locale</p>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={selectedWidget.lockCode ?? ''}
                    onChange={(event) =>
                      onUpdateWidget(selectedWidget.id, (widget) => ({
                        ...widget,
                        lockCode: event.target.value.slice(0, 24),
                      }))
                    }
                    placeholder="Es. 1234"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                  />
                  <p className="mt-2 text-[11px] text-white/45">
                    Usato come codice predefinito per lock/unlock/open quando l&apos;entita lo richiede.
                  </p>
                </label>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                  <span className="min-w-0">
                    <span className="block text-xs uppercase tracking-[0.16em] text-white/50">Biometria sblocco</span>
                    <span className="mt-1 block text-[11px] leading-snug text-white/45">
                      Richiede Face ID / impronta nativa prima di inviare lo sblocco.
                    </span>
                  </span>
                  {renderAppleSwitch({
                    checked: selectedWidget.lockRequireAuthToUnlock ?? false,
                    label: 'Attiva biometria sblocco',
                    onChange: (nextChecked) =>
                      onUpdateWidget(selectedWidget.id, (widget) => ({
                        ...widget,
                        lockRequireAuthToUnlock: nextChecked,
                      })),
                  })}
                </div>
              </div>
            ) : null}
            {selectedWidget.kind === 'alarm' || selectedWidget.kind === 'lock' ? (
              <div className="liquid-glass-card p-3 space-y-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Attivita recente</p>
                <label className="block">
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Elementi visibili</p>
                  <input
                    type="number"
                    min={MIN_ACTIVITY_LOG_ENTRIES}
                    max={MAX_ACTIVITY_LOG_ENTRIES}
                    step={1}
                    value={selectedWidget.activityLogLimit ?? DEFAULT_ACTIVITY_LOG_ENTRIES}
                    onChange={(event) =>
                      onUpdateWidget(selectedWidget.id, (widget) => ({
                        ...widget,
                        activityLogLimit: clampActivityLogEntries(Number(event.target.value) || DEFAULT_ACTIVITY_LOG_ENTRIES),
                      }))
                    }
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                  />
                </label>
                <label className="block">
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Finestra storico (ore)</p>
                  <input
                    type="number"
                    min={MIN_ACTIVITY_LOG_HOURS}
                    max={MAX_ACTIVITY_LOG_HOURS}
                    step={1}
                    value={selectedWidget.activityLogHours ?? DEFAULT_ACTIVITY_LOG_HOURS}
                    onChange={(event) =>
                      onUpdateWidget(selectedWidget.id, (widget) => ({
                        ...widget,
                        activityLogHours: clampActivityLogHours(Number(event.target.value) || DEFAULT_ACTIVITY_LOG_HOURS),
                      }))
                    }
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                  />
                </label>
                <p className="text-[11px] text-white/45">
                  Scegli quante righe mostrare e quante ore interrogare dal Logbook reale di Home Assistant.
                  Se i dati non sono disponibili, il pannello lo indichera chiaramente.
                </p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onRemoveSelectedWidget}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/45 bg-rose-500/16 px-4 py-2.5 text-sm font-semibold text-rose-100 hover:bg-rose-500/26"
          >
            <X size={16} />
            Rimuovi Card
          </button>
        </div>
        </div>
      )}

      {isEditMode &&
      selectedWidget &&
      isMicroWidgetCatalogOpen &&
      typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-3xl flex items-stretch justify-stretch p-0 md:items-center md:justify-center md:p-6"
              onClick={() => setIsMicroWidgetCatalogOpen(false)}
            >
              <div
                className="h-full w-full max-h-none overflow-hidden rounded-none border-0 bg-white/[0.08] backdrop-blur-3xl p-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] md:h-auto md:max-h-[88dvh] md:max-w-3xl md:rounded-[2rem] md:border md:border-white/10 md:p-6"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Catalogo micro-widget</p>
                    <h3 className="mt-1 text-xl font-semibold text-white/95">Aggiungi dispositivo correlato</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMicroWidgetCatalogOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white/75 transition-colors hover:bg-white/[0.16] hover:text-white"
                    aria-label="Chiudi catalogo micro-widget"
                    title="Chiudi catalogo"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="max-h-none overflow-y-auto custom-scrollbar pr-1 md:max-h-[calc(88dvh-7.5rem)]">
                  <label className="block">
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Entita da associare</p>
                    <input
                      value={microWidgetCatalogEntity}
                      onChange={(event) => setMicroWidgetCatalogEntity(event.target.value)}
                      placeholder="Es. switch.bedside_lamp"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                    />
                    <p className="mt-2 text-[11px] text-white/45">
                      Scrivi per filtrare le entita o seleziona dalla lista ordinata qui sotto.
                    </p>
                  </label>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMicroWidgetCatalogDomainFilter('all')}
                        className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                          microWidgetCatalogDomainFilter === 'all'
                            ? 'border-blue-300/60 bg-blue-500/24 text-blue-100'
                            : 'border-white/14 bg-white/[0.04] text-white/70 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        Tutti ({microWidgetEntityOptions.length})
                      </button>
                      {catalogEntityDomainOptions.map(([domain, count]) => (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => setMicroWidgetCatalogDomainFilter(domain)}
                          className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                            microWidgetCatalogDomainFilter === domain
                              ? 'border-blue-300/60 bg-blue-500/24 text-blue-100'
                              : 'border-white/14 bg-white/[0.04] text-white/70 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          {formatEntityDomainLabel(domain)} ({count})
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 max-h-48 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                      {filteredCatalogEntityOptions.length > 0 ? (
                        filteredCatalogEntityOptions.map((entityId) => {
                          const domain = extractEntityDomain(entityId);
                          const objectId = entityId.includes('.') ? entityId.split('.').slice(1).join('.') : entityId;
                          const isSelected = catalogEntityId.toLowerCase() === entityId.toLowerCase();
                          return (
                            <button
                              key={entityId}
                              type="button"
                              onClick={() => setMicroWidgetCatalogEntity(entityId)}
                              className={`flex w-full items-center justify-between gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                                isSelected
                                  ? 'border-blue-300/55 bg-blue-500/20 text-blue-100'
                                  : 'border-transparent bg-white/[0.02] text-white/80 hover:border-white/15 hover:bg-white/[0.06]'
                              }`}
                            >
                              <span className="min-w-0 truncate text-sm font-medium">{objectId}</span>
                              <span className="shrink-0 rounded-full border border-white/14 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/62">
                                {domain || 'custom'}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 text-xs text-white/55">
                          Nessuna entita trovata con questi filtri.
                        </div>
                      )}
                    </div>

                    <p className="mt-2 text-[11px] text-white/45">
                      Entita corrente: <span className="text-white/80">{catalogEntityId || 'nessuna'}</span>
                    </p>
                  </div>

                  {!hasCatalogEntitySelection ? (
                    <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-500/12 px-3 py-2 text-xs text-amber-100/90">
                      Seleziona prima un&apos;entita per abilitare il pulsante Aggiungi.
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {compatibleMicroWidgetCatalog.length > 0 ? (
                      compatibleMicroWidgetCatalog.map((catalogItem) => {
                        const previewWidget: MicroWidget = {
                          id: `preview-${catalogItem.type}`,
                          type: catalogItem.type,
                          entity: catalogEntityId,
                          label: catalogItem.label,
                        };
                        const livePreviewState = resolveEntityStateById(haStates, catalogEntityId);
                        const livePreviewHistory = resolveEntityHistoryById(microChartHistoryByEntity, catalogEntityId);
                        const previewState =
                          livePreviewState ??
                          buildFallbackMicroWidgetState(catalogItem.type, catalogItem.label);
                        return (
                          <div
                            key={catalogItem.type}
                            role="button"
                            tabIndex={hasCatalogEntitySelection ? 0 : -1}
                            onClick={() => {
                              if (!hasCatalogEntitySelection) {
                                return;
                              }
                              appendMicroWidget(catalogItem.type, catalogEntityId);
                              setIsMicroWidgetCatalogOpen(false);
                            }}
                            onKeyDown={(event) => {
                              if (!hasCatalogEntitySelection) {
                                return;
                              }
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                appendMicroWidget(catalogItem.type, catalogEntityId);
                                setIsMicroWidgetCatalogOpen(false);
                              }
                            }}
                            className={`rounded-2xl border p-2.5 transition-colors ${
                              hasCatalogEntitySelection
                                ? 'cursor-pointer border-white/10 bg-white/[0.03] hover:border-white/22 hover:bg-white/[0.06]'
                                : 'cursor-not-allowed border-white/8 bg-white/[0.02] opacity-60'
                            }`}
                          >
                            <div className="pointer-events-none">
                              {renderMicroWidgetPreview(previewWidget, previewState, livePreviewHistory)}
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-3 px-1">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-white/88">{catalogItem.label}</p>
                                <p className="truncate text-[11px] text-white/48">{catalogItem.description}</p>
                              </div>
                              <span className="inline-flex shrink-0 rounded-full border border-white/18 bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/72">
                                {hasCatalogEntitySelection ? 'Aggiungi' : 'Seleziona entita'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="md:col-span-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-white/50">
                        Nessun widget compatibile con questa entita. Prova un&apos;entita diversa.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      </aside>
    </>
  );
}



