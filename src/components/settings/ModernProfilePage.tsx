import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Fingerprint,
  Home,
  KeyRound,
  Laptop,
  LifeBuoy,
  MapPin,
  MonitorSmartphone,
  Route,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  UserRound,
  Wifi,
  WifiOff,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { HaConnectionStatus } from '../../hooks/useHaLiveConnection';
import { useDeviceAuth } from '../../hooks/useDeviceAuth';
import { appendSecurityAuditEvent } from '../../services/securityAuth';
import {
  DASHBOARD_BACKGROUND_PRESETS,
  type DashboardAppearanceMode,
  type DashboardBackgroundPreset,
} from '../../theme/dashboardTheme';
import GlassSegmentSelect from '../ui/GlassSegmentSelect';
import NestedPageHeader from '../ui/NestedPageHeader';
import type {
  ProfileMovementMapPoint,
  ProfileMovementTimelineEntry,
  ProfileSectionId,
} from './profileModels';
import type { ProfileHouseMember } from './settingsHouseAccessModel';

type ProfileView = 'overview' | 'personal' | 'activity' | 'devices' | 'security' | 'themes';

type ModernProfilePageProps = {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: ProfileSectionId;
  currentUserId?: string;
  userAvatarUrl?: string;
  userAvatarAlt?: string;
  userEmail?: string;
  userRoleLabel?: string;
  houseMembers?: ProfileHouseMember[];
  userOwnedDeviceCount?: number;
  movementTimeline?: ProfileMovementTimelineEntry[];
  movementPoints?: ProfileMovementMapPoint[];
  movementUpdatedLabel?: string;
  haStatus: HaConnectionStatus;
  appearanceMode: DashboardAppearanceMode;
  onAppearanceModeChange: (mode: DashboardAppearanceMode) => void;
  background: DashboardBackgroundPreset;
  onBackgroundChange: (background: DashboardBackgroundPreset) => void;
  navigationRoute?: string;
  onNavigate?: (path: string) => void;
};

type ProfileRowProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  value?: string;
  onClick?: () => void;
  tone?: 'default' | 'success' | 'warning';
};

const statusLabelByConnection: Partial<Record<HaConnectionStatus, string>> = {
  connected: 'Connessa',
  connecting: 'Connessione…',
  reconnecting: 'Riconnessione…',
  reauth_required: 'Accesso richiesto',
  error: 'Non disponibile',
  disconnected: 'Disconnessa',
};

const backgroundPreviewClassById: Record<DashboardBackgroundPreset, string> = {
  neutral: 'profile-background-thumb-neutral',
  'home-hub': 'profile-background-thumb-home-hub',
  'ocean-mist': 'profile-background-thumb-ocean-mist',
  'sunset-amber': 'profile-background-thumb-sunset-amber',
  'forest-glass': 'profile-background-thumb-forest-glass',
};

function resolveInitialView(section: ProfileSectionId | undefined): ProfileView {
  if (section === 'movements') {
    return 'activity';
  }
  if (section === 'security') {
    return 'security';
  }
  return 'overview';
}

function resolveProfileViewFromRoute(route: string | undefined): ProfileView | null {
  if (!route) {
    return null;
  }
  const path = route.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/profile';
  if (path === '/profile/personal') return 'personal';
  if (path === '/profile/activity') return 'activity';
  if (path === '/profile/devices') return 'devices';
  if (path === '/profile/security') return 'security';
  if (path === '/profile/themes') return 'themes';
  return path === '/profile' ? 'overview' : null;
}

const profilePathByView: Record<ProfileView, string> = {
  overview: '/profile',
  personal: '/profile/personal',
  activity: '/profile/activity',
  devices: '/profile/devices',
  security: '/profile/security',
  themes: '/profile/themes',
};

