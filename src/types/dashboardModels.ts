export type WidgetKind =
  | 'light'
  | 'climate'
  | 'camera'
  | 'sensor'
  | 'media'
  | 'alarm'
  | 'vacuum'
  | 'lock'
  | 'cover'
  | 'members';
export type SectionKind = 'greeting' | 'weather' | 'scenes' | 'stack-vertical' | 'stack-horizontal' | 'stack-grid';
export type WeatherLayoutMode = 'auto' | 'card' | 'chip';
export type WeatherUnit = 'C' | 'F';
export type ForecastDensity = 'comfortable' | 'compact';
export type WeatherForecastType = 'daily' | 'hourly' | 'twice_daily';
export type WeatherSecondaryInfo =
  | 'auto'
  | 'precipitation'
  | 'wind'
  | 'humidity'
  | 'pressure'
  | 'visibility'
  | 'uv_index'
  | 'cloud_coverage'
  | 'dew_point'
  | 'condition'
  | 'range';
export type SceneKey = 'music' | 'going-out' | 'night' | 'movie' | 'arrive' | 'morning';
export type SceneIconKey =
  | 'music'
  | 'person'
  | 'moon'
  | 'film'
  | 'car'
  | 'sun'
  | 'home'
  | 'sparkles'
  | 'bed'
  | 'coffee'
  | 'tv'
  | 'leaf';
export type SceneActionType = 'script' | 'service';

export type SceneActionConfig = {
  type?: SceneActionType;
  scriptEntityId?: string;
  service?: string;
  entityId?: string;
  payloadJson?: string;
};

export type SceneRunState = {
  sceneId: SceneKey;
  startedAt: number;
  actionType: SceneActionType;
  scriptEntityId?: string;
  observedRunning?: boolean;
};

export const ROOT_CANVAS_COLS = 12;
export const ROOT_CANVAS_LEGACY_COLS = 6;
export const ROOT_CANVAS_ROW_UNITS = 2;
export const ROOT_CANVAS_LEGACY_ROW_UNITS = 1;
export const GREETING_SECTION_ROWS = 1;
export const WEATHER_SECTION_BASE_ROWS = 1;
export const WEATHER_SECTION_CHIP_COLS = 2;
export const WEATHER_SECTION_CHIP_ROWS = WEATHER_SECTION_BASE_ROWS;
export const WEATHER_SECTION_CARD_COLS = 4;
export const WEATHER_SECTION_CARD_ROWS = 2;
export const SCENES_SECTION_ROWS = 2;

export type GridItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export interface MicroWidget {
  id: string;
  type:
    | 'value_pill'
    | 'status_glow'
    | 'micro_toggle'
    | 'mini_ring'
    | 'micro_button'
    | 'micro_slider'
    | 'micro_step'
    | 'micro_superchart';
  entity: string;
  label?: string;
  buttonMode?: 'push' | 'switch' | 'page';
  buttonHoldWhilePressed?: boolean;
  buttonPagePath?: string;
  sliderSendOnRelease?: boolean;
  superChartType?: 'line' | 'area' | 'bar';
}

export type Widget = {
  id: string;
  kind: WidgetKind;
  title: string;
  entityId: string;
  widgets?: MicroWidget[];
  isFavorite?: boolean;
  alarmUnlockCode?: string;
  alarmRequireAuthToDisarm?: boolean;
  lockCode?: string;
  lockRequireAuthToUnlock?: boolean;
  activityLogLimit?: number;
  activityLogHours?: number;
  sensorBatteryEntityId?: string;
  sensorStatusEntityId?: string;
  sensorConnectionEntityId?: string;
  vacuumFanSpeed?: string;
  vacuumMapUrl?: string;
  vacuumCleanedArea?: number;
  vacuumCleaningMinutes?: number;
  coverTiltPosition?: number;
  status: string;
  isOn: boolean;
  value?: number;
  unit?: string;
  parentSectionId?: string;
  layout: GridItem;
};

