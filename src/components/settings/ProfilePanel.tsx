import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  MapPin,
  Moon,
  QrCode,
  RotateCcw,
  Route,
  Smartphone,
  SunMedium,
  Plus,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  DASHBOARD_WALLPAPER_PRESETS,
  type DashboardTheme,
  type DashboardWallpaperPreset,
  type SidebarQuickPath,
} from '../../hooks/useProfileSettings';
import type { HaConnectionStatus } from '../../hooks/useHaLiveConnection';
import {
  applyDashboardUserDataPayload,
  buildDashboardUserDataPayload,
  parseDashboardUserDataPayload,
} from '../../services/haUserConfigSync';
import type { DashboardConfig } from '../../types/dashboard';

type ProfilePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: ProfileSectionId;
  userAvatarUrl?: string;
  userAvatarAlt?: string;
  userEmail?: string;
  userRoleLabel?: string;
  houseMembers?: ProfileHouseMember[];
  userOwnedDeviceCount?: number;
  movementTimeline?: ProfileMovementTimelineEntry[];
  movementPoints?: ProfileMovementMapPoint[];
  movementUpdatedLabel?: string;
  theme: DashboardTheme;
  onThemeChange: (theme: DashboardTheme) => void;
  wallpaper: DashboardWallpaperPreset;
  onWallpaperChange: (wallpaper: DashboardWallpaperPreset) => void;
  developerMode: boolean;
  onDeveloperModeChange: (value: boolean) => void;
  haUrl: string;
  onUrlChange: (value: string) => void;
  haToken: string;
  onTokenChange: (value: string) => void;
  haRememberToken: boolean;
  onRememberTokenChange: (value: boolean) => void;
  haStatus: HaConnectionStatus;
  haError: string | null;
  haManagedByParent?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onStartOAuth: () => Promise<void>;
  isOAuthBusy: boolean;
  onDownloadBackup: () => void;
  onRestoreBackup: (file: File) => Promise<void>;
  onResetAll: () => Promise<void>;
  dashboardConfig?: DashboardConfig;
  dashboardCreatorUserId?: string;
  dashboardCurrentUserId?: string;
  dashboardDeviceId?: string;
  dashboardCurrentLayoutId?: string;
  dashboardCurrentLayoutSource?: 'device' | 'default' | 'none';
  dashboardCurrentUserIsMirror?: boolean;
  isCurrentDeviceDetached?: boolean;
  dashboardConfigSyncMode?: 'unknown' | 'shared' | 'user_data';
  dashboardGuestUserId?: string;
  availableSidebarPaths?: SidebarQuickPath[];
  onMirrorLayout?: (targetUserId: string, sourceUserId: string) => void;
  onCloneLayout?: (targetUserId: string, sourceLayoutId: string) => void;
  onCreateEmptyLayout?: (targetUserId: string) => void;
  onSetUserEditPermission?: (targetUserId: string, allowEdits: boolean) => void;
  onSetUserVisibleSidebarPaths?: (targetUserId: string, allowedPathIds: string[]) => void;
  onUnlinkCurrentDevice?: (userId: string, deviceId: string) => void;
  onRelinkCurrentDevice?: (userId: string, deviceId: string) => void;
};

export type ProfileSectionId = 'theme' | 'movements' | 'members' | 'ha' | 'config';

export type ProfileMovementTimelineEntry = {
  id: string;
  title: string;
  subtitle?: string;
  timestampLabel: string;
  timestampMs: number;
  isCurrent?: boolean;
};

export type ProfileMovementMapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  zoneLabel?: string;
  timestampLabel: string;
  timestampMs: number;
  isCurrent?: boolean;
};

export type ProfileHouseMember = {
  id: string;
  name: string;
  userId?: string;
  avatarUrl?: string;
  roleLabel?: string;
  isCurrent?: boolean;
};

const PROFILE_SECTIONS: { id: ProfileSectionId; label: string; hint: string }[] = [
  { id: 'theme', label: 'Tema e Sfondo', hint: 'Aspetto dashboard' },
  { id: 'movements', label: 'Spostamenti', hint: 'Timeline e mappa' },
  { id: 'members', label: 'Persone/Membri', hint: 'Utenti e ruoli' },
  { id: 'ha', label: 'Home Assistant', hint: 'Connessione live' },
  { id: 'config', label: 'Configurazione', hint: 'Backup e reset' },
];

const WALLPAPER_PREVIEW_CLASS_BY_ID: Record<DashboardWallpaperPreset, string> = {
  'home-hub': 'profile-wallpaper-thumb-home-hub',
  'ocean-mist': 'profile-wallpaper-thumb-ocean-mist',
  'sunset-amber': 'profile-wallpaper-thumb-sunset-amber',
  'forest-glass': 'profile-wallpaper-thumb-forest-glass',
  'total-white': 'profile-wallpaper-thumb-total-white',
  'total-black': 'profile-wallpaper-thumb-total-black',
};

const DEFAULT_PROFILE_AVATAR_URL =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop';
const PROFILE_MD_BREAKPOINT_PX = 768;
const GUEST_ACCESS_DEFAULT_VALIDITY_MINUTES = 90;
const GUEST_LAYOUT_ROUTE_ALIASES = new Set(['home', 'consumi', 'security', 'automations', 'automation', 'appgallery', 'appgalley']);
type GuestAccessLayoutPreset = {
  id: string;
  label: string;
  description: string;
  routePath: string;
  queryParams?: Record<string, string>;
};
const GUEST_ACCESS_LAYOUT_PRESETS: GuestAccessLayoutPreset[] = [
  {
    id: 'music_lights',
    label: 'Solo Musica e Luci',
    description: 'Accesso rapido ai controlli di intrattenimento.',
    routePath: '/home',
    queryParams: { guest_preset: 'music_lights' },
  },
  {
    id: 'home_essential',
    label: 'Home Essenziale',
    description: 'Vista base per azioni frequenti in casa.',
    routePath: '/home',
    queryParams: { guest_preset: 'home_essential' },
  },
  {
    id: 'security_view',
    label: 'Vista Sicurezza',
    description: 'Monitoraggio rapido della sicurezza.',
    routePath: '/security',
    queryParams: { guest_preset: 'security_view' },
  },
];
const DASHBOARD_SHARE_SCHEMA = 'ha-dashboard-builder-role-share';
const DASHBOARD_SHARE_VERSION = 1;
type DashboardShareRoleKey = 'creator' | 'admin' | 'member';
type DashboardRoleSharePayload = {
  schema: typeof DASHBOARD_SHARE_SCHEMA;
  version: typeof DASHBOARD_SHARE_VERSION;
  roleKey: DashboardShareRoleKey;
  roleLabel: string;
  createdAt: string;
  createdBy?: string;
  data: unknown;
};

