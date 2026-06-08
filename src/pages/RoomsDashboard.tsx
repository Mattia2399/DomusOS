import React from 'react';
import {
  CirclePlus,
  ChevronRight,
  Fan,
  Flame,
  Leaf,
  Lightbulb,
  Lock,
  Minus,
  Music2,
  Pause,
  Play,
  Plus,
  Repeat2,
  Save,
  Shuffle,
  SkipBack,
  SkipForward,
  Snowflake,
  Speaker,
  Trash2,
  Tv,
  Unlock,
  Video,
  Wind,
  X,
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
import { ClimateControls } from '../components/settings/ClimateControls';
import { SectionCardRenderer, WidgetCardRenderer } from '../components/widgets/CardRenderer';
import { useDashboardState } from '../hooks/useDashboardState';
import type { HaArea } from '../hooks/useHaLiveConnection';
import type { DashboardSection, SceneKey, Widget, WidgetKind } from '../types/dashboardModels';
import type { MockEntityState, MockEntityStateMap } from '../types/ha';

const CUSTOM_ROOMS_STORAGE_KEY = 'ha.dashboard.rooms.customRooms.v1';
const ACTIVE_ROOM_STORAGE_KEY = 'ha.dashboard.rooms.activeRoomId.v1';
const ROOM_ID_CUSTOM_PREFIX = 'custom:';

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
  { id: 'demo-living-room', name: 'Living Room', source: 'custom' },
  { id: 'demo-bedroom', name: 'Bed Room', source: 'custom' },
  { id: 'demo-kitchen', name: 'Kitchen', source: 'custom' },
  { id: 'demo-bathroom', name: 'Bathroom', source: 'custom' },
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
    status: state?.stateLabel ?? state?.state ?? 'Ready',
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

function formatWeatherCondition(state?: MockEntityState) {
  const fromSecondary = typeof state?.secondary === 'string' ? state.secondary.trim() : '';
  if (fromSecondary) {
    return fromSecondary;
  }
  const fromLabel = typeof state?.stateLabel === 'string' ? state.stateLabel.trim() : '';
  if (fromLabel) {
    return fromLabel;
  }
  return toTitleCase(`${state?.state ?? 'stable'}`);
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
        'group relative inline-flex items-center rounded-full px-5 py-2.5 text-base font-semibold tracking-tight transition-colors sm:text-[1.15rem]',
        isActive
          ? 'text-white'
          : 'text-[#a4acb9] hover:text-[#c0c7d3]',
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
  const [customRooms, setCustomRooms] = React.useState<CustomRoomRecord[]>(readStoredCustomRooms);
  const [activeRoomId, setActiveRoomId] = React.useState<string>(readStoredActiveRoomId);
  const [isManageOpen, setIsManageOpen] = React.useState(false);
  const [newRoomName, setNewRoomName] = React.useState('');
  const [roomDraftById, setRoomDraftById] = React.useState<Record<string, string>>({});
  const [entityAreaByEntityId, setEntityAreaByEntityId] = React.useState<Record<string, string>>({});
  const [registryLoadAt, setRegistryLoadAt] = React.useState<number>(0);
  const [demoToggleById, setDemoToggleById] = React.useState<Record<string, boolean>>({
    'demo-light': true,
    'demo-stereo': false,
    'demo-tv': false,
    'demo-monitoring': true,
  });
  const [sceneByRoomId, setSceneByRoomId] = React.useState<Record<string, string>>({});

  const haRoomTabs = React.useMemo<RoomTab[]>(
    () =>
      haAreas.map((area) => ({
        id: area.area_id,
        name: area.name,
        source: 'ha',
      })),
    [haAreas],
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

  const roomTabs = React.useMemo<RoomTab[]>(() => {
    const merged = [...haRoomTabs, ...customRoomTabs];
    return merged.length > 0 ? merged : DEMO_ROOM_TABS;
  }, [customRoomTabs, haRoomTabs]);
  const persistedCustomRoomIds = React.useMemo(
    () => new Set(customRooms.map((room) => room.id)),
    [customRooms],
  );

  const roomIds = React.useMemo(() => new Set(roomTabs.map((tab) => tab.id)), [roomTabs]);
  const activeRoomTab = React.useMemo(
    () => roomTabs.find((tab) => tab.id === activeRoomId) ?? roomTabs[0] ?? null,
    [activeRoomId, roomTabs],
  );

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
    setRoomDraftById(
      customRooms.reduce<Record<string, string>>((acc, room) => {
        acc[room.id] = room.name;
        return acc;
      }, {}),
    );
  }, [customRooms, isManageOpen]);

  const addCustomRoom = () => {
    const normalized = normalizeRoomName(newRoomName);
    if (!normalized) {
      return;
    }
    const id = `${ROOM_ID_CUSTOM_PREFIX}${buildRandomId()}`;
    const nextRoom: CustomRoomRecord = {
      id,
      name: normalized,
      createdAt: Date.now(),
    };
    setCustomRooms((current) => [...current, nextRoom]);
    setActiveRoomId(id);
    setNewRoomName('');
  };

  const saveCustomRoomName = (roomId: string) => {
    const nextName = normalizeRoomName(roomDraftById[roomId] ?? '');
    if (!nextName) {
      return;
    }
    setCustomRooms((current) =>
      current.map((room) => (room.id === roomId ? { ...room, name: nextName } : room)),
    );
  };

  const removeCustomRoom = (roomId: string) => {
    setCustomRooms((current) => current.filter((room) => room.id !== roomId));
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
  const isDemoSeedRoom = Boolean(activeRoomTab?.id.startsWith('demo-'));
  const hasRoomEntities = React.useMemo(
    () =>
      Object.values(activeBuckets).some((entityIds) => entityIds.length > 0),
    [activeBuckets],
  );

  const weatherEntityId = React.useMemo(() => {
    if (activeBuckets.weathers.length > 0) {
      return activeBuckets.weathers[0];
    }
    if (isDemoSeedRoom) {
      return Object.keys(haStates).find((entityId) => entityId.startsWith('weather.')) ?? null;
    }
    return null;
  }, [activeBuckets.weathers, haStates, isDemoSeedRoom]);

  const weatherEntity = weatherEntityId ? haStates[weatherEntityId] : undefined;
  const weatherTemperature =
    toNumber(weatherEntity?.currentValue) ??
    toNumber(weatherEntity?.rawAttributes?.temperature) ??
    toNumber(weatherEntity?.state) ??
    23;
  const weatherCondition = formatWeatherCondition(weatherEntity);
  const weatherWindSpeed =
    toNumber(weatherEntity?.windSpeed) ??
    toNumber(weatherEntity?.rawAttributes?.wind_speed) ??
    toNumber(weatherEntity?.rawAttributes?.wind_bearing) ??
    14;

  const climateEntityId = activeBuckets.climates[0] ?? null;
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
          title: 'Front Door',
          subtitle: 'Closed',
          isClosed: true,
          icon: <Lock size={16} />,
          isLive: false,
        },
        {
          id: 'demo-back-door',
          title: 'Back Door',
          subtitle: 'Closed',
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
        subtitle: isClosed ? 'Closed' : 'Open',
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
        title: 'Light',
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
        title: 'Television',
        domain: 'switch',
        isOn: demoToggleById['demo-tv'] ?? false,
        icon: <Tv size={18} />,
        isLive: false,
        isToggleSupported: true,
      },
      {
        id: 'demo-monitoring',
        title: 'Monitoring',
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

  const mediaEntityId = activeBuckets.medias[0] ?? null;
  const mediaEntity = mediaEntityId ? haStates[mediaEntityId] : undefined;
  const mediaTitle = mediaEntity?.mediaTitle ?? mediaEntity?.nowPlaying ?? (isDemoSeedRoom ? 'COFFIN (feat. Eminem)' : 'Media player');
  const mediaArtist = mediaEntity?.mediaArtist ?? (isDemoSeedRoom ? 'Jessie Reyez, Eminem' : 'Idle');
  const mediaDuration = toNumber(mediaEntity?.mediaDuration) ?? (isDemoSeedRoom ? 212 : 1);
  const mediaPosition = toNumber(mediaEntity?.mediaPosition) ?? (isDemoSeedRoom ? 131 : 0);
  const mediaProgress = Math.min(1, Math.max(0, mediaDuration > 0 ? mediaPosition / mediaDuration : 0.4));
  const mediaIsPlaying = mediaEntity ? isEntityOn(mediaEntityId ?? '', mediaEntity) : isDemoSeedRoom;

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
      ? `Registry sync ${new Date(registryLoadAt).toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : 'Registry pending';

  const roomSourceLabel =
    activeRoomTab?.source === 'ha'
      ? 'Home Assistant Area'
      : activeRoomTab?.id.startsWith('demo-')
        ? 'Demo room'
        : 'Custom local room';
  const ambientMoodLabel = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Soft morning';
    if (hour >= 12 && hour < 18) return 'Soft daylight';
    if (hour >= 18 && hour < 22) return 'Soft evening';
    return 'Soft night';
  }, []);
  const trackedEntityIds = React.useMemo(
    () =>
      Array.from(
        new Set([
          ...activeBuckets.lights,
          ...activeBuckets.switches,
          ...activeBuckets.medias,
          ...activeBuckets.climates,
          ...activeBuckets.covers,
          ...activeBuckets.locks,
        ]),
      ),
    [
      activeBuckets.climates,
      activeBuckets.covers,
      activeBuckets.lights,
      activeBuckets.locks,
      activeBuckets.medias,
      activeBuckets.switches,
    ],
  );
  const activeDeviceCount = React.useMemo(() => {
    const liveCount = trackedEntityIds.reduce(
      (total, entityId) => total + (isEntityOn(entityId, haStates[entityId]) ? 1 : 0),
      0,
    );
    if (liveCount > 0) {
      return liveCount;
    }
    const demoCount = quickTiles.filter((tile) => tile.isOn).length;
    if (demoCount > 0) {
      return demoCount;
    }
    return isDemoSeedRoom ? 6 : 0;
  }, [haStates, isDemoSeedRoom, quickTiles, trackedEntityIds]);
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
    () => lightRows.reduce((total, light) => total + (light.isOn ? 1 : 0), 0),
    [lightRows],
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
    return ['Relax', 'Movie', 'Focus', 'Away'].map((label) => ({
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
  const ambientSummaryParts = React.useMemo(() => {
    const parts: string[] = [];
    if (hasLightsCard) {
      parts.push(`Light ${primaryLightPct}%`);
    }
    if (hasClimateCard) {
      parts.push(`Climate ${Math.round(climateCurrentTemp)} deg`);
    }
    if (activeSceneName) {
      parts.push(`Scene ${activeSceneName}`);
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

  const climateControlModel = React.useMemo(() => {
    if (!climateEntityId && !isDemoSeedRoom) {
      return null;
    }
    const rawAttributes = climateEntity?.rawAttributes ?? {};
    const mode = `${climateEntity?.hvacMode ?? rawAttributes.hvac_mode ?? climateEntity?.state ?? 'auto'}`
      .trim()
      .toLowerCase();
    const hvacModesFromEntity = toStringArray(climateEntity?.hvacModes);
    const hvacModesFromAttributes = toStringArray(rawAttributes.hvac_modes);
    const fanModesFromEntity = toStringArray(climateEntity?.fanModes);
    const fanModesFromAttributes = toStringArray(rawAttributes.fan_modes);
    const temperatureUnit =
      typeof rawAttributes.temperature_unit === 'string'
        ? rawAttributes.temperature_unit
        : climateEntity?.unit;

    return {
      name: climateEntityId ? getEntityFriendlyName(climateEntityId, climateEntity) : 'Room Climate',
      mode,
      isOn: !['off', 'unavailable', 'unknown'].includes(mode),
      status:
        typeof climateEntity?.stateLabel === 'string'
          ? climateEntity.stateLabel
          : mode === 'off'
            ? 'Spento'
            : 'Clima attivo',
      currentTemp: climateCurrentTemp,
      targetTemp: climateTargetTemp,
      minTemp: toNumber(climateEntity?.minTemp) ?? toNumber(rawAttributes.min_temp) ?? 16,
      maxTemp: toNumber(climateEntity?.maxTemp) ?? toNumber(rawAttributes.max_temp) ?? 30,
      targetTempLow: toNumber(climateEntity?.targetTempLow) ?? toNumber(rawAttributes.target_temp_low),
      targetTempHigh: toNumber(climateEntity?.targetTempHigh) ?? toNumber(rawAttributes.target_temp_high),
      targetTempStep: toNumber(climateEntity?.targetTempStep) ?? toNumber(rawAttributes.target_temp_step) ?? 0.5,
      hvacModes:
        hvacModesFromEntity.length > 0
          ? hvacModesFromEntity
          : hvacModesFromAttributes.length > 0
            ? hvacModesFromAttributes
            : ['heat', 'cool', 'auto', 'off'],
      hvacAction:
        typeof climateEntity?.hvacAction === 'string'
          ? climateEntity.hvacAction
          : typeof rawAttributes.hvac_action === 'string'
            ? rawAttributes.hvac_action
            : undefined,
      fanMode:
        typeof climateEntity?.fanMode === 'string'
          ? climateEntity.fanMode
          : typeof rawAttributes.fan_mode === 'string'
            ? rawAttributes.fan_mode
            : undefined,
      fanModes:
        fanModesFromEntity.length > 0
          ? fanModesFromEntity
          : fanModesFromAttributes.length > 0
            ? fanModesFromAttributes
            : undefined,
      temperatureUnit,
      rawAttributes,
    };
  }, [
    climateCurrentTemp,
    climateEntity,
    climateEntityId,
    climateTargetTemp,
    isDemoSeedRoom,
  ]);

  const callClimateService = React.useCallback(
    (service: string, serviceData: Record<string, unknown> = {}) => {
      if (!climateEntityId || !onCallService) {
        return;
      }
      void onCallService('climate', service, { entity_id: climateEntityId, ...serviceData });
    },
    [climateEntityId, onCallService],
  );

  const setClimateTargetTemp = React.useCallback(
    (value: number) => {
      callClimateService('set_temperature', { temperature: value });
    },
    [callClimateService],
  );

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
    const mediaWidgets =
      activeBuckets.medias.length > 0
        ? buildWidgetsForEntities(activeBuckets.medias, { i: 'media', x: 0, y: 0, w: 4, h: 2 })
        : demoWidgets.media;
    const coverWidgets =
      activeBuckets.covers.length > 0
        ? buildWidgetsForEntities(activeBuckets.covers, { i: 'covers', x: 0, y: 0, w: 2, h: 2 })
        : demoWidgets.covers;

    if (lightWidgets.length > 0) clusters.push({ id: 'lights', label: 'Lights', widgets: lightWidgets });
    if (switchWidgets.length > 0) clusters.push({ id: 'switches', label: 'Switches', widgets: switchWidgets });
    if (sensorWidgets.length > 0) clusters.push({ id: 'sensors', label: 'Sensors', widgets: sensorWidgets });
    if (securityWidgets.length > 0) clusters.push({ id: 'security', label: 'Security', widgets: securityWidgets });
    if (mediaWidgets.length > 0) clusters.push({ id: 'media', label: 'Media', widgets: mediaWidgets });
    if (coverWidgets.length > 0) clusters.push({ id: 'covers', label: 'Covers', widgets: coverWidgets });
    return clusters;
  }, [
    activeBuckets.cameras,
    activeBuckets.covers,
    activeBuckets.lights,
    activeBuckets.locks,
    activeBuckets.medias,
    activeBuckets.sensors,
    activeBuckets.switches,
    buildWidgetsForEntities,
    demoWidgets,
    haStates,
  ]);

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
      title: 'Scenes',
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
    Boolean(climateControlModel) || roomWidgetClusters.length > 0 || Boolean(roomSceneSection) || hasWeatherCard;

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
      onLockToggle={(nextWidget) => {
        void onCallService?.('lock', nextWidget.isOn ? 'lock' : 'unlock', { entity_id: nextWidget.entityId });
      }}
      onLockOpen={(nextWidget) => {
        void onCallService?.('lock', 'open', { entity_id: nextWidget.entityId });
      }}
    />
  );

  const lightsCluster = roomWidgetClusters.find((cluster) => cluster.id === 'lights');
  const switchesCluster = roomWidgetClusters.find((cluster) => cluster.id === 'switches');
  const sensorsCluster = roomWidgetClusters.find((cluster) => cluster.id === 'sensors');
  const securityCluster = roomWidgetClusters.find((cluster) => cluster.id === 'security');
  const mediaCluster = roomWidgetClusters.find((cluster) => cluster.id === 'media');
  const coversCluster = roomWidgetClusters.find((cluster) => cluster.id === 'covers');

  const renderWidgetCluster = (cluster: RoomWidgetCluster | undefined) => {
    if (!cluster) {
      return null;
    }
    const gridCols = Math.max(1, Math.round(STACK_GRID_COLS_BY_BREAKPOINT[roomsGridBreakpoint] ?? 1));
    return (
      <section className="rooms-surface min-w-0 space-y-3 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/52">{cluster.label}</h2>
          <span className="text-[0.7rem] font-medium text-white/34">{cluster.widgets.length}</span>
        </div>
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
          {cluster.widgets.map((widget) => {
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
      </section>
    );
  };

  return (
    <div className="rooms-dashboard relative h-full w-full overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-5 lg:px-7 lg:py-6">
      <header className="relative z-10 flex min-h-16 w-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <nav className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-6 md:gap-8">
            {roomTabs.map((tab) => (
              <RoomsTopTab
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeRoomTab?.id}
                onClick={() => setActiveRoomId(tab.id)}
              />
            ))}
          </div>
        </nav>
        <RoomIconButton
          onClick={() => setIsManageOpen(true)}
          label="Manage rooms"
          className="border border-white/12 bg-transparent"
        >
          <Plus size={20} />
        </RoomIconButton>
      </header>

      <section className="relative z-10 mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-[2.2rem]">
          {activeRoomTab?.name ?? 'Living Room'}
        </h1>
        <p className="mt-2 text-sm text-white/58 sm:text-base">
          {ambientMoodLabel}, {Math.round(weatherTemperature)}°, {activeDeviceCount} devices on
        </p>
      </section>

      <main
        className={cn(
          'relative z-10 mt-5 grid grid-cols-1 gap-4 xl:gap-5',
          climateControlModel
            ? 'xl:grid-cols-[minmax(300px,0.95fr)_minmax(320px,1fr)_minmax(320px,1fr)]'
            : 'xl:grid-cols-2',
        )}
      >
        {climateControlModel ? (
          <section className="rooms-surface min-h-[540px] min-w-0 overflow-hidden p-0 sm:min-h-[600px]">
            <ClimateControls
              climate={climateControlModel}
              onTogglePower={() => {
                const nextMode =
                  climateControlModel.isOn
                    ? 'off'
                    : climateControlModel.hvacModes?.find((mode) => mode !== 'off') ?? 'heat';
                callClimateService('set_hvac_mode', { hvac_mode: nextMode });
              }}
              onDecreaseTarget={() => {
                setClimateTargetTemp(
                  Math.max(
                    climateControlModel.minTemp,
                    climateControlModel.targetTemp - (climateControlModel.targetTempStep ?? 0.5),
                  ),
                );
              }}
              onIncreaseTarget={() => {
                setClimateTargetTemp(
                  Math.min(
                    climateControlModel.maxTemp,
                    climateControlModel.targetTemp + (climateControlModel.targetTempStep ?? 0.5),
                  ),
                );
              }}
              onAutoAdjust={() => setClimateTargetTemp(Math.round(climateControlModel.currentTemp))}
              onRefreshCurrent={() => undefined}
              onSetTargetTemp={setClimateTargetTemp}
              onSetTargetRange={(low, high) => {
                callClimateService('set_temperature', {
                  target_temp_low: low,
                  target_temp_high: high,
                });
              }}
              onSetMode={(mode) => {
                callClimateService('set_hvac_mode', { hvac_mode: mode });
              }}
              onSetFanMode={(mode) => {
                callClimateService('set_fan_mode', { fan_mode: mode });
              }}
            />
          </section>
        ) : null}

        <section className="flex min-w-0 flex-col gap-4 xl:gap-5">
          {hasWeatherCard ? (
            <RoomCardSlot className="min-h-[260px]">
              <SectionCardRenderer section={weatherSection} state={roomDashboardState} compact={false} />
            </RoomCardSlot>
          ) : null}
          {renderWidgetCluster(securityCluster)}
          {renderWidgetCluster(sensorsCluster)}
          {renderWidgetCluster(coversCluster)}
        </section>

        <section className="flex min-w-0 flex-col gap-4 xl:gap-5">
          {renderWidgetCluster(lightsCluster)}
          {renderWidgetCluster(switchesCluster)}
          {renderWidgetCluster(mediaCluster)}
          {roomSceneSection ? (
            <RoomCardSlot className="min-h-[300px]">
              <SectionCardRenderer
                section={roomSceneSection}
                state={roomDashboardState}
                compact={false}
                onSceneTrigger={(sceneKey) => {
                  const entityId = roomSceneEntityByKey[sceneKey];
                  if (entityId) {
                    void onCallService?.('scene', 'turn_on', { entity_id: entityId });
                  }
                }}
              />
            </RoomCardSlot>
          ) : null}
        </section>

        {!roomHasRenderedCards ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/42">Room setup</p>
            <h2 className="mt-2 text-xl font-semibold text-white">No entities mapped to this room</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/56">
              Add entities to this Home Assistant area to build the room automatically.
            </p>
          </section>
        ) : null}
      </main>
      {isManageOpen ? (
        <div className="fixed inset-0 z-[280] flex items-stretch justify-stretch p-0 md:items-center md:justify-center md:p-8">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            onClick={() => setIsManageOpen(false)}
            aria-label="Close room manager"
          />
          <section className="liquid-glass-panel relative z-10 h-full w-full overflow-y-auto rounded-none border-0 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] glass-scrollbar md:h-auto md:max-w-2xl md:rounded-[2rem] md:border md:p-6 md:overflow-visible">
            <button
              type="button"
              onClick={() => setIsManageOpen(false)}
              className="glass-icon-button absolute right-4 top-4 h-8 w-8"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <p className="text-[11px] uppercase tracking-[0.2em] text-white/58">Manage rooms</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Room tabs</h2>

            <div className="liquid-glass-card mt-4 p-3">
              <p className="text-xs text-white/60">Add custom room</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={newRoomName}
                  onChange={(event) => setNewRoomName(event.target.value)}
                  placeholder="Example: Studio"
                  className="h-10 flex-1 rounded-xl border border-white/14 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/28"
                />
                <button
                  type="button"
                  onClick={addCustomRoom}
                  className="glass-button h-10 rounded-xl border-[#0A84FF]/36 bg-[#0A84FF]/16 px-4 text-sm font-semibold text-blue-100 hover:bg-[#0A84FF]/24"
                >
                  <CirclePlus size={15} />
                  Add
                </button>
              </div>
            </div>

            <div className="mt-4 max-h-[23rem] space-y-2 overflow-y-auto pr-1 glass-scrollbar">
              {roomTabs.map((tab) => {
                const isPersistedCustomRoom = persistedCustomRoomIds.has(tab.id);
                const isDemoTab = tab.source === 'custom' && !isPersistedCustomRoom;
                const isHaTab = tab.source === 'ha';
                const isReadOnly = isHaTab || isDemoTab;
                return (
                  <div
                    key={`manager-${tab.id}`}
                    className="liquid-glass-card px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                          {isHaTab ? 'HA Area' : isDemoTab ? 'Demo' : 'Custom'}
                        </p>
                        {isReadOnly ? (
                          <p className="truncate text-sm font-semibold text-white">{tab.name}</p>
                        ) : (
                          <input
                            value={roomDraftById[tab.id] ?? tab.name}
                            onChange={(event) =>
                              setRoomDraftById((current) => ({
                                ...current,
                                [tab.id]: event.target.value,
                              }))
                            }
                            className="mt-1 h-9 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/28"
                          />
                        )}
                      </div>
                      {isReadOnly ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/16 bg-white/[0.08] px-2 py-1 text-[11px] text-white/65">
                          <Lock size={12} />
                          {isDemoTab ? 'Seed' : 'Read only'}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => saveCustomRoomName(tab.id)}
                            className="glass-icon-button h-9 w-9 rounded-xl"
                            aria-label="Save room name"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCustomRoom(tab.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-300/35 bg-rose-400/15 text-rose-100 hover:bg-rose-400/24"
                            aria-label="Delete room"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-white/50">
              Tabs from Home Assistant are read only. You can rename or remove only custom rooms.
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default RoomsDashboard;

