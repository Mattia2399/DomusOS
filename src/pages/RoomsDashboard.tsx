import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Building2,
  Car,
  ChevronDown,
  ChevronLeft,
  CirclePlus,
  ChevronRight,
  Fan,
  House,
  HousePlus,
  Layers,
  Leaf,
  Lightbulb,
  Lock,
  MapPinHouse,
  Minus,
  MinusCircle,
  Music2,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat2,
  Rows2,
  Rows3,
  Save,
  Shuffle,
  SkipBack,
  SkipForward,
  Snowflake,
  Speaker,
  Thermometer,
  Trash2,
  Tv,
  Unlock,
  Video,
  Warehouse,
  Wind,
  X,
  type LucideIcon,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GRID_ENGINE_BREAKPOINTS, GRID_ENGINE_GAP_PX, GRID_ENGINE_ROW_UNIT_PX } from '../components/dashboard/DashboardGrid';
import {
  CAMERA_WIDGET_SPAN_BY_BREAKPOINT,
  COVER_WIDGET_SPAN_BY_BREAKPOINT,
  LIGHT_WIDGET_SPAN_BY_BREAKPOINT,
  LOCK_WIDGET_SPAN_BY_BREAKPOINT,
  MEDIA_WIDGET_SPAN_BY_BREAKPOINT,
  SENSOR_WIDGET_SPAN_BY_BREAKPOINT,
  STACK_GRID_COLS_BY_BREAKPOINT,
  type GridEngineBreakpoint,
} from '../components/dashboard/dashboardBreakpointConfig';
import { RoomClimateCard } from '../components/settings/ClimateControls';
import { SectionCardRenderer, WidgetCardRenderer } from '../components/widgets/CardRenderer';
import { useDashboardState } from '../hooks/useDashboardState';
import type { HaArea } from '../hooks/useHaLiveConnection';
import type { DashboardSection, SceneKey, Widget, WidgetKind } from '../types/dashboardModels';
import type { MockEntityState, MockEntityStateMap } from '../types/ha';

const CUSTOM_ROOMS_STORAGE_KEY = 'ha.dashboard.rooms.customRooms.v1';
const ACTIVE_ROOM_STORAGE_KEY = 'ha.dashboard.rooms.activeRoomId.v1';
const ROOM_ID_CUSTOM_PREFIX = 'custom:';
const ROOM_TITLE_TRANSITION = { duration: 0.24, ease: [0.22, 1, 0.36, 1] } as const;
const ROOM_MODAL_INPUT_CLASS =
  'min-h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white backdrop-blur-md transition-all placeholder:text-white/30 focus:border-white/20 focus:outline-none';
const ROOM_MODAL_PRIMARY_BUTTON_CLASS =
  'btn-premium inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-white/15 active:scale-95 disabled:cursor-wait disabled:opacity-60';
const ROOM_MODAL_SECONDARY_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-xs font-semibold text-white/68 backdrop-blur-md transition-all duration-200 hover:bg-white/[0.07] hover:text-white active:scale-95 disabled:cursor-wait disabled:opacity-60';
const ROOM_MODAL_ROW_CLASS =
  'flex items-center justify-between gap-3 p-3.5 transition-all border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]';
const FLOOR_LAYER_BACKGROUND_OPEN_CLASS =
  'scale-95 blur-xl opacity-40 pointer-events-none transition-all duration-500 ease-out';
const FLOOR_LAYER_BACKGROUND_CLOSED_CLASS =
  'scale-100 blur-none opacity-100 transition-all duration-500 ease-out';
const FLOOR_CARD_CLASS =
  'snap-center flex-shrink-0 w-64 h-80 rounded-[2rem] border border-white/[0.08] border-t border-t-white/14 bg-[#1C1C1E]/60 backdrop-blur-3xl p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col justify-between transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer';
const FLOOR_ADD_CARD_CLASS =
  'snap-center flex-shrink-0 w-64 h-80 rounded-[2rem] border border-dashed border-white/10 border-t border-t-white/14 bg-white/[0.01] hover:bg-white/[0.03] p-6 flex flex-col items-center justify-center gap-3 group transition-all duration-200 active:scale-[0.98]';
const FLOOR_CAROUSEL_DRAG_THRESHOLD_PX = 6;
const ROOM_TITLE_DRAG_THRESHOLD_PX = 3;
const ROOM_SECTION_PREVIEW_LIMIT = 4;
const ROOM_ACCESSORY_PREVIEW_LIMIT = 8;
const EMPTY_FLOOR_DRAFT: FloorDraft = {
  name: '',
  aliases: '',
  level: '',
};
const EMPTY_AREA_CREATION_DRAFT: AreaCreationDraft = {
  floorId: '',
  icon: '',
  aliases: '',
  picture: '',
  temperatureEntityId: '',
  humidityEntityId: '',
};

export type RoomTab = {
  id: string;
  name: string;
  source: 'ha' | 'custom';
};

export type CustomRoomRecord = {
  id: string;
  name: string;
  createdAt: number;
};

export type RoomEntityBuckets = {
  lights: string[];
  climates: string[];
  locks: string[];
  medias: string[];
  switches: string[];
  sensors: string[];
  covers: string[];
  cameras: string[];
  weathers: string[];
  others: string[];
};

type RoomQuickTile = {
  id: string;
  title: string;
  domain: string;
  entityId?: string;
  isOn: boolean;
  icon: React.ReactNode;
  isLive: boolean;
  isToggleSupported: boolean;
};

type RoomDoorTile = {
  id: string;
  title: string;
  subtitle: string;
  entityId?: string;
  isClosed: boolean;
  icon: React.ReactNode;
  isLive: boolean;
};

type RoomLightRow = {
  id: string;
  title: string;
  domain: string;
  entityId?: string;
  isLive: boolean;
  isOn: boolean;
  brightnessPct: number;
};

type RoomWidgetCluster = {
  id: string;
  label: string;
  widgets: Widget[];
};

type RoomAccessoryCard = {
  id: string;
  title: string;
  status: string;
  entityId: string;
  domain: string;
  icon: React.ReactNode;
  isOn: boolean;
};

type ExpandedRoomSection =
  | {
      kind: 'widgets';
      id: string;
      label: string;
    }
  | {
      kind: 'accessories';
      id: 'accessories';
      label: string;
    };

type HaAreaCreateResult = {
  area_id?: unknown;
  name?: unknown;
  aliases?: unknown;
  floor_id?: unknown;
  humidity_entity_id?: unknown;
  icon?: unknown;
  picture?: unknown;
  temperature_entity_id?: unknown;
};

type HaFloorEntry = {
  floor_id: string;
  name: string;
  aliases?: string[];
  level?: number | null;
  icon?: string | null;
};

type FloorDraft = {
  name: string;
  aliases: string;
  level: string;
};

type FloorAction = 'saving' | 'deleting' | 'reordering';

type FloorCarouselDragState = {
  pointerId: number;
  startX: number;
  scrollLeft: number;
  didMove: boolean;
};

type RoomStatusChip = {
  id: string;
  label: string;
  status: string;
  icon: React.ReactNode;
  className: string;
};

type AreaCreationDraft = {
  floorId: string;
  icon: string;
  aliases: string;
  picture: string;
  temperatureEntityId: string;
  humidityEntityId: string;
};

type AreaEditDraft = AreaCreationDraft & {
  name: string;
};

type RoomEditTarget = {
  id: string;
  source: 'custom' | 'ha';
};

type RoomsDashboardProps = {
  suppressBrowserNavigation?: boolean;
  navigationRoute?: string;
  haConnected: boolean;
  haAreas: HaArea[];
  haStates: MockEntityStateMap;
  onCallService?: (
    domain: string,
    service: string,
    serviceData: Record<string, unknown>,
  ) => Promise<boolean>;
  onCallApi?: (
    message: Record<string, unknown>,
    options?: { reportError?: boolean },
  ) => Promise<unknown | null>;
};

const DEMO_ROOM_TABS: RoomTab[] = [
  { id: 'demo-living-room', name: 'Soggiorno', source: 'custom' },
  { id: 'demo-bedroom', name: 'Camera', source: 'custom' },
  { id: 'demo-kitchen', name: 'Cucina', source: 'custom' },
  { id: 'demo-bathroom', name: 'Bagno', source: 'custom' },
];

const ENERGY_WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat', 'Sun'];
const GLASS_CARD_CLASS =
  'rooms-surface';
const PRIMARY_ROOM_ACCENT = '#85adff';
const MEMBER_AVATARS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB-mNJxOHxly3Q071LyRvp9Kl9hZabgRQbjWPCGM9H7ocE8nLsQg6_xfYzqpMJYTr7YKJbfQAfgpbrb_AQvEFCvSJPpnO80jM3xXAu-X4oEZIIwT2cjRyeLtlScEMcOA_MMZmaT1VHbpX-VPyTNW7qVKcPxbm1KuQJVMAYYCB2whOlw64hicBkgdBQBLWrDQxbkGdekS413TCNdaBCqHEa1yuzcy3TOhKYQ6wJsACXSlx1Da4dMOsh8xPU7Z-hfn7Do7XrDkl9jhggz',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCH2V_uPYZzhEeaLDS2_4G9ntniUsznFiwhJHTIDr5Z91pD1Ae6GuE6qoPnnfOapCScKIXvKOzpRffdsoRRKmHUvkJkSXHJLoyfRrSTvZ9yBCHerBZe7xGhl8RqNN7vvHpMVKK-D7sZlhFdCw8x3P44sKw-Nlzar91chZwY9Q_81kbGu57GpPqSH5AmoUNmAaDejaMh1SL8XrLiu0EVdkwDUSv64ecOuwRgQCBRAIwUnjRBXZ8jGzNs9DqPc-tV4W0oMGCmdIjfZMnl',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDPzvdESWYczmLzqODUOkNeG96SWE3I7n3RRs6zaH41q1fIN8Pf6psFiKykX7Sst2jK_MhHVh8vAFDjxGhQjxO8_rPg_83ZBqiiUpjcKxla6R6NHD6KuLDIj3ZQ19DjHbBVnHpa402ECPXNq-1WDq6L9CfXowizaqqzTmgfWQq8Tb2jFUuTFKhwSQuBppwVMmHkmYx8QSRgZOZY-k3bujMbmtZJ8KQsWvYap7lPVuhGzOAB6Fb-GYgTj7kXux2J6dbTPHbXSmANrvna',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCBcTH8Gh_K4Y9XRLhjd0RvTczp3EdoJye6ETr6cAcfJQjBI-L7fF1dQBsA6cU_muOuFMES_B4L9o0a3kuD3O5E3FeQ4ihtWtMQP_T8Z1kTnP8i_8TPAPS0df4PE4nfbuB5pvmOLgATmLmJLFS9x7j7nogKnXYIHOzKu162Xm3yYnxbOFQkgac6y4MoYstM_msQEzAiCOND8A9DoBZXEPcwUEu0dswXd1MnZXsBA1d4EwFL7DjKF4krTq-YpZdq9nb35iu35u-JbQuQ',
] as const;
const PROFILE_AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAKyvWwmLTA1d83p-wC8M6-9lx9PHqqktW2cLX5-2TI-QiN3bbOayAz5pjdLZ7n5HMbeNc2RV0y_bI-IUL8j6toqelHQs0eySS9pavCTjYQAgys5whO8K2sknc3esMIBB1UzWCEtQQ8kGc1uoa_DmE9QZgX1ktoqRVssJ2j_v4tCZQK-s4bq7KR6wCNgaRtMZKkEBQ0X6Y69gnXo0VPi05WkN1vxCk-LE1o9mjvwebTw7nEeFog4ji-UPo4jWnU3R5y2eaUREZg6eEO';
const ALBUM_ART_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCcsZDwpOuyEMTarB8QL142IvkDu9o7TR6xnM-RMGFvLtZyoo8scbL-HKnms9Jh8kcxUFIm87ouD_9-kua9YWupnYaM7-kcDb549PaHvjcsagrQyfIR-IQo6M_lXWhCW2vrNSyES2AQbSj8jrExMyMLOU1lh_8AdXNTHuCsrd1Tyuf5h2M_mmW05Le6ejzRVU3a77s9ZWLTxQAx7Zm2r2BoLpHpo7XIRq7TTmxGkmSOZDtMvQsszH37AzJfgejPDNdOMVo9BemVBcJ4';
const SMART_LOCK_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC67r3TZJE_brjPiKrTTZg4LFtHmtw24g1Vc49wN4R3tcgBEsX1Ypty2_2F2RwK4Y1d-uuZGAvfGRq6KjXj5eg8QVYZxzmwMszUrT9iJZVPERD2Rl5z-lIZGNqODGhhK7s5np5AgJI1qIUBLhO3BiaxncRfJzjaVcW7mRDBC0kVnZDhI2gjDWsvD0jzWDvYm5G2_xFhPXRBl_w6nOinuq6Y3gXkjh7DwQjgDbkUTYjw3pBJPPcriUw8GmVic1SDDTkSSlT_tMT8vmpv',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD-XR0sbBGDPqBShmOdnRG3jEVg9ZgwoqHEujtb0hB0hWcZEZgcJOQ-omIkNqK-pyK9Tp7wHO7XFgp9hfmIH-YyIgYVlshJqgTrDr--bXF4PeNZ23ohNTjxf8E4C9y3QWR_t3H65t8Z0mVsJfWu9cbzrWyeXpS8Mtp9v90FpAL_bGjfNuetjEfDwfbK0ob2qaOHqXOu7eR7bfVFf98OVfAmMPvtfdvKfmG-iNaE6E2Hix4RyupD9Ly3qbrgylsL-LTxlF8e6IUxl29g',
] as const;
const GRID_BREAKPOINT_ORDER: GridEngineBreakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];

function cn(...values: Array<string | false | null | undefined>) {
  return twMerge(clsx(values));
}

function parseDelimitedList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function trimToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function resolveGridBreakpointFromWidth(width: number): GridEngineBreakpoint {
  return (
    GRID_BREAKPOINT_ORDER.find((breakpoint) => width >= GRID_ENGINE_BREAKPOINTS[breakpoint]) ?? 'xs'
  );
}

function useGridEngineBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<GridEngineBreakpoint>(() => {
    if (typeof window === 'undefined') {
      return 'xl';
    }
    return resolveGridBreakpointFromWidth(window.innerWidth);
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleResize = () => {
      setBreakpoint(resolveGridBreakpointFromWidth(window.innerWidth));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

function toNumber(value: unknown): number | undefined {
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

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toTitleCase(value: string) {
  return value
    .split('_')
    .map((token) => (token ? `${token[0].toUpperCase()}${token.slice(1)}` : token))
    .join(' ');
}

function normalizeRoomName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function buildAreaEditDraft(area: HaArea): AreaEditDraft {
  return {
    name: area.name,
    floorId: area.floor_id ?? '',
    icon: area.icon ?? '',
    aliases: area.aliases?.join(', ') ?? '',
    picture: area.picture ?? '',
    temperatureEntityId: area.temperature_entity_id ?? '',
    humidityEntityId: area.humidity_entity_id ?? '',
  };
}

function buildFloorDraft(floor: HaFloorEntry): FloorDraft {
  return {
    name: floor.name,
    aliases: floor.aliases?.join(', ') ?? '',
    level: typeof floor.level === 'number' ? `${floor.level}` : '',
  };
}

function formatFloorTabLabel(floor: HaFloorEntry | undefined) {
  if (!floor) {
    return 'Tutti i Piani';
  }
  if (typeof floor.level === 'number') {
    if (floor.level === 0) {
      return 'PT';
    }
    if (floor.level < 0) {
      return `S${Math.abs(floor.level)}`;
    }
    return `P${floor.level}`;
  }
  const alias = floor.aliases?.find((entry) => entry.trim().length > 0);
  return alias?.trim() || floor.name;
}

function normalizeFloorIconText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function floorTextIncludesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function floorTextHasAnyToken(text: string, tokens: string[]) {
  const paddedText = ` ${text} `;
  return tokens.some((token) => paddedText.includes(` ${token} `));
}

function isFloorCarouselInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button, input, textarea, select, a, [data-no-floor-drag="true"]'));
}

function getRoomsGridStructure(
  isMobile: boolean,
  isMediaActive: boolean,
  isSecurityAlert: boolean,
  hideMediaArea = false,
): React.CSSProperties {
  if (!isMobile) {
    return {
      display: 'grid',
      gridTemplateColumns: 'minmax(16rem,1.2fr) minmax(0,1fr) minmax(0,1fr) minmax(16rem,1.2fr)',
      gridTemplateRows: 'auto auto auto auto',
      gap: '24px',
      gridTemplateAreas: `
        "header header          header          header"
        "clima  sensors         sensors         security_cams"
        "clima  lights_switches lights_switches security_cams"
        "clima  lights_switches lights_switches media"
      `,
    };
  }

  let mobileAreas = ['header', 'clima', 'lights_switches', 'sensors', 'media', 'security_cams'];

  if (isSecurityAlert) {
    mobileAreas = ['header', 'security_cams', 'clima', 'lights_switches', 'sensors', 'media'];
  } else if (isMediaActive) {
    mobileAreas = ['header', 'media', 'clima', 'lights_switches', 'sensors', 'security_cams'];
  }

  if (hideMediaArea) {
    mobileAreas = mobileAreas.filter((area) => area !== 'media');
  }

  return {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '16px',
    gridTemplateAreas: mobileAreas.map((area) => `"${area}"`).join(' '),
  };
}

function isSecurityAlertEntity(entityId: string, entity?: MockEntityState) {
  const domain = entityId.split('.')[0];
  const state = `${entity?.state ?? ''}`.trim().toLowerCase();
  const deviceClass = `${entity?.rawAttributes?.device_class ?? ''}`.trim().toLowerCase();
  const name = `${entity?.rawAttributes?.friendly_name ?? entityId}`.toLowerCase();
  const isSecuritySignal =
    domain === 'alarm_control_panel' ||
    ['motion', 'occupancy', 'presence', 'problem', 'safety', 'tamper'].includes(deviceClass) ||
    ['allarme', 'motion', 'movimento', 'occupancy', 'presenza', 'tamper'].some((token) => name.includes(token));

  if (!isSecuritySignal) {
    return false;
  }
  return ['on', 'open', 'detected', 'active', 'triggered', 'problem', 'unlocked'].includes(state);
}

function getFloorIconByLevel(level: number): LucideIcon {
  if (level < 0) {
    return Warehouse;
  }
  if (level === 0) {
    return House;
  }
  if (level === 1) {
    return Rows2;
  }
  if (level === 2) {
    return Rows3;
  }
  return Building2;
}

function getFloorIcon(floor: HaFloorEntry | undefined): LucideIcon {
  if (!floor) {
    return Layers;
  }

  const floorText = normalizeFloorIconText([floor.name, ...(floor.aliases ?? [])].join(' '));

  if (floorTextIncludesAny(floorText, ['garage', 'box', 'parcheggio', 'autorimessa'])) {
    return Car;
  }
  if (floorTextIncludesAny(floorText, ['seminterrato', 'cantina', 'taverna', 'interrato', 'sotterraneo'])) {
    return Warehouse;
  }
  if (floorTextIncludesAny(floorText, ['giardino', 'esterno', 'terrazzo', 'terrazza', 'outdoor'])) {
    return MapPinHouse;
  }
  if (floorTextIncludesAny(floorText, ['mansarda', 'attico', 'soffitta'])) {
    return HousePlus;
  }

  if (typeof floor.level === 'number') {
    return getFloorIconByLevel(floor.level);
  }

  if (floorTextHasAnyToken(floorText, ['pt', 'p0']) || floorTextIncludesAny(floorText, ['piano terra', 'terra', 'ground floor', 'livello 0'])) {
    return House;
  }
  if (floorTextHasAnyToken(floorText, ['p1', 'primo', 'first']) || floorTextIncludesAny(floorText, ['piano primo', 'primo piano', 'livello 1'])) {
    return Rows2;
  }
  if (floorTextHasAnyToken(floorText, ['p2', 'secondo', 'second']) || floorTextIncludesAny(floorText, ['piano secondo', 'secondo piano', 'livello 2'])) {
    return Rows3;
  }
  if (
    floorTextHasAnyToken(floorText, ['p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'terzo', 'quarto', 'quinto', 'sesto']) ||
    floorTextIncludesAny(floorText, ['terzo piano', 'quarto piano', 'quinto piano', 'livello 3', 'livello 4'])
  ) {
    return Building2;
  }

  return House;
}

function buildRandomId() {
  return `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

function getEntityFriendlyName(entityId: string, state?: MockEntityState) {
  const friendly = state?.rawAttributes?.friendly_name;
  if (typeof friendly === 'string' && friendly.trim().length > 0) {
    return friendly.trim();
  }
  const fallback = entityId.split('.').at(1) ?? entityId;
  return toTitleCase(fallback);
}

function isAreaSensorEntityCandidate(entityId: string, state: MockEntityState | undefined, kind: 'temperature' | 'humidity') {
  const domain = entityId.split('.')[0];
  if (domain !== 'sensor') {
    return false;
  }
  const deviceClass = `${state?.rawAttributes?.device_class ?? ''}`.trim().toLowerCase();
  const unit = `${state?.unit ?? state?.rawAttributes?.unit_of_measurement ?? ''}`.trim().toLowerCase();
  const normalizedEntityId = entityId.toLowerCase();
  if (kind === 'temperature') {
    return deviceClass === 'temperature' || ['c', 'f', '\u00b0c', '\u00b0f'].includes(unit) || normalizedEntityId.includes('temperature');
  }
  return deviceClass === 'humidity' || unit === '%' || normalizedEntityId.includes('humidity');
}

function resolveWidgetKindFromEntityId(entityId: string): WidgetKind | null {
  const domain = entityId.split('.')[0];
  if (domain === 'light') return 'light';
  if (domain === 'climate') return 'climate';
  if (domain === 'camera') return 'camera';
  if (domain === 'media_player') return 'media';
  if (domain === 'lock') return 'lock';
  if (domain === 'cover') return 'cover';
  if (domain === 'sensor' || domain === 'binary_sensor') return 'sensor';
  return null;
}

function buildRoomWidget(entityId: string, kind: WidgetKind, state: MockEntityState | undefined, layout: Widget['layout']): Widget {
  const value =
    toNumber(state?.numericValue) ??
    toNumber(state?.currentValue) ??
    toNumber(state?.targetValue) ??
    toNumber(state?.state) ??
    0;
  return {
    id: entityId,
    kind,
    title: getEntityFriendlyName(entityId, state),
    entityId,
    status: state?.stateLabel ?? state?.state ?? 'Pronto',
    isOn: isEntityOn(entityId, state),
    value,
    unit: state?.unit,
    layout,
  };
}

function resolveRoomWidgetSpan(widget: Widget, breakpoint: GridEngineBreakpoint) {
  if (widget.kind === 'light') {
    const span = LIGHT_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
    return { w: span.w, h: widget.isOn ? span.hOn : span.hOff };
  }
  if (widget.kind === 'sensor') {
    return SENSOR_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  }
  if (widget.kind === 'lock') {
    return LOCK_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  }
  if (widget.kind === 'camera') {
    return CAMERA_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  }
  if (widget.kind === 'media') {
    return MEDIA_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  }
  if (widget.kind === 'cover') {
    return COVER_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  }
  return {
    w: Math.max(1, Math.round(widget.layout.w)),
    h: Math.max(1, Math.round(widget.layout.h)),
  };
}

function RoomCardSlot({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('min-h-[236px] min-w-0', className)}>{children}</div>;
}

function parseCustomRooms(raw: string | null): CustomRoomRecord[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }
        const id =
          typeof (entry as { id?: unknown }).id === 'string'
            ? (entry as { id: string }).id.trim()
            : '';
        const name =
          typeof (entry as { name?: unknown }).name === 'string'
            ? normalizeRoomName((entry as { name: string }).name)
            : '';
        const createdAtRaw = (entry as { createdAt?: unknown }).createdAt;
        const createdAt =
          typeof createdAtRaw === 'number' && Number.isFinite(createdAtRaw)
            ? createdAtRaw
            : Date.now();
        if (!id || !name) {
          return null;
        }
        return {
          id: id.startsWith(ROOM_ID_CUSTOM_PREFIX) ? id : `${ROOM_ID_CUSTOM_PREFIX}${id}`,
          name,
          createdAt,
        } satisfies CustomRoomRecord;
      })
      .filter((entry): entry is CustomRoomRecord => entry !== null);
  } catch {
    return [];
  }
}

function readStoredCustomRooms() {
  if (typeof window === 'undefined') {
    return [];
  }
  return parseCustomRooms(window.localStorage.getItem(CUSTOM_ROOMS_STORAGE_KEY));
}

function readStoredActiveRoomId() {
  if (typeof window === 'undefined') {
    return '';
  }
  const raw = window.localStorage.getItem(ACTIVE_ROOM_STORAGE_KEY);
  return typeof raw === 'string' ? raw.trim() : '';
}

function createEmptyBuckets(): RoomEntityBuckets {
  return {
    lights: [],
    climates: [],
    locks: [],
    medias: [],
    switches: [],
    sensors: [],
    covers: [],
    cameras: [],
    weathers: [],
    others: [],
  };
}

function bucketEntityId(entityId: string, buckets: RoomEntityBuckets) {
  const domain = entityId.split('.')[0];
  if (domain === 'light') {
    buckets.lights.push(entityId);
    return;
  }
  if (domain === 'climate') {
    buckets.climates.push(entityId);
    return;
  }
  if (domain === 'lock') {
    buckets.locks.push(entityId);
    return;
  }
  if (domain === 'media_player') {
    buckets.medias.push(entityId);
    return;
  }
  if (domain === 'switch' || domain === 'input_boolean' || domain === 'fan') {
    buckets.switches.push(entityId);
    return;
  }
  if (domain === 'sensor' || domain === 'binary_sensor') {
    buckets.sensors.push(entityId);
    return;
  }
  if (domain === 'cover') {
    buckets.covers.push(entityId);
    return;
  }
  if (domain === 'camera') {
    buckets.cameras.push(entityId);
    return;
  }
  if (domain === 'weather') {
    buckets.weathers.push(entityId);
    return;
  }
  buckets.others.push(entityId);
}

function isEntityOn(entityId: string, entity?: MockEntityState) {
  const state = `${entity?.state ?? ''}`.trim().toLowerCase();
  const domain = entityId.split('.')[0];
  if (domain === 'media_player') {
    return !['off', 'idle', 'standby', 'unavailable', 'unknown'].includes(state);
  }
  if (domain === 'lock') {
    return state === 'unlocked' || state === 'open';
  }
  return ['on', 'open', 'unlocked', 'playing', 'heat', 'cool'].includes(state);
}

function isMediaEntityPlaying(entity?: MockEntityState) {
  const state = `${entity?.state ?? ''}`.trim().toLowerCase();
  const stateLabel = `${entity?.stateLabel ?? ''}`.trim().toLowerCase();
  return state === 'playing' || state === 'on' || stateLabel.includes('playing') || stateLabel.includes('riprodu');
}

function getEntityNumericValue(entity?: MockEntityState) {
  return (
    toNumber(entity?.numericValue) ??
    toNumber(entity?.currentValue) ??
    toNumber(entity?.targetValue) ??
    toNumber(entity?.state)
  );
}

function formatAmbientTemperature(value: number) {
  return `${value.toFixed(1)}\u00b0C`;
}

function formatAmbientHumidity(value: number) {
  return `${Math.round(value)}%`;
}

function buildEnergyBars(referenceValue: number | undefined) {
  const base = Number.isFinite(referenceValue ?? Number.NaN) ? Math.max(3, referenceValue ?? 0) : 23;
  return ENERGY_WEEK_DAYS.map((label, index) => {
    const delta = [0.15, 0.22, -0.05, 0.12, -0.1, 0.2, 0.08][index] ?? 0;
    const value = Math.max(2.8, Number((base * (1 + delta)).toFixed(1)));
    return { label, value };
  });
}

function parseEntityAreaMap(payload: unknown, deviceAreaByDeviceId: Record<string, string>) {
  if (!Array.isArray(payload)) {
    return {};
  }

  const result: Record<string, string> = {};
  payload.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const record = entry as Record<string, unknown>;
    const entityId = typeof record.entity_id === 'string' ? record.entity_id.trim() : '';
    if (!entityId) {
      return;
    }
    const directAreaId = typeof record.area_id === 'string' ? record.area_id.trim() : '';
    if (directAreaId) {
      result[entityId] = directAreaId;
      return;
    }
    const deviceId = typeof record.device_id === 'string' ? record.device_id.trim() : '';
    if (!deviceId) {
      return;
    }
    const areaFromDevice = deviceAreaByDeviceId[deviceId];
    if (areaFromDevice) {
      result[entityId] = areaFromDevice;
    }
  });
  return result;
}

function parseDeviceAreaMap(payload: unknown) {
  if (!Array.isArray(payload)) {
    return {};
  }
  const result: Record<string, string> = {};
  payload.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const record = entry as Record<string, unknown>;
    const deviceIdRaw =
      typeof record.id === 'string'
        ? record.id
        : typeof record.device_id === 'string'
          ? record.device_id
          : '';
    const deviceId = deviceIdRaw.trim();
    const areaId = typeof record.area_id === 'string' ? record.area_id.trim() : '';
    if (!deviceId || !areaId) {
      return;
    }
    result[deviceId] = areaId;
  });
  return result;
}

function parseHaAreaEntry(payload: unknown): HaArea | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const record = payload as HaAreaCreateResult;
  const areaId = typeof record.area_id === 'string' ? record.area_id.trim() : '';
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!areaId || !name) {
    return null;
  }
  const area: HaArea = {
    area_id: areaId,
    name,
  };
  if (Array.isArray(record.aliases)) {
    const aliases = record.aliases.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    if (aliases.length > 0) {
      area.aliases = aliases;
    }
  }
  area.floor_id = typeof record.floor_id === 'string' && record.floor_id.trim().length > 0 ? record.floor_id : null;
  area.humidity_entity_id =
    typeof record.humidity_entity_id === 'string' && record.humidity_entity_id.trim().length > 0
      ? record.humidity_entity_id
      : null;
  area.icon = typeof record.icon === 'string' && record.icon.trim().length > 0 ? record.icon : null;
  if (typeof record.picture === 'string' && record.picture.trim().length > 0) {
    area.picture = record.picture;
  }
  area.temperature_entity_id =
    typeof record.temperature_entity_id === 'string' && record.temperature_entity_id.trim().length > 0
      ? record.temperature_entity_id
      : null;
  return area;
}

function parseHaFloorList(payload: unknown): HaFloorEntry[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload
    .map((entry): HaFloorEntry | null => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const floorId = typeof record.floor_id === 'string' ? record.floor_id.trim() : '';
      const name = typeof record.name === 'string' ? record.name.trim() : '';
      const aliases = Array.isArray(record.aliases)
        ? record.aliases.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : undefined;
      if (!floorId || !name) {
        return null;
      }
      return {
        floor_id: floorId,
        name,
        aliases,
        level: typeof record.level === 'number' ? record.level : null,
        icon: typeof record.icon === 'string' ? record.icon : null,
      } satisfies HaFloorEntry;
    })
    .filter((entry): entry is HaFloorEntry => entry !== null);
}

function parseHaFloorEntry(payload: unknown): HaFloorEntry | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const floorId = typeof record.floor_id === 'string' ? record.floor_id.trim() : '';
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const aliases = Array.isArray(record.aliases)
    ? record.aliases.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : undefined;
  if (!floorId || !name) {
    return null;
  }
  return {
    floor_id: floorId,
    name,
    aliases,
    level: typeof record.level === 'number' ? record.level : null,
    icon: typeof record.icon === 'string' ? record.icon : null,
  };
}

async function fetchRegistrySnapshot(
  onCallApi: NonNullable<RoomsDashboardProps['onCallApi']>,
) {
  const [entityPayload, devicePayload] = await Promise.all([
    (await onCallApi({ type: 'config/entity_registry/list' }, { reportError: false })) ??
      (await onCallApi({ type: 'config/entity_registry/list_for_display' }, { reportError: false })),
    (await onCallApi({ type: 'config/device_registry/list' }, { reportError: false })) ??
      (await onCallApi({ type: 'config/device_registry/list_for_display' }, { reportError: false })),
  ]);
  const deviceAreaByDeviceId = parseDeviceAreaMap(devicePayload);
  const entityAreaByEntityId = parseEntityAreaMap(entityPayload, deviceAreaByDeviceId);
  return { entityAreaByEntityId };
}

function RoomsTopTab({
  tab,
  isActive,
  onClick,
}: {
  tab: RoomTab;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative inline-block rounded-lg px-3 pb-1 text-sm font-semibold leading-none tracking-normal transition-colors sm:px-4 sm:text-base',
        isActive
          ? 'text-white'
          : 'text-white/55 hover:text-white/80',
      )}
    >
      <span className="truncate">{tab.name}</span>
      {tab.source === 'custom' ? (
        <span className="ml-2 inline-flex h-1.5 w-1.5 rounded-full bg-sky-300/85" />
      ) : null}
    </button>
  );
}

function RoomIconButton({
  children,
  onClick,
  label,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white',
        className ?? GLASS_CARD_CLASS,
      )}
    >
      {children}
    </button>
  );
}

function MiniToggle({ isOn }: { isOn: boolean }) {
  return (
    <span
      className={cn(
        'flex h-5 w-10 rounded-full p-1 transition-all',
        isOn ? 'justify-end bg-[#85adff]' : 'justify-start bg-white/20',
      )}
    >
      <span className="h-3 w-3 rounded-full bg-white shadow-lg" />
    </span>
  );
}

function ClimateAction({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-w-0 flex-col items-center gap-1 text-[10px] transition-colors',
        active ? 'text-[#85adff]' : 'text-white/42 hover:text-white',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl',
          active ? 'bg-white/10' : GLASS_CARD_CLASS,
        )}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export function RoomsDashboard({
  haConnected,
  haAreas,
  haStates,
  onCallApi,
  onCallService,
}: RoomsDashboardProps) {
  const prefersReducedMotion = useReducedMotion();
  const roomTitleScrollerRef = React.useRef<HTMLDivElement | null>(null);
  const roomTitleDragRef = React.useRef<FloorCarouselDragState | null>(null);
  const roomTitleSuppressClickRef = React.useRef(false);
  const floorCarouselRef = React.useRef<HTMLDivElement | null>(null);
  const floorCarouselDragRef = React.useRef<FloorCarouselDragState | null>(null);
  const floorCarouselSuppressClickRef = React.useRef(false);
  const mobileClimateSwiperRef = React.useRef<HTMLDivElement | null>(null);
  const climateSwiperDragRef = React.useRef<FloorCarouselDragState | null>(null);
  const climateSwiperSuppressClickRef = React.useRef(false);
  const mediaSwiperRef = React.useRef<HTMLDivElement | null>(null);
  const mediaSwiperDragRef = React.useRef<FloorCarouselDragState | null>(null);
  const mediaSwiperSuppressClickRef = React.useRef(false);
  const [customRooms, setCustomRooms] = React.useState<CustomRoomRecord[]>(readStoredCustomRooms);
  const [createdHaAreas, setCreatedHaAreas] = React.useState<HaArea[]>([]);
  const [deletedHaAreaIds, setDeletedHaAreaIds] = React.useState<string[]>([]);
  const [activeRoomId, setActiveRoomId] = React.useState<string>(readStoredActiveRoomId);
  const [selectedFloorId, setSelectedFloorId] = React.useState<string>('all');
  const [selectedClimateEntityId, setSelectedClimateEntityId] = React.useState('');
  const [selectedMediaEntityId, setSelectedMediaEntityId] = React.useState('');
  const [isFloorLayerOpen, setIsFloorLayerOpen] = React.useState(false);
  const [isManageOpen, setIsManageOpen] = React.useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = React.useState(false);
  const [isAreaCreateDetailsOpen, setIsAreaCreateDetailsOpen] = React.useState(false);
  const [editingRoom, setEditingRoom] = React.useState<RoomEditTarget | null>(null);
  const [expandedRoomSection, setExpandedRoomSection] = React.useState<ExpandedRoomSection | null>(null);
  const [newRoomName, setNewRoomName] = React.useState('');
  const [areaCreationDraft, setAreaCreationDraft] = React.useState<AreaCreationDraft>(EMPTY_AREA_CREATION_DRAFT);
  const [roomCreateError, setRoomCreateError] = React.useState<string | null>(null);
  const [areaActionById, setAreaActionById] = React.useState<Record<string, 'saving' | 'deleting'>>({});
  const [areaErrorById, setAreaErrorById] = React.useState<Record<string, string>>({});
  const [haFloors, setHaFloors] = React.useState<HaFloorEntry[]>([]);
  const [createdHaFloors, setCreatedHaFloors] = React.useState<HaFloorEntry[]>([]);
  const [deletedHaFloorIds, setDeletedHaFloorIds] = React.useState<string[]>([]);
  const [editingFloorId, setEditingFloorId] = React.useState<string | null>(null);
  const [floorDraftById, setFloorDraftById] = React.useState<Record<string, FloorDraft>>({});
  const [floorActionById, setFloorActionById] = React.useState<Record<string, FloorAction>>({});
  const [floorErrorById, setFloorErrorById] = React.useState<Record<string, string>>({});
  const [floorDeleteCandidate, setFloorDeleteCandidate] = React.useState<HaFloorEntry | null>(null);
  const [isAddingFloor, setIsAddingFloor] = React.useState(false);
  const [newFloorDraft, setNewFloorDraft] = React.useState<FloorDraft>(EMPTY_FLOOR_DRAFT);
  const [isCreatingFloor, setIsCreatingFloor] = React.useState(false);
  const [floorCreateError, setFloorCreateError] = React.useState<string | null>(null);
  const [isLoadingAreaMetadata, setIsLoadingAreaMetadata] = React.useState(false);
  const [entityAreaByEntityId, setEntityAreaByEntityId] = React.useState<Record<string, string>>({});
  const [registryLoadAt, setRegistryLoadAt] = React.useState<number>(0);
  const [demoToggleById, setDemoToggleById] = React.useState<Record<string, boolean>>({
    'demo-light': true,
    'demo-stereo': false,
    'demo-tv': false,
    'demo-monitoring': true,
  });
  const [sceneByRoomId, setSceneByRoomId] = React.useState<Record<string, string>>({});

  const resetRoomForm = React.useCallback(() => {
    setEditingRoom(null);
    setNewRoomName('');
    setAreaCreationDraft(EMPTY_AREA_CREATION_DRAFT);
    setRoomCreateError(null);
    setIsAreaCreateDetailsOpen(false);
  }, []);

  const effectiveHaAreas = React.useMemo<HaArea[]>(() => {
    if (!haConnected) {
      return [];
    }
    const deletedAreaIds = new Set(deletedHaAreaIds);
    const localAreaById = new Map(createdHaAreas.map((area) => [area.area_id, area]));
    const visibleHaAreas = haAreas.filter((area) => !deletedAreaIds.has(area.area_id));
    const knownAreaIds = new Set(visibleHaAreas.map((area) => area.area_id));
    return [
      ...visibleHaAreas.map((area) => localAreaById.get(area.area_id) ?? area),
      ...createdHaAreas.filter((area) => !knownAreaIds.has(area.area_id) && !deletedAreaIds.has(area.area_id)),
    ];
  }, [createdHaAreas, deletedHaAreaIds, haAreas, haConnected]);

  const effectiveHaFloors = React.useMemo<HaFloorEntry[]>(() => {
    if (!haConnected) {
      return [];
    }
    const deletedFloorIds = new Set(deletedHaFloorIds);
    const localFloorById = new Map(createdHaFloors.map((floor) => [floor.floor_id, floor]));
    const visibleFloors = haFloors.filter((floor) => !deletedFloorIds.has(floor.floor_id));
    const knownFloorIds = new Set(visibleFloors.map((floor) => floor.floor_id));
    return [
      ...visibleFloors.map((floor) => localFloorById.get(floor.floor_id) ?? floor),
      ...createdHaFloors.filter(
        (floor) => !knownFloorIds.has(floor.floor_id) && !deletedFloorIds.has(floor.floor_id),
      ),
    ];
  }, [createdHaFloors, deletedHaFloorIds, haConnected, haFloors]);

  const floorById = React.useMemo(
    () => new Map(effectiveHaFloors.map((floor) => [floor.floor_id, floor])),
    [effectiveHaFloors],
  );
  const areaById = React.useMemo(
    () => new Map(effectiveHaAreas.map((area) => [area.area_id, area])),
    [effectiveHaAreas],
  );
  const currentFloor = selectedFloorId === 'all' ? undefined : floorById.get(selectedFloorId);
  const currentFloorLabel = selectedFloorId === 'all' ? 'Tutti i Piani' : currentFloor?.name ?? 'Tutti i Piani';
  const currentFloorTabLabel = formatFloorTabLabel(currentFloor);
  const CurrentFloorIcon = getFloorIcon(currentFloor);
  const roomCountByFloorId = React.useMemo<Record<string, number>>(() => {
    return effectiveHaAreas.reduce<Record<string, number>>((acc, area) => {
      if (area.floor_id) {
        acc[area.floor_id] = (acc[area.floor_id] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [effectiveHaAreas]);

  const haRoomTabs = React.useMemo<RoomTab[]>(
    () =>
      effectiveHaAreas.map((area) => ({
        id: area.area_id,
        name: area.name,
        source: 'ha',
      })),
    [effectiveHaAreas],
  );

  const customRoomTabs = React.useMemo<RoomTab[]>(
    () =>
      [...customRooms]
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((room) => ({
          id: room.id,
          name: room.name,
          source: 'custom',
        })),
    [customRooms],
  );

  const allRoomTabs = React.useMemo<RoomTab[]>(() => {
    const merged = [...haRoomTabs, ...customRoomTabs];
    return merged.length > 0 ? merged : DEMO_ROOM_TABS;
  }, [customRoomTabs, haRoomTabs]);
  const roomTabs = React.useMemo<RoomTab[]>(() => {
    if (selectedFloorId === 'all') {
      return allRoomTabs;
    }
    return allRoomTabs.filter((tab) => {
      if (tab.source !== 'ha') {
        return false;
      }
      const area = effectiveHaAreas.find((haArea) => haArea.area_id === tab.id);
      return area?.floor_id === selectedFloorId;
    });
  }, [allRoomTabs, effectiveHaAreas, selectedFloorId]);
  const persistedCustomRoomIds = React.useMemo(
    () => new Set(customRooms.map((room) => room.id)),
    [customRooms],
  );

  const roomIds = React.useMemo(() => new Set(roomTabs.map((tab) => tab.id)), [roomTabs]);
  const activeRoomTab = React.useMemo(
    () => roomTabs.find((tab) => tab.id === activeRoomId) ?? roomTabs[0] ?? null,
    [activeRoomId, roomTabs],
  );
  const activeRoomTitle = activeRoomTab?.name ?? (selectedFloorId === 'all' ? 'Stanze' : currentFloorLabel);
  const activeRoomTitleKey = `${activeRoomTab?.id ?? 'default-room'}:${activeRoomTitle}`;
  const temperatureEntityOptions = React.useMemo(
    () =>
      Object.entries(haStates)
        .filter(([entityId, state]) => isAreaSensorEntityCandidate(entityId, state, 'temperature'))
        .map(([entityId, state]) => ({ entityId, name: getEntityFriendlyName(entityId, state) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [haStates],
  );
  const humidityEntityOptions = React.useMemo(
    () =>
      Object.entries(haStates)
        .filter(([entityId, state]) => isAreaSensorEntityCandidate(entityId, state, 'humidity'))
        .map(([entityId, state]) => ({ entityId, name: getEntityFriendlyName(entityId, state) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [haStates],
  );

  React.useLayoutEffect(() => {
    const scroller = roomTitleScrollerRef.current;
    if (!scroller || scroller.scrollLeft <= 1) {
      return;
    }
    scroller.scrollTo({
      left: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [activeRoomTitleKey, prefersReducedMotion]);

  React.useEffect(() => {
    setExpandedRoomSection(null);
  }, [activeRoomTitleKey]);

  React.useEffect(() => {
    if (roomTabs.length === 0) {
      if (activeRoomId) {
        setActiveRoomId('');
      }
      return;
    }
    if (!activeRoomId || !roomIds.has(activeRoomId)) {
      setActiveRoomId(roomTabs[0].id);
    }
  }, [activeRoomId, roomIds, roomTabs]);

  React.useEffect(() => {
    if (selectedFloorId === 'all' || floorById.has(selectedFloorId)) {
      return;
    }
    setSelectedFloorId('all');
  }, [floorById, selectedFloorId]);

  React.useEffect(() => {
    if (isManageOpen) {
      return;
    }
    resetRoomForm();
  }, [isManageOpen, resetRoomForm]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(CUSTOM_ROOMS_STORAGE_KEY, JSON.stringify(customRooms));
  }, [customRooms]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!activeRoomId) {
      window.localStorage.removeItem(ACTIVE_ROOM_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(ACTIVE_ROOM_STORAGE_KEY, activeRoomId);
  }, [activeRoomId]);

  React.useEffect(() => {
    if (!haConnected || !onCallApi) {
      setEntityAreaByEntityId({});
      return;
    }
    let cancelled = false;

    const load = async () => {
      const snapshot = await fetchRegistrySnapshot(onCallApi);
      if (cancelled) {
        return;
      }
      setEntityAreaByEntityId(snapshot.entityAreaByEntityId);
      setRegistryLoadAt(Date.now());
    };

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [haConnected, onCallApi]);

  React.useEffect(() => {
    if (!isManageOpen) {
      return;
    }
    setAreaErrorById({});
  }, [isManageOpen]);

  React.useEffect(() => {
    if (!haConnected || !onCallApi) {
      setHaFloors([]);
      setIsLoadingAreaMetadata(false);
      return;
    }

    let cancelled = false;
    setIsLoadingAreaMetadata(true);

    const load = async () => {
      const floorPayload = await onCallApi({ type: 'config/floor_registry/list' }, { reportError: false });
      if (cancelled) {
        return;
      }
      setHaFloors(parseHaFloorList(floorPayload));
      setIsLoadingAreaMetadata(false);
    };

    void load().catch(() => {
      if (!cancelled) {
        setHaFloors([]);
        setIsLoadingAreaMetadata(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [haConnected, onCallApi]);

  const addCustomRoom = async () => {
    const normalized = normalizeRoomName(newRoomName);
    if (!normalized) {
      return;
    }

    setRoomCreateError(null);

    if (haConnected && onCallApi) {
      setIsCreatingRoom(true);
      try {
        const aliases = uniqueStrings(parseDelimitedList(areaCreationDraft.aliases));
        const areaCreatePayload: Record<string, unknown> = {
          type: 'config/area_registry/create',
          name: normalized,
        };
        if (areaCreationDraft.floorId.trim()) {
          areaCreatePayload.floor_id = areaCreationDraft.floorId.trim();
        }
        if (areaCreationDraft.icon.trim()) {
          areaCreatePayload.icon = areaCreationDraft.icon.trim();
        }
        if (aliases.length > 0) {
          areaCreatePayload.aliases = aliases;
        }
        if (areaCreationDraft.picture.trim()) {
          areaCreatePayload.picture = areaCreationDraft.picture.trim();
        }
        if (areaCreationDraft.temperatureEntityId.trim()) {
          areaCreatePayload.temperature_entity_id = areaCreationDraft.temperatureEntityId.trim();
        }
        if (areaCreationDraft.humidityEntityId.trim()) {
          areaCreatePayload.humidity_entity_id = areaCreationDraft.humidityEntityId.trim();
        }
        const createdArea = parseHaAreaEntry(
          await onCallApi(areaCreatePayload),
        );
        if (!createdArea) {
          setRoomCreateError('Non sono riuscito a creare l\'area su Home Assistant.');
          return;
        }
        setCreatedHaAreas((current) => {
          const withoutDuplicate = current.filter((area) => area.area_id !== createdArea.area_id);
          return [...withoutDuplicate, createdArea];
        });
        setActiveRoomId(createdArea.area_id);
        resetRoomForm();
        return;
      } catch {
        setRoomCreateError('Non sono riuscito a creare l\'area su Home Assistant.');
        return;
      } finally {
        setIsCreatingRoom(false);
      }
    }

    const id = `${ROOM_ID_CUSTOM_PREFIX}${buildRandomId()}`;
    const nextRoom: CustomRoomRecord = {
      id,
      name: normalized,
      createdAt: Date.now(),
    };
    setCustomRooms((current) => [...current, nextRoom]);
    setActiveRoomId(id);
    resetRoomForm();
  };

  const startEditRoom = (tab: RoomTab, haArea?: HaArea | null) => {
    if (tab.source === 'ha' && !haArea) {
      return;
    }
    setEditingRoom({ id: tab.id, source: tab.source });
    setActiveRoomId(tab.id);
    setRoomCreateError(null);
    setNewRoomName(tab.name);
    if (tab.source === 'ha' && haArea) {
      const draft = buildAreaEditDraft(haArea);
      setNewRoomName(draft.name);
      setAreaCreationDraft({
        floorId: draft.floorId,
        icon: draft.icon,
        aliases: draft.aliases,
        picture: draft.picture,
        temperatureEntityId: draft.temperatureEntityId,
        humidityEntityId: draft.humidityEntityId,
      });
      setIsAreaCreateDetailsOpen(true);
      return;
    }
    setAreaCreationDraft(EMPTY_AREA_CREATION_DRAFT);
    setIsAreaCreateDetailsOpen(false);
  };

  const saveRoomEdit = async () => {
    if (!editingRoom) {
      return;
    }
    const nextName = normalizeRoomName(newRoomName);
    if (!nextName) {
      setRoomCreateError('Inserisci un nome per la stanza.');
      return;
    }

    setRoomCreateError(null);

    if (editingRoom.source === 'custom') {
      setCustomRooms((current) =>
        current.map((room) => (room.id === editingRoom.id ? { ...room, name: nextName } : room)),
      );
      setActiveRoomId(editingRoom.id);
      resetRoomForm();
      return;
    }

    if (!onCallApi) {
      setRoomCreateError('Home Assistant non e disponibile in questo momento.');
      return;
    }

    setAreaActionById((current) => ({ ...current, [editingRoom.id]: 'saving' }));
    setAreaErrorById((current) => {
      const next = { ...current };
      delete next[editingRoom.id];
      return next;
    });

    try {
      const updatedArea = parseHaAreaEntry(
        await onCallApi({
          type: 'config/area_registry/update',
          area_id: editingRoom.id,
          name: nextName,
          floor_id: trimToNull(areaCreationDraft.floorId),
          icon: trimToNull(areaCreationDraft.icon),
          aliases: uniqueStrings(parseDelimitedList(areaCreationDraft.aliases)),
          picture: trimToNull(areaCreationDraft.picture),
          temperature_entity_id: trimToNull(areaCreationDraft.temperatureEntityId),
          humidity_entity_id: trimToNull(areaCreationDraft.humidityEntityId),
        }),
      );
      if (!updatedArea) {
        setRoomCreateError('Non sono riuscito a salvare l\'area su Home Assistant.');
        return;
      }
      setCreatedHaAreas((current) => {
        const withoutDuplicate = current.filter((area) => area.area_id !== updatedArea.area_id);
        return [...withoutDuplicate, updatedArea];
      });
      setDeletedHaAreaIds((current) => current.filter((id) => id !== updatedArea.area_id));
      setActiveRoomId(updatedArea.area_id);
      resetRoomForm();
    } catch {
      setRoomCreateError('Non sono riuscito a salvare l\'area su Home Assistant.');
    } finally {
      setAreaActionById((current) => {
        const next = { ...current };
        delete next[editingRoom.id];
        return next;
      });
    }
  };

  const submitRoomForm = async () => {
    if (editingRoom) {
      await saveRoomEdit();
      return;
    }
    await addCustomRoom();
  };

  const removeCustomRoom = (roomId: string, roomName: string) => {
    const confirmed =
      typeof window === 'undefined' ||
      window.confirm(`Vuoi eliminare la stanza "${roomName}"?`);
    if (!confirmed) {
      return;
    }
    setCustomRooms((current) => current.filter((room) => room.id !== roomId));
    if (editingRoom?.id === roomId) {
      resetRoomForm();
    }
    if (activeRoomId === roomId) {
      const nextRoom = roomTabs.find((tab) => tab.id !== roomId);
      setActiveRoomId(nextRoom?.id ?? '');
    }
  };

  const removeHaArea = async (areaId: string, areaName: string) => {
    if (!onCallApi) {
      return;
    }
    const confirmed =
      typeof window === 'undefined' ||
      window.confirm(`Vuoi eliminare l'area "${areaName}" da Home Assistant?`);
    if (!confirmed) {
      return;
    }

    setAreaActionById((current) => ({ ...current, [areaId]: 'deleting' }));
    setAreaErrorById((current) => {
      const next = { ...current };
      delete next[areaId];
      return next;
    });

    try {
      const result = await onCallApi({
        type: 'config/area_registry/delete',
        area_id: areaId,
      });
      if (result === null) {
        setAreaErrorById((current) => ({
          ...current,
          [areaId]: 'Non sono riuscito a eliminare l\'area su Home Assistant.',
        }));
        return;
      }
      setDeletedHaAreaIds((current) => uniqueStrings([...current, areaId]));
      setCreatedHaAreas((current) => current.filter((area) => area.area_id !== areaId));
      if (editingRoom?.id === areaId) {
        resetRoomForm();
      }
      if (activeRoomId === areaId) {
        const nextRoom = roomTabs.find((tab) => tab.id !== areaId);
        setActiveRoomId(nextRoom?.id ?? '');
      }
    } catch {
      setAreaErrorById((current) => ({
        ...current,
        [areaId]: 'Non sono riuscito a eliminare l\'area su Home Assistant.',
      }));
    } finally {
      setAreaActionById((current) => {
        const next = { ...current };
        delete next[areaId];
        return next;
      });
    }
  };

  const resetFloorCreateForm = () => {
    setIsAddingFloor(false);
    setNewFloorDraft(EMPTY_FLOOR_DRAFT);
    setFloorCreateError(null);
  };

  const startEditFloor = (floor: HaFloorEntry) => {
    setEditingFloorId(floor.floor_id);
    setFloorDraftById((current) => ({ ...current, [floor.floor_id]: buildFloorDraft(floor) }));
    setFloorErrorById((current) => {
      const next = { ...current };
      delete next[floor.floor_id];
      return next;
    });
  };

  const createHaFloor = async () => {
    if (!onCallApi) {
      setFloorCreateError('Home Assistant non e disponibile in questo momento.');
      return;
    }
    const nextName = normalizeRoomName(newFloorDraft.name);
    if (!nextName) {
      setFloorCreateError('Inserisci un nome per il piano.');
      return;
    }
    const nextLevel = parseOptionalInteger(newFloorDraft.level);
    if (nextLevel === undefined) {
      setFloorCreateError('Il livello deve essere un numero intero.');
      return;
    }

    setIsCreatingFloor(true);
    setFloorCreateError(null);
    try {
      const aliases = uniqueStrings(parseDelimitedList(newFloorDraft.aliases));
      const floorCreatePayload: Record<string, unknown> = {
        type: 'config/floor_registry/create',
        name: nextName,
      };
      if (aliases.length > 0) {
        floorCreatePayload.aliases = aliases;
      }
      if (nextLevel !== null) {
        floorCreatePayload.level = nextLevel;
      }
      const createdFloor = parseHaFloorEntry(
        await onCallApi(floorCreatePayload),
      );
      if (!createdFloor) {
        setFloorCreateError('Non sono riuscito a creare il piano su Home Assistant.');
        return;
      }
      setCreatedHaFloors((current) => {
        const withoutDuplicate = current.filter((floor) => floor.floor_id !== createdFloor.floor_id);
        return [...withoutDuplicate, createdFloor];
      });
      setDeletedHaFloorIds((current) => current.filter((id) => id !== createdFloor.floor_id));
      setSelectedFloorId(createdFloor.floor_id);
      resetFloorCreateForm();
      setIsFloorLayerOpen(false);
    } catch {
      setFloorCreateError('Non sono riuscito a creare il piano su Home Assistant.');
    } finally {
      setIsCreatingFloor(false);
    }
  };

  const saveHaFloor = async (floorId: string) => {
    if (!onCallApi) {
      return;
    }
    const draft = floorDraftById[floorId];
    if (!draft) {
      return;
    }
    const nextName = normalizeRoomName(draft.name);
    if (!nextName) {
      setFloorErrorById((current) => ({ ...current, [floorId]: 'Inserisci un nome per il piano.' }));
      return;
    }
    const nextLevel = parseOptionalInteger(draft.level);
    if (nextLevel === undefined) {
      setFloorErrorById((current) => ({ ...current, [floorId]: 'Il livello deve essere un numero intero.' }));
      return;
    }

    setFloorActionById((current) => ({ ...current, [floorId]: 'saving' }));
    setFloorErrorById((current) => {
      const next = { ...current };
      delete next[floorId];
      return next;
    });

    try {
      const aliases = uniqueStrings(parseDelimitedList(draft.aliases));
      const updatedFloor = parseHaFloorEntry(
        await onCallApi({
          type: 'config/floor_registry/update',
          floor_id: floorId,
          name: nextName,
          aliases,
          level: nextLevel,
        }),
      );
      if (!updatedFloor) {
        setFloorErrorById((current) => ({
          ...current,
          [floorId]: 'Non sono riuscito a salvare il piano su Home Assistant.',
        }));
        return;
      }
      setCreatedHaFloors((current) => {
        const withoutDuplicate = current.filter((floor) => floor.floor_id !== updatedFloor.floor_id);
        return [...withoutDuplicate, updatedFloor];
      });
      setEditingFloorId(null);
      setSelectedFloorId(updatedFloor.floor_id);
    } catch {
      setFloorErrorById((current) => ({
        ...current,
        [floorId]: 'Non sono riuscito a salvare il piano su Home Assistant.',
      }));
    } finally {
      setFloorActionById((current) => {
        const next = { ...current };
        delete next[floorId];
        return next;
      });
    }
  };

  const reorderHaFloor = async (floorId: string, direction: -1 | 1) => {
    if (!onCallApi) {
      return;
    }
    const currentIndex = effectiveHaFloors.findIndex((floor) => floor.floor_id === floorId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= effectiveHaFloors.length) {
      return;
    }
    const nextFloors = [...effectiveHaFloors];
    const [movedFloor] = nextFloors.splice(currentIndex, 1);
    nextFloors.splice(nextIndex, 0, movedFloor);

    setFloorActionById((current) => ({ ...current, [floorId]: 'reordering' }));
    setFloorErrorById((current) => {
      const next = { ...current };
      delete next[floorId];
      return next;
    });

    try {
      await onCallApi({
        type: 'config/floor_registry/reorder',
        floor_ids: nextFloors.map((floor) => floor.floor_id),
      });
      setHaFloors(nextFloors);
    } catch {
      setFloorErrorById((current) => ({
        ...current,
        [floorId]: 'Non sono riuscito a riordinare i piani su Home Assistant.',
      }));
    } finally {
      setFloorActionById((current) => {
        const next = { ...current };
        delete next[floorId];
        return next;
      });
    }
  };

  const removeHaFloor = async (floor: HaFloorEntry) => {
    if (!onCallApi) {
      return;
    }

    setFloorActionById((current) => ({ ...current, [floor.floor_id]: 'deleting' }));
    setFloorErrorById((current) => {
      const next = { ...current };
      delete next[floor.floor_id];
      return next;
    });

    try {
      await onCallApi({
        type: 'config/floor_registry/delete',
        floor_id: floor.floor_id,
      });
      setDeletedHaFloorIds((current) => uniqueStrings([...current, floor.floor_id]));
      setCreatedHaFloors((current) => current.filter((entry) => entry.floor_id !== floor.floor_id));
      setFloorDraftById((current) => {
        const next = { ...current };
        delete next[floor.floor_id];
        return next;
      });
      if (selectedFloorId === floor.floor_id) {
        setSelectedFloorId('all');
      }
      if (editingFloorId === floor.floor_id) {
        setEditingFloorId(null);
      }
      setFloorDeleteCandidate(null);
    } catch {
      setFloorErrorById((current) => ({
        ...current,
        [floor.floor_id]: 'Non sono riuscito a eliminare il piano su Home Assistant.',
      }));
    } finally {
      setFloorActionById((current) => {
        const next = { ...current };
        delete next[floor.floor_id];
        return next;
      });
    }
  };

  const bucketsByAreaId = React.useMemo<Record<string, RoomEntityBuckets>>(() => {
    const byArea: Record<string, RoomEntityBuckets> = {};
    Object.keys(haStates).forEach((entityId) => {
      const areaId = entityAreaByEntityId[entityId];
      if (!areaId) {
        return;
      }
      const buckets = byArea[areaId] ?? createEmptyBuckets();
      bucketEntityId(entityId, buckets);
      byArea[areaId] = buckets;
    });
    return byArea;
  }, [entityAreaByEntityId, haStates]);

  const activeBuckets = React.useMemo(() => {
    if (!activeRoomTab || activeRoomTab.source !== 'ha') {
      return createEmptyBuckets();
    }
    return bucketsByAreaId[activeRoomTab.id] ?? createEmptyBuckets();
  }, [activeRoomTab, bucketsByAreaId]);
  const activeRoomArea = React.useMemo(
    () => (activeRoomTab?.source === 'ha' ? areaById.get(activeRoomTab.id) ?? null : null),
    [activeRoomTab, areaById],
  );
  const isDemoSeedRoom = Boolean(activeRoomTab?.id.startsWith('demo-'));

  const weatherEntityId = React.useMemo(() => {
    if (activeBuckets.weathers.length > 0) {
      return activeBuckets.weathers[0];
    }
    if (isDemoSeedRoom) {
      return Object.keys(haStates).find((entityId) => entityId.startsWith('weather.')) ?? null;
    }
    return null;
  }, [activeBuckets.weathers, haStates, isDemoSeedRoom]);

  const climateEntityIds = React.useMemo(
    () => (activeBuckets.climates.length > 0 ? activeBuckets.climates : isDemoSeedRoom ? ['climate.air_conditioner'] : []),
    [activeBuckets.climates, isDemoSeedRoom],
  );

  React.useEffect(() => {
    if (climateEntityIds.length === 0) {
      setSelectedClimateEntityId('');
      return;
    }
    setSelectedClimateEntityId((current) => (current && climateEntityIds.includes(current) ? current : climateEntityIds[0]));
  }, [climateEntityIds]);

  const climateEntityId = selectedClimateEntityId || climateEntityIds[0] || null;
  const climateEntity = climateEntityId ? haStates[climateEntityId] : undefined;
  const climateCurrentTemp =
    toNumber(climateEntity?.currentValue) ??
    toNumber(climateEntity?.rawAttributes?.current_temperature) ??
    24;
  const climateTargetTemp =
    toNumber(climateEntity?.targetValue) ??
    toNumber(climateEntity?.rawAttributes?.temperature) ??
    22;
  const climateMode =
    `${climateEntity?.hvacMode ?? climateEntity?.rawAttributes?.hvac_mode ?? 'auto'}`
      .trim()
      .toUpperCase();

  const doorTiles = React.useMemo<RoomDoorTile[]>(() => {
    const lockIds = activeBuckets.locks.slice(0, 2);
    if (lockIds.length === 0 && isDemoSeedRoom) {
      return [
        {
          id: 'demo-front-door',
          title: 'Porta ingresso',
          subtitle: 'Chiusa',
          isClosed: true,
          icon: <Lock size={16} />,
          isLive: false,
        },
        {
          id: 'demo-back-door',
          title: 'Porta retro',
          subtitle: 'Chiusa',
          isClosed: true,
          icon: <Lock size={16} />,
          isLive: false,
        },
      ];
    }
    if (lockIds.length === 0) {
      return [];
    }
    return lockIds.map((entityId) => {
      const state = haStates[entityId];
      const normalized = `${state?.state ?? ''}`.trim().toLowerCase();
      const isClosed = normalized === 'locked' || normalized === 'closed';
      return {
        id: entityId,
        title: getEntityFriendlyName(entityId, state),
        subtitle: isClosed ? 'Chiusa' : 'Aperta',
        entityId,
        isClosed,
        icon: isClosed ? <Lock size={16} /> : <Unlock size={16} />,
        isLive: true,
      };
    });
  }, [activeBuckets.locks, haStates, isDemoSeedRoom]);

  const quickTiles = React.useMemo<RoomQuickTile[]>(() => {
    const liveCandidates = [
      ...activeBuckets.lights,
      ...activeBuckets.switches,
      ...activeBuckets.medias,
    ]
      .slice(0, 4)
      .map((entityId) => {
        const domain = entityId.split('.')[0];
        const state = haStates[entityId];
        const icon =
          domain === 'media_player' ? (
            <Speaker size={18} />
          ) : domain === 'switch' || domain === 'input_boolean' ? (
            <Tv size={18} />
          ) : (
            <Lightbulb size={18} />
          );
        const supportsToggle = ['light', 'switch', 'input_boolean', 'fan', 'media_player'].includes(domain);
        return {
          id: entityId,
          title: getEntityFriendlyName(entityId, state),
          domain,
          entityId,
          isOn: isEntityOn(entityId, state),
          icon,
          isLive: true,
          isToggleSupported: supportsToggle,
        } satisfies RoomQuickTile;
      });

    if (liveCandidates.length > 0) {
      return liveCandidates;
    }
    if (!isDemoSeedRoom) {
      return [];
    }

    return [
      {
        id: 'demo-light',
        title: 'Luce',
        domain: 'light',
        isOn: demoToggleById['demo-light'] ?? true,
        icon: <Lightbulb size={18} />,
        isLive: false,
        isToggleSupported: true,
      },
      {
        id: 'demo-stereo',
        title: 'Stereo',
        domain: 'media_player',
        isOn: demoToggleById['demo-stereo'] ?? false,
        icon: <Speaker size={18} />,
        isLive: false,
        isToggleSupported: true,
      },
      {
        id: 'demo-tv',
        title: 'Televisione',
        domain: 'switch',
        isOn: demoToggleById['demo-tv'] ?? false,
        icon: <Tv size={18} />,
        isLive: false,
        isToggleSupported: true,
      },
      {
        id: 'demo-monitoring',
        title: 'Monitoraggio',
        domain: 'switch',
        isOn: demoToggleById['demo-monitoring'] ?? true,
        icon: <Video size={18} />,
        isLive: false,
        isToggleSupported: true,
      },
    ];
  }, [
    activeBuckets.lights,
    activeBuckets.medias,
    activeBuckets.switches,
    demoToggleById,
    haStates,
    isDemoSeedRoom,
  ]);

  const mediaEntityIds = React.useMemo(
    () => {
      const ids = activeBuckets.medias.length > 0 ? activeBuckets.medias : isDemoSeedRoom ? ['media_player.living_room_tv'] : [];
      return [...ids].sort((left, right) => {
        const leftPlaying = isMediaEntityPlaying(haStates[left]);
        const rightPlaying = isMediaEntityPlaying(haStates[right]);
        if (leftPlaying === rightPlaying) {
          return 0;
        }
        return leftPlaying ? -1 : 1;
      });
    },
    [activeBuckets.medias, haStates, isDemoSeedRoom],
  );
  const primaryPlayingMediaEntityId = React.useMemo(
    () => mediaEntityIds.find((entityId) => isMediaEntityPlaying(haStates[entityId])) ?? '',
    [haStates, mediaEntityIds],
  );

  React.useEffect(() => {
    if (mediaEntityIds.length === 0) {
      setSelectedMediaEntityId('');
      return;
    }
    setSelectedMediaEntityId((current) => {
      if (primaryPlayingMediaEntityId && !isMediaEntityPlaying(haStates[current])) {
        return primaryPlayingMediaEntityId;
      }
      return current && mediaEntityIds.includes(current) ? current : mediaEntityIds[0];
    });
  }, [haStates, mediaEntityIds, primaryPlayingMediaEntityId]);

  const mediaEntityId = selectedMediaEntityId || mediaEntityIds[0] || null;
  const mediaEntity = mediaEntityId ? haStates[mediaEntityId] : undefined;
  const mediaTitle = mediaEntity?.mediaTitle ?? mediaEntity?.nowPlaying ?? (isDemoSeedRoom ? 'COFFIN (feat. Eminem)' : 'Lettore multimediale');
  const mediaArtist = mediaEntity?.mediaArtist ?? (isDemoSeedRoom ? 'Jessie Reyez, Eminem' : 'In pausa');
  const mediaDuration = toNumber(mediaEntity?.mediaDuration) ?? (isDemoSeedRoom ? 212 : 1);
  const mediaPosition = toNumber(mediaEntity?.mediaPosition) ?? (isDemoSeedRoom ? 131 : 0);
  const mediaProgress = Math.min(1, Math.max(0, mediaDuration > 0 ? mediaPosition / mediaDuration : 0.4));
  const mediaIsPlaying = mediaEntity ? isEntityOn(mediaEntityId ?? '', mediaEntity) : isDemoSeedRoom;
  const isAnyMediaActive = React.useMemo(
    () =>
      isDemoSeedRoom ||
      mediaEntityIds.some((entityId) => isMediaEntityPlaying(haStates[entityId])),
    [haStates, isDemoSeedRoom, mediaEntityIds],
  );

  const energyReferenceValue = React.useMemo(() => {
    const sensorEntityId = activeBuckets.sensors.find((entityId) =>
      /energy|power|consum|watt|kw|kwh/i.test(entityId),
    );
    if (!sensorEntityId) {
      return undefined;
    }
    const entity = haStates[sensorEntityId];
    return toNumber(entity?.numericValue) ?? toNumber(entity?.state);
  }, [activeBuckets.sensors, haStates]);
  const hasEnergyCard = energyReferenceValue !== undefined || isDemoSeedRoom;
  const energyBars = React.useMemo(() => buildEnergyBars(energyReferenceValue), [energyReferenceValue]);
  const maxEnergyValue = React.useMemo(
    () => Math.max(...energyBars.map((entry) => entry.value), 1),
    [energyBars],
  );
  const highlightedEnergyIndex = Math.min(2, energyBars.length - 1);

  const callEntityToggle = async (tile: RoomQuickTile) => {
    if (!tile.isToggleSupported) {
      return;
    }
    if (!tile.isLive || !tile.entityId || !onCallService) {
      setDemoToggleById((current) => ({
        ...current,
        [tile.id]: !tile.isOn,
      }));
      return;
    }

    const domain = tile.domain;
    const entityId = tile.entityId;

    if (domain === 'media_player') {
      await onCallService('media_player', 'media_play_pause', { entity_id: entityId });
      return;
    }

    const nextService = tile.isOn ? 'turn_off' : 'turn_on';
    await onCallService(domain, nextService, { entity_id: entityId });
  };

  const handleMediaAction = async (service: 'media_previous_track' | 'media_play_pause' | 'media_next_track') => {
    if (!mediaEntityId || !onCallService) {
      return;
    }
    await onCallService('media_player', service, { entity_id: mediaEntityId });
  };

  const registryUpdatedLabel =
    registryLoadAt > 0
      ? `Registro aggiornato ${new Date(registryLoadAt).toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : 'Registro in attesa';

  const roomAmbientSubtitle = React.useMemo(() => {
    const temperatureEntityId = activeRoomArea?.temperature_entity_id ?? null;
    const humidityEntityId = activeRoomArea?.humidity_entity_id ?? null;
    const temperatureValue = temperatureEntityId ? getEntityNumericValue(haStates[temperatureEntityId]) : undefined;
    const humidityValue = humidityEntityId ? getEntityNumericValue(haStates[humidityEntityId]) : undefined;
    const temperatureLabel = typeof temperatureValue === 'number' ? formatAmbientTemperature(temperatureValue) : null;
    const humidityLabel = typeof humidityValue === 'number' ? formatAmbientHumidity(humidityValue) : null;

    if (temperatureLabel && humidityLabel) {
      return `Ambiente a ${temperatureLabel} con umidita al ${humidityLabel}`;
    }
    if (temperatureLabel) {
      return `Ambiente a ${temperatureLabel}`;
    }
    if (humidityLabel) {
      return `Ambiente con umidita al ${humidityLabel}`;
    }
    return 'Nessun sensore';
  }, [activeRoomArea, haStates]);
  const lightRows = React.useMemo<RoomLightRow[]>(() => {
    const liveIds = [...activeBuckets.lights, ...activeBuckets.switches].slice(0, 4);
    if (liveIds.length > 0) {
      return liveIds.map((entityId) => {
        const state = haStates[entityId];
        const rawBrightness = toNumber(state?.rawAttributes?.brightness);
        const brightnessPct = rawBrightness
          ? Math.round((rawBrightness / 255) * 100)
          : isEntityOn(entityId, state)
            ? 72
            : 24;
        return {
          id: entityId,
          title: getEntityFriendlyName(entityId, state),
          domain: entityId.split('.')[0],
          entityId,
          isLive: true,
          isOn: isEntityOn(entityId, state),
          brightnessPct: Math.max(1, Math.min(100, brightnessPct)),
        };
      });
    }
    if (!isDemoSeedRoom) {
      return [];
    }
    return quickTiles
      .filter((tile) => ['light', 'switch', 'input_boolean', 'fan'].includes(tile.domain))
      .slice(0, 4)
      .map((tile) => ({
        id: tile.id,
        title: tile.title,
        domain: tile.domain,
        entityId: tile.entityId,
        isLive: tile.isLive,
        isOn: tile.isOn,
        brightnessPct: tile.isOn ? 70 : 28,
      }));
  }, [activeBuckets.lights, activeBuckets.switches, haStates, isDemoSeedRoom, quickTiles]);
  const activeLightCount = React.useMemo(
    () =>
      activeBuckets.lights.length > 0
        ? activeBuckets.lights.reduce(
            (total, entityId) => total + (isEntityOn(entityId, haStates[entityId]) ? 1 : 0),
            0,
          )
        : quickTiles.filter((tile) => tile.domain === 'light' && tile.isOn).length,
    [activeBuckets.lights, haStates, quickTiles],
  );
  const primaryLightPct = React.useMemo(() => {
    const firstLight = lightRows[0];
    if (firstLight) {
      return firstLight.brightnessPct;
    }
    return 68;
  }, [lightRows]);
  const sceneEntityIds = React.useMemo(
    () => activeBuckets.others.filter((entityId) => entityId.startsWith('scene.')).slice(0, 4),
    [activeBuckets.others],
  );
  const sceneOptions = React.useMemo(() => {
    if (sceneEntityIds.length > 0) {
      return sceneEntityIds.map((entityId) => {
        const state = haStates[entityId];
        return {
          id: entityId,
          label: getEntityFriendlyName(entityId, state),
          entityId,
          isLive: true,
        };
      });
    }
    if (!isDemoSeedRoom) {
      return [];
    }
    return ['Relax', 'Film', 'Concentrazione', 'Fuori casa'].map((label) => ({
      id: `demo-scene-${label.toLowerCase()}`,
      label,
      entityId: undefined,
      isLive: false,
    }));
  }, [haStates, isDemoSeedRoom, sceneEntityIds]);
  const activeRoomKey = activeRoomTab?.id ?? 'default-room';
  const activeSceneName =
    sceneByRoomId[activeRoomKey] && sceneOptions.some((scene) => scene.label === sceneByRoomId[activeRoomKey])
      ? sceneByRoomId[activeRoomKey]
      : sceneOptions[0]?.label ?? '';
  const hasClimateCard = Boolean(climateEntityId) || isDemoSeedRoom;
  const hasLightsCard = lightRows.length > 0;
  const hasSecurityCard = doorTiles.length > 0;
  const hasMediaCard = Boolean(mediaEntityId) || isDemoSeedRoom;
  const hasScenesCard = sceneOptions.length > 0;
  const roomHasCards =
    hasClimateCard ||
    hasLightsCard ||
    hasSecurityCard ||
    hasMediaCard ||
    hasEnergyCard ||
    hasScenesCard;

  const accessoryCards = React.useMemo<RoomAccessoryCard[]>(() => {
    const entityIds = uniqueStrings([
      ...activeBuckets.covers,
      ...activeBuckets.weathers,
      ...activeBuckets.others.filter((entityId) => !entityId.startsWith('automation.') && !entityId.startsWith('script.')),
    ]);

    return entityIds.map((entityId) => {
      const domain = entityId.split('.')[0];
      const state = haStates[entityId];
      const isOn = isEntityOn(entityId, state);
      const status = state?.stateLabel ?? state?.secondary ?? state?.state ?? 'Pronto';
      const icon =
        domain === 'cover' ? (
          <ChevronRight size={18} />
        ) : domain === 'scene' ? (
          <Play size={18} />
        ) : domain === 'weather' ? (
          <Leaf size={18} />
        ) : domain === 'camera' ? (
          <Video size={18} />
        ) : (
          <Layers size={18} />
        );

      return {
        id: entityId,
        title: getEntityFriendlyName(entityId, state),
        status: toTitleCase(status),
        entityId,
        domain,
        icon,
        isOn,
      };
    });
  }, [activeBuckets.covers, activeBuckets.others, activeBuckets.weathers, haStates]);
  const ambientSummaryParts = React.useMemo(() => {
    const parts: string[] = [];
    if (hasLightsCard) {
      parts.push(`Luce ${primaryLightPct}%`);
    }
    if (hasClimateCard) {
      parts.push(`Clima ${Math.round(climateCurrentTemp)}\u00b0`);
    }
    if (activeSceneName) {
      parts.push(`Scena ${activeSceneName}`);
    }
    return parts;
  }, [activeSceneName, climateCurrentTemp, hasClimateCard, hasLightsCard, primaryLightPct]);
  const setRoomScene = async (sceneLabel: string, entityId?: string) => {
    if (entityId && onCallService) {
      await onCallService('scene', 'turn_on', { entity_id: entityId });
    }
    setSceneByRoomId((current) => ({ ...current, [activeRoomKey]: sceneLabel }));
  };
  const toggleRoomLight = async (light: RoomLightRow) => {
    if (light.isLive && light.entityId && onCallService) {
      const nextService = light.isOn ? 'turn_off' : 'turn_on';
      await onCallService(light.domain, nextService, { entity_id: light.entityId });
      return;
    }
    setDemoToggleById((current) => ({
      ...current,
      [light.id]: !light.isOn,
    }));
  };

  const callHaApiForDashboard = React.useCallback(
    async <TResponse = unknown,>(
      message: Record<string, unknown>,
      options?: { reportError?: boolean },
    ): Promise<TResponse | null> => {
      if (!onCallApi) {
        return null;
      }
      return (await onCallApi(message, options)) as TResponse | null;
    },
    [onCallApi],
  );

  const { state: roomDashboardState } = useDashboardState({
    haStates,
    haStatus: haConnected ? 'connected' : 'disconnected',
    weatherEntityId: weatherEntityId ?? undefined,
    weatherForecastType: 'hourly',
    haCallApi: callHaApiForDashboard,
  });
  const roomsGridBreakpoint = useGridEngineBreakpoint();
  const isSecurityAlert = React.useMemo(
    () =>
      doorTiles.some((tile) => !tile.isClosed) ||
      activeBuckets.covers.some((entityId) => isEntityOn(entityId, haStates[entityId])) ||
      activeBuckets.sensors.some((entityId) => isSecurityAlertEntity(entityId, haStates[entityId])),
    [activeBuckets.covers, activeBuckets.sensors, doorTiles, haStates],
  );
  const isMobileRoomsGrid =
    roomsGridBreakpoint === 'xs' || roomsGridBreakpoint === 'sm' || roomsGridBreakpoint === 'md';
  const useMediaBottomBar = roomsGridBreakpoint === 'xs' || roomsGridBreakpoint === 'sm';
  const showMediaBottomBar = useMediaBottomBar && mediaEntityIds.length > 0 && isAnyMediaActive;
  const isCompactClimateControls = roomsGridBreakpoint === 'xs' || roomsGridBreakpoint === 'sm';
  const roomsGridStyle = React.useMemo(
    () => getRoomsGridStructure(isMobileRoomsGrid, isAnyMediaActive, isSecurityAlert, showMediaBottomBar),
    [isAnyMediaActive, isMobileRoomsGrid, isSecurityAlert, showMediaBottomBar],
  );

  const buildClimateControlModel = React.useCallback((entityId: string | null) => {
    if (!entityId && !isDemoSeedRoom) {
      return null;
    }
    const resolvedEntityId = entityId ?? 'climate.air_conditioner';
    const entity = haStates[resolvedEntityId];
    const rawAttributes = entity?.rawAttributes ?? {};
    const currentTemp =
      toNumber(entity?.currentValue) ??
      toNumber(rawAttributes.current_temperature) ??
      24;
    const targetTemp =
      toNumber(entity?.targetValue) ??
      toNumber(rawAttributes.temperature) ??
      22;
    const mode = `${entity?.hvacMode ?? rawAttributes.hvac_mode ?? entity?.state ?? 'auto'}`
      .trim()
      .toLowerCase();
    const hvacModesFromEntity = toStringArray(entity?.hvacModes);
    const hvacModesFromAttributes = toStringArray(rawAttributes.hvac_modes);
    const fanModesFromEntity = toStringArray(entity?.fanModes);
    const fanModesFromAttributes = toStringArray(rawAttributes.fan_modes);
    const presetModeFromEntity =
      typeof (entity as { presetMode?: unknown } | undefined)?.presetMode === 'string'
        ? (entity as { presetMode?: string }).presetMode
        : undefined;
    const presetModesFromEntity = toStringArray((entity as { presetModes?: unknown } | undefined)?.presetModes);
    const presetModesFromAttributes = toStringArray(rawAttributes.preset_modes);
    const temperatureUnit =
      typeof rawAttributes.temperature_unit === 'string'
        ? rawAttributes.temperature_unit
        : entity?.unit;

    return {
      name: resolvedEntityId ? getEntityFriendlyName(resolvedEntityId, entity) : 'Clima stanza',
      mode,
      isOn: !['off', 'unavailable', 'unknown'].includes(mode),
      status:
        typeof entity?.stateLabel === 'string'
          ? entity.stateLabel
          : mode === 'off'
            ? 'Spento'
            : 'Clima attivo',
      currentTemp,
      targetTemp,
      minTemp: toNumber(entity?.minTemp) ?? toNumber(rawAttributes.min_temp) ?? 16,
      maxTemp: toNumber(entity?.maxTemp) ?? toNumber(rawAttributes.max_temp) ?? 30,
      targetTempLow: toNumber(entity?.targetTempLow) ?? toNumber(rawAttributes.target_temp_low),
      targetTempHigh: toNumber(entity?.targetTempHigh) ?? toNumber(rawAttributes.target_temp_high),
      targetTempStep: toNumber(entity?.targetTempStep) ?? toNumber(rawAttributes.target_temp_step) ?? 0.5,
      hvacModes:
        hvacModesFromEntity.length > 0
          ? hvacModesFromEntity
          : hvacModesFromAttributes.length > 0
            ? hvacModesFromAttributes
            : isDemoSeedRoom
              ? ['heat', 'cool', 'auto', 'off']
              : undefined,
      hvacAction:
        typeof entity?.hvacAction === 'string'
          ? entity.hvacAction
          : typeof rawAttributes.hvac_action === 'string'
            ? rawAttributes.hvac_action
            : undefined,
      fanMode:
        typeof entity?.fanMode === 'string'
          ? entity.fanMode
          : typeof rawAttributes.fan_mode === 'string'
            ? rawAttributes.fan_mode
            : undefined,
      fanModes:
        fanModesFromEntity.length > 0
          ? fanModesFromEntity
          : fanModesFromAttributes.length > 0
            ? fanModesFromAttributes
            : undefined,
      presetMode:
        presetModeFromEntity ?? (typeof rawAttributes.preset_mode === 'string' ? rawAttributes.preset_mode : undefined),
      presetModes:
        presetModesFromEntity.length > 0
          ? presetModesFromEntity
          : presetModesFromAttributes.length > 0
            ? presetModesFromAttributes
            : undefined,
      temperatureUnit,
      rawAttributes,
    };
  }, [haStates, isDemoSeedRoom]);
  const climateControlModel = React.useMemo(
    () => buildClimateControlModel(climateEntityId),
    [buildClimateControlModel, climateEntityId],
  );
  const climatePanelModels = React.useMemo(
    () =>
      (climateEntityIds.length > 0 ? climateEntityIds : isDemoSeedRoom ? ['climate.air_conditioner'] : [])
        .map((entityId) => {
          const model = buildClimateControlModel(entityId);
          return model ? { entityId, model } : null;
        })
        .filter((entry): entry is { entityId: string; model: NonNullable<ReturnType<typeof buildClimateControlModel>> } => Boolean(entry)),
    [buildClimateControlModel, climateEntityIds, isDemoSeedRoom],
  );
  const mobileClimateWidgets = React.useMemo<Widget[]>(() => {
    if (!climateControlModel) {
      return [];
    }
    const entityIds = climateEntityIds.length > 0 ? climateEntityIds : [climateEntityId ?? 'climate.air_conditioner'];
    return entityIds.map((entityId) => {
      const entity = haStates[entityId];
      const widget = buildRoomWidget(entityId, 'climate', entity, {
        i: `rooms-mobile-climate-${entityId}`,
        x: 0,
        y: 0,
        w: 2,
        h: 3,
      });
      const isSelectedClimate = entityId === climateEntityId;
      return {
        ...widget,
        title: isSelectedClimate ? climateControlModel.name : getEntityFriendlyName(entityId, entity),
        status: isSelectedClimate ? (climateControlModel.status ?? widget.status) : widget.status,
        isOn: isSelectedClimate ? climateControlModel.isOn : widget.isOn,
        value: isSelectedClimate ? climateControlModel.targetTemp : widget.value,
        unit: isSelectedClimate ? (climateControlModel.temperatureUnit ?? widget.unit) : widget.unit,
      };
    });
  }, [climateControlModel, climateEntityId, climateEntityIds, haStates]);
  const climateSwiperEntityIds = React.useMemo(
    () =>
      isCompactClimateControls
        ? mobileClimateWidgets.map((widget) => widget.entityId)
        : climatePanelModels.map((entry) => entry.entityId),
    [climatePanelModels, isCompactClimateControls, mobileClimateWidgets],
  );
  const selectedMobileClimateIndex = Math.max(
    0,
    climateSwiperEntityIds.findIndex((entityId) => entityId === climateEntityId),
  );
  const scrollToMobileClimateSlide = React.useCallback(
    (index: number) => {
      const scroller = mobileClimateSwiperRef.current;
      if (!scroller) {
        return;
      }
      scroller.scrollTo({
        left: index * scroller.clientWidth,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    },
    [prefersReducedMotion],
  );
  const handleMobileClimateScroll = React.useCallback(() => {
    const scroller = mobileClimateSwiperRef.current;
    if (!scroller || scroller.clientWidth <= 0 || climateSwiperEntityIds.length <= 1) {
      return;
    }
    const index = Math.max(
      0,
      Math.min(climateSwiperEntityIds.length - 1, Math.round(scroller.scrollLeft / scroller.clientWidth)),
    );
    const nextEntityId = climateSwiperEntityIds[index];
    if (nextEntityId && nextEntityId !== climateEntityId) {
      setSelectedClimateEntityId(nextEntityId);
    }
  }, [climateEntityId, climateSwiperEntityIds]);

  React.useEffect(() => {
    if (climateSwiperEntityIds.length <= 1) {
      return;
    }
    scrollToMobileClimateSlide(selectedMobileClimateIndex);
  }, [climateSwiperEntityIds.length, scrollToMobileClimateSlide, selectedMobileClimateIndex]);
  const roomStatusChips = React.useMemo<RoomStatusChip[]>(() => {
    const chips: RoomStatusChip[] = [];

    if (climateControlModel?.isOn) {
      chips.push({
        id: 'climate',
        label: 'Clima',
        status: formatAmbientTemperature(climateControlModel.currentTemp),
        icon: <Thermometer size={14} className="text-[#FF9F0A]" />,
        className: '',
      });
    }

    if (isAnyMediaActive) {
      chips.push({
        id: 'media',
        label: 'Media',
        status: 'In riproduzione',
        icon: <Music2 size={14} className="text-[#0A84FF]" />,
        className: '',
      });
    }

    if (activeLightCount > 0) {
      chips.push({
        id: 'lights',
        label: 'Luci',
        status: activeLightCount === 1 ? '1 accesa' : `${activeLightCount} accese`,
        icon: <Lightbulb size={14} className="text-[#FFD60A]" />,
        className: '',
      });
    }

    return chips;
  }, [activeLightCount, climateControlModel?.currentTemp, climateControlModel?.isOn, isAnyMediaActive]);

  const buildWidgetsForEntities = React.useCallback(
    (entityIds: string[], layout: Widget['layout']): Widget[] =>
      entityIds.flatMap((entityId) => {
        const kind = resolveWidgetKindFromEntityId(entityId);
        if (!kind) {
          return [];
        }
        return [buildRoomWidget(entityId, kind, haStates[entityId], { ...layout, i: entityId })];
      }),
    [haStates],
  );

  const demoWidgets = React.useMemo(() => {
    if (!isDemoSeedRoom) {
      return {
        climate: [],
        lights: [],
        switches: [],
        sensors: [],
        security: [],
        media: [],
        covers: [],
      };
    }
    return {
      climate: [
        buildRoomWidget('climate.air_conditioner', 'climate', haStates['climate.air_conditioner'], {
          i: 'climate.air_conditioner',
          x: 0,
          y: 0,
          w: 4,
          h: 3,
        }),
      ],
      lights: [
        buildRoomWidget('light.living_room_lamp', 'light', haStates['light.living_room_lamp'], {
          i: 'light.living_room_lamp',
          x: 0,
          y: 0,
          w: 2,
          h: 2,
        }),
      ],
      switches: [
        buildRoomWidget('switch.smart_plug', 'light', haStates['switch.smart_plug'], {
          i: 'switch.smart_plug',
          x: 0,
          y: 0,
          w: 2,
          h: 1,
        }),
      ],
      sensors: [
        buildRoomWidget('sensor.living_room_humidity', 'sensor', haStates['sensor.living_room_humidity'], {
          i: 'sensor.living_room_humidity',
          x: 0,
          y: 0,
          w: 2,
          h: 2,
        }),
      ],
      security: [
        buildRoomWidget('lock.front_door', 'lock', haStates['lock.front_door'], {
          i: 'lock.front_door',
          x: 0,
          y: 0,
          w: 2,
          h: 2,
        }),
      ],
      media: [
        buildRoomWidget('media_player.living_room_tv', 'media', haStates['media_player.living_room_tv'], {
          i: 'media_player.living_room_tv',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
        }),
      ],
      covers: [],
    };
  }, [haStates, isDemoSeedRoom]);

  const roomWidgetClusters = React.useMemo<RoomWidgetCluster[]>(() => {
    const clusters: RoomWidgetCluster[] = [];
    const lightWidgets =
      activeBuckets.lights.length > 0
        ? buildWidgetsForEntities(activeBuckets.lights, { i: 'lights', x: 0, y: 0, w: 2, h: 2 })
        : demoWidgets.lights;
    const switchWidgets =
      activeBuckets.switches.length > 0
        ? activeBuckets.switches.map((entityId) =>
            buildRoomWidget(entityId, 'light', haStates[entityId], {
              i: entityId,
              x: 0,
              y: 0,
              w: 2,
              h: 1,
            }),
          )
        : demoWidgets.switches;
    const sensorWidgets =
      activeBuckets.sensors.length > 0
        ? buildWidgetsForEntities(activeBuckets.sensors, { i: 'sensors', x: 0, y: 0, w: 2, h: 2 })
        : demoWidgets.sensors;
    const securityWidgets =
      activeBuckets.locks.length > 0 || activeBuckets.cameras.length > 0
        ? buildWidgetsForEntities([...activeBuckets.locks, ...activeBuckets.cameras], {
            i: 'security',
            x: 0,
            y: 0,
            w: 2,
            h: 2,
          })
        : demoWidgets.security;
    if (lightWidgets.length > 0) clusters.push({ id: 'lights', label: 'Luci', widgets: lightWidgets });
    if (switchWidgets.length > 0) clusters.push({ id: 'switches', label: 'Switches', widgets: switchWidgets });
    if (sensorWidgets.length > 0) clusters.push({ id: 'sensors', label: 'Sensors', widgets: sensorWidgets });
    if (securityWidgets.length > 0) clusters.push({ id: 'security', label: 'Security', widgets: securityWidgets });
    return clusters;
  }, [
    activeBuckets.cameras,
    activeBuckets.lights,
    activeBuckets.locks,
    activeBuckets.sensors,
    activeBuckets.switches,
    buildWidgetsForEntities,
    demoWidgets,
    haStates,
  ]);

  const mediaRoomWidget = React.useMemo<Widget | null>(() => {
    const widgets = mediaEntityId
      ? buildWidgetsForEntities([mediaEntityId], { i: 'media', x: 0, y: 0, w: 4, h: 3 })
      : demoWidgets.media;
    return widgets[0] ?? null;
  }, [buildWidgetsForEntities, demoWidgets.media, mediaEntityId]);
  const mediaRoomWidgets = React.useMemo<Widget[]>(() => {
    const entityIds = mediaEntityIds.length > 0 ? mediaEntityIds : mediaEntityId ? [mediaEntityId] : [];
    const widgets = entityIds.length > 0
      ? buildWidgetsForEntities(entityIds, { i: 'media', x: 0, y: 0, w: 4, h: 3 })
      : demoWidgets.media;
    return widgets.map((widget) => ({
      ...widget,
      layout: {
        ...widget.layout,
        w: 4,
        h: 3,
      },
    }));
  }, [buildWidgetsForEntities, demoWidgets.media, mediaEntityId, mediaEntityIds]);
  const selectedMediaSlideIndex = Math.max(
    0,
    mediaRoomWidgets.findIndex((widget) => widget.entityId === mediaEntityId),
  );
  const scrollToMediaSlide = React.useCallback(
    (index: number) => {
      const scroller = mediaSwiperRef.current;
      if (!scroller) {
        return;
      }
      scroller.scrollTo({
        left: index * scroller.clientWidth,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    },
    [prefersReducedMotion],
  );
  const handleMediaSwiperScroll = React.useCallback(() => {
    const scroller = mediaSwiperRef.current;
    if (!scroller || scroller.clientWidth <= 0 || mediaRoomWidgets.length <= 1) {
      return;
    }
    const index = Math.max(
      0,
      Math.min(mediaRoomWidgets.length - 1, Math.round(scroller.scrollLeft / scroller.clientWidth)),
    );
    const nextEntityId = mediaRoomWidgets[index]?.entityId;
    if (nextEntityId && nextEntityId !== mediaEntityId) {
      setSelectedMediaEntityId(nextEntityId);
    }
  }, [mediaEntityId, mediaRoomWidgets]);

  React.useEffect(() => {
    if (mediaRoomWidgets.length <= 1 || showMediaBottomBar) {
      return;
    }
    scrollToMediaSlide(selectedMediaSlideIndex);
  }, [mediaRoomWidgets.length, scrollToMediaSlide, selectedMediaSlideIndex, showMediaBottomBar]);

  const sceneKeys = React.useMemo<SceneKey[]>(() => ['music', 'movie', 'night', 'morning'], []);
  const roomSceneEntityByKey = React.useMemo(() => {
    const result: Partial<Record<SceneKey, string>> = {};
    sceneEntityIds.slice(0, sceneKeys.length).forEach((entityId, index) => {
      result[sceneKeys[index]] = entityId;
    });
    return result;
  }, [sceneEntityIds, sceneKeys]);
  const roomSceneSection = React.useMemo<DashboardSection | null>(() => {
    if (sceneEntityIds.length === 0 && !isDemoSeedRoom) {
      return null;
    }
    const scenes = sceneEntityIds.length > 0 ? sceneKeys.slice(0, sceneEntityIds.length) : sceneKeys.slice(0, 4);
    const sceneLabels = scenes.reduce<NonNullable<DashboardSection['sceneLabels']>>((acc, sceneKey) => {
      const entityId = roomSceneEntityByKey[sceneKey];
      if (entityId) {
        acc[sceneKey] = getEntityFriendlyName(entityId, haStates[entityId]);
      }
      return acc;
    }, {});
    return {
      id: 'rooms-scenes',
      kind: 'scenes',
      title: 'Scene',
      scenes,
      sceneLabels,
      layout: { i: 'rooms-scenes', x: 0, y: 0, w: 4, h: 2 },
    };
  }, [haStates, isDemoSeedRoom, roomSceneEntityByKey, sceneEntityIds.length, sceneKeys]);
  const weatherSection = React.useMemo<DashboardSection>(
    () => ({
      id: 'rooms-weather',
      kind: 'weather',
      layout: { i: 'rooms-weather', x: 0, y: 0, w: 4, h: 2 },
      weatherLayout: 'card',
      weatherForecastType: 'hourly',
      weatherForecastDays: 5,
      weatherForecastDensity: 'compact',
      weatherSecondaryInfo: 'wind',
    }),
    [],
  );
  const hasWeatherCard = Boolean(weatherEntityId) || isDemoSeedRoom;
  const roomHasRenderedCards =
    Boolean(climateControlModel) || roomWidgetClusters.length > 0 || Boolean(mediaRoomWidget);

  const renderRoomWidget = (widget: Widget) => (
    <WidgetCardRenderer
      key={widget.id}
      widget={widget}
      dashboardState={roomDashboardState}
      isEditMode={false}
      isSelected={false}
      gridBreakpoint={roomsGridBreakpoint}
      value={widget.value ?? 0}
      onClick={() => {
        const domain = widget.entityId.split('.')[0];
        if (!onCallService) {
          return;
        }
        if (domain === 'media_player') {
          void onCallService('media_player', 'media_play_pause', { entity_id: widget.entityId });
          return;
        }
        if (['light', 'switch', 'input_boolean', 'fan'].includes(domain)) {
          void onCallService(domain, widget.isOn ? 'turn_off' : 'turn_on', { entity_id: widget.entityId });
        }
      }}
      liveEntity={haStates[widget.entityId]}
      onLightBrightnessChange={(nextWidget, value) => {
        void onCallService?.('light', 'turn_on', {
          entity_id: nextWidget.entityId,
          brightness_pct: Math.max(1, Math.min(100, Math.round(value))),
        });
      }}
      onClimateTargetTempChange={(nextWidget, value) => {
        void onCallService?.('climate', 'set_temperature', {
          entity_id: nextWidget.entityId,
          temperature: Math.round(value),
        });
      }}
      onClimateModeChange={(nextWidget, mode) => {
        void onCallService?.('climate', 'set_hvac_mode', {
          entity_id: nextWidget.entityId,
          hvac_mode: mode,
        });
      }}
      onClimateFanModeChange={(nextWidget, mode) => {
        void onCallService?.('climate', 'set_fan_mode', {
          entity_id: nextWidget.entityId,
          fan_mode: mode,
        });
      }}
      onMediaToggle={(nextWidget) => {
        void onCallService?.('media_player', 'media_play_pause', { entity_id: nextWidget.entityId });
      }}
      onMediaPrevious={(nextWidget) => {
        void onCallService?.('media_player', 'media_previous_track', { entity_id: nextWidget.entityId });
      }}
      onMediaNext={(nextWidget) => {
        void onCallService?.('media_player', 'media_next_track', { entity_id: nextWidget.entityId });
      }}
      onMediaSeek={(nextWidget, position) => {
        void onCallService?.('media_player', 'media_seek', {
          entity_id: nextWidget.entityId,
          seek_position: position,
        });
      }}
      onMediaShuffle={(nextWidget) => {
        const currentEntity = haStates[nextWidget.entityId];
        const currentShuffle =
          currentEntity?.shuffleEnabled ??
          (typeof currentEntity?.rawAttributes?.shuffle === 'boolean'
            ? currentEntity.rawAttributes.shuffle
            : typeof currentEntity?.rawAttributes?.shuffle_enabled === 'boolean'
              ? currentEntity.rawAttributes.shuffle_enabled
              : false);
        void onCallService?.('media_player', 'shuffle_set', {
          entity_id: nextWidget.entityId,
          shuffle: !currentShuffle,
        });
      }}
      onMediaRepeat={(nextWidget) => {
        const currentEntity = haStates[nextWidget.entityId];
        const currentRepeat = `${
          currentEntity?.repeatMode ??
          currentEntity?.rawAttributes?.repeat ??
          currentEntity?.rawAttributes?.repeat_mode ??
          'off'
        }`.trim().toLowerCase();
        const nextRepeat = currentRepeat === 'off' || currentRepeat === 'none' || currentRepeat === ''
          ? 'all'
          : currentRepeat === 'all'
            ? 'one'
            : 'off';
        void onCallService?.('media_player', 'repeat_set', {
          entity_id: nextWidget.entityId,
          repeat: nextRepeat,
        });
      }}
      mediaHideHeader={widget.kind === 'media'}
      onLockToggle={(nextWidget) => {
        void onCallService?.('lock', nextWidget.isOn ? 'lock' : 'unlock', { entity_id: nextWidget.entityId });
      }}
      onLockOpen={(nextWidget) => {
        void onCallService?.('lock', 'open', { entity_id: nextWidget.entityId });
      }}
    />
  );

  const renderWidgetGrid = (widgets: Widget[], gridCols = Math.max(1, Math.round(STACK_GRID_COLS_BY_BREAKPOINT[roomsGridBreakpoint] ?? 1))) => (
    <div
      className="grid min-h-0 min-w-0"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        gridAutoRows: `${GRID_ENGINE_ROW_UNIT_PX}px`,
        columnGap: `${GRID_ENGINE_GAP_PX}px`,
        rowGap: `${GRID_ENGINE_GAP_PX}px`,
        gridAutoFlow: 'row dense',
      }}
    >
      {widgets.map((widget) => {
        const span = resolveRoomWidgetSpan(widget, roomsGridBreakpoint);
        const safeW = Math.min(gridCols, Math.max(1, Math.round(span.w)));
        const safeH = Math.max(1, Math.round(span.h));
        const sizedWidget: Widget = {
          ...widget,
          layout: {
            ...widget.layout,
            w: safeW,
            h: safeH,
          },
        };
        return (
          <div
            key={widget.id}
            className="relative h-full w-full min-h-0 min-w-0 overflow-hidden"
            style={{
              gridColumn: `span ${safeW}`,
              gridRow: `span ${safeH}`,
            }}
          >
            {renderRoomWidget(sizedWidget)}
          </div>
        );
      })}
    </div>
  );

  const renderEntitySegmentControl = (
    entityIds: string[],
    selectedEntityId: string | null,
    onSelect: (entityId: string) => void,
    options?: { fillOnDesktop?: boolean },
  ) => {
    if (entityIds.length <= 1) {
      return null;
    }
    return (
      <div
        className={cn(
          'scrollbar-none flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/[0.06] bg-white/[0.02] p-0.5',
          options?.fillOnDesktop && 'lg:w-full lg:overflow-visible lg:p-1',
        )}
      >
        {entityIds.map((entityId, index) => {
          const state = haStates[entityId];
          const label = getEntityFriendlyName(entityId, state) || `Entita ${index + 1}`;
          const isSelected = selectedEntityId === entityId;
          return (
            <button
              key={entityId}
              type="button"
              onClick={() => onSelect(entityId)}
              className={cn(
                'max-w-[10rem] shrink-0 truncate rounded-full px-3 py-1.5 text-center text-[11px] font-semibold transition-all active:scale-95',
                options?.fillOnDesktop && 'lg:min-w-0 lg:flex-1 lg:basis-0 lg:px-4 lg:py-2 lg:max-w-none',
                isSelected
                  ? 'bg-white/[0.12] text-white shadow-sm'
                  : 'text-white/48 hover:bg-white/[0.06] hover:text-white/78',
              )}
              title={label}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderEmptyRoomArea = (
    gridArea: string,
    title: string,
    description = 'Aggiungi entita a questa stanza da Home Assistant per popolare automaticamente il riquadro.',
    className?: string,
  ) => {
    if (isMobileRoomsGrid) {
      return null;
    }
    return (
      <section
        className={cn('rooms-surface flex min-h-[10rem] min-w-0 flex-col justify-between p-4', className)}
        style={{ gridArea }}
      >
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/38">Non configurato</p>
          <h2 className="mt-2 text-sm font-semibold leading-snug text-white/82">{title}</h2>
          <p className="mt-2 text-xs leading-relaxed text-white/42">{description}</p>
        </div>
        <div className="mt-6 h-1.5 w-14 rounded-full bg-white/[0.06]" />
      </section>
    );
  };

  const renderRoomSectionHeader = (
    label: string,
    count: number,
    onOpen?: () => void,
  ) => (
    <div className="flex items-center justify-between gap-3">
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className="group inline-flex min-w-0 items-center gap-1.5 rounded-full text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/58 transition-all hover:text-white active:scale-95"
          aria-label={`Mostra tutti i dispositivi in ${label}`}
        >
          <span className="truncate">{label}</span>
          <ChevronRight size={13} className="text-white/32 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70" />
        </button>
      ) : (
        <h2 className="truncate text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/52">{label}</h2>
      )}
      <span className="text-[0.7rem] font-medium text-white/34">{count}</span>
    </div>
  );

  const callAccessoryAction = (accessory: RoomAccessoryCard) => {
    if (!onCallService) {
      return;
    }
    if (accessory.domain === 'scene') {
      void onCallService('scene', 'turn_on', { entity_id: accessory.entityId });
      return;
    }
    if (accessory.domain === 'cover') {
      void onCallService('cover', accessory.isOn ? 'close_cover' : 'open_cover', { entity_id: accessory.entityId });
    }
  };

  const renderAccessoryCards = (accessories: RoomAccessoryCard[], variant: 'preview' | 'expanded' = 'preview') => (
    <div className={cn(variant === 'expanded' ? 'grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-3' : 'flex flex-wrap gap-2')}>
      {accessories.map((accessory) => (
        <button
          key={accessory.id}
          type="button"
          onClick={() => callAccessoryAction(accessory)}
          className={cn(
            'flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.04] text-[10px] text-white/50 backdrop-blur-md transition-all hover:bg-white/[0.08] hover:text-white/75 active:scale-95',
            variant === 'expanded' ? 'aspect-square min-h-24 w-full' : 'h-20 w-20',
          )}
          title={`${accessory.title}: ${accessory.status}`}
        >
          <span className={cn('text-white/42', accessory.isOn && 'text-white/80')}>{accessory.icon}</span>
          <span className="max-w-[4.25rem] truncate font-semibold">{accessory.title}</span>
          <span className="max-w-[4.25rem] truncate text-white/34">{accessory.status}</span>
        </button>
      ))}
    </div>
  );

  const renderAccessoriesArea = () => {
    if (accessoryCards.length === 0) {
      return renderEmptyRoomArea(
        'accessories',
        'Nessun accessorio configurato per questa stanza',
        'Qui compariranno cover, scene, meteo e accessori secondari non inclusi nelle sezioni principali.',
      );
    }
    const visibleAccessories = accessoryCards.slice(0, ROOM_ACCESSORY_PREVIEW_LIMIT);
    const hasHiddenAccessories = accessoryCards.length > visibleAccessories.length;
    return (
      <section
        className="rooms-surface min-w-0 p-3 sm:p-4"
        style={{ gridArea: 'accessories' }}
      >
        <div className="mb-3">
          {renderRoomSectionHeader(
            'Accessori',
            accessoryCards.length,
            hasHiddenAccessories
              ? () => setExpandedRoomSection({ kind: 'accessories', id: 'accessories', label: 'Accessori' })
              : undefined,
          )}
        </div>
        {renderAccessoryCards(visibleAccessories)}
      </section>
    );
  };

  const lightsCluster = roomWidgetClusters.find((cluster) => cluster.id === 'lights');
  const switchesCluster = roomWidgetClusters.find((cluster) => cluster.id === 'switches');
  const sensorsCluster = roomWidgetClusters.find((cluster) => cluster.id === 'sensors');
  const securityCluster = roomWidgetClusters.find((cluster) => cluster.id === 'security');
  const renderWidgetCluster = (
    cluster: RoomWidgetCluster | undefined,
    options?: {
      gridArea?: string;
      controls?: React.ReactNode;
      count?: number;
      className?: string;
      emptyTitle?: string;
      emptyDescription?: string;
      emptyClassName?: string;
      previewLimit?: number;
    },
  ) => {
    if (!cluster) {
      if (options?.gridArea && options.emptyTitle) {
        return renderEmptyRoomArea(options.gridArea, options.emptyTitle, options.emptyDescription, options.emptyClassName);
      }
      return null;
    }
    const previewLimit = options?.previewLimit ?? ROOM_SECTION_PREVIEW_LIMIT;
    const visibleWidgets = cluster.widgets.slice(0, previewLimit);
    const hasHiddenWidgets = cluster.widgets.length > visibleWidgets.length;
    return (
      <section
        className={cn('rooms-surface min-w-0 space-y-3 p-3 sm:p-4', options?.className)}
        style={options?.gridArea ? { gridArea: options.gridArea } : undefined}
      >
        {renderRoomSectionHeader(
          cluster.label,
          options?.count ?? cluster.widgets.length,
          hasHiddenWidgets
            ? () => setExpandedRoomSection({ kind: 'widgets', id: cluster.id, label: cluster.label })
            : undefined,
        )}
        {options?.controls ? <div>{options.controls}</div> : null}
        {renderWidgetGrid(visibleWidgets)}
      </section>
    );
  };

  const mediaShuffleEnabled =
    mediaEntity?.shuffleEnabled ??
    (typeof mediaEntity?.rawAttributes?.shuffle === 'boolean'
      ? mediaEntity.rawAttributes.shuffle
      : typeof mediaEntity?.rawAttributes?.shuffle_enabled === 'boolean'
        ? mediaEntity.rawAttributes.shuffle_enabled
        : false);
  const mediaRepeatMode = `${
    mediaEntity?.repeatMode ??
    mediaEntity?.rawAttributes?.repeat ??
    mediaEntity?.rawAttributes?.repeat_mode ??
    'off'
  }`.trim().toLowerCase();
  const mediaRepeatActive = mediaRepeatMode !== '' && mediaRepeatMode !== 'off' && mediaRepeatMode !== 'none';
  const mediaCoverUrl = mediaEntity?.imageUrl;
  const toggleSelectedMediaPlayback = () => {
    if (!mediaEntityId) return;
    void onCallService?.('media_player', 'media_play_pause', { entity_id: mediaEntityId });
  };
  const skipSelectedMediaPrevious = () => {
    if (!mediaEntityId) return;
    void onCallService?.('media_player', 'media_previous_track', { entity_id: mediaEntityId });
  };
  const skipSelectedMediaNext = () => {
    if (!mediaEntityId) return;
    void onCallService?.('media_player', 'media_next_track', { entity_id: mediaEntityId });
  };
  const toggleSelectedMediaShuffle = () => {
    if (!mediaEntityId) return;
    void onCallService?.('media_player', 'shuffle_set', {
      entity_id: mediaEntityId,
      shuffle: !mediaShuffleEnabled,
    });
  };
  const toggleSelectedMediaRepeat = () => {
    if (!mediaEntityId) return;
    const nextRepeat = mediaRepeatMode === 'off' || mediaRepeatMode === 'none' || mediaRepeatMode === ''
      ? 'all'
      : mediaRepeatMode === 'all'
        ? 'one'
        : 'off';
    void onCallService?.('media_player', 'repeat_set', {
      entity_id: mediaEntityId,
      repeat: nextRepeat,
    });
  };

  const renderMediaPlayerArea = () => {
    if (showMediaBottomBar) {
      return null;
    }
    if (!mediaRoomWidget || mediaRoomWidgets.length === 0) {
      return renderEmptyRoomArea(
        'media',
        'Nessun media configurato per questa stanza',
        'TV, speaker e player multimediali associati alla stanza verranno mostrati qui.',
      );
    }
    if (useMediaBottomBar) {
      return (
        <section
          className="flex min-w-0 flex-col gap-3 overflow-visible p-0"
          style={{ gridArea: 'media' }}
        >
          <div className="-mx-1.5">
            <div
              ref={mediaSwiperRef}
              className="flex cursor-grab snap-x snap-mandatory select-none overflow-x-auto [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
              onScroll={handleMediaSwiperScroll}
              {...mediaSwiperPointerHandlers}
            >
              {mediaRoomWidgets.map((widget) => {
                const entity = haStates[widget.entityId];
                const coverUrl = entity?.imageUrl;
                const playerLabel = getEntityFriendlyName(widget.entityId, entity);
                return (
                  <div key={widget.id} className="min-w-0 basis-full snap-center shrink-0 px-1.5">
                    <div className="flex min-w-0 items-center gap-3 rounded-[1.25rem] border border-white/[0.08] bg-white/[0.045] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10">
                        {coverUrl ? (
                          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white/70">
                            <Music2 size={19} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold leading-tight text-white">{playerLabel}</p>
                        <p className="mt-0.5 truncate text-[11px] font-medium leading-tight text-white/52">
                          Nessuna riproduzione
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMediaEntityId(widget.entityId);
                          void onCallService?.('media_player', 'media_play_pause', { entity_id: widget.entityId });
                        }}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-zinc-950 shadow-[0_8px_20px_rgba(255,255,255,0.18)] transition-transform active:scale-95"
                        aria-label={`Avvia ${playerLabel}`}
                      >
                        <Play size={17} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {mediaRoomWidgets.length > 1 ? (
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {mediaRoomWidgets.map((widget, index) => {
                  const active = widget.entityId === mediaEntityId;
                  return (
                    <button
                      key={widget.entityId}
                      type="button"
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-200 active:scale-95',
                        active ? 'w-5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.28)]' : 'w-1.5 bg-white/28 hover:bg-white/48',
                      )}
                      onClick={() => {
                        setSelectedMediaEntityId(widget.entityId);
                        scrollToMediaSlide(index);
                      }}
                      aria-label={`Mostra ${widget.title}`}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        </section>
      );
    }
    return (
      <section
        className="flex min-h-[16rem] min-w-0 flex-col overflow-visible p-0"
        style={{ gridArea: 'media' }}
      >
        <div className="min-h-0 flex-1">
          <div className="-mx-1.5 h-full min-h-[16rem]">
            <div
              ref={mediaSwiperRef}
              className="flex h-full cursor-grab snap-x snap-mandatory select-none overflow-x-auto [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
              onScroll={handleMediaSwiperScroll}
              {...mediaSwiperPointerHandlers}
            >
              {mediaRoomWidgets.map((widget) => (
                <div key={widget.id} className="min-w-0 basis-full snap-center shrink-0 px-1.5">
                  <div className="h-full min-h-[16rem] min-w-0 overflow-hidden">
                    {renderRoomWidget(widget)}
                  </div>
                </div>
              ))}
            </div>
            {mediaRoomWidgets.length > 1 ? (
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {mediaRoomWidgets.map((widget, index) => {
                  const active = widget.entityId === mediaEntityId;
                  return (
                    <button
                      key={widget.entityId}
                      type="button"
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-200 active:scale-95',
                        active ? 'w-5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.28)]' : 'w-1.5 bg-white/28 hover:bg-white/48',
                      )}
                      onClick={() => {
                        setSelectedMediaEntityId(widget.entityId);
                        scrollToMediaSlide(index);
                      }}
                      aria-label={`Mostra ${widget.title}`}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  };

  const renderMediaBottomBar = () => {
    if (!showMediaBottomBar || !mediaRoomWidget || !mediaEntityId) {
      return null;
    }
    return (
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.9rem)] z-[160] px-2 md:hidden">
        <div className="relative mx-auto max-w-xl overflow-hidden rounded-[1.35rem] border border-white/12 bg-[#16171d]/88 shadow-[0_18px_48px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
          {mediaCoverUrl ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 scale-110 bg-cover bg-center opacity-70 blur-2xl"
              style={{ backgroundImage: `url("${mediaCoverUrl}")` }}
            />
          ) : null}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,8,12,0.82),rgba(6,8,12,0.68)_46%,rgba(6,8,12,0.78)),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_40%,rgba(0,0,0,0.18))]"
          />
          <div
            className="relative h-0.5 bg-white/22"
            aria-hidden="true"
          >
            <div className="h-full bg-white" style={{ width: `${Math.round(mediaProgress * 100)}%` }} />
          </div>
          <div className="relative flex min-w-0 items-center gap-2.5 px-2.5 py-2.5">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white/10">
              {mediaCoverUrl ? (
                <img src={mediaCoverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/70">
                  <Music2 size={18} />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={toggleSelectedMediaPlayback}
              className="min-w-0 flex-1 text-left"
              aria-label="Riproduci o metti in pausa"
            >
              <p className="truncate text-sm font-semibold leading-tight text-white">{mediaTitle}</p>
              <p className="mt-0.5 truncate text-[11px] font-medium leading-tight text-white/58">{mediaArtist}</p>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={toggleSelectedMediaShuffle}
                className={cn('inline-flex h-8 w-8 items-center justify-center rounded-full text-white/72 transition-colors active:scale-95', mediaShuffleEnabled && 'bg-white text-zinc-950')}
                aria-label="Shuffle"
                aria-pressed={mediaShuffleEnabled}
              >
                <Shuffle size={15} />
              </button>
              <button
                type="button"
                onClick={skipSelectedMediaPrevious}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/72 transition-colors active:scale-95"
                aria-label="Brano precedente"
              >
                <SkipBack size={15} />
              </button>
              <button
                type="button"
                onClick={toggleSelectedMediaPlayback}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-950 shadow-[0_8px_20px_rgba(255,255,255,0.18)] transition-transform active:scale-95"
                aria-label={mediaIsPlaying ? 'Pausa' : 'Riproduci'}
              >
                {mediaIsPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                type="button"
                onClick={skipSelectedMediaNext}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/72 transition-colors active:scale-95"
                aria-label="Brano successivo"
              >
                <SkipForward size={15} />
              </button>
              <button
                type="button"
                onClick={toggleSelectedMediaRepeat}
                className={cn('inline-flex h-8 w-8 items-center justify-center rounded-full text-white/72 transition-colors active:scale-95', mediaRepeatActive && 'bg-white text-zinc-950')}
                aria-label="Repeat"
                aria-pressed={mediaRepeatActive}
              >
                <Repeat2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderExpandedRoomSection = () => {
    if (!expandedRoomSection) {
      return null;
    }
    const expandedCluster =
      expandedRoomSection.kind === 'widgets'
        ? roomWidgetClusters.find((cluster) => cluster.id === expandedRoomSection.id)
        : null;
    const isAccessories = expandedRoomSection.kind === 'accessories';
    const title = isAccessories ? 'Accessori' : expandedCluster?.label ?? expandedRoomSection.label;
    const itemCount = isAccessories ? accessoryCards.length : expandedCluster?.widgets.length ?? 0;
    const expandedGridCols = Math.max(
      isMobileRoomsGrid ? 2 : 4,
      Math.round(STACK_GRID_COLS_BY_BREAKPOINT[roomsGridBreakpoint] ?? 2),
    );

    if (!isAccessories && !expandedCluster) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-[65] bg-[#05070d]/82 text-white backdrop-blur-3xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.10),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.16))]" />
        <div className="relative z-10 flex h-full min-h-0 w-full flex-col overflow-hidden p-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-6 lg:p-8">
          <header className="flex shrink-0 items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/38">{activeRoomTitle}</p>
              <h2 className="mt-2 truncate text-3xl font-semibold tracking-normal text-white sm:text-4xl">{title}</h2>
              <p className="mt-1 text-sm font-medium text-white/42">
                {itemCount} {itemCount === 1 ? 'dispositivo' : 'dispositivi'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpandedRoomSection(null)}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
            >
              Fine
            </button>
          </header>

          <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 glass-scrollbar">
            {isAccessories
              ? renderAccessoryCards(accessoryCards, 'expanded')
              : renderWidgetGrid(expandedCluster?.widgets ?? [], expandedGridCols)}
          </div>
        </div>
      </div>
    );
  };

  const isEditingRoom = editingRoom !== null;
  const isEditingHaRoom = editingRoom?.source === 'ha';
  const isRoomFormBusy = editingRoom?.source === 'ha'
    ? areaActionById[editingRoom.id] === 'saving'
    : isCreatingRoom;
  const canUseHaAreaForm = Boolean(haConnected && onCallApi);
  const showAreaDetailsControl = canUseHaAreaForm && (!isEditingRoom || isEditingHaRoom);
  const roomFormTitle = isEditingRoom ? 'Modifica stanza' : 'Nuova stanza';
  const roomFormBadge = isEditingRoom
    ? isEditingHaRoom
      ? 'Area Home Assistant'
      : 'Locale'
    : canUseHaAreaForm
      ? 'Area Home Assistant'
      : 'Locale';
  const roomFormPrimaryLabel = isEditingRoom
    ? isRoomFormBusy
      ? 'Salvo...'
      : 'Salva'
    : isRoomFormBusy
      ? 'Creo...'
      : canUseHaAreaForm
      ? 'Crea'
      : 'Aggiungi';

  const handleRoomTitlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = roomTitleScrollerRef.current;
    const target = event.target as Element | null;
    if (
      !scroller ||
      target?.closest('button, a, input, textarea, select, [role="button"]') ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      scroller.scrollWidth <= scroller.clientWidth + 1
    ) {
      return;
    }
    roomTitleDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
      didMove: false,
    };
    roomTitleSuppressClickRef.current = false;
    if (!scroller.hasPointerCapture(event.pointerId)) {
      scroller.setPointerCapture(event.pointerId);
    }
  };

  const handleRoomTitlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = roomTitleScrollerRef.current;
    const dragState = roomTitleDragRef.current;
    if (!scroller || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }
    const dragOffset = event.clientX - dragState.startX;
    if (!dragState.didMove && Math.abs(dragOffset) < ROOM_TITLE_DRAG_THRESHOLD_PX) {
      return;
    }
    dragState.didMove = true;
    event.preventDefault();
    scroller.scrollLeft = dragState.scrollLeft - dragOffset;
  };

  const handleRoomTitlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = roomTitleScrollerRef.current;
    const dragState = roomTitleDragRef.current;
    if (!scroller || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }
    roomTitleDragRef.current = null;
    roomTitleSuppressClickRef.current = dragState.didMove;
    if (scroller.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }
    if (dragState.didMove) {
      window.setTimeout(() => {
        roomTitleSuppressClickRef.current = false;
      }, 0);
    }
  };

  const handleRoomTitleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!roomTitleSuppressClickRef.current) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    roomTitleSuppressClickRef.current = false;
  };

  const createRoomSwiperPointerHandlers = (
    scrollerRef: React.RefObject<HTMLDivElement | null>,
    dragRef: React.MutableRefObject<FloorCarouselDragState | null>,
    suppressClickRef: React.MutableRefObject<boolean>,
  ) => {
    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      const scroller = scrollerRef.current;
      const target = event.target as Element | null;
      if (
        !scroller ||
        target?.closest('button, a, input, textarea, select, [role="button"]') ||
        (event.pointerType === 'mouse' && event.button !== 0) ||
        scroller.scrollWidth <= scroller.clientWidth + 1
      ) {
        return;
      }
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        scrollLeft: scroller.scrollLeft,
        didMove: false,
      };
      suppressClickRef.current = false;
      if (!scroller.hasPointerCapture(event.pointerId)) {
        scroller.setPointerCapture(event.pointerId);
      }
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      const scroller = scrollerRef.current;
      const dragState = dragRef.current;
      if (!scroller || !dragState || dragState.pointerId !== event.pointerId) {
        return;
      }
      const dragOffset = event.clientX - dragState.startX;
      if (!dragState.didMove && Math.abs(dragOffset) < FLOOR_CAROUSEL_DRAG_THRESHOLD_PX) {
        return;
      }
      if (!dragState.didMove) {
        dragState.didMove = true;
        scroller.classList.remove('snap-x', 'snap-mandatory');
        scroller.classList.add('snap-none');
      }
      event.preventDefault();
      scroller.scrollLeft = dragState.scrollLeft - dragOffset;
    };

    const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
      const scroller = scrollerRef.current;
      const dragState = dragRef.current;
      if (!scroller || !dragState || dragState.pointerId !== event.pointerId) {
        return;
      }
      dragRef.current = null;
      suppressClickRef.current = dragState.didMove;
      if (scroller.hasPointerCapture(event.pointerId)) {
        scroller.releasePointerCapture(event.pointerId);
      }
      if (dragState.didMove) {
        const slideIndex = Math.max(0, Math.round(scroller.scrollLeft / Math.max(1, scroller.clientWidth)));
        scroller.classList.remove('snap-none');
        scroller.classList.add('snap-x', 'snap-mandatory');
        scroller.scrollTo({
          left: slideIndex * scroller.clientWidth,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      } else {
        scroller.classList.remove('snap-none');
        scroller.classList.add('snap-x', 'snap-mandatory');
      }
    };

    const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
      if (!suppressClickRef.current) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
    };

    return {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: handlePointerEnd,
      onClickCapture: handleClickCapture,
    };
  };

  const climateSwiperPointerHandlers = createRoomSwiperPointerHandlers(
    mobileClimateSwiperRef,
    climateSwiperDragRef,
    climateSwiperSuppressClickRef,
  );
  const mediaSwiperPointerHandlers = createRoomSwiperPointerHandlers(
    mediaSwiperRef,
    mediaSwiperDragRef,
    mediaSwiperSuppressClickRef,
  );

  const handleFloorCarouselPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const carousel = floorCarouselRef.current;
    if (!carousel || event.button !== 0 || isFloorCarouselInteractiveTarget(event.target)) {
      return;
    }
    floorCarouselDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: carousel.scrollLeft,
      didMove: false,
    };
  };

  const handleFloorCarouselPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const carousel = floorCarouselRef.current;
    const dragState = floorCarouselDragRef.current;
    if (!carousel || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }
    const dragOffset = event.clientX - dragState.startX;
    if (!dragState.didMove && Math.abs(dragOffset) < FLOOR_CAROUSEL_DRAG_THRESHOLD_PX) {
      return;
    }
    if (!dragState.didMove && !carousel.hasPointerCapture(event.pointerId)) {
      carousel.setPointerCapture(event.pointerId);
    }
    dragState.didMove = true;
    carousel.scrollLeft = dragState.scrollLeft - dragOffset;
  };

  const handleFloorCarouselPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const carousel = floorCarouselRef.current;
    const dragState = floorCarouselDragRef.current;
    if (!carousel || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }
    floorCarouselDragRef.current = null;
    floorCarouselSuppressClickRef.current = dragState.didMove;
    if (carousel.hasPointerCapture(event.pointerId)) {
      carousel.releasePointerCapture(event.pointerId);
    }
    if (dragState.didMove) {
      window.setTimeout(() => {
        floorCarouselSuppressClickRef.current = false;
      }, 0);
    }
  };

  const renderFloorCard = (floor: HaFloorEntry) => {
    const isSelected = selectedFloorId === floor.floor_id;
    const isEditingFloor = editingFloorId === floor.floor_id;
    const floorAction = floorActionById[floor.floor_id];
    const floorError = floorErrorById[floor.floor_id];
    const floorRoomCount = roomCountByFloorId[floor.floor_id] ?? 0;
    const floorDraft = floorDraftById[floor.floor_id] ?? buildFloorDraft(floor);
    const floorIndex = effectiveHaFloors.findIndex((entry) => entry.floor_id === floor.floor_id);
    const canMoveFloorLeft = floorIndex > 0;
    const canMoveFloorRight = floorIndex >= 0 && floorIndex < effectiveHaFloors.length - 1;
    const FloorIcon = getFloorIcon(floor);

    return (
      <div
        key={floor.floor_id}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (floorCarouselSuppressClickRef.current) {
            return;
          }
          if (isEditingFloor) {
            return;
          }
          setSelectedFloorId(floor.floor_id);
          setIsFloorLayerOpen(false);
        }}
        onKeyDown={(event) => {
          if (isEditingFloor) {
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setSelectedFloorId(floor.floor_id);
            setIsFloorLayerOpen(false);
          }
        }}
        className={cn(FLOOR_CARD_CLASS, isSelected && 'border-white/20 bg-white/[0.08]')}
      >
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-white/36">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035]">
                  <FloorIcon size={14} />
                </span>
                <p className="text-[11px] uppercase tracking-[0.22em]">Piano</p>
              </div>
              {isEditingFloor ? (
                <div
                  className="mt-3 space-y-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    value={floorDraft.name}
                    onChange={(event) =>
                      setFloorDraftById((current) => ({
                        ...current,
                        [floor.floor_id]: { ...floorDraft, name: event.target.value },
                      }))
                    }
                    className={ROOM_MODAL_INPUT_CLASS}
                    placeholder="Nome piano"
                    autoFocus
                  />
                  <input
                    value={floorDraft.aliases}
                    onChange={(event) =>
                      setFloorDraftById((current) => ({
                        ...current,
                        [floor.floor_id]: { ...floorDraft, aliases: event.target.value },
                      }))
                    }
                    className={ROOM_MODAL_INPUT_CLASS}
                    placeholder="Alias vocali"
                  />
                  <input
                    value={floorDraft.level}
                    inputMode="numeric"
                    onChange={(event) =>
                      setFloorDraftById((current) => ({
                        ...current,
                        [floor.floor_id]: { ...floorDraft, level: event.target.value },
                      }))
                    }
                    className={ROOM_MODAL_INPUT_CLASS}
                    placeholder="Livello, es. 1"
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void saveHaFloor(floor.floor_id);
                      }}
                      disabled={floorAction === 'saving'}
                      className={ROOM_MODAL_PRIMARY_BUTTON_CLASS}
                    >
                      <Save size={14} />
                      Salva
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingFloorId(null)}
                      disabled={floorAction === 'saving'}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/35 transition-all hover:bg-white/[0.06] hover:text-white active:scale-95"
                      aria-label="Annulla modifica piano"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="mt-3 truncate text-2xl font-semibold tracking-normal text-white">{floor.name}</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {typeof floor.level === 'number' ? (
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-white/46">
                        Livello {floor.level}
                      </span>
                    ) : null}
                    {floor.aliases && floor.aliases.length > 0 ? (
                      <span className="max-w-full truncate rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-white/46">
                        {floor.aliases.join(', ')}
                      </span>
                    ) : null}
                  </div>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  startEditFloor(floor);
                }}
                disabled={Boolean(floorAction)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition-all hover:text-white/70 active:scale-95 disabled:cursor-wait disabled:opacity-45"
                aria-label="Modifica piano"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setFloorDeleteCandidate(floor);
                }}
                disabled={Boolean(floorAction)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-500/35 transition-all hover:text-red-500 active:scale-95 disabled:cursor-wait disabled:opacity-45"
                aria-label="Elimina piano"
              >
                <MinusCircle size={16} />
              </button>
            </div>
          </div>
          {floorError ? <p className="mt-3 text-xs leading-relaxed text-rose-200/80">{floorError}</p> : null}
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-4xl font-semibold leading-none text-white/90">{floorRoomCount}</p>
            <p className="mt-1 text-xs font-medium text-white/36">{floorRoomCount === 1 ? 'stanza' : 'stanze'}</p>
          </div>
          <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void reorderHaFloor(floor.floor_id, -1);
                }}
                disabled={!canMoveFloorLeft || Boolean(floorAction)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.025] text-white/34 transition-all hover:bg-white/[0.06] hover:text-white/78 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
                aria-label="Sposta piano a sinistra"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void reorderHaFloor(floor.floor_id, 1);
                }}
                disabled={!canMoveFloorRight || Boolean(floorAction)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.025] text-white/34 transition-all hover:bg-white/[0.06] hover:text-white/78 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
                aria-label="Sposta piano a destra"
              >
                <ChevronRight size={20} />
              </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rooms-dashboard dashboard-page-scroll">
      <div
        className={cn(
          'dashboard-page-content dashboard-page-content-wide min-w-0 max-w-full transform-gpu',
          isFloorLayerOpen ? FLOOR_LAYER_BACKGROUND_OPEN_CLASS : FLOOR_LAYER_BACKGROUND_CLOSED_CLASS,
        )}
      >
        <main className="relative z-10 min-w-0 max-w-full" style={roomsGridStyle}>
          <header className="relative z-10 w-full" style={{ gridArea: 'header' }}>
            <div className="flex min-w-0 items-baseline gap-3">
              <div
                ref={roomTitleScrollerRef}
                onPointerDown={handleRoomTitlePointerDown}
                onPointerMove={handleRoomTitlePointerMove}
                onPointerUp={handleRoomTitlePointerEnd}
                onPointerCancel={handleRoomTitlePointerEnd}
                onClickCapture={handleRoomTitleClickCapture}
                className="flex min-w-0 flex-1 cursor-grab touch-pan-y select-none items-baseline overflow-x-auto overscroll-x-contain pb-1 pl-1 pr-5 active:cursor-grabbing hide-scrollbar sm:pl-0 sm:pr-4"
              >
                <h1 className="shrink-0 text-[2rem] font-bold leading-none tracking-normal text-white sm:text-[2.65rem] lg:text-[3rem]">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.span
                      key={activeRoomTitleKey}
                      className="block will-change-transform"
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(5px)' }}
                      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: 'blur(5px)' }}
                      transition={ROOM_TITLE_TRANSITION}
                    >
                      {activeRoomTitle}
                    </motion.span>
                  </AnimatePresence>
                </h1>
                <nav className="ml-3 flex min-w-max items-center gap-1 sm:gap-2">
                  {roomTabs
                    .filter((tab) => tab.id !== activeRoomTab?.id)
                    .map((tab) => (
                      <RoomsTopTab
                        key={tab.id}
                        tab={tab}
                        isActive={false}
                        onClick={() => setActiveRoomId(tab.id)}
                      />
                    ))}
                </nav>
              </div>
              <button
                type="button"
                onClick={() => setIsFloorLayerOpen(true)}
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] p-0 text-xs font-semibold tracking-tight text-white/90 shadow-sm backdrop-blur-md transition-all hover:bg-white/[0.08] active:scale-95 sm:h-auto sm:w-auto sm:gap-1 sm:px-4 sm:py-1.5"
                aria-label={`Apri lista piani: ${currentFloorLabel}`}
                title={currentFloorLabel}
              >
                <CurrentFloorIcon className="h-3.5 w-3.5 shrink-0 sm:h-3 sm:w-3" />
                <span className="hidden max-w-[12rem] truncate sm:inline lg:max-w-none">{currentFloorLabel}</span>
                <ChevronDown className="hidden h-3 w-3 text-white/30 sm:block" />
              </button>
            </div>
            <p className="mt-0.5 pl-1 text-xs font-medium text-apple-gray text-white/40 sm:pl-0">
              {roomAmbientSubtitle}
            </p>
            {roomStatusChips.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5 pl-1 sm:pl-0">
                {roomStatusChips.map((chip) => (
                  <span
                    key={chip.id}
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-3.5 py-1.5 shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-white/[0.08] active:scale-95',
                      chip.className,
                    )}
                  >
                    {chip.icon}
                    <span className="flex select-none flex-col leading-none">
                      <span className="text-xs font-semibold tracking-tight text-white">{chip.label}</span>
                      <span className="mt-0.5 text-[10px] font-semibold tracking-tight text-white/48">{chip.status}</span>
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          {climateControlModel ? (
            <section
              className={cn(
                'min-h-0 min-w-0 max-w-full p-0',
                isCompactClimateControls
                  ? 'overflow-visible'
                  : 'rooms-surface overflow-hidden lg:min-h-[min(540px,calc(100dvh-13rem))] xl:min-h-[min(600px,calc(100dvh-12rem))]',
              )}
              style={{ gridArea: 'clima' }}
            >
              {isCompactClimateControls ? (
                <div className="-mx-1.5">
                  <div
                    ref={mobileClimateSwiperRef}
                    className="flex cursor-grab snap-x snap-mandatory select-none overflow-x-auto [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
                    onScroll={handleMobileClimateScroll}
                    {...climateSwiperPointerHandlers}
                  >
                    {mobileClimateWidgets.map((widget) => (
                      <div key={widget.id} className="min-w-0 basis-full snap-center shrink-0 px-1.5">
                        <div className="h-[min(15rem,42dvh)] min-h-[13rem] min-w-0">
                          {renderRoomWidget(widget)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {mobileClimateWidgets.length > 1 ? (
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      {mobileClimateWidgets.map((widget, index) => {
                        const active = widget.entityId === climateEntityId;
                        return (
                          <button
                            key={widget.entityId}
                            type="button"
                            className={cn(
                              'h-1.5 rounded-full transition-all duration-200 active:scale-95',
                              active ? 'w-5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.28)]' : 'w-1.5 bg-white/28 hover:bg-white/48',
                            )}
                            onClick={() => {
                              setSelectedClimateEntityId(widget.entityId);
                              scrollToMobileClimateSlide(index);
                            }}
                            aria-label={`Mostra ${widget.title}`}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="h-full min-h-[min(540px,calc(100dvh-13rem))] min-w-0 overflow-hidden xl:min-h-[min(600px,calc(100dvh-12rem))]">
                  <div
                    ref={mobileClimateSwiperRef}
                    className="flex h-full cursor-grab snap-x snap-mandatory select-none overflow-x-auto [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
                    onScroll={handleMobileClimateScroll}
                    {...climateSwiperPointerHandlers}
                  >
                    {climatePanelModels.map(({ entityId, model }) => (
                      <div key={entityId} className="min-w-0 basis-full snap-center shrink-0 px-1.5">
                        <RoomClimateCard
                          climate={model}
                          onTogglePower={() => {
                            const nextMode =
                              model.isOn
                                ? 'off'
                                : model.hvacModes?.find((mode) => mode !== 'off') ?? 'heat';
                            void onCallService?.('climate', 'set_hvac_mode', {
                              entity_id: entityId,
                              hvac_mode: nextMode,
                            });
                          }}
                          onDecreaseTarget={() => {
                            void onCallService?.('climate', 'set_temperature', {
                              entity_id: entityId,
                              temperature: Math.max(
                                model.minTemp,
                                model.targetTemp - (model.targetTempStep ?? 0.5),
                              ),
                            });
                          }}
                          onIncreaseTarget={() => {
                            void onCallService?.('climate', 'set_temperature', {
                              entity_id: entityId,
                              temperature: Math.min(
                                model.maxTemp,
                                model.targetTemp + (model.targetTempStep ?? 0.5),
                              ),
                            });
                          }}
                          onAutoAdjust={() => {
                            void onCallService?.('climate', 'set_temperature', {
                              entity_id: entityId,
                              temperature: Math.round(model.currentTemp),
                            });
                          }}
                          onRefreshCurrent={() => undefined}
                          onSetTargetTemp={(value) => {
                            void onCallService?.('climate', 'set_temperature', {
                              entity_id: entityId,
                              temperature: value,
                            });
                          }}
                          onSetTargetRange={(low, high) => {
                            void onCallService?.('climate', 'set_temperature', {
                              entity_id: entityId,
                              target_temp_low: low,
                              target_temp_high: high,
                            });
                          }}
                          onSetMode={(mode) => {
                            void onCallService?.('climate', 'set_hvac_mode', {
                              entity_id: entityId,
                              hvac_mode: mode,
                            });
                          }}
                          onSetFanMode={(mode) => {
                            void onCallService?.('climate', 'set_fan_mode', {
                              entity_id: entityId,
                              fan_mode: mode,
                            });
                          }}
                          onSetPresetMode={(mode) => {
                            void onCallService?.('climate', 'set_preset_mode', {
                              entity_id: entityId,
                              preset_mode: mode,
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  {climatePanelModels.length > 1 ? (
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      {climatePanelModels.map(({ entityId, model }, index) => {
                        const active = entityId === climateEntityId;
                        return (
                          <button
                            key={entityId}
                            type="button"
                            className={cn(
                              'h-1.5 rounded-full transition-all duration-200 active:scale-95',
                              active ? 'w-5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.28)]' : 'w-1.5 bg-white/28 hover:bg-white/48',
                            )}
                            onClick={() => {
                              setSelectedClimateEntityId(entityId);
                              scrollToMobileClimateSlide(index);
                            }}
                            aria-label={`Mostra ${model.name}`}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          ) : (
            renderEmptyRoomArea(
              'clima',
              'Nessun clima configurato per questa stanza',
              'Associa un termostato, una stufa o un climatizzatore alla stanza per controllarlo da qui.',
              'min-h-[540px] xl:min-h-[600px]',
            )
          )}

        {renderWidgetCluster(sensorsCluster, {
          gridArea: 'sensors',
          emptyTitle: 'Nessun sensore configurato per questa stanza',
          emptyDescription: 'Temperatura, umidita e altri sensori ambientali appariranno in questa area.',
        })}

        {renderWidgetCluster(securityCluster, {
          gridArea: 'security_cams',
          emptyTitle: 'Nessuna sicurezza configurata per questa stanza',
          emptyDescription: 'Serrature, camere e dispositivi di sicurezza collegati alla stanza saranno raccolti qui.',
        })}

        {lightsCluster || switchesCluster ? (
          <section className="flex min-w-0 flex-col gap-4 xl:gap-5" style={{ gridArea: 'lights_switches' }}>
            {renderWidgetCluster(lightsCluster)}
            {renderWidgetCluster(switchesCluster)}
          </section>
        ) : (
          renderEmptyRoomArea(
            'lights_switches',
            'Nessuna luce o interruttore configurato per questa stanza',
            'Collega luci, switch o ventole all area per controllarli da questa sezione.',
          )
        )}

        {renderMediaPlayerArea()}

        {!roomHasRenderedCards && isMobileRoomsGrid ? (
          <section
            className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"
            style={{ gridArea: 'lights_switches' }}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/42">Configurazione stanza</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Nessuna entita associata a questa stanza</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/56">
              Associa entita a questa area Home Assistant per costruire automaticamente la stanza.
            </p>
          </section>
        ) : null}
        </main>
      </div>
      {renderExpandedRoomSection()}
      {renderMediaBottomBar()}
      {isFloorLayerOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/20 p-6 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsFloorLayerOpen(false)}
            className="fixed right-6 top-8 z-50 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
          >
            Fine
          </button>

          <div className="mb-2 w-full max-w-5xl px-12">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/40">Piani</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white">Scegli un livello</h2>
          </div>

          <div
            ref={floorCarouselRef}
            onPointerDown={handleFloorCarouselPointerDown}
            onPointerMove={handleFloorCarouselPointerMove}
            onPointerUp={handleFloorCarouselPointerEnd}
            onPointerCancel={handleFloorCarouselPointerEnd}
            className="scrollbar-none w-full select-none overflow-x-auto overscroll-x-contain px-6 py-8 scroll-smooth hide-scrollbar [scrollbar-width:none] [touch-action:pan-x] sm:px-10 lg:px-[max(3rem,calc((100vw-80rem)/2))]"
          >
            <div className="mx-auto flex w-max snap-x snap-mandatory items-center gap-6">
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (floorCarouselSuppressClickRef.current) {
                    return;
                  }
                  setSelectedFloorId('all');
                  setIsFloorLayerOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedFloorId('all');
                    setIsFloorLayerOpen(false);
                  }
                }}
                className={cn(FLOOR_CARD_CLASS, selectedFloorId === 'all' && 'border-white/20 bg-white/[0.08]')}
              >
                <div>
                  <div className="flex items-center gap-2 text-white/36">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035]">
                      <Layers size={14} />
                    </span>
                    <p className="text-[11px] uppercase tracking-[0.22em]">Vista</p>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-normal text-white">Tutti i Piani</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/42">
                    Mostra tutte le stanze, indipendentemente dal piano assegnato.
                  </p>
                </div>
                <div>
                  <p className="text-4xl font-semibold leading-none text-white/90">{allRoomTabs.length}</p>
                  <p className="mt-1 text-xs font-medium text-white/36">{allRoomTabs.length === 1 ? 'stanza' : 'stanze'}</p>
                </div>
              </div>

              {effectiveHaFloors.map((floor) => renderFloorCard(floor))}

              <div className={FLOOR_ADD_CARD_CLASS}>
                {isAddingFloor ? (
                  <div className="w-full" onClick={(event) => event.stopPropagation()}>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/36">Nuovo piano</p>
                    <input
                      value={newFloorDraft.name}
                      onChange={(event) => {
                        setNewFloorDraft((current) => ({ ...current, name: event.target.value }));
                        setFloorCreateError(null);
                      }}
                      placeholder="Esempio: Primo piano"
                      className={cn(ROOM_MODAL_INPUT_CLASS, 'mt-3')}
                      autoFocus
                    />
                    <input
                      value={newFloorDraft.aliases}
                      onChange={(event) => {
                        setNewFloorDraft((current) => ({ ...current, aliases: event.target.value }));
                        setFloorCreateError(null);
                      }}
                      placeholder="Alias vocali"
                      className={cn(ROOM_MODAL_INPUT_CLASS, 'mt-2')}
                    />
                    <input
                      value={newFloorDraft.level}
                      inputMode="numeric"
                      onChange={(event) => {
                        setNewFloorDraft((current) => ({ ...current, level: event.target.value }));
                        setFloorCreateError(null);
                      }}
                      placeholder="Livello, es. 1"
                      className={cn(ROOM_MODAL_INPUT_CLASS, 'mt-2')}
                    />
                    {floorCreateError ? (
                      <p className="mt-3 text-xs leading-relaxed text-rose-200/80">{floorCreateError}</p>
                    ) : null}
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void createHaFloor();
                        }}
                        disabled={isCreatingFloor}
                        className={ROOM_MODAL_PRIMARY_BUTTON_CLASS}
                      >
                        <Save size={14} />
                        {isCreatingFloor ? 'Creo...' : 'Crea'}
                      </button>
                      <button
                        type="button"
                        onClick={resetFloorCreateForm}
                        disabled={isCreatingFloor}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/35 transition-all hover:bg-white/[0.06] hover:text-white active:scale-95 disabled:cursor-wait disabled:opacity-45"
                        aria-label="Annulla nuovo piano"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingFloor(true)}
                    className="flex h-full w-full flex-col items-center justify-center gap-3 text-center"
                  >
                    <Plus size={42} className="text-white/20 transition-all group-hover:scale-110 group-hover:text-white/60" />
                    <span className="text-xs font-medium text-white/30 transition-colors group-hover:text-white/60">
                      Aggiungi un piano
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsFloorLayerOpen(false);
              setIsManageOpen(true);
            }}
            className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70 shadow-sm backdrop-blur-md transition-all hover:bg-white/[0.08] hover:text-white active:scale-95"
          >
            <Plus size={14} />
            Gestisci o Aggiungi Stanza
          </button>
          {floorDeleteCandidate ? (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-5 backdrop-blur-md">
              <button
                type="button"
                className="absolute inset-0"
                onClick={() => {
                  if (floorActionById[floorDeleteCandidate.floor_id] !== 'deleting') {
                    setFloorDeleteCandidate(null);
                  }
                }}
                aria-label="Annulla eliminazione piano"
              />
              <div className="relative z-10 w-full max-w-sm rounded-[2rem] border border-white/[0.08] bg-[#1C1C1E]/70 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-3xl">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/36">Elimina piano</p>
                <h3 className="mt-2 text-xl font-semibold tracking-normal text-white">{floorDeleteCandidate.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/52">
                  Il piano verra rimosso da Home Assistant. Le stanze associate non verranno eliminate.
                </p>
                {floorErrorById[floorDeleteCandidate.floor_id] ? (
                  <p className="mt-3 text-xs leading-relaxed text-rose-200/80">
                    {floorErrorById[floorDeleteCandidate.floor_id]}
                  </p>
                ) : null}
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFloorDeleteCandidate(null)}
                    disabled={floorActionById[floorDeleteCandidate.floor_id] === 'deleting'}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white/70 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:cursor-wait disabled:opacity-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void removeHaFloor(floorDeleteCandidate);
                    }}
                    disabled={floorActionById[floorDeleteCandidate.floor_id] === 'deleting'}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-200 transition-all hover:bg-red-500/15 hover:text-red-100 active:scale-95 disabled:cursor-wait disabled:opacity-55"
                  >
                    <MinusCircle size={14} />
                    {floorActionById[floorDeleteCandidate.floor_id] === 'deleting' ? 'Elimino...' : 'Elimina'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {isManageOpen ? (
        <div className="fixed inset-0 z-[280] flex items-stretch justify-stretch p-0 md:items-center md:justify-center md:p-8">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            onClick={() => setIsManageOpen(false)}
            aria-label="Chiudi gestione stanze"
          />
          <section className="liquid-glass-panel relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border-0 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] md:h-[calc(100dvh-4rem)] md:max-h-[46rem] md:max-w-3xl md:rounded-[2rem] md:border md:p-6">
            <button
              type="button"
              onClick={() => setIsManageOpen(false)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-white/45 transition-all hover:bg-white/[0.06] hover:text-white active:scale-95"
              aria-label="Chiudi"
            >
              <X size={16} />
            </button>

            <div className="shrink-0">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/58">Gestisci stanze</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Schede stanza</h2>
            </div>

            <div className="mt-4 max-h-[45dvh] shrink-0 overflow-y-auto overscroll-contain rounded-[1.5rem] border border-white/[0.06] bg-white/[0.025] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_48px_rgba(0,0,0,0.16)] backdrop-blur-2xl glass-scrollbar md:max-h-[min(42dvh,28rem)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-white/72">{roomFormTitle}</p>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/50 backdrop-blur-md">
                  {roomFormBadge}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={newRoomName}
                  onChange={(event) => {
                    setNewRoomName(event.target.value);
                    setRoomCreateError(null);
                  }}
                  placeholder="Esempio: Studio"
                  className={cn(ROOM_MODAL_INPUT_CLASS, 'flex-1')}
                />
                <div className={cn('flex gap-2', isEditingRoom ? 'flex-row' : 'flex-col sm:flex-row')}>
                <button
                  type="button"
                  onClick={() => {
                    void submitRoomForm();
                  }}
                  disabled={isRoomFormBusy}
                  className={cn(ROOM_MODAL_PRIMARY_BUTTON_CLASS, isEditingRoom && 'flex-1')}
                >
                  {isEditingRoom ? <Save size={15} /> : <CirclePlus size={15} />}
                  {roomFormPrimaryLabel}
                </button>
                {isEditingRoom ? (
                  <button
                    type="button"
                    onClick={resetRoomForm}
                    disabled={isRoomFormBusy}
                    className={cn(ROOM_MODAL_SECONDARY_BUTTON_CLASS, 'flex-1')}
                  >
                    <X size={15} />
                    Annulla
                  </button>
                ) : null}
                </div>
              </div>
              {showAreaDetailsControl ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsAreaCreateDetailsOpen((current) => !current)}
                    aria-expanded={isAreaCreateDetailsOpen}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3.5 py-2 text-xs font-semibold text-white/62 backdrop-blur-md transition-all duration-200 hover:bg-white/[0.06] hover:text-white active:scale-95"
                  >
                    <ChevronRight
                      size={15}
                      className={cn('transition-transform', isAreaCreateDetailsOpen && 'rotate-90')}
                    />
                    Dettagli area
                  </button>
                  {isAreaCreateDetailsOpen ? (
                    <div className="mt-3 grid gap-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block min-w-0">
                          <span className="text-[11px] uppercase tracking-[0.14em] text-white/45">Piano</span>
                          <select
                            value={areaCreationDraft.floorId}
                            onChange={(event) =>
                              setAreaCreationDraft((current) => ({ ...current, floorId: event.target.value }))
                            }
                            className={cn(ROOM_MODAL_INPUT_CLASS, 'mt-1')}
                          >
                            <option value="">Nessun piano</option>
                            {effectiveHaFloors.map((floor) => (
                              <option key={floor.floor_id} value={floor.floor_id}>
                                {floor.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block min-w-0">
                          <span className="text-[11px] uppercase tracking-[0.14em] text-white/45">Icona</span>
                          <input
                            value={areaCreationDraft.icon}
                            onChange={(event) =>
                              setAreaCreationDraft((current) => ({ ...current, icon: event.target.value }))
                            }
                            placeholder="mdi:sofa"
                            className={cn(ROOM_MODAL_INPUT_CLASS, 'mt-1')}
                          />
                        </label>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block min-w-0">
                          <span className="text-[11px] uppercase tracking-[0.14em] text-white/45">Alias</span>
                          <input
                            value={areaCreationDraft.aliases}
                            onChange={(event) =>
                              setAreaCreationDraft((current) => ({ ...current, aliases: event.target.value }))
                            }
                            placeholder="studio, ufficio"
                            className={cn(ROOM_MODAL_INPUT_CLASS, 'mt-1')}
                          />
                          <span className="mt-1 block text-xs leading-relaxed text-white/42">
                            Gli alias sono nomi alternativi usati negli assistenti vocali per fare riferimento a quest'area.
                          </span>
                        </label>
                        <label className="block min-w-0">
                          <span className="text-[11px] uppercase tracking-[0.14em] text-white/45">Immagine</span>
                          <input
                            value={areaCreationDraft.picture}
                            onChange={(event) =>
                              setAreaCreationDraft((current) => ({ ...current, picture: event.target.value }))
                            }
                            placeholder="/local/rooms/studio.jpg"
                            className={cn(ROOM_MODAL_INPUT_CLASS, 'mt-1')}
                          />
                        </label>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block min-w-0">
                          <span className="text-[11px] uppercase tracking-[0.14em] text-white/45">Entita temperatura</span>
                          <input
                            list="room-temperature-entities"
                            value={areaCreationDraft.temperatureEntityId}
                            onChange={(event) =>
                              setAreaCreationDraft((current) => ({
                                ...current,
                                temperatureEntityId: event.target.value,
                              }))
                            }
                            placeholder="sensor.studio_temperature"
                            className={cn(ROOM_MODAL_INPUT_CLASS, 'mt-1')}
                          />
                        </label>
                        <label className="block min-w-0">
                          <span className="text-[11px] uppercase tracking-[0.14em] text-white/45">Entita umidita</span>
                          <input
                            list="room-humidity-entities"
                            value={areaCreationDraft.humidityEntityId}
                            onChange={(event) =>
                              setAreaCreationDraft((current) => ({
                                ...current,
                                humidityEntityId: event.target.value,
                              }))
                            }
                            placeholder="sensor.studio_humidity"
                            className={cn(ROOM_MODAL_INPUT_CLASS, 'mt-1')}
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
              {roomCreateError ? (
                <p className="mt-2 text-xs text-rose-100/80">{roomCreateError}</p>
              ) : (
                <p className="mt-2 text-xs text-white/42">
                  {isEditingRoom
                    ? isEditingHaRoom
                      ? 'Le modifiche verranno salvate su Home Assistant.'
                      : 'Le modifiche resteranno salvate solo in questo browser.'
                    : canUseHaAreaForm
                      ? isLoadingAreaMetadata
                        ? 'Carico i piani disponibili da Home Assistant.'
                        : 'La nuova stanza verra salvata come area Home Assistant.'
                      : 'Offline: la stanza resta salvata solo in questo browser.'}
                </p>
              )}
            </div>

            {canUseHaAreaForm ? (
              <>
                <datalist id="room-temperature-entities">
                  {temperatureEntityOptions.map((entity) => (
                    <option key={entity.entityId} value={entity.entityId}>
                      {entity.name}
                    </option>
                  ))}
                </datalist>
                <datalist id="room-humidity-entities">
                  {humidityEntityOptions.map((entity) => (
                    <option key={entity.entityId} value={entity.entityId}>
                      {entity.name}
                    </option>
                  ))}
                </datalist>
              </>
            ) : null}

            <div className="mt-4 flex min-h-[11rem] flex-1 flex-col overflow-hidden sm:min-h-[14rem]">
              <div className="flex shrink-0 items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Stanze esistenti</p>
                <span className="text-xs text-white/40">{allRoomTabs.length}</span>
              </div>
              <div className="mt-2 min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1 backdrop-blur-md">
                <div className="h-full min-h-0 overflow-y-auto glass-scrollbar">
                  {allRoomTabs.map((tab) => {
                    const isPersistedCustomRoom = persistedCustomRoomIds.has(tab.id);
                    const isDemoTab = tab.source === 'custom' && !isPersistedCustomRoom;
                    const isHaTab = tab.source === 'ha';
                    const haArea = isHaTab ? effectiveHaAreas.find((area) => area.area_id === tab.id) : null;
                    const areaAction = areaActionById[tab.id];
                    const areaError = areaErrorById[tab.id];
                    const isEditingThisRoom = editingRoom?.id === tab.id;
                    const rowClassName = cn(ROOM_MODAL_ROW_CLASS, isEditingThisRoom && 'bg-white/[0.035]');
                    if (isHaTab && haArea) {
                      return (
                        <div key={`manager-${tab.id}`} className={rowClassName}>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-white/42">Area HA</p>
                            <p className="truncate text-sm font-semibold text-white/92">{tab.name}</p>
                            {areaAction ? (
                              <p className="mt-1 text-xs text-white/38">
                                {areaAction === 'saving' ? 'Salvataggio area...' : 'Eliminazione area...'}
                              </p>
                            ) : null}
                            {areaError ? <p className="mt-1 text-xs text-rose-200/80">{areaError}</p> : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditRoom(tab, haArea)}
                              disabled={Boolean(areaAction)}
                              className={cn(
                                'inline-flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-all hover:text-white/80 active:scale-95 disabled:cursor-wait disabled:opacity-45',
                                isEditingThisRoom && 'text-white/85',
                              )}
                              aria-label="Modifica area Home Assistant"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void removeHaArea(tab.id, haArea.name || tab.name);
                              }}
                              disabled={Boolean(areaAction)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition-all hover:text-red-400 active:scale-95 disabled:cursor-wait disabled:opacity-45"
                              aria-label="Elimina area Home Assistant"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={`manager-${tab.id}`} className={rowClassName}>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-white/42">
                            {isHaTab ? 'Area HA' : isDemoTab ? 'Demo' : 'Locale'}
                          </p>
                          <p className="truncate text-sm font-semibold text-white/92">{tab.name}</p>
                        </div>
                        {isDemoTab ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/52 backdrop-blur-md">
                            <Lock size={12} />
                            Predefinita
                          </span>
                        ) : (
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditRoom(tab)}
                              className={cn(
                                'inline-flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-all hover:text-white/80 active:scale-95',
                                isEditingThisRoom && 'text-white/85',
                              )}
                              aria-label="Modifica stanza"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCustomRoom(tab.id, tab.name)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition-all hover:text-red-400 active:scale-95"
                              aria-label="Elimina stanza"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="mt-4 hidden shrink-0 text-xs text-white/50 sm:block">
                Le aree Home Assistant possono essere modificate o eliminate da qui. Le stanze locali restano salvate solo in questo browser.
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default RoomsDashboard;

