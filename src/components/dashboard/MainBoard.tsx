import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ActiveDevice, SensorConnectionState } from '../settings/types';
import { useDashboardState } from '../../hooks/useDashboardState';
import { ConsumptionDashboardPage } from '../../pages/Consumi';
import { AutomationsBuilder } from '../../pages/AutomationsBuilder';
import AppGallery from '../../pages/AppGallery';
import SecurityDashboard from '../../pages/SecurityDashboard';
import { ConsumptionEditorSidebar } from '../settings/ConsumptionEditorSidebar';
import { LeftSidebar } from './LeftSidebar';
import { BottomBarNav } from './BottomBarNav';
import { XsNotificationBell } from './XsNotificationBell';
import { RightSidebarManager } from './RightSidebarManager';
import { GridCanvas } from './GridCanvas';
import { FavoritesDrawer } from './FavoritesDrawer';
import { GRID_ENGINE_BREAKPOINTS } from './DashboardGrid';
import type { CameraPtzDirection } from '../settings/CameraControls';
import {
  createDemoAgentClient,
  createHomeAssistantAssistAgentClient,
} from '../../services/assistant/agentClients';
import { useNotifications } from '../../context/NotificationProvider';
import {
  ProfilePanel,
  type ProfileHouseMember,
  type ProfileMovementMapPoint,
  type ProfileMovementTimelineEntry,
} from '../settings/ProfilePanel';
import { GuidedSetupOverlay, type GuidedSetupStep } from '../settings/GuidedSetupOverlay';
import {
  ENTITY_OPTIONS,
  GREETING_SECTION_ROWS,
  ROOT_CANVAS_COLS,
  ROOT_CANVAS_ROW_UNITS,
  SCENES_SECTION_ROWS,
  WEATHER_SECTION_BASE_ROWS,
  WEATHER_SECTION_CARD_COLS,
  WEATHER_SECTION_CARD_ROWS,
  WEATHER_SECTION_CHIP_COLS,
  WEATHER_SECTION_CHIP_ROWS,
  createDefaultSectionLayout,
  type DashboardSection,
  type GridItem,
  type SceneKey,
  type SceneRunState,
  type SectionKind,
  type Widget,
  type WidgetKind,
} from '../../types/dashboardModels';
import { loadDashboardLayout, saveDashboardLayout } from '../../services/dashboardStorage';
import {
  createConsumptionDashboardData,
  type ConsumptionCardId,
  useConsumptionConfig,
} from '../../hooks/useConsumptionConfig';
import { useProfileSettings } from '../../hooks/useProfileSettings';
import { useHaLiveConnection } from '../../hooks/useHaLiveConnection';
import { useHaPanelBridgeConnection } from '../../hooks/useHaPanelBridgeConnection';
import {
  buildHaOAuthAuthorizeUrl,
  exchangeHaOAuthCode,
  loadHassAuthTokensFromStorage,
  normalizeHassUrl,
  persistOAuthTokensAsAuthData,
} from '../../services/haLive';
import type { MockEntityState, MockEntityStateMap } from '../../types/ha';
import {
  clearManagedDashboardStorage,
  createDashboardBackupPayload,
  parseDashboardBackup,
  restoreDashboardBackup,
  serializeDashboardBackup,
} from '../../services/configBackup';
import { isOnboardingCompleted, markOnboardingCompleted } from '../../services/onboardingStorage';
import {
  type AlarmServiceName,
  getAlarmStateLabel,
  isAlarmArmedState,
  normalizeAlarmState,
  resolveAlarmNextState,
  resolveAlarmSupportedFeatures,
} from '../../utils/alarmUtils';
import {
  clampPercent,
  COVER_FEATURE_CLOSE,
  COVER_FEATURE_OPEN,
  COVER_FEATURE_SET_POSITION,
  COVER_FEATURE_SET_TILT_POSITION,
  COVER_FEATURE_STOP,
  coverSupportsSetPosition,
  coverSupportsStop,
  coverSupportsTilt,
  normalizeCoverState,
  resolveCoverPosition,
  resolveCoverSupportedFeatures,
  resolveCoverTiltPosition,
  translateCoverState,
} from '../../utils/coverUtils';

const LIGHT_FEATURE_BRIGHTNESS = 1;
const LIGHT_FEATURE_COLOR_TEMP = 2;
const LIGHT_FEATURE_COLOR = 16;
const MEDIA_FEATURE_PAUSE = 1;
const MEDIA_FEATURE_SEEK = 2;
const MEDIA_FEATURE_VOLUME_SET = 4;
const MEDIA_FEATURE_VOLUME_MUTE = 8;
const MEDIA_FEATURE_PREVIOUS_TRACK = 16;
const MEDIA_FEATURE_NEXT_TRACK = 32;
const MEDIA_FEATURE_TURN_ON = 128;
const MEDIA_FEATURE_TURN_OFF = 256;
const MEDIA_FEATURE_PLAY = 16384;
const LOCK_FEATURE_OPEN = 1;
const VACUUM_FEATURE_PAUSE = 4;
const VACUUM_FEATURE_STOP = 8;
const VACUUM_FEATURE_RETURN_HOME = 16;
const VACUUM_FEATURE_FAN_SPEED = 32;
const VACUUM_FEATURE_SEND_COMMAND = 256;
const VACUUM_FEATURE_LOCATE = 512;
const VACUUM_FEATURE_CLEAN_SPOT = 1024;
const VACUUM_FEATURE_MAP = 2048;
const VACUUM_FEATURE_START = 8192;
const VACUUM_FEATURE_CLEAN_AREA = 16384;
const VACUUM_DEMO_TICK_MS = 8000;
const VACUUM_DEMO_FAN_SPEEDS = ['quiet', 'balanced', 'turbo', 'max'] as const;
const VACUUM_DEMO_AREA_OPTIONS = [
  { id: 'living_room', name: 'Living Room' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'hallway', name: 'Hallway' },
  { id: 'bedroom', name: 'Bedroom' },
];
const VACUUM_DEMO_SUPPORTED_FEATURES =
  VACUUM_FEATURE_START |
  VACUUM_FEATURE_PAUSE |
  VACUUM_FEATURE_STOP |
  VACUUM_FEATURE_RETURN_HOME |
  VACUUM_FEATURE_FAN_SPEED |
  VACUUM_FEATURE_SEND_COMMAND |
  VACUUM_FEATURE_LOCATE |
  VACUUM_FEATURE_CLEAN_SPOT |
  VACUUM_FEATURE_MAP |
  VACUUM_FEATURE_CLEAN_AREA;
const VACUUM_DEMO_MAP_URL =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A//www.w3.org/2000/svg'%20viewBox%3D'0%200%20800%20520'%3E%3Cdefs%3E%3ClinearGradient%20id%3D'g'%20x1%3D'0'%20x2%3D'1'%20y1%3D'0'%20y2%3D'1'%3E%3Cstop%20offset%3D'0%25'%20stop-color%3D'%23131a24'/%3E%3Cstop%20offset%3D'100%25'%20stop-color%3D'%231f2b3b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width%3D'800'%20height%3D'520'%20fill%3D'url(%23g)'/%3E%3Cg%20stroke%3D'%236f8fb4'%20stroke-opacity%3D'.45'%20stroke-width%3D'3'%20fill%3D'none'%3E%3Crect%20x%3D'58'%20y%3D'48'%20width%3D'684'%20height%3D'424'%20rx%3D'18'/%3E%3Cpath%20d%3D'M245%2048v202h198V48M466%20250v222M58%20320h187M466%20354h276'%20/%3E%3C/g%3E%3Cg%20fill%3D'%23d1e8ff'%20fill-opacity%3D'.9'%20font-family%3D'SF Pro Text'%20font-size%3D'22'%3E%3Ctext%20x%3D'100'%20y%3D'90'%3ELiving%20Room%3C/text%3E%3Ctext%20x%3D'286'%20y%3D'90'%3EKitchen%3C/text%3E%3Ctext%20x%3D'516'%20y%3D'90'%3EBedroom%3C/text%3E%3Ctext%20x%3D'100'%20y%3D'360'%3EHallway%3C/text%3E%3C/g%3E%3Ccircle%20cx%3D'330'%20cy%3D'314'%20r%3D'14'%20fill%3D'%2338bdf8'%3E%3Canimate%20attributeName%3D'r'%20values%3D'12%3B16%3B12'%20dur%3D'2s'%20repeatCount%3D'indefinite'/%3E%3C/circle%3E%3C/svg%3E";
const SENSOR_BATTERY_ATTRIBUTE_KEYS = [
  'battery_level',
  'battery',
  'battery_percentage',
  'battery_percent',
  'battery_state_of_charge',
];
const SENSOR_STATUS_ATTRIBUTE_KEYS = ['status', 'sensor_status', 'device_status', 'system_status'];
const SENSOR_CONNECTION_ATTRIBUTE_KEYS = [
  'connection_status',
  'connectivity',
  'connected',
  'online',
  'network_status',
  'linkquality',
  'link_quality',
  'rssi',
];
const SENSOR_CONNECTION_ON_VALUES = new Set([
  'on',
  'online',
  'connected',
  'home',
  'available',
  'ok',
  'true',
  'yes',
  'open',
]);
const SENSOR_CONNECTION_OFF_VALUES = new Set([
  'off',
  'offline',
  'disconnected',
  'not_home',
  'unavailable',
  'down',
  'false',
  'no',
  'closed',
  '0',
]);
const SENSOR_HISTORY_WINDOW_HOURS = 24;
const SENSOR_HISTORY_MAX_POINTS = 8;
const CAMERA_OFFLINE_STATES = new Set([
  'off',
  'offline',
  'idle',
  'unavailable',
  'unknown',
  'error',
  'problem',
  'disconnected',
]);
const CAMERA_PTZ_SERVICE_CANDIDATES = [
  { domain: 'onvif', service: 'ptz' },
  { domain: 'camera', service: 'onvif_ptz' },
  { domain: 'camera', service: 'ptz' },
] as const;
const CAMERA_PTZ_DIRECTION_VECTORS: Record<CameraPtzDirection, { pan: number; tilt: number; movement: string }> = {
  up: { pan: 0, tilt: 1, movement: 'up' },
  down: { pan: 0, tilt: -1, movement: 'down' },
  left: { pan: -1, tilt: 0, movement: 'left' },
  right: { pan: 1, tilt: 0, movement: 'right' },
  up_left: { pan: -1, tilt: 1, movement: 'up_left' },
  up_right: { pan: 1, tilt: 1, movement: 'up_right' },
  down_left: { pan: -1, tilt: -1, movement: 'down_left' },
  down_right: { pan: 1, tilt: -1, movement: 'down_right' },
};
const CAMERA_MOTION_KEYWORDS = ['motion', 'movimento', 'pir', 'person', 'persona', 'human', 'vehicle', 'auto', 'car'] as const;
const CAMERA_SOUND_KEYWORDS = ['sound', 'audio', 'suono', 'noise'] as const;
const CAMERA_IMAGE_KEYWORDS = ['image', 'immagine', 'snapshot', 'thumbnail', 'ultima immagine', 'last image'] as const;

const LIGHT_COLOR_MODES_WITH_COLOR = new Set(['hs', 'xy', 'rgb', 'rgbw', 'rgbww']);
const LIGHT_COLOR_MODES_WITH_BRIGHTNESS = new Set([
  'brightness',
  'white',
  'color_temp',
  'hs',
  'xy',
  'rgb',
  'rgbw',
  'rgbww',
]);
const BACKUP_FILENAME_PREFIX = 'ha-dashboard-backup';
const HA_OAUTH_CALLBACK_PARAM = 'ha_oauth_callback';
const HA_OAUTH_SESSION_NONCE_KEY = 'ha.dashboard.oauth.nonce';
const CLIMATE_PENDING_TTL_MS = 15000;
const CLIMATE_SEND_DELAY_MS = 5000;
const LIGHT_COLOR_PENDING_TTL_MS = 2500;
const COVER_PENDING_TTL_MS = 7000;
const SCENE_SCRIPT_START_GRACE_MS = 5000;
const HA_ACTIVITY_REFRESH_MS = 30000;
const DEFAULT_ACTIVITY_WINDOW_HOURS = 24;
const DEFAULT_ACTIVITY_MAX_ENTRIES = 6;
const PROFILE_MOVEMENT_WINDOW_HOURS = 72;
const PROFILE_MOVEMENT_MAX_ENTRIES = 18;
const HIDDEN_MEMBER_ACCOUNT_ALIASES = ['guest', 'ospite', 'ospiti'] as const;
const SHOW_GUEST_MEMBERS_IN_FAMILY = true;
const MIN_ACTIVITY_WINDOW_HOURS = 1;
const MAX_ACTIVITY_WINDOW_HOURS = 168;
const MIN_ACTIVITY_MAX_ENTRIES = 1;
const MAX_ACTIVITY_MAX_ENTRIES = 30;
const CLIMATE_PENDING_TARGET_ATTRIBUTE_KEY = '__dashboard_pending_climate_target';
const CLIMATE_PENDING_FAN_ATTRIBUTE_KEY = '__dashboard_pending_climate_fan';
const COVER_PENDING_ATTRIBUTE_KEY = '__dashboard_pending_cover';
const COVER_PENDING_TILT_ATTRIBUTE_KEY = '__dashboard_pending_cover_tilt';
const DEFAULT_ACTIVITY_ACTOR = 'Sistema';
const MAIN_GUIDED_SETUP_STORAGE_KEYS = {
  welcome: 'ha.dashboard.onboarding.welcome.v1',
  context: 'ha.dashboard.onboarding.context.v1',
} as const;
const HA_FAVORITE_LABEL_ALIASES = new Set(['preferiti', 'preferito', 'favorites', 'favorite']);

function isXsViewportNow() {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerWidth < GRID_ENGINE_BREAKPOINTS.sm;
}

function normalizeHaLabelKey(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function hasFavoriteLabelAlias(value: unknown) {
  const normalized = normalizeHaLabelKey(value);
  if (!normalized) {
    return false;
  }
  for (const alias of HA_FAVORITE_LABEL_ALIASES) {
    if (normalized === alias || normalized.includes(alias) || alias.includes(normalized)) {
      return true;
    }
  }
  return false;
}

function collectLabelIdsFromValue(value: unknown): string[] {
  if (typeof value === 'string') {
    const labelId = value.trim();
    return labelId ? [labelId] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectLabelIdsFromValue(entry));
  }
  if (!value || typeof value !== 'object') {
    return [];
  }
  const record = value as Record<string, unknown>;
  const directValues = [record.label_id, record.id, record.labelId];
  const directLabelIds = directValues
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (directLabelIds.length > 0) {
    return directLabelIds;
  }
  return Object.keys(record)
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
}

function parseFavoriteLabelIds(payload: unknown) {
  if (!Array.isArray(payload)) {
    return new Set<string>();
  }

  const favoriteLabelIds = new Set<string>();
  payload.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const record = entry as Record<string, unknown>;
    const rawId =
      typeof record.label_id === 'string'
        ? record.label_id
        : typeof record.id === 'string'
          ? record.id
          : '';
    const labelId = rawId.trim();
    if (!labelId) {
      return;
    }
    if (
      hasFavoriteLabelAlias(labelId) ||
      hasFavoriteLabelAlias(record.name) ||
      hasFavoriteLabelAlias(record.slug)
    ) {
      favoriteLabelIds.add(labelId);
    }
  });

  return favoriteLabelIds;
}

function parseEntityIdsByLabelIds(payload: unknown, labelIds: Set<string>) {
  if (!Array.isArray(payload) || labelIds.size === 0) {
    return new Set<string>();
  }

  const entityIds = new Set<string>();
  payload.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const record = entry as Record<string, unknown>;
    const entityId = typeof record.entity_id === 'string' ? record.entity_id.trim() : '';
    if (!entityId) {
      return;
    }
    const labelsRaw = [...collectLabelIdsFromValue(record.labels), ...collectLabelIdsFromValue(record.label_ids)];
    const hasFavoriteLabel = labelsRaw.some(
      (label) => typeof label === 'string' && labelIds.has(label.trim()),
    );
    if (hasFavoriteLabel) {
      entityIds.add(entityId);
    }
  });

  return entityIds;
}

function parseDeviceIdsByLabelIds(payload: unknown, labelIds: Set<string>) {
  if (!Array.isArray(payload) || labelIds.size === 0) {
    return new Set<string>();
  }

  const deviceIds = new Set<string>();
  payload.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const record = entry as Record<string, unknown>;
    const rawDeviceId =
      typeof record.id === 'string'
        ? record.id
        : typeof record.device_id === 'string'
          ? record.device_id
          : '';
    const deviceId = rawDeviceId.trim();
    if (!deviceId) {
      return;
    }
    const labelsRaw = [...collectLabelIdsFromValue(record.labels), ...collectLabelIdsFromValue(record.label_ids)];
    const hasFavoriteLabel = labelsRaw.some(
      (label) => typeof label === 'string' && labelIds.has(label.trim()),
    );
    if (hasFavoriteLabel) {
      deviceIds.add(deviceId);
    }
  });

  return deviceIds;
}

function parseEntityIdsByDeviceIds(payload: unknown, deviceIds: Set<string>) {
  if (!Array.isArray(payload) || deviceIds.size === 0) {
    return new Set<string>();
  }

  const entityIds = new Set<string>();
  payload.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const record = entry as Record<string, unknown>;
    const entityId = typeof record.entity_id === 'string' ? record.entity_id.trim() : '';
    const deviceId = typeof record.device_id === 'string' ? record.device_id.trim() : '';
    if (!entityId || !deviceId) {
      return;
    }
    if (deviceIds.has(deviceId)) {
      entityIds.add(entityId);
    }
  });

  return entityIds;
}

function resolveWidgetKindFromEntityId(entityId: string): WidgetKind | null {
  const domain = entityId.split('.')[0];
  if (domain === 'light') {
    return 'light';
  }
  if (domain === 'climate') {
    return 'climate';
  }
  if (domain === 'camera') {
    return 'camera';
  }
  if (domain === 'sensor' || domain === 'binary_sensor') {
    return 'sensor';
  }
  if (domain === 'switch' || domain === 'input_boolean' || domain === 'fan') {
    return 'sensor';
  }
  if (domain === 'media_player') {
    return 'media';
  }
  if (domain === 'alarm_control_panel') {
    return 'alarm';
  }
  if (domain === 'vacuum') {
    return 'vacuum';
  }
  if (domain === 'lock') {
    return 'lock';
  }
  if (domain === 'cover') {
    return 'cover';
  }
  return null;
}

function fallbackTitleFromEntityId(entityId: string) {
  const [, objectId = entityId] = entityId.split('.');
  return objectId
    .split('_')
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

type ClimatePendingState = {
  targetTemp?: number;
  targetTempLow?: number;
  targetTempHigh?: number;
  fanMode?: string;
  expiresAt: number;
};

type ClimateQueuedCommand = {
  targetTemp?: number;
  targetTempLow?: number;
  targetTempHigh?: number;
  fanMode?: string;
};

type LightColorPendingState = {
  hsColor: [number, number];
  expiresAt: number;
};

type CoverPendingState = {
  state?: string;
  position?: number;
  tiltPosition?: number;
  expiresAt: number;
};

type ActivityTimelineEntry = {
  id: string;
  text: string;
  timestampMs: number;
  actor: string;
};

type HaAuthUser = {
  id: string;
  name: string;
  username?: string;
  email?: string;
  isOwner?: boolean;
  isAdmin?: boolean;
};

type HaLogbookEvent = {
  when?: string;
  message?: string;
  name?: string;
  state?: string;
  entity_id?: string;
  context_user_id?: string;
  user_id?: string;
  context?: {
    user_id?: string;
  };
};

type HaServiceRegistry = Record<string, Record<string, Record<string, unknown>>>;

type CameraPtzServiceTarget = {
  domain: string;
  service: string;
  fields: Set<string>;
};

type CameraPtzButtonMap = Partial<Record<CameraPtzDirection, string>>;

type CameraDerivedActivity = {
  eventLog: Array<Record<string, unknown>>;
  motionDetected?: boolean;
  soundDetected?: boolean;
  lastMotionDetected?: string;
  lastSoundDetected?: string;
  lastImageUrl?: string;
};

type MainGuidedSetupKind = keyof typeof MAIN_GUIDED_SETUP_STORAGE_KEYS;

const MAIN_GUIDED_SETUP_CONTENT: Record<
  MainGuidedSetupKind,
  {
    tag: string;
    heading: string;
    steps: GuidedSetupStep[];
    completeLabel?: string;
    skipLabel?: string;
  }
> = {
  welcome: {
    tag: 'Primo accesso',
    heading: 'Benvenuto nella dashboard',
    steps: [
      {
        title: 'Vista generale',
        description:
          'Qui trovi una shell completa: menu rapido a sinistra, area card al centro e strumenti di controllo sulla destra.',
        hint: 'In meno di un minuto puoi avere una configurazione pronta da usare.',
      },
      {
        title: 'Configurazione guidata layout',
        description:
          'Attiva la modalita edit per trascinare card, aggiungere sezioni e personalizzare la struttura della home.',
        hint: 'Le modifiche vengono salvate automaticamente in locale.',
      },
      {
        title: 'Connessione Home Assistant',
        description:
          'Apri il profilo per inserire URL, token o OAuth e collegare entita reali ai controlli della dashboard.',
        hint: 'Puoi completare questo passaggio anche in un secondo momento.',
      },
    ],
    completeLabel: 'Inizia adesso',
    skipLabel: 'Chiudi guida',
  },
  context: {
    tag: 'Pannello contestuale',
    heading: 'Guida rapida ai controlli live',
    steps: [
      {
        title: 'Come si apre',
        description:
          'In modalita dashboard, cliccando una card si apre il pannello contestuale con i dettagli del dispositivo selezionato.',
      },
      {
        title: 'Cosa puoi fare',
        description:
          'Da qui gestisci azioni immediate: luce, clima, media, sensori, sicurezza e automazioni senza entrare in edit mode.',
      },
      {
        title: 'Cambio dispositivo',
        description:
          'Per vedere un altro controllo, clicca una card diversa. Usa il pulsante di chiusura per tornare alla sola vista card.',
      },
    ],
    completeLabel: 'Ho capito',
    skipLabel: 'Chiudi',
  },
};

type HaOAuthStatePayload = {
  nonce: string;
  hassUrl: string;
  returnTo: string;
  issuedAt: number;
};

function createOAuthNonce() {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('');
  }
  return `${Date.now()}-${Math.round(Math.random() * 1_000_000_000)}`;
}

function parseHaOAuthState(rawState: string | null) {
  if (!rawState) {
    return null;
  }
  try {
    const parsed = JSON.parse(rawState) as Partial<HaOAuthStatePayload>;
    if (
      typeof parsed.nonce !== 'string' ||
      typeof parsed.hassUrl !== 'string' ||
      typeof parsed.returnTo !== 'string' ||
      typeof parsed.issuedAt !== 'number'
    ) {
      return null;
    }
    return {
      nonce: parsed.nonce,
      hassUrl: parsed.hassUrl,
      returnTo: parsed.returnTo,
      issuedAt: parsed.issuedAt,
    } satisfies HaOAuthStatePayload;
  } catch {
    return null;
  }
}

function resolveOAuthReturnPath(path: string | undefined) {
  if (typeof path === 'string' && path.trim().startsWith('/')) {
    return path.trim();
  }
  return '/home';
}

function isExternalNavigationTarget(path: string) {
  const target = path.trim().toLowerCase();
  return target.startsWith('http://') || target.startsWith('https://');
}