function normalizeRoleToken(value: string | undefined) {
  return (value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function resolveDashboardShareRoleKey(value: string | undefined): DashboardShareRoleKey {
  const normalized = normalizeRoleToken(value);
  if (
    normalized.includes('creator') ||
    normalized.includes('creatore') ||
    normalized.includes('owner')
  ) {
    return 'creator';
  }
  if (normalized.includes('admin')) {
    return 'admin';
  }
  return 'member';
}

function resolveDashboardShareRoleLabel(roleKey: DashboardShareRoleKey) {
  if (roleKey === 'creator') {
    return 'Creatore';
  }
  if (roleKey === 'admin') {
    return 'Admin';
  }
  return 'Membro';
}

function decodeBase64Utf8(value: string) {
  try {
    if (typeof window === 'undefined' || !window.atob) {
      return null;
    }
    const binary = window.atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function parseDashboardRoleSharePayloadJson(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed) as Partial<DashboardRoleSharePayload>;
    if (
      parsed.schema !== DASHBOARD_SHARE_SCHEMA ||
      parsed.version !== DASHBOARD_SHARE_VERSION ||
      (parsed.roleKey !== 'creator' && parsed.roleKey !== 'admin' && parsed.roleKey !== 'member') ||
      typeof parsed.roleLabel !== 'string' ||
      typeof parsed.createdAt !== 'string' ||
      parsed.data === undefined
    ) {
      return null;
    }
    return parsed as DashboardRoleSharePayload;
  } catch {
    return null;
  }
}

function parseDashboardRoleSharePayload(rawToken: string) {
  const trimmedToken = rawToken.trim();
  if (!trimmedToken) {
    return null;
  }

  const parsedPlainJson = parseDashboardRoleSharePayloadJson(trimmedToken);
  if (parsedPlainJson) {
    return parsedPlainJson;
  }

  const decoded = decodeBase64Utf8(trimmedToken);
  if (!decoded) {
    return null;
  }
  return parseDashboardRoleSharePayloadJson(decoded);
}

function createGuestAccessNonce() {
  const randomSegment = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${randomSegment}`;
}

function formatDateTimeLocalInput(timestampMs: number) {
  const date = new Date(timestampMs);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseDateTimeLocalInput(value: string) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const parsedTimestamp = new Date(value).getTime();
  if (!Number.isFinite(parsedTimestamp)) {
    return null;
  }
  return parsedTimestamp;
}

function resolveGuestDashboardBasePath(pathname: string) {
  const segments = pathname
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
  const routeIndex = segments.findIndex((segment) => GUEST_LAYOUT_ROUTE_ALIASES.has(segment.toLowerCase()));
  if (routeIndex <= 0) {
    return '';
  }
  return `/${segments.slice(0, routeIndex).join('/')}`;
}

function buildGuestAccessUrl(
  layout: GuestAccessLayoutPreset,
  nonce: string,
  issuedAtMs: number,
  expiresAtMs: number,
  guestUserId?: string,
) {
  if (typeof window === 'undefined') {
    return '';
  }
  const safeRoute = layout.routePath.startsWith('/') ? layout.routePath : `/${layout.routePath}`;
  const basePath = resolveGuestDashboardBasePath(window.location.pathname);
  const joinedPath = `${basePath}${safeRoute}`.replace(/\/{2,}/g, '/');
  const targetUrl = new URL(joinedPath || '/', window.location.origin);
  targetUrl.searchParams.set('guest', '1');
  targetUrl.searchParams.set('guest_layout', layout.id);
  targetUrl.searchParams.set('guest_nonce', nonce);
  targetUrl.searchParams.set('guest_issued_at', `${issuedAtMs}`);
  targetUrl.searchParams.set('guest_expires_at', `${expiresAtMs}`);
  if (guestUserId && guestUserId.trim()) {
    targetUrl.searchParams.set('guest_user_id', guestUserId.trim());
  } else {
    targetUrl.searchParams.delete('guest_user_id');
  }
  Object.entries(layout.queryParams ?? {}).forEach(([key, value]) => {
    targetUrl.searchParams.set(key, value);
  });
  return targetUrl.toString();
}

export function ProfilePanel({
  isOpen,
  onClose,
  initialSection = 'theme',
  userAvatarUrl,
  userAvatarAlt,
  userEmail,
  userRoleLabel,
  houseMembers = [],
  userOwnedDeviceCount,
  movementTimeline = [],
  movementPoints = [],
  movementUpdatedLabel,
  theme,
  onThemeChange,
  wallpaper,
  onWallpaperChange,
  developerMode,
  onDeveloperModeChange,
  haUrl,
  onUrlChange,
  haToken,
  onTokenChange,
  haRememberToken,
  onRememberTokenChange,
  haStatus,
  haError,
  haManagedByParent,
  onConnect,
  onDisconnect,
  onStartOAuth,
  isOAuthBusy,
  onDownloadBackup,
  onRestoreBackup,
  onResetAll,
  dashboardConfig,
  dashboardCreatorUserId,
  dashboardCurrentUserId,
  dashboardDeviceId,
  dashboardCurrentLayoutId,
  dashboardCurrentLayoutSource,
  dashboardCurrentUserIsMirror,
  isCurrentDeviceDetached,
  dashboardConfigSyncMode = 'unknown',
  dashboardGuestUserId,
  availableSidebarPaths = [],
  onMirrorLayout,
  onCloneLayout,
  onCreateEmptyLayout,
  onSetUserEditPermission,
  onSetUserVisibleSidebarPaths,
  onUnlinkCurrentDevice,
  onRelinkCurrentDevice,
}: ProfilePanelProps) {
  const [activeSection, setActiveSection] = useState<ProfileSectionId>('theme');
  const [isCompactViewport, setIsCompactViewport] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < PROFILE_MD_BREAKPOINT_PX,
  );
  const [isCompactDetailOpen, setIsCompactDetailOpen] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [haActionError, setHaActionError] = useState<string | null>(null);
  const [configActionError, setConfigActionError] = useState<string | null>(null);
  const [isConfigActionBusy, setIsConfigActionBusy] = useState(false);
  const [profileAvatarSrc, setProfileAvatarSrc] = useState(userAvatarUrl ?? DEFAULT_PROFILE_AVATAR_URL);
  const [isGuestAccessModalOpen, setIsGuestAccessModalOpen] = useState(false);
  const [membersInspectorMode, setMembersInspectorMode] = useState<'members' | 'guest' | 'share'>('guest');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [memberSourceSelectionById, setMemberSourceSelectionById] = useState<Record<string, string>>({});
  const [memberActionFeedback, setMemberActionFeedback] = useState<{
    tone: 'idle' | 'success' | 'error';
    text: string;
  }>({ tone: 'idle', text: '' });
  const [selectedGuestLayoutId, setSelectedGuestLayoutId] = useState(
    GUEST_ACCESS_LAYOUT_PRESETS[0]?.id ?? 'music_lights',
  );
  const [guestAccessNonce, setGuestAccessNonce] = useState(() => createGuestAccessNonce());
  const [guestAccessIssuedAtMs, setGuestAccessIssuedAtMs] = useState(() => Date.now());
  const [guestAccessExpiresAtInput, setGuestAccessExpiresAtInput] = useState(() =>
    formatDateTimeLocalInput(Date.now() + GUEST_ACCESS_DEFAULT_VALIDITY_MINUTES * 60 * 1000),
  );
  const [guestAccessCopyState, setGuestAccessCopyState] = useState<'idle' | 'done' | 'error'>('idle');
  const [dashboardShareFeedback, setDashboardShareFeedback] = useState<{
    tone: 'idle' | 'success' | 'error';
    text: string;
  }>({ tone: 'idle', text: '' });
  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const dashboardShareImportInputRef = useRef<HTMLInputElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setShowToken(false);
      setHaActionError(null);
      setConfigActionError(null);
      setIsConfigActionBusy(false);
      setActiveSection('theme');
      setIsCompactDetailOpen(false);
      setIsGuestAccessModalOpen(false);
      setMembersInspectorMode('guest');
      setExpandedMemberId(null);
      setMemberSourceSelectionById({});
      setMemberActionFeedback({ tone: 'idle', text: '' });
      setGuestAccessCopyState('idle');
      setDashboardShareFeedback({ tone: 'idle', text: '' });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setActiveSection(initialSection);
      if (initialSection === 'members') {
        setMembersInspectorMode('members');
      }
    }
    wasOpenRef.current = isOpen;
  }, [initialSection, isOpen]);

  useEffect(() => {
    setProfileAvatarSrc(userAvatarUrl ?? DEFAULT_PROFILE_AVATAR_URL);
  }, [userAvatarUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateViewport = () => {
      setIsCompactViewport(window.innerWidth < PROFILE_MD_BREAKPOINT_PX);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  useEffect(() => {
    if (!isCompactViewport) {
      setIsCompactDetailOpen(false);
      setIsGuestAccessModalOpen(false);
    }
  }, [isCompactViewport]);

  useEffect(() => {
    if (guestAccessCopyState === 'idle') {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const timerId = window.setTimeout(() => {
      setGuestAccessCopyState('idle');
    }, 1800);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [guestAccessCopyState]);

  useEffect(() => {
    if (dashboardShareFeedback.tone === 'idle' || !dashboardShareFeedback.text) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const timerId = window.setTimeout(() => {
      setDashboardShareFeedback({ tone: 'idle', text: '' });
    }, 2600);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [dashboardShareFeedback]);

  useEffect(() => {
    if (memberActionFeedback.tone === 'idle' || !memberActionFeedback.text) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const timerId = window.setTimeout(() => {
      setMemberActionFeedback({ tone: 'idle', text: '' });
    }, 2400);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [memberActionFeedback]);

  if (!isOpen) {
    return null;
  }

  const isConnecting = haStatus === 'connecting';
  const isConnected = haStatus === 'connected';
  const isManagedByParent = haManagedByParent === true;
  const canStartOAuth = !isManagedByParent && haUrl.trim().length > 0;
  const canConnect = !isManagedByParent && haUrl.trim().length > 0 && haToken.trim().length > 0;
  const haErrorMessage = haActionError ?? haError;
  const activeSectionMeta = PROFILE_SECTIONS.find((section) => section.id === activeSection) ?? PROFILE_SECTIONS[0];
  const showMenuOnCompact = isCompactViewport && !isCompactDetailOpen;
  const showDetailOnCompact = isCompactViewport && isCompactDetailOpen;
  const isCompactFullScreenPage = isCompactViewport;
  const compactPageHeaderTitle = showDetailOnCompact ? activeSectionMeta.label : 'Profilo';
  const compactPageHeaderSubtitle = showDetailOnCompact ? 'Impostazioni' : 'Impostazioni account';
  const compactDisplayName = userAvatarAlt?.trim() || 'Utente';
  const compactDisplayEmail = userEmail?.trim() || 'Email non disponibile';
  const compactDisplayRole = userRoleLabel?.trim() || 'Utente';
  const desktopDisplayName = compactDisplayName;
  const desktopDisplayEmail = compactDisplayEmail;
  const desktopDisplayRole = compactDisplayRole;
  const currentDashboardShareRoleKey = resolveDashboardShareRoleKey(desktopDisplayRole);
  const currentDashboardShareRoleLabel = resolveDashboardShareRoleLabel(currentDashboardShareRoleKey);
  const normalizedHouseMembers = houseMembers.reduce<ProfileHouseMember[]>((collection, member) => {
    const memberId = typeof member.id === 'string' ? member.id.trim() : '';
    const memberName = typeof member.name === 'string' ? member.name.trim() : '';
    if (!memberId || !memberName || collection.some((entry) => entry.id === memberId)) {
      return collection;
    }
    collection.push({
      id: memberId,
      name: memberName,
      userId: typeof member.userId === 'string' ? member.userId.trim() : undefined,
      avatarUrl: typeof member.avatarUrl === 'string' ? member.avatarUrl.trim() : undefined,
      roleLabel: typeof member.roleLabel === 'string' ? member.roleLabel.trim() : undefined,
      isCurrent: member.isCurrent === true,
    });
    return collection;
  }, []);
  const sortedHouseMembers = normalizedHouseMembers
    .slice()
    .sort((first, second) => {
      if (first.isCurrent === true && second.isCurrent !== true) {
        return -1;
      }
      if (second.isCurrent === true && first.isCurrent !== true) {
        return 1;
      }
      return first.name.localeCompare(second.name, 'it-IT');
    });
  const visibleHouseMembers = sortedHouseMembers.slice(0, 4);
  const hiddenHouseMembersCount = Math.max(0, sortedHouseMembers.length - visibleHouseMembers.length);
  const enterpriseControlsEnabled = false;
  const canManageMemberLayouts =
    enterpriseControlsEnabled &&
    (currentDashboardShareRoleKey === 'creator' || currentDashboardShareRoleKey === 'admin');
  const normalizedCreatorUserId =
    typeof dashboardCreatorUserId === 'string' ? dashboardCreatorUserId.trim() : '';
  const creatorDefaultLayoutId =
    normalizedCreatorUserId && dashboardConfig?.users[normalizedCreatorUserId]
      ? dashboardConfig.users[normalizedCreatorUserId].default_layout
      : '';
  const matchesGuestAlias = (value: string | undefined) => {
    if (!value) {
      return false;
    }
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
    if (!normalized) {
      return false;
    }
    return (
      normalized === 'guest' ||
      normalized.startsWith('guest') ||
      normalized === 'ospite' ||
      normalized.startsWith('ospite') ||
      normalized === 'ospiti' ||
      normalized.startsWith('ospiti')
    );
  };
  const normalizedAvailableSidebarPaths = availableSidebarPaths.reduce<SidebarQuickPath[]>(
    (collection, entry) => {
      const pathId = typeof entry.id === 'string' ? entry.id.trim() : '';
      if (!pathId || collection.some((item) => item.id === pathId)) {
        return collection;
      }
      collection.push({
        ...entry,
        id: pathId,
      });
      return collection;
    },
    [],
  );
  const availableSidebarPathIds = normalizedAvailableSidebarPaths.map((entry) => entry.id);
  const resolveMemberUserId = (member: ProfileHouseMember) => {
    if (typeof member.userId === 'string' && member.userId.trim().length > 0) {
      const normalizedMemberUserId = member.userId.trim();
      if (
        normalizedMemberUserId === 'local_user' &&
        !member.isCurrent &&
        dashboardGuestUserId &&
        matchesGuestAlias(member.name)
      ) {
        return dashboardGuestUserId.trim();
      }
      return normalizedMemberUserId;
    }
    if (member.id.startsWith('user:')) {
      const normalizedFromId = member.id.slice('user:'.length).trim();
      if (
        normalizedFromId === 'local_user' &&
        !member.isCurrent &&
        dashboardGuestUserId &&
        matchesGuestAlias(member.name)
      ) {
        return dashboardGuestUserId.trim();
      }
      return normalizedFromId;
    }
    if (member.id.startsWith('person:')) {
      if (dashboardGuestUserId && matchesGuestAlias(member.name)) {
        return dashboardGuestUserId.trim();
      }
      if (matchesGuestAlias(member.name)) {
        return 'guest';
      }
      return member.id.trim();
    }
    if (dashboardGuestUserId && matchesGuestAlias(member.name)) {
      return dashboardGuestUserId.trim();
    }
    if (matchesGuestAlias(member.name)) {
      return 'guest';
    }
    return member.id.trim();
  };
  const resolveMemberTargetUserIds = (member: ProfileHouseMember) => {
    const primaryUserId = resolveMemberUserId(member);
    const targetUserIds: string[] = [];
    const append = (value: string | undefined | null) => {
      const normalized = typeof value === 'string' ? value.trim() : '';
      if (!normalized || targetUserIds.includes(normalized)) {
        return;
      }
      targetUserIds.push(normalized);
    };

    append(primaryUserId);
    if (matchesGuestAlias(member.name)) {
      append(dashboardGuestUserId);
      append('guest');
      append('local_user');
      if (member.id.startsWith('person:')) {
        append(member.id.trim());
      }
      if (typeof member.userId === 'string') {
        append(member.userId);
      }
    }
    return targetUserIds;
  };
  const resolveMemberLayoutState = (member: ProfileHouseMember) => {
    const memberUserId = resolveMemberUserId(member);
    const userConfig = memberUserId ? dashboardConfig?.users[memberUserId] : undefined;
    const memberDefaultLayoutId = userConfig?.default_layout ?? '';
    const isMirror =
      Boolean(creatorDefaultLayoutId) &&
      Boolean(memberDefaultLayoutId) &&
      memberUserId !== '' &&
      memberUserId !== normalizedCreatorUserId &&
      memberDefaultLayoutId === creatorDefaultLayoutId;
    const allowEdits = userConfig?.allow_edits ?? true;
    const allowedSidebarPathIds =
      Array.isArray(userConfig?.allowed_sidebar_paths) && userConfig.allowed_sidebar_paths.length > 0
        ? userConfig.allowed_sidebar_paths
            .map((pathId) => (typeof pathId === 'string' ? pathId.trim() : ''))
            .filter((pathId) => pathId.length > 0)
        : [];
    return {
      memberUserId,
      memberDefaultLayoutId,
      isMirror,
      allowEdits,
      allowedSidebarPathIds,
    };
  };
  const normalizedCurrentDashboardUserId =
    typeof dashboardCurrentUserId === 'string' ? dashboardCurrentUserId.trim() : '';
  const normalizedDashboardDeviceId =
    typeof dashboardDeviceId === 'string' ? dashboardDeviceId.trim() : '';
  const canManageCurrentDeviceLayout =
    enterpriseControlsEnabled &&
    normalizedCurrentDashboardUserId.length > 0 &&
    normalizedDashboardDeviceId.length > 0 &&
    Boolean(onRelinkCurrentDevice) &&
    Boolean(onUnlinkCurrentDevice);
  const movementDeviceCount = Math.max(0, Math.round(userOwnedDeviceCount ?? 0));
  const movementTimelineEntries = movementTimeline
    .slice()
    .sort((first, second) => second.timestampMs - first.timestampMs)
    .slice(0, 18);
  const movementMapPoints = movementPoints
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    .slice()
    .sort((first, second) => first.timestampMs - second.timestampMs)
    .slice(-18);
  const movementMapPlotPoints = (() => {
    if (!movementMapPoints.length) {
      return [] as Array<{ x: number; y: number; point: ProfileMovementMapPoint }>;
    }
    const latitudes = movementMapPoints.map((point) => point.latitude);
    const longitudes = movementMapPoints.map((point) => point.longitude);
    const minLatitude = Math.min(...latitudes);
    const maxLatitude = Math.max(...latitudes);
    const minLongitude = Math.min(...longitudes);
    const maxLongitude = Math.max(...longitudes);
    const latitudeRange = Math.max(0.000001, maxLatitude - minLatitude);
    const longitudeRange = Math.max(0.000001, maxLongitude - minLongitude);
    const padding = 10;

    return movementMapPoints.map((point, index) => {
      const x = padding + ((point.longitude - minLongitude) / longitudeRange) * (100 - padding * 2);
      const y = 100 - (padding + ((point.latitude - minLatitude) / latitudeRange) * (100 - padding * 2));
      const hasCollapsedAxis = latitudeRange <= 0.000001 || longitudeRange <= 0.000001;
      if (!hasCollapsedAxis) {
        return { x, y, point };
      }
      const fallbackStep = movementMapPoints.length <= 1 ? 0 : index / (movementMapPoints.length - 1);
      return {
        x: padding + fallbackStep * (100 - padding * 2),
        y: 50 + Math.sin(index * 0.9) * 18,
        point,
      };
    });
  })();
  const movementPolylinePoints = movementMapPlotPoints.map((entry) => `${entry.x},${entry.y}`).join(' ');
  const hasMovementData = movementTimelineEntries.length > 0 || movementMapPoints.length > 0;
  const selectedGuestLayout =
    GUEST_ACCESS_LAYOUT_PRESETS.find((layout) => layout.id === selectedGuestLayoutId) ??
    GUEST_ACCESS_LAYOUT_PRESETS[0];
  const guestAccessExpiresAtMs = parseDateTimeLocalInput(guestAccessExpiresAtInput);
  const isGuestAccessExpiryInvalid =
    guestAccessExpiresAtMs === null || guestAccessExpiresAtMs <= Date.now();
  const guestAccessUrl =
    selectedGuestLayout && guestAccessExpiresAtMs && !isGuestAccessExpiryInvalid
      ? buildGuestAccessUrl(
          selectedGuestLayout,
          guestAccessNonce,
          guestAccessIssuedAtMs,
          guestAccessExpiresAtMs,
          dashboardGuestUserId,
        )
      : '';
  const guestAccessExpiresLabel =
    guestAccessExpiresAtMs && !isGuestAccessExpiryInvalid
      ? new Date(guestAccessExpiresAtMs).toLocaleString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Data/Ora non valida';
  const normalizeError = (error: unknown) =>
    error instanceof Error ? error.message : 'Operazione non riuscita. Riprova.';

  const refreshGuestAccessQr = () => {
    const now = Date.now();
    setGuestAccessNonce(createGuestAccessNonce());
    setGuestAccessIssuedAtMs(now);
    if (!guestAccessExpiresAtMs || guestAccessExpiresAtMs <= now) {
      setGuestAccessExpiresAtInput(
        formatDateTimeLocalInput(now + GUEST_ACCESS_DEFAULT_VALIDITY_MINUTES * 60 * 1000),
      );
    }
    setGuestAccessCopyState('idle');
  };

  const handleOpenGuestAccessModal = () => {
    refreshGuestAccessQr();
    setIsGuestAccessModalOpen(true);
  };

  const handleCloseGuestAccessModal = () => {
    setIsGuestAccessModalOpen(false);
    setGuestAccessCopyState('idle');
  };

  const handleCopyGuestAccessUrl = async () => {
    if (!guestAccessUrl) {
      setGuestAccessCopyState('error');
      return;
    }
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard API non disponibile');
      }
      await navigator.clipboard.writeText(guestAccessUrl);
      setGuestAccessCopyState('done');
    } catch {
      setGuestAccessCopyState('error');
    }
  };

  const handleGuestAccessPrimaryAction = () => {
    setMembersInspectorMode('guest');
    if (isCompactViewport) {
      handleOpenGuestAccessModal();
      return;
    }
    refreshGuestAccessQr();
  };

  const handleMembersPrimaryAction = () => {
    setMembersInspectorMode('members');
    if (isCompactViewport) {
      setIsGuestAccessModalOpen(true);
    }
  };

  const handleShareDashboardPrimaryAction = () => {
    setMembersInspectorMode('share');
    if (isCompactViewport) {
      setIsGuestAccessModalOpen(true);
    }
  };

  const handleSelectMemberSource = (member: ProfileHouseMember, sourceMode: string) => {
    setMemberSourceSelectionById((current) => ({
      ...current,
      [member.id]: sourceMode,
    }));
    if (!sourceMode) {
      return;
    }
    const targetUserIds = resolveMemberTargetUserIds(member);
    const primaryTargetUserId = targetUserIds[0] ?? '';
    const { memberDefaultLayoutId } = resolveMemberLayoutState(member);
    if (!primaryTargetUserId || targetUserIds.length === 0) {
      setMemberActionFeedback({
        tone: 'error',
        text: 'Impossibile associare questo membro a un utente Home Assistant.',
      });
      return;
    }

    if (sourceMode === 'mirror') {
      if (!onMirrorLayout || !normalizedCreatorUserId) {
        setMemberActionFeedback({
          tone: 'error',
          text: 'Azione specchio non disponibile in questo contesto.',
        });
        return;
      }
      targetUserIds.forEach((targetUserId) => {
        onMirrorLayout(targetUserId, normalizedCreatorUserId);
      });
      setMemberSourceSelectionById((current) => ({ ...current, [member.id]: '' }));
      setMemberActionFeedback({
        tone: 'success',
        text: `Dashboard di ${member.name} sincronizzata con il Creatore.`,
      });
      return;
    }

    if (sourceMode === 'clone') {
      const sourceLayoutId = creatorDefaultLayoutId || memberDefaultLayoutId || dashboardCurrentLayoutId || '';
      if (!onCloneLayout || !sourceLayoutId) {
        setMemberActionFeedback({
          tone: 'error',
          text: 'Layout sorgente non disponibile per la copia.',
        });
        return;
      }
      targetUserIds.forEach((targetUserId) => {
        onCloneLayout(targetUserId, sourceLayoutId);
      });
      setMemberSourceSelectionById((current) => ({ ...current, [member.id]: '' }));
      setMemberActionFeedback({
        tone: 'success',
        text: `Dashboard indipendente creata per ${member.name}.`,
      });
      return;
    }

    if (sourceMode === 'empty') {
      if (!onCreateEmptyLayout) {
        setMemberActionFeedback({
          tone: 'error',
          text: 'Creazione layout vuoto non disponibile.',
        });
        return;
      }
      targetUserIds.forEach((targetUserId) => {
        onCreateEmptyLayout(targetUserId);
      });
      setMemberSourceSelectionById((current) => ({ ...current, [member.id]: '' }));
      setMemberActionFeedback({
        tone: 'success',
        text: `Dashboard vuota assegnata a ${member.name}.`,
      });
      return;
    }
  };

  const handleToggleMemberEditPermission = (member: ProfileHouseMember, allowEdits: boolean) => {
    const targetUserIds = resolveMemberTargetUserIds(member);
    if (targetUserIds.length === 0 || !onSetUserEditPermission) {
      return;
    }
    targetUserIds.forEach((targetUserId) => {
      onSetUserEditPermission(targetUserId, allowEdits);
    });
    setMemberActionFeedback({
      tone: 'success',
      text: allowEdits
        ? `Modifiche abilitate per ${member.name}.`
        : `Modifiche disabilitate per ${member.name}.`,
    });
  };

  const handleToggleMemberSidebarPathVisibility = (
    member: ProfileHouseMember,
    pathId: string,
    isVisible: boolean,
  ) => {
    if (!onSetUserVisibleSidebarPaths) {
      return;
    }
    const targetUserIds = resolveMemberTargetUserIds(member);
    const { allowedSidebarPathIds } = resolveMemberLayoutState(member);
    const normalizedPathId = pathId.trim();
    if (targetUserIds.length === 0 || !normalizedPathId) {
      return;
    }
    if (availableSidebarPathIds.length === 0) {
      setMemberActionFeedback({
        tone: 'error',
        text: 'Nessun percorso disponibile da assegnare.',
      });
      return;
    }
    if (!availableSidebarPathIds.includes(normalizedPathId)) {
      return;
    }

    const baseAllowedPathIds =
      allowedSidebarPathIds.length > 0
        ? allowedSidebarPathIds.filter((allowedPathId) => availableSidebarPathIds.includes(allowedPathId))
        : availableSidebarPathIds;
    const nextAllowedPathIdSet = new Set(baseAllowedPathIds);
    if (isVisible) {
      nextAllowedPathIdSet.add(normalizedPathId);
    } else {
      nextAllowedPathIdSet.delete(normalizedPathId);
    }
    const nextAllowedPathIds = availableSidebarPathIds.filter((allowedPathId) =>
      nextAllowedPathIdSet.has(allowedPathId),
    );
    if (nextAllowedPathIds.length === 0) {
      setMemberActionFeedback({
        tone: 'error',
        text: 'Ogni utente deve avere almeno una pagina visibile.',
      });
      return;
    }

    const shouldFallbackToAllVisible =
      nextAllowedPathIds.length === availableSidebarPathIds.length;
    const nextAllowedPathIdsToApply = shouldFallbackToAllVisible ? [] : nextAllowedPathIds;
    targetUserIds.forEach((targetUserId) => {
      onSetUserVisibleSidebarPaths(targetUserId, nextAllowedPathIdsToApply);
    });
    setMemberActionFeedback({
      tone: 'success',
      text: `Visibilita aggiornata per ${member.name}.`,
    });
  };

  const handleRelinkCurrentDeviceLayout = () => {
    if (!canManageCurrentDeviceLayout || !onRelinkCurrentDevice) {
      return;
    }
    onRelinkCurrentDevice(normalizedCurrentDashboardUserId, normalizedDashboardDeviceId);
    setMemberActionFeedback({
      tone: 'success',
      text: 'Questo schermo ora usa il layout principale.',
    });
  };

  const handleUnlinkCurrentDeviceLayout = () => {
    if (!canManageCurrentDeviceLayout || !onUnlinkCurrentDevice) {
      return;
    }
    onUnlinkCurrentDevice(normalizedCurrentDashboardUserId, normalizedDashboardDeviceId);
    setMemberActionFeedback({
      tone: 'success',
      text: 'Creato un layout dedicato per questo schermo.',
    });
  };

  const buildDashboardShareToken = () => {
    if (typeof window === 'undefined') {
      return '';
    }
    const payload = buildDashboardUserDataPayload(window.localStorage);
    const sharePayload: DashboardRoleSharePayload = {
      schema: DASHBOARD_SHARE_SCHEMA,
      version: DASHBOARD_SHARE_VERSION,
      roleKey: currentDashboardShareRoleKey,
      roleLabel: currentDashboardShareRoleLabel,
      createdAt: new Date().toISOString(),
      createdBy: desktopDisplayName,
      data: payload,
    };
    return JSON.stringify(sharePayload);
  };

  const handleDownloadDashboardShareToken = () => {
    if (typeof window === 'undefined') {
      return;
    }
    const token = buildDashboardShareToken();
    if (!token || token.trim().length === 0) {
      setDashboardShareFeedback({
        tone: 'error',
        text: 'Impossibile esportare il file di condivisione.',
      });
      return;
    }

    const safeTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `ha-dashboard-share-${currentDashboardShareRoleKey}-${safeTimestamp}.json`;
    const blob = new Blob([token], { type: 'application/json;charset=utf-8' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    setDashboardShareFeedback({
      tone: 'success',
      text: 'File JSON esportato.',
    });
  };

  const handleOpenDashboardShareImportFile = () => {
    dashboardShareImportInputRef.current?.click();
  };

  const handleDashboardShareImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const rawToken = await file.text();
      const trimmedToken = rawToken.trim();
      if (!trimmedToken) {
        setDashboardShareFeedback({
          tone: 'error',
          text: 'Il file selezionato e vuoto.',
        });
        return;
      }

      const parsedSharePayload = parseDashboardRoleSharePayload(trimmedToken);
      if (!parsedSharePayload) {
        setDashboardShareFeedback({ tone: 'error', text: 'File JSON non valido o corrotto.' });
        return;
      }
      if (parsedSharePayload.roleKey !== currentDashboardShareRoleKey) {
        setDashboardShareFeedback({
          tone: 'error',
          text: `Questo file e per ruolo ${parsedSharePayload.roleLabel}. Utente corrente: ${currentDashboardShareRoleLabel}.`,
        });
        return;
      }
      const parsedDashboardPayload = parseDashboardUserDataPayload(parsedSharePayload.data);
      if (!parsedDashboardPayload) {
        setDashboardShareFeedback({
          tone: 'error',
          text: 'Il file non contiene una configurazione dashboard valida.',
        });
        return;
      }
      const applyResult = applyDashboardUserDataPayload(parsedDashboardPayload, window.localStorage);
      if (!applyResult.changed) {
        setDashboardShareFeedback({ tone: 'success', text: 'Configurazione gia aggiornata.' });
        return;
      }
      setDashboardShareFeedback({
        tone: 'success',
        text: 'Configurazione applicata. Ricarico la dashboard...',
      });
      window.setTimeout(() => {
        window.location.reload();
      }, 320);
    } catch {
      setDashboardShareFeedback({
        tone: 'error',
        text: 'Impossibile leggere il file selezionato.',
      });
    }
  };

  const handleSectionSelect = (sectionId: ProfileSectionId) => {
    setActiveSection(sectionId);
    if (isCompactViewport) {
      setIsCompactDetailOpen(true);
    }
  };

  const handleStartOAuth = async () => {
    setHaActionError(null);
    try {
      await onStartOAuth();
    } catch (error) {
      setHaActionError(normalizeError(error));
    }
  };

  const handleDownloadBackup = () => {
    setConfigActionError(null);
    try {
      onDownloadBackup();
    } catch (error) {
      setConfigActionError(normalizeError(error));
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setConfigActionError(null);
    setIsConfigActionBusy(true);
    try {
      await onRestoreBackup(file);
    } catch (error) {
      setConfigActionError(normalizeError(error));
    } finally {
      setIsConfigActionBusy(false);
    }
  };

  const handleResetAll = async () => {
    setConfigActionError(null);
    setIsConfigActionBusy(true);
    try {
      await onResetAll();
    } catch (error) {
      setConfigActionError(normalizeError(error));
    } finally {
      setIsConfigActionBusy(false);
    }
  };

  const isLightTheme = theme === 'light';
  const panelShellClass =
    'border-[color:var(--profile-sheet-border)] bg-[var(--profile-sheet-bg)] text-[color:var(--profile-sheet-text)] shadow-[0_34px_100px_var(--profile-sheet-shadow)]';
  const avatarFrameClass =
    'border-[color:var(--profile-sheet-border-strong)] bg-[color:var(--profile-sheet-surface-strong)] shadow-[0_16px_30px_var(--profile-sheet-shadow)]';
  const eyebrowClass = 'text-[color:var(--profile-sheet-muted)]';
  const closeButtonClass =
    'border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-text)] shadow-[0_8px_20px_var(--profile-sheet-shadow)] hover:bg-[color:var(--profile-sheet-surface-strong)]';
  const menuSurfaceClass =
    'border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_16px_40px_var(--profile-sheet-shadow)]';
  const menuTitleClass = 'text-[color:var(--profile-sheet-muted)]';
  const menuActiveClass =
    'border-[color:rgb(var(--profile-sheet-accent-rgb)/0.54)] bg-[linear-gradient(135deg,rgb(var(--profile-sheet-accent-rgb)/0.32)_0%,rgb(var(--profile-sheet-accent-rgb-2)/0.2)_100%)] text-[color:var(--profile-sheet-title)] shadow-[0_12px_24px_var(--profile-sheet-shadow-soft)]';
  const menuInactiveClass =
    'border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface-soft)] text-[color:var(--profile-sheet-text)] hover:bg-[color:var(--profile-sheet-surface-strong)] hover:shadow-[0_10px_24px_var(--profile-sheet-shadow-soft)]';
  const menuHintActiveClass = 'text-[color:rgb(var(--profile-sheet-accent-rgb)/0.96)]';
  const menuHintInactiveClass = 'text-[color:var(--profile-sheet-muted)]';
  const sectionSurfaceClass =
    'border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_20px_46px_var(--profile-sheet-shadow)]';
  const sectionEyebrowClass = 'text-[color:var(--profile-sheet-muted)]';
  const subduedTextClass = 'text-[color:var(--profile-sheet-muted)]';
  const subtleTextClass = 'text-[color:var(--profile-sheet-muted)]';
  const inputClass =
    'w-full rounded-2xl border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface-strong)] px-3 py-3 pr-12 text-sm text-[color:var(--profile-sheet-text)] outline-none placeholder:text-[var(--profile-sheet-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] transition-all duration-200 focus:border-[color:rgb(var(--profile-sheet-accent-rgb)/0.62)] focus:ring-2 focus:ring-[rgb(var(--profile-sheet-accent-rgb)/0.26)]';
  const inputIconClass = 'text-[color:var(--profile-sheet-muted)]';
  const iconButtonClass = 'text-[color:var(--profile-sheet-muted)] hover:text-[color:var(--profile-sheet-text)]';
  const clearButtonClass = 'text-[color:var(--profile-sheet-muted)] hover:text-[color:var(--profile-sheet-text)]';
  const lightNeutralButtonClass =
    'border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface-strong)] text-[color:var(--profile-sheet-text)] shadow-[0_8px_18px_var(--profile-sheet-shadow)] hover:bg-[color:var(--profile-sheet-surface)]';
  const accentBlueButtonClass =
    'border-[color:rgb(var(--profile-sheet-accent-rgb)/0.55)] bg-[linear-gradient(140deg,rgb(var(--profile-sheet-accent-rgb)/0.34)_0%,rgb(var(--profile-sheet-accent-rgb-2)/0.24)_100%)] text-[color:var(--profile-sheet-title)] shadow-[0_12px_24px_var(--profile-sheet-shadow-soft)] hover:brightness-105';
  const accentEmeraldButtonClass = isLightTheme
    ? 'border-emerald-300/90 bg-[linear-gradient(140deg,rgba(167,243,208,0.9)_0%,rgba(220,252,231,0.88)_100%)] text-emerald-900 shadow-[0_10px_22px_rgba(5,150,105,0.2)] hover:brightness-105'
    : 'border-emerald-300/50 bg-[linear-gradient(140deg,rgba(16,185,129,0.32)_0%,rgba(52,211,153,0.24)_100%)] text-emerald-100 shadow-[0_12px_24px_rgba(5,150,105,0.32)] hover:brightness-110';
  const accentRoseButtonClass = isLightTheme
    ? 'border-rose-300/90 bg-[linear-gradient(140deg,rgba(254,205,211,0.92)_0%,rgba(255,228,230,0.9)_100%)] text-rose-900 shadow-[0_10px_22px_rgba(225,29,72,0.18)] hover:brightness-105'
    : 'border-rose-300/50 bg-[linear-gradient(140deg,rgba(225,29,72,0.3)_0%,rgba(251,113,133,0.22)_100%)] text-rose-100 shadow-[0_12px_24px_rgba(190,24,93,0.3)] hover:brightness-110';
  const infoCardClass =
    'rounded-2xl border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface-soft)] p-3 text-xs text-[color:var(--profile-sheet-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]';
  const errorTextClass = isLightTheme ? 'text-xs text-rose-700' : 'text-xs text-rose-200';
  const statusBadgeClass =
    haStatus === 'connected'
      ? isLightTheme
        ? 'border-emerald-300/85 bg-emerald-100/86 text-emerald-900 shadow-[0_8px_18px_rgba(5,150,105,0.18)]'
        : 'border-emerald-300/40 bg-emerald-500/22 text-emerald-100 shadow-[0_10px_22px_rgba(5,150,105,0.28)]'
      : haStatus === 'error'
        ? isLightTheme
          ? 'border-rose-300/85 bg-rose-100/86 text-rose-900 shadow-[0_8px_18px_rgba(190,24,93,0.16)]'
          : 'border-rose-300/40 bg-rose-500/22 text-rose-100 shadow-[0_10px_22px_rgba(190,24,93,0.3)]'
        : isLightTheme
          ? 'border-slate-300/85 bg-slate-100/86 text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.1)]'
          : 'border-white/18 bg-white/[0.08] text-white/70 shadow-[0_10px_22px_rgba(2,6,23,0.32)]';
  const buttonMotionClass =
    'transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:hover:translate-y-0';
  const touchMotionClass = 'transition-all duration-200 active:scale-[0.99]';
  const compactMenuIconClass =
    'flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-muted)]';
  const handleCompactPageBack = () => {
    if (showDetailOnCompact) {
      setIsCompactDetailOpen(false);
      return;
    }
    onClose();
  };
  const renderGuestAccessPanel = ({
    withCloseButton,
    qrSize,
  }: {
    withCloseButton: boolean;
    qrSize: number;
  }) => (
    <div className={`rounded-[1.6rem] border p-4 ${menuSurfaceClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.18em] ${sectionEyebrowClass}`}>Accessi Ospiti</p>
          <h4 className="mt-1 text-base font-semibold text-[color:var(--profile-sheet-title)]">
            Accessi Temporanei (Ospiti)
          </h4>
        </div>
        {withCloseButton ? (
          <button
            type="button"
            onClick={handleCloseGuestAccessModal}
            className={`flex h-9 w-9 items-center justify-center rounded-full ${touchMotionClass} ${closeButtonClass}`}
            aria-label="Chiudi modale ospiti"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      <div className={`mt-4 grid grid-cols-1 gap-2 ${withCloseButton ? 'sm:grid-cols-3' : ''}`}>
        {GUEST_ACCESS_LAYOUT_PRESETS.map((layout) => {
          const isSelected = selectedGuestLayout.id === layout.id;
          return (
            <button
              key={layout.id}
              type="button"
              onClick={() => {
                setSelectedGuestLayoutId(layout.id);
                refreshGuestAccessQr();
              }}
              className={`rounded-2xl border px-3 py-3 text-left ${buttonMotionClass} ${
                isSelected ? menuActiveClass : menuInactiveClass
              }`}
            >
              <p className="text-sm font-semibold">{layout.label}</p>
              <p className={`mt-1 text-[11px] ${isSelected ? menuHintActiveClass : menuHintInactiveClass}`}>
                {layout.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface-soft)] p-3">
        <label className="block">
          <span className={`text-xs uppercase tracking-[0.16em] ${subduedTextClass}`}>Scadenza accesso</span>
          <input
            type="datetime-local"
            value={guestAccessExpiresAtInput}
            onChange={(event) => {
              setGuestAccessExpiresAtInput(event.target.value);
              setGuestAccessCopyState('idle');
            }}
            className="mt-2 w-full rounded-xl border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface-strong)] px-3 py-2.5 text-sm text-[color:var(--profile-sheet-title)] outline-none focus:border-[color:rgb(var(--profile-sheet-accent-rgb)/0.62)] focus:ring-2 focus:ring-[rgb(var(--profile-sheet-accent-rgb)/0.26)]"
          />
        </label>
        {isGuestAccessExpiryInvalid ? (
          <p className="mt-2 text-xs text-rose-500">
            Inserisci data e ora futura per generare un QR valido.
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex justify-center">
        {guestAccessUrl ? (
          <div className="rounded-[1.6rem] bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
            <QRCodeSVG value={guestAccessUrl} size={qrSize} includeMargin level="M" />
          </div>
        ) : (
          <div className={`rounded-2xl border px-4 py-5 text-center text-xs ${subduedTextClass}`}>
            URL ospite non disponibile.
          </div>
        )}
      </div>

      <p className={`mt-3 text-center text-xs ${subduedTextClass}`}>
        Layout:{' '}
        <span className="font-semibold text-[color:var(--profile-sheet-title)]">
          {selectedGuestLayout.label}
        </span>{' '}
        | Valido fino alle{' '}
        <span className="font-semibold text-[color:var(--profile-sheet-title)]">{guestAccessExpiresLabel}</span>
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={refreshGuestAccessQr}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold ${buttonMotionClass} ${lightNeutralButtonClass}`}
        >
          Rigenera QR
        </button>
        <button
          type="button"
          onClick={handleCopyGuestAccessUrl}
          disabled={isGuestAccessExpiryInvalid}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55 ${buttonMotionClass} ${accentBlueButtonClass}`}
        >
          Copia Link
        </button>
      </div>

      <p className={`mt-2 text-center text-xs ${subduedTextClass}`}>
        {guestAccessCopyState === 'done'
          ? 'Link copiato negli appunti.'
          : guestAccessCopyState === 'error'
            ? 'Impossibile copiare il link su questo dispositivo.'
            : 'Inquadra il QR o copia il link diretto.'}
      </p>
      <p className={`mt-2 break-all text-[11px] ${menuTitleClass}`}>{guestAccessUrl}</p>
    </div>
  );
  const renderMembersAccessPanel = () => (
    <div className={`rounded-[1.6rem] border p-4 ${menuSurfaceClass}`}>
      <p className={`text-xs uppercase tracking-[0.18em] ${sectionEyebrowClass}`}>Members</p>
      <h4 className="mt-1 text-base font-semibold text-[color:var(--profile-sheet-title)]">
        Utenti e Ruoli
      </h4>
      <p className={`mt-1 text-[11px] ${subduedTextClass}`}>
        {canManageMemberLayouts
          ? 'Tocca un membro per gestire specchio/copia, permessi e pagine visibili.'
          : enterpriseControlsEnabled
            ? 'Servono privilegi Admin o Creatore per modificare i layout dei membri.'
            : 'Modalita multiutente temporaneamente disattivata.'}
      </p>
      {sortedHouseMembers.length > 0 ? (
        <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {sortedHouseMembers.map((member) => {
            const layoutState = resolveMemberLayoutState(member);
            const canConfigureMember = canManageMemberLayouts && layoutState.memberUserId.length > 0;
            const isExpanded = expandedMemberId === member.id && canConfigureMember;
            const sourceSelection = memberSourceSelectionById[member.id] ?? '';
            const memberAllowedSidebarPathIds = new Set(
              layoutState.allowedSidebarPathIds.length > 0
                ? layoutState.allowedSidebarPathIds
                : availableSidebarPathIds,
            );

            return (
              <div
                key={member.id}
                className={`overflow-hidden rounded-2xl border ${
                  member.isCurrent
                    ? 'border-[color:rgb(var(--profile-sheet-accent-rgb)/0.55)] bg-[color:rgb(var(--profile-sheet-accent-rgb)/0.16)]'
                    : 'border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface-soft)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!canConfigureMember) {
                      return;
                    }
                    setExpandedMemberId((current) => (current === member.id ? null : member.id));
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${
                    canConfigureMember ? buttonMotionClass : ''
                  }`}
                >
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={`Membro ${member.name}`}
                      className="h-10 w-10 rounded-full border-2 border-white/80 object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/80 bg-slate-300 text-xs font-semibold text-slate-700">
                      {member.name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part.charAt(0).toUpperCase())
                        .join('') || '?'}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[color:var(--profile-sheet-title)]">{member.name}</p>
                    <p className={`mt-0.5 text-[11px] ${subduedTextClass}`}>
                      {member.isCurrent ? 'Account corrente' : 'Utente registrato'}
                    </p>
                  </div>
                  <span className="rounded-full border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface-strong)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--profile-sheet-title)]">
                    {member.roleLabel?.trim() || 'Membro'}
                  </span>
                  {canConfigureMember ? (
                    <ChevronRight
                      size={15}
                      className={`ml-1 text-[color:var(--profile-sheet-muted)] transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  ) : null}
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[color:var(--profile-sheet-border)] px-3 pb-3 pt-3">
                        <label className="block">
                          <span className={`text-[11px] uppercase tracking-[0.14em] ${subduedTextClass}`}>
                            Sorgente Dashboard
                          </span>
                          <select
                            value={sourceSelection}
                            disabled={!onMirrorLayout || !onCloneLayout || !onCreateEmptyLayout}
                            onChange={(event) => handleSelectMemberSource(member, event.target.value)}
                            className="mt-2 w-full rounded-xl border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface-strong)] px-3 py-2 text-sm text-[color:var(--profile-sheet-title)] outline-none focus:border-[color:rgb(var(--profile-sheet-accent-rgb)/0.62)] focus:ring-2 focus:ring-[rgb(var(--profile-sheet-accent-rgb)/0.26)]"
                          >
                            <option value="">Seleziona modalita</option>
                            <option value="mirror">Sincronizza con Creatore (Specchio)</option>
                            <option value="clone">Dashboard Indipendente (Copia)</option>
                            <option value="empty">Dashboard Vuota</option>
                          </select>
                        </label>

                        <p className={`mt-2 text-[11px] ${menuTitleClass}`}>
                          Layout attuale:{' '}
                          <span className="font-semibold text-[color:var(--profile-sheet-title)]">
                            {layoutState.memberDefaultLayoutId || 'non assegnato'}
                          </span>
                        </p>
                        <p className={`mt-1 text-[10px] ${subduedTextClass}`}>
                          ID profilo interno: {layoutState.memberUserId || 'non rilevato'}
                        </p>

                        {!layoutState.isMirror ? (
                          <label className="mt-3 flex items-center justify-between rounded-xl border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] px-3 py-2.5">
                            <span className="text-sm font-medium text-[color:var(--profile-sheet-title)]">
                              Consenti Modifiche
                            </span>
                            <input
                              type="checkbox"
                              checked={layoutState.allowEdits}
                              disabled={!onSetUserEditPermission}
                              onChange={(event) =>
                                handleToggleMemberEditPermission(member, event.target.checked)
                              }
                              className={`h-4 w-4 rounded text-blue-500 focus:ring-blue-400/60 ${
                                isLightTheme ? 'border-slate-300 bg-white' : 'border-white/20 bg-white/10'
                              }`}
                            />
                          </label>
                        ) : (
                          <p className={`mt-3 text-[11px] ${subduedTextClass}`}>
                            Modalita specchio attiva: layout in sola lettura sincronizzata.
                          </p>
                        )}

                        <div className="mt-3 rounded-xl border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] px-3 py-2.5">
                          <p className="text-sm font-medium text-[color:var(--profile-sheet-title)]">
                            Pagine Visibili
                          </p>
                          {normalizedAvailableSidebarPaths.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {normalizedAvailableSidebarPaths.map((pathEntry) => (
                                <label
                                  key={`${member.id}-${pathEntry.id}`}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface-strong)] px-2.5 py-1.5"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm text-[color:var(--profile-sheet-title)]">
                                      {pathEntry.label}
                                    </p>
                                    <p className={`mt-0.5 truncate text-[10px] ${subduedTextClass}`}>
                                      {pathEntry.path}
                                    </p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={memberAllowedSidebarPathIds.has(pathEntry.id)}
                                    disabled={!onSetUserVisibleSidebarPaths}
                                    onChange={(event) =>
                                      handleToggleMemberSidebarPathVisibility(
                                        member,
                                        pathEntry.id,
                                        event.target.checked,
                                      )
                                    }
                                    className={`h-4 w-4 rounded text-blue-500 focus:ring-blue-400/60 ${
                                      isLightTheme ? 'border-slate-300 bg-white' : 'border-white/20 bg-white/10'
                                    }`}
                                  />
                                </label>
                              ))}
                            </div>
                          ) : (
                            <p className={`mt-2 text-[11px] ${subduedTextClass}`}>
                              Nessuna pagina rapida disponibile.
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`mt-4 rounded-2xl border px-4 py-5 text-center text-xs ${subduedTextClass}`}>
          Nessun utente disponibile.
        </div>
      )}
      {memberActionFeedback.text ? (
        <p className={`mt-3 text-xs ${memberActionFeedback.tone === 'error' ? 'text-rose-500' : subduedTextClass}`}>
          {memberActionFeedback.text}
        </p>
      ) : null}
    </div>
  );
  const renderDashboardSharePanel = ({ withCloseButton }: { withCloseButton: boolean }) => (
    <div className={`rounded-[1.6rem] border p-4 ${menuSurfaceClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.18em] ${sectionEyebrowClass}`}>Condividi Dashboard</p>
          <h4 className="mt-1 text-base font-semibold text-[color:var(--profile-sheet-title)]">
            Configurazione Totale
          </h4>
        </div>
        {withCloseButton ? (
          <button
            type="button"
            onClick={handleCloseGuestAccessModal}
            className={`flex h-9 w-9 items-center justify-center rounded-full ${touchMotionClass} ${closeButtonClass}`}
            aria-label="Chiudi condivisione dashboard"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      <p className={`mt-2 text-xs ${subduedTextClass}`}>
        Metodo consigliato: esporta un file JSON e importalo sugli altri dispositivi.
      </p>
      <p className={`mt-2 text-[11px] ${menuTitleClass}`}>
        Ruolo corrente: <span className="font-semibold text-[color:var(--profile-sheet-title)]">{currentDashboardShareRoleLabel}</span>
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleDownloadDashboardShareToken}
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${buttonMotionClass} ${accentBlueButtonClass}`}
        >
          Scarica JSON
        </button>
        <button
          type="button"
          onClick={handleOpenDashboardShareImportFile}
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${buttonMotionClass} ${lightNeutralButtonClass}`}
        >
          Importa da JSON
        </button>
        <input
          ref={dashboardShareImportInputRef}
          type="file"
          accept=".json,application/json,text/plain"
          className="hidden"
          onChange={handleDashboardShareImportFile}
        />
      </div>

      <div className={`mt-3 rounded-xl border px-3 py-2.5 text-[11px] ${menuTitleClass}`}>
        Importa da JSON applica automaticamente la configurazione e ricarica la dashboard.
      </div>

      {dashboardShareFeedback.text ? (
        <p className={`mt-3 text-xs ${dashboardShareFeedback.tone === 'error' ? 'text-rose-500' : subduedTextClass}`}>
          {dashboardShareFeedback.text}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[220] overflow-hidden">
      {!isCompactFullScreenPage ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute inset-0 bg-[color:var(--profile-sheet-overlay)] backdrop-blur-[6px]"
          aria-label="Chiudi profilo"
        />
      ) : null}
      <div
        className={
          isCompactFullScreenPage
            ? 'absolute inset-0'
            : 'pointer-events-none absolute inset-0 flex items-end justify-center px-0 sm:px-2 md:items-center md:px-5 lg:px-7'
        }
      >
        <div
          className={`pointer-events-auto relative isolate flex w-full flex-col overflow-hidden backdrop-blur-3xl ${panelShellClass} ${
            isCompactFullScreenPage
              ? 'h-full max-w-none rounded-none border-0 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+0.65rem)] sm:px-5'
              : 'h-[calc(100dvh-0.65rem)] max-w-[1180px] rounded-t-[2.6rem] rounded-b-none border px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 sm:px-7 sm:pt-4 md:h-[min(92dvh,820px)] md:rounded-[2.5rem] md:px-7 md:pb-6 md:pt-5'
          }`}
        >
          <div
            className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgb(var(--profile-sheet-accent-rgb) / 0.42) 0%, rgba(0, 0, 0, 0) 72%)',
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgb(var(--profile-sheet-accent-rgb-2) / 0.34) 0%, rgba(0, 0, 0, 0) 72%)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_26%)]" />

          {isCompactFullScreenPage ? (
            <div className="relative z-[1] mb-3 flex items-center gap-2 px-0.5 py-1">
              <button
                type="button"
                onClick={handleCompactPageBack}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--profile-sheet-text)] hover:bg-[color:rgb(var(--profile-sheet-accent-rgb)/0.14)] ${touchMotionClass}`}
                aria-label={showDetailOnCompact ? 'Torna al menu impostazioni' : 'Torna alla dashboard'}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="min-w-0">
                <p className={`text-[11px] uppercase tracking-[0.2em] ${menuTitleClass}`}>{compactPageHeaderSubtitle}</p>
                <p className="truncate text-sm font-semibold text-[color:var(--profile-sheet-title)]">{compactPageHeaderTitle}</p>
              </div>
            </div>
          ) : null}

          {!isCompactViewport ? (
            <div className="relative z-[1] mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 overflow-hidden rounded-full border ${avatarFrameClass}`}>
                  <img
                    src={profileAvatarSrc}
                    alt={userAvatarAlt ? `Profilo ${userAvatarAlt}` : 'Profilo utente'}
                    onError={() => setProfileAvatarSrc(DEFAULT_PROFILE_AVATAR_URL)}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-[clamp(1.02rem,1.5vw,1.38rem)] font-semibold tracking-[-0.012em] text-[color:var(--profile-sheet-title)]">
                    {desktopDisplayName}
                  </p>
                  <p className={`mt-1 flex flex-wrap items-center gap-2 text-sm ${eyebrowClass}`}>
                    <span className="max-w-[28rem] truncate">{desktopDisplayEmail}</span>
                    <span className="opacity-60">|</span>
                    <span className="font-semibold text-[color:var(--profile-sheet-text)]">{desktopDisplayRole}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`flex h-10 w-10 items-center justify-center rounded-full ${touchMotionClass} ${closeButtonClass}`}
                aria-label="Chiudi"
              >
                <X size={18} />
              </button>
            </div>
          ) : null}

        <div className="relative z-[1] grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 md:grid-cols-[17rem_minmax(0,1fr)] md:grid-rows-1 md:gap-5">
          <aside
            className={`rounded-[2rem] border p-4 sm:p-5 md:min-h-0 md:overflow-y-auto ${menuSurfaceClass} ${
              showMenuOnCompact
                ? 'block rounded-none border-transparent bg-transparent p-0 shadow-none backdrop-blur-none'
                : 'hidden md:block'
            }`}
          >
            {showMenuOnCompact ? (
              <>
                <div className="mb-4 flex flex-col items-center text-center">
                  <div className={`h-20 w-20 overflow-hidden rounded-full border ${avatarFrameClass}`}>
                    <img
                      src={profileAvatarSrc}
                      alt={userAvatarAlt ? `Profilo ${userAvatarAlt}` : 'Profilo utente'}
                      onError={() => setProfileAvatarSrc(DEFAULT_PROFILE_AVATAR_URL)}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="mt-3 text-[1.35rem] font-semibold tracking-[-0.01em] text-[color:var(--profile-sheet-title)]">
                    {compactDisplayName}
                  </p>
                  <p className={`mt-1 flex flex-wrap items-center justify-center gap-2 text-[0.78rem] ${subduedTextClass}`}>
                    <span className="max-w-[58vw] truncate">{compactDisplayEmail}</span>
                    <span className="opacity-60">|</span>
                    <span className="font-semibold">{compactDisplayRole}</span>
                  </p>
                </div>
                <p className={`text-[11px] uppercase tracking-[0.2em] ${menuTitleClass}`}>Impostazioni</p>
              </>
            ) : (
              <p className={`text-[11px] uppercase tracking-[0.2em] ${menuTitleClass}`}>
                {isCompactViewport ? 'Impostazioni' : 'Menu impostazioni'}
              </p>
            )}
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-1">
              {PROFILE_SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                const SectionIcon =
                  section.id === 'theme'
                    ? SunMedium
                    : section.id === 'movements'
                      ? Route
                      : section.id === 'members'
                        ? Users
                      : section.id === 'ha'
                        ? Link2
                        : RotateCcw;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleSectionSelect(section.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left ${buttonMotionClass} ${
                      isActive ? menuActiveClass : menuInactiveClass
                    } ${isCompactViewport ? 'flex items-center justify-between gap-3 px-3.5 py-3.5' : ''}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {isCompactViewport ? (
                        <span className={compactMenuIconClass}>
                          <SectionIcon size={14} />
                        </span>
                      ) : null}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{section.label}</p>
                        {!isCompactViewport ? (
                          <p className={`mt-0.5 text-xs ${isActive ? menuHintActiveClass : menuHintInactiveClass}`}>
                            {section.hint}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {isCompactViewport ? <ChevronRight size={16} className={subtleTextClass} /> : null}
                  </button>
                );
              })}
            </div>
          </aside>

          <div
            className={`min-h-0 overflow-y-auto pr-1 sm:pr-2 ${
              showDetailOnCompact ? 'block' : 'hidden md:block'
            }`}
          >
            {activeSection === 'theme' ? (
              <section className={`rounded-[2rem] border p-5 sm:p-6 ${sectionSurfaceClass}`}>
                <p className={`text-xs uppercase tracking-[0.18em] ${sectionEyebrowClass}`}>Tema</p>
                <h3 className="mt-2 text-lg font-semibold">Aspetto Home Premium</h3>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => onThemeChange('dark')}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${buttonMotionClass} ${
                      theme === 'dark' ? accentBlueButtonClass : menuInactiveClass
                    }`}
                  >
                    <Moon size={16} />
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => onThemeChange('light')}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${buttonMotionClass} ${
                      theme === 'light' ? accentBlueButtonClass : menuInactiveClass
                    }`}
                  >
                    <SunMedium size={16} />
                    Light
                  </button>
                </div>

                <div className="mt-6">
                  <p className={`text-xs uppercase tracking-[0.16em] ${sectionEyebrowClass}`}>Sfondi Blur</p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {DASHBOARD_WALLPAPER_PRESETS.map((preset) => {
                      const isSelected = wallpaper === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => onWallpaperChange(preset.id)}
                          className={`rounded-2xl border p-2 text-left ${buttonMotionClass} ${
                            isSelected
                              ? isLightTheme
                                ? 'border-blue-300 bg-blue-100 shadow-[0_0_0_1px_rgba(59,130,246,0.22)]'
                                : 'border-blue-300/45 bg-blue-500/16 shadow-[0_0_0_1px_rgba(147,197,253,0.28)]'
                              : menuInactiveClass
                          }`}
                        >
                          <div
                            className={`relative h-20 overflow-hidden rounded-xl border ${
                              isLightTheme ? 'border-slate-300/70' : 'border-white/10'
                            }`}
                          >
                            <div
                              className={`profile-wallpaper-thumb absolute inset-[-16%] ${WALLPAPER_PREVIEW_CLASS_BY_ID[preset.id]}`}
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,16,0.16)_0%,rgba(8,10,16,0.44)_100%)]" />
                          </div>
                          <p className={`mt-2 text-sm font-semibold ${isLightTheme ? 'text-slate-800' : 'text-white/90'}`}>
                            {preset.label}
                          </p>
                          <p className={`text-xs ${subduedTextClass}`}>{preset.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className={`mt-5 text-xs ${subduedTextClass}`}>
                  Le preferenze tema e sfondo vengono salvate localmente e mantengono il look premium in stile Apple Home.
                </p>
              </section>
            ) : null}

            {activeSection === 'movements' ? (
              <section className={`rounded-[2rem] border p-5 sm:p-6 ${sectionSurfaceClass}`}>
                <p className={`text-xs uppercase tracking-[0.18em] ${sectionEyebrowClass}`}>Spostamenti</p>
                <h3 className="mt-2 text-lg font-semibold">Timeline e Mappa Utente</h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className={`rounded-2xl border px-4 py-3 ${menuSurfaceClass}`}>
                    <p className={`text-[11px] uppercase tracking-[0.18em] ${menuTitleClass}`}>Dispositivi utente</p>
                    <div className="mt-2 flex items-end gap-2">
                      <Smartphone size={16} className={subtleTextClass} />
                      <p className="text-2xl font-semibold leading-none text-[color:var(--profile-sheet-title)]">
                        {movementDeviceCount}
                      </p>
                    </div>
                  </div>
                  <div className={`rounded-2xl border px-4 py-3 ${menuSurfaceClass}`}>
                    <p className={`text-[11px] uppercase tracking-[0.18em] ${menuTitleClass}`}>Ultimo aggiornamento</p>
                    <p className="mt-2 text-sm font-medium text-[color:var(--profile-sheet-title)]">
                      {movementUpdatedLabel?.trim() || 'In attesa dati'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <div className={`rounded-2xl border p-3 ${menuSurfaceClass}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-[color:var(--profile-sheet-title)]">Mappa spostamenti</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${menuInactiveClass}`}>
                        {movementMapPoints.length} tappe
                      </span>
                    </div>
                    <div className="relative h-44 overflow-hidden rounded-xl border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface-soft)] sm:h-52">
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.16),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_100%)]" />
                      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:28px_28px]" />
                      {movementMapPlotPoints.length > 0 ? (
                        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                          {movementMapPlotPoints.length > 1 ? (
                            <polyline
                              points={movementPolylinePoints}
                              fill="none"
                              stroke="rgb(var(--profile-sheet-accent-rgb))"
                              strokeOpacity="0.72"
                              strokeWidth="1.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ) : null}
                          {movementMapPlotPoints.map((entry) => (
                            <g key={entry.point.id}>
                              <circle
                                cx={entry.x}
                                cy={entry.y}
                                r={entry.point.isCurrent ? 2.4 : 1.7}
                                fill="rgb(var(--profile-sheet-accent-rgb-2))"
                                fillOpacity={entry.point.isCurrent ? 1 : 0.86}
                              />
                              {entry.point.isCurrent ? (
                                <circle
                                  cx={entry.x}
                                  cy={entry.y}
                                  r={4.3}
                                  fill="none"
                                  stroke="rgb(var(--profile-sheet-accent-rgb-2))"
                                  strokeOpacity="0.42"
                                  strokeWidth="1.2"
                                />
                              ) : null}
                            </g>
                          ))}
                        </svg>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center">
                          <MapPin size={18} className={subtleTextClass} />
                          <p className={`text-xs ${subduedTextClass}`}>Nessuna coordinata disponibile per la mappa.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`rounded-2xl border p-3 ${menuSurfaceClass}`}>
                    <p className="mb-2 text-sm font-semibold text-[color:var(--profile-sheet-title)]">Timeline spostamenti</p>
                    {movementTimelineEntries.length > 0 ? (
                      <div className="max-h-56 space-y-2 overflow-y-auto pr-1 sm:max-h-[20rem]">
                        {movementTimelineEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className={`rounded-xl border px-3 py-2 ${
                              entry.isCurrent
                                ? 'border-[color:rgb(var(--profile-sheet-accent-rgb)/0.55)] bg-[color:rgb(var(--profile-sheet-accent-rgb)/0.18)]'
                                : 'border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface-soft)]'
                            }`}
                          >
                            <p className="text-sm font-semibold text-[color:var(--profile-sheet-title)]">{entry.title}</p>
                            {entry.subtitle ? <p className={`mt-0.5 text-xs ${subduedTextClass}`}>{entry.subtitle}</p> : null}
                            <p className={`mt-1 text-[11px] ${menuTitleClass}`}>{entry.timestampLabel}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`rounded-xl border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface-soft)] px-3 py-6 text-center text-xs ${subduedTextClass}`}>
                        Nessun evento di spostamento disponibile per questo utente.
                      </div>
                    )}
                  </div>
                </div>

                {!hasMovementData ? (
                  <p className={`mt-4 text-xs ${subtleTextClass}`}>
                    Apri Home Assistant su dispositivi con tracciamento posizione attivo per vedere timeline e percorso.
                  </p>
                ) : null}
              </section>
            ) : null}

            {activeSection === 'members' ? (
              <section className={`rounded-[2rem] border p-5 sm:p-6 ${sectionSurfaceClass}`}>
                <p className={`text-xs uppercase tracking-[0.18em] ${sectionEyebrowClass}`}>Persone</p>
                <h3 className="mt-2 text-lg font-semibold">Membri casa connessa</h3>
                <p className={`mt-3 text-xs ${subduedTextClass}`}>
                  Persone attualmente registrate in Home Assistant.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] md:items-start">
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={handleMembersPrimaryAction}
                      className={`w-full rounded-[1.6rem] border px-4 py-3.5 ${
                        membersInspectorMode === 'members'
                          ? 'border-[color:rgb(var(--profile-sheet-accent-rgb)/0.55)] bg-[linear-gradient(135deg,rgb(var(--profile-sheet-accent-rgb)/0.3)_0%,rgb(var(--profile-sheet-accent-rgb-2)/0.2)_100%)]'
                          : isLightTheme
                            ? 'border-slate-300/80 bg-slate-200/70'
                            : 'border-white/14 bg-white/[0.09]'
                      } text-left ${buttonMotionClass}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-semibold text-[color:var(--profile-sheet-title)]">Members</p>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-[color:var(--profile-sheet-title)]">
                          <Plus size={15} />
                        </span>
                      </div>

                      {visibleHouseMembers.length > 0 ? (
                        <div className="mt-4 flex items-center">
                          {visibleHouseMembers.map((member, index) => (
                            <div
                              key={member.id}
                              className={`relative ${index === 0 ? '' : '-ml-2'}`}
                              title={member.name}
                            >
                              {member.avatarUrl ? (
                                <img
                                  src={member.avatarUrl}
                                  alt={`Membro ${member.name}`}
                                  className="h-9 w-9 rounded-full border-2 border-white/80 object-cover"
                                />
                              ) : (
                                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 bg-slate-300 text-[11px] font-semibold text-slate-700">
                                  {member.name
                                    .split(/\s+/)
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((part) => part.charAt(0).toUpperCase())
                                    .join('') || '?'}
                                </span>
                              )}
                              {member.isCurrent ? (
                                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white/90 bg-emerald-400" />
                              ) : null}
                            </div>
                          ))}
                          {hiddenHouseMembersCount > 0 ? (
                            <span className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 bg-white/70 text-[11px] font-semibold text-slate-700">
                              +{hiddenHouseMembersCount}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-4 text-xs text-[color:var(--profile-sheet-muted)]">
                          Nessun membro disponibile.
                        </p>
                      )}
                    </button>

                    <div
                      className={`rounded-[1.6rem] border p-4 ${menuSurfaceClass} ${
                        membersInspectorMode === 'guest'
                          ? 'border-[color:rgb(var(--profile-sheet-accent-rgb)/0.55)] shadow-[0_12px_24px_var(--profile-sheet-shadow-soft)]'
                          : ''
                      }`}
                    >
                      <p className="text-sm font-semibold text-[color:var(--profile-sheet-title)]">
                        Accessi Temporanei (Ospiti)
                      </p>
                      <p className={`mt-1 text-xs ${subduedTextClass}`}>
                        Crea un QR istantaneo per condividere un layout dedicato agli ospiti.
                      </p>
                      <button
                        type="button"
                        onClick={handleGuestAccessPrimaryAction}
                        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-base font-semibold ${buttonMotionClass} ${accentBlueButtonClass}`}
                      >
                        <QrCode size={20} />
                        {isCompactViewport ? 'Genera QR Ospiti' : 'Aggiorna QR Ospiti'}
                      </button>
                    </div>

                    <div
                      className={`rounded-[1.6rem] border p-4 ${menuSurfaceClass} ${
                        membersInspectorMode === 'share'
                          ? 'border-[color:rgb(var(--profile-sheet-accent-rgb)/0.55)] shadow-[0_12px_24px_var(--profile-sheet-shadow-soft)]'
                          : ''
                      }`}
                    >
                      <p className="text-sm font-semibold text-[color:var(--profile-sheet-title)]">
                        Condividi Dashboard
                      </p>
                      <p className={`mt-1 text-xs ${subduedTextClass}`}>
                        Esporta/importa la configurazione completa tramite file JSON.
                      </p>
                      <button
                        type="button"
                        onClick={handleShareDashboardPrimaryAction}
                        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-base font-semibold ${buttonMotionClass} ${accentBlueButtonClass}`}
                      >
                        <Users size={20} />
                        Apri Condivisione
                      </button>
                    </div>
                  </div>

                  <div className="hidden md:block md:sticky md:top-0">
                    {membersInspectorMode === 'members'
                      ? renderMembersAccessPanel()
                      : membersInspectorMode === 'share'
                        ? renderDashboardSharePanel({ withCloseButton: false })
                        : renderGuestAccessPanel({ withCloseButton: false, qrSize: 280 })}
                  </div>
                </div>
              </section>
            ) : null}

            {activeSection === 'ha' ? (
              <section className={`rounded-[2rem] border p-5 sm:p-6 ${sectionSurfaceClass}`}>
                <p className={`text-xs uppercase tracking-[0.18em] ${sectionEyebrowClass}`}>Home Assistant</p>
                <h3 className="mt-2 text-lg font-semibold">Connessione HA Live</h3>
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className={`text-xs uppercase tracking-[0.16em] ${subduedTextClass}`}>URL</span>
                    <div className="relative mt-2">
                      <input
                        value={haUrl}
                        onChange={(event) => onUrlChange(event.target.value)}
                        placeholder="http://homeassistant.local:8123"
                        disabled={isManagedByParent}
                        className={inputClass}
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${inputIconClass}`}>
                        <Link2 size={16} />
                      </span>
                    </div>
                  </label>
                  <label className="block">
                    <span className={`text-xs uppercase tracking-[0.16em] ${subduedTextClass}`}>Token</span>
                    <div className="relative mt-2">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={haToken}
                        onChange={(event) => onTokenChange(event.target.value)}
                        placeholder="Incolla il token di Home Assistant"
                        disabled={isManagedByParent}
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken((prev) => !prev)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${touchMotionClass} ${iconButtonClass}`}
                        aria-label={showToken ? 'Nascondi token' : 'Mostra token'}
                      >
                        {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>
                  <div className="flex items-center justify-between gap-3">
                    <label className={`inline-flex items-center gap-2 text-xs ${isLightTheme ? 'text-slate-600' : 'text-white/60'}`}>
                      <input
                        type="checkbox"
                        checked={haRememberToken}
                        onChange={(event) => onRememberTokenChange(event.target.checked)}
                        disabled={isManagedByParent}
                        className={`h-4 w-4 rounded text-blue-500 focus:ring-blue-400/60 ${
                          isLightTheme ? 'border-slate-300 bg-white' : 'border-white/20 bg-white/10'
                        }`}
                      />
                      Ricorda token
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        onTokenChange('');
                        onRememberTokenChange(false);
                      }}
                      disabled={isManagedByParent}
                      className={`text-xs uppercase tracking-[0.18em] ${buttonMotionClass} ${clearButtonClass}`}
                    >
                      Clear
                    </button>
                  </div>
                  {isManagedByParent ? (
                    <div className={infoCardClass}>
                      Connessione live gestita automaticamente dal pannello Home Assistant (iframe).
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleStartOAuth}
                        disabled={isOAuthBusy || !canStartOAuth}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass} ${accentEmeraldButtonClass}`}
                      >
                        <KeyRound size={16} />
                        {isOAuthBusy ? 'OAuth...' : 'Accedi con OAuth'}
                      </button>
                      {isConnected ? (
                        <button
                          type="button"
                          onClick={onDisconnect}
                          className={`rounded-xl border px-4 py-2 text-sm font-semibold ${buttonMotionClass} ${accentRoseButtonClass}`}
                        >
                          Disconnetti
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onConnect}
                          disabled={isConnecting || !canConnect}
                          className={`rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass} ${accentBlueButtonClass}`}
                        >
                          {isConnecting ? 'Connessione...' : 'Connetti'}
                        </button>
                      )}
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${statusBadgeClass}`}
                      >
                        HA {haStatus}
                      </span>
                    </div>
                  )}
                  {isManagedByParent ? (
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${statusBadgeClass}`}
                    >
                      HA {haStatus}
                    </span>
                  ) : null}
                  {haErrorMessage ? <p className={errorTextClass}>{haErrorMessage}</p> : null}
                  {isManagedByParent ? null : (
                    <p className={`text-xs ${subtleTextClass}`}>
                      OAuth e il metodo consigliato: evita token long-lived copiati manualmente.
                    </p>
                  )}
                  {isManagedByParent ? null : haRememberToken ? (
                    <div className={infoCardClass}>
                      Il token viene salvato in localStorage. Usa Clear se non vuoi conservarlo.
                    </div>
                  ) : (
                    <p className={`text-xs ${subtleTextClass}`}>
                      Il token non viene salvato. Dovrai reinserirlo al prossimo accesso.
                    </p>
                  )}
                </div>
              </section>
            ) : null}

            {activeSection === 'config' ? (
              <section className={`rounded-[2rem] border p-5 sm:p-6 ${sectionSurfaceClass}`}>
                <p className={`text-xs uppercase tracking-[0.18em] ${sectionEyebrowClass}`}>Configurazione</p>
                <h3 className="mt-2 text-lg font-semibold">Backup, Ripristino e Reset</h3>
                <p className={`mt-3 text-xs ${subduedTextClass}`}>
                  Esporta la configurazione corrente in JSON, ripristinala da file o azzera tutto. Dopo
                  ripristino/reset la pagina viene ricaricata.
                </p>
                {enterpriseControlsEnabled ? (
                  <>
                    <div
                      className={`mt-4 rounded-2xl border px-4 py-3 ${
                        isLightTheme ? 'border-slate-300/80 bg-slate-100/70' : 'border-white/10 bg-white/[0.04]'
                      }`}
                    >
                      <p className={`text-[11px] ${menuTitleClass}`}>
                        ID Dispositivo:{' '}
                        <span className="font-semibold text-[color:var(--profile-sheet-title)]">
                          {normalizedDashboardDeviceId || 'non disponibile'}
                        </span>
                      </p>
                      <p className={`mt-1 text-[11px] ${menuTitleClass}`}>
                        Storage Config:{' '}
                        <span className="font-semibold text-[color:var(--profile-sheet-title)]">
                          {dashboardConfigSyncMode === 'shared'
                            ? 'Condiviso HA'
                            : dashboardConfigSyncMode === 'user_data'
                              ? 'Per-account (fallback)'
                              : 'Rilevamento...'}
                        </span>
                      </p>
                      {dashboardCurrentLayoutId ? (
                        <p className={`mt-1 text-[11px] ${menuTitleClass}`}>
                          Layout corrente:{' '}
                          <span className="font-semibold text-[color:var(--profile-sheet-title)]">
                            {dashboardCurrentLayoutId}
                          </span>{' '}
                          {dashboardCurrentLayoutSource ? `(${dashboardCurrentLayoutSource})` : ''}
                        </p>
                      ) : null}
                    </div>
                    <div className={`mt-4 rounded-2xl border px-4 py-4 ${menuSurfaceClass}`}>
                      <p className="text-sm font-semibold text-[color:var(--profile-sheet-title)]">Gestione Schermo</p>
                      <p className={`mt-1 text-xs ${subduedTextClass}`}>
                        Scegli se questo display usa il layout condiviso oppure un layout dedicato locale.
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={handleRelinkCurrentDeviceLayout}
                          disabled={!canManageCurrentDeviceLayout || isConfigActionBusy}
                          className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass} ${
                            !isCurrentDeviceDetached ? accentBlueButtonClass : lightNeutralButtonClass
                          }`}
                        >
                          Usa Layout Principale (Responsivo)
                        </button>
                        <button
                          type="button"
                          onClick={handleUnlinkCurrentDeviceLayout}
                          disabled={!canManageCurrentDeviceLayout || isConfigActionBusy}
                          className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass} ${
                            isCurrentDeviceDetached ? accentBlueButtonClass : lightNeutralButtonClass
                          }`}
                        >
                          Sgancia Dispositivo (Layout Dedicato)
                        </button>
                      </div>
                      {dashboardCurrentUserIsMirror ? (
                        <p className={`mt-2 text-[11px] ${subduedTextClass}`}>
                          Layout corrente in modalita specchio: sola lettura sincronizzata.
                        </p>
                      ) : null}
                      {memberActionFeedback.text ? (
                        <p className={`mt-2 text-[11px] ${memberActionFeedback.tone === 'error' ? 'text-rose-500' : subduedTextClass}`}>
                          {memberActionFeedback.text}
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : null}
                <div
                  className={`mt-5 rounded-2xl border px-4 py-3 ${
                    isLightTheme ? 'border-slate-300/80 bg-slate-100/70' : 'border-white/10 bg-white/[0.04]'
                  }`}
                >
                  <label
                    className={`inline-flex items-center gap-2 text-xs ${isLightTheme ? 'text-slate-600' : 'text-white/70'}`}
                  >
                    <input
                      type="checkbox"
                      checked={developerMode}
                      onChange={(event) => onDeveloperModeChange(event.target.checked)}
                      className={`h-4 w-4 rounded text-blue-500 focus:ring-blue-400/60 ${
                        isLightTheme ? 'border-slate-300 bg-white' : 'border-white/20 bg-white/10'
                      }`}
                    />
                    Modalita sviluppatore
                  </label>
                  <p className={`mt-2 text-xs ${subtleTextClass}`}>
                    Mostra nel canvas debug colonne e righe.
                  </p>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    disabled={isConfigActionBusy}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass} ${lightNeutralButtonClass}`}
                  >
                    <Download size={16} />
                    Scarica Backup
                  </button>
                  <button
                    type="button"
                    onClick={() => restoreInputRef.current?.click()}
                    disabled={isConfigActionBusy}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass} ${accentBlueButtonClass}`}
                  >
                    <Upload size={16} />
                    Ripristina da File
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAll}
                    disabled={isConfigActionBusy}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass} ${accentRoseButtonClass}`}
                  >
                    <RotateCcw size={16} />
                    Reset Totale
                  </button>
                </div>
                <input
                  ref={restoreInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleRestoreBackup}
                />
                {configActionError ? (
                  <p className={`mt-3 ${errorTextClass}`}>{configActionError}</p>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>

        {isCompactViewport && isGuestAccessModalOpen ? (
          <div className="absolute inset-0 z-[8] flex items-center justify-center p-3 sm:p-6">
            <button
              type="button"
              onClick={handleCloseGuestAccessModal}
              className="absolute inset-0 bg-black/55 backdrop-blur-[5px]"
              aria-label="Chiudi accessi ospiti"
            />
            <div
              className={`relative w-full max-w-[560px] rounded-[2rem] border p-5 sm:p-6 ${
                isLightTheme
                  ? 'border-slate-300/95 bg-slate-100 text-slate-900 shadow-[0_35px_90px_rgba(15,23,42,0.28)]'
                  : 'border-slate-700/95 bg-slate-900 text-slate-100 shadow-[0_35px_90px_rgba(2,6,23,0.82)]'
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              {membersInspectorMode === 'members'
                ? renderMembersAccessPanel()
                : membersInspectorMode === 'share'
                  ? renderDashboardSharePanel({ withCloseButton: true })
                  : renderGuestAccessPanel({ withCloseButton: true, qrSize: 230 })}
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}

