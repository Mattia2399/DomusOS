import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Home, LockOpen, Moon, Plane, Shield, ShieldBan, ShieldEllipsis, ShieldPlus, ShieldQuestionMark } from 'lucide-react';
import SecurityAuthModal from '../security/SecurityAuthModal';
import {
  ALARM_FEATURE_ARM_AWAY,
  ALARM_FEATURE_ARM_CUSTOM_BYPASS,
  ALARM_FEATURE_ARM_HOME,
  ALARM_FEATURE_ARM_NIGHT,
  ALARM_FEATURE_ARM_VACATION,
  ALARM_FEATURE_TRIGGER,
  alarmSupportsFeature,
  getAlarmStateLabel,
  normalizeAlarmState,
} from '../../utils/alarmUtils';
import {
  INITIAL_AUTH_ATTEMPT_STATE,
  appendSecurityAuditEvent,
  formatAuthRateLimitMessage,
  getAuthRateLimitStatus,
  recordAuthFailure,
  recordAuthSuccess,
} from '../../services/securityAuth';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';

type AlarmActionResult = boolean | void | Promise<boolean | void>;

interface AlarmControlsProps {
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
  onDisarm: (code?: string) => AlarmActionResult;
  onArmHome: (code?: string) => AlarmActionResult;
  onArmAway: (code?: string) => AlarmActionResult;
  onArmNight: (code?: string) => AlarmActionResult;
  onArmVacation: (code?: string) => AlarmActionResult;
  onArmCustomBypass: (code?: string) => AlarmActionResult;
  onTrigger: (code?: string) => AlarmActionResult;
}

type AlarmModeItem = {
  id: 'home' | 'away' | 'night' | 'vacation' | 'custom_bypass';
  label: string;
  state: string;
  feature: number;
  icon: React.ReactNode;
  onPress: (code?: string) => AlarmActionResult;
};

type TimelineEntry = {
  id: string;
  text: string;
};

type PendingAlarmAction = {
  id: 'disarm' | 'home' | 'away' | 'night' | 'vacation' | 'custom_bypass' | 'trigger';
  label: string;
  state?: string;
  icon: React.ReactNode;
  onPress: (code?: string) => AlarmActionResult;
  timelineText?: string;
  variant?: 'default' | 'danger' | 'safe';
};

function resolveHeaderIcon(state: string) {
  if (state === 'disarmed') {
    return ShieldBan;
  }
  if (state === 'triggered') {
    return AlertTriangle;
  }
  if (state === 'pending' || state === 'arming' || state === 'disarming') {
    return ShieldEllipsis;
  }
  if (state.startsWith('armed_')) {
    return Shield;
  }
  return ShieldQuestionMark;
}