function normalizeNavigationPathname(path: string) {
  const target = path.trim();
  if (!target) {
    return '';
  }

  try {
    const parsed = new URL(target, 'http://dashboard.local');
    const pathname = parsed.pathname.trim().toLowerCase();
    if (!pathname) {
      return '/';
    }
    const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
    if (normalized === '/') {
      return normalized;
    }
    return normalized.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

function isNavigationPathnameAllowed(pathname: string, allowedPathnames: Set<string>) {
  if (!pathname) {
    return false;
  }
  if (allowedPathnames.size === 0) {
    return true;
  }
  for (const allowedPathname of allowedPathnames) {
    if (!allowedPathname) {
      continue;
    }
    if (allowedPathname === '/') {
      return true;
    }
    if (pathname === allowedPathname || pathname.startsWith(`${allowedPathname}/`)) {
      return true;
    }
  }
  return false;
}

function isConsumptionNavigationTarget(path: string) {
  const target = path.trim();
  if (!target) {
    return false;
  }

  try {
    const parsed = new URL(target, 'http://dashboard.local');
    const pathname = parsed.pathname.toLowerCase();
    const hash = parsed.hash.toLowerCase();
    const view = (parsed.searchParams.get('view') ?? '').trim().toLowerCase();
    const pathSegments = pathname.split('/').filter(Boolean);
    const hashNormalized = hash.replace(/^#/, '').replace(/^\//, '');
    const hashSegments = hashNormalized.split('/').filter(Boolean);
    const pathHasConsumi = pathSegments.includes('consumi');
    const hashHasConsumi = hashSegments.includes('consumi') || hashNormalized === 'consumi';
    return (
      pathHasConsumi ||
      hash === '#consumi' ||
      hashHasConsumi ||
      view === 'consumi'
    );
  } catch {
    return false;
  }
}

function resolveConsumptionFromLocation() {
  if (typeof window === 'undefined') {
    return false;
  }
  return isConsumptionNavigationTarget(window.location.href);
}

function isHomeNavigationTarget(path: string) {
  const target = path.trim();
  if (!target) {
    return false;
  }

  try {
    const parsed = new URL(target, 'http://dashboard.local');
    const pathname = parsed.pathname.toLowerCase();
    const hash = parsed.hash.toLowerCase();
    const view = (parsed.searchParams.get('view') ?? '').trim().toLowerCase();
    const pathSegments = pathname.split('/').filter(Boolean);
    const hashNormalized = hash.replace(/^#/, '').replace(/^\//, '');
    const hashSegments = hashNormalized.split('/').filter(Boolean);
    const pathHasHome = pathSegments.includes('home');
    const hashHasHome = hashSegments.includes('home') || hashNormalized === 'home';
    return pathHasHome || hash === '#home' || hashHasHome || view === 'home';
  } catch {
    return false;
  }
}

function resolveEditAvailabilityFromLocation() {
  if (typeof window === 'undefined') {
    return false;
  }
  const current = window.location.href;
  return (
    isHomeNavigationTarget(current) ||
    isConsumptionNavigationTarget(current) ||
    isAppGalleryNavigationTarget(current) ||
    isSecurityNavigationTarget(current)
  );
}

function isAutomationNavigationTarget(path: string) {
  const target = path.trim();
  if (!target) {
    return false;
  }

  try {
    const parsed = new URL(target, 'http://dashboard.local');
    const pathname = parsed.pathname.toLowerCase();
    const hash = parsed.hash.toLowerCase();
    const view = (parsed.searchParams.get('view') ?? '').trim().toLowerCase();
    const pathSegments = pathname.split('/').filter(Boolean);
    const hashNormalized = hash.replace(/^#/, '').replace(/^\//, '');
    const hashSegments = hashNormalized.split('/').filter(Boolean);
    const pathHasAutomations = pathSegments.includes('automations') || pathSegments.includes('automation');
    const hashHasAutomations =
      hashSegments.includes('automations') ||
      hashSegments.includes('automation') ||
      hashNormalized === 'automations' ||
      hashNormalized === 'automation';
    return (
      pathHasAutomations ||
      hash === '#automations' ||
      hash === '#automation' ||
      hashHasAutomations ||
      view === 'automations' ||
      view === 'automation'
    );
  } catch {
    return false;
  }
}

function resolveAutomationFromLocation() {
  if (typeof window === 'undefined') {
    return false;
  }
  return isAutomationNavigationTarget(window.location.href);
}

function isAppGalleryNavigationTarget(path: string) {
  const target = path.trim();
  if (!target) {
    return false;
  }

  try {
    const parsed = new URL(target, 'http://dashboard.local');
    const pathname = parsed.pathname.toLowerCase();
    const hash = parsed.hash.toLowerCase();
    const view = (parsed.searchParams.get('view') ?? '').trim().toLowerCase();
    const pathSegments = pathname.split('/').filter(Boolean);
    const hashNormalized = hash.replace(/^#/, '').replace(/^\//, '');
    const hashSegments = hashNormalized.split('/').filter(Boolean);
    const pathHasAppGallery = pathSegments.includes('appgallery') || pathSegments.includes('appgalley');
    const hashHasAppGallery =
      hashSegments.includes('appgallery') ||
      hashSegments.includes('appgalley') ||
      hashNormalized === 'appgallery' ||
      hashNormalized === 'appgalley';
    return (
      pathHasAppGallery ||
      hash === '#appgallery' ||
      hash === '#appgalley' ||
      hashHasAppGallery ||
      view === 'appgallery' ||
      view === 'appgalley'
    );
  } catch {
    return false;
  }
}

function resolveAppGalleryFromLocation() {
  if (typeof window === 'undefined') {
    return false;
  }
  return isAppGalleryNavigationTarget(window.location.href);
}

function isSecurityNavigationTarget(path: string) {
  const target = path.trim();
  if (!target) {
    return false;
  }

  try {
    const parsed = new URL(target, 'http://dashboard.local');
    const pathname = parsed.pathname.toLowerCase();
    const hash = parsed.hash.toLowerCase();
    const view = (parsed.searchParams.get('view') ?? '').trim().toLowerCase();
    const pathSegments = pathname.split('/').filter(Boolean);
    const hashNormalized = hash.replace(/^#/, '').replace(/^\//, '');
    const hashSegments = hashNormalized.split('/').filter(Boolean);
    const pathHasSecurity = pathSegments.includes('security');
    const hashHasSecurity = hashSegments.includes('security') || hashNormalized === 'security';
    return pathHasSecurity || hash === '#security' || hashHasSecurity || view === 'security';
  } catch {
    return false;
  }
}

function resolveSecurityFromLocation() {
  if (typeof window === 'undefined') {
    return false;
  }
  return isSecurityNavigationTarget(window.location.href);
}

function isSecurityCamerasNavigationTarget(path: string) {
  const target = path.trim();
  if (!target) {
    return false;
  }

  try {
    const parsed = new URL(target, 'http://dashboard.local');
    const pathname = parsed.pathname.toLowerCase();
    const hash = parsed.hash.toLowerCase();
    const view = (parsed.searchParams.get('view') ?? '').trim().toLowerCase();
    const pathSegments = pathname.split('/').filter(Boolean);
    const hashNormalized = hash.replace(/^#/, '').replace(/^\//, '');
    const hashSegments = hashNormalized.split('/').filter(Boolean);
    const pathHasSecurity = pathSegments.includes('security');
    const pathHasCameras = pathSegments.includes('cameras') || pathSegments.includes('telecamere');
    const hashHasSecurity = hashSegments.includes('security');
    const hashHasCameras = hashSegments.includes('cameras') || hashSegments.includes('telecamere');
    return (
      (pathHasSecurity && pathHasCameras) ||
      hash === '#security/cameras' ||
      hash === '#security/telecamere' ||
      (hashHasSecurity && hashHasCameras) ||
      view === 'security-cameras' ||
      view === 'security-telecamere'
    );
  } catch {
    return false;
  }
}

function resolveSecurityCamerasFromLocation() {
  if (typeof window === 'undefined') {
    return false;
  }
  return isSecurityCamerasNavigationTarget(window.location.href);
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) {
      return undefined;
    }
    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function toTrimmedString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
    return undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}`;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return undefined;
}

function normalizeLower(value: string | undefined) {
  return (value ?? '').trim().toLowerCase();
}

function normalizeCameraState(value: string | undefined) {
  const normalized = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  return normalized || 'unknown';
}

function isCameraOfflineState(value: string | undefined) {
  return CAMERA_OFFLINE_STATES.has(normalizeCameraState(value));
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (
      [
        'true',
        'on',
        'yes',
        'enabled',
        'supported',
        'available',
        '1',
        'attivo',
        'presente',
        'rilevato',
      ].includes(normalized)
    ) {
      return true;
    }
    if (
      [
        'false',
        'off',
        'no',
        'disabled',
        'unsupported',
        'unavailable',
        '0',
        'assente',
        'inattivo',
        'spento',
        'silenzioso',
      ].includes(normalized)
    ) {
      return false;
    }
  }
  return undefined;
}

function findHaServiceEntry(
  serviceRegistry: HaServiceRegistry | null | undefined,
  domain: string,
  service: string,
) {
  if (!serviceRegistry || typeof serviceRegistry !== 'object') {
    return null;
  }

  const domainEntry =
    serviceRegistry[domain] ??
    Object.entries(serviceRegistry).find(([key]) => key.trim().toLowerCase() === domain)?.[1];
  if (!domainEntry || typeof domainEntry !== 'object') {
    return null;
  }

  const typedDomainEntry = domainEntry as Record<string, unknown>;
  const serviceEntry =
    typedDomainEntry[service] ??
    Object.entries(typedDomainEntry).find(([key]) => key.trim().toLowerCase() === service)?.[1];
  return serviceEntry && typeof serviceEntry === 'object' ? (serviceEntry as Record<string, unknown>) : null;
}

function resolveCameraPtzServiceTarget(serviceRegistry: HaServiceRegistry | null | undefined): CameraPtzServiceTarget | null {
  for (const candidate of CAMERA_PTZ_SERVICE_CANDIDATES) {
    const serviceEntry = findHaServiceEntry(serviceRegistry, candidate.domain, candidate.service);
    if (!serviceEntry) {
      continue;
    }
    const rawFields = serviceEntry.fields;
    const fieldNames = rawFields && typeof rawFields === 'object' ? Object.keys(rawFields) : [];
    const normalizedFields = new Set(fieldNames.map((field) => field.trim().toLowerCase()));
    return {
      domain: candidate.domain,
      service: candidate.service,
      fields: normalizedFields,
    };
  }
  return null;
}

function resolveCameraPtzHint(rawAttributes: Record<string, unknown> | undefined) {
  if (!rawAttributes) {
    return undefined;
  }

  const explicitKeys = [
    'supports_ptz',
    'ptz_supported',
    'ptz_support',
    'ptz_enabled',
    'can_pan_tilt',
    'can_pan_tilt_zoom',
  ];
  for (const key of explicitKeys) {
    const parsed = toBoolean(rawAttributes[key]);
    if (parsed !== undefined) {
      return parsed;
    }
  }

  const stringCandidates = [
    toTrimmedString(rawAttributes.supported_features),
    toTrimmedString(rawAttributes.capabilities),
    toTrimmedString(rawAttributes.features),
  ];
  if (stringCandidates.some((value) => (value ?? '').toLowerCase().includes('ptz'))) {
    return true;
  }

  const arrayCandidates = [
    rawAttributes.features,
    rawAttributes.capabilities,
    rawAttributes.supported_features_list,
    rawAttributes.supported_capabilities,
  ];
  for (const source of arrayCandidates) {
    if (!Array.isArray(source)) {
      continue;
    }
    const hasPtz = source.some((entry) => (toTrimmedString(entry) ?? '').toLowerCase().includes('ptz'));
    if (hasPtz) {
      return true;
    }
  }

  if (Array.isArray(rawAttributes.ptz_presets) && rawAttributes.ptz_presets.length > 0) {
    return true;
  }
  if (rawAttributes.ptz && typeof rawAttributes.ptz === 'object') {
    return true;
  }

  const keyHasPtz = Object.keys(rawAttributes).some((key) => key.trim().toLowerCase().includes('ptz'));
  if (keyHasPtz) {
    return true;
  }

  return undefined;
}

function resolveCameraSupportsPtz(
  entityId: string | undefined,
  rawAttributes: Record<string, unknown> | undefined,
  serviceRegistry: HaServiceRegistry | null | undefined,
) {
  const explicitHint = resolveCameraPtzHint(rawAttributes);
  if (explicitHint !== undefined) {
    return explicitHint;
  }

  const serviceTarget = resolveCameraPtzServiceTarget(serviceRegistry);
  if (!serviceTarget) {
    return false;
  }

  const normalizedEntityId = (entityId ?? '').trim().toLowerCase();
  if (!normalizedEntityId.startsWith('camera.')) {
    return false;
  }

  if (serviceTarget.domain === 'camera') {
    return true;
  }

  const integrationHints = [
    toTrimmedString(rawAttributes?.integration),
    toTrimmedString(rawAttributes?.platform),
    toTrimmedString(rawAttributes?.attribution),
    toTrimmedString(rawAttributes?.manufacturer),
    toTrimmedString(rawAttributes?.model),
    normalizedEntityId,
  ];
  return integrationHints.some((value) => (value ?? '').toLowerCase().includes('onvif'));
}

function normalizeLookupToken(value: string | undefined) {
  if (!value) {
    return '';
  }
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractEntityObjectId(entityId: string | undefined) {
  const value = (entityId ?? '').trim().toLowerCase();
  const separator = value.indexOf('.');
  if (separator <= 0 || separator >= value.length - 1) {
    return '';
  }
  return value.slice(separator + 1);
}

function isEntityLikelyCameraRelated(
  candidateEntityId: string,
  cameraEntityId: string | undefined,
  cameraFriendlyName: string | undefined,
  candidateFriendlyName: string | undefined,
) {
  const candidateObjectId = extractEntityObjectId(candidateEntityId);
  const cameraObjectId = extractEntityObjectId(cameraEntityId);
  if (cameraObjectId && candidateObjectId) {
    if (candidateObjectId.startsWith(`${cameraObjectId}_`) || candidateObjectId.includes(`_${cameraObjectId}_`)) {
      return true;
    }
    if (candidateObjectId === cameraObjectId) {
      return true;
    }
  }

  const cameraNameToken = normalizeLookupToken(cameraFriendlyName);
  const candidateNameToken = normalizeLookupToken(candidateFriendlyName);
  if (cameraNameToken && candidateNameToken && candidateNameToken.includes(cameraNameToken)) {
    return true;
  }

  return false;
}

function resolvePtzDirectionFromCandidateText(value: string) {
  const normalized = ` ${normalizeLookupToken(value)} `;
  const has = (token: string) => normalized.includes(` ${token} `);
  if ((has('ptz') && has('destra')) || has('right')) {
    return 'right' as const;
  }
  if ((has('ptz') && has('sinistra')) || has('left')) {
    return 'left' as const;
  }
  if ((has('ptz') && has('su')) || has('up') || has('alto')) {
    return 'up' as const;
  }
  if ((has('ptz') && has('giu')) || has('down') || has('basso')) {
    return 'down' as const;
  }
  return undefined;
}

function resolveCameraPtzButtons(
  cameraEntityId: string | undefined,
  cameraFriendlyName: string | undefined,
  haStates: MockEntityStateMap,
) {
  const mapping: CameraPtzButtonMap = {};
  Object.entries(haStates).forEach(([entityId, entity]) => {
    if (!entityId.startsWith('button.')) {
      return;
    }
    const candidateFriendlyName = toTrimmedString(entity.rawAttributes?.friendly_name);
    if (
      !isEntityLikelyCameraRelated(
        entityId,
        cameraEntityId,
        cameraFriendlyName,
        candidateFriendlyName,
      )
    ) {
      return;
    }
    const direction =
      resolvePtzDirectionFromCandidateText(candidateFriendlyName ?? '') ??
      resolvePtzDirectionFromCandidateText(entityId);
    if (!direction || mapping[direction]) {
      return;
    }
    mapping[direction] = entityId;
  });
  return mapping;
}

function hasAnyCameraPtzButton(mapping: CameraPtzButtonMap) {
  return Boolean(mapping.up || mapping.down || mapping.left || mapping.right);
}

function resolveCameraPtzButtonPressSequence(
  direction: CameraPtzDirection,
  mapping: CameraPtzButtonMap,
) {
  if (direction === 'up') {
    return mapping.up ? [mapping.up] : [];
  }
  if (direction === 'down') {
    return mapping.down ? [mapping.down] : [];
  }
  if (direction === 'left') {
    return mapping.left ? [mapping.left] : [];
  }
  if (direction === 'right') {
    return mapping.right ? [mapping.right] : [];
  }
  if (direction === 'up_left') {
    return [mapping.up, mapping.left].filter((entry): entry is string => Boolean(entry));
  }
  if (direction === 'up_right') {
    return [mapping.up, mapping.right].filter((entry): entry is string => Boolean(entry));
  }
  if (direction === 'down_left') {
    return [mapping.down, mapping.left].filter((entry): entry is string => Boolean(entry));
  }
  return [mapping.down, mapping.right].filter((entry): entry is string => Boolean(entry));
}

function includesAnyKeyword(value: string, keywords: readonly string[]) {
  return keywords.some((keyword) => value.includes(normalizeLookupToken(keyword)));
}

function resolveSignalState(value: unknown) {
  const direct = toBoolean(value);
  if (direct !== undefined) {
    return direct;
  }
  const normalized = normalizeLookupToken(toTrimmedString(value));
  if (!normalized) {
    return undefined;
  }
  if (
    normalized.includes('detected') ||
    normalized.includes('rilevato') ||
    normalized.includes('triggered') ||
    normalized.includes('active')
  ) {
    return true;
  }
  if (
    normalized.includes('not detected') ||
    normalized.includes('no motion') ||
    normalized.includes('nessun movimento') ||
    normalized.includes('idle')
  ) {
    return false;
  }
  return undefined;
}

function parseItalianDateTime(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const months: Record<string, number> = {
    gennaio: 0,
    febbraio: 1,
    marzo: 2,
    aprile: 3,
    maggio: 4,
    giugno: 5,
    luglio: 6,
    agosto: 7,
    settembre: 8,
    ottobre: 9,
    novembre: 10,
    dicembre: 11,
  };
  const match = normalized.match(
    /(\d{1,2})\s+([a-z]+)\s+(\d{4})(?:\s+alle?\s+ore)?\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/i,
  );
  if (!match) {
    return undefined;
  }
  const day = Number.parseInt(match[1], 10);
  const month = months[match[2]];
  const year = Number.parseInt(match[3], 10);
  const hour = Number.parseInt(match[4], 10);
  const minute = Number.parseInt(match[5], 10);
  const second = match[6] ? Number.parseInt(match[6], 10) : 0;
  if (
    !Number.isFinite(day) ||
    month === undefined ||
    !Number.isFinite(year) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    !Number.isFinite(second)
  ) {
    return undefined;
  }
  const timestamp = new Date(year, month, day, hour, minute, second, 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function resolveFlexibleTimestamp(value: unknown) {
  const direct = toTimestampMs(value);
  if (direct !== undefined) {
    return direct;
  }
  if (typeof value === 'string') {
    return parseItalianDateTime(value);
  }
  return undefined;
}

function resolveEntityEventTimestamp(entity: MockEntityState) {
  const rawAttributes = entity.rawAttributes;
  const candidates: unknown[] = [
    rawAttributes?.last_triggered,
    rawAttributes?.last_motion,
    rawAttributes?.last_motion_detected,
    rawAttributes?.last_sound,
    rawAttributes?.last_sound_detected,
    rawAttributes?.event_time,
    rawAttributes?.timestamp,
    rawAttributes?.time,
    rawAttributes?.datetime,
    rawAttributes?.__last_changed,
    rawAttributes?.last_changed,
    rawAttributes?.__last_updated,
    rawAttributes?.last_updated,
    entity.state,
  ];
  for (const candidate of candidates) {
    const parsed = resolveFlexibleTimestamp(candidate);
    if (parsed !== undefined) {
      return parsed;
    }
  }
  return undefined;
}

function resolveCameraDerivedActivity(
  cameraEntityId: string | undefined,
  cameraFriendlyName: string | undefined,
  haStates: MockEntityStateMap,
  haUrl: string,
) {
  const eventLog: Array<{ timestampMs: number; event: Record<string, unknown> }> = [];
  let motionDetected: boolean | undefined;
  let soundDetected: boolean | undefined;
  let lastMotionDetected: number | undefined;
  let lastSoundDetected: number | undefined;
  let lastImageUrl: string | undefined;
  let lastImageTimestamp = -1;

  Object.entries(haStates).forEach(([entityId, entity]) => {
    if (!isEntityLikelyCameraRelated(entityId, cameraEntityId, cameraFriendlyName, toTrimmedString(entity.rawAttributes?.friendly_name))) {
      return;
    }
    const domain = entityId.split('.')[0];
    const normalizedKey = normalizeLookupToken(`${entityId} ${toTrimmedString(entity.rawAttributes?.friendly_name) ?? ''}`);
    const isMotion = includesAnyKeyword(normalizedKey, CAMERA_MOTION_KEYWORDS);
    const isSound = includesAnyKeyword(normalizedKey, CAMERA_SOUND_KEYWORDS);
    const isImage = domain === 'image' || includesAnyKeyword(normalizedKey, CAMERA_IMAGE_KEYWORDS);
    if (!isMotion && !isSound && !isImage) {
      return;
    }

    const friendlyName = toTrimmedString(entity.rawAttributes?.friendly_name) ?? entityId;
    const stateLabel = toTrimmedString(entity.stateLabel) ?? toTrimmedString(entity.state);
    const timestampMs = resolveEntityEventTimestamp(entity) ?? Date.now();
    const imageCandidate = toTrimmedString(entity.imageUrl) ?? toTrimmedString(entity.rawAttributes?.entity_picture);
    const imageUrl = resolveRelativeHaUrl(imageCandidate, haUrl);

    if (isMotion) {
      const signalState = resolveSignalState(entity.state) ?? resolveSignalState(stateLabel);
      if (signalState !== undefined) {
        motionDetected = signalState;
      }
      lastMotionDetected = Math.max(lastMotionDetected ?? 0, timestampMs);
      eventLog.push({
        timestampMs,
        event: {
          title: friendlyName,
          type: 'motion',
          timestamp: timestampMs,
          time: timestampMs,
          event: stateLabel ?? 'Motion update',
          thumbnail_url: imageUrl,
        },
      });
    }

    if (isSound) {
      const signalState = resolveSignalState(entity.state) ?? resolveSignalState(stateLabel);
      if (signalState !== undefined) {
        soundDetected = signalState;
      }
      lastSoundDetected = Math.max(lastSoundDetected ?? 0, timestampMs);
      eventLog.push({
        timestampMs,
        event: {
          title: friendlyName,
          type: 'sound',
          timestamp: timestampMs,
          time: timestampMs,
          event: stateLabel ?? 'Sound update',
          thumbnail_url: imageUrl,
        },
      });
    }

    if (isImage && imageUrl) {
      if (timestampMs >= lastImageTimestamp) {
        lastImageTimestamp = timestampMs;
        lastImageUrl = imageUrl;
      }
      eventLog.push({
        timestampMs,
        event: {
          title: friendlyName,
          type: 'motion',
          timestamp: timestampMs,
          time: timestampMs,
          event: stateLabel ?? 'Snapshot',
          thumbnail_url: imageUrl,
          image_url: imageUrl,
          snapshot_url: imageUrl,
        },
      });
    }
  });

  const deduped = eventLog
    .sort((left, right) => right.timestampMs - left.timestampMs)
    .filter((entry, index, source) => {
      const signature = JSON.stringify(entry.event);
      const first = source.findIndex((candidate) => JSON.stringify(candidate.event) === signature);
      return first === index;
    })
    .slice(0, 12)
    .map((entry) => entry.event);

  return {
    eventLog: deduped,
    motionDetected,
    soundDetected,
    lastMotionDetected:
      lastMotionDetected !== undefined ? new Date(lastMotionDetected).toISOString() : undefined,
    lastSoundDetected:
      lastSoundDetected !== undefined ? new Date(lastSoundDetected).toISOString() : undefined,
    lastImageUrl,
  } satisfies CameraDerivedActivity;
}

function resolveRelativeHaUrl(value: string | undefined, haUrl: string) {
  if (!value) {
    return undefined;
  }
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }
  if (value.startsWith('/')) {
    const base = normalizeHassUrl(haUrl);
    return base ? `${base}${value}` : value;
  }
  return value;
}

function almostEqual(value: number | undefined, expected: number | undefined, tolerance = 0.15) {
  if (!Number.isFinite(value) || !Number.isFinite(expected)) {
    return false;
  }
  return Math.abs((value as number) - (expected as number)) <= tolerance;
}

function hasClimatePendingValues(value: ClimatePendingState | undefined) {
  if (!value) {
    return false;
  }
  return (
    Number.isFinite(value.targetTemp) ||
    Number.isFinite(value.targetTempLow) ||
    Number.isFinite(value.targetTempHigh) ||
    normalizeLower(value.fanMode).length > 0
  );
}

function hasCoverPendingValues(value: CoverPendingState | undefined) {
  if (!value) {
    return false;
  }
  return (
    normalizeLower(value.state).length > 0 ||
    Number.isFinite(value.position) ||
    Number.isFinite(value.tiltPosition)
  );
}

function toTimestampMs(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function resolveActivityWindowHours(value: unknown) {
  const parsed = toFiniteNumber(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_ACTIVITY_WINDOW_HOURS;
  }
  return Math.max(MIN_ACTIVITY_WINDOW_HOURS, Math.min(MAX_ACTIVITY_WINDOW_HOURS, Math.round(parsed as number)));
}

function resolveActivityMaxEntries(value: unknown) {
  const parsed = toFiniteNumber(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_ACTIVITY_MAX_ENTRIES;
  }
  return Math.max(MIN_ACTIVITY_MAX_ENTRIES, Math.min(MAX_ACTIVITY_MAX_ENTRIES, Math.round(parsed as number)));
}

function formatActivityTimeLabel(timestampMs: number) {
  return new Date(timestampMs).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeMemberAccountToken(value: string | undefined) {
  return normalizeLower(value).replace(/[^a-z0-9]+/g, '');
}

function isGuestServiceAccountMemberCandidate({
  userId,
  displayName,
  username,
  email,
  entityId,
}: {
  userId?: string;
  displayName?: string;
  username?: string;
  email?: string;
  entityId?: string;
}) {
  if (SHOW_GUEST_MEMBERS_IN_FAMILY) {
    return false;
  }
  const emailLocalPart = toTrimmedString(email?.split('@')[0]);
  const personEntitySlug =
    typeof entityId === 'string' && entityId.startsWith('person.')
      ? entityId.slice('person.'.length)
      : entityId;
  const candidates = [userId, displayName, username, emailLocalPart, personEntitySlug]
    .map((entry) => normalizeMemberAccountToken(entry))
    .filter(Boolean);

  return candidates.some((token) =>
    HIDDEN_MEMBER_ACCOUNT_ALIASES.some((alias) => token === alias || token.startsWith(alias)),
  );
}

function resolveGuestAliasUserId(
  usersById: Record<string, HaAuthUser>,
  userNamesById: Record<string, string>,
) {
  const matchesGuestAlias = (value: string | undefined) => {
    const token = normalizeMemberAccountToken(value);
    if (!token) {
      return false;
    }
    return HIDDEN_MEMBER_ACCOUNT_ALIASES.some((alias) => token === alias || token.startsWith(alias));
  };

  const candidatesFromUsers = Object.values(usersById).find((user) => {
    const emailLocalPart = toTrimmedString(user.email?.split('@')[0]);
    return (
      matchesGuestAlias(user.id) ||
      matchesGuestAlias(user.name) ||
      matchesGuestAlias(user.username) ||
      matchesGuestAlias(emailLocalPart)
    );
  });
  if (candidatesFromUsers?.id) {
    return candidatesFromUsers.id;
  }

  const candidatesFromNames = Object.entries(userNamesById).find(([userId, userName]) =>
    matchesGuestAlias(userId) || matchesGuestAlias(userName),
  );
  return candidatesFromNames?.[0] ?? null;
}

function parseGuestAccessContextFromLocation() {
  if (typeof window === 'undefined') {
    return { isGuestMode: false, guestUserId: null as string | null };
  }

  try {
    const parsed = new URL(window.location.href);
    const guestParam = (parsed.searchParams.get('guest') ?? '').trim().toLowerCase();
    const isGuestMode = guestParam === '1' || guestParam === 'true' || guestParam === 'yes';
    if (!isGuestMode) {
      return { isGuestMode: false, guestUserId: null as string | null };
    }
    const guestUserId = toTrimmedString(parsed.searchParams.get('guest_user_id')) ?? null;
    return { isGuestMode: true, guestUserId };
  } catch {
    return { isGuestMode: false, guestUserId: null as string | null };
  }
}

function resolveHaAssetUrl(candidate: string | undefined, haUrl: string) {
  if (!candidate) {
    return undefined;
  }
  if (/^https?:\/\//i.test(candidate) || candidate.startsWith('data:')) {
    return candidate;
  }
  if (candidate.startsWith('/')) {
    const base = normalizeHassUrl(haUrl);
    return base ? `${base}${candidate}` : candidate;
  }
  return candidate;
}

function parseHaAuthUsers(payload: unknown): HaAuthUser[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  const users: HaAuthUser[] = [];
  const seen = new Set<string>();
  payload.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const source = entry as Record<string, unknown>;
    const id = toTrimmedString(source.id);
    const name = toTrimmedString(source.name) ?? toTrimmedString(source.username);
    const username = toTrimmedString(source.username);
    const explicitEmail = toTrimmedString(source.email);
    const email = explicitEmail ?? (username && username.includes('@') ? username : undefined);
    const isOwner = source.is_owner === true;
    const isAdmin = source.is_admin === true;
    if (!id || !name || seen.has(id)) {
      return;
    }
    seen.add(id);
    users.push({ id, name, username, email, isOwner, isAdmin });
  });
  return users;
}

function parseHaCurrentUser(payload: unknown): HaAuthUser | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const source = payload as Record<string, unknown>;
  const id = toTrimmedString(source.id);
  const name = toTrimmedString(source.name) ?? toTrimmedString(source.username);
  const username = toTrimmedString(source.username);
  const explicitEmail = toTrimmedString(source.email);
  const email = explicitEmail ?? (username && username.includes('@') ? username : undefined);
  const isOwner = source.is_owner === true;
  const isAdmin = source.is_admin === true;
  if (!id || !name) {
    return null;
  }
  return { id, name, username, email, isOwner, isAdmin };
}

function parseHaLogbookEvents(payload: unknown): HaLogbookEvent[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload.filter((entry): entry is HaLogbookEvent => Boolean(entry) && typeof entry === 'object');
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => toTrimmedString(entry))
    .filter((entry): entry is string => Boolean(entry));
}

function normalizeMovementLocationKey(value: string | undefined) {
  const normalized = normalizeLower(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized;
}

function formatMovementLocationLabel(state: string | undefined) {
  const normalized = normalizeLower(state);
  if (!normalized) {
    return 'Posizione sconosciuta';
  }
  if (normalized === 'home') {
    return 'Casa';
  }
  if (normalized === 'not_home') {
    return 'Fuori casa';
  }
  return state
    ?.replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (chunk) => chunk.toUpperCase()) ?? 'Posizione';
}

function readMovementCoordinates(rawAttributes: Record<string, unknown> | undefined) {
  if (!rawAttributes) {
    return null;
  }
  const latitude = toFiniteNumber(rawAttributes.latitude);
  const longitude = toFiniteNumber(rawAttributes.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return {
    latitude: latitude as number,
    longitude: longitude as number,
  };
}

function buildMovementZoneCoordinateLookup(haStates: MockEntityStateMap) {
  const lookup: Record<string, { latitude: number; longitude: number; label: string }> = {};
  Object.entries(haStates).forEach(([entityId, entity]) => {
    if (!entityId.startsWith('zone.')) {
      return;
    }
    const coordinates = readMovementCoordinates(entity.rawAttributes);
    if (!coordinates) {
      return;
    }
    const zoneKey = normalizeMovementLocationKey(entityId.slice('zone.'.length));
    const friendlyName = toTrimmedString(entity.rawAttributes?.friendly_name) ?? zoneKey;
    if (zoneKey) {
      lookup[zoneKey] = {
        ...coordinates,
        label: friendlyName,
      };
    }
    const friendlyKey = normalizeMovementLocationKey(friendlyName);
    if (friendlyKey) {
      lookup[friendlyKey] = {
        ...coordinates,
        label: friendlyName,
      };
    }
  });
  return lookup;
}

function resolveActivityActor(
  event: HaLogbookEvent,
  userNamesById: Record<string, string>,
  fallbackActor?: string,
) {
  const contextUserId =
    toTrimmedString(event.context_user_id) ??
    toTrimmedString(event.user_id) ??
    toTrimmedString(event.context?.user_id);
  if (contextUserId && userNamesById[contextUserId]) {
    return userNamesById[contextUserId];
  }
  return fallbackActor?.trim() || DEFAULT_ACTIVITY_ACTOR;
}

function resolveLockActivityVerb(event: HaLogbookEvent) {
  const normalizedState = normalizeLockState(toTrimmedString(event.state));
  const message = normalizeLower(toTrimmedString(event.message));
  if (
    normalizedState === 'unlocked' ||
    normalizedState === 'unlocking' ||
    message.includes('unlock') ||
    message.includes('sblocc')
  ) {
    return 'ha sbloccato';
  }
  if (
    normalizedState === 'locked' ||
    normalizedState === 'locking' ||
    message.includes(' locked') ||
    message.startsWith('locked') ||
    message.includes(' blocc')
  ) {
    return 'ha bloccato';
  }
  if (normalizedState === 'open' || message.includes(' open')) {
    return 'ha aperto';
  }
  return 'ha aggiornato la serratura';
}

function resolveAlarmActivityVerb(event: HaLogbookEvent) {
  const normalizedState = normalizeAlarmState(toTrimmedString(event.state));
  const message = normalizeLower(toTrimmedString(event.message));
  if (normalizedState === 'disarmed' || message.includes('disarm') || message.includes('disinser')) {
    return 'ha disinserito';
  }
  if (normalizedState === 'armed_home' || message.includes('armed_home') || message.includes('arm home')) {
    return 'ha inserito Casa';
  }
  if (normalizedState === 'armed_away' || message.includes('armed_away') || message.includes('arm away')) {
    return 'ha inserito Fuori';
  }
  if (normalizedState === 'armed_night' || message.includes('armed_night') || message.includes('arm night')) {
    return 'ha inserito Notte';
  }
  if (normalizedState === 'armed_vacation' || message.includes('armed_vacation') || message.includes('vacation')) {
    return 'ha inserito Vacanza';
  }
  if (
    normalizedState === 'armed_custom_bypass' ||
    message.includes('custom_bypass') ||
    message.includes('bypass')
  ) {
    return 'ha inserito Bypass';
  }
  if (normalizedState === 'triggered' || message.includes('trigger')) {
    return 'ha attivato il trigger';
  }
  if (normalizedState === 'arming' || normalizedState === 'pending') {
    return 'ha avviato inserimento';
  }
  if (normalizedState === 'disarming') {
    return 'ha avviato disinserimento';
  }
  return "ha aggiornato l'allarme";
}

function buildTimelineEntries(
  events: HaLogbookEvent[],
  actorResolver: (event: HaLogbookEvent) => string,
  verbResolver: (event: HaLogbookEvent) => string,
  maxEntries: number,
) {
  return events
    .map((event, index) => {
      const timestampMs = toTimestampMs(event.when);
      if (!timestampMs) {
        return null;
      }
      const actor = actorResolver(event);
      const verb = verbResolver(event);
      return {
        id: `${timestampMs}-${index}`,
        timestampMs,
        actor,
        text: `${actor} ${verb} ${formatActivityTimeLabel(timestampMs)}`,
      } satisfies ActivityTimelineEntry;
    })
    .filter((entry): entry is ActivityTimelineEntry => entry !== null)
    .sort((left, right) => right.timestampMs - left.timestampMs)
    .slice(0, maxEntries);
}

function readFirstAttributeValue(attributes: Record<string, unknown> | undefined, keys: string[]): unknown {
  if (!attributes) {
    return undefined;
  }
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(attributes, key)) {
      return attributes[key];
    }
  }
  return undefined;
}

function readAttributeNumber(attributes: Record<string, unknown> | undefined, keys: string[]): number | undefined {
  const value = readFirstAttributeValue(attributes, keys);
  return toFiniteNumber(value);
}

function readAttributeString(attributes: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  const value = readFirstAttributeValue(attributes, keys);
  return toTrimmedString(value);
}

function formatRoundedValue(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${Math.round(rounded)}` : rounded.toFixed(1);
}

function normalizeConnectionState(value: unknown): SensorConnectionState {
  if (typeof value === 'boolean') {
    return value ? 'online' : 'offline';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value === 0) {
      return 'offline';
    }
    return 'online';
  }
  const text = toTrimmedString(value);
  if (!text) {
    return 'offline';
  }
  const normalized = text.toLowerCase();
  if (normalized === 'unknown' || SENSOR_CONNECTION_OFF_VALUES.has(normalized)) {
    return 'offline';
  }
  if (SENSOR_CONNECTION_ON_VALUES.has(normalized)) {
    return 'online';
  }
  return 'online';
}

function normalizeConnectionLabel(state: SensorConnectionState): string {
  return state === 'offline' ? 'Disconnesso' : 'Connesso';
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toHistoryTimestampMs(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.abs(value) < 10_000_000_000 ? Math.round(value * 1000) : Math.round(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      const numeric = Number.parseFloat(trimmed);
      if (Number.isFinite(numeric)) {
        return Math.abs(numeric) < 10_000_000_000 ? Math.round(numeric * 1000) : Math.round(numeric);
      }
    }
    const parsed = Date.parse(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function downsampleNumberSeries(values: number[], maxPoints: number) {
  const safeMax = Math.max(1, Math.round(maxPoints));
  if (values.length <= safeMax) {
    return values;
  }
  const sampled: number[] = [];
  const usedIndices = new Set<number>();
  for (let index = 0; index < safeMax; index += 1) {
    const nextIndex = Math.round((index * (values.length - 1)) / (safeMax - 1));
    if (usedIndices.has(nextIndex)) {
      continue;
    }
    usedIndices.add(nextIndex);
    sampled.push(values[nextIndex]);
  }
  if (sampled.length === 0) {
    return values.slice(-safeMax);
  }
  return sampled;
}

function extractSensorHistoryValues(payload: unknown, entityId: string, maxPoints = SENSOR_HISTORY_MAX_POINTS) {
  const normalizedEntityId = entityId.trim();
  if (!normalizedEntityId) {
    return [];
  }

  const historyEntries: Record<string, unknown>[] = [];
  const tryCollectEntries = (candidate: unknown) => {
    if (!Array.isArray(candidate)) {
      return;
    }
    candidate.forEach((entry) => {
      if (isRecordObject(entry)) {
        historyEntries.push(entry);
      }
    });
  };

  if (isRecordObject(payload)) {
    tryCollectEntries(payload[normalizedEntityId]);
    if (historyEntries.length === 0) {
      const entityValues = Object.values(payload);
      if (entityValues.length === 1) {
        tryCollectEntries(entityValues[0]);
      }
    }
  } else if (Array.isArray(payload)) {
    if (payload.length > 0 && Array.isArray(payload[0])) {
      tryCollectEntries(payload[0]);
    } else {
      tryCollectEntries(payload);
    }
  }

  const points = historyEntries
    .map((entry, fallbackIndex) => {
      const rawState = entry.s ?? entry.state;
      const value = toFiniteNumber(rawState);
      if (!Number.isFinite(value)) {
        return null;
      }
      const timestampMs =
        toHistoryTimestampMs(
          entry.lu ??
            entry.last_updated ??
            entry.last_updated_ts ??
            entry.lc ??
            entry.last_changed ??
            entry.last_changed_ts,
        ) ?? fallbackIndex;
      return {
        value: value as number,
        timestampMs,
      };
    })
    .filter((point): point is { value: number; timestampMs: number } => point !== null)
    .sort((left, right) => left.timestampMs - right.timestampMs);

  if (points.length === 0) {
    return [];
  }

  const series = points.map((point) => Math.round(point.value * 10) / 10);
  return downsampleNumberSeries(series, maxPoints);
}

function sameNumberSeries(left: number[] | undefined, right: number[] | undefined) {
  if (!left && !right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function resolveSensorMeta(
  widget: Widget,
  liveEntity: MockEntityState | undefined,
  haEntityMap: Record<string, MockEntityState>,
) {
  const statusEntityId = widget.sensorStatusEntityId?.trim();
  const batteryEntityId = widget.sensorBatteryEntityId?.trim();
  const connectionEntityId = widget.sensorConnectionEntityId?.trim();
  const statusEntity = statusEntityId ? haEntityMap[statusEntityId] : undefined;
  const batteryEntity = batteryEntityId ? haEntityMap[batteryEntityId] : undefined;
  const connectionEntity = connectionEntityId ? haEntityMap[connectionEntityId] : undefined;
  const mainAttributes = liveEntity?.rawAttributes;

  const statusFromEntity =
    statusEntity?.stateLabel ?? statusEntity?.secondary ?? statusEntity?.state;
  const statusFromAttributes = readAttributeString(mainAttributes, SENSOR_STATUS_ATTRIBUTE_KEYS);
  const status =
    statusFromEntity ??
    statusFromAttributes ??
    liveEntity?.stateLabel ??
    liveEntity?.state ??
    widget.status;

  const batteryNumericFromEntity =
    typeof batteryEntity?.numericValue === 'number'
      ? batteryEntity.numericValue
      : toFiniteNumber(batteryEntity?.state);
  const batteryFromEntity =
    batteryNumericFromEntity !== undefined
      ? `${formatRoundedValue(batteryNumericFromEntity)}${batteryEntity?.unit ?? '%'}`
      : batteryEntity
        ? batteryEntity.stateLabel ?? batteryEntity.secondary ?? batteryEntity.state
        : undefined;
  const batteryNumericFromAttributes = readAttributeNumber(mainAttributes, SENSOR_BATTERY_ATTRIBUTE_KEYS);
  const batteryFromAttributes =
    batteryNumericFromAttributes !== undefined
      ? `${formatRoundedValue(batteryNumericFromAttributes)}%`
      : readAttributeString(mainAttributes, SENSOR_BATTERY_ATTRIBUTE_KEYS);
  const battery = batteryFromEntity ?? batteryFromAttributes;

  const connectionSourceFromEntity =
    connectionEntity?.stateLabel ?? connectionEntity?.state ?? connectionEntity?.secondary;
  const connectionSourceFromAttributes = readFirstAttributeValue(mainAttributes, SENSOR_CONNECTION_ATTRIBUTE_KEYS);
  const fallbackConnectionSource = liveEntity?.stateLabel ?? liveEntity?.state;
  const rawConnectionSource =
    connectionSourceFromEntity ?? connectionSourceFromAttributes ?? fallbackConnectionSource;
  const connectionState = normalizeConnectionState(rawConnectionSource);
  const connection = normalizeConnectionLabel(connectionState);

  return {
    status,
    battery,
    connection,
    connectionState,
  };
}

function resolveMediaState(value: string | undefined): 'playing' | 'paused' | 'idle' | 'unavailable' {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized.includes('unavailable') || normalized.includes('offline')) {
    return 'unavailable';
  }
  if (normalized.includes('play') || normalized === 'on') {
    return 'playing';
  }
  if (normalized.includes('pause')) {
    return 'paused';
  }
  return 'idle';
}

function resolveLiveMediaPosition(
  basePosition: number,
  duration: number,
  state: string | undefined,
  updatedAt: number | undefined,
  nowMs: number,
) {
  if (!(duration > 0)) {
    return 0;
  }
  const safeBase = Math.max(0, Math.min(duration, Math.round(basePosition || 0)));
  const mediaState = (state ?? '').trim().toLowerCase();
  if (mediaState !== 'playing' || !updatedAt || nowMs <= updatedAt) {
    return safeBase;
  }
  const elapsedSeconds = Math.floor((nowMs - updatedAt) / 1000);
  if (elapsedSeconds <= 0) {
    return safeBase;
  }
  return Math.max(0, Math.min(duration, safeBase + elapsedSeconds));
}

function resolveMediaCapabilities(entity?: MockEntityState) {
  if (!entity) {
    return {
      supportsSeek: true,
      supportsVolume: true,
      supportsMute: true,
      supportsNextTrack: true,
      supportsPreviousTrack: true,
      supportsPower: true,
    };
  }

  const rawSupported = entity.rawAttributes?.supported_features;
  const fromRaw = typeof rawSupported === 'number' ? rawSupported : undefined;
  const features =
    typeof entity.supportedFeatures === 'number'
      ? entity.supportedFeatures
      : fromRaw ?? 0;

  return {
    supportsSeek: (features & MEDIA_FEATURE_SEEK) !== 0 || typeof entity.mediaDuration === 'number',
    supportsVolume: (features & MEDIA_FEATURE_VOLUME_SET) !== 0 || typeof entity.volumeLevel === 'number',
    supportsMute:
      features === 0 ||
      (features & MEDIA_FEATURE_VOLUME_MUTE) !== 0 ||
      typeof entity.mediaMuted === 'boolean' ||
      typeof entity.rawAttributes?.is_volume_muted === 'boolean',
    supportsNextTrack: (features & MEDIA_FEATURE_NEXT_TRACK) !== 0,
    supportsPreviousTrack: (features & MEDIA_FEATURE_PREVIOUS_TRACK) !== 0,
    supportsPower:
      (features & MEDIA_FEATURE_TURN_ON) !== 0 ||
      (features & MEDIA_FEATURE_TURN_OFF) !== 0 ||
      (features & MEDIA_FEATURE_PLAY) !== 0 ||
      (features & MEDIA_FEATURE_PAUSE) !== 0,
  };
}

function normalizeVacuumState(value: string | undefined) {
  const normalized = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalized) {
    return 'unknown';
  }
  if (normalized === 'returning_to_base') {
    return 'returning';
  }
  if (normalized === 'charging') {
    return 'docked';
  }
  return normalized;
}

function translateVacuumState(state: string) {
  if (state === 'cleaning') {
    return 'Pulizia';
  }
  if (state === 'paused') {
    return 'In pausa';
  }
  if (state === 'returning') {
    return 'Rientro base';
  }
  if (state === 'docked') {
    return 'In base';
  }
  if (state === 'idle') {
    return 'Inattivo';
  }
  if (state === 'error') {
    return 'Errore';
  }
  if (state === 'unavailable') {
    return 'Non disponibile';
  }
  return 'Sconosciuto';
}

function buildFallbackVacuumAttributes(widget: Widget, includeDemoFeatures: boolean) {
  const batteryLevel = typeof widget.value === 'number' ? Math.round(widget.value) : 85;
  const cleanedArea =
    typeof widget.vacuumCleanedArea === 'number' && Number.isFinite(widget.vacuumCleanedArea)
      ? Math.max(0, widget.vacuumCleanedArea)
      : 45;
  const cleaningTime =
    typeof widget.vacuumCleaningMinutes === 'number' && Number.isFinite(widget.vacuumCleaningMinutes)
      ? Math.max(0, Math.round(widget.vacuumCleaningMinutes))
      : 32;
  const fanSpeed = widget.vacuumFanSpeed?.trim() || 'balanced';

  return {
    friendly_name: widget.title,
    status: translateVacuumState(normalizeVacuumState(widget.status)),
    battery_level: batteryLevel,
    fan_speed: fanSpeed,
    fan_speed_list: [...VACUUM_DEMO_FAN_SPEEDS],
    cleaned_area: Math.round(cleanedArea * 10) / 10,
    cleaned_area_unit: 'm2',
    cleaning_time: cleaningTime,
    map_url: widget.vacuumMapUrl ?? (includeDemoFeatures ? VACUUM_DEMO_MAP_URL : undefined),
    supported_features: includeDemoFeatures ? VACUUM_DEMO_SUPPORTED_FEATURES : undefined,
  } as Record<string, unknown>;
}

function buildFallbackCoverAttributes(widget: Widget) {
  const normalizedState = normalizeCoverState(widget.status);
  const currentPosition = resolveCoverPosition(normalizedState, widget.value, 70);
  const tiltPosition = resolveCoverTiltPosition(widget.coverTiltPosition, 50);
  return {
    friendly_name: widget.title,
    current_position: currentPosition,
    current_tilt_position: tiltPosition,
    supported_features:
      COVER_FEATURE_OPEN |
      COVER_FEATURE_CLOSE |
      COVER_FEATURE_STOP |
      COVER_FEATURE_SET_POSITION |
      COVER_FEATURE_SET_TILT_POSITION,
  } as Record<string, unknown>;
}

function normalizeLockState(value: string | undefined) {
  const normalized = (value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalized) {
    return 'unknown';
  }
  if (normalized === 'opening') {
    return 'unlocking';
  }
  if (normalized === 'closing') {
    return 'locking';
  }
  return normalized;
}

function isLockLockedState(state: string) {
  return state === 'locked' || state === 'locking';
}

function translateLockState(state: string) {
  if (state === 'locked') {
    return 'Bloccata';
  }
  if (state === 'unlocked') {
    return 'Sbloccata';
  }
  if (state === 'locking') {
    return 'Blocco...';
  }
  if (state === 'unlocking') {
    return 'Sblocco...';
  }
  if (state === 'jammed') {
    return 'Inceppata';
  }
  if (state === 'open') {
    return 'Aperta';
  }
  if (state === 'unavailable') {
    return 'Non disponibile';
  }
  return 'Sconosciuta';
}

function resolveCameraPreviewUrls(
  entity: MockEntityState | undefined,
  fallbackEntityId: string | undefined,
  haUrl: string,
) {
  const rawAttributes = entity?.rawAttributes;
  const cameraEntityId =
    toTrimmedString(rawAttributes?.camera_entity_id) ??
    toTrimmedString(rawAttributes?.entity_id) ??
    toTrimmedString(fallbackEntityId);
  const streamUrl = cameraEntityId
    ? `/api/camera_proxy_stream/${encodeURIComponent(cameraEntityId)}`
    : undefined;
  const snapshotCandidate =
    toTrimmedString(entity?.imageUrl) ??
    toTrimmedString(rawAttributes?.entity_picture) ??
    toTrimmedString(rawAttributes?.camera_url) ??
    toTrimmedString(rawAttributes?.cameraUrl);
  return {
    cameraEntityId,
    streamUrl,
    snapshotUrl: resolveRelativeHaUrl(snapshotCandidate, haUrl),
  };
}

function resolveVacuumMapUrl(
  entity: MockEntityState | undefined,
  haUrl: string,
) {
  if (!entity) {
    return undefined;
  }

  if (entity.imageUrl && entity.imageUrl.trim().length > 0) {
    return entity.imageUrl;
  }

  const rawAttributes = entity.rawAttributes;
  const candidates = [
    toTrimmedString(rawAttributes?.entity_picture),
    toTrimmedString(rawAttributes?.map),
    toTrimmedString(rawAttributes?.map_url),
    toTrimmedString(rawAttributes?.map_image),
  ].filter((entry): entry is string => Boolean(entry));
  if (!candidates.length) {
    return undefined;
  }

  const candidate = candidates[0];
  if (/^https?:\/\//i.test(candidate) || candidate.startsWith('data:')) {
    return candidate;
  }
  if (candidate.startsWith('/')) {
    const base = normalizeHassUrl(haUrl);
    return base ? `${base}${candidate}` : candidate;
  }
  return candidate;
}

function resolveVacuumCapabilities(entity: MockEntityState | undefined) {
  const rawSupported = entity?.rawAttributes?.supported_features;
  const rawFeatures = typeof rawSupported === 'number' ? rawSupported : undefined;
  const supportedFeatures = typeof entity?.supportedFeatures === 'number' ? entity.supportedFeatures : rawFeatures ?? 0;
  return {
    supportedFeatures,
    supportsStart: supportedFeatures === 0 || (supportedFeatures & VACUUM_FEATURE_START) !== 0,
    supportsPause: supportedFeatures === 0 || (supportedFeatures & VACUUM_FEATURE_PAUSE) !== 0,
    supportsStop: supportedFeatures === 0 || (supportedFeatures & VACUUM_FEATURE_STOP) !== 0,
    supportsReturnHome: supportedFeatures === 0 || (supportedFeatures & VACUUM_FEATURE_RETURN_HOME) !== 0,
    supportsLocate: supportedFeatures === 0 || (supportedFeatures & VACUUM_FEATURE_LOCATE) !== 0,
    supportsCleanSpot: supportedFeatures === 0 || (supportedFeatures & VACUUM_FEATURE_CLEAN_SPOT) !== 0,
    supportsFanSpeed: supportedFeatures === 0 || (supportedFeatures & VACUUM_FEATURE_FAN_SPEED) !== 0,
    supportsSendCommand: supportedFeatures === 0 || (supportedFeatures & VACUUM_FEATURE_SEND_COMMAND) !== 0,
    supportsMap: supportedFeatures === 0 || (supportedFeatures & VACUUM_FEATURE_MAP) !== 0,
    supportsCleanArea: supportedFeatures === 0 || (supportedFeatures & VACUUM_FEATURE_CLEAN_AREA) !== 0,
  };
}

function resolveCoverCapabilities(entity: MockEntityState | undefined) {
  const supportedFeatures = resolveCoverSupportedFeatures(entity);
  const rawAttributes = entity?.rawAttributes;
  return {
    supportedFeatures,
    supportsOpen: supportedFeatures === undefined || supportedFeatures === 0 || (supportedFeatures & COVER_FEATURE_OPEN) !== 0,
    supportsClose:
      supportedFeatures === undefined || supportedFeatures === 0 || (supportedFeatures & COVER_FEATURE_CLOSE) !== 0,
    supportsStop: coverSupportsStop(supportedFeatures),
    supportsSetPosition: coverSupportsSetPosition(supportedFeatures),
    supportsSetTiltPosition: coverSupportsTilt(supportedFeatures, rawAttributes),
  };
}

function isDemoVacuumEntity(entityId: string | undefined) {
  const value = (entityId ?? '').trim().toLowerCase();
  return value === 'vacuum.demo_robot' || value.startsWith('vacuum.demo_');
}

function resolveLightCapabilities(entity?: MockEntityState) {
  if (!entity) {
    return {
      supportsBrightness: true,
      supportsColorTemp: true,
      supportsColor: true,
    };
  }

  const rawModes = entity.rawAttributes?.supported_color_modes;
  const supportedColorModes = Array.isArray(rawModes)
    ? rawModes
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.toLowerCase())
    : [];
  const features = typeof entity.supportedFeatures === 'number' ? entity.supportedFeatures : 0;

  const supportsColor =
    supportedColorModes.some((mode) => LIGHT_COLOR_MODES_WITH_COLOR.has(mode)) ||
    (features & LIGHT_FEATURE_COLOR) !== 0 ||
    Array.isArray(entity.hsColor ?? entity.hs_color) ||
    Array.isArray(entity.rgbColor ?? entity.rgb_color);

  const supportsColorTemp =
    supportedColorModes.includes('color_temp') ||
    (features & LIGHT_FEATURE_COLOR_TEMP) !== 0 ||
    typeof entity.colorTempKelvin === 'number' ||
    typeof entity.color_temp_kelvin === 'number' ||
    typeof entity.rawAttributes?.min_color_temp_kelvin === 'number' ||
    typeof entity.rawAttributes?.max_color_temp_kelvin === 'number';

  const supportsBrightness =
    supportedColorModes.some((mode) => LIGHT_COLOR_MODES_WITH_BRIGHTNESS.has(mode)) ||
    (features & LIGHT_FEATURE_BRIGHTNESS) !== 0 ||
    typeof entity.brightness === 'number' ||
    entity.rawAttributes?.brightness !== undefined ||
    supportsColor ||
    supportsColorTemp;

  return {
    supportsBrightness,
    supportsColorTemp,
    supportsColor,
  };
}

export function MainBoard() {
  const {
    theme,
    setTheme,
    wallpaper,
    setWallpaper,
    developerMode,
    setDeveloperMode,
    haUrl: profileHaUrl,
    setHaUrl: setProfileHaUrl,
    haToken,
    setHaToken,
    haRememberToken,
    setHaRememberToken,
    sidebarPaths,
    updateSidebarPath,
    removeSidebarPath,
  } = useProfileSettings();
  const {
    config: consumptionConfig,
    updateConfigField: updateConsumptionConfigField,
    resetConfig: resetConsumptionConfig,
  } = useConsumptionConfig();
  const webSocketHaConnection =
    useHaLiveConnection({
      url: profileHaUrl,
      token: haToken,
    });
  const panelHaBridgeConnection = useHaPanelBridgeConnection();
  const isHaManagedByParent = panelHaBridgeConnection.isManagedByParent;
  const activeHaConnection = isHaManagedByParent ? panelHaBridgeConnection : webSocketHaConnection;
  const haUrl = isHaManagedByParent ? panelHaBridgeConnection.hassUrl || profileHaUrl : profileHaUrl;
  const setHaUrl = setProfileHaUrl;
  const {
    status: haStatus,
    error: haError,
    haStates,
    haAreas,
    connect: connectHa,
    disconnect: disconnectHa,
    callService: callHaService,
    callApi: callHaApi,
  } = activeHaConnection;
  const { addNotification, removeNotification } = useNotifications();
  const isHaConnected = haStatus === 'connected';
  const assistantAgentClient = useMemo(
    () =>
      isHaConnected
        ? createHomeAssistantAssistAgentClient({
            callApi: callHaApi,
            isConnected: isHaConnected,
            language: 'it',
          })
        : createDemoAgentClient(),
    [callHaApi, isHaConnected],
  );
  const [climatePendingByEntity, setClimatePendingByEntity] = useState<Record<string, ClimatePendingState>>({});
  const [lightColorPendingByEntity, setLightColorPendingByEntity] = useState<Record<string, LightColorPendingState>>({});
  const [coverPendingByEntity, setCoverPendingByEntity] = useState<Record<string, CoverPendingState>>({});
  const [haUserNamesById, setHaUserNamesById] = useState<Record<string, string>>({});
  const [haUsersById, setHaUsersById] = useState<Record<string, HaAuthUser>>({});
  const [haCurrentUser, setHaCurrentUser] = useState<HaAuthUser | null>(null);
  const [lockTimelineByEntity, setLockTimelineByEntity] = useState<Record<string, ActivityTimelineEntry[]>>({});
  const [alarmTimelineByEntity, setAlarmTimelineByEntity] = useState<Record<string, ActivityTimelineEntry[]>>({});
  const [haServiceRegistry, setHaServiceRegistry] = useState<HaServiceRegistry | null>(null);
  const [haFavoriteEntityIds, setHaFavoriteEntityIds] = useState<string[]>([]);
  const [haFavoriteLabelDetected, setHaFavoriteLabelDetected] = useState(false);
  const [profileMovementTimeline, setProfileMovementTimeline] = useState<ProfileMovementTimelineEntry[]>([]);
  const [profileMovementPoints, setProfileMovementPoints] = useState<ProfileMovementMapPoint[]>([]);
  const [profileMovementUpdatedLabel, setProfileMovementUpdatedLabel] = useState<string>('');
  const profileMovementSource = useMemo(() => {
    const zoneLookup = buildMovementZoneCoordinateLookup(haStates);
    const userIdKey = normalizeLower(haCurrentUser?.id);
    const userNameKey = normalizeMovementLocationKey(haCurrentUser?.name);
    const userUsernameKey = normalizeMovementLocationKey(haCurrentUser?.username);
    const userEmailKey = normalizeMovementLocationKey(haCurrentUser?.email?.split('@')[0]);
    const userNeedles = new Set([userNameKey, userUsernameKey, userEmailKey].filter(Boolean));

    let selectedPersonEntityId: string | null = null;
    let selectedPersonScore = -1;
    let selectedPersonLinkedTrackers: string[] = [];

    Object.entries(haStates).forEach(([entityId, entity]) => {
      if (!entityId.startsWith('person.')) {
        return;
      }
      const rawAttributes = entity.rawAttributes ?? {};
      const friendlyNameKey = normalizeMovementLocationKey(toTrimmedString(rawAttributes.friendly_name));
      const linkedUserId = normalizeLower(toTrimmedString(rawAttributes.user_id));
      const entityKey = normalizeMovementLocationKey(entityId.slice('person.'.length));
      const linkedTrackers = toStringArray(rawAttributes.entity_id).map((entry) => entry.trim()).filter(Boolean);

      let score = 0;
      if (userIdKey && linkedUserId === userIdKey) {
        score += 100;
      }
      if (userNeedles.size > 0) {
        if (friendlyNameKey && userNeedles.has(friendlyNameKey)) {
          score += 45;
        }
        if (entityKey && userNeedles.has(entityKey)) {
          score += 30;
        }
      }
      if (linkedTrackers.some((trackerId) => trackerId.startsWith('device_tracker.'))) {
        score += 5;
      }

      if (score > selectedPersonScore) {
        selectedPersonScore = score;
        selectedPersonEntityId = entityId;
        selectedPersonLinkedTrackers = linkedTrackers;
      }
    });

    const trackerEntityIds = new Set<string>();
    selectedPersonLinkedTrackers.forEach((entityId) => {
      if (entityId.startsWith('device_tracker.')) {
        trackerEntityIds.add(entityId);
      }
    });

    Object.entries(haStates).forEach(([entityId, entity]) => {
      if (!entityId.startsWith('device_tracker.')) {
        return;
      }
      const rawAttributes = entity.rawAttributes ?? {};
      const linkedUserId = normalizeLower(toTrimmedString(rawAttributes.user_id));
      const friendlyNameKey = normalizeMovementLocationKey(toTrimmedString(rawAttributes.friendly_name));
      const entityKey = normalizeMovementLocationKey(entityId.slice('device_tracker.'.length));
      const byUserId = userIdKey && linkedUserId === userIdKey;
      const byName = userNeedles.size > 0 && (userNeedles.has(friendlyNameKey) || userNeedles.has(entityKey));
      if (byUserId || byName) {
        trackerEntityIds.add(entityId);
      }
    });

    const trackedEntityIds = new Set<string>();
    if (selectedPersonEntityId) {
      trackedEntityIds.add(selectedPersonEntityId);
    }
    trackerEntityIds.forEach((entityId) => trackedEntityIds.add(entityId));

    const formatMovementDateTime = (timestampMs: number) =>
      new Date(timestampMs).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

    const basePoints: ProfileMovementMapPoint[] = [];
    const pushPoint = (entityId: string, isCurrent?: boolean) => {
      const entity = haStates[entityId];
      if (!entity) {
        return;
      }
      const coordinates = readMovementCoordinates(entity.rawAttributes);
      if (!coordinates) {
        return;
      }
      const rawAttributes = entity.rawAttributes ?? {};
      const friendlyName = toTrimmedString(rawAttributes.friendly_name) ?? entityId;
      const stateLabel = toTrimmedString(entity.stateLabel ?? entity.state);
      const timestampMs = toTimestampMs(rawAttributes.__last_changed) ?? Date.now();
      basePoints.push({
        id: `${entityId}-${timestampMs}`,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        label: friendlyName,
        zoneLabel: formatMovementLocationLabel(stateLabel),
        timestampLabel: formatMovementDateTime(timestampMs),
        timestampMs,
        isCurrent: isCurrent === true,
      });
    };

    if (selectedPersonEntityId) {
      pushPoint(selectedPersonEntityId, true);
    }
    trackerEntityIds.forEach((entityId) => pushPoint(entityId));

    const dedupedPoints = basePoints
      .sort((first, second) => second.timestampMs - first.timestampMs)
      .filter((entry, index, source) => source.findIndex((candidate) => candidate.id === entry.id) === index)
      .slice(0, PROFILE_MOVEMENT_MAX_ENTRIES);

    const baseTimeline: ProfileMovementTimelineEntry[] = dedupedPoints.map((point, index) => ({
      id: `current-${point.id}-${index}`,
      title: point.zoneLabel ? `Presenza: ${point.zoneLabel}` : 'Posizione corrente',
      subtitle: point.label,
      timestampLabel: point.timestampLabel,
      timestampMs: point.timestampMs,
      isCurrent: point.isCurrent,
    }));

    return {
      zoneLookup,
      trackedEntityIds: Array.from(trackedEntityIds),
      trackerDeviceCount: trackerEntityIds.size,
      basePoints: dedupedPoints,
      baseTimeline,
    };
  }, [haCurrentUser?.email, haCurrentUser?.id, haCurrentUser?.name, haCurrentUser?.username, haStates]);

  const haStatesForUi = useMemo<MockEntityStateMap>(() => {
    if (!isHaConnected) {
      return haStates;
    }

    let nextStates: MockEntityStateMap | null = null;
    const ensureNextStates = () => {
      if (!nextStates) {
        nextStates = { ...haStates };
      }
      return nextStates;
    };

    Object.entries(climatePendingByEntity).forEach(([entityId, pending]) => {
      if (!hasClimatePendingValues(pending)) {
        return;
      }
      const entity = haStates[entityId];
      if (!entity) {
        return;
      }

      const rawAttributes = { ...(entity.rawAttributes ?? {}) };
      let changed = false;
      let targetValue = entity.targetValue;
      let targetTempLow = entity.targetTempLow;
      let targetTempHigh = entity.targetTempHigh;
      let fanMode = entity.fanMode;
      let hasTargetPending = false;
      let hasFanPending = false;

      if (Number.isFinite(pending.targetTemp)) {
        targetValue = pending.targetTemp;
        rawAttributes.temperature = pending.targetTemp;
        changed = true;
        hasTargetPending = true;
      }
      if (Number.isFinite(pending.targetTempLow)) {
        targetTempLow = pending.targetTempLow;
        rawAttributes.target_temp_low = pending.targetTempLow;
        changed = true;
        hasTargetPending = true;
      }
      if (Number.isFinite(pending.targetTempHigh)) {
        targetTempHigh = pending.targetTempHigh;
        rawAttributes.target_temp_high = pending.targetTempHigh;
        changed = true;
        hasTargetPending = true;
      }
      const pendingFanMode = normalizeLower(pending.fanMode);
      if (pendingFanMode) {
        fanMode = pendingFanMode;
        rawAttributes.fan_mode = pendingFanMode;
        changed = true;
        hasFanPending = true;
      }
      if (hasTargetPending) {
        rawAttributes[CLIMATE_PENDING_TARGET_ATTRIBUTE_KEY] = true;
      }
      if (hasFanPending) {
        rawAttributes[CLIMATE_PENDING_FAN_ATTRIBUTE_KEY] = true;
      }
      if (!changed) {
        return;
      }

      ensureNextStates()[entityId] = {
        ...entity,
        targetValue,
        targetTempLow,
        targetTempHigh,
        fanMode,
        rawAttributes,
      };
    });

    Object.entries(coverPendingByEntity).forEach(([entityId, pending]) => {
      if (!hasCoverPendingValues(pending)) {
        return;
      }
      const entity = haStates[entityId];
      if (!entity) {
        return;
      }
      const rawAttributes = { ...(entity.rawAttributes ?? {}) };
      let changed = false;
      let stateValue = entity.state;
      let stateLabel = entity.stateLabel;

      const pendingState = normalizeCoverState(pending.state);
      if (pendingState && pendingState !== 'unknown') {
        stateValue = pendingState;
        stateLabel = pendingState;
        rawAttributes.state = pendingState;
        changed = true;
      }
      if (Number.isFinite(pending.position)) {
        rawAttributes.current_position = pending.position;
        rawAttributes.position = pending.position;
        changed = true;
      }
      if (Number.isFinite(pending.tiltPosition)) {
        rawAttributes.current_tilt_position = pending.tiltPosition;
        rawAttributes.tilt_position = pending.tiltPosition;
        rawAttributes[COVER_PENDING_TILT_ATTRIBUTE_KEY] = true;
        changed = true;
      }
      if (!changed) {
        return;
      }
      rawAttributes[COVER_PENDING_ATTRIBUTE_KEY] = true;

      ensureNextStates()[entityId] = {
        ...entity,
        state: stateValue,
        stateLabel,
        rawAttributes,
      };
    });

    Object.entries(lightColorPendingByEntity).forEach(([entityId, pending]) => {
      const entity = haStates[entityId];
      if (!entity) {
        return;
      }
      const rawAttributes = { ...(entity.rawAttributes ?? {}) };
      const nextHsColor: [number, number] = [pending.hsColor[0], pending.hsColor[1]];
      const nextColorMode = entity.colorMode ?? entity.color_mode ?? 'hs';
      rawAttributes.hs_color = nextHsColor;
      rawAttributes.color_mode = nextColorMode;

      ensureNextStates()[entityId] = {
        ...entity,
        state: entity.state === 'off' ? 'on' : entity.state,
        toggleOn: true,
        hsColor: nextHsColor,
        hs_color: nextHsColor,
        colorMode: nextColorMode,
        color_mode: nextColorMode,
        rawAttributes,
      };
    });

    return nextStates ?? haStates;
  }, [climatePendingByEntity, coverPendingByEntity, haStates, isHaConnected, lightColorPendingByEntity]);
  const initialLayoutRef = useRef(loadDashboardLayout());
  const [widgets, setWidgets] = useState<Widget[]>(() => initialLayoutRef.current.widgets);
  const [sections, setSections] = useState<DashboardSection[]>(() => initialLayoutRef.current.sections);
  const weatherConfigSection = useMemo(() => {
    const greetingWithWeather = sections.find(
      (section) => section.kind === 'greeting' && (section.showWeather ?? false),
    );
    if (greetingWithWeather) {
      return greetingWithWeather;
    }
    return sections.find((section) => section.kind === 'weather') ?? null;
  }, [sections]);
  const weatherEntityId = useMemo(
    () => weatherConfigSection?.weatherEntityId?.trim() || undefined,
    [weatherConfigSection],
  );
  const weatherForecastType = useMemo(
    () => weatherConfigSection?.weatherForecastType ?? 'daily',
    [weatherConfigSection],
  );
  const { state, actions } = useDashboardState({
    haStates: haStatesForUi,
    haStatus,
    weatherEntityId,
    weatherForecastType,
    haCallApi: callHaApi,
  });
  const [activeDevice, setActiveDevice] = useState<ActiveDevice | null>(null);
  const [sensorHistoryByEntity, setSensorHistoryByEntity] = useState<Record<string, number[]>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isXsViewport, setIsXsViewport] = useState(isXsViewportNow);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSidebarPathId, setSelectedSidebarPathId] = useState<string | null>(null);
  const [runningSceneBySectionId, setRunningSceneBySectionId] = useState<Partial<Record<string, SceneRunState>>>({});
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editConfirm, setEditConfirm] = useState<'enter' | 'exit' | 'refresh' | null>(null);
  const [isConsumptionView, setIsConsumptionView] = useState(resolveConsumptionFromLocation);
  const [isAutomationView, setIsAutomationView] = useState(resolveAutomationFromLocation);
  const [isAppGalleryView, setIsAppGalleryView] = useState(resolveAppGalleryFromLocation);
  const [isSecurityView, setIsSecurityView] = useState(resolveSecurityFromLocation);
  const [isSecurityCamerasView, setIsSecurityCamerasView] = useState(resolveSecurityCamerasFromLocation);
  const [isEditAvailableForRoute, setIsEditAvailableForRoute] = useState(resolveEditAvailabilityFromLocation);
  const [selectedConsumptionCardId, setSelectedConsumptionCardId] = useState<ConsumptionCardId | null>('electricity');
  const [oauthFlowError, setOAuthFlowError] = useState<string | null>(null);
  const [isOAuthFlowBusy, setIsOAuthFlowBusy] = useState(false);
  const [pendingOAuthConnect, setPendingOAuthConnect] = useState(false);
  const [pendingStoredOAuthReconnectUrl, setPendingStoredOAuthReconnectUrl] = useState<string | null>(null);
  const [completedMainGuides, setCompletedMainGuides] = useState<Record<MainGuidedSetupKind, boolean>>(() => ({
    welcome: isOnboardingCompleted(MAIN_GUIDED_SETUP_STORAGE_KEYS.welcome),
    context: isOnboardingCompleted(MAIN_GUIDED_SETUP_STORAGE_KEYS.context),
  }));

  const nextWidgetIdRef = useRef(1);
  const nextSectionIdRef = useRef(1);
  const lightBrightnessDebounceRef = useRef<Record<string, number>>({});
  const climatePendingTimeoutRef = useRef<Record<string, number>>({});
  const climateSendDelayTimeoutRef = useRef<Record<string, number>>({});
  const climateQueuedCommandRef = useRef<Record<string, ClimateQueuedCommand>>({});
  const lightColorPendingTimeoutRef = useRef<Record<string, number>>({});
  const coverPendingTimeoutRef = useRef<Record<string, number>>({});
  const activityFetchSeqRef = useRef(0);
  const vacuumReturnToBaseTimeoutRef = useRef<Record<string, number>>({});
  const cameraPtzControlModeRef = useRef<'button' | 'service' | null>(null);
  const previousHaStatusRef = useRef<typeof haStatus | null>(null);
  const reconnectToastIdRef = useRef<string | null>(null);
  const reconnectInFlightRef = useRef(false);
  const hadSuccessfulConnectionRef = useRef(false);
  const sensorHistoryInFlightRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (isHaConnected) {
      return;
    }
    sensorHistoryInFlightRef.current = {};
    setSensorHistoryByEntity((current) => (Object.keys(current).length > 0 ? {} : current));
  }, [isHaConnected, haUrl]);

  useEffect(() => {
    const updateViewport = () => {
      const nextXs = isXsViewportNow();
      setIsXsViewport((current) => (current === nextXs ? current : nextXs));
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  const visibleSidebarPaths = sidebarPaths;
  const canToggleEditMode = isEditAvailableForRoute;

  useEffect(() => {
    const maxWidgetCustomIndex = widgets.reduce((max, widget) => {
      const match = /\.custom_(\d+)$/.exec(widget.id);
      if (!match) {
        return max;
      }
      const parsed = Number.parseInt(match[1], 10);
      return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
    }, 0);
    nextWidgetIdRef.current = Math.max(nextWidgetIdRef.current, maxWidgetCustomIndex + 1);

    const maxSectionIndex = sections.reduce((max, section) => {
      const match = /^section-[a-z-]+-(\d+)$/.exec(section.id);
      if (!match) {
        return max;
      }
      const parsed = Number.parseInt(match[1], 10);
      return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
    }, 0);
    nextSectionIdRef.current = Math.max(nextSectionIdRef.current, maxSectionIndex + 1);
  }, [sections, widgets]);

  const selectedWidget = useMemo(
    () => widgets.find((widget) => widget.id === selectedWidgetId) ?? null,
    [widgets, selectedWidgetId],
  );

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) ?? null,
    [sections, selectedSectionId],
  );

  const selectedSidebarPath = useMemo(
    () => visibleSidebarPaths.find((entry) => entry.id === selectedSidebarPathId) ?? null,
    [selectedSidebarPathId, visibleSidebarPaths],
  );
  const LIGHT_BRIGHTNESS_DEBOUNCE_MS = 120;
  const LIGHT_WIDGET_HEIGHT_OFF = 1;
  const LIGHT_WIDGET_HEIGHT_ON = 2;
  const CLIMATE_WIDGET_WIDTH = 2;
  const CLIMATE_WIDGET_HEIGHT = 2;
  const CAMERA_WIDGET_MIN_HEIGHT = 3;
  const MEDIA_WIDGET_MIN_WIDTH = 3;
  const MEDIA_WIDGET_MIN_HEIGHT = 3;
  const VACUUM_WIDGET_MIN_WIDTH = 2;
  const VACUUM_WIDGET_MIN_HEIGHT = 3;
  const COVER_WIDGET_MIN_WIDTH = 2;
  const COVER_WIDGET_MIN_HEIGHT = 2;
  const isStackSection = (section: DashboardSection) =>
    section.kind === 'stack-vertical' || section.kind === 'stack-horizontal' || section.kind === 'stack-grid';
  const firstStackSectionId = useMemo(
    () => sections.find((section) => isStackSection(section))?.id ?? null,
    [sections],
  );
  const resolveStackColumns = (section: DashboardSection) => {
    if (section.kind === 'stack-vertical') {
      return 1;
    }
    if (section.kind === 'stack-grid') {
      // Keep stack-grid canonical layout wide, then adapt per runtime breakpoint in StackGrid.
      return ROOT_CANVAS_COLS;
    }
    return Math.max(1, Math.round(section.layout.w));
  };
  const normalizeLayoutForStack = (section: DashboardSection, layout: GridItem): GridItem => {
    const cols = resolveStackColumns(section);
    let next = {
      i: layout.i,
      x: Math.max(0, Math.round(layout.x)),
      y: Math.max(0, Math.round(layout.y)),
      w: Math.max(1, Math.round(layout.w)),
      h: Math.max(1, Math.round(layout.h)),
    };

    if (section.kind === 'stack-vertical') {
      next = {
        ...next,
        x: 0,
        w: 1,
      };
    }

    if (section.kind === 'stack-horizontal') {
      next = {
        ...next,
        h: 1,
      };
    }

    if (section.kind !== 'stack-vertical') {
      const safeW = Math.min(next.w, cols);
      const maxX = Math.max(0, cols - safeW);
      next = {
        ...next,
        w: safeW,
        x: Math.min(next.x, maxX),
      };
    }

    return next;
  };
  const normalizeRootLayout = (layout: GridItem): GridItem => {
    const safeW = Math.min(ROOT_CANVAS_COLS, Math.max(1, Math.round(layout.w)));
    const maxX = Math.max(0, ROOT_CANVAS_COLS - safeW);
    return {
      i: layout.i,
      x: Math.min(Math.max(0, Math.round(layout.x)), maxX),
      y: Math.max(0, Math.round(layout.y)),
      w: safeW,
      h: Math.max(1, Math.round(layout.h)),
    };
  };
  const resolveFixedWeatherSectionSpan = (section: DashboardSection): { w: number; h: number } | null => {
    if (section.kind !== 'weather') {
      return null;
    }
    const layoutMode = section.weatherLayout ?? 'auto';
    if (layoutMode === 'chip') {
      return { w: WEATHER_SECTION_CHIP_COLS, h: WEATHER_SECTION_CHIP_ROWS };
    }
    if (layoutMode === 'card') {
      return { w: WEATHER_SECTION_CARD_COLS, h: WEATHER_SECTION_CARD_ROWS };
    }
    return null;
  };
  const resolveSectionMinHeight = (section: DashboardSection) => {
    if (section.kind === 'greeting') {
      if (section.showWeather ?? false) {
        return WEATHER_SECTION_CARD_ROWS;
      }
      return GREETING_SECTION_ROWS;
    }
    if (section.kind === 'weather') {
      return WEATHER_SECTION_BASE_ROWS;
    }
    if (section.kind === 'scenes') {
      return SCENES_SECTION_ROWS;
    }
    return ROOT_CANVAS_ROW_UNITS * 2;
  };
  const resolveSectionMinWidth = (section: DashboardSection) => {
    if (section.kind === 'greeting' && (section.showWeather ?? false)) {
      return ROOT_CANVAS_COLS;
    }
    if (section.kind === 'weather') {
      return WEATHER_SECTION_CHIP_COLS;
    }
    return 2;
  };
  const haFavoriteEntityIdLookup = useMemo(() => new Set(haFavoriteEntityIds), [haFavoriteEntityIds]);
  const isWidgetMarkedFavorite = (widget: Widget) => {
    if (isHaConnected && haFavoriteLabelDetected) {
      return haFavoriteEntityIdLookup.has(widget.entityId);
    }
    return widget.isFavorite !== false;
  };
  const favoriteGridSections = useMemo(
    () =>
      sections.filter(
        (section) => section.kind === 'stack-grid' && (section.stackUseFavoritesGrid ?? false),
      ),
    [sections],
  );
  const normalizeSectionRootLayout = (section: DashboardSection, layout: GridItem): GridItem => {
    if (section.kind === 'greeting' && (section.showWeather ?? false)) {
      return {
        i: section.id,
        x: 0,
        y: Math.max(0, Math.round(layout.y)),
        w: ROOT_CANVAS_COLS,
        h: WEATHER_SECTION_CARD_ROWS,
      };
    }
    const fixedWeatherSpan = resolveFixedWeatherSectionSpan(section);
    const safeW = fixedWeatherSpan
      ? Math.min(ROOT_CANVAS_COLS, fixedWeatherSpan.w)
      : Math.min(ROOT_CANVAS_COLS, Math.max(resolveSectionMinWidth(section), Math.round(layout.w)));
    const maxX = Math.max(0, ROOT_CANVAS_COLS - safeW);
    return {
      i: section.id,
      x: Math.min(Math.max(0, Math.round(layout.x)), maxX),
      y: Math.max(0, Math.round(layout.y)),
      w: safeW,
      h: fixedWeatherSpan ? fixedWeatherSpan.h : Math.max(resolveSectionMinHeight(section), Math.round(layout.h)),
    };
  };
  const normalizeWidgetLayout = (widget: Widget, layout: GridItem): GridItem => {
    if (!widget.parentSectionId) {
      return normalizeRootLayout(layout);
    }
    const parentSection = sections.find((section) => section.id === widget.parentSectionId);
    if (!parentSection || !isStackSection(parentSection)) {
      return normalizeRootLayout(layout);
    }
    return normalizeLayoutForStack(parentSection, layout);
  };
  const resolveLightHeightRows = (_widget: Widget, nextIsOn: boolean) =>
    nextIsOn ? LIGHT_WIDGET_HEIGHT_ON : LIGHT_WIDGET_HEIGHT_OFF;
  const toWidgetLayoutRows = (_widget: Widget, rows: number) => rows;
  const resolveWidgetMinimumLayout = (
    widget: Widget,
    minWidth: number,
    minHeight: number,
  ): GridItem =>
    normalizeWidgetLayout(widget, {
      i: widget.id,
      x: widget.layout.x,
      y: widget.layout.y,
      w: Math.max(minWidth, Math.round(widget.layout.w)),
      h: Math.max(minHeight, Math.round(widget.layout.h)),
    });
  const resolveLightLayoutForState = (widget: Widget, nextIsOn: boolean): GridItem => {
    const nextHeight = resolveLightHeightRows(widget, nextIsOn);
    return normalizeWidgetLayout(widget, {
      i: widget.id,
      x: widget.layout.x,
      y: widget.layout.y,
      w: Math.max(2, Math.round(widget.layout.w)),
      h: nextHeight,
    });
  };
  const resolveClimateWidth = (widget: Widget) => {
    const parentSection =
      widget.parentSectionId ? sections.find((section) => section.id === widget.parentSectionId) : undefined;
    if (parentSection?.kind === 'stack-vertical') {
      return 1;
    }
    return Math.max(1, Math.round(widget.layout.w));
  };
  const resolveClimateHeight = (widget: Widget) => {
    return Math.max(CLIMATE_WIDGET_HEIGHT, Math.round(widget.layout.h));
  };
  const resolveClimateLayout = (widget: Widget): GridItem =>
    normalizeWidgetLayout(widget, {
      i: widget.id,
      x: widget.layout.x,
      y: widget.layout.y,
      w: resolveClimateWidth(widget),
      h: resolveClimateHeight(widget),
    });
  const resolveMediaLayout = (widget: Widget): GridItem =>
    resolveWidgetMinimumLayout(
      widget,
      MEDIA_WIDGET_MIN_WIDTH,
      toWidgetLayoutRows(widget, MEDIA_WIDGET_MIN_HEIGHT),
    );
  const resolveAlarmLayout = (widget: Widget): GridItem =>
    resolveWidgetMinimumLayout(widget, 1, 1);
  const resolveCameraLayout = (widget: Widget): GridItem =>
    resolveWidgetMinimumLayout(
      widget,
      1,
      toWidgetLayoutRows(widget, CAMERA_WIDGET_MIN_HEIGHT),
    );
  const resolveSensorLayout = (widget: Widget): GridItem =>
    resolveWidgetMinimumLayout(widget, 1, toWidgetLayoutRows(widget, 1));
  const resolveVacuumLayout = (widget: Widget): GridItem =>
    resolveWidgetMinimumLayout(widget, VACUUM_WIDGET_MIN_WIDTH, VACUUM_WIDGET_MIN_HEIGHT);
  const resolveCoverLayout = (widget: Widget): GridItem =>
    resolveWidgetMinimumLayout(widget, 1, 2);
  const resolveLockLayout = (widget: Widget): GridItem =>
    resolveWidgetMinimumLayout(widget, 1, toWidgetLayoutRows(widget, 1));
  const resolveWidgetLayoutByKind = (widget: Widget, nextLayout: GridItem): GridItem => {
    const draftWidget: Widget = {
      ...widget,
      layout: nextLayout,
    };
    if (widget.kind === 'light') {
      return resolveLightLayoutForState(draftWidget, widget.isOn);
    }
    if (widget.kind === 'climate') {
      return resolveClimateLayout(draftWidget);
    }
    if (widget.kind === 'media') {
      return resolveMediaLayout(draftWidget);
    }
    if (widget.kind === 'camera') {
      return resolveCameraLayout(draftWidget);
    }
    if (widget.kind === 'sensor') {
      return resolveSensorLayout(draftWidget);
    }
    if (widget.kind === 'alarm') {
      return resolveAlarmLayout(draftWidget);
    }
    if (widget.kind === 'vacuum') {
      return resolveVacuumLayout(draftWidget);
    }
    if (widget.kind === 'cover') {
      return resolveCoverLayout(draftWidget);
    }
    if (widget.kind === 'lock') {
      return resolveLockLayout(draftWidget);
    }
    return normalizeWidgetLayout(draftWidget, nextLayout);
  };
  const sameLayout = (a: GridItem, b: GridItem) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
  const layoutExpandsFootprint = (previous: GridItem, next: GridItem) =>
    next.w > previous.w ||
    next.h > previous.h ||
    next.x + next.w > previous.x + previous.w ||
    next.y + next.h > previous.y + previous.h;
  const intersects = (a: Pick<GridItem, 'x' | 'y' | 'w' | 'h'>, b: Pick<GridItem, 'x' | 'y' | 'w' | 'h'>) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const findFirstFreePosition = (
    occupied: Array<Pick<GridItem, 'x' | 'y' | 'w' | 'h'>>,
    cols: number,
    width: number,
    height: number,
  ) => {
    const w = Math.min(Math.max(1, width), cols);
    const h = Math.max(1, height);
    const maxBottom = occupied.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    const searchLimit = maxBottom + 40;

    for (let y = 0; y <= searchLimit; y += 1) {
      for (let x = 0; x <= cols - w; x += 1) {
        const candidate = { x, y, w, h };
        const hasCollision = occupied.some((item) => intersects(candidate, item));
        if (!hasCollision) {
          return { x, y };
        }
      }
    }

    return { x: 0, y: maxBottom };
  };
  const compactLayoutsUp = (layouts: GridItem[], cols: number): GridItem[] => {
    const placed: GridItem[] = [];
    const ordered = [...layouts].sort((first, second) => {
      const firstY = Math.max(0, Math.round(first.y));
      const secondY = Math.max(0, Math.round(second.y));
      if (firstY !== secondY) {
        return firstY - secondY;
      }
      const firstX = Math.max(0, Math.round(first.x));
      const secondX = Math.max(0, Math.round(second.x));
      if (firstX !== secondX) {
        return firstX - secondX;
      }
      return first.i.localeCompare(second.i, 'it-IT');
    });

    ordered.forEach((item) => {
      const safeW = Math.min(cols, Math.max(1, Math.round(item.w)));
      const safeX = Math.min(Math.max(0, Math.round(item.x)), Math.max(0, cols - safeW));
      let safeY = Math.max(0, Math.round(item.y));
      const safeH = Math.max(1, Math.round(item.h));

      while (safeY > 0) {
        const candidate = { x: safeX, y: safeY - 1, w: safeW, h: safeH };
        if (placed.some((layout) => intersects(candidate, layout))) {
          break;
        }
        safeY -= 1;
      }

      placed.push({
        i: item.i,
        x: safeX,
        y: safeY,
        w: safeW,
        h: safeH,
      });
    });

    return placed;
  };
  const pushLayoutsDownFromAnchor = (layouts: GridItem[], anchorId: string, cols: number): GridItem[] => {
    const safeCols = Math.max(1, Math.round(cols));
    const normalizeForCols = (item: GridItem): GridItem => {
      const safeW = Math.min(safeCols, Math.max(1, Math.round(item.w)));
      return {
        i: item.i,
        x: Math.min(Math.max(0, Math.round(item.x)), Math.max(0, safeCols - safeW)),
        y: Math.max(0, Math.round(item.y)),
        w: safeW,
        h: Math.max(1, Math.round(item.h)),
      };
    };
    const anchor = layouts.find((item) => item.i === anchorId);
    if (!anchor) {
      return layouts;
    }

    const anchorLayout = normalizeForCols(anchor);
    const placed: GridItem[] = [anchorLayout];
    const ordered = layouts
      .filter((item) => item.i !== anchorId)
      .map(normalizeForCols)
      .sort((first, second) => {
        if (first.y !== second.y) {
          return first.y - second.y;
        }
        if (first.x !== second.x) {
          return first.x - second.x;
        }
        return first.i.localeCompare(second.i, 'it-IT');
      });

    ordered.forEach((item) => {
      let candidate: GridItem = { ...item };
      let collision = placed.find((layout) => intersects(candidate, layout));
      while (collision) {
        candidate = {
          ...candidate,
          y: Math.max(candidate.y + 1, collision.y + collision.h),
        };
        collision = placed.find((layout) => intersects(candidate, layout));
      }
      placed.push(candidate);
    });

    const placedById = new Map(placed.map((layout) => [layout.i, layout]));
    return layouts.map((item) => placedById.get(item.i) ?? item);
  };
  const compactRootCanvasLayout = (
    nextSections: DashboardSection[],
    nextWidgets: Widget[],
  ): { sections: DashboardSection[]; widgets: Widget[] } => {
    const rootWidgets = nextWidgets.filter((widget) => !widget.parentSectionId);
    const rootLayouts = [
      ...nextSections.map((section) => normalizeSectionRootLayout(section, section.layout)),
      ...rootWidgets.map((widget) => resolveWidgetLayoutByKind(widget, normalizeRootLayout(widget.layout))),
    ];
    const compactedLayoutMap = new Map(
      compactLayoutsUp(rootLayouts, ROOT_CANVAS_COLS).map((layout) => [layout.i, layout]),
    );

    return {
      sections: nextSections.map((section) => {
        const layout = compactedLayoutMap.get(section.id);
        if (!layout) {
          return section;
        }
        const normalizedLayout = normalizeSectionRootLayout(section, layout);
        return sameLayout(section.layout, normalizedLayout)
          ? section
          : {
              ...section,
              layout: normalizedLayout,
            };
      }),
      widgets: nextWidgets.map((widget) => {
        if (widget.parentSectionId) {
          return widget;
        }
        const layout = compactedLayoutMap.get(widget.id);
        if (!layout) {
          return widget;
        }
        const normalizedLayout = resolveWidgetLayoutByKind(widget, normalizeRootLayout(layout));
        return sameLayout(widget.layout, normalizedLayout)
          ? widget
          : {
              ...widget,
              layout: normalizedLayout,
            };
      }),
    };
  };
  const compactStackSectionLayout = (section: DashboardSection, nextWidgets: Widget[]): Widget[] => {
    const stackWidgets = nextWidgets.filter((widget) => widget.parentSectionId === section.id);
    if (!stackWidgets.length) {
      return nextWidgets;
    }

    if (section.kind === 'stack-horizontal') {
      const ordered = [...stackWidgets].sort((first, second) => {
        const firstX = Math.max(0, Math.round(first.layout.x));
        const secondX = Math.max(0, Math.round(second.layout.x));
        if (firstX !== secondX) {
          return firstX - secondX;
        }
        return first.id.localeCompare(second.id, 'it-IT');
      });
      const compactedById = new Map(
        ordered.map((widget, index) => [
          widget.id,
          resolveWidgetLayoutByKind(widget, normalizeLayoutForStack(section, {
            i: widget.id,
            x: index,
            y: 0,
            w: 1,
            h: 1,
          })),
        ]),
      );
      return nextWidgets.map((widget) => {
        const layout = compactedById.get(widget.id);
        return layout && !sameLayout(widget.layout, layout)
          ? {
              ...widget,
              layout,
            }
          : widget;
      });
    }

    const compactedLayoutMap = new Map(
      compactLayoutsUp(
        stackWidgets.map((widget) =>
          resolveWidgetLayoutByKind(widget, normalizeLayoutForStack(section, widget.layout)),
        ),
        resolveStackColumns(section),
      ).map((layout) => [layout.i, layout]),
    );

    return nextWidgets.map((widget) => {
      if (widget.parentSectionId !== section.id) {
        return widget;
      }
      const layout = compactedLayoutMap.get(widget.id);
      if (!layout) {
        return widget;
      }
      const normalizedLayout = resolveWidgetLayoutByKind(widget, normalizeLayoutForStack(section, layout));
      return sameLayout(widget.layout, normalizedLayout)
        ? widget
        : {
            ...widget,
          layout: normalizedLayout,
        };
    });
  };
  const pushRootCanvasLayoutDown = (
    nextSections: DashboardSection[],
    nextWidgets: Widget[],
    anchorWidgetId: string,
  ): { sections: DashboardSection[]; widgets: Widget[] } => {
    const rootWidgets = nextWidgets.filter((widget) => !widget.parentSectionId);
    const rootLayouts = [
      ...nextSections.map((section) => normalizeSectionRootLayout(section, section.layout)),
      ...rootWidgets.map((widget) => resolveWidgetLayoutByKind(widget, normalizeRootLayout(widget.layout))),
    ];
    const pushedLayoutMap = new Map(
      pushLayoutsDownFromAnchor(rootLayouts, anchorWidgetId, ROOT_CANVAS_COLS).map((layout) => [layout.i, layout]),
    );

    return {
      sections: nextSections.map((section) => {
        const layout = pushedLayoutMap.get(section.id);
        if (!layout) {
          return section;
        }
        const normalizedLayout = normalizeSectionRootLayout(section, layout);
        return sameLayout(section.layout, normalizedLayout)
          ? section
          : {
              ...section,
              layout: normalizedLayout,
            };
      }),
      widgets: nextWidgets.map((widget) => {
        if (widget.parentSectionId) {
          return widget;
        }
        const layout = pushedLayoutMap.get(widget.id);
        if (!layout) {
          return widget;
        }
        const normalizedLayout = resolveWidgetLayoutByKind(widget, normalizeRootLayout(layout));
        return sameLayout(widget.layout, normalizedLayout)
          ? widget
          : {
              ...widget,
              layout: normalizedLayout,
            };
      }),
    };
  };
  const pushStackSectionLayoutDown = (
    section: DashboardSection,
    nextWidgets: Widget[],
    anchorWidgetId: string,
  ): Widget[] => {
    const stackWidgets = nextWidgets.filter((widget) => widget.parentSectionId === section.id);
    if (!stackWidgets.length) {
      return nextWidgets;
    }

    const pushedLayoutMap = new Map(
      pushLayoutsDownFromAnchor(
        stackWidgets.map((widget) =>
          resolveWidgetLayoutByKind(widget, normalizeLayoutForStack(section, widget.layout)),
        ),
        anchorWidgetId,
        resolveStackColumns(section),
      ).map((layout) => [layout.i, layout]),
    );

    return nextWidgets.map((widget) => {
      if (widget.parentSectionId !== section.id) {
        return widget;
      }
      const layout = pushedLayoutMap.get(widget.id);
      if (!layout) {
        return widget;
      }
      const normalizedLayout = resolveWidgetLayoutByKind(widget, normalizeLayoutForStack(section, layout));
      return sameLayout(widget.layout, normalizedLayout)
        ? widget
        : {
            ...widget,
            layout: normalizedLayout,
          };
    });
  };
  useEffect(() => {
    if (!favoriteGridSections.length) {
      return;
    }

    const favoriteSectionById = new Map(favoriteGridSections.map((section) => [section.id, section]));
    const fallbackSection = favoriteGridSections[0];
    const autoCreateFromHaLabels =
      isHaConnected && haFavoriteLabelDetected && haFavoriteEntityIdLookup.size > 0;

    setWidgets((prev) => {
      let changed = false;
      const occupiedBySection = new Map<string, Array<Pick<GridItem, 'x' | 'y' | 'w' | 'h'>>>();

      const next = prev.map((widget) => {
        const currentParentId = widget.parentSectionId;
        const isMovingFromRoot = !currentParentId;
        const targetSectionId =
          currentParentId && favoriteSectionById.has(currentParentId)
            ? currentParentId
            : isMovingFromRoot && isWidgetMarkedFavorite(widget)
              ? fallbackSection.id
              : null;

        if (!targetSectionId) {
          return widget;
        }

        const targetSection = favoriteSectionById.get(targetSectionId);
        if (!targetSection) {
          return widget;
        }

        const sectionOccupied = occupiedBySection.get(targetSectionId) ?? [];
        const normalizedSeed = normalizeLayoutForStack(targetSection, {
          i: widget.id,
          x: widget.layout.x,
          y: widget.layout.y,
          w: Math.max(1, Math.round(widget.layout.w)),
          h: Math.max(1, Math.round(widget.layout.h)),
        });
        const hasCollision = sectionOccupied.some((item) =>
          intersects(
            {
              x: normalizedSeed.x,
              y: normalizedSeed.y,
              w: normalizedSeed.w,
              h: normalizedSeed.h,
            },
            item,
          ),
        );

        let resolvedLayout = normalizedSeed;
        if (currentParentId !== targetSectionId || hasCollision) {
          const stackCols = resolveStackColumns(targetSection);
          const nextPosition = findFirstFreePosition(
            sectionOccupied,
            stackCols,
            normalizedSeed.w,
            normalizedSeed.h,
          );
          resolvedLayout = normalizeLayoutForStack(targetSection, {
            ...normalizedSeed,
            x: nextPosition.x,
            y: nextPosition.y,
          });
        }

        sectionOccupied.push({
          x: resolvedLayout.x,
          y: resolvedLayout.y,
          w: resolvedLayout.w,
          h: resolvedLayout.h,
        });
        occupiedBySection.set(targetSectionId, sectionOccupied);

        const parentChanged = currentParentId !== targetSectionId;
        const layoutChanged = !sameLayout(widget.layout, resolvedLayout);
        if (!parentChanged && !layoutChanged) {
          return widget;
        }

        changed = true;
        return {
          ...widget,
          parentSectionId: targetSectionId,
          layout: resolvedLayout,
        };
      });

      const nextAfterMoves = changed ? next : prev;
      if (!autoCreateFromHaLabels) {
        return nextAfterMoves;
      }

      const targetSection = favoriteSectionById.get(fallbackSection.id) ?? fallbackSection;
      const stackCols = resolveStackColumns(targetSection);
      const existingFavoriteEntityIds = new Set(
        nextAfterMoves
          .filter((widget) => widget.parentSectionId === targetSection.id)
          .map((widget) => widget.entityId),
      );
      const sectionOccupied =
        occupiedBySection.get(targetSection.id) ??
        nextAfterMoves
          .filter((widget) => widget.parentSectionId === targetSection.id)
          .map((widget) => ({
            x: widget.layout.x,
            y: widget.layout.y,
            w: widget.layout.w,
            h: widget.layout.h,
          }));
      occupiedBySection.set(targetSection.id, sectionOccupied);

      const sortedFavoriteEntityIds = Array.from(haFavoriteEntityIdLookup).sort((first, second) =>
        first.localeCompare(second, 'it-IT'),
      );
      const additions: Widget[] = [];

      sortedFavoriteEntityIds.forEach((entityId) => {
        if (existingFavoriteEntityIds.has(entityId)) {
          return;
        }
        const kind = resolveWidgetKindFromEntityId(entityId);
        if (!kind) {
          return;
        }

        const liveEntity = haStatesForUi[entityId];
        const friendlyName =
          typeof liveEntity?.rawAttributes?.friendly_name === 'string'
            ? liveEntity.rawAttributes.friendly_name.trim()
            : '';
        const title = friendlyName || fallbackTitleFromEntityId(entityId) || entityId;
        const widgetWidth =
          kind === 'climate'
            ? CLIMATE_WIDGET_WIDTH
            : kind === 'sensor' || kind === 'lock'
              ? 1
              : kind === 'media'
                ? MEDIA_WIDGET_MIN_WIDTH
                : kind === 'vacuum'
                  ? VACUUM_WIDGET_MIN_WIDTH
                  : kind === 'cover'
                    ? COVER_WIDGET_MIN_WIDTH
                    : 2;
        const widgetBaseHeight =
          kind === 'climate'
            ? CLIMATE_WIDGET_HEIGHT
            : kind === 'light'
              ? LIGHT_WIDGET_HEIGHT_OFF
            : kind === 'sensor' || kind === 'lock'
              ? 1
              : kind === 'camera'
                ? CAMERA_WIDGET_MIN_HEIGHT
                : kind === 'vacuum'
                  ? VACUUM_WIDGET_MIN_HEIGHT
                  : kind === 'cover'
                    ? COVER_WIDGET_MIN_HEIGHT
              : kind === 'media'
                ? MEDIA_WIDGET_MIN_HEIGHT
                : 1;
        const normalizedSeed = normalizeLayoutForStack(targetSection, {
          i: entityId,
          x: 0,
          y: 0,
          w: widgetWidth,
          h: widgetBaseHeight,
        });
        const nextPosition = findFirstFreePosition(
          sectionOccupied,
          stackCols,
          normalizedSeed.w,
          normalizedSeed.h,
        );
        const normalizedLayout = normalizeLayoutForStack(targetSection, {
          ...normalizedSeed,
          x: nextPosition.x,
          y: nextPosition.y,
        });
        const id = `${kind}.custom_${nextWidgetIdRef.current++}`;

        const newWidget: Widget = {
          id,
          kind,
          title,
          entityId,
          isFavorite: true,
          status:
            kind === 'media'
              ? 'paused'
              : kind === 'alarm'
                ? 'disarmed'
                : kind === 'vacuum'
                  ? 'docked'
                  : kind === 'lock'
                    ? 'locked'
                    : kind === 'cover'
                      ? 'open'
                      : 'Idle',
          isOn: kind === 'lock' || kind === 'cover',
          value:
            kind === 'sensor' ? 40 : kind === 'climate' ? 23 : kind === 'vacuum' ? 100 : kind === 'cover' ? 70 : 0,
          unit:
            kind === 'sensor' || kind === 'media' || kind === 'vacuum' || kind === 'cover'
              ? '%'
              : kind === 'climate'
                ? 'C'
                : kind === 'alarm' || kind === 'lock'
                  ? ''
                  : '%',
          parentSectionId: targetSection.id,
          layout: {
            ...normalizedLayout,
            i: id,
          },
        };

        additions.push(newWidget);
        existingFavoriteEntityIds.add(entityId);
        sectionOccupied.push({
          x: normalizedLayout.x,
          y: normalizedLayout.y,
          w: normalizedLayout.w,
          h: normalizedLayout.h,
        });
      });

      if (additions.length === 0) {
        return nextAfterMoves;
      }
      return [...nextAfterMoves, ...additions];
    });
  }, [favoriteGridSections, haFavoriteEntityIdLookup, haFavoriteLabelDetected, haStatesForUi, isHaConnected, widgets]);
  const weatherSection = weatherConfigSection;
  const haEntityIds = useMemo(() => Object.keys(haStates), [haStates]);
  const consumptionData = useMemo(
    () => createConsumptionDashboardData(consumptionConfig, haStates),
    [consumptionConfig, haStates],
  );
  const activeWidget = selectedWidget;
  const shouldShowWelcomeGuide = !completedMainGuides.welcome;
  const shouldShowContextGuide =
    !completedMainGuides.context &&
    !isEditMode &&
    !isConsumptionView &&
    !isAutomationView &&
    !isAppGalleryView &&
    Boolean(activeDevice);
  const activeMainGuideKind: MainGuidedSetupKind | null = shouldShowWelcomeGuide
    ? 'welcome'
    : shouldShowContextGuide
      ? 'context'
      : null;
  const activeMainGuide = activeMainGuideKind ? MAIN_GUIDED_SETUP_CONTENT[activeMainGuideKind] : null;

  const dismissActiveMainGuide = () => {
    if (!activeMainGuideKind) {
      return;
    }
    markOnboardingCompleted(MAIN_GUIDED_SETUP_STORAGE_KEYS[activeMainGuideKind]);
    setCompletedMainGuides((current) => ({
      ...current,
      [activeMainGuideKind]: true,
    }));
  };

  useEffect(() => {
    const previousStatus = previousHaStatusRef.current;
    const reconnectToastId = reconnectToastIdRef.current;

    if (haStatus === 'connecting') {
      const isReconnecting =
        previousStatus === 'connected' ||
        previousStatus === 'error' ||
        (previousStatus === 'disconnected' && hadSuccessfulConnectionRef.current);

      if (isReconnecting) {
        reconnectInFlightRef.current = true;
        if (reconnectToastId) {
          removeNotification(reconnectToastId);
        }
        reconnectToastIdRef.current = addNotification('warning', 'Riconnessione Home Assistant in corso...');
      }
    }

    if (haStatus === 'connected') {
      hadSuccessfulConnectionRef.current = true;
      if (reconnectToastId) {
        removeNotification(reconnectToastId);
        reconnectToastIdRef.current = null;
      }
      if (reconnectInFlightRef.current) {
        addNotification('info', 'Home Assistant riconnesso con successo.');
        reconnectInFlightRef.current = false;
      }
    }

    if (haStatus === 'error') {
      if (reconnectToastId) {
        removeNotification(reconnectToastId);
        reconnectToastIdRef.current = null;
      }
      if (reconnectInFlightRef.current) {
        addNotification('alert', 'Riconnessione Home Assistant non riuscita.');
        reconnectInFlightRef.current = false;
      }
    }

    if (haStatus === 'disconnected' && reconnectToastId) {
      removeNotification(reconnectToastId);
      reconnectToastIdRef.current = null;
    }

    previousHaStatusRef.current = haStatus;
  }, [addNotification, haStatus, removeNotification]);

  const contextLamp = useMemo(() => {
    if (activeWidget?.kind !== 'light') {
      return state.lamp;
    }
    const liveEntity = isHaConnected ? haStatesForUi[activeWidget.entityId] : undefined;
    const capabilities = resolveLightCapabilities(liveEntity);
    return {
      name: activeWidget.title,
      isOn: typeof liveEntity?.toggleOn === 'boolean' ? liveEntity.toggleOn : activeWidget.isOn,
      brightness:
        typeof liveEntity?.brightness === 'number'
          ? liveEntity.brightness
          : activeWidget.value ?? state.lamp.brightness,
      status: liveEntity?.stateLabel ?? liveEntity?.state ?? activeWidget.status,
      hsColor: liveEntity?.hsColor ?? liveEntity?.hs_color ?? state.lamp.hsColor,
      colorTemp:
        typeof liveEntity?.colorTempKelvin === 'number'
          ? liveEntity.colorTempKelvin
          : liveEntity?.color_temp_kelvin ?? state.lamp.colorTemp,
      supportsBrightness: capabilities.supportsBrightness,
      supportsColorTemp: capabilities.supportsColorTemp,
      supportsColor: capabilities.supportsColor,
    };
  }, [activeWidget, haStatesForUi, isHaConnected, state.lamp]);

  const contextClimate = useMemo(() => {
    if (activeWidget?.kind !== 'climate') {
      return state.climate;
    }
    const liveEntity = isHaConnected ? haStatesForUi[activeWidget.entityId] : undefined;
    if (!liveEntity) {
      return {
        ...state.climate,
        name: activeWidget.title || state.climate.name,
        rawAttributes: {
          ...(state.climate.rawAttributes ?? {}),
          friendly_name: activeWidget.title || state.climate.name,
        },
      };
    }
    const rawAttributes = liveEntity?.rawAttributes;
    const hvacMode =
      toTrimmedString(liveEntity?.hvacMode) ??
      toTrimmedString(rawAttributes?.hvac_mode) ??
      toTrimmedString(liveEntity?.state) ??
      '';
    const hvacAction =
      toTrimmedString(liveEntity?.hvacAction) ??
      toTrimmedString(rawAttributes?.hvac_action) ??
      '';
    const hvacModes =
      Array.isArray(liveEntity?.hvacModes) && liveEntity.hvacModes.length > 0
        ? liveEntity.hvacModes
        : Array.isArray(rawAttributes?.hvac_modes)
          ? rawAttributes.hvac_modes.filter(
              (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
            )
          : [];
    const fanMode =
      toTrimmedString(liveEntity?.fanMode) ??
      toTrimmedString(rawAttributes?.fan_mode) ??
      '';
    const fanModes =
      Array.isArray(liveEntity?.fanModes) && liveEntity.fanModes.length > 0
        ? liveEntity.fanModes
        : Array.isArray(rawAttributes?.fan_modes)
          ? rawAttributes.fan_modes.filter(
              (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
            )
          : [];
    const minTemp =
      toFiniteNumber(liveEntity?.minTemp) ??
      toFiniteNumber(rawAttributes?.min_temp) ??
      Number.NaN;
    const maxTemp =
      toFiniteNumber(liveEntity?.maxTemp) ??
      toFiniteNumber(rawAttributes?.max_temp) ??
      Number.NaN;
    const targetTempStep =
      toFiniteNumber(liveEntity?.targetTempStep) ??
      toFiniteNumber(rawAttributes?.target_temp_step);
    const targetTempLow =
      toFiniteNumber(liveEntity?.targetTempLow) ??
      toFiniteNumber(rawAttributes?.target_temp_low);
    const targetTempHigh =
      toFiniteNumber(liveEntity?.targetTempHigh) ??
      toFiniteNumber(rawAttributes?.target_temp_high);
    const currentTempFromAttributes =
      toFiniteNumber(rawAttributes?.current_temperature) ?? toFiniteNumber(rawAttributes?.temperature);
    const currentTemp =
      typeof liveEntity?.currentValue === 'number'
        ? liveEntity.currentValue
        : currentTempFromAttributes ?? Number.NaN;
    const targetTemp =
      typeof liveEntity?.targetValue === 'number'
        ? liveEntity.targetValue
        : toFiniteNumber(rawAttributes?.temperature) ?? Number.NaN;
    const isOn =
      hvacMode !== undefined
        ? hvacMode.toLowerCase() !== 'off'
        : typeof liveEntity?.state === 'string'
          ? liveEntity.state !== 'off'
          : false;
    return {
      name:
        toTrimmedString(rawAttributes?.friendly_name) ??
        activeWidget.title,
      mode: hvacMode,
      isOn,
      status: hvacAction || liveEntity?.stateLabel || liveEntity?.state || '',
      currentTemp,
      targetTemp,
      minTemp,
      maxTemp,
      targetTempLow,
      targetTempHigh,
      targetTempStep,
      hvacModes,
      hvacAction,
      fanMode,
      fanModes,
      temperatureUnit:
        toTrimmedString(liveEntity?.unit) ??
        toTrimmedString(rawAttributes?.temperature_unit) ??
        '',
      rawAttributes,
    };
  }, [activeWidget, haStatesForUi, isHaConnected, state.climate]);

  const cameraPtzServiceTarget = useMemo(
    () => resolveCameraPtzServiceTarget(haServiceRegistry),
    [haServiceRegistry],
  );

  const cameraPtzButtons = useMemo<CameraPtzButtonMap>(() => {
    if (!isHaConnected || activeWidget?.kind !== 'camera') {
      return {};
    }
    const liveEntity = haStatesForUi[activeWidget.entityId];
    const rawAttributes = liveEntity?.rawAttributes;
    const cameraEntityId =
      toTrimmedString(rawAttributes?.camera_entity_id) ??
      toTrimmedString(rawAttributes?.entity_id) ??
      activeWidget.entityId;
    const cameraFriendlyName =
      toTrimmedString(rawAttributes?.friendly_name) ??
      activeWidget.title;
    return resolveCameraPtzButtons(cameraEntityId, cameraFriendlyName, haStatesForUi);
  }, [activeWidget, haStatesForUi, isHaConnected]);

  const cameraHasPtzButtons = useMemo(
    () => hasAnyCameraPtzButton(cameraPtzButtons),
    [cameraPtzButtons],
  );

  const contextCamera = useMemo(() => {
    if (activeWidget?.kind !== 'camera') {
      return {
        name: 'Camera',
        status: 'Offline',
        entityId: undefined as string | undefined,
        streamUrl: undefined as string | undefined,
        snapshotUrl: undefined as string | undefined,
        isOffline: true,
        supportsPtz: false,
        rawAttributes: undefined as Record<string, unknown> | undefined,
      };
    }

    const liveEntity = isHaConnected ? haStatesForUi[activeWidget.entityId] : undefined;
    const rawAttributes = liveEntity?.rawAttributes;
    const stateValue = normalizeCameraState(
      toTrimmedString(liveEntity?.stateLabel) ??
        toTrimmedString(liveEntity?.state) ??
        activeWidget.status,
    );
    const isOffline = isCameraOfflineState(stateValue);
    const preview = resolveCameraPreviewUrls(liveEntity, activeWidget.entityId, haUrl);
    const cameraName =
      toTrimmedString(rawAttributes?.friendly_name) ??
      activeWidget.title;
    const cameraEntityId = preview.cameraEntityId ?? activeWidget.entityId;
    const derivedActivity = resolveCameraDerivedActivity(cameraEntityId, cameraName, haStatesForUi, haUrl);
    const mergedRawAttributes: Record<string, unknown> = {
      ...(rawAttributes ?? {}),
    };

    if (derivedActivity.eventLog.length > 0) {
      const existingEventLog = Array.isArray(mergedRawAttributes.event_log)
        ? (mergedRawAttributes.event_log as unknown[])
        : [];
      mergedRawAttributes.event_log = [...derivedActivity.eventLog, ...existingEventLog].slice(0, 20);
    }
    if (derivedActivity.motionDetected !== undefined && mergedRawAttributes.motion_detected === undefined) {
      mergedRawAttributes.motion_detected = derivedActivity.motionDetected;
    }
    if (derivedActivity.soundDetected !== undefined && mergedRawAttributes.sound_detected === undefined) {
      mergedRawAttributes.sound_detected = derivedActivity.soundDetected;
    }
    if (derivedActivity.lastMotionDetected && mergedRawAttributes.last_motion_detected === undefined) {
      mergedRawAttributes.last_motion_detected = derivedActivity.lastMotionDetected;
    }
    if (derivedActivity.lastSoundDetected && mergedRawAttributes.last_sound_detected === undefined) {
      mergedRawAttributes.last_sound_detected = derivedActivity.lastSoundDetected;
    }
    if (derivedActivity.lastImageUrl && mergedRawAttributes.last_image_url === undefined) {
      mergedRawAttributes.last_image_url = derivedActivity.lastImageUrl;
    }

    const snapshotUrl = preview.snapshotUrl ?? derivedActivity.lastImageUrl;
    const hasMergedAttributes = Object.keys(mergedRawAttributes).length > 0;

    return {
      name: cameraName,
      status: isOffline ? 'Offline' : 'Live',
      entityId: cameraEntityId,
      streamUrl: preview.streamUrl,
      snapshotUrl,
      isOffline,
      supportsPtz:
        cameraHasPtzButtons ||
        resolveCameraSupportsPtz(cameraEntityId, rawAttributes, haServiceRegistry),
      rawAttributes: hasMergedAttributes ? mergedRawAttributes : undefined,
    };
  }, [activeWidget, cameraHasPtzButtons, haServiceRegistry, haStatesForUi, haUrl, isHaConnected]);

  const contextSpeaker = useMemo(() => {
    if (activeWidget?.kind !== 'media') {
      return state.speaker;
    }
    const liveEntity = isHaConnected ? haStatesForUi[activeWidget.entityId] : undefined;
    const mediaState = resolveMediaState(liveEntity?.stateLabel ?? liveEntity?.state ?? activeWidget.status);
    const capabilities = resolveMediaCapabilities(liveEntity);
    const resolvedDuration =
      typeof liveEntity?.mediaDuration === 'number'
        ? Math.max(0, Math.round(liveEntity.mediaDuration))
        : state.speaker.durationSeconds ?? 0;
    const mediaPositionUpdatedAt =
      typeof liveEntity?.mediaPositionUpdatedAt === 'number' && Number.isFinite(liveEntity.mediaPositionUpdatedAt)
        ? liveEntity.mediaPositionUpdatedAt
        : undefined;
    const resolvedPositionFromEntity =
      typeof liveEntity?.mediaPosition === 'number'
        ? resolveLiveMediaPosition(
            Math.round(liveEntity.mediaPosition),
            resolvedDuration,
            liveEntity?.stateLabel ?? liveEntity?.state ?? activeWidget.status,
            mediaPositionUpdatedAt,
            Date.now(),
          )
        : undefined;
    const fallbackProgress =
      typeof activeWidget.value === 'number' ? activeWidget.value : state.speaker.progress;
    const resolvedProgress =
      resolvedPositionFromEntity !== undefined
        ? Math.max(0, Math.min(100, Math.round((resolvedPositionFromEntity / resolvedDuration) * 100)))
        : typeof liveEntity?.progress === 'number'
          ? Math.max(0, Math.min(100, Math.round(liveEntity.progress)))
          : Math.max(0, Math.min(100, Math.round(fallbackProgress)));
    const resolvedPosition =
      resolvedPositionFromEntity ?? Math.max(0, Math.min(resolvedDuration, Math.round((resolvedProgress / 100) * resolvedDuration)));

    return {
      isPlaying: mediaState === 'playing',
      status: liveEntity?.stateLabel ?? liveEntity?.state ?? activeWidget.status ?? state.speaker.status,
      progress: resolvedProgress,
      positionSeconds: resolvedPosition,
      trackTitle:
        liveEntity?.mediaTitle?.trim() || liveEntity?.nowPlaying?.trim() || state.speaker.trackTitle,
      trackArtist: liveEntity?.mediaArtist?.trim() || state.speaker.trackArtist,
      durationSeconds: resolvedDuration,
      coverUrl: liveEntity?.imageUrl || state.speaker.coverUrl,
      volumeLevel:
        typeof liveEntity?.volumeLevel === 'number'
          ? Math.max(0, Math.min(100, Math.round(liveEntity.volumeLevel)))
          : state.speaker.volumeLevel,
      muted: typeof liveEntity?.mediaMuted === 'boolean' ? liveEntity.mediaMuted : state.speaker.muted,
      supportsSeek: capabilities.supportsSeek,
      supportsVolume: capabilities.supportsVolume,
      supportsMute: capabilities.supportsMute,
      supportsNextTrack: capabilities.supportsNextTrack,
      supportsPreviousTrack: capabilities.supportsPreviousTrack,
      supportsPower: capabilities.supportsPower,
    };
  }, [activeWidget, haStatesForUi, isHaConnected, state.speaker]);

  const contextVacuum = useMemo(() => {
    if (activeWidget?.kind !== 'vacuum') {
      return {
        name: 'Robot Vacuum',
        state: 'unknown',
        status: translateVacuumState('unknown'),
        batteryLevel: undefined as number | undefined,
        cleanedArea: undefined as number | undefined,
        cleanedAreaUnit: undefined as string | undefined,
        cleaningMinutes: undefined as number | undefined,
        fanSpeed: undefined as string | undefined,
        fanSpeedList: [] as string[],
        mapUrl: undefined as string | undefined,
        supportedFeatures: undefined as number | undefined,
        supportsStart: true,
        supportsPause: true,
        supportsStop: true,
        supportsReturnToBase: true,
        supportsLocate: true,
        supportsCleanSpot: true,
        supportsCleanArea: true,
        supportsFanSpeed: true,
        supportsMap: true,
        supportsSendCommand: true,
        rawAttributes: undefined as Record<string, unknown> | undefined,
      };
    }

    const liveEntity = isHaConnected ? haStatesForUi[activeWidget.entityId] : undefined;
    const useDemoData = !liveEntity && isDemoVacuumEntity(activeWidget.entityId);
    const rawAttributes = liveEntity?.rawAttributes;
    const fallbackAttributes = buildFallbackVacuumAttributes(activeWidget, useDemoData);
    const sourceAttributes = rawAttributes ?? fallbackAttributes;
    const normalizedState = normalizeVacuumState(
      toTrimmedString(liveEntity?.stateLabel) ??
        toTrimmedString(liveEntity?.state) ??
        activeWidget.status,
    );
    const statusText =
      toTrimmedString(sourceAttributes?.status) ??
      translateVacuumState(normalizedState);
    const batteryLevel =
      toFiniteNumber(sourceAttributes?.battery_level) ??
      toFiniteNumber(sourceAttributes?.battery) ??
      toFiniteNumber(activeWidget.value);
    const cleanedArea =
      toFiniteNumber(sourceAttributes?.cleaned_area) ??
      toFiniteNumber(sourceAttributes?.clean_area) ??
      toFiniteNumber(activeWidget.vacuumCleanedArea);
    const cleanedAreaUnit =
      toTrimmedString(sourceAttributes?.cleaned_area_unit) ??
      toTrimmedString(sourceAttributes?.area_unit);
    const cleaningMinutes =
      toFiniteNumber(sourceAttributes?.cleaning_time) ??
      toFiniteNumber(sourceAttributes?.clean_time) ??
      toFiniteNumber(activeWidget.vacuumCleaningMinutes);
    const fanSpeed =
      toTrimmedString(sourceAttributes?.fan_speed) ??
      toTrimmedString(sourceAttributes?.fan_mode) ??
      toTrimmedString(activeWidget.vacuumFanSpeed);
    const fanSpeedListSource =
      Array.isArray(sourceAttributes?.fan_speed_list)
        ? sourceAttributes.fan_speed_list
        : Array.isArray(sourceAttributes?.fan_speeds)
          ? sourceAttributes.fan_speeds
          : Array.isArray(sourceAttributes?.fan_modes)
            ? sourceAttributes.fan_modes
            : [...VACUUM_DEMO_FAN_SPEEDS];
    const fanSpeedList = fanSpeedListSource.filter(
      (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
    );
    const capabilities = resolveVacuumCapabilities(liveEntity);
    const mapUrl =
      capabilities.supportsMap || useDemoData || (liveEntity?.imageUrl ?? '').length > 0
        ? resolveVacuumMapUrl(liveEntity, haUrl)
          ?? toTrimmedString(sourceAttributes?.map_url)
        : undefined;

    return {
      name:
        toTrimmedString(sourceAttributes?.friendly_name) ??
        activeWidget.title,
      state: normalizedState,
      status: statusText,
      batteryLevel,
      cleanedArea,
      cleanedAreaUnit,
      cleaningMinutes,
      fanSpeed,
      fanSpeedList,
      mapUrl,
      supportedFeatures: capabilities.supportedFeatures || (useDemoData ? VACUUM_DEMO_SUPPORTED_FEATURES : undefined),
      supportsStart: capabilities.supportsStart,
      supportsPause: capabilities.supportsPause,
      supportsStop: capabilities.supportsStop,
      supportsReturnToBase: capabilities.supportsReturnHome,
      supportsLocate: capabilities.supportsLocate,
      supportsCleanSpot: capabilities.supportsCleanSpot,
      supportsCleanArea: capabilities.supportsCleanArea,
      supportsFanSpeed: capabilities.supportsFanSpeed,
      supportsMap: capabilities.supportsMap,
      supportsSendCommand: capabilities.supportsSendCommand,
      rawAttributes: sourceAttributes,
    };
  }, [activeWidget, haStatesForUi, haUrl, isHaConnected]);

  const contextAlarm = useMemo(() => {
    if (activeWidget?.kind !== 'alarm') {
      return {
        name: 'Allarme',
        state: 'disarmed',
        status: getAlarmStateLabel('disarmed'),
        codeArmRequired: false,
        activityLogLimit: DEFAULT_ACTIVITY_MAX_ENTRIES,
        supportedFeatures: undefined as number | undefined,
        changedBy: undefined as string | undefined,
        activityTimeline: [] as ActivityTimelineEntry[],
        rawAttributes: undefined as Record<string, unknown> | undefined,
      };
    }

    const liveEntity = isHaConnected ? haStatesForUi[activeWidget.entityId] : undefined;
    const rawAttributes = liveEntity?.rawAttributes;
    const resolvedState = normalizeAlarmState(
      toTrimmedString(liveEntity?.state) ??
        toTrimmedString(liveEntity?.stateLabel) ??
        activeWidget.status,
    );
    const supportedFeatures = resolveAlarmSupportedFeatures(liveEntity);
    const activityLogLimit = resolveActivityMaxEntries(activeWidget.activityLogLimit);
    const activityTimeline = (alarmTimelineByEntity[activeWidget.entityId] ?? []).slice(0, activityLogLimit);
    const timelineActor = activityTimeline.find((entry) => entry.actor && entry.actor !== DEFAULT_ACTIVITY_ACTOR)?.actor;
    const changedBy = toTrimmedString(rawAttributes?.changed_by) ?? timelineActor ?? haCurrentUser?.name;
    const codeArmRequired = typeof rawAttributes?.code_arm_required === 'boolean' ? rawAttributes.code_arm_required : false;
    return {
      name:
        toTrimmedString(rawAttributes?.friendly_name) ??
        activeWidget.title,
      state: resolvedState,
      status: getAlarmStateLabel(resolvedState),
      codeArmRequired,
      unlockCode: activeWidget.alarmUnlockCode?.trim() || undefined,
      activityLogLimit,
      supportedFeatures,
      changedBy,
      activityTimeline,
      rawAttributes,
    };
  }, [activeWidget, alarmTimelineByEntity, haCurrentUser?.name, haStatesForUi, isHaConnected]);

  const contextLock = useMemo(() => {
    if (activeWidget?.kind !== 'lock') {
      return {
        name: 'Serratura',
        state: 'unknown',
        status: translateLockState('unknown'),
        changedBy: undefined as string | undefined,
        activityLogLimit: DEFAULT_ACTIVITY_MAX_ENTRIES,
        activityTimeline: [] as ActivityTimelineEntry[],
        supportedFeatures: undefined as number | undefined,
        rawAttributes: undefined as Record<string, unknown> | undefined,
        lockCode: undefined as string | undefined,
      };
    }

    const liveEntity = isHaConnected ? haStatesForUi[activeWidget.entityId] : undefined;
    const rawAttributes = liveEntity?.rawAttributes;
    const stateValue = normalizeLockState(
      toTrimmedString(liveEntity?.state) ??
        toTrimmedString(liveEntity?.stateLabel) ??
        activeWidget.status,
    );
    const rawSupportedFeatures = toFiniteNumber(rawAttributes?.supported_features);
    const supportedFeatures =
      typeof liveEntity?.supportedFeatures === 'number'
        ? liveEntity.supportedFeatures
        : rawSupportedFeatures;
    const activityLogLimit = resolveActivityMaxEntries(activeWidget.activityLogLimit);
    const activityTimeline = (lockTimelineByEntity[activeWidget.entityId] ?? []).slice(0, activityLogLimit);
    const timelineActor = activityTimeline.find((entry) => entry.actor && entry.actor !== DEFAULT_ACTIVITY_ACTOR)?.actor;
    const changedBy = toTrimmedString(rawAttributes?.changed_by) ?? timelineActor ?? haCurrentUser?.name;

    return {
      name:
        toTrimmedString(rawAttributes?.friendly_name) ??
        activeWidget.title,
      state: stateValue,
      status: translateLockState(stateValue),
      changedBy,
      activityLogLimit,
      activityTimeline,
      supportedFeatures,
      rawAttributes,
      lockCode: activeWidget.lockCode?.trim() || undefined,
    };
  }, [activeWidget, haCurrentUser?.name, haStatesForUi, isHaConnected, lockTimelineByEntity]);

  const contextCover = useMemo(() => {
    if (activeWidget?.kind !== 'cover') {
      return {
        name: 'Tapparella',
        state: 'unknown',
        status: translateCoverState('unknown'),
        position: 70,
        tiltPosition: 50,
        supportedFeatures: undefined as number | undefined,
        supportsOpen: true,
        supportsClose: true,
        supportsStop: true,
        supportsSetPosition: true,
        supportsSetTiltPosition: false,
        rawAttributes: undefined as Record<string, unknown> | undefined,
      };
    }

    const liveEntity = isHaConnected ? haStatesForUi[activeWidget.entityId] : undefined;
    const rawAttributes = liveEntity?.rawAttributes ?? buildFallbackCoverAttributes(activeWidget);
    const stateValue = normalizeCoverState(
      toTrimmedString(liveEntity?.state) ??
        toTrimmedString(liveEntity?.stateLabel) ??
        activeWidget.status,
    );
    const position = resolveCoverPosition(
      stateValue,
      rawAttributes?.current_position ?? rawAttributes?.position ?? activeWidget.value,
      typeof activeWidget.value === 'number' ? activeWidget.value : 70,
    );
    const tiltPosition = resolveCoverTiltPosition(
      rawAttributes?.current_tilt_position ?? rawAttributes?.tilt_position ?? activeWidget.coverTiltPosition,
      typeof activeWidget.coverTiltPosition === 'number' ? activeWidget.coverTiltPosition : 50,
    );
    const capabilities = resolveCoverCapabilities(liveEntity);

    return {
      name:
        toTrimmedString(rawAttributes?.friendly_name) ??
        activeWidget.title,
      state: stateValue,
      status: `${translateCoverState(stateValue)} ${position}%`,
      position,
      tiltPosition,
      supportedFeatures: capabilities.supportedFeatures,
      supportsOpen: capabilities.supportsOpen,
      supportsClose: capabilities.supportsClose,
      supportsStop: capabilities.supportsStop,
      supportsSetPosition: capabilities.supportsSetPosition,
      supportsSetTiltPosition: capabilities.supportsSetTiltPosition,
      rawAttributes,
    };
  }, [activeWidget, haStatesForUi, isHaConnected]);

  const activeActivityTarget = useMemo(() => {
    if (!isHaConnected || (activeWidget?.kind !== 'lock' && activeWidget?.kind !== 'alarm')) {
      return null;
    }
    const entityId = activeWidget.entityId?.trim();
    if (!entityId) {
      return null;
    }
    const liveEntity = haStates[entityId];
    const rawAttributes = liveEntity?.rawAttributes;
    const refreshKey = [
      toTrimmedString(liveEntity?.state),
      toTrimmedString(liveEntity?.stateLabel),
      toTrimmedString(rawAttributes?.changed_by),
      toTrimmedString(rawAttributes?.changed_at),
      toTrimmedString(rawAttributes?.last_changed),
      toTrimmedString(rawAttributes?.last_updated),
    ]
      .filter((entry): entry is string => Boolean(entry))
      .join('|');
    return {
      kind: activeWidget.kind,
      entityId,
      activityWindowHours: resolveActivityWindowHours(activeWidget.activityLogHours),
      activityMaxEntries: resolveActivityMaxEntries(activeWidget.activityLogLimit),
      fallbackActor: toTrimmedString(rawAttributes?.changed_by) ?? haCurrentUser?.name,
      refreshKey,
    };
  }, [activeWidget, haCurrentUser?.name, haStates, isHaConnected]);

  const stateWithConnectedUser = useMemo(
    () => ({
      ...state,
      userName: haCurrentUser?.name ?? state.userName,
    }),
    [haCurrentUser?.name, state],
  );

  const currentUserAvatarUrl = useMemo(() => {
    if (!isHaConnected || !haCurrentUser?.id) {
      return undefined;
    }

    const personEntity = Object.entries(haStates).find(([entityId, entity]) => {
      if (!entityId.startsWith('person.')) {
        return false;
      }
      const userId = toTrimmedString(entity.rawAttributes?.user_id);
      return userId === haCurrentUser.id;
    })?.[1];

    if (!personEntity) {
      return undefined;
    }

    const directImage = toTrimmedString(personEntity.imageUrl);
    if (directImage) {
      return resolveHaAssetUrl(directImage, haUrl);
    }

    const picture = toTrimmedString(personEntity.rawAttributes?.entity_picture);
    return resolveHaAssetUrl(picture, haUrl);
  }, [haCurrentUser?.id, haStates, haUrl, isHaConnected]);

  const profileHouseMembers = useMemo(() => {
    const collectedMembers: ProfileHouseMember[] = [];
    const seenMemberIds = new Set<string>();
    const currentUserId = toTrimmedString(haCurrentUser?.id);
    const resolveMemberRoleLabel = (userId: string | undefined) => {
      const resolvedUserId = toTrimmedString(userId);
      if (!resolvedUserId) {
        return 'Membro';
      }
      const linkedUser = haUsersById[resolvedUserId] ?? (haCurrentUser?.id === resolvedUserId ? haCurrentUser : undefined);
      if (!linkedUser) {
        return 'Membro';
      }
      return linkedUser.isOwner ? 'Creatore' : linkedUser.isAdmin ? 'Admin' : 'Membro';
    };

    const addMember = (member: ProfileHouseMember) => {
      const memberId = toTrimmedString(member.id);
      const memberName = toTrimmedString(member.name);
      if (!memberId || !memberName || seenMemberIds.has(memberId)) {
        return;
      }
      seenMemberIds.add(memberId);
      collectedMembers.push({
        id: memberId,
        name: memberName,
        userId: toTrimmedString(member.userId),
        avatarUrl: toTrimmedString(member.avatarUrl),
        roleLabel: toTrimmedString(member.roleLabel),
        isCurrent: member.isCurrent === true,
      });
    };

    if (isHaConnected) {
      Object.entries(haStates).forEach(([entityId, entity]) => {
        if (!entityId.startsWith('person.')) {
          return;
        }
        const rawAttributes = entity.rawAttributes ?? {};
        const userId = toTrimmedString(rawAttributes.user_id);
        const entityName = toTrimmedString(rawAttributes.friendly_name);
        const slugFallback = entityId.slice('person.'.length).replace(/[_-]+/g, ' ').trim();
        const name = entityName ?? (slugFallback.length > 0 ? slugFallback : entityId);
        if (
          isGuestServiceAccountMemberCandidate({
            userId,
            displayName: name,
            entityId,
          })
        ) {
          return;
        }
        const avatarCandidate = toTrimmedString(entity.imageUrl) ?? toTrimmedString(rawAttributes.entity_picture);
        const avatarUrl = resolveHaAssetUrl(avatarCandidate, haUrl);
        const memberId = userId ? `user:${userId}` : `person:${entityId}`;
        addMember({
          id: memberId,
          name,
          userId,
          avatarUrl,
          roleLabel: resolveMemberRoleLabel(userId),
          isCurrent: Boolean(currentUserId && userId && currentUserId === userId),
        });
      });
    }

    Object.entries(haUserNamesById).forEach(([userId, userName]) => {
      const trimmedUserId = toTrimmedString(userId);
      const trimmedUserName = toTrimmedString(userName);
      if (!trimmedUserId || !trimmedUserName) {
        return;
      }
      const linkedUserDetails = haUsersById[trimmedUserId];
      if (
        isGuestServiceAccountMemberCandidate({
          userId: trimmedUserId,
          displayName: trimmedUserName,
          username: linkedUserDetails?.username,
          email: linkedUserDetails?.email,
        })
      ) {
        return;
      }
      addMember({
        id: `user:${trimmedUserId}`,
        name: trimmedUserName,
        userId: trimmedUserId,
        roleLabel: resolveMemberRoleLabel(trimmedUserId),
        isCurrent: currentUserId === trimmedUserId,
      });
    });

    if (haCurrentUser?.id && haCurrentUser.name) {
      if (
        !isGuestServiceAccountMemberCandidate({
          userId: haCurrentUser.id,
          displayName: haCurrentUser.name,
          username: haCurrentUser.username,
          email: haCurrentUser.email,
        })
      ) {
        addMember({
          id: `user:${haCurrentUser.id}`,
          name: haCurrentUser.name,
          userId: haCurrentUser.id,
          avatarUrl: currentUserAvatarUrl,
          roleLabel: resolveMemberRoleLabel(haCurrentUser.id),
          isCurrent: true,
        });
      }
    }

    return collectedMembers.sort((first, second) => {
      if (first.isCurrent === true && second.isCurrent !== true) {
        return -1;
      }
      if (second.isCurrent === true && first.isCurrent !== true) {
        return 1;
      }
      return first.name.localeCompare(second.name, 'it-IT');
    });
  }, [currentUserAvatarUrl, haCurrentUser, haStates, haUrl, haUserNamesById, haUsersById, isHaConnected]);

  const contextState = useMemo(
    () => ({
      ...stateWithConnectedUser,
      lamp: contextLamp,
      climate: contextClimate,
      speaker: contextSpeaker,
    }),
    [contextClimate, contextLamp, contextSpeaker, stateWithConnectedUser],
  );

  useEffect(() => {
    if (!isHaConnected || haCurrentUser) {
      return;
    }
    let cancelled = false;
    const loadUsers = async () => {
      const currentUserPayload = await callHaApi<unknown>({ type: 'auth/current_user' }, { reportError: false });
      if (cancelled) {
        return;
      }
      const parsedCurrentUser = parseHaCurrentUser(currentUserPayload);
      if (parsedCurrentUser) {
        setHaCurrentUser(parsedCurrentUser);
        setHaUserNamesById((current) =>
          current[parsedCurrentUser.id] === parsedCurrentUser.name
            ? current
            : { ...current, [parsedCurrentUser.id]: parsedCurrentUser.name },
        );
        setHaUsersById((current) => {
          const previous = current[parsedCurrentUser.id];
          if (
            previous &&
            previous.name === parsedCurrentUser.name &&
            previous.username === parsedCurrentUser.username &&
            previous.email === parsedCurrentUser.email &&
            previous.isOwner === parsedCurrentUser.isOwner &&
            previous.isAdmin === parsedCurrentUser.isAdmin
          ) {
            return current;
          }
          return { ...current, [parsedCurrentUser.id]: parsedCurrentUser };
        });
      }

      const primary = await callHaApi<unknown>({ type: 'config/auth/list' }, { reportError: false });
      const secondary = primary ?? (await callHaApi<unknown>({ type: 'auth/list' }, { reportError: false }));
      if (cancelled || secondary === null) {
        return;
      }
      const users = parseHaAuthUsers(secondary);
      if (!users.length) {
        return;
      }
      setHaUserNamesById((current) => {
        const next = { ...current };
        let changed = false;
        users.forEach((user) => {
          if (next[user.id] === user.name) {
            return;
          }
          next[user.id] = user.name;
          changed = true;
        });
        return changed ? next : current;
      });
      setHaUsersById((current) => {
        const next = { ...current };
        let changed = false;
        users.forEach((user) => {
          const previous = next[user.id];
          if (
            previous &&
            previous.name === user.name &&
            previous.username === user.username &&
            previous.email === user.email &&
            previous.isOwner === user.isOwner &&
            previous.isAdmin === user.isAdmin
          ) {
            return;
          }
          next[user.id] = user;
          changed = true;
        });
        return changed ? next : current;
      });
    };

    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, [callHaApi, haCurrentUser, isHaConnected]);

  useEffect(() => {
    if (!isHaConnected) {
      setHaServiceRegistry(null);
      return;
    }
    let cancelled = false;
    const loadServices = async () => {
      const payload = await callHaApi<unknown>({ type: 'get_services' }, { reportError: false });
      if (cancelled || !payload || typeof payload !== 'object') {
        return;
      }
      setHaServiceRegistry(payload as HaServiceRegistry);
    };
    void loadServices();
    return () => {
      cancelled = true;
    };
  }, [callHaApi, isHaConnected]);

  useEffect(() => {
    if (!isHaConnected) {
      setHaFavoriteEntityIds([]);
      setHaFavoriteLabelDetected(false);
      return;
    }
    if (!favoriteGridSections.length) {
      setHaFavoriteEntityIds([]);
      setHaFavoriteLabelDetected(false);
      return;
    }
    let cancelled = false;
    const loadFavoriteLabels = async () => {
      const labelsRequest = async () =>
        (await callHaApi<unknown>({ type: 'config/label_registry/list' }, { reportError: false })) ??
        (await callHaApi<unknown>({ type: 'config/label_registry/list_for_display' }, { reportError: false }));
      const entitiesRequest = async () =>
        (await callHaApi<unknown>({ type: 'config/entity_registry/list' }, { reportError: false })) ??
        (await callHaApi<unknown>({ type: 'config/entity_registry/list_for_display' }, { reportError: false }));
      const devicesRequest = async () =>
        (await callHaApi<unknown>({ type: 'config/device_registry/list' }, { reportError: false })) ??
        (await callHaApi<unknown>({ type: 'config/device_registry/list_for_display' }, { reportError: false }));

      const [labelsPayload, entitiesPayload, devicesPayload] = await Promise.all([
        labelsRequest(),
        entitiesRequest(),
        devicesRequest(),
      ]);
      if (cancelled) {
        return;
      }
      if (!labelsPayload || !entitiesPayload) {
        return;
      }
      const favoriteLabelIds = parseFavoriteLabelIds(labelsPayload);
      const favoriteEntityIds = parseEntityIdsByLabelIds(entitiesPayload, favoriteLabelIds);
      const favoriteDeviceIds = parseDeviceIdsByLabelIds(devicesPayload, favoriteLabelIds);
      const favoriteEntityIdsFromDevices = parseEntityIdsByDeviceIds(entitiesPayload, favoriteDeviceIds);
      favoriteEntityIdsFromDevices.forEach((entityId) => favoriteEntityIds.add(entityId));
      setHaFavoriteLabelDetected(favoriteLabelIds.size > 0);
      setHaFavoriteEntityIds((current) => {
        const next = Array.from(favoriteEntityIds).sort((first, second) => first.localeCompare(second, 'it-IT'));
        if (current.length === next.length && current.every((item) => favoriteEntityIds.has(item))) {
          return current;
        }
        return next;
      });
    };
    void loadFavoriteLabels();
    const refreshInterval = window.setInterval(() => {
      void loadFavoriteLabels();
    }, 30000);
    const handleWindowFocus = () => {
      void loadFavoriteLabels();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadFavoriteLabels();
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [callHaApi, favoriteGridSections.length, isHaConnected]);

  useEffect(() => {
    setProfileMovementPoints(profileMovementSource.basePoints);
    setProfileMovementTimeline(profileMovementSource.baseTimeline);
    if (profileMovementSource.baseTimeline.length > 0) {
      setProfileMovementUpdatedLabel(`Aggiornato alle ${profileMovementSource.baseTimeline[0].timestampLabel}`);
      return;
    }
    setProfileMovementUpdatedLabel('');
  }, [profileMovementSource.basePoints, profileMovementSource.baseTimeline]);

  useEffect(() => {
    if (!isProfileOpen || !isHaConnected || profileMovementSource.trackedEntityIds.length === 0) {
      return;
    }

    let cancelled = false;
    const trackedEntityIdsSet = new Set(profileMovementSource.trackedEntityIds);
    const loadProfileMovementData = async () => {
      const endMs = Date.now();
      const startMs = endMs - PROFILE_MOVEMENT_WINDOW_HOURS * 60 * 60 * 1000;
      const payload = await callHaApi<unknown>(
        {
          type: 'logbook/get_events',
          start_time: new Date(startMs).toISOString(),
          end_time: new Date(endMs).toISOString(),
          entity_ids: profileMovementSource.trackedEntityIds.slice(0, 25),
        },
        { reportError: false },
      );
      if (cancelled || payload === null) {
        return;
      }

      const events = parseHaLogbookEvents(payload)
        .map((event, index) => {
          const eventEntityId = toTrimmedString(event.entity_id);
          const timestampMs = toTimestampMs(event.when);
          if (!eventEntityId || !timestampMs || !trackedEntityIdsSet.has(eventEntityId)) {
            return null;
          }
          const rawState = toTrimmedString(event.state);
          const locationLabel = formatMovementLocationLabel(rawState);
          const actorLabel = toTrimmedString(event.name) ?? eventEntityId;
          const timestampLabel = new Date(timestampMs).toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
          const locationKey = normalizeMovementLocationKey(rawState);
          const mappedLocation = locationKey ? profileMovementSource.zoneLookup[locationKey] : undefined;
          return {
            id: `${timestampMs}-${index}-${eventEntityId}`,
            entityId: eventEntityId,
            actorLabel,
            locationLabel,
            timestampMs,
            timestampLabel,
            mappedLocation,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .sort((first, second) => second.timestampMs - first.timestampMs)
        .slice(0, PROFILE_MOVEMENT_MAX_ENTRIES);

      if (cancelled) {
        return;
      }

      if (events.length === 0) {
        return;
      }

      const nextTimeline: ProfileMovementTimelineEntry[] = events.map((event, index) => ({
        id: `profile-movement-${event.id}`,
        title: `Posizione: ${event.locationLabel}`,
        subtitle: event.actorLabel,
        timestampLabel: event.timestampLabel,
        timestampMs: event.timestampMs,
        isCurrent: index === 0,
      }));

      const nextMapPoints: ProfileMovementMapPoint[] = events
        .map((event) => {
          if (!event.mappedLocation) {
            return null;
          }
          return {
            id: `profile-map-${event.id}`,
            latitude: event.mappedLocation.latitude,
            longitude: event.mappedLocation.longitude,
            label: event.actorLabel,
            zoneLabel: event.locationLabel,
            timestampLabel: event.timestampLabel,
            timestampMs: event.timestampMs,
            isCurrent: false,
          } satisfies ProfileMovementMapPoint;
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

      const enrichedMapPoints =
        nextMapPoints.length > 0
          ? nextMapPoints.map((point, index) => ({
              ...point,
              isCurrent: index === 0,
            }))
          : profileMovementSource.basePoints;

      setProfileMovementTimeline(nextTimeline);
      setProfileMovementPoints(enrichedMapPoints);
      setProfileMovementUpdatedLabel(
        `Aggiornato alle ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`,
      );
    };

    void loadProfileMovementData();
    const refreshIntervalId = window.setInterval(() => {
      void loadProfileMovementData();
    }, HA_ACTIVITY_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(refreshIntervalId);
    };
  }, [callHaApi, isHaConnected, isProfileOpen, profileMovementSource]);

  const activeActivityKind = activeActivityTarget?.kind;
  const activeActivityEntityId = activeActivityTarget?.entityId;
  const activeActivityWindowHours = activeActivityTarget?.activityWindowHours ?? DEFAULT_ACTIVITY_WINDOW_HOURS;
  const activeActivityMaxEntries = activeActivityTarget?.activityMaxEntries ?? DEFAULT_ACTIVITY_MAX_ENTRIES;
  const activeActivityFallbackActor = activeActivityTarget?.fallbackActor;
  const activeActivityRefreshKey = activeActivityTarget?.refreshKey;

  useEffect(() => {
    if (!isHaConnected || !activeActivityKind || !activeActivityEntityId) {
      return;
    }

    let cancelled = false;
    const fetchSeq = ++activityFetchSeqRef.current;

    const loadTimeline = async () => {
      const endMs = Date.now();
      const startMs = endMs - activeActivityWindowHours * 60 * 60 * 1000;
      const payloadWithEntityIds = await callHaApi<unknown>(
        {
          type: 'logbook/get_events',
          start_time: new Date(startMs).toISOString(),
          end_time: new Date(endMs).toISOString(),
          entity_ids: [activeActivityEntityId],
        },
        { reportError: false },
      );
      const payload =
        payloadWithEntityIds ??
        (await callHaApi<unknown>(
          {
            type: 'logbook/get_events',
            start_time: new Date(startMs).toISOString(),
            end_time: new Date(endMs).toISOString(),
            entity_id: activeActivityEntityId,
          },
          { reportError: false },
        ));

      if (cancelled || fetchSeq !== activityFetchSeqRef.current || payload === null) {
        return;
      }

      const events = parseHaLogbookEvents(payload);
      const filteredEvents = events.filter((event) => {
        const eventEntityId = toTrimmedString(event.entity_id);
        return !eventEntityId || eventEntityId === activeActivityEntityId;
      });
      const entries = buildTimelineEntries(
        filteredEvents,
        (event) => resolveActivityActor(event, haUserNamesById, activeActivityFallbackActor ?? haCurrentUser?.name),
        activeActivityKind === 'lock' ? resolveLockActivityVerb : resolveAlarmActivityVerb,
        activeActivityMaxEntries,
      );

      if (cancelled || fetchSeq !== activityFetchSeqRef.current) {
        return;
      }

      if (activeActivityKind === 'lock') {
        setLockTimelineByEntity((current) => {
          const currentEntries = current[activeActivityEntityId] ?? [];
          if (entries.length === 0 && currentEntries.length > 0) {
            return current;
          }
          return {
            ...current,
            [activeActivityEntityId]: entries,
          };
        });
        return;
      }

      setAlarmTimelineByEntity((current) => {
        const currentEntries = current[activeActivityEntityId] ?? [];
        if (entries.length === 0 && currentEntries.length > 0) {
          return current;
        }
        return {
          ...current,
          [activeActivityEntityId]: entries,
        };
      });
    };

    void loadTimeline();
    const intervalId = window.setInterval(() => {
      void loadTimeline();
    }, HA_ACTIVITY_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    activeActivityEntityId,
    activeActivityFallbackActor,
    activeActivityKind,
    activeActivityMaxEntries,
    activeActivityRefreshKey,
    activeActivityWindowHours,
    callHaApi,
    haCurrentUser?.name,
    haUserNamesById,
    isHaConnected,
  ]);

  useEffect(() => {
    setWidgets((prev) => {
      const next = prev.map((widget) => {
        const liveEntity = haStatus === 'connected' ? haStatesForUi[widget.entityId] : undefined;
        if (liveEntity) {
          let statusLabel = liveEntity.stateLabel ?? liveEntity.state ?? widget.status;
          const unit = liveEntity.unit ?? widget.unit;
          const isOn =
            typeof liveEntity.toggleOn === 'boolean'
              ? liveEntity.toggleOn
              : widget.kind === 'climate' && typeof liveEntity.state === 'string'
                ? liveEntity.state !== 'off'
                : widget.kind === 'media'
                  ? ['playing', 'paused'].includes(resolveMediaState(liveEntity.stateLabel ?? liveEntity.state))
                  : widget.kind === 'alarm'
                    ? isAlarmArmedState(liveEntity.stateLabel ?? liveEntity.state ?? widget.status)
                  : widget.kind === 'vacuum'
                    ? ['cleaning', 'paused', 'returning'].includes(
                        normalizeVacuumState(liveEntity.stateLabel ?? liveEntity.state ?? widget.status),
                      )
                    : widget.kind === 'lock'
                      ? isLockLockedState(normalizeLockState(liveEntity.stateLabel ?? liveEntity.state ?? widget.status))
                      : widget.kind === 'cover'
                        ? resolveCoverPosition(
                            normalizeCoverState(liveEntity.stateLabel ?? liveEntity.state ?? widget.status),
                            liveEntity.rawAttributes?.current_position ?? liveEntity.rawAttributes?.position ?? widget.value,
                            typeof widget.value === 'number' ? widget.value : 70,
                          ) > 0
                      : widget.isOn;
          let value = widget.value;
          let vacuumCleanedArea = widget.vacuumCleanedArea;
          let vacuumCleaningMinutes = widget.vacuumCleaningMinutes;
          let coverTiltPosition = widget.coverTiltPosition;
          if (widget.kind === 'light') {
            value =
              typeof liveEntity.brightness === 'number'
                ? liveEntity.brightness
                : typeof liveEntity.numericValue === 'number'
                  ? liveEntity.numericValue
                  : value;
          } else if (widget.kind === 'sensor') {
            value = typeof liveEntity.numericValue === 'number' ? liveEntity.numericValue : value;
            statusLabel = resolveSensorMeta(widget, liveEntity, haStatesForUi).status;
          } else if (widget.kind === 'media') {
            statusLabel = liveEntity.stateLabel ?? liveEntity.state ?? widget.status;
            value = typeof liveEntity.progress === 'number' ? liveEntity.progress : value;
          } else if (widget.kind === 'climate') {
            value = typeof liveEntity.currentValue === 'number' ? liveEntity.currentValue : value;
          } else if (widget.kind === 'alarm') {
            statusLabel = normalizeAlarmState(liveEntity.stateLabel ?? liveEntity.state ?? widget.status);
          } else if (widget.kind === 'vacuum') {
            statusLabel = normalizeVacuumState(liveEntity.stateLabel ?? liveEntity.state ?? widget.status);
            value =
              toFiniteNumber(liveEntity.rawAttributes?.battery_level) ??
              toFiniteNumber(liveEntity.rawAttributes?.battery) ??
              value;
            vacuumCleanedArea =
              toFiniteNumber(liveEntity.rawAttributes?.cleaned_area) ??
              vacuumCleanedArea;
            vacuumCleaningMinutes =
              toFiniteNumber(liveEntity.rawAttributes?.cleaning_time) ??
              toFiniteNumber(liveEntity.rawAttributes?.clean_time) ??
              vacuumCleaningMinutes;
          } else if (widget.kind === 'cover') {
            statusLabel = normalizeCoverState(liveEntity.stateLabel ?? liveEntity.state ?? widget.status);
            value = resolveCoverPosition(
              statusLabel,
              liveEntity.rawAttributes?.current_position ?? liveEntity.rawAttributes?.position ?? value,
              typeof value === 'number' ? value : 70,
            );
            coverTiltPosition = resolveCoverTiltPosition(
              liveEntity.rawAttributes?.current_tilt_position ??
                liveEntity.rawAttributes?.tilt_position ??
                coverTiltPosition,
              typeof coverTiltPosition === 'number' ? coverTiltPosition : 50,
            );
          } else if (widget.kind === 'lock') {
            statusLabel = normalizeLockState(liveEntity.stateLabel ?? liveEntity.state ?? widget.status);
          }
          const nextLayout =
            widget.kind === 'light'
              ? resolveLightLayoutForState(widget, isOn)
                : widget.kind === 'media'
                ? resolveMediaLayout(widget)
                : widget.kind === 'climate'
                  ? resolveClimateLayout(widget)
                  : widget.kind === 'camera'
                    ? resolveCameraLayout(widget)
                    : widget.kind === 'sensor'
                      ? resolveSensorLayout(widget)
                  : widget.kind === 'alarm'
                    ? resolveAlarmLayout(widget)
                    : widget.kind === 'vacuum'
                      ? resolveVacuumLayout(widget)
                      : widget.kind === 'cover'
                        ? resolveCoverLayout(widget)
                      : widget.kind === 'lock'
                        ? resolveLockLayout(widget)
                        : widget.layout;
          if (
            widget.status === statusLabel &&
            widget.isOn === isOn &&
            widget.value === value &&
            widget.unit === unit &&
            widget.vacuumCleanedArea === vacuumCleanedArea &&
            widget.vacuumCleaningMinutes === vacuumCleaningMinutes &&
            widget.coverTiltPosition === coverTiltPosition &&
            sameLayout(widget.layout, nextLayout)
          ) {
            return widget;
          }
          return {
            ...widget,
            status: statusLabel,
            isOn,
            value,
            unit,
            vacuumCleanedArea,
            vacuumCleaningMinutes,
            coverTiltPosition,
            layout: nextLayout,
          };
        }
        if (widget.id === 'sensor.nest_wifi_download') {
          if (widget.value === state.wifiDownloadMbps) {
            return widget;
          }
          return { ...widget, value: state.wifiDownloadMbps };
        }
        if (widget.id === 'light.living_room_lamp') {
          const nextLayout = resolveLightLayoutForState(widget, state.lamp.isOn);
          if (
            widget.status === state.lamp.status &&
            widget.isOn === state.lamp.isOn &&
            widget.value === state.lamp.brightness &&
            sameLayout(widget.layout, nextLayout)
          ) {
            return widget;
          }
          return {
            ...widget,
            status: state.lamp.status,
            isOn: state.lamp.isOn,
            value: state.lamp.brightness,
            layout: nextLayout,
          };
        }
        if (widget.id === 'climate.air_conditioner') {
          const nextLayout = resolveClimateLayout(widget);
          if (
            widget.status === state.climate.status &&
            widget.isOn === state.climate.isOn &&
            widget.value === state.climate.currentTemp &&
            sameLayout(widget.layout, nextLayout)
          ) {
            return widget;
          }
          return {
            ...widget,
            status: state.climate.status,
            isOn: state.climate.isOn,
            value: state.climate.currentTemp,
            layout: nextLayout,
          };
        }
        if (widget.kind === 'climate') {
          const nextLayout = resolveClimateLayout(widget);
          if (sameLayout(widget.layout, nextLayout)) {
            return widget;
          }
          return {
            ...widget,
            layout: nextLayout,
          };
        }
        if (widget.kind === 'alarm') {
          const nextLayout = resolveAlarmLayout(widget);
          if (sameLayout(widget.layout, nextLayout)) {
            return widget;
          }
          return {
            ...widget,
            layout: nextLayout,
          };
        }
        if (widget.kind === 'camera') {
          const nextLayout = resolveCameraLayout(widget);
          if (sameLayout(widget.layout, nextLayout)) {
            return widget;
          }
          return {
            ...widget,
            layout: nextLayout,
          };
        }
        if (widget.kind === 'sensor') {
          const nextLayout = resolveSensorLayout(widget);
          if (sameLayout(widget.layout, nextLayout)) {
            return widget;
          }
          return {
            ...widget,
            layout: nextLayout,
          };
        }
        if (widget.kind === 'vacuum') {
          const nextLayout = resolveVacuumLayout(widget);
          const nextArea =
            typeof widget.vacuumCleanedArea === 'number' && Number.isFinite(widget.vacuumCleanedArea)
              ? widget.vacuumCleanedArea
              : 45;
          const nextMinutes =
            typeof widget.vacuumCleaningMinutes === 'number' && Number.isFinite(widget.vacuumCleaningMinutes)
              ? widget.vacuumCleaningMinutes
              : 32;
          if (
            sameLayout(widget.layout, nextLayout) &&
            widget.vacuumCleanedArea === nextArea &&
            widget.vacuumCleaningMinutes === nextMinutes
          ) {
            return widget;
          }
          return {
            ...widget,
            vacuumCleanedArea: nextArea,
            vacuumCleaningMinutes: nextMinutes,
            layout: nextLayout,
          };
        }
        if (widget.kind === 'cover') {
          const nextLayout = resolveCoverLayout(widget);
          const nextPosition = resolveCoverPosition(
            normalizeCoverState(widget.status),
            widget.value,
            70,
          );
          const nextTilt = resolveCoverTiltPosition(widget.coverTiltPosition, 50);
          const nextIsOn = nextPosition > 0;
          if (
            sameLayout(widget.layout, nextLayout) &&
            widget.value === nextPosition &&
            widget.coverTiltPosition === nextTilt &&
            widget.isOn === nextIsOn
          ) {
            return widget;
          }
          return {
            ...widget,
            value: nextPosition,
            coverTiltPosition: nextTilt,
            isOn: nextIsOn,
            layout: nextLayout,
          };
        }
        if (widget.kind === 'lock') {
          const nextLayout = resolveLockLayout(widget);
          if (sameLayout(widget.layout, nextLayout)) {
            return widget;
          }
          return {
            ...widget,
            layout: nextLayout,
          };
        }
        if (widget.kind === 'media') {
          const nextLayout = resolveMediaLayout(widget);
          if (sameLayout(widget.layout, nextLayout)) {
            return widget;
          }
          return {
            ...widget,
            layout: nextLayout,
          };
        }
        return widget;
      });
      const resolved = resolveAutoWidgetLayoutChanges(prev, next);
      const changed =
        resolved.length !== prev.length ||
        resolved.some((widget, index) => {
          const previous = prev[index];
          return (
            !previous ||
            previous.id !== widget.id ||
            previous.parentSectionId !== widget.parentSectionId ||
            !sameLayout(previous.layout, widget.layout) ||
            previous.status !== widget.status ||
            previous.isOn !== widget.isOn ||
            previous.value !== widget.value ||
            previous.unit !== widget.unit ||
            previous.vacuumCleanedArea !== widget.vacuumCleanedArea ||
            previous.vacuumCleaningMinutes !== widget.vacuumCleaningMinutes ||
            previous.coverTiltPosition !== widget.coverTiltPosition
          );
        });
      return changed ? resolved : prev;
    });
  }, [
    haStatesForUi,
    haStatus,
    state.wifiDownloadMbps,
    state.lamp.name,
    state.lamp.status,
    state.lamp.isOn,
    state.lamp.brightness,
    state.climate.name,
    state.climate.status,
    state.climate.isOn,
    state.climate.currentTemp,
    sections,
  ]);

  useEffect(() => {
    if (!isEditMode) {
      setIsCatalogOpen(false);
    }
  }, [isEditMode]);

  useEffect(() => {
    return () => {
      const timers = lightBrightnessDebounceRef.current;
      Object.values(timers).forEach((timeoutId) => window.clearTimeout(timeoutId));
      lightBrightnessDebounceRef.current = {};

      const climatePendingTimers = climatePendingTimeoutRef.current;
      Object.values(climatePendingTimers).forEach((timeoutId) => window.clearTimeout(timeoutId));
      climatePendingTimeoutRef.current = {};
      const climateSendTimers = climateSendDelayTimeoutRef.current;
      Object.values(climateSendTimers).forEach((timeoutId) => window.clearTimeout(timeoutId));
      climateSendDelayTimeoutRef.current = {};
      climateQueuedCommandRef.current = {};

      const lightColorPendingTimers = lightColorPendingTimeoutRef.current;
      Object.values(lightColorPendingTimers).forEach((timeoutId) => window.clearTimeout(timeoutId));
      lightColorPendingTimeoutRef.current = {};

      const coverPendingTimers = coverPendingTimeoutRef.current;
      Object.values(coverPendingTimers).forEach((timeoutId) => window.clearTimeout(timeoutId));
      coverPendingTimeoutRef.current = {};

      const returnTimers = vacuumReturnToBaseTimeoutRef.current;
      Object.values(returnTimers).forEach((timeoutId) => window.clearTimeout(timeoutId));
      vacuumReturnToBaseTimeoutRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (isHaConnected) {
      return;
    }
    const timers = lightBrightnessDebounceRef.current;
    Object.values(timers).forEach((timeoutId) => window.clearTimeout(timeoutId));
    lightBrightnessDebounceRef.current = {};

    const climatePendingTimers = climatePendingTimeoutRef.current;
    Object.values(climatePendingTimers).forEach((timeoutId) => window.clearTimeout(timeoutId));
    climatePendingTimeoutRef.current = {};
    const climateSendTimers = climateSendDelayTimeoutRef.current;
    Object.values(climateSendTimers).forEach((timeoutId) => window.clearTimeout(timeoutId));
    climateSendDelayTimeoutRef.current = {};
    climateQueuedCommandRef.current = {};
    setClimatePendingByEntity({});

    const lightColorPendingTimers = lightColorPendingTimeoutRef.current;
    Object.values(lightColorPendingTimers).forEach((timeoutId) => window.clearTimeout(timeoutId));
    lightColorPendingTimeoutRef.current = {};
    setLightColorPendingByEntity({});

    const coverPendingTimers = coverPendingTimeoutRef.current;
    Object.values(coverPendingTimers).forEach((timeoutId) => window.clearTimeout(timeoutId));
    coverPendingTimeoutRef.current = {};
    setCoverPendingByEntity({});
    setHaUserNamesById({});
    setHaUsersById({});
    setHaCurrentUser(null);
    setLockTimelineByEntity({});
    setAlarmTimelineByEntity({});
  }, [isHaConnected]);

  useEffect(() => {
    if (!isHaConnected) {
      return;
    }
    const returnTimers = vacuumReturnToBaseTimeoutRef.current;
    Object.values(returnTimers).forEach((timeoutId) => window.clearTimeout(timeoutId));
    vacuumReturnToBaseTimeoutRef.current = {};
  }, [isHaConnected]);

  useEffect(() => {
    if (!isHaConnected || Object.keys(climatePendingByEntity).length === 0) {
      return;
    }

    const resolvedEntityIds = Object.entries(climatePendingByEntity)
      .filter(([entityId, pending]) => {
        if (!hasClimatePendingValues(pending)) {
          return true;
        }
        const liveEntity = haStates[entityId];
        if (!liveEntity) {
          return false;
        }
        const rawAttributes = liveEntity.rawAttributes;
        const liveTargetTemp =
          toFiniteNumber(liveEntity.targetValue) ??
          toFiniteNumber(rawAttributes?.temperature);
        const liveTargetTempLow =
          toFiniteNumber(liveEntity.targetTempLow) ??
          toFiniteNumber(rawAttributes?.target_temp_low);
        const liveTargetTempHigh =
          toFiniteNumber(liveEntity.targetTempHigh) ??
          toFiniteNumber(rawAttributes?.target_temp_high);
        const liveFanMode = normalizeLower(
          toTrimmedString(liveEntity.fanMode) ??
            toTrimmedString(rawAttributes?.fan_mode),
        );
        const pendingFanMode = normalizeLower(pending.fanMode);

        const targetTempReady =
          !Number.isFinite(pending.targetTemp) ||
          almostEqual(liveTargetTemp, pending.targetTemp);
        const targetTempLowReady =
          !Number.isFinite(pending.targetTempLow) ||
          almostEqual(liveTargetTempLow, pending.targetTempLow);
        const targetTempHighReady =
          !Number.isFinite(pending.targetTempHigh) ||
          almostEqual(liveTargetTempHigh, pending.targetTempHigh);
        const fanModeReady = !pendingFanMode || pendingFanMode === liveFanMode;

        return targetTempReady && targetTempLowReady && targetTempHighReady && fanModeReady;
      })
      .map(([entityId]) => entityId);

    if (!resolvedEntityIds.length) {
      return;
    }

    setClimatePendingByEntity((current) => {
      let changed = false;
      const next = { ...current };
      resolvedEntityIds.forEach((entityId) => {
        if (!(entityId in next)) {
          return;
        }
        changed = true;
        delete next[entityId];
      });
      return changed ? next : current;
    });

    resolvedEntityIds.forEach((entityId) => {
      const timeoutId = climatePendingTimeoutRef.current[entityId];
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        delete climatePendingTimeoutRef.current[entityId];
      }
    });
  }, [climatePendingByEntity, haStates, isHaConnected]);

  useEffect(() => {
    if (!isHaConnected || Object.keys(lightColorPendingByEntity).length === 0) {
      return;
    }

    const resolvedEntityIds = Object.entries(lightColorPendingByEntity)
      .filter(([entityId, pending]) => {
        const liveEntity = haStates[entityId];
        if (!liveEntity) {
          return false;
        }
        const liveHsColor = liveEntity.hsColor ?? liveEntity.hs_color;
        if (!liveHsColor) {
          return false;
        }
        return (
          almostEqual(liveHsColor[0], pending.hsColor[0], 1.2) &&
          almostEqual(liveHsColor[1], pending.hsColor[1], 1.2)
        );
      })
      .map(([entityId]) => entityId);

    if (!resolvedEntityIds.length) {
      return;
    }

    setLightColorPendingByEntity((current) => {
      let changed = false;
      const next = { ...current };
      resolvedEntityIds.forEach((entityId) => {
        if (!(entityId in next)) {
          return;
        }
        changed = true;
        delete next[entityId];
      });
      return changed ? next : current;
    });

    resolvedEntityIds.forEach((entityId) => {
      const timeoutId = lightColorPendingTimeoutRef.current[entityId];
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        delete lightColorPendingTimeoutRef.current[entityId];
      }
    });
  }, [haStates, isHaConnected, lightColorPendingByEntity]);

  useEffect(() => {
    if (!isHaConnected || Object.keys(coverPendingByEntity).length === 0) {
      return;
    }

    const resolvedEntityIds = Object.entries(coverPendingByEntity)
      .filter(([entityId, pending]) => {
        if (!hasCoverPendingValues(pending)) {
          return true;
        }
        const liveEntity = haStates[entityId];
        if (!liveEntity) {
          return false;
        }
        const rawAttributes = liveEntity.rawAttributes;
        const liveState = normalizeCoverState(
          toTrimmedString(liveEntity.state) ??
            toTrimmedString(liveEntity.stateLabel),
        );
        const livePosition = resolveCoverPosition(
          liveState,
          rawAttributes?.current_position ?? rawAttributes?.position,
          pending.position ?? 70,
        );
        const liveTiltPosition = resolveCoverTiltPosition(
          rawAttributes?.current_tilt_position ?? rawAttributes?.tilt_position,
          pending.tiltPosition ?? 50,
        );
        const pendingState = normalizeCoverState(pending.state);
        const stateReady =
          !pendingState ||
          pendingState === 'unknown' ||
          (pendingState === 'opening' && liveState === 'open') ||
          (pendingState === 'closing' && liveState === 'closed') ||
          pendingState === liveState;
        const positionReady =
          !Number.isFinite(pending.position) ||
          almostEqual(livePosition, pending.position, 1);
        const tiltReady =
          !Number.isFinite(pending.tiltPosition) ||
          almostEqual(liveTiltPosition, pending.tiltPosition, 1);
        return stateReady && positionReady && tiltReady;
      })
      .map(([entityId]) => entityId);

    if (!resolvedEntityIds.length) {
      return;
    }

    setCoverPendingByEntity((current) => {
      let changed = false;
      const next = { ...current };
      resolvedEntityIds.forEach((entityId) => {
        if (!(entityId in next)) {
          return;
        }
        changed = true;
        delete next[entityId];
      });
      return changed ? next : current;
    });

    resolvedEntityIds.forEach((entityId) => {
      const timeoutId = coverPendingTimeoutRef.current[entityId];
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        delete coverPendingTimeoutRef.current[entityId];
      }
    });
  }, [coverPendingByEntity, haStates, isHaConnected]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setWidgets((prev) => {
        let changed = false;
        const next = prev.map((widget) => {
          if (widget.kind !== 'vacuum') {
            return widget;
          }
          const liveEntity = isHaConnected ? haStates[widget.entityId] : undefined;
          if (liveEntity) {
            return widget;
          }
          const normalizedState = normalizeVacuumState(widget.status);
          const batteryLevel = typeof widget.value === 'number' ? widget.value : 85;
          const cleanedArea =
            typeof widget.vacuumCleanedArea === 'number' && Number.isFinite(widget.vacuumCleanedArea)
              ? widget.vacuumCleanedArea
              : 45;
          const cleaningMinutes =
            typeof widget.vacuumCleaningMinutes === 'number' && Number.isFinite(widget.vacuumCleaningMinutes)
              ? widget.vacuumCleaningMinutes
              : 32;

          let nextBattery = batteryLevel;
          let nextArea = cleanedArea;
          let nextMinutes = cleaningMinutes;

          if (normalizedState === 'cleaning') {
            nextBattery = Math.max(0, batteryLevel - 1);
            nextArea = Math.round((cleanedArea + 0.8) * 10) / 10;
            nextMinutes = Math.round(cleaningMinutes + 1);
          } else if (normalizedState === 'docked') {
            nextBattery = Math.min(100, batteryLevel + 1);
          }

          if (
            nextBattery === batteryLevel &&
            nextArea === cleanedArea &&
            nextMinutes === cleaningMinutes
          ) {
            return widget;
          }

          changed = true;
          return {
            ...widget,
            value: nextBattery,
            vacuumCleanedArea: nextArea,
            vacuumCleaningMinutes: nextMinutes,
          };
        });
        return changed ? next : prev;
      });
    }, VACUUM_DEMO_TICK_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [haStates, isHaConnected]);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isRefreshKey =
        event.key === 'F5' ||
        ((event.ctrlKey || event.metaKey) && (key === 'r' || key === 'f5'));
      if (isRefreshKey) {
        event.preventDefault();
        setEditConfirm('refresh');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditMode]);

  useEffect(() => {
    if (selectedWidgetId && !widgets.some((widget) => widget.id === selectedWidgetId)) {
      setSelectedWidgetId(null);
    }
  }, [selectedWidgetId, widgets]);

  useEffect(() => {
    if (selectedSectionId && !sections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(null);
    }
  }, [selectedSectionId, sections]);

  useEffect(() => {
    if (
      selectedSidebarPathId &&
      !visibleSidebarPaths.some((entry) => entry.id === selectedSidebarPathId)
    ) {
      setSelectedSidebarPathId(null);
    }
  }, [selectedSidebarPathId, visibleSidebarPaths]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (window.location.pathname !== '/') {
      return;
    }

    const nextRoute = `/home${window.location.search}${window.location.hash}`;
    const currentRoute = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextRoute === currentRoute) {
      return;
    }

    window.history.replaceState({}, '', nextRoute);
    setIsConsumptionView(resolveConsumptionFromLocation());
    setIsAutomationView(resolveAutomationFromLocation());
    setIsAppGalleryView(resolveAppGalleryFromLocation());
    setIsSecurityView(resolveSecurityFromLocation());
    setIsSecurityCamerasView(resolveSecurityCamerasFromLocation());
    setIsEditAvailableForRoute(resolveEditAvailabilityFromLocation());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const syncFromLocation = () => {
      const nextIsConsumption = resolveConsumptionFromLocation();
      const nextIsAutomation = resolveAutomationFromLocation();
      const nextIsAppGallery = resolveAppGalleryFromLocation();
      const nextIsSecurity = resolveSecurityFromLocation();
      const nextIsSecurityCameras = resolveSecurityCamerasFromLocation();
      const nextEditAvailability = resolveEditAvailabilityFromLocation();
      setIsConsumptionView(nextIsConsumption);
      setIsAutomationView(nextIsAutomation);
      setIsAppGalleryView(nextIsAppGallery);
      setIsSecurityView(nextIsSecurity);
      setIsSecurityCamerasView(nextIsSecurityCameras);
      setIsEditAvailableForRoute(nextEditAvailability);
    };
    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, []);

  useEffect(() => {
    if (isEditMode) {
      setIsFavoritesOpen(false);
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isEditAvailableForRoute) {
      return;
    }
    setEditConfirm(null);
    if (isEditMode) {
      setIsEditMode(false);
    }
    if (isCatalogOpen) {
      setIsCatalogOpen(false);
    }
    if (isFavoritesOpen) {
      setIsFavoritesOpen(false);
    }
  }, [isCatalogOpen, isEditAvailableForRoute, isEditMode, isFavoritesOpen]);

  useEffect(() => {
    if (!isConsumptionView) {
      setSelectedConsumptionCardId(null);
      return;
    }
    if (!selectedConsumptionCardId) {
      setSelectedConsumptionCardId('electricity');
    }
  }, [isConsumptionView, selectedConsumptionCardId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get(HA_OAUTH_CALLBACK_PARAM) !== '1') {
      return;
    }

    const oauthError = currentUrl.searchParams.get('error');
    const oauthErrorDescription = currentUrl.searchParams.get('error_description');
    const oauthCode = currentUrl.searchParams.get('code');
    const oauthState = parseHaOAuthState(currentUrl.searchParams.get('state'));
    const returnPath = resolveOAuthReturnPath(oauthState?.returnTo);
    const cleanupUrl = () => {
      window.history.replaceState({}, '', returnPath);
    };

    if (oauthError) {
      setOAuthFlowError(
        oauthErrorDescription?.trim() || `Autorizzazione Home Assistant interrotta: ${oauthError}.`,
      );
      cleanupUrl();
      return;
    }

    if (!oauthCode || !oauthState) {
      setOAuthFlowError('Risposta OAuth Home Assistant non valida.');
      cleanupUrl();
      return;
    }

    const expectedNonce = window.sessionStorage.getItem(HA_OAUTH_SESSION_NONCE_KEY);
    if (!expectedNonce || expectedNonce !== oauthState.nonce) {
      setOAuthFlowError('Verifica sicurezza OAuth non riuscita. Riprova.');
      cleanupUrl();
      return;
    }

    let cancelled = false;
    const oauthAbortController = new AbortController();

    const runOAuthExchange = async () => {
      setIsOAuthFlowBusy(true);
      try {
        const oauthTokens = await exchangeHaOAuthCode({
          hassUrl: oauthState.hassUrl,
          clientId: window.location.origin,
          code: oauthCode,
          signal: oauthAbortController.signal,
        });
        if (cancelled) {
          return;
        }
        persistOAuthTokensAsAuthData({
          hassUrl: oauthState.hassUrl,
          clientId: window.location.origin,
          tokens: oauthTokens,
        });
        setHaUrl(oauthState.hassUrl);
        setHaToken(oauthTokens.accessToken);
        setPendingOAuthConnect(true);
        setOAuthFlowError(null);
      } catch (error) {
        if (!cancelled) {
          setOAuthFlowError(error instanceof Error ? error.message : 'Autenticazione OAuth fallita.');
        }
      } finally {
        if (!cancelled) {
          setIsOAuthFlowBusy(false);
          window.sessionStorage.removeItem(HA_OAUTH_SESSION_NONCE_KEY);
          cleanupUrl();
        }
      }
    };

    const deferredRunId = window.setTimeout(() => {
      runOAuthExchange();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(deferredRunId);
      oauthAbortController.abort();
    };
  }, []);

  useEffect(() => {
    if (!pendingOAuthConnect || !haToken.trim()) {
      return;
    }
    connectHa();
    setPendingOAuthConnect(false);
  }, [connectHa, haToken, pendingOAuthConnect]);

  useEffect(() => {
    if (haStatus !== 'disconnected') {
      return;
    }
    if (haToken.trim().length > 0) {
      return;
    }

    let cancelled = false;
    const tryOAuthAutoReconnect = async () => {
      const storedTokens = await loadHassAuthTokensFromStorage();
      if (!storedTokens) {
        return;
      }
      if (cancelled) {
        return;
      }
      const storedHassUrl = normalizeHassUrl(storedTokens.hassUrl);
      if (!storedHassUrl) {
        return;
      }
      setPendingStoredOAuthReconnectUrl(storedHassUrl);
      if (storedHassUrl !== normalizeHassUrl(haUrl)) {
        setHaUrl(storedHassUrl);
      }
    };

    void tryOAuthAutoReconnect();

    return () => {
      cancelled = true;
    };
  }, [haStatus, haToken, haUrl, setHaUrl]);

  useEffect(() => {
    if (!pendingStoredOAuthReconnectUrl) {
      return;
    }
    if (haStatus !== 'disconnected') {
      return;
    }
    if (haToken.trim().length > 0) {
      setPendingStoredOAuthReconnectUrl(null);
      return;
    }
    if (normalizeHassUrl(haUrl) !== pendingStoredOAuthReconnectUrl) {
      return;
    }
    connectHa();
    setPendingStoredOAuthReconnectUrl(null);
  }, [connectHa, haStatus, haToken, haUrl, pendingStoredOAuthReconnectUrl]);

  useEffect(() => {
    saveDashboardLayout(sections, widgets);
  }, [sections, widgets]);

  useEffect(() => {
    setWidgets((prev) => {
      let changed = false;
      const next = prev.map((widget) => {
        const parentId = widget.parentSectionId;
        const section = parentId ? sections.find((entry) => entry.id === parentId) : undefined;
        if (!section || !isStackSection(section)) {
          return widget;
        }
        const normalized = resolveWidgetLayoutByKind(
          widget,
          normalizeLayoutForStack(section, widget.layout),
        );
        if (
          normalized.x !== widget.layout.x ||
          normalized.y !== widget.layout.y ||
          normalized.w !== widget.layout.w ||
          normalized.h !== widget.layout.h
        ) {
          changed = true;
          return {
            ...widget,
            layout: normalized,
          };
        }
        return widget;
      });
      return changed ? next : prev;
    });
  }, [sections]);

  const updateWidget = (id: string, updater: (widget: Widget) => Widget) => {
    setWidgets((prev) => prev.map((widget) => (widget.id === id ? updater(widget) : widget)));
  };

  const updateWidgetWithAutoLayout = (id: string, updater: (widget: Widget) => Widget) => {
    setWidgets((prev) => {
      const next = prev.map((widget) => (widget.id === id ? updater(widget) : widget));
      const resolved = resolveAutoWidgetLayoutChanges(prev, next);
      const changed =
        resolved.length !== prev.length ||
        resolved.some((widget, index) => {
          const previous = prev[index];
          return (
            !previous ||
            previous.id !== widget.id ||
            previous.parentSectionId !== widget.parentSectionId ||
            !sameLayout(previous.layout, widget.layout) ||
            previous.status !== widget.status ||
            previous.isOn !== widget.isOn ||
            previous.value !== widget.value ||
            previous.unit !== widget.unit
          );
        });
      return changed ? resolved : prev;
    });
  };

  const updateSection = (id: string, updater: (section: DashboardSection) => DashboardSection) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== id) {
          return section;
        }

        const previousWeatherLayout =
          section.kind === 'weather' || (section.kind === 'greeting' && (section.showWeather ?? false))
            ? section.weatherLayout ?? 'auto'
            : 'auto';
        let nextSection = updater(section);

        if (
          nextSection.kind === 'weather' ||
          (nextSection.kind === 'greeting' && (nextSection.showWeather ?? false))
        ) {
          if (nextSection.kind === 'greeting' && (nextSection.showWeather ?? false)) {
            nextSection = {
              ...nextSection,
              weatherLayout: 'auto',
            };
          }
          const nextWeatherLayout = nextSection.weatherLayout ?? 'auto';
          if (nextWeatherLayout !== previousWeatherLayout) {
            if (nextWeatherLayout === 'chip' && nextSection.kind === 'weather') {
              nextSection = {
                ...nextSection,
                layout: {
                  ...nextSection.layout,
                  w: WEATHER_SECTION_CHIP_COLS,
                  h: WEATHER_SECTION_CHIP_ROWS,
                },
              };
            } else if (nextWeatherLayout === 'card') {
              nextSection = {
                ...nextSection,
                layout: {
                  ...nextSection.layout,
                  h: WEATHER_SECTION_CARD_ROWS,
                },
              };
              if (nextSection.kind === 'weather') {
                nextSection = {
                  ...nextSection,
                  layout: {
                    ...nextSection.layout,
                    w: WEATHER_SECTION_CARD_COLS,
                  },
                };
              }
            }
          }
        }

        return {
          ...nextSection,
          layout: normalizeSectionRootLayout(nextSection, nextSection.layout),
        };
      }),
    );
  };

  const handleWidgetLayoutChange = (sectionId: string, nextLayout: GridItem[]) => {
    const nextLayoutMap = new Map(nextLayout.map((item) => [item.i, item]));
    const section = sections.find((entry) => entry.id === sectionId);

    setWidgets((prev) => {
      const expandedAnchorIds = new Set<string>();
      const next = prev.map((widget) => {
        const parentId = widget.parentSectionId;
        if (parentId !== sectionId) {
          return widget;
        }

        const nextItem = nextLayoutMap.get(widget.id);
        if (!nextItem) {
          return widget;
        }

        const normalizedLayout =
          section && isStackSection(section)
            ? normalizeLayoutForStack(section, {
                i: widget.id,
                x: nextItem.x,
                y: nextItem.y,
                w: nextItem.w,
                h: nextItem.h,
              })
            : {
                i: widget.id,
                x: Math.max(0, Math.round(nextItem.x)),
                y: Math.max(0, Math.round(nextItem.y)),
                w: Math.max(1, Math.round(nextItem.w)),
                h: Math.max(1, Math.round(nextItem.h)),
              };
        const constrainedLayout = resolveWidgetLayoutByKind(widget, normalizedLayout);
        if (layoutExpandsFootprint(widget.layout, constrainedLayout)) {
          expandedAnchorIds.add(widget.id);
        }

        const sameLayout =
          widget.layout.x === constrainedLayout.x &&
          widget.layout.y === constrainedLayout.y &&
          widget.layout.w === constrainedLayout.w &&
          widget.layout.h === constrainedLayout.h;
        const sameParent = widget.parentSectionId === sectionId;

        if (sameLayout && sameParent) {
          return widget;
        }

        return {
          ...widget,
          parentSectionId: sectionId,
          layout: constrainedLayout,
        };
      });
      const resolved =
        section && isStackSection(section)
          ? expandedAnchorIds.size > 0
            ? Array.from(expandedAnchorIds).reduce(
                (current, anchorId) => pushStackSectionLayoutDown(section, current, anchorId),
                next,
              )
            : compactStackSectionLayout(section, next)
          : next;
      const changed =
        resolved.length !== prev.length ||
        resolved.some((widget, index) => {
          const previous = prev[index];
          return (
            !previous ||
            previous.id !== widget.id ||
            previous.parentSectionId !== widget.parentSectionId ||
            !sameLayout(previous.layout, widget.layout)
          );
        });

      return changed ? resolved : prev;
    });
  };

  const handleSectionsLayoutChange = (nextLayout: GridItem[]) => {
    const nextLayoutMap = new Map(nextLayout.map((item) => [item.i, item]));
    const expandedAnchorIds = new Set<string>();
    const nextSections = sections.map((section) => {
      const nextItem = nextLayoutMap.get(section.id);
      if (!nextItem) {
        return section;
      }
      const normalizedLayout = normalizeSectionRootLayout(section, {
        i: section.id,
        x: nextItem.x,
        y: nextItem.y,
        w: nextItem.w,
        h: nextItem.h,
      });
      if (layoutExpandsFootprint(section.layout, normalizedLayout)) {
        expandedAnchorIds.add(section.id);
      }
      return sameLayout(section.layout, normalizedLayout)
        ? section
        : {
            ...section,
            layout: normalizedLayout,
          };
    });
    const nextWidgets = widgets.map((widget) => {
      if (widget.parentSectionId) {
        return widget;
      }
      const nextItem = nextLayoutMap.get(widget.id);
      if (!nextItem) {
        return widget;
      }
      const normalizedLayout = normalizeRootLayout({
        i: widget.id,
        x: nextItem.x,
        y: nextItem.y,
        w: nextItem.w,
        h: nextItem.h,
      });
      const constrainedLayout = resolveWidgetLayoutByKind(widget, normalizedLayout);
      if (layoutExpandsFootprint(widget.layout, constrainedLayout)) {
        expandedAnchorIds.add(widget.id);
      }
      return sameLayout(widget.layout, constrainedLayout)
        ? widget
        : {
            ...widget,
            layout: constrainedLayout,
          };
    });
    if (expandedAnchorIds.size > 0) {
      const pushed = Array.from(expandedAnchorIds).reduce(
        (current, anchorId) => pushRootCanvasLayoutDown(current.sections, current.widgets, anchorId),
        { sections: nextSections, widgets: nextWidgets },
      );
      setSections(pushed.sections);
      setWidgets(pushed.widgets);
      return;
    }
    const compacted = compactRootCanvasLayout(nextSections, nextWidgets);
    setSections(compacted.sections);
    setWidgets(compacted.widgets);
  };

  const resolveAutoWidgetLayoutChanges = (previousWidgets: Widget[], nextWidgets: Widget[]): Widget[] => {
    let resolvedSections = sections;
    let resolvedWidgets = nextWidgets;
    let sectionsChanged = false;
    const previousWidgetMap = new Map(previousWidgets.map((widget) => [widget.id, widget]));

    nextWidgets.forEach((nextWidget) => {
      if (nextWidget.kind !== 'light') {
        return;
      }

      const previousWidget = previousWidgetMap.get(nextWidget.id);
      if (!previousWidget || sameLayout(previousWidget.layout, nextWidget.layout)) {
        return;
      }

      const expandsFootprint =
        nextWidget.layout.w > previousWidget.layout.w ||
        nextWidget.layout.h > previousWidget.layout.h ||
        nextWidget.layout.x + nextWidget.layout.w > previousWidget.layout.x + previousWidget.layout.w ||
        nextWidget.layout.y + nextWidget.layout.h > previousWidget.layout.y + previousWidget.layout.h;

      if (nextWidget.parentSectionId) {
        const section = resolvedSections.find((entry) => entry.id === nextWidget.parentSectionId);
        if (!section || !isStackSection(section)) {
          return;
        }
        resolvedWidgets = expandsFootprint
          ? pushStackSectionLayoutDown(section, resolvedWidgets, nextWidget.id)
          : compactStackSectionLayout(section, resolvedWidgets);
        return;
      }

      const resolved = expandsFootprint
        ? pushRootCanvasLayoutDown(resolvedSections, resolvedWidgets, nextWidget.id)
        : compactRootCanvasLayout(resolvedSections, resolvedWidgets);
      sectionsChanged =
        sectionsChanged ||
        resolved.sections.length !== resolvedSections.length ||
        resolved.sections.some((section, index) => {
          const previous = resolvedSections[index];
          return !previous || previous.id !== section.id || !sameLayout(previous.layout, section.layout);
        });
      resolvedSections = resolved.sections;
      resolvedWidgets = resolved.widgets;
    });

    if (sectionsChanged) {
      setSections(resolvedSections);
    }

    return resolvedWidgets;
  };

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const resolvePreferredHvacMode = (entity?: { hvacModes?: string[]; hvacMode?: string; state?: string }) => {
    const modes = entity?.hvacModes ?? [];
    const preferredOrder = ['cool', 'auto', 'heat', 'heat_cool', 'fan_only', 'dry'];
    const preferred = preferredOrder.find((mode) => modes.includes(mode));
    if (preferred) {
      return preferred;
    }
    if (entity?.hvacMode && entity.hvacMode !== 'off') {
      return entity.hvacMode;
    }
    if (entity?.state && entity.state !== 'off') {
      return entity.state;
    }
    return modes[0] ?? 'cool';
  };

  const scheduleClimatePendingExpiry = (entityId: string) => {
    const timers = climatePendingTimeoutRef.current;
    const existingTimeout = timers[entityId];
    if (existingTimeout !== undefined) {
      window.clearTimeout(existingTimeout);
    }
    timers[entityId] = window.setTimeout(() => {
      setClimatePendingByEntity((current) => {
        if (!(entityId in current)) {
          return current;
        }
        const next = { ...current };
        delete next[entityId];
        return next;
      });
      delete timers[entityId];
    }, CLIMATE_PENDING_TTL_MS);
  };

  const upsertClimatePending = (
    entityId: string,
    patch: Partial<Omit<ClimatePendingState, 'expiresAt'>>,
  ) => {
    const expiresAt = Date.now() + CLIMATE_PENDING_TTL_MS;
    setClimatePendingByEntity((current) => {
      const nextEntry: ClimatePendingState = {
        ...(current[entityId] ?? { expiresAt }),
        ...patch,
        expiresAt,
      };
      if (!hasClimatePendingValues(nextEntry)) {
        if (!(entityId in current)) {
          return current;
        }
        const next = { ...current };
        delete next[entityId];
        return next;
      }
      return {
        ...current,
        [entityId]: nextEntry,
      };
    });
    scheduleClimatePendingExpiry(entityId);
  };

  const flushQueuedClimateCommand = (entityId: string) => {
    const queuedCommands = climateQueuedCommandRef.current;
    const queued = queuedCommands[entityId];
    if (!queued) {
      return;
    }
    delete queuedCommands[entityId];

    if (Number.isFinite(queued.targetTempLow) && Number.isFinite(queued.targetTempHigh)) {
      void callHaService('climate', 'set_temperature', {
        entity_id: entityId,
        target_temp_low: queued.targetTempLow,
        target_temp_high: queued.targetTempHigh,
      });
    } else if (Number.isFinite(queued.targetTemp)) {
      void callHaService('climate', 'set_temperature', {
        entity_id: entityId,
        temperature: queued.targetTemp,
      });
    }

    const queuedFanMode = normalizeLower(queued.fanMode);
    if (queuedFanMode) {
      void callHaService('climate', 'set_fan_mode', {
        entity_id: entityId,
        fan_mode: queuedFanMode,
      });
    }
  };

  const queueClimateCommandDispatch = (
    entityId: string,
    patch: Partial<ClimateQueuedCommand>,
  ) => {
    const queuedCommands = climateQueuedCommandRef.current;
    const currentCommand = queuedCommands[entityId] ?? {};
    queuedCommands[entityId] = {
      ...currentCommand,
      ...patch,
    };

    const timers = climateSendDelayTimeoutRef.current;
    const existingTimeout = timers[entityId];
    if (existingTimeout !== undefined) {
      window.clearTimeout(existingTimeout);
    }
    timers[entityId] = window.setTimeout(() => {
      delete timers[entityId];
      flushQueuedClimateCommand(entityId);
    }, CLIMATE_SEND_DELAY_MS);
  };

  const setLightColorPending = (entityId: string, hsColor: [number, number]) => {
    const timers = lightColorPendingTimeoutRef.current;
    const existingTimeout = timers[entityId];
    if (existingTimeout !== undefined) {
      window.clearTimeout(existingTimeout);
    }
    const expiresAt = Date.now() + LIGHT_COLOR_PENDING_TTL_MS;
    setLightColorPendingByEntity((current) => ({
      ...current,
      [entityId]: {
        hsColor,
        expiresAt,
      },
    }));
    timers[entityId] = window.setTimeout(() => {
      setLightColorPendingByEntity((current) => {
        if (!(entityId in current)) {
          return current;
        }
        const next = { ...current };
        delete next[entityId];
        return next;
      });
      delete timers[entityId];
    }, LIGHT_COLOR_PENDING_TTL_MS);
  };

  const scheduleCoverPendingExpiry = (entityId: string) => {
    const timers = coverPendingTimeoutRef.current;
    const existingTimeout = timers[entityId];
    if (existingTimeout !== undefined) {
      window.clearTimeout(existingTimeout);
    }
    timers[entityId] = window.setTimeout(() => {
      setCoverPendingByEntity((current) => {
        if (!(entityId in current)) {
          return current;
        }
        const next = { ...current };
        delete next[entityId];
        return next;
      });
      delete timers[entityId];
    }, COVER_PENDING_TTL_MS);
  };

  const upsertCoverPending = (
    entityId: string,
    patch: Partial<Omit<CoverPendingState, 'expiresAt'>>,
  ) => {
    const expiresAt = Date.now() + COVER_PENDING_TTL_MS;
    setCoverPendingByEntity((current) => {
      const nextEntry: CoverPendingState = {
        ...(current[entityId] ?? { expiresAt }),
        ...patch,
        expiresAt,
      };
      if (!hasCoverPendingValues(nextEntry)) {
        if (!(entityId in current)) {
          return current;
        }
        const next = { ...current };
        delete next[entityId];
        return next;
      }
      return {
        ...current,
        [entityId]: nextEntry,
      };
    });
    scheduleCoverPendingExpiry(entityId);
  };

  const toggleLightEntity = (widget?: Widget) => {
    const targetWidget = widget ?? activeWidget;
    const entityId = targetWidget?.kind === 'light' ? targetWidget.entityId : undefined;
    const applyLocalToggle = (nextOn: boolean) => {
      if (targetWidget?.kind !== 'light') {
        return;
      }
      updateWidgetWithAutoLayout(targetWidget.id, (current) => {
        const nextLayout = resolveLightLayoutForState(current, nextOn);
        return {
          ...current,
          isOn: nextOn,
          status: nextOn ? 'Opening' : 'Closed',
          value: nextOn ? Math.max(40, current.value ?? 0) : 0,
          layout: nextLayout,
        };
      });
    };
    if (isHaConnected && entityId) {
      const liveEntity = haStatesForUi[entityId];
      const currentIsOn =
        typeof liveEntity?.toggleOn === 'boolean'
          ? liveEntity.toggleOn
          : targetWidget?.isOn ?? false;
      applyLocalToggle(!currentIsOn);
      void callHaService('light', 'toggle', { entity_id: entityId });
      return;
    }
    if (targetWidget?.kind === 'light' && targetWidget.id !== 'light.living_room_lamp') {
      applyLocalToggle(!targetWidget.isOn);
      return;
    }
    actions.toggleLamp();
  };

  const setLightBrightness = (value: number) => {
    const targetWidget = activeWidget;
    const entityId = targetWidget?.kind === 'light' ? targetWidget.entityId : undefined;
    const safeValue = clamp(Math.round(value), 0, 100);
    if (isHaConnected && entityId) {
      if (safeValue <= 0) {
        void callHaService('light', 'turn_off', { entity_id: entityId });
      } else {
        void callHaService('light', 'turn_on', { entity_id: entityId, brightness_pct: safeValue });
      }
      return;
    }
    if (targetWidget?.kind === 'light' && targetWidget.id !== 'light.living_room_lamp') {
      updateWidgetWithAutoLayout(targetWidget.id, (current) => {
        const nextOn = safeValue > 0;
        const nextLayout = resolveLightLayoutForState(current, nextOn);
        return {
          ...current,
          isOn: nextOn,
          status: nextOn ? 'Opening' : 'Closed',
          value: safeValue,
          layout: nextLayout,
        };
      });
      return;
    }
    actions.setLampBrightness(safeValue);
  };

  const scheduleHaLightBrightness = (entityId: string, safeValue: number) => {
    const timers = lightBrightnessDebounceRef.current;
    const existingTimeout = timers[entityId];
    if (existingTimeout !== undefined) {
      window.clearTimeout(existingTimeout);
    }

    timers[entityId] = window.setTimeout(() => {
      if (safeValue <= 0) {
        void callHaService('light', 'turn_off', { entity_id: entityId });
      } else {
        void callHaService('light', 'turn_on', { entity_id: entityId, brightness_pct: safeValue });
      }
      delete timers[entityId];
    }, LIGHT_BRIGHTNESS_DEBOUNCE_MS);
  };

  const handleWidgetBrightnessChange = (widget: Widget, value: number) => {
    if (widget.kind !== 'light' || isEditMode) {
      return;
    }

    const safeValue = clamp(Math.round(value), 0, 100);
    const nextOn = safeValue > 0;
    const nextStatus = nextOn ? 'Opening' : 'Closed';

    const applyLocal = () => {
      setWidgets((prev) => {
        const next = prev.map((entry) => {
          if (entry.id !== widget.id) {
            return entry;
          }
          const nextLayout = resolveLightLayoutForState(entry, nextOn);
          if (
            entry.value === safeValue &&
            entry.isOn === nextOn &&
            entry.status === nextStatus &&
            sameLayout(entry.layout, nextLayout)
          ) {
            return entry;
          }
          return {
            ...entry,
            value: safeValue,
            isOn: nextOn,
            status: nextStatus,
            layout: nextLayout,
          };
        });
        const resolved = resolveAutoWidgetLayoutChanges(prev, next);
        const changed =
          resolved.length !== prev.length ||
          resolved.some((entry, index) => {
            const previous = prev[index];
            return (
              !previous ||
              previous.id !== entry.id ||
              previous.parentSectionId !== entry.parentSectionId ||
              !sameLayout(previous.layout, entry.layout) ||
              previous.value !== entry.value ||
              previous.isOn !== entry.isOn ||
              previous.status !== entry.status
            );
          });
        return changed ? resolved : prev;
      });
    };

    if (isHaConnected && widget.entityId) {
      scheduleHaLightBrightness(widget.entityId, safeValue);
      applyLocal();
      return;
    }

    if (widget.id === 'light.living_room_lamp') {
      actions.setLampBrightness(safeValue);
    }
    applyLocal();
  };

  const setLightColorTemp = (kelvin: number) => {
    const targetWidget = activeWidget;
    const entityId = targetWidget?.kind === 'light' ? targetWidget.entityId : undefined;
    const safeKelvin = clamp(Math.round(kelvin), 2000, 6500);
    if (isHaConnected && entityId) {
      void callHaService('light', 'turn_on', { entity_id: entityId, color_temp_kelvin: safeKelvin });
      return;
    }
    if (targetWidget?.kind === 'light' && targetWidget.id !== 'light.living_room_lamp') {
      updateWidgetWithAutoLayout(targetWidget.id, (current) => ({
        ...current,
        isOn: true,
        status: 'Opening',
        layout: resolveLightLayoutForState(current, true),
      }));
      return;
    }
    actions.setLampColorTemp(safeKelvin);
  };

  const setLightHsColor = (hs: [number, number]) => {
    const targetWidget = activeWidget;
    const entityId = targetWidget?.kind === 'light' ? targetWidget.entityId : undefined;
    const safeHue = clamp(Math.round(hs[0]), 0, 360);
    const safeSat = clamp(Math.round(hs[1]), 0, 100);
    if (isHaConnected && entityId) {
      setLightColorPending(entityId, [safeHue, safeSat]);
      void callHaService('light', 'turn_on', { entity_id: entityId, hs_color: [safeHue, safeSat] });
      return;
    }
    if (targetWidget?.kind === 'light' && targetWidget.id !== 'light.living_room_lamp') {
      updateWidgetWithAutoLayout(targetWidget.id, (current) => ({
        ...current,
        isOn: true,
        status: 'Opening',
        layout: resolveLightLayoutForState(current, true),
      }));
      return;
    }
    actions.setLampHsColor([safeHue, safeSat]);
  };

  const resolveClimateTargetContext = (widget?: Widget) => {
    const targetWidget = widget?.kind === 'climate' ? widget : activeWidget?.kind === 'climate' ? activeWidget : undefined;
    const entityId = targetWidget?.entityId;
    const liveEntity = entityId && isHaConnected ? haStatesForUi[entityId] : undefined;
    const rawAttributes = liveEntity?.rawAttributes;
    const minTemp =
      toFiniteNumber(liveEntity?.minTemp) ??
      toFiniteNumber(rawAttributes?.min_temp);
    const maxTemp =
      toFiniteNumber(liveEntity?.maxTemp) ??
      toFiniteNumber(rawAttributes?.max_temp);
    const step =
      toFiniteNumber(liveEntity?.targetTempStep) ??
      toFiniteNumber(rawAttributes?.target_temp_step) ??
      0.5;
    const hvacMode =
      toTrimmedString(liveEntity?.hvacMode) ??
      toTrimmedString(rawAttributes?.hvac_mode) ??
      toTrimmedString(liveEntity?.state) ??
      '';
    const isOn = hvacMode ? hvacMode.toLowerCase() !== 'off' : false;
    const targetTemp =
      toFiniteNumber(liveEntity?.targetValue) ??
      toFiniteNumber(rawAttributes?.temperature);
    const currentTemp =
      toFiniteNumber(liveEntity?.currentValue) ??
      toFiniteNumber(rawAttributes?.current_temperature);
    return {
      targetWidget,
      entityId,
      liveEntity,
      minTemp,
      maxTemp,
      step,
      hvacMode,
      isOn,
      targetTemp,
      currentTemp,
    };
  };

  const setClimateMode = (nextMode: string, widget?: Widget) => {
    const { targetWidget, entityId, liveEntity } = resolveClimateTargetContext(widget);
    const normalizedMode = nextMode.trim().toLowerCase();
    if (!normalizedMode) {
      return;
    }

    if (isHaConnected && entityId) {
      void callHaService('climate', 'set_hvac_mode', { entity_id: entityId, hvac_mode: normalizedMode });
      return;
    }

    if (targetWidget?.kind === 'climate' && targetWidget.id !== 'climate.air_conditioner') {
      updateWidget(targetWidget.id, (current) => ({
        ...current,
        isOn: normalizedMode !== 'off',
        status: normalizedMode,
      }));
      return;
    }

    if (!liveEntity) {
      actions.setClimateMode(normalizedMode);
      return;
    }
    actions.nudgeClimateCurrent();
  };

  const setClimateFanMode = (nextFanMode: string, widget?: Widget) => {
    const { targetWidget, entityId } = resolveClimateTargetContext(widget);
    const normalizedFan = nextFanMode.trim().toLowerCase();
    if (!normalizedFan) {
      return;
    }
    if (isHaConnected && entityId) {
      upsertClimatePending(entityId, { fanMode: normalizedFan });
      queueClimateCommandDispatch(entityId, { fanMode: normalizedFan });
      return;
    }
    if (targetWidget?.kind === 'climate' && targetWidget.id !== 'climate.air_conditioner') {
      updateWidget(targetWidget.id, (current) => ({
        ...current,
        status: normalizedFan,
      }));
      return;
    }
    actions.setClimateFanMode(normalizedFan);
  };

  const toggleClimatePower = (widget?: Widget) => {
    const { targetWidget, entityId, liveEntity, isOn } = resolveClimateTargetContext(widget);
    if (isHaConnected && entityId) {
      const nextMode = isOn ? 'off' : resolvePreferredHvacMode(liveEntity);
      void callHaService('climate', 'set_hvac_mode', { entity_id: entityId, hvac_mode: nextMode });
      return;
    }
    if (targetWidget?.kind === 'climate' && targetWidget.id !== 'climate.air_conditioner') {
      updateWidget(targetWidget.id, (current) => ({
        ...current,
        isOn: !current.isOn,
        status: current.isOn ? 'off' : 'auto',
      }));
      return;
    }
    actions.toggleClimatePower();
  };

  const setClimateTargetTemp = (nextValue: number, widget?: Widget) => {
    const { targetWidget, entityId, minTemp, maxTemp, step } = resolveClimateTargetContext(widget);
    const safeStep = step > 0 ? step : 0.5;
    const safeMin = minTemp ?? Number.NEGATIVE_INFINITY;
    const safeMax = maxTemp ?? Number.POSITIVE_INFINITY;
    const safeTarget = clamp(Math.round(nextValue / safeStep) * safeStep, safeMin, safeMax);

    if (isHaConnected && entityId) {
      upsertClimatePending(entityId, {
        targetTemp: safeTarget,
        targetTempLow: undefined,
        targetTempHigh: undefined,
      });
      queueClimateCommandDispatch(entityId, {
        targetTemp: safeTarget,
        targetTempLow: undefined,
        targetTempHigh: undefined,
      });
      return;
    }
    if (targetWidget?.kind === 'climate' && targetWidget.id !== 'climate.air_conditioner') {
      updateWidget(targetWidget.id, (current) => ({
        ...current,
        value: safeTarget,
      }));
      return;
    }
    actions.setClimateTarget(safeTarget);
  };

  const setClimateTargetRange = (nextLow: number, nextHigh: number, widget?: Widget) => {
    const { targetWidget, entityId, minTemp, maxTemp, step } = resolveClimateTargetContext(widget);
    const safeStep = step > 0 ? step : 0.5;
    const safeMin = minTemp ?? Number.NEGATIVE_INFINITY;
    const safeMax = maxTemp ?? Number.POSITIVE_INFINITY;
    const safeLow = clamp(Math.round(nextLow / safeStep) * safeStep, safeMin, safeMax);
    const safeHigh = clamp(Math.round(nextHigh / safeStep) * safeStep, safeMin, safeMax);
    const low = Math.min(safeLow, safeHigh);
    const high = Math.max(safeLow, safeHigh);

    if (isHaConnected && entityId) {
      upsertClimatePending(entityId, {
        targetTemp: Math.round(((low + high) / 2) * 10) / 10,
        targetTempLow: low,
        targetTempHigh: high,
      });
      queueClimateCommandDispatch(entityId, {
        targetTemp: Math.round(((low + high) / 2) * 10) / 10,
        targetTempLow: low,
        targetTempHigh: high,
      });
      return;
    }
    if (targetWidget?.kind === 'climate' && targetWidget.id !== 'climate.air_conditioner') {
      updateWidget(targetWidget.id, (current) => ({
        ...current,
        value: Math.round(((low + high) / 2) * 10) / 10,
      }));
      return;
    }
    actions.setClimateTargetRange(low, high);
  };

  const increaseClimateTarget = () => {
    if (!isHaConnected && activeWidget?.kind !== 'climate') {
      actions.increaseClimateTarget();
      return;
    }
    const { currentTemp, targetTemp } = resolveClimateTargetContext();
    const currentTarget = Number.isFinite(targetTemp) ? targetTemp : currentTemp;
    setClimateTargetTemp(currentTarget + 0.5);
  };

  const decreaseClimateTarget = () => {
    if (!isHaConnected && activeWidget?.kind !== 'climate') {
      actions.decreaseClimateTarget();
      return;
    }
    const { currentTemp, targetTemp } = resolveClimateTargetContext();
    const currentTarget = Number.isFinite(targetTemp) ? targetTemp : currentTemp;
    setClimateTargetTemp(currentTarget - 0.5);
  };

  const autoAdjustClimate = () => {
    if (!isHaConnected && activeWidget?.kind !== 'climate') {
      actions.autoAdjustClimate();
      return;
    }
    const { currentTemp } = resolveClimateTargetContext();
    const currentValue = Number.isFinite(currentTemp) ? currentTemp : state.climate.currentTemp;
    setClimateTargetTemp(currentValue);
  };

  const resolveAlarmTargetContext = (widget?: Widget) => {
    const targetWidget = widget?.kind === 'alarm' ? widget : activeWidget?.kind === 'alarm' ? activeWidget : undefined;
    const entityId = targetWidget?.entityId;
    return {
      targetWidget,
      entityId,
    };
  };

  const callAlarmAction = (service: AlarmServiceName, code?: string, widget?: Widget) => {
    const { targetWidget, entityId } = resolveAlarmTargetContext(widget);
    const activityMaxEntries = resolveActivityMaxEntries(targetWidget?.activityLogLimit);
    const trimmedCode = code?.trim();
    if (isHaConnected && entityId) {
      const optimisticActor = haCurrentUser?.name ?? DEFAULT_ACTIVITY_ACTOR;
      const optimisticVerb =
        service === 'alarm_disarm'
          ? 'ha disinserito'
          : service === 'alarm_arm_home'
            ? 'ha inserito Casa'
            : service === 'alarm_arm_away'
              ? 'ha inserito Fuori'
              : service === 'alarm_arm_night'
                ? 'ha inserito Notte'
                : service === 'alarm_arm_vacation'
                  ? 'ha inserito Vacanza'
                  : service === 'alarm_arm_custom_bypass'
                    ? 'ha inserito Bypass'
                    : 'ha attivato il trigger';
      const optimisticTimestamp = Date.now();
      const optimisticEntry: ActivityTimelineEntry = {
        id: `optimistic-alarm-${service}-${optimisticTimestamp}-${Math.random().toString(16).slice(2, 8)}`,
        text: `${optimisticActor} ${optimisticVerb} ${formatActivityTimeLabel(optimisticTimestamp)}`,
        timestampMs: optimisticTimestamp,
        actor: optimisticActor,
      };
      setAlarmTimelineByEntity((current) => ({
        ...current,
        [entityId]: [optimisticEntry, ...(current[entityId] ?? [])].slice(0, activityMaxEntries),
      }));
      const payload: Record<string, unknown> = { entity_id: entityId };
      if (trimmedCode) {
        payload.code = trimmedCode;
      }
      void callHaService('alarm_control_panel', service, payload);
      return;
    }
    if (targetWidget?.kind === 'alarm') {
      const nextState = resolveAlarmNextState(service);
      updateWidget(targetWidget.id, (current) => ({
        ...current,
        status: nextState,
        isOn: isAlarmArmedState(nextState),
      }));
    }
  };

  const disarmAlarm = (code?: string, widget?: Widget) => {
    callAlarmAction('alarm_disarm', code, widget);
  };

  const armAlarmHome = (code?: string, widget?: Widget) => {
    callAlarmAction('alarm_arm_home', code, widget);
  };

  const armAlarmAway = (code?: string, widget?: Widget) => {
    callAlarmAction('alarm_arm_away', code, widget);
  };

  const armAlarmNight = (code?: string, widget?: Widget) => {
    callAlarmAction('alarm_arm_night', code, widget);
  };

  const armAlarmVacation = (code?: string, widget?: Widget) => {
    callAlarmAction('alarm_arm_vacation', code, widget);
  };

  const armAlarmCustomBypass = (code?: string, widget?: Widget) => {
    callAlarmAction('alarm_arm_custom_bypass', code, widget);
  };

  const triggerAlarm = (code?: string, widget?: Widget) => {
    callAlarmAction('alarm_trigger', code, widget);
  };

  const armAlarmByMode = (
    mode: 'home' | 'away' | 'night' | 'vacation' | 'custom_bypass',
    code?: string,
    widget?: Widget,
  ) => {
    if (mode === 'home') {
      armAlarmHome(code, widget);
      return;
    }
    if (mode === 'away') {
      armAlarmAway(code, widget);
      return;
    }
    if (mode === 'night') {
      armAlarmNight(code, widget);
      return;
    }
    if (mode === 'vacation') {
      armAlarmVacation(code, widget);
      return;
    }
    armAlarmCustomBypass(code, widget);
  };

  const resolveLockTargetContext = (widget?: Widget) => {
    const targetWidget = widget?.kind === 'lock' ? widget : activeWidget?.kind === 'lock' ? activeWidget : undefined;
    const entityId = targetWidget?.entityId;
    const liveEntity = entityId && isHaConnected ? haStatesForUi[entityId] : undefined;
    const rawAttributes = liveEntity?.rawAttributes;
    const stateValue = normalizeLockState(
      toTrimmedString(liveEntity?.state) ??
        toTrimmedString(liveEntity?.stateLabel) ??
        targetWidget?.status,
    );
    const defaultCode = targetWidget?.lockCode?.trim() || undefined;
    return {
      targetWidget,
      entityId,
      liveEntity,
      rawAttributes,
      stateValue,
      defaultCode,
    };
  };

  const callLockAction = (service: 'lock' | 'unlock' | 'open', code?: string, widget?: Widget) => {
    const { targetWidget, entityId, defaultCode } = resolveLockTargetContext(widget);
    const activityMaxEntries = resolveActivityMaxEntries(targetWidget?.activityLogLimit);
    const actionCode = code?.trim() || defaultCode;

    if (isHaConnected && entityId) {
      const optimisticActor = haCurrentUser?.name ?? DEFAULT_ACTIVITY_ACTOR;
      const optimisticVerb =
        service === 'lock' ? 'ha bloccato' : service === 'unlock' ? 'ha sbloccato' : 'ha aperto';
      const optimisticTimestamp = Date.now();
      const optimisticEntry: ActivityTimelineEntry = {
        id: `optimistic-lock-${service}-${optimisticTimestamp}-${Math.random().toString(16).slice(2, 8)}`,
        text: `${optimisticActor} ${optimisticVerb} ${formatActivityTimeLabel(optimisticTimestamp)}`,
        timestampMs: optimisticTimestamp,
        actor: optimisticActor,
      };
      setLockTimelineByEntity((current) => ({
        ...current,
        [entityId]: [optimisticEntry, ...(current[entityId] ?? [])].slice(0, activityMaxEntries),
      }));
      const payload: Record<string, unknown> = { entity_id: entityId };
      if (actionCode) {
        payload.code = actionCode;
      }
      void callHaService('lock', service, payload);
      return;
    }

    if (!targetWidget) {
      return;
    }

    const nextState = service === 'lock' ? 'locked' : service === 'open' ? 'open' : 'unlocked';
    updateWidget(targetWidget.id, (current) => ({
      ...current,
      status: nextState,
      isOn: isLockLockedState(nextState),
    }));
  };

  const lockDoor = (code?: string, widget?: Widget) => {
    callLockAction('lock', code, widget);
  };

  const unlockDoor = (code?: string, widget?: Widget) => {
    callLockAction('unlock', code, widget);
  };

  const openDoor = (code?: string, widget?: Widget) => {
    callLockAction('open', code, widget);
  };

  const toggleLockDoor = (widget?: Widget) => {
    const { stateValue, rawAttributes, liveEntity } = resolveLockTargetContext(widget);
    const isLocked = isLockLockedState(stateValue);
    const supportedFeatures =
      typeof liveEntity?.supportedFeatures === 'number'
        ? liveEntity.supportedFeatures
        : toFiniteNumber(rawAttributes?.supported_features);
    const supportsOpen =
      supportedFeatures === undefined || supportedFeatures === 0 || (supportedFeatures & LOCK_FEATURE_OPEN) !== 0;

    if (stateValue === 'open' && supportsOpen) {
      lockDoor(undefined, widget);
      return;
    }
    if (isLocked) {
      unlockDoor(undefined, widget);
      return;
    }
    lockDoor(undefined, widget);
  };

  const resolveCoverTargetContext = (widget?: Widget) => {
    const targetWidget = widget?.kind === 'cover' ? widget : activeWidget?.kind === 'cover' ? activeWidget : undefined;
    const entityId = targetWidget?.entityId;
    const liveEntity = entityId && isHaConnected ? haStatesForUi[entityId] : undefined;
    const rawAttributes = liveEntity?.rawAttributes;
    const stateValue = normalizeCoverState(
      toTrimmedString(liveEntity?.state) ??
        toTrimmedString(liveEntity?.stateLabel) ??
        targetWidget?.status,
    );
    const position = resolveCoverPosition(
      stateValue,
      rawAttributes?.current_position ?? rawAttributes?.position ?? targetWidget?.value,
      typeof targetWidget?.value === 'number' ? targetWidget.value : 70,
    );
    const tiltPosition = resolveCoverTiltPosition(
      rawAttributes?.current_tilt_position ?? rawAttributes?.tilt_position ?? targetWidget?.coverTiltPosition,
      typeof targetWidget?.coverTiltPosition === 'number' ? targetWidget.coverTiltPosition : 50,
    );
    const supportedFeatures = resolveCoverSupportedFeatures(liveEntity);
    return {
      targetWidget,
      entityId,
      stateValue,
      position,
      tiltPosition,
      supportedFeatures,
    };
  };

  const openCover = (widget?: Widget) => {
    const { targetWidget, entityId } = resolveCoverTargetContext(widget);
    if (isHaConnected && entityId) {
      upsertCoverPending(entityId, {
        state: 'opening',
        position: 100,
      });
      void callHaService('cover', 'open_cover', { entity_id: entityId });
      return;
    }
    if (!targetWidget) {
      return;
    }
    updateWidget(targetWidget.id, (current) => ({
      ...current,
      status: 'open',
      value: 100,
      isOn: true,
    }));
  };

  const closeCover = (widget?: Widget) => {
    const { targetWidget, entityId } = resolveCoverTargetContext(widget);
    if (isHaConnected && entityId) {
      upsertCoverPending(entityId, {
        state: 'closing',
        position: 0,
      });
      void callHaService('cover', 'close_cover', { entity_id: entityId });
      return;
    }
    if (!targetWidget) {
      return;
    }
    updateWidget(targetWidget.id, (current) => ({
      ...current,
      status: 'closed',
      value: 0,
      isOn: false,
    }));
  };

  const stopCover = (widget?: Widget) => {
    const { targetWidget, entityId, position } = resolveCoverTargetContext(widget);
    if (isHaConnected && entityId) {
      upsertCoverPending(entityId, {
        state: 'stopped',
        position,
      });
      void callHaService('cover', 'stop_cover', { entity_id: entityId });
      return;
    }
    if (!targetWidget) {
      return;
    }
    updateWidget(targetWidget.id, (current) => ({
      ...current,
      status: 'stopped',
      value: position,
      isOn: position > 0,
    }));
  };

  const setCoverPosition = (position: number, widget?: Widget) => {
    const { targetWidget, entityId, position: currentPosition } = resolveCoverTargetContext(widget);
    const safePosition = clampPercent(position);
    if (isHaConnected && entityId) {
      const pendingState =
        safePosition > currentPosition
          ? 'opening'
          : safePosition < currentPosition
            ? 'closing'
            : 'stopped';
      upsertCoverPending(entityId, {
        state: pendingState,
        position: safePosition,
      });
      void callHaService('cover', 'set_cover_position', {
        entity_id: entityId,
        position: safePosition,
      });
      return;
    }
    if (!targetWidget) {
      return;
    }
    updateWidget(targetWidget.id, (current) => ({
      ...current,
      status: safePosition <= 0 ? 'closed' : 'open',
      value: safePosition,
      isOn: safePosition > 0,
    }));
  };

  const setCoverTiltPosition = (position: number, widget?: Widget) => {
    const { targetWidget, entityId } = resolveCoverTargetContext(widget);
    const safePosition = clampPercent(position);
    if (isHaConnected && entityId) {
      upsertCoverPending(entityId, {
        tiltPosition: safePosition,
      });
      void callHaService('cover', 'set_cover_tilt_position', {
        entity_id: entityId,
        tilt_position: safePosition,
      });
      return;
    }
    if (!targetWidget) {
      return;
    }
    updateWidget(targetWidget.id, (current) => ({
      ...current,
      coverTiltPosition: safePosition,
    }));
  };

  const resolveVacuumTargetContext = (widget?: Widget) => {
    const targetWidget = widget?.kind === 'vacuum' ? widget : activeWidget?.kind === 'vacuum' ? activeWidget : undefined;
    const entityId = targetWidget?.entityId;
    const liveEntity = entityId && isHaConnected ? haStatesForUi[entityId] : undefined;
    const stateValue = normalizeVacuumState(
      toTrimmedString(liveEntity?.stateLabel) ??
        toTrimmedString(liveEntity?.state) ??
        targetWidget?.status,
    );
    return {
      targetWidget,
      entityId,
      liveEntity,
      stateValue,
    };
  };

  const cancelVacuumReturnTimer = (widgetId: string) => {
    const timers = vacuumReturnToBaseTimeoutRef.current;
    const timeoutId = timers[widgetId];
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      delete timers[widgetId];
    }
  };

  const scheduleVacuumDocking = (widgetId: string) => {
    cancelVacuumReturnTimer(widgetId);
    vacuumReturnToBaseTimeoutRef.current[widgetId] = window.setTimeout(() => {
      setWidgets((prev) =>
        prev.map((entry) => {
          if (entry.id !== widgetId || entry.kind !== 'vacuum') {
            return entry;
          }
          return {
            ...entry,
            status: 'docked',
            isOn: false,
          };
        }),
      );
      delete vacuumReturnToBaseTimeoutRef.current[widgetId];
    }, 3800);
  };

  const callVacuumService = (
    service: 'start' | 'pause' | 'stop' | 'return_to_base' | 'locate' | 'clean_spot',
    widget?: Widget,
  ) => {
    const { targetWidget, entityId } = resolveVacuumTargetContext(widget);
    if (isHaConnected && entityId) {
      void callHaService('vacuum', service, { entity_id: entityId });
      return;
    }

    if (!targetWidget) {
      return;
    }

    const fallbackStatus =
      service === 'start'
        ? 'cleaning'
        : service === 'pause'
          ? 'paused'
          : service === 'return_to_base'
            ? 'returning'
            : service === 'clean_spot'
              ? 'cleaning'
              : service === 'locate'
                ? targetWidget.status
                : 'idle';
    cancelVacuumReturnTimer(targetWidget.id);
    updateWidget(targetWidget.id, (current) => {
      const normalizedFallback = normalizeVacuumState(fallbackStatus);
      const baseArea =
        typeof current.vacuumCleanedArea === 'number' && Number.isFinite(current.vacuumCleanedArea)
          ? current.vacuumCleanedArea
          : 45;
      const baseMinutes =
        typeof current.vacuumCleaningMinutes === 'number' && Number.isFinite(current.vacuumCleaningMinutes)
          ? current.vacuumCleaningMinutes
          : 32;

      const nextArea =
        service === 'clean_spot'
          ? Math.round((baseArea + 1.2) * 10) / 10
          : Math.round(baseArea * 10) / 10;
      const nextMinutes = service === 'clean_spot' ? Math.round(baseMinutes + 3) : Math.round(baseMinutes);

      return {
        ...current,
        status: fallbackStatus,
        isOn: ['cleaning', 'paused', 'returning'].includes(normalizedFallback),
        vacuumCleanedArea: nextArea,
        vacuumCleaningMinutes: nextMinutes,
      };
    });
    if (service === 'return_to_base') {
      scheduleVacuumDocking(targetWidget.id);
    }
  };

  const startVacuum = (widget?: Widget) => {
    callVacuumService('start', widget);
  };

  const pauseVacuum = (widget?: Widget) => {
    callVacuumService('pause', widget);
  };

  const stopVacuum = (widget?: Widget) => {
    callVacuumService('stop', widget);
  };

  const returnVacuumToBase = (widget?: Widget) => {
    callVacuumService('return_to_base', widget);
  };

  const locateVacuum = (widget?: Widget) => {
    callVacuumService('locate', widget);
  };

  const cleanVacuumSpot = (widget?: Widget) => {
    callVacuumService('clean_spot', widget);
  };

  const cleanVacuumArea = (areaIds: string[], widget?: Widget) => {
    const normalizedAreaIds = Array.from(
      new Set(
        areaIds
          .map((areaId) => areaId.trim())
          .filter((areaId) => areaId.length > 0),
      ),
    );
    if (!normalizedAreaIds.length) {
      return;
    }

    const { targetWidget, entityId } = resolveVacuumTargetContext(widget);
    if (isHaConnected && entityId) {
      void callHaService('vacuum', 'clean_area', {
        entity_id: entityId,
        cleaning_area_id: normalizedAreaIds,
      });
      return;
    }
    if (!targetWidget) {
      return;
    }
    cancelVacuumReturnTimer(targetWidget.id);
    updateWidget(targetWidget.id, (current) => {
      const baseArea =
        typeof current.vacuumCleanedArea === 'number' && Number.isFinite(current.vacuumCleanedArea)
          ? current.vacuumCleanedArea
          : 45;
      const baseMinutes =
        typeof current.vacuumCleaningMinutes === 'number' && Number.isFinite(current.vacuumCleaningMinutes)
          ? current.vacuumCleaningMinutes
          : 32;
      return {
        ...current,
        status: 'cleaning',
        isOn: true,
        vacuumCleanedArea: Math.round((baseArea + Math.max(1, normalizedAreaIds.length) * 1.5) * 10) / 10,
        vacuumCleaningMinutes: Math.round(baseMinutes + Math.max(1, normalizedAreaIds.length) * 4),
      };
    });
  };

  const setVacuumFanSpeed = (fanSpeed: string, widget?: Widget) => {
    const trimmed = fanSpeed.trim();
    if (!trimmed) {
      return;
    }
    const { targetWidget, entityId } = resolveVacuumTargetContext(widget);
    if (isHaConnected && entityId) {
      void callHaService('vacuum', 'set_fan_speed', {
        entity_id: entityId,
        fan_speed: trimmed,
      });
      return;
    }
    if (!targetWidget) {
      return;
    }
    updateWidget(targetWidget.id, (current) => ({
      ...current,
      status: current.status,
      vacuumFanSpeed: trimmed,
    }));
  };

  const sendVacuumCommand = (command: string, params?: unknown, widget?: Widget) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) {
      return;
    }
    const { entityId, targetWidget } = resolveVacuumTargetContext(widget);
    if (isHaConnected && entityId) {
      const payload: Record<string, unknown> = {
        entity_id: entityId,
        command: trimmedCommand,
      };
      if (params !== undefined) {
        payload.params = params as Record<string, unknown> | unknown[];
      }
      void callHaService('vacuum', 'send_command', payload);
      return;
    }
    if (!targetWidget) {
      return;
    }
    const normalized = trimmedCommand.toLowerCase();
    updateWidget(targetWidget.id, (current) => ({
      ...current,
      status:
        normalized.includes('return')
          ? 'returning'
          : normalized.includes('pause')
            ? 'paused'
            : normalized.includes('start') || normalized.includes('clean')
              ? 'cleaning'
              : current.status,
      isOn:
        normalized.includes('return') ||
        normalized.includes('pause') ||
        normalized.includes('start') ||
        normalized.includes('clean')
          ? true
          : current.isOn,
    }));
    if (normalized.includes('return')) {
      scheduleVacuumDocking(targetWidget.id);
    }
  };

  const toggleVacuumStartPause = (widget?: Widget) => {
    const { stateValue } = resolveVacuumTargetContext(widget);
    if (stateValue === 'cleaning') {
      pauseVacuum(widget);
      return;
    }
    startVacuum(widget);
  };

  const toggleMediaPlayback = (widget?: Widget) => {
    const targetWidget = widget ?? activeWidget;
    const entityId = targetWidget?.kind === 'media' ? targetWidget.entityId : undefined;
    if (isHaConnected && entityId) {
      void callHaService('media_player', 'media_play_pause', { entity_id: entityId });
      return;
    }
    if (targetWidget?.kind === 'media') {
      updateWidget(targetWidget.id, (current) => {
        const nextState = resolveMediaState(current.status);
        const nextPlaying = nextState !== 'playing';
        const nextStatus = nextPlaying ? 'playing' : 'paused';
        const nextLayout = resolveMediaLayout(current);
        return {
          ...current,
          isOn: nextPlaying,
          status: nextStatus,
          layout: nextLayout,
        };
      });
      return;
    }
    actions.toggleSpeakerPlayback();
  };

  const toggleMediaPower = () => {
    const targetWidget = activeWidget?.kind === 'media' ? activeWidget : undefined;
    const entityId = targetWidget?.entityId;
    const liveEntity = entityId && isHaConnected ? haStatesForUi[entityId] : undefined;
    if (isHaConnected && entityId) {
      const mediaState = resolveMediaState(liveEntity?.stateLabel ?? liveEntity?.state ?? targetWidget?.status);
      const shouldTurnOn = mediaState === 'idle' || mediaState === 'unavailable' || (liveEntity?.state ?? '').toLowerCase() === 'off';
      void callHaService('media_player', shouldTurnOn ? 'turn_on' : 'turn_off', { entity_id: entityId });
      return;
    }
    actions.toggleSpeakerPower();
  };

  const previousMediaTrack = () => {
    const targetWidget = activeWidget?.kind === 'media' ? activeWidget : undefined;
    const entityId = targetWidget?.entityId;
    if (isHaConnected && entityId) {
      void callHaService('media_player', 'media_previous_track', { entity_id: entityId });
      return;
    }
    actions.previousSpeakerTrack();
  };

  const nextMediaTrack = () => {
    const targetWidget = activeWidget?.kind === 'media' ? activeWidget : undefined;
    const entityId = targetWidget?.entityId;
    if (isHaConnected && entityId) {
      void callHaService('media_player', 'media_next_track', { entity_id: entityId });
      return;
    }
    actions.nextSpeakerTrack();
  };

  const seekMediaPosition = (nextPosition: number, widget?: Widget) => {
    const targetWidget =
      widget?.kind === 'media'
        ? widget
        : activeWidget?.kind === 'media'
          ? activeWidget
          : undefined;
    const entityId = targetWidget?.entityId;
    const liveEntity = entityId && isHaConnected ? haStatesForUi[entityId] : undefined;
    const durationSeconds =
      typeof liveEntity?.mediaDuration === 'number'
        ? Math.max(0, Math.round(liveEntity.mediaDuration))
        : contextSpeaker.durationSeconds ?? 0;
    if (durationSeconds <= 0) {
      if (!isHaConnected) {
        actions.setSpeakerProgress(0);
      }
      return;
    }
    const safePosition = clamp(Math.round(nextPosition), 0, durationSeconds);

    if (isHaConnected && entityId) {
      void callHaService('media_player', 'media_seek', {
        entity_id: entityId,
        seek_position: safePosition,
      });
      return;
    }

    const progress = Math.round((safePosition / durationSeconds) * 100);
    if (targetWidget?.kind === 'media') {
      updateWidget(targetWidget.id, (current) => ({
        ...current,
        value: progress,
      }));
    }
    actions.setSpeakerProgress(progress);
  };

  const setMediaVolume = (nextVolume: number) => {
    const targetWidget = activeWidget?.kind === 'media' ? activeWidget : undefined;
    const entityId = targetWidget?.entityId;
    const safeVolume = clamp(Math.round(nextVolume), 0, 100);
    if (isHaConnected && entityId) {
      void callHaService('media_player', 'volume_set', {
        entity_id: entityId,
        volume_level: safeVolume / 100,
      });
      return;
    }
    actions.setSpeakerVolume(safeVolume);
  };

  const toggleMediaMute = () => {
    const targetWidget = activeWidget?.kind === 'media' ? activeWidget : undefined;
    const entityId = targetWidget?.entityId;
    const liveEntity = entityId && isHaConnected ? haStatesForUi[entityId] : undefined;
    const currentMuted =
      typeof liveEntity?.mediaMuted === 'boolean' ? liveEntity.mediaMuted : Boolean(contextSpeaker.muted);
    const nextMuted = !currentMuted;
    if (isHaConnected && entityId) {
      // Optimistic fallback when the entity does not expose is_volume_muted.
      if (typeof liveEntity?.mediaMuted !== 'boolean') {
        actions.toggleSpeakerMute();
      }
      void callHaService('media_player', 'volume_mute', {
        entity_id: entityId,
        is_volume_muted: nextMuted,
      });
      return;
    }
    actions.toggleSpeakerMute();
  };

  const buildCameraPtzMovePayloads = (
    entityId: string,
    direction: CameraPtzDirection,
    serviceTarget: CameraPtzServiceTarget,
  ) => {
    const vector = CAMERA_PTZ_DIRECTION_VECTORS[direction];
    const hasField = (field: string) => serviceTarget.fields.has(field);
    const payloads: Array<Record<string, unknown>> = [];
    const basePayload: Record<string, unknown> = { entity_id: entityId };

    if (hasField('movement')) {
      payloads.push({ ...basePayload, movement: vector.movement });
      payloads.push({ ...basePayload, movement: vector.movement.toUpperCase() });
      payloads.push({ ...basePayload, movement: vector.movement.replace('_', '-') });
    }

    const panField = hasField('pan_velocity') ? 'pan_velocity' : hasField('pan') ? 'pan' : undefined;
    const tiltField = hasField('tilt_velocity') ? 'tilt_velocity' : hasField('tilt') ? 'tilt' : undefined;
    const zoomField = hasField('zoom_velocity') ? 'zoom_velocity' : hasField('zoom') ? 'zoom' : undefined;
    const dynamicPayload: Record<string, unknown> = { ...basePayload };

    if (panField) {
      dynamicPayload[panField] = vector.pan;
    }
    if (tiltField) {
      dynamicPayload[tiltField] = vector.tilt;
    }
    if (zoomField) {
      dynamicPayload[zoomField] = 0;
    }
    if (hasField('distance')) {
      dynamicPayload.distance = 0.15;
    }
    if (hasField('speed')) {
      dynamicPayload.speed = 0.5;
    }
    if (hasField('move_mode')) {
      dynamicPayload.move_mode = 'ContinuousMove';
    }
    if (hasField('continuous_duration')) {
      dynamicPayload.continuous_duration = 0.5;
    }
    if (Object.keys(dynamicPayload).length > 1) {
      payloads.push(dynamicPayload);
    }

    payloads.push({
      ...basePayload,
      pan: vector.pan,
      tilt: vector.tilt,
      zoom: 0,
      speed: 0.5,
      move_mode: 'ContinuousMove',
    });

    const seen = new Set<string>();
    return payloads.filter((payload) => {
      const key = JSON.stringify(payload);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const buildCameraPtzStopPayloads = (
    entityId: string,
    serviceTarget: CameraPtzServiceTarget,
  ) => {
    const hasField = (field: string) => serviceTarget.fields.has(field);
    const payloads: Array<Record<string, unknown>> = [];
    const basePayload: Record<string, unknown> = { entity_id: entityId };

    if (hasField('movement')) {
      payloads.push({ ...basePayload, movement: 'stop' });
      payloads.push({ ...basePayload, movement: 'STOP' });
    }

    const panField = hasField('pan_velocity') ? 'pan_velocity' : hasField('pan') ? 'pan' : undefined;
    const tiltField = hasField('tilt_velocity') ? 'tilt_velocity' : hasField('tilt') ? 'tilt' : undefined;
    const zoomField = hasField('zoom_velocity') ? 'zoom_velocity' : hasField('zoom') ? 'zoom' : undefined;
    const dynamicPayload: Record<string, unknown> = { ...basePayload };

    if (panField) {
      dynamicPayload[panField] = 0;
    }
    if (tiltField) {
      dynamicPayload[tiltField] = 0;
    }
    if (zoomField) {
      dynamicPayload[zoomField] = 0;
    }
    if (hasField('move_mode')) {
      dynamicPayload.move_mode = 'Stop';
    }
    if (Object.keys(dynamicPayload).length > 1) {
      payloads.push(dynamicPayload);
    }

    payloads.push({ ...basePayload, move_mode: 'Stop' });
    payloads.push({ ...basePayload, movement: 'stop' });

    const seen = new Set<string>();
    return payloads.filter((payload) => {
      const key = JSON.stringify(payload);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const runCameraPtzPayloads = async (
    serviceTarget: CameraPtzServiceTarget,
    payloads: Array<Record<string, unknown>>,
  ) => {
    for (const payload of payloads) {
      const success = await callHaService(serviceTarget.domain, serviceTarget.service, payload);
      if (success) {
        return true;
      }
    }
    return false;
  };

  const runCameraPtzButtonPresses = async (entityIds: string[]) => {
    let success = false;
    for (const buttonEntityId of entityIds) {
      const pressed = await callHaService('button', 'press', {
        entity_id: buttonEntityId,
      });
      if (pressed) {
        success = true;
      }
    }
    return success;
  };

  const resolveCameraPtzTargets = () => {
    if (cameraPtzServiceTarget) {
      return [cameraPtzServiceTarget];
    }
    return CAMERA_PTZ_SERVICE_CANDIDATES.map((candidate) => ({
      domain: candidate.domain,
      service: candidate.service,
      fields: new Set<string>(),
    }));
  };

  const moveCameraPtz = (direction: CameraPtzDirection) => {
    if (!isHaConnected) {
      return;
    }
    const targetWidget = activeWidget?.kind === 'camera' ? activeWidget : undefined;
    const entityId = (contextCamera.entityId ?? targetWidget?.entityId ?? '').trim();
    if (!entityId || !contextCamera.supportsPtz) {
      return;
    }

    const buttonSequence = resolveCameraPtzButtonPressSequence(direction, cameraPtzButtons);
    if (buttonSequence.length > 0) {
      cameraPtzControlModeRef.current = 'button';
      void runCameraPtzButtonPresses(buttonSequence);
      return;
    }
    if (cameraHasPtzButtons && !cameraPtzServiceTarget) {
      return;
    }

    cameraPtzControlModeRef.current = 'service';
    const serviceTargets = resolveCameraPtzTargets();
    void (async () => {
      for (const serviceTarget of serviceTargets) {
        const payloads = buildCameraPtzMovePayloads(entityId, direction, serviceTarget);
        const success = await runCameraPtzPayloads(serviceTarget, payloads);
        if (success) {
          return;
        }
      }
    })();
  };

  const stopCameraPtz = () => {
    if (!isHaConnected) {
      return;
    }
    const controlMode = cameraPtzControlModeRef.current;
    if (controlMode === 'button') {
      cameraPtzControlModeRef.current = null;
      return;
    }
    const targetWidget = activeWidget?.kind === 'camera' ? activeWidget : undefined;
    const entityId = (contextCamera.entityId ?? targetWidget?.entityId ?? '').trim();
    if (!entityId || !contextCamera.supportsPtz) {
      cameraPtzControlModeRef.current = null;
      return;
    }
    if (cameraHasPtzButtons && !cameraPtzServiceTarget) {
      cameraPtzControlModeRef.current = null;
      return;
    }
    const serviceTargets = resolveCameraPtzTargets();
    void (async () => {
      for (const serviceTarget of serviceTargets) {
        const payloads = buildCameraPtzStopPayloads(entityId, serviceTarget);
        const success = await runCameraPtzPayloads(serviceTarget, payloads);
        if (success) {
          cameraPtzControlModeRef.current = null;
          return;
        }
      }
      cameraPtzControlModeRef.current = null;
    })();
  };

  const loadSensorHistory = useCallback(
    async (entityId: string) => {
      const normalizedEntityId = entityId.trim();
      if (!normalizedEntityId || !isHaConnected) {
        return null;
      }
      if (sensorHistoryInFlightRef.current[normalizedEntityId]) {
        return null;
      }
      sensorHistoryInFlightRef.current[normalizedEntityId] = true;
      try {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - SENSOR_HISTORY_WINDOW_HOURS * 60 * 60 * 1000);
        const payload = await callHaApi<unknown>(
          {
            type: 'history/history_during_period',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            entity_ids: [normalizedEntityId],
            include_start_time_state: true,
            significant_changes_only: false,
            minimal_response: true,
            no_attributes: true,
          },
          { reportError: false },
        );
        if (payload === null) {
          return null;
        }
        const nextHistory = extractSensorHistoryValues(payload, normalizedEntityId, SENSOR_HISTORY_MAX_POINTS);
        setSensorHistoryByEntity((current) =>
          sameNumberSeries(current[normalizedEntityId], nextHistory)
            ? current
            : { ...current, [normalizedEntityId]: nextHistory },
        );
        return nextHistory;
      } finally {
        delete sensorHistoryInFlightRef.current[normalizedEntityId];
      }
    },
    [callHaApi, isHaConnected],
  );

  const openLiveControls = (widget: Widget) => {
    const liveEntity = isHaConnected ? haStatesForUi[widget.entityId] : undefined;

    if (widget.kind === 'camera') {
      const rawAttributes = liveEntity?.rawAttributes;
      const stateValue = normalizeCameraState(
        toTrimmedString(liveEntity?.stateLabel) ??
          toTrimmedString(liveEntity?.state) ??
          widget.status,
      );
      setActiveDevice({
        id: widget.id,
        type: 'camera',
        name:
          toTrimmedString(rawAttributes?.friendly_name) ??
          widget.title,
        status: isCameraOfflineState(stateValue) ? 'Offline' : 'Live',
      });
      return;
    }

    if (widget.kind === 'sensor') {
      const sensorMeta = resolveSensorMeta(widget, liveEntity, haStatesForUi);
      const sensorHistory = sensorHistoryByEntity[widget.entityId] ?? [];
      setActiveDevice({
        id: widget.id,
        type: 'sensor',
        name: widget.title,
        status: sensorMeta.status,
        sensorValue:
          typeof liveEntity?.numericValue === 'number'
            ? liveEntity.numericValue
            : widget.entityId === 'sensor.nest_wifi_download'
              ? state.wifiDownloadMbps
              : widget.value ?? 48,
        sensorUnit: liveEntity?.unit ?? widget.unit ?? '%',
        sensorHistory,
        sensorBattery: sensorMeta.battery,
        sensorConnection: sensorMeta.connection,
        sensorConnectionState: sensorMeta.connectionState,
      });
      if (isHaConnected) {
        void loadSensorHistory(widget.entityId).then((nextHistory) => {
          if (!nextHistory) {
            return;
          }
          setActiveDevice((current) => {
            if (!current || current.type !== 'sensor' || current.id !== widget.id) {
              return current;
            }
            if (sameNumberSeries(current.sensorHistory, nextHistory)) {
              return current;
            }
            return {
              ...current,
              sensorHistory: nextHistory,
            };
          });
        });
      }
      return;
    }

    if (widget.kind === 'light') {
      toggleLightEntity(widget);
    }

    if (widget.kind === 'alarm') {
      const rawAttributes = liveEntity?.rawAttributes;
      const supportedFeatures = resolveAlarmSupportedFeatures(liveEntity);
      const stateValue = normalizeAlarmState(
        toTrimmedString(liveEntity?.state) ??
          toTrimmedString(liveEntity?.stateLabel) ??
          widget.status,
      );
      setActiveDevice({
        id: widget.id,
        type: 'alarm',
        name:
          toTrimmedString(rawAttributes?.friendly_name) ??
          widget.title,
        status: stateValue,
        alarmState: stateValue,
        alarmCodeRequired: typeof rawAttributes?.code_arm_required === 'boolean' ? rawAttributes.code_arm_required : false,
        alarmChangedBy: toTrimmedString(rawAttributes?.changed_by),
        alarmSupportedFeatures: supportedFeatures,
      });
      return;
    }

    if (widget.kind === 'vacuum') {
      const useDemoData = !liveEntity && isDemoVacuumEntity(widget.entityId);
      const sourceAttributes = liveEntity?.rawAttributes ?? buildFallbackVacuumAttributes(widget, useDemoData);
      const normalizedState = normalizeVacuumState(
        toTrimmedString(liveEntity?.stateLabel) ??
          toTrimmedString(liveEntity?.state) ??
          widget.status,
      );
      setActiveDevice({
        id: widget.id,
        type: 'vacuum',
        name:
          toTrimmedString(sourceAttributes?.friendly_name) ??
          widget.title,
        status: toTrimmedString(sourceAttributes?.status) ?? translateVacuumState(normalizedState),
        vacuumState: normalizedState,
        vacuumBatteryLevel:
          toFiniteNumber(sourceAttributes?.battery_level) ??
          toFiniteNumber(sourceAttributes?.battery) ??
          toFiniteNumber(widget.value),
        vacuumFanSpeed:
          toTrimmedString(sourceAttributes?.fan_speed) ??
          toTrimmedString(sourceAttributes?.fan_mode) ??
          toTrimmedString(widget.vacuumFanSpeed),
        vacuumMapUrl: resolveVacuumMapUrl(liveEntity, haUrl) ?? toTrimmedString(sourceAttributes?.map_url),
      });
      return;
    }

    if (widget.kind === 'lock') {
      const rawAttributes = liveEntity?.rawAttributes;
      const stateValue = normalizeLockState(
        toTrimmedString(liveEntity?.state) ??
          toTrimmedString(liveEntity?.stateLabel) ??
          widget.status,
      );
      const supportedFeatures =
        typeof liveEntity?.supportedFeatures === 'number'
          ? liveEntity.supportedFeatures
          : toFiniteNumber(rawAttributes?.supported_features);
      const supportsOpen =
        supportedFeatures === undefined || supportedFeatures === 0 || (supportedFeatures & LOCK_FEATURE_OPEN) !== 0;

      setActiveDevice({
        id: widget.id,
        type: 'lock',
        name:
          toTrimmedString(rawAttributes?.friendly_name) ??
          widget.title,
        status: translateLockState(stateValue),
        lockState: stateValue,
        lockChangedBy: toTrimmedString(rawAttributes?.changed_by),
        lockSupportsOpen: supportsOpen,
      });
      return;
    }

    if (widget.kind === 'cover') {
      const rawAttributes = liveEntity?.rawAttributes ?? buildFallbackCoverAttributes(widget);
      const stateValue = normalizeCoverState(
        toTrimmedString(liveEntity?.state) ??
          toTrimmedString(liveEntity?.stateLabel) ??
          widget.status,
      );
      const position = resolveCoverPosition(
        stateValue,
        rawAttributes?.current_position ?? rawAttributes?.position ?? widget.value,
        typeof widget.value === 'number' ? widget.value : 70,
      );
      const tiltPosition = resolveCoverTiltPosition(
        rawAttributes?.current_tilt_position ?? rawAttributes?.tilt_position ?? widget.coverTiltPosition,
        typeof widget.coverTiltPosition === 'number' ? widget.coverTiltPosition : 50,
      );
      const supportedFeatures = resolveCoverSupportedFeatures(liveEntity);

      setActiveDevice({
        id: widget.id,
        type: 'cover',
        name:
          toTrimmedString(rawAttributes?.friendly_name) ??
          widget.title,
        status: `${translateCoverState(stateValue)} ${position}%`,
        coverState: stateValue,
        coverPosition: position,
        coverTiltPosition: tiltPosition,
        coverSupportedFeatures: supportedFeatures,
      });
      return;
    }

    setActiveDevice({
      id: widget.id,
      type: widget.kind,
      name: widget.title,
      status: liveEntity?.stateLabel ?? liveEntity?.state ?? widget.status,
    } as ActiveDevice);
  };

  const clearContextSelection = () => {
    setActiveDevice(null);
    setSelectedWidgetId(null);
    setSelectedSectionId(null);
    setSelectedSidebarPathId(null);
  };

  const openWeatherControls = () => {
    setSelectedWidgetId(null);
    setSelectedSectionId(null);
    setSelectedSidebarPathId(null);
    setActiveDevice({
      id: 'weather.home',
      type: 'weather',
      name: state.weather.location,
      status: state.weather.condition,
    });
  };

  useEffect(() => {
    if (!isHaConnected) {
      setRunningSceneBySectionId((current) =>
        Object.keys(current).length > 0 ? {} : current,
      );
      return;
    }

    setRunningSceneBySectionId((current) => {
      if (Object.keys(current).length === 0) {
        return current;
      }

      const now = Date.now();
      let changed = false;
      const next: Partial<Record<string, SceneRunState>> = { ...current };

      Object.entries(current).forEach(([sectionId, runningScene]) => {
        if (!runningScene || runningScene.actionType !== 'script' || !runningScene.scriptEntityId) {
          return;
        }

        const scriptState = haStates[runningScene.scriptEntityId]?.state?.toLowerCase().trim() ?? '';
        const isScriptRunning = scriptState === 'on' || scriptState === 'running' || scriptState === 'triggered';

        if (isScriptRunning) {
          if (!runningScene.observedRunning) {
            next[sectionId] = {
              ...runningScene,
              observedRunning: true,
            };
            changed = true;
          }
          return;
        }

        if (runningScene.observedRunning) {
          delete next[sectionId];
          changed = true;
          return;
        }

        if (now - runningScene.startedAt > SCENE_SCRIPT_START_GRACE_MS) {
          delete next[sectionId];
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [haStates, isHaConnected]);

  const triggerSceneAction = async (section: DashboardSection, sceneId: SceneKey) => {
    if (isEditMode || section.kind !== 'scenes') {
      return;
    }
    if (runningSceneBySectionId[section.id]) {
      return;
    }

    const sceneLabel = section.sceneLabels?.[sceneId]?.trim() || sceneId.replace(/-/g, ' ');
    if (!isHaConnected) {
      addNotification('warning', 'Connetti Home Assistant per eseguire le azioni delle scene.');
      return;
    }

    const actionConfig = section.sceneActions?.[sceneId];
    const actionType = actionConfig?.type === 'service' ? 'service' : 'script';

    if (actionType === 'service') {
      const configuredService = actionConfig?.service?.trim() ?? '';
      const dotIndex = configuredService.indexOf('.');
      if (!configuredService || dotIndex <= 0 || dotIndex === configuredService.length - 1) {
        addNotification(
          'warning',
          `Servizio non valido per la scena "${sceneLabel}". Usa formato dominio.servizio (es. light.turn_on).`,
        );
        return;
      }

      const domain = configuredService.slice(0, dotIndex);
      const service = configuredService.slice(dotIndex + 1);
      const payloadText = actionConfig?.payloadJson?.trim() ?? '';
      let serviceData: Record<string, unknown> = {};

      if (payloadText.length > 0) {
        try {
          const parsedPayload = JSON.parse(payloadText);
          if (!parsedPayload || typeof parsedPayload !== 'object' || Array.isArray(parsedPayload)) {
            addNotification('alert', `Payload JSON non valido per la scena "${sceneLabel}".`);
            return;
          }
          serviceData = { ...(parsedPayload as Record<string, unknown>) };
        } catch {
          addNotification('alert', `Payload JSON non valido per la scena "${sceneLabel}".`);
          return;
        }
      }

      const configuredEntityId = actionConfig?.entityId?.trim();
      if (configuredEntityId.length && serviceData.entity_id === undefined) {
        serviceData.entity_id = configuredEntityId;
      }

      const startedAt = Date.now();
      setRunningSceneBySectionId((current) => ({
        ...current,
        [section.id]: {
          sceneId,
          startedAt,
          actionType: 'service',
        },
      }));
      let serviceOk = false;
      try {
        serviceOk = await callHaService(domain, service, serviceData);
      } finally {
        setRunningSceneBySectionId((current) => {
          const runningScene = current[section.id];
          if (!runningScene || runningScene.sceneId !== sceneId) {
            return current;
          }
          const next = { ...current };
          delete next[section.id];
          return next;
        });
      }
      if (!serviceOk) {
        addNotification('alert', `Azione scena "${sceneLabel}" non riuscita.`);
      }
      return;
    }

    const configuredScript = actionConfig?.scriptEntityId?.trim() ?? section.sceneScripts?.[sceneId]?.trim() ?? '';
    if (!configuredScript) {
      addNotification('warning', `Nessuno script collegato alla scena "${sceneLabel}".`);
      return;
    }

    const scriptEntityId = configuredScript.startsWith('script.') ? configuredScript : `script.${configuredScript}`;
    const startedAt = Date.now();
    setRunningSceneBySectionId((current) => ({
      ...current,
      [section.id]: {
        sceneId,
        startedAt,
        actionType: 'script',
        scriptEntityId,
        observedRunning: false,
      },
    }));
    let scriptOk = false;
    scriptOk = await callHaService('script', 'turn_on', { entity_id: scriptEntityId });
    if (!scriptOk) {
      setRunningSceneBySectionId((current) => {
        const runningScene = current[section.id];
        if (!runningScene || runningScene.sceneId !== sceneId) {
          return current;
        }
        const next = { ...current };
        delete next[section.id];
        return next;
      });
      addNotification('alert', `Esecuzione scena "${sceneLabel}" non riuscita.`);
    }
  };

  const handleWidgetClick = (widget: Widget) => {
    if (isEditMode) {
      setSelectedWidgetId(widget.id);
      setSelectedSectionId(null);
      setSelectedSidebarPathId(null);
      return;
    }
    setSelectedWidgetId(widget.id);
    setSelectedSectionId(null);
    setSelectedSidebarPathId(null);
    openLiveControls(widget);
  };

  const addWidget = (kind: WidgetKind) => {
    const id = `${kind}.custom_${nextWidgetIdRef.current++}`;
    const selectedStackSection = selectedSectionId
      ? sections.find((section) => section.id === selectedSectionId && isStackSection(section))
      : undefined;
    // Keep catalog insertion explicit:
    // add into a stack only when that stack section is directly selected.
    const targetSection = selectedStackSection;
    const targetSectionId = targetSection?.id;
    const widgetWidth =
      kind === 'climate'
        ? CLIMATE_WIDGET_WIDTH
        : kind === 'sensor' || kind === 'lock'
          ? 1
          : kind === 'media'
            ? MEDIA_WIDGET_MIN_WIDTH
            : kind === 'vacuum'
              ? VACUUM_WIDGET_MIN_WIDTH
              : kind === 'cover'
                ? COVER_WIDGET_MIN_WIDTH
                : 2;
    const widgetBaseHeight =
      kind === 'climate'
        ? CLIMATE_WIDGET_HEIGHT
        : kind === 'light'
          ? LIGHT_WIDGET_HEIGHT_OFF
        : kind === 'sensor' || kind === 'lock'
          ? 1
          : kind === 'camera'
            ? CAMERA_WIDGET_MIN_HEIGHT
            : kind === 'vacuum'
              ? VACUUM_WIDGET_MIN_HEIGHT
              : kind === 'cover'
                ? COVER_WIDGET_MIN_HEIGHT
                : kind === 'media'
                  ? MEDIA_WIDGET_MIN_HEIGHT
                  : 1;
    const widgetHeight = kind === 'climate'
      ? CLIMATE_WIDGET_HEIGHT
      : targetSection
      ? widgetBaseHeight
      : kind === 'light'
        ? LIGHT_WIDGET_HEIGHT_OFF
        : widgetBaseHeight;
    const defaultEntityId = ENTITY_OPTIONS[kind][0];
    const isVacuumDemo = kind === 'vacuum' && isDemoVacuumEntity(defaultEntityId);
    setWidgets((prev) => {
      const baseLayout: GridItem = { i: id, x: 0, y: 0, w: widgetWidth, h: widgetHeight };

      if (targetSection) {
        const stackWidgets = prev.filter((widget) => widget.parentSectionId === targetSectionId);
        const stackCols = resolveStackColumns(targetSection);
        const normalizedSeed = normalizeLayoutForStack(targetSection, baseLayout);
        const occupied = stackWidgets.map((widget) => {
          const normalized = normalizeLayoutForStack(targetSection, widget.layout);
          return {
            x: normalized.x,
            y: normalized.y,
            w: normalized.w,
            h: normalized.h,
          };
        });
        const next = findFirstFreePosition(occupied, stackCols, normalizedSeed.w, normalizedSeed.h);
        baseLayout.x = next.x;
        baseLayout.y = next.y;
        baseLayout.w = normalizedSeed.w;
        baseLayout.h = normalizedSeed.h;
      } else {
        const rootWidgets = prev.filter((widget) => !widget.parentSectionId);
        const occupied = [
          ...sections.map((section) => ({
            x: section.layout.x,
            y: section.layout.y,
            w: section.layout.w,
            h: section.layout.h,
          })),
          ...rootWidgets.map((widget) => ({
            x: widget.layout.x,
            y: widget.layout.y,
            w: widget.layout.w,
            h: widget.layout.h,
          })),
        ];
        const next = findFirstFreePosition(occupied, ROOT_CANVAS_COLS, widgetWidth, widgetHeight);
        baseLayout.x = next.x;
        baseLayout.y = next.y;
      }

      const normalizedLayout = targetSection
        ? normalizeLayoutForStack(targetSection, baseLayout)
        : baseLayout;

      const newWidget: Widget = {
        id,
        kind,
        title: `New ${kind}`,
        entityId: defaultEntityId,
        isFavorite: true,
        status:
          kind === 'media'
            ? 'paused'
            : kind === 'alarm'
              ? 'disarmed'
              : kind === 'vacuum'
                ? 'docked'
                : kind === 'lock'
                  ? 'locked'
                : kind === 'cover'
                  ? 'open'
                : 'Idle',
        isOn: kind === 'lock' || kind === 'cover',
        value:
          kind === 'sensor' ? 40 : kind === 'climate' ? 23 : kind === 'vacuum' ? 100 : kind === 'cover' ? 70 : 0,
        unit:
          kind === 'sensor' || kind === 'media' || kind === 'vacuum' || kind === 'cover'
            ? '%'
            : kind === 'climate'
              ? 'C'
              : kind === 'alarm' || kind === 'lock'
                ? ''
                : '%',
        ...(kind === 'alarm' || kind === 'lock'
          ? {
              activityLogHours: DEFAULT_ACTIVITY_WINDOW_HOURS,
              activityLogLimit: DEFAULT_ACTIVITY_MAX_ENTRIES,
            }
          : {}),
        ...(kind === 'vacuum'
          ? {
              vacuumFanSpeed: 'balanced',
              vacuumMapUrl: isVacuumDemo ? VACUUM_DEMO_MAP_URL : undefined,
              vacuumCleanedArea: 45,
              vacuumCleaningMinutes: 32,
            }
          : {}),
        ...(kind === 'cover'
          ? {
              coverTiltPosition: 50,
            }
          : {}),
        parentSectionId: targetSectionId,
        layout: normalizedLayout,
      };

      return [...prev, newWidget];
    });
    setSelectedWidgetId(id);
    setIsCatalogOpen(false);
  };

  const addSection = (kind: SectionKind) => {
    const id = `section-${kind}-${nextSectionIdRef.current++}`;
    const nextY = sections.reduce((maxY, section) => Math.max(maxY, section.layout.y + section.layout.h), 0);
    setSections((prev) => [
      ...prev,
        {
          id,
          kind,
          layout: createDefaultSectionLayout(kind, id, nextY),
          ...(kind === 'greeting'
            ? {
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
              }
            : {}),
          ...(kind === 'scenes'
            ? {
              scenes: ['music', 'going-out', 'night', 'movie'],
              scenesShowBackground: true,
              scenesShowBorder: true,
              title: 'Scenes',
            }
          : {}),
        ...(kind === 'stack-vertical'
          ? {
              title: 'Vertical Stack',
              stackShowBackground: true,
              stackShowBorder: true,
              stackShowHeader: true,
            }
          : {}),
        ...(kind === 'stack-horizontal'
          ? {
              title: 'Horizontal Stack',
              stackColumns: 4,
              stackShowBackground: true,
              stackShowBorder: true,
              stackShowHeader: true,
            }
          : {}),
        ...(kind === 'stack-grid'
          ? {
              title: 'Grid Stack',
              stackColumns: 3,
              stackShowBackground: true,
              stackShowBorder: true,
              stackShowHeader: true,
              stackUseFavoritesGrid: false,
            }
          : {}),
        ...(kind === 'weather'
          ? {
              weatherLayout: 'auto',
              weatherUnit: 'C',
              weatherShowCondition: true,
              weatherShowPrecipitation: true,
              weatherShowWind: true,
              weatherForecastType: 'daily',
              weatherForecastDays: 4,
              weatherForecastDensity: 'comfortable',
              weatherSecondaryInfo: 'auto',
            }
          : {}),
      },
    ]);
    setIsCatalogOpen(false);
  };

  const removeSection = (id: string) => {
    const removedSection = sections.find((section) => section.id === id) ?? null;
    const remainingSections = sections.filter((section) => section.id !== id);
    const nextWidgets =
      removedSection?.kind === 'stack-grid' && (removedSection.stackUseFavoritesGrid ?? false)
        ? (() => {
            const rootOccupied: Array<Pick<GridItem, 'x' | 'y' | 'w' | 'h'>> = [
              ...remainingSections.map((section) => ({
                x: section.layout.x,
                y: section.layout.y,
                w: section.layout.w,
                h: section.layout.h,
              })),
              ...widgets
                .filter((widget) => !widget.parentSectionId)
                .map((widget) => ({
                  x: widget.layout.x,
                  y: widget.layout.y,
                  w: widget.layout.w,
                  h: widget.layout.h,
                })),
            ];

            return widgets.map((widget) => {
              if (widget.parentSectionId !== id) {
                return widget;
              }

              const normalizedSeed = normalizeRootLayout({
                i: widget.id,
                x: widget.layout.x,
                y: widget.layout.y,
                w: Math.max(1, Math.round(widget.layout.w)),
                h: Math.max(1, Math.round(widget.layout.h)),
              });
              const nextPosition = findFirstFreePosition(
                rootOccupied,
                ROOT_CANVAS_COLS,
                normalizedSeed.w,
                normalizedSeed.h,
              );
              const nextLayout = normalizeRootLayout({
                ...normalizedSeed,
                x: nextPosition.x,
                y: nextPosition.y,
              });

              rootOccupied.push({
                x: nextLayout.x,
                y: nextLayout.y,
                w: nextLayout.w,
                h: nextLayout.h,
              });

              return {
                ...widget,
                parentSectionId: undefined,
                layout: nextLayout,
              };
            });
          })()
        : widgets.filter((widget) => widget.parentSectionId !== id);
    const compacted = compactRootCanvasLayout(remainingSections, nextWidgets);
    setSections(compacted.sections);
    setWidgets(compacted.widgets);
  };

  const removeSelectedWidget = () => {
    if (!selectedWidget) {
      return;
    }
    const nextWidgets = widgets.filter((widget) => widget.id !== selectedWidget.id);
    if (selectedWidget.parentSectionId) {
      const parentSection = sections.find((section) => section.id === selectedWidget.parentSectionId);
      setWidgets(parentSection && isStackSection(parentSection) ? compactStackSectionLayout(parentSection, nextWidgets) : nextWidgets);
    } else {
      const compacted = compactRootCanvasLayout(sections, nextWidgets);
      setSections(compacted.sections);
      setWidgets(compacted.widgets);
    }
    setSelectedWidgetId(null);
  };

  const requestToggleEditMode = () => {
    if (!canToggleEditMode) {
      return;
    }
    setEditConfirm(isEditMode ? 'exit' : 'enter');
  };

  const startHomeAssistantOAuth = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const normalizedUrl = normalizeHassUrl(haUrl);
    if (!normalizedUrl) {
      throw new Error('Inserisci URL Home Assistant prima di avviare OAuth.');
    }

    const nonce = createOAuthNonce();
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set(HA_OAUTH_CALLBACK_PARAM, '1');
    currentUrl.searchParams.delete('code');
    currentUrl.searchParams.delete('state');
    currentUrl.searchParams.delete('error');
    currentUrl.searchParams.delete('error_description');

    const statePayload: HaOAuthStatePayload = {
      nonce,
      hassUrl: normalizedUrl,
      returnTo: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      issuedAt: Date.now(),
    };
    const authorizeUrl = buildHaOAuthAuthorizeUrl({
      hassUrl: normalizedUrl,
      clientId: window.location.origin,
      redirectUri: currentUrl.toString(),
      state: JSON.stringify(statePayload),
    });

    window.sessionStorage.setItem(HA_OAUTH_SESSION_NONCE_KEY, nonce);
    setOAuthFlowError(null);
    window.location.assign(authorizeUrl);
  };

  const downloadConfigurationBackup = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const payload = createDashboardBackupPayload(window.localStorage);
    const backupJson = serializeDashboardBackup(payload);
    const safeTimestamp = payload.exportedAt.replace(/[:.]/g, '-');
    const fileName = `${BACKUP_FILENAME_PREFIX}-${safeTimestamp}.json`;
    const blob = new Blob([backupJson], { type: 'application/json;charset=utf-8' });
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const restoreConfigurationFromFile = async (file: File) => {
    if (typeof window === 'undefined') {
      return;
    }

    const shouldRestore = window.confirm(
      'Ripristinare la configurazione dal file selezionato? La configurazione attuale verra sostituita.',
    );
    if (!shouldRestore) {
      return;
    }

    const rawBackup = await file.text();
    const payload = parseDashboardBackup(rawBackup);
    restoreDashboardBackup(payload, window.localStorage);
    window.location.reload();
  };

  const resetAllConfiguration = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const shouldReset = window.confirm(
      'Resettare tutta la configurazione locale della dashboard? Questa azione e irreversibile.',
    );
    if (!shouldReset) {
      return;
    }

    clearManagedDashboardStorage(window.localStorage);
    window.location.reload();
  };

  const confirmEditAction = () => {
    if (editConfirm === 'refresh') {
      window.location.reload();
      return;
    }
    if (editConfirm === 'enter' && !canToggleEditMode) {
      setEditConfirm(null);
      return;
    }
    setIsEditMode((prev) => !prev);
    setEditConfirm(null);
  };

  const handleSidebarPathClick = (entry: { id: string; path: string }) => {
    const path = entry.path;
    const target = path.trim();
    if (!target || typeof window === 'undefined') {
      return;
    }
    const normalized =
      target.startsWith('/') ||
      target.startsWith('#') ||
      target.startsWith('?') ||
      target.startsWith('http://') ||
      target.startsWith('https://')
        ? target
        : `/${target}`;

    if (isEditMode) {
      setSelectedSidebarPathId(entry.id);
      setSelectedWidgetId(null);
      setSelectedSectionId(null);
      return;
    }

    setSelectedSidebarPathId(null);

    if (!isExternalNavigationTarget(normalized)) {
      const currentRoute = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (normalized !== currentRoute) {
        window.history.pushState({}, '', normalized);
      }

      const nextIsConsumption = isConsumptionNavigationTarget(normalized);
      const nextIsAutomation = isAutomationNavigationTarget(normalized);
      const nextIsAppGallery = isAppGalleryNavigationTarget(normalized);
      const nextIsSecurity = isSecurityNavigationTarget(normalized);
      const nextIsSecurityCameras = isSecurityCamerasNavigationTarget(normalized);
      const nextEditAvailability =
        isHomeNavigationTarget(normalized) || nextIsConsumption || nextIsAppGallery || nextIsSecurity;
      setIsConsumptionView(nextIsConsumption);
      setIsAutomationView(nextIsAutomation);
      setIsAppGalleryView(nextIsAppGallery);
      setIsSecurityView(nextIsSecurity);
      setIsSecurityCamerasView(nextIsSecurityCameras);
      setIsEditAvailableForRoute(nextEditAvailability);
      setActiveDevice(null);
      setSelectedWidgetId(null);
      setSelectedSectionId(null);
      setSelectedSidebarPathId(null);
      setIsFavoritesOpen(false);

      if (!nextEditAvailability) {
        setIsEditMode(false);
        setEditConfirm(null);
        setIsCatalogOpen(false);
      }
      return;
    }

    if (normalized === window.location.href) {
      return;
    }
    window.location.assign(normalized);
  };
  const dashboardWallpaperClass = `dashboard-wallpaper-${wallpaper}`;
  const profileUserEmail =
    haCurrentUser?.email ??
    (haCurrentUser?.username && haCurrentUser.username.includes('@') ? haCurrentUser.username : undefined);
  const profileUserRoleLabel = haCurrentUser?.isOwner ? 'Creatore' : haCurrentUser?.isAdmin ? 'Admin' : 'Utente';
  const profileUserOwnedDeviceCount = profileMovementSource.trackerDeviceCount;
  const isSecurityImmersiveView = isSecurityView && isSecurityCamerasView;
  const isDashboardCanvasView =
    !isConsumptionView && !isAutomationView && !isAppGalleryView && !isSecurityView;
  const shouldApplyXsShellBottomInset =
    !isSecurityImmersiveView && isXsViewport && !isDashboardCanvasView;

  return (
    <div
      className={`relative h-[100dvh] min-h-screen font-sans overflow-hidden flex ${
        isSecurityImmersiveView
          ? 'p-0 gap-0'
          : 'py-1.5 px-0.5 sm:p-2 md:p-2.5 lg:p-4 xl:p-5 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-4 xl:gap-6'
      } ${
        shouldApplyXsShellBottomInset
          ? 'pb-[calc(env(safe-area-inset-bottom)+5.9rem)]'
          : ''
      } selection:bg-blue-500/30 ${
        theme === 'light'
          ? 'dashboard-theme-light bg-[var(--dashboard-bg)] text-[var(--dashboard-text)]'
          : 'dashboard-theme-dark bg-[var(--dashboard-bg)] text-[var(--dashboard-text)]'
      } dashboard-shell ${dashboardWallpaperClass}`}
    >
      <div aria-hidden className="dashboard-wallpaper-layer" />
      {!isSecurityImmersiveView && !isXsViewport ? (
        <LeftSidebar
          isEditMode={isEditMode}
          canToggleEditMode={canToggleEditMode}
          userAvatarUrl={currentUserAvatarUrl}
          userAvatarAlt={stateWithConnectedUser.userName}
          haStatus={haStatus}
          quickPaths={visibleSidebarPaths}
          selectedPathId={selectedSidebarPathId}
          onPathClick={handleSidebarPathClick}
          onToggleEditMode={requestToggleEditMode}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      ) : null}

      <main className={isSecurityImmersiveView ? 'h-full min-h-0 flex-1 min-w-0 flex overflow-hidden' : 'h-full min-h-0 flex-1 min-w-0 flex gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-4 xl:gap-6 overflow-hidden'}>
        {isConsumptionView ? (
          <>
            <div className="h-full min-h-0 flex-1 overflow-hidden">
              <ConsumptionDashboardPage
                embedded
                isEditMode={isEditMode}
                selectedCardId={selectedConsumptionCardId}
                data={consumptionData}
                config={consumptionConfig}
                onSelectCard={(cardId) => {
                  if (!isEditMode) {
                    return;
                  }
                  setSelectedConsumptionCardId(cardId);
                }}
              />
            </div>
            {isEditMode ? (
              <ConsumptionEditorSidebar
                selectedCardId={selectedConsumptionCardId}
                onSelectCard={setSelectedConsumptionCardId}
                config={consumptionConfig}
                haEntityIds={haEntityIds}
                haConnected={isHaConnected}
                onUpdateConfigField={updateConsumptionConfigField}
                onResetConfig={resetConsumptionConfig}
              />
            ) : null}
          </>
        ) : isAutomationView ? (
          <div className="h-full min-h-0 flex-1 overflow-hidden">
            <AutomationsBuilder
              haStates={haStates}
              haStatus={haStatus}
              haUrl={haUrl}
              haToken={haToken}
              onCallService={callHaService}
            />
          </div>
        ) : isAppGalleryView ? (
          <div className="h-full min-h-0 flex-1 overflow-hidden">
            <AppGallery
              isEditMode={isEditMode}
              haConnected={isHaConnected}
              haStates={haStatesForUi}
              haEntityIds={haEntityIds}
              haUrl={haUrl}
              haToken={haToken}
              onCallService={callHaService}
              onCallApi={callHaApi}
              onNotify={addNotification}
            />
          </div>
        ) : isSecurityView ? (
          <div className="h-full min-h-0 flex-1 overflow-hidden">
            <SecurityDashboard
              isEditMode={isEditMode}
              haConnected={isHaConnected}
              haStates={haStatesForUi}
              alarmEntityOptions={haEntityIds.filter((entityId) => entityId.startsWith('alarm_control_panel.'))}
              sensorEntityOptions={haEntityIds.filter((entityId) => entityId.startsWith('binary_sensor.'))}
              onCallService={callHaService}
            />
          </div>
        ) : (
          <>
            <GridCanvas
              isEditMode={isEditMode}
              developerMode={developerMode}
              isXsViewport={isXsViewport}
              topRightOverlay={
                !isSecurityImmersiveView && isXsViewport ? (
                  <XsNotificationBell
                    userAvatarUrl={currentUserAvatarUrl}
                    userAvatarAlt={stateWithConnectedUser.userName}
                    haStatus={haStatus}
                    onOpenProfile={() => setIsProfileOpen(true)}
                  />
                ) : undefined
              }
              state={stateWithConnectedUser}
              sections={sections}
              widgets={widgets}
              runningSceneBySectionId={runningSceneBySectionId}
              selectedWidgetId={selectedWidgetId}
              selectedSectionId={selectedSectionId}
              isCatalogOpen={isCatalogOpen}
              onOpenCatalog={() => setIsCatalogOpen(true)}
              onCloseCatalog={() => setIsCatalogOpen(false)}
              onSelectWidget={(id) => {
                setSelectedWidgetId(id);
                if (id) {
                  setSelectedSectionId(null);
                  setSelectedSidebarPathId(null);
                }
              }}
              onSelectSection={(id) => {
                setSelectedSectionId(id);
                if (id) {
                  setSelectedWidgetId(null);
                  setSelectedSidebarPathId(null);
                }
              }}
              onWidgetClick={handleWidgetClick}
              onWidgetLightToggle={(widget) => {
                if (widget.kind !== 'light') {
                  return;
                }
                toggleLightEntity(widget);
              }}
              onWidgetBrightnessChange={handleWidgetBrightnessChange}
              onWidgetClimateTargetTempChange={(widget, nextValue) => {
                setClimateTargetTemp(nextValue, widget);
              }}
              onWidgetClimateTargetRangeChange={(widget, low, high) => {
                setClimateTargetRange(low, high, widget);
              }}
              onWidgetClimateModeChange={(widget, mode) => {
                setClimateMode(mode, widget);
              }}
              onWidgetClimateFanModeChange={(widget, mode) => {
                setClimateFanMode(mode, widget);
              }}
              onWidgetMediaToggle={toggleMediaPlayback}
              onWidgetMediaSeek={(widget, position) => {
                if (widget.kind !== 'media') {
                  return;
                }
                if (activeWidget?.id !== widget.id) {
                  setSelectedWidgetId(widget.id);
                }
                seekMediaPosition(position, widget);
              }}
              onWidgetAlarmDisarm={(widget) => {
                if (widget.kind !== 'alarm') {
                  return;
                }
                disarmAlarm(undefined, widget);
              }}
              onWidgetAlarmArm={(widget, mode) => {
                if (widget.kind !== 'alarm') {
                  return;
                }
                armAlarmByMode(mode, undefined, widget);
              }}
              onWidgetVacuumStartPause={(widget) => {
                if (widget.kind !== 'vacuum') {
                  return;
                }
                toggleVacuumStartPause(widget);
              }}
              onWidgetVacuumReturnToBase={(widget) => {
                if (widget.kind !== 'vacuum') {
                  return;
                }
                returnVacuumToBase(widget);
              }}
              onWidgetLockToggle={(widget) => {
                if (widget.kind !== 'lock') {
                  return;
                }
                toggleLockDoor(widget);
              }}
              onWidgetLockOpen={(widget) => {
                if (widget.kind !== 'lock') {
                  return;
                }
                openDoor(undefined, widget);
              }}
              onWeatherClick={openWeatherControls}
              onSceneTrigger={triggerSceneAction}
              onWidgetLayoutChange={handleWidgetLayoutChange}
              onSectionsLayoutChange={handleSectionsLayoutChange}
              onAddWidget={addWidget}
              onAddSection={addSection}
              onRemoveSection={removeSection}
              onUpdateSection={updateSection}
              haConnected={isHaConnected}
              haStates={haStatesForUi}
            />

            <RightSidebarManager
              isEditMode={isEditMode}
              isXs={isXsViewport}
              activeDevice={activeDevice}
              onCloseContextSidebar={clearContextSelection}
              state={contextState}
              camera={contextCamera}
              alarm={contextAlarm}
              vacuum={contextVacuum}
              lock={contextLock}
              cover={contextCover}
              vacuumAreas={
                isHaConnected
                  ? haAreas.map((area) => ({ id: area.area_id, name: area.name }))
                  : VACUUM_DEMO_AREA_OPTIONS
              }
              actions={{
                toggleLamp: () => toggleLightEntity(),
                setLampBrightness: (value) => setLightBrightness(value),
                setLampColorTemp: (kelvin) => setLightColorTemp(kelvin),
                setLampHsColor: (hs) => setLightHsColor(hs),
                toggleClimatePower: () => toggleClimatePower(),
                decreaseClimateTarget: () => decreaseClimateTarget(),
                increaseClimateTarget: () => increaseClimateTarget(),
                autoAdjustClimate: () => autoAdjustClimate(),
                nudgeClimateCurrent: () => {
                  if (!isHaConnected) {
                    actions.nudgeClimateCurrent();
                  }
                },
                setClimateTargetTemp: (value) => setClimateTargetTemp(value),
                setClimateTargetRange: (low, high) => setClimateTargetRange(low, high),
                setClimateMode: (mode) => setClimateMode(mode),
                setClimateFanMode: (mode) => setClimateFanMode(mode),
                toggleSpeakerPlayback: () => toggleMediaPlayback(),
                toggleSpeakerPower: () => toggleMediaPower(),
                previousSpeakerTrack: () => previousMediaTrack(),
                nextSpeakerTrack: () => nextMediaTrack(),
                seekSpeakerPosition: (position) => seekMediaPosition(position),
                setSpeakerVolume: (value) => setMediaVolume(value),
                toggleSpeakerMute: () => toggleMediaMute(),
                disarmAlarm: (code) => disarmAlarm(code),
                armAlarmHome: (code) => armAlarmHome(code),
                armAlarmAway: (code) => armAlarmAway(code),
                armAlarmNight: (code) => armAlarmNight(code),
                armAlarmVacation: (code) => armAlarmVacation(code),
                armAlarmCustomBypass: (code) => armAlarmCustomBypass(code),
                triggerAlarm: (code) => triggerAlarm(code),
                startVacuum: () => startVacuum(),
                pauseVacuum: () => pauseVacuum(),
                stopVacuum: () => stopVacuum(),
                returnVacuumToBase: () => returnVacuumToBase(),
                locateVacuum: () => locateVacuum(),
                cleanVacuumSpot: () => cleanVacuumSpot(),
                cleanVacuumArea: (areaIds) => cleanVacuumArea(areaIds),
                setVacuumFanSpeed: (fanSpeed) => setVacuumFanSpeed(fanSpeed),
                sendVacuumCommand: (command, params) => sendVacuumCommand(command, params),
                lockDoor: (code) => lockDoor(code),
                unlockDoor: (code) => unlockDoor(code),
                openDoor: (code) => openDoor(code),
                openCover: () => openCover(),
                closeCover: () => closeCover(),
                stopCover: () => stopCover(),
                setCoverPosition: (position) => setCoverPosition(position),
                setCoverTiltPosition: (position) => setCoverTiltPosition(position),
                moveCameraPtz: (direction) => moveCameraPtz(direction),
                stopCameraPtz: () => stopCameraPtz(),
              }}
              onUpdateUserName={actions.setUserName}
              selectedWidget={selectedWidget}
              selectedSection={selectedSection}
              selectedSidebarPath={selectedSidebarPath}
              weatherConfig={weatherSection}
              entityOptions={ENTITY_OPTIONS}
              haEntityIds={haEntityIds}
              haConnected={isHaConnected}
              onUpdateWidget={updateWidget}
              onUpdateSection={updateSection}
              onUpdateSidebarPath={updateSidebarPath}
              onRemoveSelectedWidget={removeSelectedWidget}
              onRemoveSection={removeSection}
              onRemoveSidebarPath={(id) => {
                removeSidebarPath(id);
                if (selectedSidebarPathId === id) {
                  setSelectedSidebarPathId(null);
                }
              }}
            />
          </>
        )}

      </main>

      {!isEditMode && !isConsumptionView && !isAutomationView && !isAppGalleryView && !isSecurityView ? (
        <FavoritesDrawer
          isOpen={isFavoritesOpen}
          onOpen={() => setIsFavoritesOpen(true)}
          onClose={() => setIsFavoritesOpen(false)}
          agentClient={assistantAgentClient}
          haEntityIds={haEntityIds}
        />
      ) : null}

      {!isSecurityImmersiveView && isXsViewport ? (
        <BottomBarNav
          isEditMode={isEditMode}
          canToggleEditMode={canToggleEditMode}
          quickPaths={visibleSidebarPaths}
          selectedPathId={selectedSidebarPathId}
          onPathClick={handleSidebarPathClick}
          onToggleEditMode={requestToggleEditMode}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      ) : null}

      <ProfilePanel
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userAvatarUrl={currentUserAvatarUrl}
        userAvatarAlt={stateWithConnectedUser.userName}
        userEmail={profileUserEmail}
        userRoleLabel={profileUserRoleLabel}
        houseMembers={profileHouseMembers}
        userOwnedDeviceCount={profileUserOwnedDeviceCount}
        movementTimeline={profileMovementTimeline}
        movementPoints={profileMovementPoints}
        movementUpdatedLabel={profileMovementUpdatedLabel}
        theme={theme}
        onThemeChange={setTheme}
        wallpaper={wallpaper}
        onWallpaperChange={setWallpaper}
        developerMode={developerMode}
        onDeveloperModeChange={setDeveloperMode}
        haUrl={haUrl}
        onUrlChange={setHaUrl}
        haToken={haToken}
        onTokenChange={setHaToken}
        haRememberToken={haRememberToken}
        onRememberTokenChange={setHaRememberToken}
        haStatus={haStatus}
        haError={oauthFlowError ?? haError}
        haManagedByParent={isHaManagedByParent}
        onConnect={connectHa}
        onDisconnect={disconnectHa}
        onStartOAuth={startHomeAssistantOAuth}
        isOAuthBusy={isOAuthFlowBusy}
        onDownloadBackup={downloadConfigurationBackup}
        onRestoreBackup={restoreConfigurationFromFile}
        onResetAll={resetAllConfiguration}
      />

      {activeMainGuide ? (
        <GuidedSetupOverlay
          isOpen
          tag={activeMainGuide.tag}
          heading={activeMainGuide.heading}
          steps={activeMainGuide.steps}
          onDismiss={dismissActiveMainGuide}
          completeLabel={activeMainGuide.completeLabel}
          skipLabel={activeMainGuide.skipLabel}
        />
      ) : null}

      {editConfirm ? (
        <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 sm:p-8">
          <button
            type="button"
            onClick={() => setEditConfirm(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-3xl"
            aria-label="Chiudi conferma"
          />
          <div
            className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.08] backdrop-blur-3xl p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">
              {editConfirm === 'enter'
                ? 'Modalita edit'
                : editConfirm === 'refresh'
                  ? 'Ricarica pagina'
                  : 'Uscita edit'}
            </p>
            <h3 className="mt-2 text-xl font-semibold">
              {editConfirm === 'enter'
                ? 'Attivare la modalita modifica?'
                : editConfirm === 'refresh'
                  ? 'Ricaricare la pagina?'
                  : 'Uscire dalla modalita modifica?'}
            </h3>
            <p className="mt-3 text-sm text-white/60">
              {editConfirm === 'enter'
                ? 'Potrai trascinare e configurare tutte le card della dashboard.'
                : editConfirm === 'refresh'
                  ? 'Potresti perdere modifiche non salvate. Premi Annulla per continuare a modificare.'
                  : 'Se hai modifiche in corso, premi Annulla per continuare a modificare.'}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditConfirm(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={confirmEditAction}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                  editConfirm === 'enter'
                    ? 'border-blue-300/45 bg-blue-500/16 text-blue-100 hover:bg-blue-500/26'
                    : 'border-rose-300/45 bg-rose-500/16 text-rose-100 hover:bg-rose-500/26'
                }`}
              >
                {editConfirm === 'enter' ? 'Attiva' : editConfirm === 'refresh' ? 'Ricarica' : 'Esci'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .custom-scrollbar { scrollbar-gutter: stable both-edges; }
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            @media (hover: none) and (pointer: coarse) {
              .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              .custom-scrollbar::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none; }
            }
          `,
        }}
      />
    </div>
  );
}

export default MainBoard;