export type DashboardSection = {
  id: string;
  kind: SectionKind;
  layout: GridItem;
  title?: string;
  subtitle?: string;
  titleAuto?: boolean;
  subtitleAuto?: boolean;
  showWeather?: boolean;
  weatherLayout?: WeatherLayoutMode;
  weatherUnit?: WeatherUnit;
  weatherShowCondition?: boolean;
  weatherShowPrecipitation?: boolean;
  weatherShowWind?: boolean;
  weatherForecastType?: WeatherForecastType;
  weatherForecastDays?: number;
  weatherForecastDensity?: ForecastDensity;
  weatherSecondaryInfo?: WeatherSecondaryInfo;
  weatherCondition?: string;
  weatherEntityId?: string;
  scenes?: SceneKey[];
  sceneLabels?: Partial<Record<SceneKey, string>>;
  sceneIcons?: Partial<Record<SceneKey, SceneIconKey>>;
  sceneActions?: Partial<Record<SceneKey, SceneActionConfig>>;
  sceneScripts?: Partial<Record<SceneKey, string>>;
  scenesShowBackground?: boolean;
  scenesShowBorder?: boolean;
  stackColumns?: number;
  stackColumnsMode?: 'auto' | 'manual';
  stackShowBackground?: boolean;
  stackShowBorder?: boolean;
  stackShowHeader?: boolean;
  stackUseFavoritesGrid?: boolean;
};

export const ENTITY_OPTIONS: Record<WidgetKind, string[]> = {
  light: ['light.living_room_lamp', 'light.lamp_2', 'light.lamp_4'],
  climate: ['climate.air_conditioner', 'climate.living_room'],
  camera: ['camera.front_door', 'camera.garage'],
  sensor: ['sensor.nest_wifi_download', 'sensor.living_room_humidity'],
  media: ['media_player.living_room_tv', 'media_player.kitchen_speaker'],
  alarm: ['alarm_control_panel.home_alarm'],
  vacuum: ['vacuum.demo_robot', 'vacuum.roborock_s8', 'vacuum.living_room_robot'],
  lock: ['lock.front_door', 'lock.garage_entry'],
  cover: ['cover.living_room_shutter', 'cover.kitchen_blind', 'cover.bedroom_curtain'],
  members: ['group.house_members'],
};

export const WIDGET_CATALOG: Array<{ kind: WidgetKind; label: string }> = [
  { kind: 'light', label: 'Luce' },
  { kind: 'climate', label: 'Clima' },
  { kind: 'camera', label: 'Camera' },
  { kind: 'sensor', label: 'Sensore' },
  { kind: 'media', label: 'Media Player' },
  { kind: 'alarm', label: 'Allarme' },
  { kind: 'vacuum', label: 'Vacuum' },
  { kind: 'lock', label: 'Lock' },
  { kind: 'cover', label: 'Tapparella' },
  { kind: 'members', label: 'Membri' },
];

export const SECTION_CATALOG: Array<{ kind: SectionKind; label: string }> = [
  { kind: 'greeting', label: 'Titolo' },
  { kind: 'scenes', label: 'Scenes' },
  { kind: 'stack-vertical', label: 'Vertical Stack' },
  { kind: 'stack-horizontal', label: 'Horizontal Stack' },
  { kind: 'stack-grid', label: 'Grid Stack' },
];

export const FAVORITES_GRID_TITLE = 'Preferiti';

