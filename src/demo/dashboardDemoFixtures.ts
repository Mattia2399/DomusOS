import type { DashboardRuntimeMode } from '../security/dashboardAccess';
import {
  ROOT_CANVAS_COLS,
  SCENES_SECTION_ROWS,
  WEATHER_SECTION_CARD_ROWS,
  type DashboardSection,
  type Widget,
  type WidgetKind,
} from '../types/dashboardModels';

/**
 * All dashboard fixtures that are allowed to appear without Home Assistant
 * data live here. Real mode must never consume these values.
 */
export const DEMO_ENTITY_OPTIONS: Record<WidgetKind, string[]> = {
  light: ['light.living_room_lamp'],
  switch: ['switch.kitchen_outlet', 'switch.garden_lights', 'input_boolean.guest_mode'],
  climate: ['climate.air_conditioner', 'climate.living_room'],
  camera: ['camera.front_door', 'camera.garage'],
  sensor: ['sensor.nest_wifi_download', 'sensor.living_room_humidity'],
  media: [
    'media_player.living_room_tv',
    'media_player.kitchen_speaker',
    'media_player.max_compat_media_player',
    'media_player.max_compat_paused',
    'media_player.max_compat_idle',
    'media_player.max_compat_buffering',
    'media_player.max_compat_on',
    'media_player.max_compat_off',
    'media_player.max_compat_unavailable',
    'media_player.max_compat_standby',
  ],
  alarm: ['alarm_control_panel.home_alarm'],
  vacuum: [
    'vacuum.demo_robot',
    'vacuum.demo_robot_cleaning',
    'vacuum.demo_robot_paused',
    'vacuum.demo_robot_returning',
    'vacuum.demo_robot_idle',
    'vacuum.demo_robot_error',
    'vacuum.demo_robot_unavailable',
    'vacuum.roborock_s8',
    'vacuum.living_room_robot',
  ],
  lock: [
    'lock.front_door',
    'lock.garage_entry',
    'lock.max_compat_locked',
    'lock.max_compat_unlocked',
    'lock.max_compat_locking',
    'lock.max_compat_unlocking',
    'lock.max_compat_open',
    'lock.max_compat_opening',
    'lock.max_compat_jammed',
    'lock.max_compat_unavailable',
    'lock.max_compat_unknown',
  ],
  cover: [
    'cover.living_room_shutter',
    'cover.kitchen_blind',
    'cover.bedroom_curtain',
    'cover.patio_awning',
    'cover.bedroom_shade',
    'cover.air_damper',
    'cover.front_door',
    'cover.garage_door',
    'cover.driveway_gate',
    'cover.office_window',
    'cover.max_compat_cover',
    'cover.max_compat_opening',
    'cover.max_compat_closing',
    'cover.max_compat_closed',
    'cover.max_compat_stopped',
    'cover.max_compat_unavailable',
    'cover.max_compat_unknown',
  ],
  members: ['group.house_members'],
};

export const EMPTY_ENTITY_OPTIONS: Record<WidgetKind, string[]> = {
  light: [],
  switch: [],
  climate: [],
  camera: [],
  sensor: [],
  media: [],
  alarm: [],
  vacuum: [],
  lock: [],
  cover: [],
  members: [],
};

export const DEMO_INITIAL_WIDGETS: Widget[] = [
  {
    id: 'sensor.nest_wifi_download',
    kind: 'sensor',
    title: 'Nest Wifi',
    entityId: 'sensor.nest_wifi_download',
    dataSource: 'mock',
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
    dataSource: 'mock',
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
    dataSource: 'mock',
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
    dataSource: 'mock',
    status: 'Online',
    isOn: true,
    layout: { i: 'camera.front_door', x: 0, y: 2, w: 2, h: 4 },
  },
  {
    id: 'sensor.living_room_humidity',
    kind: 'sensor',
    title: 'Humidity Sensor',
    entityId: 'sensor.living_room_humidity',
    dataSource: 'mock',
    status: 'Tracking',
    isOn: true,
    value: 48,
    unit: '%',
    layout: { i: 'sensor.living_room_humidity', x: 4, y: 2, w: 2, h: 4 },
  },
];

export const DEMO_INITIAL_SECTIONS: DashboardSection[] = [
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
    layout: { i: 'section-scenes', x: 0, y: 2, w: ROOT_CANVAS_COLS, h: SCENES_SECTION_ROWS },
    scenes: ['music', 'going-out', 'night', 'movie'],
    scenesShowBackground: true,
    scenesShowBorder: true,
    title: 'Scenari',
  },
];

export function getEntityOptionsForRuntime(runtimeMode: DashboardRuntimeMode) {
  return runtimeMode === 'demo' ? DEMO_ENTITY_OPTIONS : EMPTY_ENTITY_OPTIONS;
}

export function getInitialDashboardFixtures(runtimeMode: DashboardRuntimeMode): {
  sections: DashboardSection[];
  widgets: Widget[];
} {
  if (runtimeMode === 'demo') {
    return {
      sections: DEMO_INITIAL_SECTIONS.map((section) => ({ ...section, layout: { ...section.layout } })),
      widgets: DEMO_INITIAL_WIDGETS.map((widget) => ({ ...widget, layout: { ...widget.layout } })),
    };
  }
  return { sections: [], widgets: [] };
}

export function normalizeWidgetsForRuntime(
  widgets: readonly Widget[],
  runtimeMode: DashboardRuntimeMode,
): Widget[] {
  if (runtimeMode === 'demo') {
    return widgets.map((widget) => ({ ...widget }));
  }
  // Old beta layouts could contain cards tagged as mock. Preserve their
  // placement/configuration, but make Home Assistant the only real authority.
  return widgets.map((widget) => ({ ...widget, dataSource: 'ha' as const }));
}
