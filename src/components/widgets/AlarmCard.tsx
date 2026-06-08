import React, { useMemo } from 'react';
import { House, Lock, LockOpen, Moon, Plane, Shield, ShieldAlert, ShieldPlus } from 'lucide-react';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import {
  ALARM_FEATURE_ARM_AWAY,
  ALARM_FEATURE_ARM_CUSTOM_BYPASS,
  ALARM_FEATURE_ARM_HOME,
  ALARM_FEATURE_ARM_NIGHT,
  ALARM_FEATURE_ARM_VACATION,
  alarmSupportsFeature,
  getAlarmStateLabel,
  normalizeAlarmState,
  resolveAlarmSupportedFeatures,
  toTrimmedString,
} from '../../utils/alarmUtils';

type AlarmQuickArmMode = 'home' | 'away' | 'night' | 'vacation' | 'custom_bypass';

type AlarmCardProps = {
  widget: Widget;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  onQuickDisarm?: () => void;
  onQuickArm?: (mode: AlarmQuickArmMode) => void;
  liveEntity?: MockEntityState;
};

type ArmChoice = {
  mode: AlarmQuickArmMode;
  label: string;
  icon: React.ReactNode;
};

const ALARM_PENDING_ATTRIBUTE_KEY = '__dashboard_pending_alarm_action';
const TRANSITIONING_ALARM_STATES = new Set(['pending', 'arming', 'disarming']);

type AlarmSurfaceTone = {
  background: string;
  border: string;
  sheen: string;
};

function resolveAlarmSurfaceTone(state: string): AlarmSurfaceTone {
  if (state === 'triggered') {
    return {
      background: 'bg-[#FF3B30]/16',
      border: 'border-[#FF3B30]/28',
      sheen: 'bg-[radial-gradient(95%_76%_at_0%_0%,rgba(255,59,48,0.16),rgba(255,255,255,0.06)_42%,transparent_72%)]',
    };
  }
  if (state === 'armed_home') {
    return {
      background: 'bg-[#FF9F0A]/13',
      border: 'border-[#FF9F0A]/24',
      sheen: 'bg-[radial-gradient(95%_76%_at_0%_0%,rgba(255,159,10,0.15),rgba(255,255,255,0.055)_44%,transparent_72%)]',
    };
  }
  if (state === 'armed_away') {
    return {
      background: 'bg-[#0A84FF]/12',
      border: 'border-[#0A84FF]/24',
      sheen: 'bg-[radial-gradient(95%_76%_at_0%_0%,rgba(10,132,255,0.15),rgba(255,255,255,0.055)_44%,transparent_72%)]',
    };
  }
  if (state === 'armed_night') {
    return {
      background: 'bg-[#5E5CE6]/12',
      border: 'border-[#A5A6FF]/22',
      sheen: 'bg-[radial-gradient(95%_76%_at_0%_0%,rgba(94,92,230,0.15),rgba(255,255,255,0.055)_44%,transparent_72%)]',
    };
  }
  if (state === 'armed_vacation') {
    return {
      background: 'bg-[#FFD60A]/10',
      border: 'border-[#FFD60A]/22',
      sheen: 'bg-[radial-gradient(95%_76%_at_0%_0%,rgba(255,214,10,0.13),rgba(255,255,255,0.055)_44%,transparent_72%)]',
    };
  }
  if (state === 'armed_custom_bypass') {
    return {
      background: 'bg-[#64D2FF]/11',
      border: 'border-[#64D2FF]/22',
      sheen: 'bg-[radial-gradient(95%_76%_at_0%_0%,rgba(100,210,255,0.13),rgba(255,255,255,0.055)_44%,transparent_72%)]',
    };
  }
  if (state === 'disarmed') {
    return {
      background: 'bg-[#32D74B]/9',
      border: 'border-[#32D74B]/18',
      sheen: 'bg-[radial-gradient(95%_76%_at_0%_0%,rgba(50,215,75,0.11),rgba(255,255,255,0.055)_44%,transparent_72%)]',
    };
  }
  return {
    background: 'bg-white/5',
    border: 'border-white/5',
    sheen: 'bg-[radial-gradient(95%_76%_at_0%_0%,rgba(255,255,255,0.08),transparent_72%)]',
  };
}