export const INITIAL_WIDGETS: Widget[] = [
  {
    id: 'sensor.nest_wifi_download',
    kind: 'sensor',
    title: 'Nest Wifi',
    entityId: 'sensor.nest_wifi_download',
    status: 'Connected',
    isOn: true,
    value: 97,
    unit: 'Mbps',
    layout: { i: 'sensor.nest_wifi_download', x: 0, y: 0, w: 2, h: 4 },
  },
  {
    id: 'light.living_room_lamp',
    kind: 'light',
    title: 'Lamp',
    entityId: 'light.living_room_lamp',
    status: 'Opening',
    isOn: true,
    value: 62,
    unit: '%',
    layout: { i: 'light.living_room_lamp', x: 2, y: 0, w: 2, h: 2 },
  },
  {
    id: 'climate.air_conditioner',
    kind: 'climate',
    title: 'Air Conditioner',
    entityId: 'climate.air_conditioner',
    status: 'Opening',
    isOn: true,
    value: 24,
    unit: 'C',
    layout: { i: 'climate.air_conditioner', x: 4, y: 0, w: 2, h: 2 },
  },
  {
    id: 'camera.front_door',
    kind: 'camera',
    title: 'Front Door Cam',
    entityId: 'camera.front_door',
    status: 'Online',
    isOn: true,
    layout: { i: 'camera.front_door', x: 0, y: 2, w: 2, h: 4 },
  },
  {
    id: 'light.lamp_2',
    kind: 'light',
    title: 'Lamp 2',
    entityId: 'light.lamp_2',
    status: 'Unavailable',
    isOn: false,
    value: 0,
    unit: '%',
    layout: { i: 'light.lamp_2', x: 2, y: 2, w: 2, h: 1 },
  },
  {
    id: 'sensor.living_room_humidity',
    kind: 'sensor',
    title: 'Humidity Sensor',
    entityId: 'sensor.living_room_humidity',
    status: 'Tracking',
    isOn: true,
    value: 48,
    unit: '%',
    layout: { i: 'sensor.living_room_humidity', x: 4, y: 2, w: 2, h: 4 },
  },
];

export const INITIAL_SECTIONS: DashboardSection[] = [
  {
    id: 'section-greeting',
    kind: 'greeting',
    layout: { i: 'section-greeting', x: 0, y: 0, w: ROOT_CANVAS_COLS, h: WEATHER_SECTION_CARD_ROWS },
    showWeather: true,
    weatherLayout: 'auto',
    weatherUnit: 'C',
    weatherShowCondition: true,
    weatherShowPrecipitation: true,
    weatherShowWind: true,
    weatherForecastType: 'daily',
    weatherForecastDays: 4,
    weatherForecastDensity: 'comfortable',
    weatherSecondaryInfo: 'auto',
  },
  {
    id: 'section-scenes',
    kind: 'scenes',
    layout: { i: 'section-scenes', x: 0, y: 2, w: 12, h: SCENES_SECTION_ROWS },
    scenes: ['music', 'going-out', 'night', 'movie'],
    scenesShowBackground: true,
    scenesShowBorder: true,
    title: 'Scenes',
  },
  // Nessuno stack di default: l'utente lo aggiunge dal catalogo.
];

export function createDefaultSectionLayout(kind: SectionKind, i: string, y: number): GridItem {
  if (kind === 'greeting') {
    return { i, x: 0, y, w: ROOT_CANVAS_COLS, h: WEATHER_SECTION_CARD_ROWS };
  }
  if (kind === 'weather') {
    return { i, x: 0, y, w: WEATHER_SECTION_CARD_COLS, h: WEATHER_SECTION_BASE_ROWS };
  }
  if (kind === 'scenes') {
    return { i, x: 0, y, w: 6, h: SCENES_SECTION_ROWS };
  }
  if (kind === 'stack-vertical') {
    return { i, x: 0, y, w: ROOT_CANVAS_COLS, h: 14 };
  }
  if (kind === 'stack-horizontal') {
    return { i, x: 0, y, w: ROOT_CANVAS_COLS, h: 6 };
  }
  if (kind === 'stack-grid') {
    return { i, x: 0, y, w: ROOT_CANVAS_COLS, h: 10 };
  }
  return { i, x: 0, y, w: 6, h: ROOT_CANVAS_ROW_UNITS * 2 };
}
