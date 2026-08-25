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
  resolveAlarmManualCodeSubmission,
  resolveAlarmSecurityRequirement,
  type AlarmActionAuthOptions,
  type AlarmSecurityActionKind,
} from '../../utils/alarmSecurityPolicy';
import {
  INITIAL_AUTH_ATTEMPT_STATE,
  appendSecurityAuditEvent,
  formatAuthRateLimitMessage,
  getAuthRateLimitStatus,
  recordAuthFailure,
  recordAuthSuccess,
} from '../../services/securityAuth';
import { CONTEXT_PANEL_LAYOUT } from './layoutClasses';
import { ContextPanelHeader } from './ContextPanelHeader';
import GlassSegmentSelect from '../ui/GlassSegmentSelect';

type AlarmActionResult = boolean | void | Promise<boolean | void>;

type AlarmModeId = 'home' | 'away' | 'night' | 'vacation' | 'custom_bypass';

const ALARM_MODE_DESCRIPTIONS: Record<AlarmModeId, string> = {
  home: 'Perimetro e accessi principali',
  away: 'Protezione completa',
  night: 'Protezione silenziosa',
  vacation: 'Sorveglianza prolungata',
  custom_bypass: 'Zone escluse manualmente',
};

interface AlarmControlsProps {
  alarm: {
    name: string;
    state: string;
    status?: string;
    codeArmRequired?: boolean;
    unlockCode?: string;
    localExtraCode?: string;
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
  onAuthorizeDeviceAuth?: (label: string) => Promise<boolean>;
  onDisarm: (code?: string, options?: AlarmActionAuthOptions) => AlarmActionResult;
  onArmHome: (code?: string, options?: AlarmActionAuthOptions) => AlarmActionResult;
  onArmAway: (code?: string, options?: AlarmActionAuthOptions) => AlarmActionResult;
  onArmNight: (code?: string, options?: AlarmActionAuthOptions) => AlarmActionResult;
  onArmVacation: (code?: string, options?: AlarmActionAuthOptions) => AlarmActionResult;
  onArmCustomBypass: (code?: string, options?: AlarmActionAuthOptions) => AlarmActionResult;
  onTrigger: (code?: string, options?: AlarmActionAuthOptions) => AlarmActionResult;
}

type AlarmModeItem = {
  id: AlarmModeId;
  label: string;
  state: string;
  feature: number;
  icon: React.ReactNode;
  onPress: (code?: string, options?: AlarmActionAuthOptions) => AlarmActionResult;
};

type TimelineEntry = {
  id: string;
  text: string;
};

type PendingAlarmAction = {
  id: 'disarm' | AlarmModeId | 'trigger';
  label: string;
  state?: string;
  icon: React.ReactNode;
  onPress: (code?: string, options?: AlarmActionAuthOptions) => AlarmActionResult;
  timelineText?: string;
  variant?: 'default' | 'danger' | 'safe';
};

const ALARM_ACTION_KIND_BY_ID: Record<PendingAlarmAction['id'], AlarmSecurityActionKind> = {
  home: 'arm_home',
  away: 'arm_away',
  night: 'arm_night',
  vacation: 'arm_vacation',
  custom_bypass: 'arm_custom_bypass',
  disarm: 'disarm',
  trigger: 'trigger',
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
  if (state === 'armed_home') {
    return Home;
  }
  if (state === 'armed_night') {
    return Moon;
  }
  if (state === 'armed_vacation') {
    return Plane;
  }
  if (state === 'armed_custom_bypass') {
    return ShieldPlus;
  }
  if (state === 'armed_away') {
    return Shield;
  }
  return ShieldQuestionMark;
}

function resolveAlarmVisual(state: string) {
  if (state === 'triggered') {
    return {
      surface: 'bg-[linear-gradient(145deg,rgba(94,36,53,0.62)_0%,rgba(43,20,31,0.74)_54%,rgba(255,255,255,0.035)_100%)]',
      glow: 'bg-rose-400/24',
      icon: 'text-[color:var(--ui-danger)]',
    };
  }
  if (state === 'disarmed') {
    return {
      surface: 'bg-[linear-gradient(145deg,rgba(69,78,92,0.42)_0%,rgba(29,35,46,0.66)_55%,rgba(255,255,255,0.032)_100%)]',
      glow: 'bg-white/[0.08]',
      icon: 'text-[color:var(--ui-text-secondary)]',
    };
  }
  if (state === 'armed_home') {
    return {
      surface: 'bg-[linear-gradient(145deg,rgba(35,88,75,0.62)_0%,rgba(22,60,56,0.70)_55%,rgba(255,255,255,0.032)_100%)]',
      glow: 'bg-emerald-400/22',
      icon: 'text-[color:var(--ui-success)]',
    };
  }
  if (state === 'armed_away') {
    return {
      surface: 'bg-[linear-gradient(145deg,rgba(34,70,112,0.62)_0%,rgba(25,45,78,0.70)_55%,rgba(255,255,255,0.032)_100%)]',
      glow: 'bg-blue-400/22',
      icon: 'text-[color:var(--ui-info)]',
    };
  }
  if (state === 'armed_night') {
    return {
      surface: 'bg-[linear-gradient(145deg,rgba(55,52,116,0.60)_0%,rgba(34,32,82,0.72)_55%,rgba(255,255,255,0.032)_100%)]',
      glow: 'bg-indigo-400/23',
      icon: 'text-[color:var(--ui-info)]',
    };
  }
  if (state === 'armed_vacation') {
    return {
      surface: 'bg-[linear-gradient(145deg,rgba(101,70,35,0.62)_0%,rgba(72,45,24,0.70)_55%,rgba(255,255,255,0.032)_100%)]',
      glow: 'bg-amber-400/21',
      icon: 'text-[color:var(--ui-warning)]',
    };
  }
  if (state === 'armed_custom_bypass') {
    return {
      surface: 'bg-[linear-gradient(145deg,rgba(28,86,101,0.60)_0%,rgba(22,61,73,0.70)_55%,rgba(255,255,255,0.032)_100%)]',
      glow: 'bg-cyan-400/21',
      icon: 'text-[color:var(--ui-info)]',
    };
  }
  return {
    surface: 'bg-[linear-gradient(145deg,rgba(255,255,255,0.078),rgba(255,255,255,0.024))]',
    glow: 'bg-white/[0.07]',
    icon: 'text-[color:var(--ui-text-secondary)]',
  };
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AlarmControls({
  alarm,
  onAuthorizeDeviceAuth,
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
  const [authSubmissionError, setAuthSubmissionError] = useState('');
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
  const storedHaPin = alarm.unlockCode?.trim() ?? '';
  const storedHaPinActive = storedHaPin.length > 0;
  const localExtraCode = alarm.localExtraCode?.trim() ?? '';
  const localExtraCodeActive = localExtraCode.length > 0;
  const pendingSecurityRequirement = pendingAction
    ? resolveAlarmSecurityRequirement({
        action: ALARM_ACTION_KIND_BY_ID[pendingAction.id],
        codeArmRequired: codeRequired,
        codeFormat,
        storedHaPinConfigured: storedHaPinActive,
        localExtraPinConfigured: localExtraCodeActive,
        deviceAuthEnabled: alarm.requireAuthToDisarm,
      })
    : null;
  const numericCodeMode = pendingSecurityRequirement?.codeFormat !== 'text';
  const alarmCodeTypeLabel = pendingSecurityRequirement?.inputLabel ?? 'PIN allarme';
  const trimmedCode = authCode.trim();
  const pendingNeedsCode = Boolean(pendingSecurityRequirement?.needsCodeInput);
  const pendingPrefersDeviceAuth = Boolean(pendingSecurityRequirement?.allowsDeviceAuth && onAuthorizeDeviceAuth);
  const rateLimitStatus = getAuthRateLimitStatus(authAttemptState);
  const rateLimitMessage = formatAuthRateLimitMessage(rateLimitStatus);
  const authError = rateLimitMessage || authSubmissionError;
  const HeaderIcon = resolveHeaderIcon(normalizedState);
  const stateVisual = resolveAlarmVisual(normalizedState);
  const codeLengthLimit = 12;
  const timelineActor = changedBy || 'Sistema';
  const shouldUseLocalTimeline = !alarm.activityTimelineStatus || alarm.activityTimelineStatus === 'offline';
  const isTransitioning = normalizedState === 'pending' || normalizedState === 'arming' || normalizedState === 'disarming';
  const isUnavailable = normalizedState === 'unavailable' || normalizedState === 'unknown';
  const isProtected = normalizedState.startsWith('armed_') && !isTransitioning;
  const [selectedModeId, setSelectedModeId] = useState<AlarmModeId | undefined>(undefined);
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
  const supportedModes = useMemo(
    () =>
      hasFeatureMask
        ? modes.filter((mode) => alarmSupportsFeature(supportedFeatures, mode.feature))
        : modes.filter((mode) => mode.id === 'home' || mode.id === 'away' || mode.id === 'night'),
    [hasFeatureMask, modes, supportedFeatures],
  );
  const triggerSupported = hasFeatureMask ? alarmSupportsFeature(supportedFeatures, ALARM_FEATURE_TRIGGER) : false;
  const activeMode = supportedModes.find((mode) => mode.state === normalizedState);
  const defaultArmMode = supportedModes.find((mode) => mode.id === 'away') ?? supportedModes[0];
  const selectedMode = supportedModes.find((mode) => mode.id === selectedModeId) ?? activeMode ?? defaultArmMode;
  const currentModeLabel =
    normalizedState === 'disarmed'
      ? 'Disinserito'
      : activeMode?.label ?? translatedState;
  const currentModeCaption =
    normalizedState === 'triggered'
      ? 'Richiede attenzione immediata'
      : normalizedState === 'disarmed'
        ? 'Sistema non inserito'
        : isUnavailable
          ? 'Connessione al sistema non disponibile'
        : isTransitioning
          ? 'Cambio modalità in corso'
          : activeMode
          ? ALARM_MODE_DESCRIPTIONS[activeMode.id]
          : 'Protezione in corso';

  useEffect(() => {
    setSelectedModeId((current) => {
      if (activeMode?.id) {
        return activeMode.id;
      }
      if (current && supportedModes.some((mode) => mode.id === current)) {
        return current;
      }
      return defaultArmMode?.id;
    });
  }, [activeMode?.id, alarm.name, defaultArmMode?.id, normalizedState, supportedModes]);

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
  const disarmAction = modeActions.find((mode) => mode.id === 'disarm');
  const selectedArmAction = selectedMode ? modeActions.find((mode) => mode.id === selectedMode.id) : undefined;
  const selectedIsActive = Boolean(selectedMode && selectedMode.state === normalizedState);
  const primaryAction =
    normalizedState === 'triggered'
      ? disarmAction
      : normalizedState === 'disarmed'
        ? selectedArmAction
        : selectedIsActive
          ? disarmAction
          : selectedArmAction;
  const primaryActionLabel =
    isTransitioning
      ? 'Comando in corso'
      : isUnavailable || !primaryAction
        ? 'Non disponibile'
        : normalizedState === 'triggered'
          ? 'Disattiva allarme'
          : normalizedState === 'disarmed'
            ? `Inserisci ${selectedMode?.label ?? 'sistema'}`
            : selectedIsActive
              ? 'Disinserisci'
              : `Passa a ${selectedMode?.label ?? 'modalità'}`;
  const primaryActionCaption =
    isTransitioning
      ? 'Attendi il completamento dello stato corrente.'
      : isUnavailable
        ? 'Il sistema non è raggiungibile.'
        : normalizedState === 'disarmed'
          ? 'Conferma la modalità selezionata.'
          : selectedIsActive
            ? 'Rimuove la protezione attiva.'
            : 'Cambia modalità senza passare dal disinserimento.';
  const primaryActionEyebrow =
    isTransitioning
      ? 'Operazione'
      : isUnavailable
        ? 'Stato sistema'
        : normalizedState === 'triggered'
          ? 'Allarme attivo'
          : selectedIsActive && selectedMode
            ? `${selectedMode.label} attiva`
            : normalizedState === 'disarmed'
              ? 'Modalita selezionata'
              : 'Cambio modalita';
  const primaryActionDescription =
    selectedIsActive && selectedMode && normalizedState !== 'triggered'
      ? `${ALARM_MODE_DESCRIPTIONS[selectedMode.id]} · Tocca per disinserire.`
      : selectedMode
        ? ALARM_MODE_DESCRIPTIONS[selectedMode.id]
        : primaryActionCaption;
  const primaryActionDisabled = isTransitioning || isUnavailable || !primaryAction;
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
    setAuthSubmissionError('');
  };

  const runAlarmAction = async (action: PendingAlarmAction, code?: string, options?: AlarmActionAuthOptions) => {
    if (isAuthBusy) {
      return false;
    }
    setIsAuthBusy(true);
    try {
      const didRun = await action.onPress(code, options);
      if (didRun === false) {
        setAuthSubmissionError('Comando non autorizzato o non completato.');
        return false;
      }
      if (action.timelineText && shouldUseLocalTimeline) {
        pushTimeline(action.timelineText);
      }
      setPendingAction(null);
      setAuthCode('');
      setAuthSubmissionError('');
      return true;
    } finally {
      setIsAuthBusy(false);
    }
  };

  const openActionDialog = (action: PendingAlarmAction) => {
    const requirement = resolveAlarmSecurityRequirement({
      action: ALARM_ACTION_KIND_BY_ID[action.id],
      codeArmRequired: codeRequired,
      codeFormat,
      storedHaPinConfigured: storedHaPinActive,
      localExtraPinConfigured: localExtraCodeActive,
      deviceAuthEnabled: alarm.requireAuthToDisarm,
    });
    if (!requirement.needsCodeInput) {
      if (requirement.allowsDeviceAuth && onAuthorizeDeviceAuth) {
        setPendingAction(action);
        setAuthCode('');
        setAuthSubmissionError('');
        return;
      }
      void runAlarmAction(action);
      return;
    }
    setPendingAction(action);
    setAuthCode('');
    setAuthSubmissionError('');
  };

  const confirmPendingDeviceAuth = async () => {
    if (!pendingAction || !pendingSecurityRequirement?.allowsDeviceAuth || !onAuthorizeDeviceAuth) {
      return false;
    }

    const verified = await onAuthorizeDeviceAuth(pendingAction.label);
    if (!verified) {
      appendSecurityAuditEvent({
        tone: 'warning',
        message: 'Autenticazione dispositivo allarme non riuscita.',
        context: alarm.name || 'Allarme',
      });
      return false;
    }

    if (pendingSecurityRequirement.needsCodeInput && !storedHaPinActive) {
      return false;
    }

    appendSecurityAuditEvent({
      tone: 'success',
      message: 'Comando allarme autorizzato con autenticazione dispositivo.',
      context: alarm.name || 'Allarme',
    });
    const didRun = await runAlarmAction(
      pendingAction,
      pendingSecurityRequirement.needsCodeInput ? storedHaPin : undefined,
      { deviceAuthVerified: true },
    );
    return didRun;
  };

  const confirmPendingAction = async () => {
    if (!pendingAction || isAuthBusy) {
      return;
    }
    if (!pendingSecurityRequirement?.needsCodeInput) {
      await runAlarmAction(pendingAction);
      return;
    }
    if (rateLimitStatus.isLocked) {
      appendSecurityAuditEvent({
        tone: 'warning',
        message: 'Conferma allarme bloccata temporaneamente.',
        context: alarm.name || 'Allarme',
      });
      return;
    }
    const manualCodeSubmission = resolveAlarmManualCodeSubmission({
      inputCode: authCode,
      localExtraCode,
      storedHaCode: storedHaPin,
      requiresCode: pendingSecurityRequirement.needsCodeInput,
    });
    if (manualCodeSubmission.ok === false && manualCodeSubmission.reason === 'missing') {
      setAuthSubmissionError(`Inserisci ${alarmCodeTypeLabel.toLowerCase()} per confermare.`);
      return;
    }
    if (manualCodeSubmission.ok === false) {
      setAuthSubmissionError('Impossibile autorizzare il comando.');
      setAuthAttemptState(recordAuthFailure(authAttemptState));
      appendSecurityAuditEvent({
        tone: 'warning',
        message: 'Tentativo PIN allarme non valido.',
        context: alarm.name || 'Allarme',
      });
      return;
    }
    setAuthSubmissionError('');
    const code = manualCodeSubmission.haCode;
    const didRun = await runAlarmAction(pendingAction, code, { manualCodeVerified: true });
    if (!didRun) {
      setAuthAttemptState(recordAuthFailure(authAttemptState));
      return;
    }
    setAuthAttemptState(recordAuthSuccess());
    appendSecurityAuditEvent({
      tone: 'success',
      message: 'PIN allarme verificato.',
      context: alarm.name || 'Allarme',
    });
  };

  const pushCodeDigit = (digit: string) => {
    if (trimmedCode.length >= codeLengthLimit) {
      return;
    }
    setAuthSubmissionError('');
    setAuthCode((current) => `${current}${digit}`.slice(0, codeLengthLimit));
  };

  const popCodeDigit = () => {
    setAuthSubmissionError('');
    setAuthCode((current) => current.slice(0, -1));
  };

  const clearCode = () => {
    setAuthSubmissionError('');
    setAuthCode('');
  };

  return (
    <div className={CONTEXT_PANEL_LAYOUT.shell}>
      <ContextPanelHeader
        title={alarm.name}
        subtitle={translatedState}
        icon={<HeaderIcon className={isTransitioning ? 'animate-spin' : ''} size={21} />}
        iconClassName={stateVisual.icon}
        fallbackTitle="Allarme"
      />

      <div className={`${CONTEXT_PANEL_LAYOUT.section} relative mb-1 overflow-hidden`}>
        <div className="relative z-10 flex flex-col items-center">
          <div className={`relative flex aspect-square w-[clamp(12rem,58vw,15.5rem)] items-center justify-center rounded-full border border-white/[0.14] ${stateVisual.surface} shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_22px_55px_rgba(0,0,0,0.22)] backdrop-blur-2xl`}>
            {isProtected ? (
              <div className={`pointer-events-none absolute -inset-2 rounded-full ${stateVisual.glow} opacity-20 animate-[alarm-orb-breathe_3.8s_ease-in-out_infinite]`} />
            ) : null}
            <div className={`pointer-events-none absolute -inset-2 rounded-full border ${normalizedState === 'armed_custom_bypass' ? 'border-dashed' : 'border-solid'} border-white/[0.09]`} />
            <div className={`pointer-events-none absolute inset-[7%] rounded-full border ${normalizedState === 'triggered' ? 'animate-pulse border-rose-200/32 shadow-[0_0_34px_rgba(244,63,94,0.28)]' : 'border-white/[0.10]'}`} />

            <div className="relative z-10 flex max-w-[76%] flex-col items-center text-center">
              <span className="relative flex h-16 w-16 items-center justify-center">
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.20] bg-white/[0.13] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.26),0_12px_30px_rgba(0,0,0,0.18)]">
                  <HeaderIcon className={isTransitioning ? 'animate-spin' : ''} size={29} strokeWidth={1.85} />
                </span>
              </span>
              <h3 className="mt-4 max-w-full truncate text-[clamp(1.15rem,5.2vw,1.7rem)] font-semibold leading-none tracking-[-0.05em] text-white">
                {translatedState}
              </h3>
              <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-white/54">{currentModeCaption}</p>
            </div>
          </div>

