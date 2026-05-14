import React from 'react';
import { createPortal } from 'react-dom';
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
import { MiniRing } from '../widgets/micro/MiniRing';
import { MicroButton } from '../widgets/micro/MicroButton';
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
import {
  SIDEBAR_PATH_ICON_KEYS,
  type SidebarQuickPath,
  type SidebarQuickPathIconKey,
} from '../../hooks/useProfileSettings';
import type { DashboardTheme } from '../../hooks/useProfileSettings';
import { getGreetingDefaults } from '../widgets/GreetingCard';
import { getSceneIconNode, SCENE_ICON_OPTIONS, SCENES_CATALOG } from '../widgets/ScenesCard';

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
  disarmAlarm: (code?: string) => void;
  armAlarmHome: (code?: string) => void;
  armAlarmAway: (code?: string) => void;
  armAlarmNight: (code?: string) => void;
  armAlarmVacation: (code?: string) => void;
  armAlarmCustomBypass: (code?: string) => void;
  triggerAlarm: (code?: string) => void;
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
  unlockDoor: (code?: string) => void;
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

function clampActivityLogHours(value: number) {
  return Math.max(MIN_ACTIVITY_LOG_HOURS, Math.min(MAX_ACTIVITY_LOG_HOURS, Math.round(value)));
}