function resolveAlarmIcon(state: string) {
  if (state === 'triggered') {
    return ShieldAlert;
  }
  return Shield;
}

function resolveArmChoices(supportedFeatures: number | undefined): ArmChoice[] {
  const choices: ArmChoice[] = [];
  if (alarmSupportsFeature(supportedFeatures, ALARM_FEATURE_ARM_HOME)) {
    choices.push({ mode: 'home', label: 'Casa', icon: <House size={14} /> });
  }
  if (alarmSupportsFeature(supportedFeatures, ALARM_FEATURE_ARM_AWAY)) {
    choices.push({ mode: 'away', label: 'Fuori', icon: <Shield size={14} /> });
  }
  if (alarmSupportsFeature(supportedFeatures, ALARM_FEATURE_ARM_NIGHT)) {
    choices.push({ mode: 'night', label: 'Notte', icon: <Moon size={14} /> });
  }
  if (alarmSupportsFeature(supportedFeatures, ALARM_FEATURE_ARM_VACATION)) {
    choices.push({ mode: 'vacation', label: 'Vacanza', icon: <Plane size={14} /> });
  }
  if (alarmSupportsFeature(supportedFeatures, ALARM_FEATURE_ARM_CUSTOM_BYPASS)) {
    choices.push({ mode: 'custom_bypass', label: 'Bypass', icon: <ShieldPlus size={14} /> });
  }
  if (choices.length > 0) {
    return choices;
  }
  return [
    { mode: 'home', label: 'Casa', icon: <House size={14} /> },
    { mode: 'away', label: 'Fuori', icon: <Shield size={14} /> },
  ];
}