function ProfileRow({
  icon: Icon,
  title,
  subtitle,
  value,
  onClick,
  tone = 'default',
}: ProfileRowProps) {
  const content = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border ${
          tone === 'success'
            ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-500'
            : tone === 'warning'
              ? 'border-amber-400/25 bg-amber-500/10 text-amber-500'
              : 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)]'
        }`}
      >
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold tracking-[-0.01em] text-[color:var(--ui-text-primary)]">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-[color:var(--ui-text-secondary)]">
          {subtitle}
        </span>
      </span>
      {value ? (
        <span className="max-w-[38%] truncate text-right text-xs font-semibold text-[color:var(--ui-text-secondary)]">
          {value}
        </span>
      ) : null}
      {onClick ? <ChevronRight size={17} className="shrink-0 text-[color:var(--ui-text-tertiary)]" /> : null}
    </>
  );

  const className =
    'flex min-h-[4.4rem] w-full items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-[1.35rem] last:rounded-b-[1.35rem]';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${className} hover:bg-[color:var(--ui-fill-tertiary)] active:bg-[color:var(--ui-fill-secondary)]`}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function ProfileGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ui-text-secondary)]">
        {title}
      </h2>
      <div className="divide-y divide-[color:var(--ui-separator)] overflow-hidden rounded-[1.4rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-glass-soft)] shadow-[0_16px_34px_var(--ui-shadow-soft)] backdrop-blur-2xl">
        {children}
      </div>
    </section>
  );
}

function ProfileOverviewHeader({
  collapseProgress,
  displayName,
  displayEmail,
  displayInitials,
  userAvatarUrl,
  avatarFailed,
  onAvatarError,
  isConnected,
  connectionLabel,
  onBack,
}: {
  collapseProgress: number;
  displayName: string;
  displayEmail: string;
  displayInitials: string;
  userAvatarUrl?: string;
  avatarFailed: boolean;
  onAvatarError: () => void;
  isConnected: boolean;
  connectionLabel: string;
  onBack: () => void;
}) {
  const collapsed = collapseProgress >= 0.98;
  const identityTransform = `translate3d(${Math.round((1 - collapseProgress) * -14)}px, ${Math.round(
    (1 - collapseProgress) * 4,
  )}px, 0) scale(${0.9 + collapseProgress * 0.1})`;

  return (
    <header
      data-testid="profile-collapsing-header"
      data-collapsed={collapsed ? 'true' : 'false'}
      data-collapse-progress={collapseProgress.toFixed(2)}
      className="sticky top-0 z-30 sm:relative sm:z-10"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 border-b border-[color:var(--ui-separator)] bg-[color:var(--ui-bg-grouped)] shadow-[0_10px_30px_var(--ui-shadow-soft)] backdrop-blur-3xl sm:hidden"
        style={{ opacity: collapseProgress }}
      />
      <div className="relative mx-auto flex min-h-[calc(env(safe-area-inset-top)+4.5rem)] w-full max-w-[48rem] items-center gap-3 px-4 pt-[env(safe-area-inset-top)] sm:min-h-14 sm:px-6 sm:pt-0 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="liquid-glass-control flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--ui-text-primary)] transition-transform active:scale-[0.96]"
          aria-label="Indietro"
        >
          <ArrowLeft size={18} />
        </button>

        <div
          aria-hidden={collapseProgress < 0.5}
          className={`flex min-w-0 flex-1 items-center gap-2.5 sm:hidden ${
            collapseProgress < 0.05 ? 'pointer-events-none' : ''
          }`}
          style={{
            opacity: collapseProgress,
            transform: identityTransform,
            willChange: 'opacity, transform',
          }}
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-fill-secondary)] text-[11px] font-semibold shadow-[0_8px_20px_var(--ui-shadow-soft)]">
            {userAvatarUrl && !avatarFailed ? (
              <img
                src={userAvatarUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={onAvatarError}
              />
            ) : (
              displayInitials
            )}
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[color:var(--ui-bg-grouped)] ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold leading-tight tracking-[-0.015em]">
              {displayName}
            </span>
            <span className="mt-0.5 block truncate text-[10px] font-medium leading-tight text-[color:var(--ui-text-secondary)]">
              {displayEmail}
            </span>
          </span>
          <span className="sr-only">{connectionLabel}</span>
        </div>
      </div>
    </header>
  );
}