        </div>
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.sectionCompact} mb-1`}>
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <span className="min-w-0 truncate text-xs font-semibold text-[color:var(--ui-text-tertiary)]">Modalità</span>
          <span className="ml-auto max-w-[9rem] truncate text-xs font-semibold text-[color:var(--ui-text-secondary)]">
            {selectedMode?.label ?? currentModeLabel}
          </span>
        </div>

        <GlassSegmentSelect<AlarmModeId>
          ariaLabel="Modalità allarme"
          options={supportedModes.map((mode) => ({
            value: mode.id,
            label: <span className="shrink-0">{mode.icon}</span>,
            ariaLabel: `Seleziona ${mode.label}`,
            title: mode.label,
          }))}
          value={selectedMode?.id}
          onChange={setSelectedModeId}
          disabled={isTransitioning || isUnavailable}
          minOptionWidth="2.75rem"
          scrollable
          optionClassName="h-9 px-2 sm:h-10"
        />

        <button
          type="button"
          onClick={() => {
            if (primaryAction) {
              openActionDialog(primaryAction);
            }
          }}
          disabled={primaryActionDisabled}
          className="glass-button mt-3 flex min-h-[4.6rem] w-full items-center justify-between gap-3 rounded-[1.35rem] px-4 py-3 text-left text-[color:var(--ui-text-primary)] transition active:scale-[0.985] disabled:cursor-default disabled:opacity-45"
          aria-label={primaryActionLabel}
        >
          <span className="min-w-0">
            <span className="block truncate text-[0.58rem] font-bold uppercase tracking-[0.16em] opacity-52">
              {primaryActionEyebrow}
            </span>
            <span className="mt-1 block truncate text-sm font-bold">{primaryActionLabel}</span>
            <span className="mt-1 block text-[0.69rem] font-medium leading-snug opacity-62">
              {primaryActionDescription}
            </span>
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-secondary)]">
            {normalizedState === 'triggered' || selectedIsActive ? <LockOpen size={16} /> : selectedMode?.icon ?? <Shield size={16} />}
          </span>
        </button>
      </div>

      {triggerAction ? (
        <button
          type="button"
          onClick={() => openActionDialog(triggerAction)}
          disabled={normalizedState === 'triggered' || isTransitioning || isUnavailable}
          className={`${CONTEXT_PANEL_LAYOUT.sectionCompact} mb-1 flex min-h-[4.75rem] w-full items-center justify-center text-center text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--ui-danger)] transition hover:border-[color:var(--ui-border-strong)] hover:bg-[color:var(--ui-fill-secondary)] active:scale-[0.99] disabled:cursor-default disabled:opacity-45`}
          aria-label="Attiva SOS emergenza"
        >
          SOS Emergenza
        </button>
      ) : null}

      <SecurityAuthModal
        isOpen={Boolean(pendingAction)}
        pendingAlarmState={pendingAction?.state ?? null}
        pendingStateRequiresCode={pendingNeedsCode}
        title={pendingSecurityRequirement?.title}
        description={pendingSecurityRequirement?.description}
        authError={authError}
        isAuthBusy={isAuthBusy}
        isAlarmCodeNumeric={numericCodeMode}
        alarmCodeTypeLabel={alarmCodeTypeLabel}
        authPinInput={authCode}
        preferDeviceAuth={pendingPrefersDeviceAuth}
        deviceAuthLabel="Verifica dispositivo"
        onVerifyWithDevice={pendingPrefersDeviceAuth ? confirmPendingDeviceAuth : undefined}
        onPinInputChange={(value) => {
          setAuthSubmissionError('');
          setAuthCode(
            numericCodeMode
              ? value.replace(/[^\d]/g, '').slice(0, codeLengthLimit)
              : value.slice(0, codeLengthLimit),
          );
        }}
        onVerifyWithPin={confirmPendingAction}
        onPushPinDigit={pushCodeDigit}
        onPopPinDigit={popCodeDigit}
        onClearPin={clearCode}
        onClose={closeActionDialog}
        usePortal
      />

      <div className={CONTEXT_PANEL_LAYOUT.sectionCompact}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--ui-text-secondary)]">Attività recente</p>
            <p className="mt-1 text-xs text-[color:var(--ui-text-tertiary)]">Eventi reali Home Assistant quando disponibili.</p>
          </div>
          <span className="text-[11px] font-medium text-[color:var(--ui-text-tertiary)]">{timeline.length}/{maxTimelineEntries}</span>
        </div>
        <div className="mt-3 space-y-2.5">
          {timeline.length > 0 ? (
            timeline.map((entry) => (
              <div
                key={entry.id}
                className="dashboard-content-surface rounded-2xl px-3.5 py-2.5 text-sm text-[color:var(--ui-text-secondary)]"
              >
                {entry.text}
              </div>
            ))
          ) : (
            <div className="dashboard-content-surface rounded-2xl px-3.5 py-2.5 text-sm text-[color:var(--ui-text-tertiary)]">
              {activityUnavailableMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