export function AlarmCard({
  widget,
  isSelected,
  isEditMode,
  onClick,
  onQuickDisarm,
  onQuickArm,
  liveEntity,
}: AlarmCardProps) {
  const rawAttributes = liveEntity?.rawAttributes;
  const resolvedState = normalizeAlarmState(
    toTrimmedString(liveEntity?.state) ??
      toTrimmedString(liveEntity?.stateLabel) ??
      widget.status,
  );
  const stateLabel = getAlarmStateLabel(resolvedState);
  const isTriggered = resolvedState === 'triggered';
  const displayState = isTriggered ? 'Allarme' : stateLabel;
  const pendingService = toTrimmedString(rawAttributes?.[ALARM_PENDING_ATTRIBUTE_KEY]);
  const isTransitioning = Boolean(pendingService) || TRANSITIONING_ALARM_STATES.has(resolvedState);
  const supportedFeatures = resolveAlarmSupportedFeatures(liveEntity);
  const armChoices = useMemo(() => resolveArmChoices(supportedFeatures), [supportedFeatures]);
  const primaryArmChoice = armChoices[0];
  const StateIcon = resolveAlarmIcon(resolvedState);
  const surfaceTone = resolveAlarmSurfaceTone(resolvedState);
  const codeArmRequired = typeof rawAttributes?.code_arm_required === 'boolean' ? rawAttributes.code_arm_required : false;
  const localUnlockEnabled = (widget.alarmUnlockCode ?? '').trim().length > 0;
  const armActionLocked = codeArmRequired || localUnlockEnabled;
  const disarmActionLocked =
    codeArmRequired || localUnlockEnabled || (widget.alarmRequireAuthToDisarm ?? false);

  const handleQuickDisarm = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isTransitioning) {
      return;
    }
    if (!onQuickDisarm) {
      onClick();
      return;
    }
    onQuickDisarm();
  };

  const handleQuickArm = (mode: AlarmQuickArmMode | undefined) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isTransitioning) {
      return;
    }
    if (!mode || !onQuickArm) {
      onClick();
      return;
    }
    onQuickArm(mode);
  };

  return (
    <div
      className={`@container relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[2rem] ${
        isSelected ? 'selection-corners' : ''
      }`}
      style={{ containerType: 'size' }}
      onClick={(event) => {
        if (isEditMode) {
          return;
        }
        event.stopPropagation();
        onClick();
      }}
      aria-label={`${widget.title}, ${displayState}`}
      aria-busy={isTransitioning || undefined}
    >
      <div
        className={`relative h-full w-full min-h-0 min-w-0 overflow-hidden rounded-[2rem] border ${surfaceTone.border} ${surfaceTone.background} backdrop-blur-3xl ${
          isEditMode ? 'pointer-events-none' : ''
        }`}
      >
        <div className={`pointer-events-none absolute inset-0 rounded-[2rem] ${surfaceTone.sheen}`} />
        <div className="pointer-events-none absolute inset-x-[clamp(1rem,12cqw,2rem)] top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        {isTransitioning ? (
          <div className="pointer-events-none absolute inset-x-[clamp(1rem,12cqw,2rem)] bottom-0 h-px animate-pulse bg-gradient-to-r from-transparent via-white/65 to-transparent" />
        ) : null}

        <div className="relative z-10 flex h-full w-full min-h-0 min-w-0 items-center justify-between gap-[clamp(0.35rem,4cqw,1rem)] p-[clamp(0.125rem,8cqh,1rem)] [@container_(min-height:_160px)]:hidden">
          <div className="flex min-w-0 flex-col gap-[clamp(0.0625rem,1.8cqh,0.375rem)]">
            <h2 className="truncate text-[clamp(0.62rem,18cqh,1.5rem)] font-semibold leading-none text-white">
              {widget.title}
            </h2>
            <p className={`truncate text-[clamp(0.52rem,11cqh,1rem)] font-medium leading-none ${isTriggered ? 'text-[#ff716c]' : 'text-white/70'}`}>
              {displayState}
            </p>
          </div>

          <div className={`relative z-10 flex aspect-square h-[clamp(1.25rem,min(42cqh,30cqw),3.5rem)] shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-md ${isTransitioning ? 'animate-pulse' : ''}`}>
            <div className="absolute inset-0 bg-[#85adff]/10 blur-xl" />
            <StateIcon className="relative z-10 h-[clamp(0.72rem,min(18cqh,13cqw),1.5rem)] w-[clamp(0.72rem,min(18cqh,13cqw),1.5rem)] text-white/70" />
          </div>
        </div>

        <div className="relative z-10 hidden h-full w-full min-h-0 min-w-0 flex-col justify-between p-[clamp(0.875rem,8cqh,1.65rem)] [@container_(min-height:_160px)]:flex [@container_(min-width:_240px)]:p-[clamp(1rem,9cqh,2rem)]">
          <div className="flex min-w-0 items-start justify-between gap-[clamp(0.6rem,5cqw,1.75rem)]">
            <div className={`relative flex h-[clamp(2.35rem,20cqh,3.5rem)] w-[clamp(2.35rem,20cqh,3.5rem)] shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md ${isTransitioning ? 'animate-pulse' : ''}`}>
              <div className="absolute inset-0 rounded-full bg-[#85adff]/10 blur-xl" />
              <StateIcon className="relative z-10 h-[clamp(1.15rem,9cqh,1.5rem)] w-[clamp(1.15rem,9cqh,1.5rem)] text-white/70" />
            </div>

            <div className="min-w-0 text-right">
              <h2 className="truncate text-[clamp(0.9rem,6.4cqh,1.25rem)] font-semibold leading-none text-white">
                {widget.title}
              </h2>
              <p className={`mt-[clamp(0.2rem,1.8cqh,0.375rem)] truncate text-[clamp(0.68rem,4.4cqh,0.875rem)] font-medium leading-none ${isTriggered ? 'text-[#ff716c]' : 'text-white/70'}`}>
                {displayState}
              </p>
            </div>
          </div>

          <div className="z-10 mt-auto grid w-full min-w-0 grid-cols-2 gap-[clamp(0.4rem,3.5cqw,1rem)]">
            <button
              type="button"
              onClick={handleQuickDisarm}
              disabled={isTransitioning}
              className={`btn-premium group flex min-w-0 items-center justify-center gap-[clamp(0.2rem,1.8cqw,0.5rem)] rounded-full border border-white/5 bg-white/5 px-[clamp(0.45rem,3cqw,1rem)] py-[clamp(0.48rem,3.4cqh,1rem)] text-[clamp(0.62rem,3.7cqh,0.875rem)] font-semibold text-white/70 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)] transition-all duration-300 disabled:active:scale-100 [@container_(min-height:_172px)]:aspect-square [@container_(min-height:_172px)]:flex-col [@container_(min-height:_172px)]:rounded-[0.90rem] [@container_(min-height:_172px)]:px-2 [@container_(min-height:_172px)]:py-2 ${
                isTransitioning ? 'cursor-wait opacity-65' : 'hover:bg-white/10 hover:text-white'
              }`}
              title={isTransitioning ? 'Comando in corso' : disarmActionLocked ? 'Autorizza disinserimento' : 'Disinserisci'}
              aria-label={isTransitioning ? 'Comando allarme in corso' : disarmActionLocked ? 'Autorizza disinserimento allarme' : 'Disinserisci allarme'}
            >
              <LockOpen className={`hidden h-[clamp(0.75rem,3.7cqh,1.0625rem)] w-[clamp(0.75rem,3.7cqh,1.0625rem)] shrink-0 transition-colors [@container_(min-width:_190px)]:block ${isTransitioning ? '' : 'group-hover:text-white'}`} />
              <span className="min-w-0 truncate">
                <span className="[@container_(min-width:_240px)]:hidden">Disin.</span>
                <span className="hidden [@container_(min-width:_240px)]:inline">Disarma</span>
              </span>
            </button>
            <button
              type="button"
              onClick={handleQuickArm(primaryArmChoice?.mode)}
              disabled={isTransitioning}
              className={`btn-premium group flex min-w-0 items-center justify-center gap-[clamp(0.2rem,1.8cqw,0.5rem)] rounded-full border border-white/5 bg-white/5 px-[clamp(0.45rem,3cqw,1rem)] py-[clamp(0.48rem,3.4cqh,1rem)] text-[clamp(0.62rem,3.7cqh,0.875rem)] font-semibold text-white/70 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)] transition-all duration-300 disabled:active:scale-100 [@container_(min-height:_172px)]:aspect-square [@container_(min-height:_172px)]:flex-col [@container_(min-height:_172px)]:rounded-[0.90rem] [@container_(min-height:_172px)]:px-2 [@container_(min-height:_172px)]:py-2 ${
                isTransitioning ? 'cursor-wait opacity-65' : 'hover:bg-white/10 hover:text-white'
              }`}
              title={isTransitioning ? 'Comando in corso' : armActionLocked ? `Autorizza inserimento ${primaryArmChoice?.label ?? 'allarme'}` : `Inserisci ${primaryArmChoice?.label ?? 'allarme'}`}
              aria-label={isTransitioning ? 'Comando allarme in corso' : armActionLocked ? `Autorizza inserimento ${primaryArmChoice?.label ?? 'allarme'}` : `Inserisci ${primaryArmChoice?.label ?? 'allarme'}`}
            >
              <Lock className={`hidden h-[clamp(0.75rem,3.7cqh,1.0625rem)] w-[clamp(0.75rem,3.7cqh,1.0625rem)] shrink-0 transition-colors [@container_(min-width:_190px)]:block ${isTransitioning ? '' : 'group-hover:text-white'}`} />
              <span className="min-w-0 truncate">
                <span className="[@container_(min-width:_240px)]:hidden">Inser.</span>
                <span className="hidden [@container_(min-width:_240px)]:inline">Inserisci</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {isEditMode ? (
        <div
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              onClick();
            }
          }}
          className="widget-card-handle absolute inset-0 rounded-[2rem] cursor-grab"
          aria-label={`Apri ${widget.title}`}
        />
      ) : null}
    </div>
  );
}