export function ModernProfilePage({
  isOpen,
  onClose,
  initialSection,
  currentUserId,
  userAvatarUrl,
  userAvatarAlt,
  userEmail,
  userRoleLabel,
  houseMembers = [],
  userOwnedDeviceCount = 0,
  movementTimeline = [],
  movementPoints = [],
  movementUpdatedLabel,
  haStatus,
  appearanceMode,
  onAppearanceModeChange,
  background,
  onBackgroundChange,
  navigationRoute,
  onNavigate,
}: ModernProfilePageProps) {
  const [view, setView] = useState<ProfileView>(
    () => resolveProfileViewFromRoute(navigationRoute) ?? resolveInitialView(initialSection),
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [overviewHeaderCollapseProgress, setOverviewHeaderCollapseProgress] = useState(0);
  const [securityBusy, setSecurityBusy] = useState(false);
  const [securityAvailable, setSecurityAvailable] = useState(false);
  const [securityFeedback, setSecurityFeedback] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  const currentMember = useMemo(
    () =>
      houseMembers.find((member) => member.isCurrent) ??
      houseMembers.find((member) => member.userId && member.userId === currentUserId) ??
      houseMembers[0],
    [currentUserId, houseMembers],
  );
  const displayName = userAvatarAlt?.trim() || currentMember?.name?.trim() || 'Utente Home';
  const displayEmail = userEmail?.trim() || 'Account Home Assistant';
  const displayRole = userRoleLabel?.trim() || currentMember?.roleLabel?.trim() || 'Utente';
  const displayInitials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';
  const connectionLabel = statusLabelByConnection[haStatus] ?? 'Non disponibile';
  const isConnected = haStatus === 'connected';
  const latestMovement = movementTimeline[0];
  const deviceAuth = useDeviceAuth({
    id: currentUserId || displayEmail,
    name: displayEmail,
    displayName,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setView(resolveProfileViewFromRoute(navigationRoute) ?? resolveInitialView(initialSection));
    setSecurityFeedback(null);
  }, [initialSection, isOpen, navigationRoute]);

  useEffect(() => {
    let active = true;
    void deviceAuth.isBiometricAvailable().then((available) => {
      if (active) {
        setSecurityAvailable(available);
      }
    });
    return () => {
      active = false;
    };
  }, [deviceAuth]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!isOpen || view !== 'overview' || !container) {
      setOverviewHeaderCollapseProgress(0);
      return;
    }

    const updateCollapseProgress = () => {
      const nextProgress = Math.min(1, Math.max(0, (container.scrollTop - 20) / 76));
      setOverviewHeaderCollapseProgress((current) =>
        Math.abs(current - nextProgress) < 0.005 ? current : nextProgress,
      );
    };

    updateCollapseProgress();
    container.addEventListener('scroll', updateCollapseProgress, { passive: true });
    return () => container.removeEventListener('scroll', updateCollapseProgress);
  }, [isOpen, view]);

  if (!isOpen) {
    return null;
  }

  const handleBack = () => {
    if (view === 'overview') {
      onClose();
      return;
    }
    setView('overview');
    onNavigate?.('/profile');
  };

  const openView = (nextView: Exclude<ProfileView, 'overview'>) => {
    setView(nextView);
    onNavigate?.(profilePathByView[nextView]);
  };

  const handleVerifyOrEnroll = async () => {
    if (!securityAvailable || securityBusy) {
      return;
    }
    setSecurityBusy(true);
    setSecurityFeedback(null);
    const wasEnrolled = deviceAuth.isEnrolled;
    try {
      const verified = await deviceAuth.verifyOrEnroll('Conferma dispositivo del profilo');
      if (!verified) {
        appendSecurityAuditEvent({
          tone: 'warning',
          message: 'Conferma dispositivo annullata o non riuscita.',
          context: 'Profilo',
        });
        setSecurityFeedback({
          tone: 'error',
          text: 'La verifica è stata annullata o non è riuscita.',
        });
        return;
      }
      appendSecurityAuditEvent({
        tone: 'success',
        message: wasEnrolled ? 'Conferma dispositivo verificata.' : 'Conferma dispositivo configurata.',
        context: 'Profilo',
      });
      setSecurityFeedback({
        tone: 'success',
        text: wasEnrolled
          ? 'Dispositivo verificato correttamente.'
          : 'Conferma dispositivo configurata su questo browser.',
      });
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleRemoveCredential = () => {
    if (!deviceAuth.isEnrolled) {
      return;
    }
    const confirmed = window.confirm(
      'Rimuovere la conferma dispositivo da questo browser? Le azioni sensibili useranno il metodo di fallback configurato.',
    );
    if (!confirmed) {
      return;
    }
    deviceAuth.clearCredential();
    appendSecurityAuditEvent({
      tone: 'warning',
      message: 'Conferma dispositivo rimossa dal browser.',
      context: 'Profilo',
    });
    setSecurityFeedback({
      tone: 'success',
      text: 'Conferma dispositivo rimossa da questo browser.',
    });
  };

  return (
    <div
      ref={scrollContainerRef}
      data-testid="modern-profile-scroll"
      className="fixed inset-0 z-[220] h-[100dvh] overflow-y-auto bg-[var(--ui-bg-grouped)] text-[color:var(--ui-text-primary)]"
    >
      {view !== 'overview' ? (
        <NestedPageHeader
          title={
            view === 'personal'
              ? 'Informazioni personali'
              : view === 'activity'
              ? 'Attività e spostamenti'
              : view === 'devices'
                ? 'I miei dispositivi'
              : view === 'security'
                ? 'Accesso e sicurezza'
                : 'Temi colorati'
          }
          subtitle={displayName}
          backLabel="Profilo"
          onBack={handleBack}
          scrollContainerRef={scrollContainerRef}
          maxWidthClassName="max-w-[48rem]"
        />
      ) : (
        <ProfileOverviewHeader
          collapseProgress={overviewHeaderCollapseProgress}
          displayName={displayName}
          displayEmail={displayEmail}
          displayInitials={displayInitials}
          userAvatarUrl={userAvatarUrl}
          avatarFailed={avatarFailed}
          onAvatarError={() => setAvatarFailed(true)}
          isConnected={isConnected}
          connectionLabel={connectionLabel}
          onBack={handleBack}
        />
      )}

      <main
        className={`mx-auto w-full max-w-[48rem] px-4 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] sm:px-6 lg:px-8 ${
          view === 'overview'
            ? 'pt-3 sm:pt-2'
            : 'pt-5 sm:pt-7'
        }`}
      >
        {view === 'overview' ? (
          <div className="space-y-6">
            <h1 className="sr-only">Profilo</h1>
            <section className="flex items-center gap-4 px-1 py-1 sm:gap-5">
              <div className="relative shrink-0">
                <span className="flex h-[4.75rem] w-[4.75rem] items-center justify-center overflow-hidden rounded-full border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-fill-secondary)] text-xl font-semibold text-[color:var(--ui-text-primary)] shadow-[0_14px_34px_var(--ui-shadow)] sm:h-20 sm:w-20">
                  {userAvatarUrl && !avatarFailed ? (
                    <img
                      src={userAvatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : (
                    displayInitials
                  )}
                </span>
                <span
                  className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-[color:var(--ui-bg-grouped)] ${
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  aria-label={connectionLabel}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[clamp(1.55rem,5vw,2rem)] font-semibold tracking-[-0.045em]">
                  {displayName}
                </h2>
                <p className="mt-0.5 truncate text-sm text-[color:var(--ui-text-secondary)]">{displayEmail}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] px-2.5 text-[11px] font-semibold text-[color:var(--ui-text-secondary)]">
                    <BadgeCheck size={13} />
                    {displayRole}
                  </span>
                  <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] px-2.5 text-[11px] font-semibold text-[color:var(--ui-text-secondary)]">
                    {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
                    {connectionLabel}
                  </span>
                </div>
              </div>
            </section>

            <ProfileGroup title="Profilo">
              <ProfileRow
                icon={UserRound}
                title="Informazioni personali"
                subtitle={displayEmail}
                value={displayRole}
                onClick={() => openView('personal')}
              />
              <ProfileRow
                icon={Home}
                title="Casa associata"
                subtitle="Identità e permessi verificati da Home Assistant"
                value={connectionLabel}
                tone={isConnected ? 'success' : 'warning'}
              />
              <ProfileRow
                icon={Route}
                title="Attività e spostamenti"
                subtitle={latestMovement?.title ?? 'Nessun movimento recente'}
                value={movementUpdatedLabel || undefined}
                onClick={() => openView('activity')}
              />
            </ProfileGroup>

            <ProfileGroup title="Preferenze su questo dispositivo">
              <div className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)]">
                    <Sparkles size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">Aspetto</span>
                    <span className="mt-0.5 block text-xs leading-5 text-[color:var(--ui-text-secondary)]">
                      Preferenza personale salvata in questo browser
                    </span>
                  </span>
                </div>
                <GlassSegmentSelect
                  ariaLabel="Tema del dispositivo"
                  className="mt-3"
                  value={appearanceMode}
                  onChange={onAppearanceModeChange}
                  options={[
                    { value: 'auto', label: 'Sistema' },
                    { value: 'light', label: 'Chiaro' },
                    { value: 'dark', label: 'Scuro' },
                  ]}
                />
              </div>

              <ProfileRow
                icon={Sparkles}
                title="Temi colorati"
                subtitle="Scegli il colore dello sfondo personale"
                value={DASHBOARD_BACKGROUND_PRESETS.find((preset) => preset.id === background)?.label}
                onClick={() => openView('themes')}
              />
            </ProfileGroup>

            <ProfileGroup title="Sicurezza">
              <ProfileRow
                icon={Smartphone}
                title="Dispositivi personali"
                subtitle="Tracker associati al tuo profilo"
                value={`${userOwnedDeviceCount}`}
                onClick={() => openView('devices')}
              />
              <ProfileRow
                icon={ShieldCheck}
                title="Accesso e sicurezza"
                subtitle={
                  deviceAuth.isEnrolled
                    ? 'Conferma dispositivo configurata'
                    : 'Proteggi le azioni sensibili'
                }
                value={deviceAuth.isEnrolled ? 'Attiva' : undefined}
                onClick={() => openView('security')}
                tone={deviceAuth.isEnrolled ? 'success' : 'default'}
              />
            </ProfileGroup>

            <ProfileGroup title="Aiuto">
              <ProfileRow
                icon={LifeBuoy}
                title="Supporto e feedback"
                subtitle="Segnala problemi, proponi idee o scarica la diagnostica"
                onClick={() => onNavigate?.('/support')}
              />
            </ProfileGroup>

            <p className="px-1 text-center text-xs leading-5 text-[color:var(--ui-text-secondary)]">
              Le preferenze visive restano sul dispositivo. Membri, connessioni, backup e impostazioni della
              casa sono condivisi e si gestiscono dalla pagina Impostazioni.
            </p>
          </div>
        ) : null}

        {view === 'personal' ? (
          <div className="space-y-6">
            <section className="flex items-center gap-4 rounded-[1.65rem] border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface-glass-soft)] p-5 shadow-[0_18px_42px_var(--ui-shadow-soft)] backdrop-blur-3xl">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-fill-secondary)] text-lg font-semibold">
                {userAvatarUrl && !avatarFailed ? (
                  <img
                    src={userAvatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  displayInitials
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-[-0.025em]">{displayName}</p>
                <p className="mt-1 truncate text-sm text-[color:var(--ui-text-secondary)]">{displayEmail}</p>
              </div>
            </section>

            <ProfileGroup title="Account">
              <ProfileRow
                icon={UserRound}
                title="Nome visualizzato"
                subtitle="Fornito da Home Assistant"
                value={displayName}
              />
              <ProfileRow
                icon={BadgeCheck}
                title="Ruolo nella casa"
                subtitle="Determina le operazioni disponibili"
                value={displayRole}
              />
              <ProfileRow
                icon={Home}
                title="Casa associata"
                subtitle="Identità e permessi verificati dal server"
                value={connectionLabel}
                tone={isConnected ? 'success' : 'warning'}
              />
            </ProfileGroup>

            <p className="px-1 text-xs leading-5 text-[color:var(--ui-text-secondary)]">
              Le informazioni dell’account vengono gestite da Home Assistant e non sono duplicate localmente.
            </p>
          </div>
        ) : null}

        {view === 'activity' ? (
          <div className="space-y-7">
            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.35rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-glass-soft)] p-4">
                <p className="text-xs text-[color:var(--ui-text-secondary)]">Ultima posizione</p>
                <p className="mt-1 truncate font-semibold">{movementPoints[0]?.zoneLabel || movementPoints[0]?.label || 'Non disponibile'}</p>
              </div>
              <div className="rounded-[1.35rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-glass-soft)] p-4">
                <p className="text-xs text-[color:var(--ui-text-secondary)]">Dispositivi</p>
                <p className="mt-1 font-semibold">{userOwnedDeviceCount}</p>
              </div>
              <div className="rounded-[1.35rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-glass-soft)] p-4">
                <p className="text-xs text-[color:var(--ui-text-secondary)]">Aggiornamento</p>
                <p className="mt-1 truncate font-semibold">{movementUpdatedLabel || 'Nessun dato recente'}</p>
              </div>
            </section>

            <ProfileGroup title="Cronologia recente">
              {movementTimeline.length > 0 ? (
                movementTimeline.slice(0, 12).map((entry) => (
                  <ProfileRow
                    key={entry.id}
                    icon={entry.isCurrent ? MapPin : Clock3}
                    title={entry.title}
                    subtitle={entry.subtitle || entry.timestampLabel}
                    value={entry.timestampLabel}
                    tone={entry.isCurrent ? 'success' : 'default'}
                  />
                ))
              ) : (
                <div className="px-5 py-10 text-center">
                  <MapPin size={24} className="mx-auto text-[color:var(--ui-text-tertiary)]" />
                  <p className="mt-3 text-sm font-semibold">Nessuna attività disponibile</p>
                  <p className="mt-1 text-xs text-[color:var(--ui-text-secondary)]">
                    Home Assistant non ha restituito spostamenti per questo profilo.
                  </p>
                </div>
              )}
            </ProfileGroup>
          </div>
        ) : null}

        {view === 'themes' ? (
          <div className="space-y-6">
            <p className="px-1 text-sm leading-6 text-[color:var(--ui-text-secondary)]">
              Scegli una variante colorata per lo sfondo di questo dispositivo. La modalità Chiaro o Scuro
              resta indipendente e viene scelta nella pagina principale del Profilo.
            </p>
            <ProfileGroup title="Tema del dispositivo">
              {DASHBOARD_BACKGROUND_PRESETS.map((preset) => {
                const selected = background === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onBackgroundChange(preset.id)}
                    aria-pressed={selected}
                    className="flex min-h-[4.8rem] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[color:var(--ui-fill-tertiary)] active:bg-[color:var(--ui-fill-secondary)]"
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[1rem] border border-[color:var(--ui-border-strong)] shadow-[0_8px_18px_var(--ui-shadow-soft)]">
                      <span
                        className={`profile-background-thumb absolute inset-[-18%] ${backgroundPreviewClassById[preset.id]}`}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[color:var(--ui-text-primary)]">
                        {preset.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-[color:var(--ui-text-secondary)]">
                        {preset.description}
                      </span>
                    </span>
                    {selected ? (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--ui-accent-strong)] text-[color:var(--ui-accent-contrast)]">
                        <Check size={15} strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span className="h-7 w-7 shrink-0" />
                    )}
                  </button>
                );
              })}
            </ProfileGroup>
          </div>
        ) : null}

        {view === 'devices' ? (
          <div className="space-y-6">
            <section className="rounded-[1.65rem] border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface-glass-soft)] p-5 shadow-[0_18px_42px_var(--ui-shadow-soft)] backdrop-blur-3xl sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)]">
                  <MonitorSmartphone size={21} />
                </span>
                <div>
                  <p className="font-semibold">Dispositivi del profilo</p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--ui-text-secondary)]">
                    Tracker e browser associati alla tua presenza. La disponibilità dipende dalle entità
                    esposte da Home Assistant.
                  </p>
                </div>
              </div>
            </section>

            <ProfileGroup title="Dispositivi disponibili">
              {userOwnedDeviceCount > 0 ? (
                <ProfileRow
                  icon={Smartphone}
                  title="Tracker personali"
                  subtitle="Entità associate al profilo corrente"
                  value={`${userOwnedDeviceCount}`}
                />
              ) : (
                <ProfileRow
                  icon={Laptop}
                  title="Nessun tracker disponibile"
                  subtitle="Non sono state trovate entità associate a questo utente"
                />
              )}
            </ProfileGroup>
          </div>
        ) : null}

        {view === 'security' ? (
          <div className="space-y-7">
            <section className="rounded-[1.65rem] border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface-glass)] p-5 shadow-[0_22px_50px_var(--ui-shadow-soft)] backdrop-blur-3xl sm:p-7">
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] border ${
                    deviceAuth.isEnrolled
                      ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-500'
                      : 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)]'
                  }`}
                >
                  <Fingerprint size={25} />
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-semibold tracking-[-0.025em]">Conferma dispositivo</p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--ui-text-secondary)]">
                    Usa la passkey locale del browser per confermare codici e azioni sensibili. Home Assistant
                    continua a verificare identità e permessi.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleVerifyOrEnroll()}
                  disabled={!securityAvailable || securityBusy}
                  className="liquid-glass-selection inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[color:var(--ui-border-strong)] px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none"
                >
                  <KeyRound size={16} />
                  {securityBusy
                    ? 'Verifica…'
                    : deviceAuth.isEnrolled
                      ? 'Verifica dispositivo'
                      : 'Configura dispositivo'}
                </button>
                {deviceAuth.isEnrolled ? (
                  <button
                    type="button"
                    onClick={handleRemoveCredential}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-rose-400/25 bg-rose-500/[0.07] px-5 text-sm font-semibold text-rose-500"
                  >
                    <Trash2 size={16} />
                    Rimuovi
                  </button>
                ) : null}
              </div>

              {!securityAvailable ? (
                <p className="mt-4 text-xs leading-5 text-amber-500">
                  La conferma dispositivo non è disponibile in questo browser o nel contesto corrente.
                </p>
              ) : null}

              {securityFeedback ? (
                <p
                  className={`mt-4 flex items-start gap-2 text-xs leading-5 ${
                    securityFeedback.tone === 'success' ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {securityFeedback.tone === 'success' ? (
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={15} className="mt-0.5 shrink-0" />
                  )}
                  {securityFeedback.text}
                </p>
              ) : null}
            </section>

            <ProfileGroup title="Stato sicurezza">
              <ProfileRow
                icon={Fingerprint}
                title="Passkey locale"
                subtitle="Memorizzata soltanto per questo profilo e browser"
                value={deviceAuth.isEnrolled ? 'Configurata' : 'Non configurata'}
                tone={deviceAuth.isEnrolled ? 'success' : 'default'}
              />
              <ProfileRow
                icon={ShieldCheck}
                title="Autorità dei permessi"
                subtitle="I comandi finali sono sempre verificati dal server"
                value="Home Assistant"
              />
            </ProfileGroup>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default ModernProfilePage;