function resolveHeaderAccent(state: string) {
  if (state === 'triggered') {
    return 'from-rose-500/35 to-rose-700/15 border-rose-300/35 text-rose-100';
  }
  if (state === 'disarmed') {
    return 'from-slate-500/20 to-slate-700/10 border-white/10 text-white';
  }
  if (state === 'armed_home') {
    return 'from-emerald-500/28 to-emerald-700/12 border-emerald-300/35 text-emerald-100';
  }
  if (state === 'armed_away') {
    return 'from-blue-500/28 to-blue-700/10 border-blue-300/35 text-blue-100';
  }
  if (state === 'armed_night') {
    return 'from-indigo-500/28 to-indigo-700/10 border-indigo-300/35 text-indigo-100';
  }
  if (state === 'armed_vacation') {
    return 'from-amber-500/28 to-orange-700/10 border-amber-300/35 text-amber-100';
  }
  if (state === 'armed_custom_bypass') {
    return 'from-cyan-500/30 to-cyan-700/10 border-cyan-300/35 text-cyan-100';
  }
  return 'from-white/10 to-white/5 border-white/10 text-white';
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AlarmControls({
  alarm,
  onDisarm,
  onArmHome,
  onArmAway,
  onArmNight,
  onArmVacation,
  onArmCustomBypass,
  onTrigger,
}: AlarmControlsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAlarmAction | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [authAttemptState, setAuthAttemptState] = useState(INITIAL_AUTH_ATTEMPT_STATE);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const maxTimelineEntries = useMemo(() => {
    const parsed = Number(alarm.activityLogLimit);
    if (!Number.isFinite(parsed)) {
      return 6;
    }
    return Math.max(1, Math.min(30, Math.round(parsed)));
  }, [alarm.activityLogLimit]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>(() => (alarm.activityTimeline ?? []).slice(0, maxTimelineEntries));
  const normalizedState = normalizeAlarmState(alarm.state || alarm.status);
  const translatedState = getAlarmStateLabel(normalizedState);
  const changedBy = alarm.changedBy?.trim();
  const codeRequired = Boolean(alarm.codeArmRequired);
  const codeFormat = typeof alarm.rawAttributes?.code_format === 'string'
    ? alarm.rawAttributes.code_format.toLowerCase()
    : undefined;
  const numericCodeMode = codeFormat !== 'text';
  const alarmCodeTypeLabel = numericCodeMode ? 'PIN' : 'Codice';
  const unlockCode = alarm.unlockCode?.trim() ?? '';
  const unlockCodeActive = unlockCode.length > 0;
  const trimmedCode = authCode.trim();
  const pendingNeedsCode = Boolean(pendingAction && (codeRequired || unlockCodeActive));
  const codeMissing = pendingNeedsCode && trimmedCode.length === 0;
  const codeMismatch = pendingNeedsCode && unlockCodeActive && trimmedCode !== unlockCode;
  const rateLimitStatus = getAuthRateLimitStatus(authAttemptState);
  const rateLimitMessage = formatAuthRateLimitMessage(rateLimitStatus);
  const authError = rateLimitMessage
    || (codeMissing
      ? `Inserisci ${alarmCodeTypeLabel.toLowerCase()} locale per confermare.`
      : codeMismatch
        ? `${alarmCodeTypeLabel} locale non valido.`
        : '');
  const HeaderIcon = resolveHeaderIcon(normalizedState);
  const headerAccent = resolveHeaderAccent(normalizedState);
  const codeLengthLimit = 12;
  const timelineActor = changedBy || 'Sistema';
  const shouldUseLocalTimeline = !alarm.activityTimelineStatus || alarm.activityTimelineStatus === 'offline';
  const isTransitioning = normalizedState === 'pending' || normalizedState === 'arming' || normalizedState === 'disarming';
  const activeBadgeLabel =
    normalizedState === 'triggered'
      ? 'Allarme'
      : normalizedState === 'disarmed'
        ? 'Disattivo'
        : isTransitioning
          ? 'In corso'
          : 'Attiva';

  useEffect(() => {
    const incoming = (alarm.activityTimeline ?? []).slice(0, maxTimelineEntries);
    setTimeline((previous) => {
      if (!shouldUseLocalTimeline) {
        return incoming;
      }
      return incoming.length > 0 ? incoming : previous;
    });
  }, [alarm.activityTimeline, maxTimelineEntries, shouldUseLocalTimeline]);

  useEffect(() => {
    setTimeline((alarm.activityTimeline ?? []).slice(0, maxTimelineEntries));
  }, [alarm.name, alarm.activityTimeline, alarm.activityTimelineStatus, maxTimelineEntries]);

  const modes = useMemo<AlarmModeItem[]>(
    () => [
      {
        id: 'home',
        label: 'Casa',
        state: 'armed_home',
        feature: ALARM_FEATURE_ARM_HOME,
        icon: <Home size={15} />,
        onPress: onArmHome,
      },
      {
        id: 'away',
        label: 'Fuori',
        state: 'armed_away',
        feature: ALARM_FEATURE_ARM_AWAY,
        icon: <Shield size={15} />,
        onPress: onArmAway,
      },
      {
        id: 'night',
        label: 'Notte',
        state: 'armed_night',
        feature: ALARM_FEATURE_ARM_NIGHT,
        icon: <Moon size={15} />,
        onPress: onArmNight,
      },
      {
        id: 'vacation',
        label: 'Vacanza',
        state: 'armed_vacation',
        feature: ALARM_FEATURE_ARM_VACATION,
        icon: <Plane size={15} />,
        onPress: onArmVacation,
      },
      {
        id: 'custom_bypass',
        label: 'Bypass',
        state: 'armed_custom_bypass',
        feature: ALARM_FEATURE_ARM_CUSTOM_BYPASS,
        icon: <ShieldPlus size={15} />,
        onPress: onArmCustomBypass,
      },
    ],
    [onArmAway, onArmCustomBypass, onArmHome, onArmNight, onArmVacation],
  );

  const supportedFeatures = alarm.supportedFeatures;
  const hasFeatureMask = typeof supportedFeatures === 'number' && Number.isFinite(supportedFeatures);
  const supportedModes = hasFeatureMask
    ? modes.filter((mode) => alarmSupportsFeature(supportedFeatures, mode.feature))
    : modes.filter((mode) => mode.id === 'home' || mode.id === 'away' || mode.id === 'night');
  const triggerSupported = hasFeatureMask ? alarmSupportsFeature(supportedFeatures, ALARM_FEATURE_TRIGGER) : false;
  const currentModeLabel =
    normalizedState === 'disarmed'
      ? 'Disinserito'
      : supportedModes.find((mode) => mode.state === normalizedState)?.label ?? translatedState;
  const currentModeCaption =
    normalizedState === 'triggered'
      ? 'Richiede attenzione immediata'
      : normalizedState === 'disarmed'
        ? 'Sistema non inserito'
        : isTransitioning
          ? 'Cambio modalita in corso'
          : 'Protezione in corso';
  const modeActions = useMemo<PendingAlarmAction[]>(
    () => [
      {
        id: 'disarm',
        label: 'Disinserito',
        state: 'disarmed',
        icon: <LockOpen size={15} />,
        onPress: onDisarm,
        timelineText: `${timelineActor} ha disinserito ${formatTimeLabel(new Date())}`,
        variant: 'safe',
      },
      ...supportedModes.map((mode) => ({
        id: mode.id,
        label: mode.label,
        state: mode.state,
        icon: mode.icon,
        onPress: mode.onPress,
        timelineText: `${timelineActor} ha inserito ${mode.label} ${formatTimeLabel(new Date())}`,
        variant: 'default' as const,
      })),
    ],
    [onDisarm, supportedModes, timelineActor],
  );
  const triggerAction = useMemo<PendingAlarmAction | null>(
    () =>
      triggerSupported
        ? {
            id: 'trigger',
            label: 'Trigger allarme',
            state: 'triggered',
            icon: <AlertTriangle size={15} />,
            onPress: onTrigger,
            variant: 'danger',
          }
        : null,
    [onTrigger, triggerSupported],
  );
  const displayedModeActions = triggerAction ? [...modeActions, triggerAction] : modeActions;
  const primaryShieldAction = normalizedState === 'disarmed'
    ? modeActions.find((mode) => mode.id === 'away') ?? modeActions.find((mode) => mode.id !== 'disarm') ?? modeActions[0]
    : modeActions.find((mode) => mode.id === 'disarm') ?? modeActions[0];
  const shieldActionDisabled = !primaryShieldAction || normalizedState === primaryShieldAction.state;
  const primaryShieldHint = primaryShieldAction
    ? normalizedState === 'disarmed'
      ? `Tocca per inserire ${primaryShieldAction.label.toLowerCase()}`
      : 'Tocca per disinserire'
    : 'Nessuna azione disponibile';
  const activityUnavailableMessage = useMemo(() => {
    const historyHours = Math.max(1, Math.round(Number(alarm.activityLogHours) || 24));
    if (alarm.activityTimelineStatus === 'loading') {
      return 'Caricamento attività reali da Home Assistant...';
    }
    if (alarm.activityTimelineStatus === 'empty') {
      return `Nessuna attività reale trovata nelle ultime ${historyHours} ore.`;
    }
    if (alarm.activityTimelineStatus === 'unavailable') {
      return 'Attività reale non disponibile: il logbook di Home Assistant non ha risposto.';
    }
    if (alarm.activityTimelineStatus === 'offline') {
      return 'Connetti Home Assistant per vedere attività reali dell’allarme.';
    }
    return 'Nessuna attività reale disponibile per questo allarme.';
  }, [alarm.activityLogHours, alarm.activityTimelineStatus]);

  const pushTimeline = (text: string) => {
    setTimeline((prev) => [
      {
        id: `activity-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
        text,
      },
      ...prev,
    ].slice(0, maxTimelineEntries));
  };

  const closeActionDialog = () => {
    if (isAuthBusy) {
      return;
    }
    setPendingAction(null);
    setAuthCode('');
  };

  const runAlarmAction = async (action: PendingAlarmAction, code?: string) => {
    if (isAuthBusy) {
      return;
    }
    setIsAuthBusy(true);
    try {
      const didRun = await action.onPress(code);
      if (didRun === false) {
        return;
      }
      if (action.timelineText && shouldUseLocalTimeline) {
        pushTimeline(action.timelineText);
      }
      setPendingAction(null);
      setAuthCode('');
    } finally {
      setIsAuthBusy(false);
    }
  };

  const openActionDialog = (action: PendingAlarmAction) => {
    if (!codeRequired && !unlockCodeActive) {
      void runAlarmAction(action);
      return;
    }
    setPendingAction(action);
    setAuthCode('');
  };

  const confirmPendingAction = async () => {
    if (!pendingAction || isAuthBusy) {
      return;
    }
    if (rateLimitStatus.isLocked) {
      appendSecurityAuditEvent({
        tone: 'warning',
        message: 'Fallback codice locale allarme bloccato temporaneamente.',
        context: alarm.name || 'Allarme',
      });
      return;
    }
    if (codeMissing) {
      return;
    }
    if (codeMismatch) {
      setAuthAttemptState(recordAuthFailure(authAttemptState));
      appendSecurityAuditEvent({
        tone: 'warning',
        message: 'Tentativo codice locale allarme non valido.',
        context: alarm.name || 'Allarme',
      });
      return;
    }
    const code = pendingNeedsCode && trimmedCode.length ? trimmedCode : undefined;
    if (unlockCodeActive) {
      setAuthAttemptState(recordAuthSuccess());
      appendSecurityAuditEvent({
        tone: 'success',
        message: 'Fallback codice locale allarme verificato.',
        context: alarm.name || 'Allarme',
      });
    }
    await runAlarmAction(pendingAction, code);
  };

  const pushCodeDigit = (digit: string) => {
    if (trimmedCode.length >= codeLengthLimit) {
      return;
    }
    setAuthCode((current) => `${current}${digit}`.slice(0, codeLengthLimit));
  };

  const popCodeDigit = () => {
    setAuthCode((current) => current.slice(0, -1));
  };

  const clearCode = () => {
    setAuthCode('');
  };

  return (
    <div className={CONTEXT_PANEL_LAYOUT.shell}>
      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-light uppercase tracking-[0.22em] text-white/55">Alarm Control</p>
            <h2 className="mt-2 truncate text-[1.45rem] font-semibold leading-tight text-white">{alarm.name}</h2>
            <p className="mt-1 truncate text-sm font-medium text-white/62">{translatedState}</p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/78">
            <Shield size={17} />
          </span>
        </div>
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={() => {
              if (primaryShieldAction) {
                openActionDialog(primaryShieldAction);
              }
            }}
            disabled={shieldActionDisabled}
            className={`relative flex h-[clamp(10.5rem,54vw,15rem)] w-[clamp(10.5rem,54vw,15rem)] min-h-[10.5rem] min-w-[10.5rem] items-center justify-center rounded-full border bg-gradient-to-br ${headerAccent} shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-200 ${
              shieldActionDisabled ? 'cursor-default opacity-90' : 'active:scale-[0.985]'
            }`}
            aria-label={primaryShieldHint}
            title={primaryShieldHint}
          >
            <span className="pointer-events-none absolute -inset-4 rounded-full border border-white/8 bg-white/[0.015]" />
            <span
              className={`pointer-events-none absolute -inset-1 rounded-full ${
                normalizedState === 'triggered'
                  ? 'animate-pulse border border-rose-200/35 shadow-[0_0_34px_rgba(255,59,48,0.32)]'
                  : 'border border-white/10 shadow-[0_0_28px_rgba(255,255,255,0.08)]'
              }`}
            />
            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="inline-flex rounded-full border border-white/15 bg-white/[0.06] p-4 text-white">
                <HeaderIcon className={isTransitioning ? 'animate-spin' : ''} size={44} />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/88">{currentModeLabel}</p>
              <p className="mt-2 max-w-[11rem] text-xs leading-snug text-white/62">{currentModeCaption}</p>
              <span className="mt-3 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/74">
                {activeBadgeLabel}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Modalita</p>
            <p className="mt-1 text-xs text-white/45">Scegli lo stato operativo dell'allarme.</p>
          </div>
          <span className="shrink-0 rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/62">
            {displayedModeActions.length}
          </span>
        </div>

        <div className="glass-scrollbar mt-4 flex snap-x items-stretch gap-2.5 overflow-x-auto overscroll-contain pr-1 [scrollbar-width:none] [touch-action:pan-x] [-webkit-overflow-scrolling:touch]">
          {displayedModeActions.map((mode) => {
            const isActive = normalizedState === mode.state;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => openActionDialog(mode)}
                disabled={isActive}
                title={mode.label}
                className={`group flex min-h-[5rem] w-[5.35rem] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border px-2.5 py-3 text-center transition-colors min-[420px]:w-[6.25rem] ${
                  isActive
                    ? 'cursor-default border-white/24 bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                    : mode.variant === 'danger'
                      ? 'border-rose-300/30 bg-rose-500/12 text-rose-100 hover:bg-rose-500/20'
                      : mode.variant === 'safe'
                      ? 'border-emerald-300/30 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/20'
                    : 'border-white/10 bg-white/[0.045] text-white/82 hover:bg-white/[0.08]'
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                    isActive
                      ? 'border-white/24 bg-white/16 text-white'
                      : mode.variant === 'danger'
                        ? 'border-rose-200/28 bg-rose-400/14 text-rose-100'
                        : mode.variant === 'safe'
                          ? 'border-emerald-200/28 bg-emerald-400/14 text-emerald-100'
                          : 'border-white/12 bg-white/[0.06] text-white/78 group-hover:text-white'
                  }`}
                >
                  {mode.icon}
                </span>
                <span className="max-w-full truncate text-xs font-semibold leading-tight">{mode.label}</span>
                {isActive ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white/75 shadow-[0_0_8px_rgba(255,255,255,0.45)]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <SecurityAuthModal
        isOpen={Boolean(pendingAction)}
        pendingAlarmState={pendingAction?.state ?? null}
        pendingStateRequiresCode={pendingNeedsCode}
        description={
          unlockCodeActive
            ? `${alarmCodeTypeLabel} locale dashboard richiesto per autorizzare l'azione.`
            : `${alarmCodeTypeLabel} richiesto dall'entita Home Assistant e inviato al servizio.`
        }
        authError={authError}
        isAuthBusy={isAuthBusy}
        isAlarmCodeNumeric={numericCodeMode}
        alarmCodeTypeLabel={alarmCodeTypeLabel}
        authPinInput={authCode}
        onPinInputChange={(value) =>
          setAuthCode(
            numericCodeMode
              ? value.replace(/[^\d]/g, '').slice(0, codeLengthLimit)
              : value.slice(0, codeLengthLimit),
          )
        }
        onVerifyWithPin={confirmPendingAction}
        onPushPinDigit={pushCodeDigit}
        onPopPinDigit={popCodeDigit}
        onClearPin={clearCode}
        onClose={closeActionDialog}
        usePortal
      />

      <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Log</p>
          <span className="text-[11px] font-medium text-white/38">{timeline.length}/{maxTimelineEntries}</span>
        </div>
        <div className="mt-3 space-y-2.5">
          {timeline.length > 0 ? (
            timeline.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-white/7 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/78"
              >
                {entry.text}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/7 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/58">
              {activityUnavailableMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



