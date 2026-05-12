import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Delete, Home, LockOpen, Moon, Plane, Shield, ShieldBan, ShieldEllipsis, ShieldPlus, ShieldQuestionMark, UserRound } from 'lucide-react';
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

interface AlarmControlsProps {
  alarm: {
    name: string;
    state: string;
    status?: string;
    codeArmRequired?: boolean;
    unlockCode?: string;
    changedBy?: string;
    activityLogLimit?: number;
    activityTimeline?: Array<{
      id: string;
      text: string;
    }>;
    supportedFeatures?: number;
    rawAttributes?: Record<string, unknown>;
  };
  onDisarm: (code?: string) => void;
  onArmHome: (code?: string) => void;
  onArmAway: (code?: string) => void;
  onArmNight: (code?: string) => void;
  onArmVacation: (code?: string) => void;
  onArmCustomBypass: (code?: string) => void;
  onTrigger: (code?: string) => void;
}

type AlarmModeItem = {
  id: 'home' | 'away' | 'night' | 'vacation' | 'custom_bypass';
  label: string;
  state: string;
  feature: number;
  icon: React.ReactNode;
  onPress: (code?: string) => void;
};

type TimelineEntry = {
  id: string;
  text: string;
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
  const [alarmCode, setAlarmCode] = useState('');
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
  const unlockCode = alarm.unlockCode?.trim() ?? '';
  const unlockCodeActive = unlockCode.length > 0;
  const trimmedCode = alarmCode.trim();
  const codeMissing = codeRequired && trimmedCode.length === 0;
  const codeMismatch = unlockCodeActive && trimmedCode !== unlockCode;
  const actionLocked = codeMissing || codeMismatch;
  const HeaderIcon = resolveHeaderIcon(normalizedState);
  const headerAccent = resolveHeaderAccent(normalizedState);
  const codeLengthLimit = 12;
  const timelineActor = changedBy || 'Sistema';

  useEffect(() => {
    const incoming = (alarm.activityTimeline ?? []).slice(0, maxTimelineEntries);
    setTimeline((previous) => (incoming.length > 0 ? incoming : previous));
  }, [alarm.activityTimeline, maxTimelineEntries]);

  useEffect(() => {
    setTimeline((alarm.activityTimeline ?? []).slice(0, maxTimelineEntries));
  }, [alarm.name, alarm.activityTimeline, maxTimelineEntries]);

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

  const pushTimeline = (text: string) => {
    setTimeline((prev) => [
      {
        id: `activity-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
        text,
      },
      ...prev,
    ].slice(0, maxTimelineEntries));
  };

  const handleAction = (action: (code?: string) => void, timelineText?: string) => {
    const code = trimmedCode.length ? trimmedCode : undefined;
    action(code);
    if (timelineText) {
      pushTimeline(timelineText);
    }
  };

  const pushCodeDigit = (digit: string) => {
    if (trimmedCode.length >= codeLengthLimit) {
      return;
    }
    setAlarmCode((current) => `${current}${digit}`.slice(0, codeLengthLimit));
  };

  const popCodeDigit = () => {
    setAlarmCode((current) => current.slice(0, -1));
  };

  const clearCode = () => {
    setAlarmCode('');
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
        {changedBy ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs text-white/75">
            <UserRound size={13} />
            Ultimo cambio: {changedBy}
          </div>
        ) : null}
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">Codice</p>
          {codeRequired ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/45 bg-amber-500/18 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-100">
              Richiesto
            </span>
          ) : null}
        </div>
        <input
          type="password"
          autoComplete="new-password"
          value={alarmCode}
          onChange={(event) =>
            setAlarmCode(
              numericCodeMode
                ? event.target.value.replace(/[^\d]/g, '').slice(0, codeLengthLimit)
                : event.target.value.slice(0, codeLengthLimit),
            )
          }
          placeholder="Inserisci codice allarme"
          className="w-full rounded-2xl bg-black/25 border border-white/12 px-4 py-3 text-sm text-white outline-none focus:border-blue-300/60"
        />
        {numericCodeMode ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => pushCodeDigit(digit)}
                className="h-12 rounded-2xl border border-white/12 bg-white/8 text-white font-semibold text-base backdrop-blur-md transition-all hover:bg-white/14 active:scale-[0.97]"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={clearCode}
              className="h-12 rounded-2xl border border-white/12 bg-white/8 text-white/80 text-xs uppercase tracking-[0.16em] font-semibold backdrop-blur-md transition-all hover:bg-white/14 active:scale-[0.97]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => pushCodeDigit('0')}
              className="h-12 rounded-2xl border border-white/12 bg-white/8 text-white font-semibold text-base backdrop-blur-md transition-all hover:bg-white/14 active:scale-[0.97]"
            >
              0
            </button>
            <button
              type="button"
              onClick={popCodeDigit}
              className="h-12 rounded-2xl border border-white/12 bg-white/8 text-white/90 flex items-center justify-center backdrop-blur-md transition-all hover:bg-white/14 active:scale-[0.97]"
              aria-label="Cancella ultimo numero"
            >
              <Delete size={16} />
            </button>
          </div>
        ) : null}
        {codeMissing ? (
          <p className="mt-3 text-xs text-amber-100/90">Inserisci il codice per eseguire le azioni di inserimento/disinserimento.</p>
        ) : null}
        {codeMismatch ? (
          <p className="mt-2 text-xs text-rose-100/90">Codice non valido: azioni bloccate finche non coincide.</p>
        ) : null}
      </div>

      <div className={`${CONTEXT_PANEL_LAYOUT.section} mb-1`}>
        <p className="text-xs uppercase tracking-[0.18em] text-white/50 mb-4">Modalita allarme</p>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
          {supportedModes.map((mode) => {
            const isActive = normalizedState === mode.state;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleAction(mode.onPress, `${timelineActor} ha inserito ${mode.label} ${formatTimeLabel(new Date())}`)}
                disabled={actionLocked}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                  isActive
                    ? 'border-blue-300/45 bg-blue-500/20 text-blue-100'
                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                } ${actionLocked ? 'opacity-55 cursor-not-allowed' : ''}`}
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  {mode.icon}
                  {mode.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => handleAction(onDisarm, `${timelineActor} ha disinserito ${formatTimeLabel(new Date())}`)}
            disabled={actionLocked}
            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
              normalizedState === 'disarmed'
                ? 'border-emerald-300/45 bg-emerald-500/18 text-emerald-100'
                : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
            } ${actionLocked ? 'opacity-55 cursor-not-allowed' : ''}`}
          >
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <LockOpen size={15} />
              Disinserisci
            </span>
          </button>

          {triggerSupported ? (
            <button
              type="button"
              onClick={() => handleAction(onTrigger)}
              disabled={actionLocked}
              className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                normalizedState === 'triggered'
                  ? 'border-rose-300/45 bg-rose-500/26 text-rose-100'
                  : 'border-rose-300/30 bg-rose-500/12 text-rose-100 hover:bg-rose-500/20'
              } ${actionLocked ? 'opacity-55 cursor-not-allowed' : ''}`}
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <AlertTriangle size={15} />
                Trigger allarme
              </span>
            </button>
          ) : null}
        </div>
      </div>

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
              Nessuna attivita recente disponibile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