function clampActivityLogEntries(value: number) {
  return Math.max(MIN_ACTIVITY_LOG_ENTRIES, Math.min(MAX_ACTIVITY_LOG_ENTRIES, Math.round(value)));
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
  isXs?: boolean;
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
    changedBy?: string;
    activityLogLimit?: number;
    activityTimeline?: Array<{
      id: string;
      text: string;
    }>;
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
    activityTimeline?: Array<{
      id: string;
      text: string;
    }>;
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
  onUpdateUserName: (name: string) => void;
  selectedWidget: Widget | null;
  selectedSection: DashboardSection | null;
  selectedSidebarPath: SidebarQuickPath | null;
  sidebarPaths?: SidebarQuickPath[];
  weatherConfig: DashboardSection | null;
  entityOptions: Record<WidgetKind, string[]>;
  haEntityIds?: string[];
  haConnected?: boolean;
  haStates?: MockEntityStateMap;
  onUpdateWidget: (id: string, updater: (widget: Widget) => Widget) => void;
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
    description: 'Controllo numerico per helper input_number.',
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
const MICRO_SLIDER_COMPATIBLE_DOMAINS = new Set(['input_number']);

function extractEntityDomain(entityId: string | undefined) {
  const trimmed = (entityId ?? '').trim().toLowerCase();
  if (!trimmed.includes('.')) {
    return '';
  }
  return trimmed.split('.')[0] ?? '';
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
  return {
    state: 'on',
    stateLabel: 'Acceso',
    toggleOn: true,
    rawAttributes: { friendly_name: label },
  };
}

function renderMicroWidgetPreview(widget: MicroWidget, state: MockEntityState | undefined) {
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
  return <MicroToggle widget={widget} state={state} />;
}

export function RightSidebarManager({
  isEditMode,
  isXs = false,
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
  onUpdateUserName,
  selectedWidget,
  selectedSection,
  selectedSidebarPath,
  sidebarPaths = [],
  weatherConfig,
  entityOptions,
  haEntityIds = [],
  haConnected = false,
  haStates = {},
  onUpdateWidget,
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
  const [selectedMicroWidgetId, setSelectedMicroWidgetId] = React.useState<string | null>(null);
  const selectedWidgetMicroWidgets = selectedWidget?.widgets;
  const contextSheetStartYRef = React.useRef<number | null>(null);
  const contextSheetPointerIdRef = React.useRef<number | null>(null);
  const contextSheetDragOffsetRef = React.useRef(0);
  const CONTEXT_SHEET_CLOSE_THRESHOLD_PX = 88;
  const shouldShowXsContextSheet = !isEditMode && isXs && Boolean(activeDevice);

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
    if (!shouldShowXsContextSheet) {
      resetContextSheetDrag();
    }
  }, [resetContextSheetDrag, shouldShowXsContextSheet]);
  React.useEffect(() => {
    setIsMicroWidgetCatalogOpen(false);
  }, [isEditMode, selectedWidget?.id]);
  React.useEffect(() => {
    setMicroWidgetCatalogEntity(selectedWidget?.entityId?.trim() ?? '');
  }, [selectedWidget?.entityId, selectedWidget?.id]);
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

  if (!isEditMode) {
    if (isXs) {
      const contextIsOpen = Boolean(activeDevice);
      return (
        <>
          {contextIsOpen ? (
            <button
              type="button"
              onClick={onCloseContextSidebar}
              className="fixed inset-0 z-[188] bg-black/60 backdrop-blur-3xl"
              aria-label="Chiudi pannello contestuale"
            />
          ) : null}

          <div
            className={`fixed inset-x-0 bottom-0 z-[189] px-0.5 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] transition-all duration-220 ${
              contextIsOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
            }`}
          >
            <div
              className="flex max-h-[84dvh] min-h-[16rem] w-full flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.08] backdrop-blur-3xl shadow-[0_32px_90px_rgba(15,23,42,0.42)] transition-transform duration-220 ease-out"
              style={
                contextSheetDragOffset > 0
                  ? { transform: `translateY(${contextSheetDragOffset}px)`, transitionDuration: '0ms' }
                  : undefined
              }
            >
              <div
                className={`flex justify-center pt-2 pb-1 touch-none ${
                  isContextSheetDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                onPointerDown={handleContextSheetDragStart}
                onPointerMove={handleContextSheetDragMove}
                onPointerUp={finishContextSheetDrag}
                onPointerCancel={finishContextSheetDrag}
              >
                <span className="h-1 w-11 rounded-full bg-white/28" />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scrollbar [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-1 pb-1">
                <ContextSidebar
                  activeDevice={activeDevice}
                  isEditMode={isEditMode}
                  theme={theme}
                  onClose={onCloseContextSidebar}
                  showCloseButton={false}
                  externalScrollContainer
                  haStates={haStates}
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
            </div>
          </div>
        </>
      );
    }
    return (
      <div className={sidebarWidthClass}>
        <ContextSidebar
          activeDevice={activeDevice}
          isEditMode={isEditMode}
          theme={theme}
          onClose={onCloseContextSidebar}
          haStates={haStates}
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
  const weatherSecondaryInfoValues = new Set(weatherSecondaryInfoOptions.map((option) => option.value));
  const safeWeatherSecondaryInfo = weatherSecondaryInfoValues.has(weatherSecondaryInfo)
    ? weatherSecondaryInfo
    : 'auto';
  const weatherSelectedInfoMeta = WEATHER_SECONDARY_INFO_META[safeWeatherSecondaryInfo];
  const weatherLayoutPreview = WEATHER_LAYOUT_PREVIEWS[weatherLayout];
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
      : Math.max(2, Math.round(selectedSection.layout.w));

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
  const defaultMicroWidgetEntity = microWidgetEntityOptions[0] ?? '';
  const catalogEntityId = microWidgetCatalogEntity.trim() || defaultMicroWidgetEntity;
  const compatibleMicroWidgetCatalog = MICRO_WIDGET_CATALOG.filter((catalogItem) =>
    isMicroWidgetTypeCompatible(catalogItem.type, catalogEntityId),
  );
  const appendMicroWidget = (type: MicroWidget['type'], entityId = catalogEntityId) => {
    if (!selectedWidget) {
      return;
    }
    const normalizedEntityId = entityId.trim() || defaultMicroWidgetEntity;
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
  const hasEditSelection = Boolean(selectedWidget || selectedSection || selectedSidebarPath);
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

  return (
    <aside className={`${sidebarWidthClass} py-1 sm:py-2 rounded-[2rem] bg-white/5 border border-white/8 backdrop-blur-xl p-3 sm:p-4 lg:p-5 flex flex-col`}>
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
        <div className="flex-1 mt-5 rounded-2xl border border-dashed border-white/15 bg-black/20 flex items-center justify-center text-center p-6">
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
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-3">
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
                      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                        <p className="text-[11px] font-medium text-white/78">Layout meteo responsive</p>
                        <p className="mt-1 text-[11px] text-white/52">
                          In questa card unificata il meteo usa chip su xs/sm e card previsioni su md/lg.
                        </p>
                      </div>
                      <label className="block">
                        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Unita</p>
                        <select
                          value={weatherUnit}
                          onChange={(event) =>
                            onUpdateSection(selectedSection.id, (section) => ({
                              ...section,
                              weatherUnit: event.target.value as typeof weatherUnit,
                            }))
                          }
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                        >
                          <option value="C" className="bg-[#0d1118]">
                            {'\u00B0C'}
                          </option>
                          <option value="F" className="bg-[#0d1118]">
                            {'\u00B0F'}
                          </option>
                        </select>
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
                        <select
                          value={safeWeatherSecondaryInfo}
                          onChange={(event) =>
                            onUpdateSection(selectedSection.id, (section) => ({
                              ...section,
                              weatherSecondaryInfo: event.target.value as WeatherSecondaryInfo,
                            }))
                          }
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                        >
                          {weatherSecondaryInfoOptions.map((option) => (
                            <option key={option.value} value={option.value} className="bg-[#0d1118]">
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 text-[11px] text-white/52">{weatherSelectedInfoMeta.description}</p>
                      </label>
                      <label className="block">
                        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Forecast</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <select
                            value={weatherForecastType}
                            onChange={(event) =>
                              onUpdateSection(selectedSection.id, (section) => ({
                                ...section,
                                weatherForecastType: event.target.value as typeof weatherForecastType,
                                weatherForecastDays: Math.max(
                                  1,
                                  Math.min(
                                    event.target.value === 'hourly' ? 8 : 7,
                                    section.weatherForecastDays ?? 4,
                                  ),
                                ),
                              }))
                            }
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                          >
                            <option value="daily" className="bg-[#0d1118]">
                              Giornaliero
                            </option>
                            <option value="hourly" className="bg-[#0d1118]">
                              Orario
                            </option>
                          </select>
                          <select
                            value={weatherForecastDays}
                            onChange={(event) =>
                              onUpdateSection(selectedSection.id, (section) => ({
                                ...section,
                                weatherForecastDays: Number(event.target.value),
                              }))
                            }
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                          >
                            {(weatherForecastType === 'hourly' ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7]).map((days) => (
                              <option key={days} value={days} className="bg-[#0d1118]">
                                {days} {weatherForecastType === 'hourly' ? 'ore' : 'giorni'}
                              </option>
                            ))}
                          </select>
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
                <select
                  value={weatherLayout}
                  onChange={(event) =>
                    onUpdateSection(selectedSection.id, (section) => ({
                      ...section,
                      weatherLayout: event.target.value as typeof weatherLayout,
                    }))
                  }
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                >
                  <option value="auto" className="bg-[#0d1118]">
                    Auto
                  </option>
                  <option value="card" className="bg-[#0d1118]">
                    Card
                  </option>
                  <option value="chip" className="bg-[#0d1118]">
                    Chip
                  </option>
                </select>
                <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
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
                <select
                  value={weatherUnit}
                  onChange={(event) =>
                    onUpdateSection(selectedSection.id, (section) => ({
                      ...section,
                      weatherUnit: event.target.value as typeof weatherUnit,
                    }))
                  }
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                >
                  <option value="C" className="bg-[#0d1118]">
                    {'\u00B0C'}
                  </option>
                  <option value="F" className="bg-[#0d1118]">
                    {'\u00B0F'}
                  </option>
                </select>
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
                    <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-72 -translate-x-1/2 rounded-xl border border-white/15 bg-[#0d1118]/95 px-3 py-2 text-[11px] leading-relaxed text-white/80 opacity-0 shadow-xl backdrop-blur-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
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
                <select
                  value={safeWeatherSecondaryInfo}
                  onChange={(event) =>
                    onUpdateSection(selectedSection.id, (section) => ({
                      ...section,
                      weatherSecondaryInfo: event.target.value as WeatherSecondaryInfo,
                    }))
                  }
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                >
                  {weatherSecondaryInfoOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#0d1118]">
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[11px] text-white/52">{weatherSelectedInfoMeta.description}</p>
              </label>
              <label className="block">
                <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Forecast</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={weatherForecastType}
                    onChange={(event) =>
                      onUpdateSection(selectedSection.id, (section) => ({
                        ...section,
                        weatherForecastType: event.target.value as typeof weatherForecastType,
                        weatherForecastDays: Math.max(
                          1,
                          Math.min(
                            event.target.value === 'hourly' ? 8 : 7,
                            section.weatherForecastDays ?? 4,
                          ),
                        ),
                      }))
                    }
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                  >
                    <option value="daily" className="bg-[#0d1118]">
                      Giornaliero
                    </option>
                    <option value="hourly" className="bg-[#0d1118]">
                      Orario
                    </option>
                  </select>
                  <select
                    value={weatherForecastDays}
                    onChange={(event) =>
                      onUpdateSection(selectedSection.id, (section) => ({
                        ...section,
                        weatherForecastDays: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                  >
                    {(weatherForecastType === 'hourly' ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7]).map((days) => (
                      <option key={days} value={days} className="bg-[#0d1118]">
                        {days} {weatherForecastType === 'hourly' ? 'ore' : 'giorni'}
                      </option>
                    ))}
                  </select>
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
                          <select
                            value={sceneIcons[scene.id] ?? ''}
                            onChange={(event) => {
                              const nextValue = event.target.value as SceneIconKey | '';
                              onUpdateSection(selectedSection.id, (section) =>
                                upsertSceneIcon(section, scene.id, nextValue),
                              );
                            }}
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-300/60"
                          >
                            <option value="" className="bg-[#0d1118]">
                              Predefinita ({resolveSceneIconLabel(scene.defaultIcon)})
                            </option>
                            {SCENE_ICON_OPTIONS.map((iconOption) => (
                              <option key={iconOption.id} value={iconOption.id} className="bg-[#0d1118]">
                                {iconOption.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-white/45">Tipo azione</p>
                          <select
                            value={actionType}
                            onChange={(event) => {
                              const nextType = event.target.value as SceneActionType;
                              onUpdateSection(selectedSection.id, (section) =>
                                upsertSceneAction(section, scene.id, (current) => ({
                                  ...current,
                                  type: nextType,
                                })),
                              );
                            }}
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-300/60"
                          >
                            <option value="script" className="bg-[#0d1118]">
                              Script
                            </option>
                            <option value="service" className="bg-[#0d1118]">
                              Servizio
                            </option>
                          </select>
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
                  <div className="block">
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Colonne</p>
                    <div className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white/90">
                      {stackCanvasColumns} colonne (auto)
                    </div>
                    <p className="mt-2 text-[11px] text-white/55">
                      Le colonne seguono la larghezza della sezione nel canvas. Ridimensiona la sezione per cambiare la griglia interna.
                    </p>
                  </div>
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
                      : 'Stack a griglia: colonne automatiche derivate dal canvas.'}
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
            <div className="flex-1 rounded-2xl border border-dashed border-white/15 bg-black/20 flex items-center justify-center text-center p-6">
              <p className="text-sm text-white/60">Questa sezione non e configurabile.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 mt-5 flex flex-col min-h-0">
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
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
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

              <div className="mt-3 rounded-2xl border border-white/12 bg-white/[0.04] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/52">Anteprima pannello live</p>
                <div className="mt-2 grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5">
                  {microWidgets.map((microWidget, microWidgetIndex) => {
                    const fallbackLabel = microWidget.label?.trim() || `Widget ${microWidgetIndex + 1}`;
                    const livePreviewState = haStates[microWidget.entity];
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
                          <div className="pointer-events-none">{renderMicroWidgetPreview(microWidget, previewState)}</div>
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      if (!isMicroWidgetCatalogOpen && !microWidgetCatalogEntity.trim()) {
                        setMicroWidgetCatalogEntity(defaultMicroWidgetEntity);
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
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
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
            ) : null}
            {selectedWidget.kind === 'lock' ? (
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
            ) : null}
            {selectedWidget.kind === 'alarm' || selectedWidget.kind === 'lock' ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-3">
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
                  Scegli quante righe mostrare e quante ore di storico interrogare da Home Assistant.
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
      )}

      {isEditMode &&
      selectedWidget &&
      isMicroWidgetCatalogOpen &&
      typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-6"
              onClick={() => setIsMicroWidgetCatalogOpen(false)}
            >
              <div
                className="w-full max-w-3xl max-h-[88dvh] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.08] backdrop-blur-3xl p-4 sm:p-6"
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

                <div className="max-h-[calc(88dvh-7.5rem)] overflow-y-auto custom-scrollbar pr-1">
                  <label className="block">
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Entita da associare</p>
                    <input
                      list={microWidgetDatalistId}
                      value={microWidgetCatalogEntity}
                      onChange={(event) => setMicroWidgetCatalogEntity(event.target.value)}
                      placeholder="Es. switch.bedside_lamp"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/60"
                    />
                    <p className="mt-2 text-[11px] text-white/45">
                      Entita corrente: <span className="text-white/80">{catalogEntityId || 'nessuna'}</span>
                    </p>
                  </label>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {compatibleMicroWidgetCatalog.length > 0 ? (
                      compatibleMicroWidgetCatalog.map((catalogItem) => {
                        const previewWidget: MicroWidget = {
                          id: `preview-${catalogItem.type}`,
                          type: catalogItem.type,
                          entity: catalogEntityId,
                          label: catalogItem.label,
                        };
                        const livePreviewState = catalogEntityId ? haStates[catalogEntityId] : undefined;
                        const previewState =
                          livePreviewState ??
                          buildFallbackMicroWidgetState(catalogItem.type, catalogItem.label);
                        return (
                          <div
                            key={catalogItem.type}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              appendMicroWidget(catalogItem.type, catalogEntityId);
                              setIsMicroWidgetCatalogOpen(false);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                appendMicroWidget(catalogItem.type, catalogEntityId);
                                setIsMicroWidgetCatalogOpen(false);
                              }
                            }}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 transition-colors hover:border-white/22 hover:bg-white/[0.06] cursor-pointer"
                          >
                            <div className="pointer-events-none">
                              {renderMicroWidgetPreview(previewWidget, previewState)}
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-3 px-1">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-white/88">{catalogItem.label}</p>
                                <p className="truncate text-[11px] text-white/48">{catalogItem.description}</p>
                              </div>
                              <span className="inline-flex shrink-0 rounded-full border border-white/18 bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/72">
                                Aggiungi
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
  );
}



