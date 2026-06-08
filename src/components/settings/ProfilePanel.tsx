import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Link2,
  MapPin,
  Moon,
  QrCode,
  RotateCcw,
  Route,
  Smartphone,
  ShieldCheck,
  SunMedium,
  Plus,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  DASHBOARD_WALLPAPER_PRESETS,
  type DashboardTheme,
  type DashboardThemeMode,
  type DashboardWallpaperPreset,
  type SidebarQuickPath,
} from '../../hooks/useProfileSettings';
import GlassDropdown from '../ui/GlassDropdown';
import type { HaConnectionStatus } from '../../hooks/useHaLiveConnection';
import { useDeviceAuth } from '../../hooks/useDeviceAuth';
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
  themeMode: DashboardThemeMode;
  onThemeChange: (theme: DashboardTheme) => void;
  onThemeModeChange: (themeMode: DashboardThemeMode) => void;
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

const MEMBER_DASHBOARD_SOURCE_OPTIONS = [
  { id: '', name: 'Seleziona modalita' },
  { id: 'mirror', name: 'Sincronizza con Creatore (Specchio)' },
  { id: 'clone', name: 'Dashboard Indipendente (Copia)' },
  { id: 'empty', name: 'Dashboard Vuota' },
];

export type ProfileSectionId = 'theme' | 'movements' | 'members' | 'security' | 'ha' | 'config';

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
  { id: 'security', label: 'Sicurezza', hint: 'Biometria globale' },
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
  themeMode,
  onThemeChange,
  onThemeModeChange,
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
  const [isSecurityBiometricAvailable, setIsSecurityBiometricAvailable] = useState(false);
  const [isSecurityBiometricBusy, setIsSecurityBiometricBusy] = useState(false);
  const [securityActionFeedback, setSecurityActionFeedback] = useState<{
    tone: 'idle' | 'success' | 'error';
    text: string;
  }>({ tone: 'idle', text: '' });
  const [profileAvatarSrc, setProfileAvatarSrc] = useState(userAvatarUrl ?? DEFAULT_PROFILE_AVATAR_URL);
  const [membersInspectorMode, setMembersInspectorMode] = useState<'overview' | 'members' | 'guest' | 'share'>('overview');
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
  const deviceAuth = useDeviceAuth({
    id: dashboardCurrentUserId ?? userEmail ?? userAvatarAlt ?? 'profile_user',
    name: userEmail ?? dashboardCurrentUserId ?? 'current_user',
    displayName: userAvatarAlt ?? userEmail ?? 'Utente Corrente',
  });

  useEffect(() => {
    if (!isOpen) {
      setShowToken(false);
      setHaActionError(null);
      setConfigActionError(null);
      setIsConfigActionBusy(false);
      setSecurityActionFeedback({ tone: 'idle', text: '' });
      setActiveSection('theme');
      setIsCompactDetailOpen(false);
      setMembersInspectorMode('overview');
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
        setMembersInspectorMode('overview');
      }
    }
    wasOpenRef.current = isOpen;
  }, [initialSection, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    const checkBiometricAvailability = async () => {
      const available = await deviceAuth.isBiometricAvailable();
      if (!cancelled) {
        setIsSecurityBiometricAvailable(available);
      }
    };
    void checkBiometricAvailability();
    return () => {
      cancelled = true;
    };
  }, [deviceAuth, isOpen]);

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
  const membersSubpageTitle =
    membersInspectorMode === 'members'
      ? 'Membri casa'
      : membersInspectorMode === 'guest'
        ? 'Accessi ospiti'
        : membersInspectorMode === 'share'
          ? 'Condivisione'
          : '';
  const compactPageHeaderTitle =
    showDetailOnCompact && activeSection === 'members' && membersSubpageTitle
      ? membersSubpageTitle
      : showDetailOnCompact
        ? activeSectionMeta.label
        : 'Profilo';
  const compactPageHeaderSubtitle =
    showDetailOnCompact && activeSection === 'members' && membersSubpageTitle
      ? 'Membri'
      : showDetailOnCompact
        ? 'Impostazioni'
        : 'Impostazioni account';
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
    refreshGuestAccessQr();
  };

  const handleMembersPrimaryAction = () => {
    setMembersInspectorMode('members');
  };

  const handleShareDashboardPrimaryAction = () => {
    setMembersInspectorMode('share');
    setDashboardShareFeedback({ tone: 'idle', text: '' });
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
    if (sectionId !== 'members') {
      setMembersInspectorMode('overview');
    }
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

  const handleVerifySecurityBiometric = async () => {
    if (!isSecurityBiometricAvailable) {
      setSecurityActionFeedback({
        tone: 'error',
        text: 'Biometria non disponibile su questo browser o dispositivo.',
      });
      return;
    }

    setIsSecurityBiometricBusy(true);
    setSecurityActionFeedback({ tone: 'idle', text: '' });
    const wasEnrolled = deviceAuth.isEnrolled;
    try {
      const verified = await deviceAuth.verifyOrEnroll('Profilo sicurezza');
      if (!verified) {
        setSecurityActionFeedback({
          tone: 'error',
          text: 'Autenticazione biometrica annullata o non riuscita.',
        });
        return;
      }
      setSecurityActionFeedback({
        tone: 'success',
        text: wasEnrolled
          ? 'Autenticazione dispositivo verificata. Sara usata automaticamente per le azioni sensibili.'
          : 'Passkey dispositivo creata. Da ora verra usata automaticamente per le azioni sensibili.',
      });
    } finally {
      setIsSecurityBiometricBusy(false);
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
  const sectionSurfaceClass = '';
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
    'rounded-2xl px-0 py-2 text-xs text-[color:var(--profile-sheet-muted)]';
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
    'btn-premium transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:hover:translate-y-0';
  const touchMotionClass = 'transition-all duration-200 active:scale-[0.99]';
  const sectionShellClass = `p-1 sm:p-2 ${sectionSurfaceClass}`;
  const flatEntryClass = 'rounded-2xl px-0 py-0';
  const flatEntryPaddedClass = 'rounded-2xl px-1 py-2 sm:px-0';
  const compactTwoColumnGridClass = 'grid grid-cols-2 gap-2 sm:gap-3';
  const compactThreeColumnGridClass = 'grid grid-cols-3 gap-2 sm:gap-3';
  const compactActionButtonClass =
    'min-h-[2.75rem] rounded-xl border px-2.5 py-2.5 text-xs font-semibold sm:min-h-0 sm:px-4 sm:py-3 sm:text-sm';
  const compactPillButtonClass =
    'rounded-xl border px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm';
  const compactMenuIconClass =
    'flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--profile-sheet-border)] bg-[color:var(--profile-sheet-surface)] text-[color:var(--profile-sheet-muted)]';
  const settingsGroupClass = isLightTheme
    ? 'overflow-hidden rounded-[1.45rem] bg-white/46 backdrop-blur-2xl'
    : 'overflow-hidden rounded-[1.45rem] bg-white/[0.085] backdrop-blur-2xl';
  const settingsRowClass =
    'flex min-h-[3.45rem] w-full items-center gap-3 px-3.5 py-3 text-left sm:px-4';
  const settingsDividerClass = isLightTheme ? 'border-t border-slate-200/45' : 'border-t border-white/10';
  const settingsIconClass = isLightTheme
    ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/55 text-slate-600'
    : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/74';
  const settingsTitleClass = 'text-sm font-medium text-[color:var(--profile-sheet-title)]';
  const settingsSubtitleClass = 'mt-0.5 text-[11px] leading-snug text-[color:var(--profile-sheet-muted)]';
  const handleCompactPageBack = () => {
    if (activeSection === 'members' && membersInspectorMode !== 'overview') {
      setMembersInspectorMode('overview');
      return;
    }
    if (showDetailOnCompact) {
      setIsCompactDetailOpen(false);
      return;
    }
    onClose();
  };
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
      className={`ios-glass-switch ${checked ? 'ios-glass-switch-on' : isLightTheme ? 'bg-white/20' : ''}`}
    >
      <span
        className={`ios-glass-switch-thumb ${
          checked ? 'translate-x-[1.25rem]' : 'translate-x-0'
        }`}
      />
    </button>
  );
  const renderSettingsIcon = (Icon: React.ComponentType<{ size?: number; className?: string }>) => (
    <span className={settingsIconClass}>
      <Icon size={16} />
    </span>
  );
  const renderGuestAccessPanel = ({
    withCloseButton,
    qrSize,
  }: {
    withCloseButton: boolean;
    qrSize: number;
  }) => (
    <div className="p-0">
      {withCloseButton ? (
        <div className="flex items-start justify-between gap-3">
          <h4 className="mt-1 text-base font-semibold text-[color:var(--profile-sheet-title)]">
            Accessi temporanei
          </h4>
          <button
            type="button"
            onClick={() => setMembersInspectorMode('overview')}
            className={`flex h-9 w-9 items-center justify-center rounded-full ${touchMotionClass} ${closeButtonClass}`}
            aria-label="Torna a Membri"
          >
            <X size={15} />
          </button>
        </div>
      ) : null}

      <div className={`mt-4 ${withCloseButton ? compactThreeColumnGridClass : 'grid grid-cols-1 gap-2'}`}>
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
              className={`rounded-2xl border px-2.5 py-3 text-left ${buttonMotionClass} ${
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

      <div className={`mt-4 ${flatEntryPaddedClass}`}>
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
          <div className="rounded-[1.6rem] bg-white p-4">
            <QRCodeSVG value={guestAccessUrl} size={qrSize} includeMargin level="M" />
          </div>
        ) : (
          <div className={`rounded-2xl px-4 py-5 text-center text-xs ${subduedTextClass}`}>
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

      <div className={`mt-3 ${compactTwoColumnGridClass}`}>
        <button
          type="button"
          onClick={refreshGuestAccessQr}
          className={`${compactPillButtonClass} ${buttonMotionClass} ${lightNeutralButtonClass}`}
        >
          Rigenera QR
        </button>
        <button
          type="button"
          onClick={handleCopyGuestAccessUrl}
          disabled={isGuestAccessExpiryInvalid}
          className={`${compactPillButtonClass} disabled:cursor-not-allowed disabled:opacity-55 ${buttonMotionClass} ${accentBlueButtonClass}`}
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
    <div className="p-0">
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
              <div key={member.id} className="overflow-hidden rounded-2xl">
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
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/80 bg-white/[0.08] text-xs font-semibold text-white shadow-lg backdrop-blur-xl">
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
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--profile-sheet-title)]">
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
                      <div className="px-3 pb-3 pt-2">
                        <label className="block">
                          <span className={`text-[11px] uppercase tracking-[0.14em] ${subduedTextClass}`}>
                            Sorgente Dashboard
                          </span>
                          <GlassDropdown
                            className="mt-2"
                            options={MEMBER_DASHBOARD_SOURCE_OPTIONS}
                            selected={
                              MEMBER_DASHBOARD_SOURCE_OPTIONS.find((option) => option.id === sourceSelection) ??
                              MEMBER_DASHBOARD_SOURCE_OPTIONS[0]
                            }
                            disabled={!onMirrorLayout || !onCloneLayout || !onCreateEmptyLayout}
                            onChange={(option) => handleSelectMemberSource(member, option.id)}
                          />
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
                          <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2.5">
                            <span className="text-sm font-medium text-[color:var(--profile-sheet-title)]">
                              Consenti Modifiche
                            </span>
                            {renderAppleSwitch({
                              checked: layoutState.allowEdits,
                              disabled: !onSetUserEditPermission,
                              label: `Consenti modifiche ${member.name}`,
                              onChange: (nextChecked) => handleToggleMemberEditPermission(member, nextChecked),
                            })}
                          </div>
                        ) : (
                          <p className={`mt-3 text-[11px] ${subduedTextClass}`}>
                            Modalita specchio attiva: layout in sola lettura sincronizzata.
                          </p>
                        )}

                        <div className="mt-3 rounded-xl px-3 py-2.5">
                          <p className="text-sm font-medium text-[color:var(--profile-sheet-title)]">
                            Pagine Visibili
                          </p>
                          {normalizedAvailableSidebarPaths.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {normalizedAvailableSidebarPaths.map((pathEntry) => (
                                <div
                                  key={`${member.id}-${pathEntry.id}`}
                                  className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm text-[color:var(--profile-sheet-title)]">
                                      {pathEntry.label}
                                    </p>
                                    <p className={`mt-0.5 truncate text-[10px] ${subduedTextClass}`}>
                                      {pathEntry.path}
                                    </p>
                                  </div>
                                  {renderAppleSwitch({
                                    checked: memberAllowedSidebarPathIds.has(pathEntry.id),
                                    disabled: !onSetUserVisibleSidebarPaths,
                                    label: `Mostra ${pathEntry.label} per ${member.name}`,
                                    onChange: (nextChecked) =>
                                      handleToggleMemberSidebarPathVisibility(member, pathEntry.id, nextChecked),
                                  })}
                                </div>
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
        <div className={`mt-4 rounded-2xl px-4 py-5 text-center text-xs ${subduedTextClass}`}>
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
    <div className="p-0">
      {withCloseButton ? (
        <div className="flex items-start justify-between gap-3">
          <h4 className="mt-1 text-base font-semibold text-[color:var(--profile-sheet-title)]">
            Condivisione dashboard
          </h4>
          <button
            type="button"
            onClick={() => setMembersInspectorMode('overview')}
            className={`flex h-9 w-9 items-center justify-center rounded-full ${touchMotionClass} ${closeButtonClass}`}
            aria-label="Torna a Membri"
          >
            <X size={15} />
          </button>
        </div>
      ) : null}

      <p className={`mt-2 text-xs ${subduedTextClass}`}>
        Metodo consigliato: esporta un file JSON e importalo sugli altri dispositivi.
      </p>
      <p className={`mt-2 text-[11px] ${menuTitleClass}`}>
        Ruolo corrente: <span className="font-semibold text-[color:var(--profile-sheet-title)]">{currentDashboardShareRoleLabel}</span>
      </p>

      <div className={`mt-4 ${compactTwoColumnGridClass}`}>
        <button
          type="button"
          onClick={handleDownloadDashboardShareToken}
          className={`${compactActionButtonClass} ${buttonMotionClass} ${accentBlueButtonClass}`}
        >
          Scarica JSON
        </button>
        <button
          type="button"
          onClick={handleOpenDashboardShareImportFile}
          className={`${compactActionButtonClass} ${buttonMotionClass} ${lightNeutralButtonClass}`}
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

      <div className={`mt-3 rounded-xl px-3 py-2.5 text-[11px] ${menuTitleClass}`}>
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
                        : section.id === 'security'
                          ? ShieldCheck
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
            className={`min-h-0 overflow-y-auto pr-0 sm:pr-2 ${
              showDetailOnCompact ? 'block' : 'hidden md:block'
            }`}
          >
            {activeSection === 'theme' ? (
              <section className={sectionShellClass}>
                <h3 className="text-lg font-semibold">Colori</h3>

                <div className={`mt-5 ${settingsGroupClass}`}>
                  <div className="px-3.5 py-3 sm:px-4">
                    <div className="flex items-center gap-3">
                      {renderSettingsIcon(SunMedium)}
                    <div className="min-w-0 flex-1">
                        <p className={settingsTitleClass}>Modalita</p>
                        <p className={settingsSubtitleClass}>Scegli come applicare il tema della dashboard.</p>
                    </div>
                    </div>
                    <div
                      className={`mt-3 grid grid-cols-3 rounded-full p-1 ${
                        isLightTheme ? 'bg-white/50' : 'bg-white/10'
                      }`}
                    >
                      {[
                        { id: 'auto' as const, label: 'Auto' },
                        { id: 'light' as const, label: 'Light' },
                        { id: 'dark' as const, label: 'Dark' },
                      ].map((option) => {
                        const isSelected = themeMode === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => onThemeModeChange(option.id)}
                            className={`rounded-full px-3 py-2 text-xs font-semibold transition-all ${
                              isSelected
                                ? isLightTheme
                                  ? 'bg-white text-slate-900 shadow-[0_4px_14px_rgba(15,23,42,0.12)]'
                                  : 'bg-white/88 text-slate-950 shadow-[0_6px_18px_rgba(0,0,0,0.25)]'
                                : 'text-[color:var(--profile-sheet-muted)]'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className={`mt-4 ${settingsGroupClass}`}>
                    <div className="px-3.5 pt-3 sm:px-4">
                      <p className={settingsTitleClass}>Sfondo</p>
                    </div>
                    {DASHBOARD_WALLPAPER_PRESETS.map((preset) => {
                      const isSelected = wallpaper === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => onWallpaperChange(preset.id)}
                          className={`${settingsRowClass} ${buttonMotionClass}`}
                        >
                          <div
                            className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-lg ${
                              isLightTheme ? 'bg-slate-100' : 'bg-white/8'
                            }`}
                          >
                            <div
                              className={`profile-wallpaper-thumb absolute inset-[-16%] ${WALLPAPER_PREVIEW_CLASS_BY_ID[preset.id]}`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={settingsTitleClass}>{preset.label}</p>
                            <p className={settingsSubtitleClass}>{preset.description}</p>
                          </div>
                          <span
                            className={`text-sm font-semibold ${
                              isSelected
                                ? isLightTheme
                                  ? 'text-blue-600'
                                  : 'text-blue-300'
                                : subtleTextClass
                            }`}
                          >
                            {isSelected ? 'Attivo' : ''}
                          </span>
                        </button>
                      );
                    })}
                </div>

                <p className={`mt-5 text-xs ${subduedTextClass}`}>
                  Le preferenze tema e sfondo vengono salvate localmente e mantengono il look premium in stile Apple Home.
                </p>
              </section>
            ) : null}

            {activeSection === 'movements' ? (
              <section className={sectionShellClass}>
                <h3 className="text-lg font-semibold">Riepilogo</h3>

                <div className={`mt-5 ${settingsGroupClass}`}>
                  <div className={settingsRowClass}>
                    {renderSettingsIcon(Smartphone)}
                    <div className="min-w-0 flex-1">
                      <p className={settingsTitleClass}>Dispositivi utente</p>
                      <p className={settingsSubtitleClass}>Tracker posizione collegati.</p>
                    </div>
                    <span className="text-sm font-semibold text-[color:var(--profile-sheet-title)]">
                      {movementDeviceCount}
                    </span>
                  </div>
                  <div className={settingsDividerClass} />
                  <div className={settingsRowClass}>
                    {renderSettingsIcon(Route)}
                    <div className="min-w-0 flex-1">
                      <p className={settingsTitleClass}>Ultimo aggiornamento</p>
                    </div>
                    <span className="max-w-[45%] truncate text-right text-xs font-medium text-[color:var(--profile-sheet-muted)]">
                      {movementUpdatedLabel?.trim() || 'In attesa dati'}
                    </span>
                  </div>
                </div>

                <div className={`mt-4 ${settingsGroupClass}`}>
                  <div className="px-3.5 py-3 sm:px-4">
                    <div className="flex items-center gap-3">
                      {renderSettingsIcon(MapPin)}
                      <div className="min-w-0 flex-1">
                        <p className={settingsTitleClass}>Mappa spostamenti</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${menuTitleClass}`}>
                        {movementMapPoints.length} tappe
                      </span>
                    </div>
                    <div className="relative mt-3 h-44 overflow-hidden rounded-2xl sm:h-52">
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
                </div>

                <div className={`mt-4 ${settingsGroupClass}`}>
                  <div className="px-3.5 py-3 sm:px-4">
                    <p className={settingsTitleClass}>Timeline</p>
                    {movementTimelineEntries.length > 0 ? (
                      <div className="mt-2 max-h-56 overflow-y-auto sm:max-h-[20rem]">
                        {movementTimelineEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="py-2"
                          >
                            <p className="text-sm font-semibold text-[color:var(--profile-sheet-title)]">{entry.title}</p>
                            {entry.subtitle ? <p className={`mt-0.5 text-xs ${subduedTextClass}`}>{entry.subtitle}</p> : null}
                            <p className={`mt-1 text-[11px] ${menuTitleClass}`}>{entry.timestampLabel}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`rounded-xl px-3 py-6 text-center text-xs ${subduedTextClass}`}>
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
              <section className={sectionShellClass}>
                {membersInspectorMode === 'overview' ? (
                  <>
                    <h3 className="text-lg font-semibold">Membri</h3>
                    <p className={`mt-3 text-xs ${subduedTextClass}`}>
                      Persone attualmente registrate in Home Assistant.
                    </p>

                    <div className={`mt-5 ${settingsGroupClass}`}>
                      <button
                        type="button"
                        onClick={handleMembersPrimaryAction}
                        className={`${settingsRowClass} ${buttonMotionClass}`}
                      >
                        {renderSettingsIcon(Users)}
                        <div className="min-w-0 flex-1">
                          <p className={settingsTitleClass}>Membri</p>
                          <p className={settingsSubtitleClass}>
                            {visibleHouseMembers.length > 0
                              ? `${visibleHouseMembers.length} persone disponibili`
                              : 'Nessun membro disponibile'}
                          </p>
                        </div>
                        {visibleHouseMembers.length > 0 ? (
                          <div className="hidden items-center sm:flex">
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
                                    className="h-8 w-8 rounded-full border-2 border-white/80 object-cover"
                                  />
                                ) : (
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-white/[0.08] text-[10px] font-semibold text-white shadow-lg backdrop-blur-xl">
                                    {member.name
                                      .split(/\s+/)
                                      .filter(Boolean)
                                      .slice(0, 2)
                                      .map((part) => part.charAt(0).toUpperCase())
                                      .join('') || '?'}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <ChevronRight size={16} className={subtleTextClass} />
                      </button>
                      <div className={settingsDividerClass} />
                      <button
                        type="button"
                        onClick={handleGuestAccessPrimaryAction}
                        className={`${settingsRowClass} ${buttonMotionClass}`}
                      >
                        {renderSettingsIcon(QrCode)}
                        <div className="min-w-0 flex-1">
                          <p className={settingsTitleClass}>Accessi ospiti</p>
                          <p className={settingsSubtitleClass}>Genera QR o link temporaneo.</p>
                        </div>
                        <ChevronRight size={16} className={subtleTextClass} />
                      </button>
                      <div className={settingsDividerClass} />
                      <button
                        type="button"
                        onClick={handleShareDashboardPrimaryAction}
                        className={`${settingsRowClass} ${buttonMotionClass}`}
                      >
                        {renderSettingsIcon(Upload)}
                        <div className="min-w-0 flex-1">
                          <p className={settingsTitleClass}>Condividi dashboard</p>
                          <p className={settingsSubtitleClass}>Esporta o importa JSON.</p>
                        </div>
                        <ChevronRight size={16} className={subtleTextClass} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setMembersInspectorMode('overview')}
                      className={`mb-4 inline-flex items-center gap-2 text-sm font-semibold ${buttonMotionClass} ${clearButtonClass}`}
                    >
                      <ChevronLeft size={16} />
                      Membri
                    </button>
                    <h3 className="text-lg font-semibold">
                      {membersInspectorMode === 'members'
                        ? 'Membri casa'
                        : membersInspectorMode === 'share'
                          ? 'Condivisione dashboard'
                          : 'Accessi ospiti'}
                    </h3>
                    {membersInspectorMode === 'members'
                      ? renderMembersAccessPanel()
                      : membersInspectorMode === 'share'
                        ? renderDashboardSharePanel({ withCloseButton: false })
                        : renderGuestAccessPanel({ withCloseButton: false, qrSize: isCompactViewport ? 230 : 280 })}
                  </>
                )}
              </section>
            ) : null}

            {activeSection === 'security' ? (
              <section className={sectionShellClass}>
                <h3 className="text-lg font-semibold">Autenticazione</h3>
                <p className={`mt-3 text-xs ${subduedTextClass}`}>
                  La dashboard usa WebAuthn nativo del browser. Face ID, impronta o PIN di sistema vengono rilevati
                  dinamicamente per l'utente corrente.
                </p>

                <div className={`mt-5 ${settingsGroupClass}`}>
                  <div className={settingsRowClass}>
                    {renderSettingsIcon(Fingerprint)}
                    <div className="min-w-0 flex-1">
                      <p className={settingsTitleClass}>Biometria dispositivo</p>
                      <p className={settingsSubtitleClass}>
                        {isSecurityBiometricAvailable ? 'Supportata da questo browser' : 'Non disponibile'}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        isSecurityBiometricAvailable
                          ? isLightTheme
                            ? 'text-emerald-700'
                            : 'text-emerald-200'
                          : subtleTextClass
                      }`}
                    >
                      {isSecurityBiometricAvailable ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className={settingsDividerClass} />
                  <div className={settingsRowClass}>
                    {renderSettingsIcon(ShieldCheck)}
                    <div className="min-w-0 flex-1">
                      <p className={settingsTitleClass}>Modalita</p>
                      <p className={settingsSubtitleClass}>
                        {deviceAuth.isEnrolled
                          ? 'Passkey locale configurata per questo utente.'
                          : 'Crea una passkey locale prima di usare le azioni sensibili.'}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold ${subtleTextClass}`}>
                      {deviceAuth.isEnrolled ? 'Configurata' : 'Da creare'}
                    </span>
                  </div>
                </div>

                <div className={`mt-4 ${settingsGroupClass}`}>
                  <button
                    type="button"
                    onClick={() => void handleVerifySecurityBiometric()}
                    disabled={isSecurityBiometricBusy || !isSecurityBiometricAvailable}
                    className={`${settingsRowClass} disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass}`}
                  >
                    {renderSettingsIcon(Fingerprint)}
                    <div className="min-w-0 flex-1">
                      <p className={settingsTitleClass}>
                        {isSecurityBiometricBusy
                          ? deviceAuth.isEnrolled ? 'Verifica...' : 'Creazione...'
                          : deviceAuth.isEnrolled ? 'Verifica autenticazione dispositivo' : 'Crea passkey dispositivo'}
                      </p>
                      <p className={settingsSubtitleClass}>Avvia Face ID, impronta o PIN di sistema.</p>
                    </div>
                    <ChevronRight size={16} className={subtleTextClass} />
                  </button>
                </div>

                {!isSecurityBiometricAvailable ? (
                  <div className={`mt-4 ${infoCardClass}`}>
                    Se sei in sviluppo locale, usa localhost o HTTPS. Su browser non compatibili il riconoscimento
                    biometrico non puo essere avviato.
                  </div>
                ) : null}

                {securityActionFeedback.text ? (
                  <p
                    className={`mt-3 text-xs ${
                      securityActionFeedback.tone === 'error'
                        ? isLightTheme
                          ? 'text-rose-700'
                          : 'text-rose-200'
                        : isLightTheme
                          ? 'text-emerald-700'
                          : 'text-emerald-200'
                    }`}
                  >
                    {securityActionFeedback.text}
                  </p>
                ) : null}
              </section>
            ) : null}

            {activeSection === 'ha' ? (
              <section className={sectionShellClass}>
                <h3 className="text-lg font-semibold">Connessione</h3>
                <div className={`mt-5 ${settingsGroupClass}`}>
                  <label className={settingsRowClass}>
                    {renderSettingsIcon(Link2)}
                    <div className="min-w-0 flex-1">
                      <p className={settingsTitleClass}>URL</p>
                      <input
                        value={haUrl}
                        onChange={(event) => onUrlChange(event.target.value)}
                        placeholder="http://homeassistant.local:8123"
                        disabled={isManagedByParent}
                        className="mt-1 w-full bg-transparent text-sm text-[color:var(--profile-sheet-muted)] outline-none placeholder:text-[color:var(--profile-sheet-muted)]/70"
                      />
                    </div>
                  </label>
                  <div className={settingsDividerClass} />
                  <label className={settingsRowClass}>
                    {renderSettingsIcon(KeyRound)}
                    <div className="min-w-0 flex-1">
                      <p className={settingsTitleClass}>Token</p>
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={haToken}
                        onChange={(event) => onTokenChange(event.target.value)}
                        placeholder="Incolla il token di Home Assistant"
                        disabled={isManagedByParent}
                        className="mt-1 w-full bg-transparent text-sm text-[color:var(--profile-sheet-muted)] outline-none placeholder:text-[color:var(--profile-sheet-muted)]/70"
                      />
                    </div>
                      <button
                        type="button"
                        onClick={() => setShowToken((prev) => !prev)}
                      className={`${touchMotionClass} ${iconButtonClass}`}
                        aria-label={showToken ? 'Nascondi token' : 'Mostra token'}
                      >
                        {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                  </label>
                  <div className={settingsDividerClass} />
                  <div className={settingsRowClass}>
                    {renderSettingsIcon(Eye)}
                    <div className="min-w-0 flex-1">
                      <p className={settingsTitleClass}>Ricorda token</p>
                    </div>
                    {renderAppleSwitch({
                      checked: haRememberToken,
                      onChange: onRememberTokenChange,
                      disabled: isManagedByParent,
                      label: 'Ricorda token',
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        onTokenChange('');
                        onRememberTokenChange(false);
                      }}
                      disabled={isManagedByParent}
                      className={`text-xs font-semibold ${buttonMotionClass} ${clearButtonClass}`}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className={`mt-4 ${settingsGroupClass}`}>
                  {isManagedByParent ? (
                    <div className={settingsRowClass}>
                      {renderSettingsIcon(Link2)}
                      <p className={`text-xs ${subduedTextClass}`}>
                      Connessione live gestita automaticamente dal pannello Home Assistant (iframe).
                      </p>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleStartOAuth}
                        disabled={isOAuthBusy || !canStartOAuth}
                        className={`${settingsRowClass} disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass}`}
                      >
                        {renderSettingsIcon(KeyRound)}
                        <div className="min-w-0 flex-1">
                          <p className={settingsTitleClass}>{isOAuthBusy ? 'OAuth...' : 'Accedi con OAuth'}</p>
                        </div>
                        <ChevronRight size={16} className={subtleTextClass} />
                      </button>
                      <div className={settingsDividerClass} />
                      {isConnected ? (
                        <button
                          type="button"
                          onClick={onDisconnect}
                          className={`${settingsRowClass} ${buttonMotionClass}`}
                        >
                          {renderSettingsIcon(RotateCcw)}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-rose-500">Disconnetti</p>
                          </div>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onConnect}
                          disabled={isConnecting || !canConnect}
                          className={`${settingsRowClass} disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass}`}
                        >
                          {renderSettingsIcon(Link2)}
                          <div className="min-w-0 flex-1">
                            <p className={settingsTitleClass}>{isConnecting ? 'Connessione...' : 'Connetti'}</p>
                          </div>
                          <ChevronRight size={16} className={subtleTextClass} />
                        </button>
                      )}
                    </>
                  )}
                </div>
                <p className={`mt-3 text-xs ${subtleTextClass}`}>
                  Stato HA: {haStatus}. OAuth e il metodo consigliato per evitare token long-lived copiati manualmente.
                </p>
                {haErrorMessage ? <p className={`mt-2 ${errorTextClass}`}>{haErrorMessage}</p> : null}
              </section>
            ) : null}

            {activeSection === 'config' ? (
              <section className={sectionShellClass}>
                <h3 className="text-lg font-semibold">Backup e dati</h3>
                <p className={`mt-3 text-xs ${subduedTextClass}`}>
                  Esporta la configurazione corrente in JSON, ripristinala da file o azzera tutto. Dopo
                  ripristino/reset la pagina viene ricaricata.
                </p>
                {enterpriseControlsEnabled ? (
                  <>
                    <div className={`mt-5 ${settingsGroupClass}`}>
                      <div className={settingsRowClass}>
                        {renderSettingsIcon(Smartphone)}
                        <div className="min-w-0 flex-1">
                          <p className={settingsTitleClass}>ID dispositivo</p>
                        </div>
                        <span className="max-w-[48%] truncate text-right text-xs font-medium text-[color:var(--profile-sheet-muted)]">
                          {normalizedDashboardDeviceId || 'non disponibile'}
                        </span>
                      </div>
                      <div className={settingsDividerClass} />
                      <div className={settingsRowClass}>
                        {renderSettingsIcon(Download)}
                        <div className="min-w-0 flex-1">
                          <p className={settingsTitleClass}>Storage config</p>
                        </div>
                        <span className="max-w-[48%] truncate text-right text-xs font-medium text-[color:var(--profile-sheet-muted)]">
                          {dashboardConfigSyncMode === 'shared'
                            ? 'Condiviso HA'
                            : dashboardConfigSyncMode === 'user_data'
                              ? 'Per-account (fallback)'
                              : 'Rilevamento...'}
                        </span>
                      </div>
                      {dashboardCurrentLayoutId ? (
                        <>
                          <div className={settingsDividerClass} />
                          <div className={settingsRowClass}>
                            {renderSettingsIcon(Route)}
                            <div className="min-w-0 flex-1">
                              <p className={settingsTitleClass}>Layout corrente</p>
                            </div>
                            <span className="max-w-[48%] truncate text-right text-xs font-medium text-[color:var(--profile-sheet-muted)]">
                            {dashboardCurrentLayoutId}
                              {dashboardCurrentLayoutSource ? ` (${dashboardCurrentLayoutSource})` : ''}
                            </span>
                          </div>
                        </>
                      ) : null}
                    </div>
                    <div className={`mt-4 ${settingsGroupClass}`}>
                      <button
                        type="button"
                        onClick={handleRelinkCurrentDeviceLayout}
                        disabled={!canManageCurrentDeviceLayout || isConfigActionBusy}
                        className={`${settingsRowClass} disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass}`}
                      >
                        {renderSettingsIcon(Route)}
                        <div className="min-w-0 flex-1">
                          <p className={settingsTitleClass}>Usa layout principale</p>
                          <p className={settingsSubtitleClass}>Responsivo e condiviso.</p>
                        </div>
                        {!isCurrentDeviceDetached ? (
                          <span className={isLightTheme ? 'text-sm font-semibold text-blue-600' : 'text-sm font-semibold text-blue-300'}>✓</span>
                        ) : (
                          <ChevronRight size={16} className={subtleTextClass} />
                        )}
                      </button>
                      <div className={settingsDividerClass} />
                      <button
                        type="button"
                        onClick={handleUnlinkCurrentDeviceLayout}
                        disabled={!canManageCurrentDeviceLayout || isConfigActionBusy}
                        className={`${settingsRowClass} disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass}`}
                      >
                        {renderSettingsIcon(Smartphone)}
                        <div className="min-w-0 flex-1">
                          <p className={settingsTitleClass}>Layout dedicato</p>
                          <p className={settingsSubtitleClass}>Specifico per questo dispositivo.</p>
                        </div>
                        {isCurrentDeviceDetached ? (
                          <span className={isLightTheme ? 'text-sm font-semibold text-blue-600' : 'text-sm font-semibold text-blue-300'}>✓</span>
                        ) : (
                          <ChevronRight size={16} className={subtleTextClass} />
                        )}
                      </button>
                      {dashboardCurrentUserIsMirror ? (
                        <p className={`px-3.5 pb-3 text-[11px] ${subduedTextClass}`}>
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
                <div className={`mt-4 ${settingsGroupClass}`}>
                  <div className={settingsRowClass}>
                    {renderSettingsIcon(KeyRound)}
                    <div className="min-w-0 flex-1">
                      <p className={settingsTitleClass}>Modalita sviluppatore</p>
                      <p className={settingsSubtitleClass}>Mostra debug colonne e righe.</p>
                    </div>
                    {renderAppleSwitch({
                      checked: developerMode,
                      onChange: onDeveloperModeChange,
                      label: 'Modalita sviluppatore',
                    })}
                  </div>
                </div>
                <div className={`mt-4 ${settingsGroupClass}`}>
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    disabled={isConfigActionBusy}
                    className={`${settingsRowClass} disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass}`}
                  >
                    {renderSettingsIcon(Download)}
                    <div className="min-w-0 flex-1">
                      <p className={settingsTitleClass}>Scarica backup</p>
                    </div>
                    <ChevronRight size={16} className={subtleTextClass} />
                  </button>
                  <div className={settingsDividerClass} />
                  <button
                    type="button"
                    onClick={() => restoreInputRef.current?.click()}
                    disabled={isConfigActionBusy}
                    className={`${settingsRowClass} disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass}`}
                  >
                    {renderSettingsIcon(Upload)}
                    <div className="min-w-0 flex-1">
                      <p className={settingsTitleClass}>Ripristina da file</p>
                    </div>
                    <ChevronRight size={16} className={subtleTextClass} />
                  </button>
                  <div className={settingsDividerClass} />
                  <button
                    type="button"
                    onClick={handleResetAll}
                    disabled={isConfigActionBusy}
                    className={`${settingsRowClass} disabled:cursor-not-allowed disabled:opacity-60 ${buttonMotionClass}`}
                  >
                    {renderSettingsIcon(RotateCcw)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-rose-500">Reset totale</p>
                    </div>
                    <ChevronRight size={16} className={subtleTextClass} />
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

        </div>
      </div>
    </div>
  );
}

