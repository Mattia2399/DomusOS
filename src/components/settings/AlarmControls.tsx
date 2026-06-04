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
  const pendingCanUseBiometric = Boolean(pendingAction && alarm.requireAuthToDisarm);
  const pendingNeedsCode = Boolean(pendingAction && (codeRequired || unlockCodeActive));
  const codeMissing = pendingNeedsCode && trimmedCode.length === 0;
  const codeMismatch = pendingNeedsCode && unlockCodeActive && trimmedCode !== unlockCode;
  const actionLocked = codeMissing || codeMismatch;
  const authError = codeMissing
    ? `Inserisci ${alarmCodeTypeLabel.toLowerCase()} per confermare.`
    : codeMismatch
      ? `${alarmCodeTypeLabel} non valido.`
      : '';
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

  const openActionDialog = (action: PendingAlarmAction) => {
    setPendingAction(action);
    setAuthCode('');
  };

  const closeActionDialog = () => {
    if (isAuthBusy) {
      return;
    }
    setPendingAction(null);
    setAuthCode('');
  };

  const confirmPendingAction = async (useBiometric = false) => {
    if (!pendingAction || isAuthBusy || (!useBiometric && actionLocked)) {
      return;
    }
    const code = !useBiometric && pendingNeedsCode && trimmedCode.length ? trimmedCode : undefined;
    setIsAuthBusy(true);
    try {
      const didRun = await pendingAction.onPress(code);
      if (didRun === false) {
        return;
      }
      if (pendingAction.timelineText && shouldUseLocalTimeline) {
        pushTimeline(pendingAction.timelineText);
      }
      setPendingAction(null);
      setAuthCode('');
    } finally {
      setIsAuthBusy(false);
    }
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
      <div className={`${CONTEXT_PANEL_LAYOUT.section} bg-gradient-to-br ${headerAccent} mb-1`}>
        <div className="flex items-center gap-4 min-w-0">
          <span className="w-14 h-14 shrink-0 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white">
            <HeaderIcon size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[1.35rem] font-semibold tracking-tight text-white truncate">{alarm.name}</h2>
            <p className="text-sm text-white/80 truncate">{translatedState}</p>
          </div>
        </div>
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className={`mb-4 overflow-hidden rounded-[1.75rem] border bg-gradient-to-br ${headerAccent} px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_14px_34px_rgba(0,0,0,0.18)]`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Modalita attuale</p>
            <span className="shrink-0 rounded-full border border-white/14 bg-white/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/80">
              {activeBadgeLabel}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/18 bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] ${normalizedState === 'triggered' ? 'animate-pulse' : ''}`}>
              <HeaderIcon size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold leading-tight text-white">{currentModeLabel}</p>
              <p className="truncate text-xs font-medium text-white/62">{currentModeCaption}</p>
            </div>
          </div>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/50 mb-3">Modalita disponibili</p>
        <div className="flex items-stretch gap-2">
          {modeActions.map((mode) => {
            const isActive = normalizedState === mode.state;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => openActionDialog(mode)}
                disabled={isActive}
                title={mode.label}
                className={`flex min-h-12 min-w-0 flex-1 items-center justify-center rounded-2xl border px-2.5 py-3 text-center transition-colors ${
                  isActive
                    ? 'cursor-default border-white/18 bg-white/12 text-white'
                    : mode.variant === 'safe'
                      ? 'border-emerald-300/35 bg-emerald-500/14 text-emerald-100 hover:bg-emerald-500/22'
                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                <span className="inline-flex min-w-0 items-center justify-center gap-1.5 text-sm font-medium">
                  {mode.icon}
                  <span className="hidden truncate min-[430px]:inline">{mode.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {triggerAction ? (
          <div className="mt-4 grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => openActionDialog(triggerAction)}
              className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                normalizedState === 'triggered'
                  ? 'border-rose-300/45 bg-rose-500/26 text-rose-100'
                  : 'border-rose-300/30 bg-rose-500/12 text-rose-100 hover:bg-rose-500/20'
              }`}
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <AlertTriangle size={15} />
                Trigger allarme
              </span>
            </button>
          </div>
        ) : null}
      </div>

      <SecurityAuthModal
        isOpen={Boolean(pendingAction)}
        pendingAlarmState={pendingAction?.state ?? null}
        pendingStateRequiresCode={pendingNeedsCode}
        authError={authError}
        isAuthBusy={isAuthBusy}
        supportsBiometric={pendingCanUseBiometric}
        prefersBiometric={pendingCanUseBiometric}
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
        onVerifyWithPin={() => confirmPendingAction(pendingCanUseBiometric && !pendingNeedsCode)}
        onVerifyWithBiometric={() => confirmPendingAction(true)}
        onPushPinDigit={pushCodeDigit}
        onPopPinDigit={popCodeDigit}
        onClearPin={clearCode}
        onClose={closeActionDialog}
        usePortal
      />

      <div className={CONTEXT_PANEL_LAYOUT.section}>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-white/55">ATTIVITA RECENTE</p>
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



