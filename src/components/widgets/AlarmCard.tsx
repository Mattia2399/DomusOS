import React, { useMemo } from 'react';
import { House, Moon, Plane, Shield, ShieldAlert, ShieldCheck, ShieldOff, ShieldPlus } from 'lucide-react';
import type { Widget } from '../../types/dashboardModels';
import type { MockEntityState } from '../../types/ha';
import { useCardSize } from './useCardSize';
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

type AlarmSurface = {
  background: string;
  border: string;
  glow: string;
  iconSurface: string;
  chipSurface: string;
};

type ArmChoice = {
  mode: AlarmQuickArmMode;
  label: string;
  icon: React.ReactNode;
};

function resolveAlarmSurface(state: string): AlarmSurface {
  if (state === 'disarmed') {
    return {
      background: 'bg-white/5',
      border: 'border-white/10',
      glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_22px_rgba(0,0,0,0.25)]',
      iconSurface: 'bg-blue-500/20 border border-blue-300/35',
      chipSurface: 'bg-white/8 border border-white/12',
    };
  }
  if (state === 'armed_home') {
    return {
      background: 'bg-emerald-500/16',
      border: 'border-emerald-300/35',
      glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_22px_rgba(16,136,91,0.25)]',
      iconSurface: 'bg-white/20 border border-white/25',
      chipSurface: 'bg-white/10 border border-white/16',
    };
  }
  if (state === 'armed_away') {
    return {
      background: 'bg-blue-500/16',
      border: 'border-blue-300/35',
      glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_22px_rgba(37,99,235,0.26)]',
      iconSurface: 'bg-white/20 border border-white/25',
      chipSurface: 'bg-white/10 border border-white/16',
    };
  }
  if (state === 'armed_night') {
    return {
      background: 'bg-indigo-500/16',
      border: 'border-indigo-300/35',
      glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_22px_rgba(79,70,229,0.26)]',
      iconSurface: 'bg-white/20 border border-white/25',
      chipSurface: 'bg-white/10 border border-white/16',
    };
  }
  if (state === 'armed_vacation') {
    return {
      background: 'bg-amber-500/16',
      border: 'border-amber-300/35',
      glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_22px_rgba(217,119,6,0.25)]',
      iconSurface: 'bg-white/22 border border-white/24',
      chipSurface: 'bg-white/10 border border-white/16',
    };
  }
  if (state === 'armed_custom_bypass') {
    return {
      background: 'bg-cyan-500/16',
      border: 'border-cyan-300/35',
      glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_22px_rgba(8,145,178,0.25)]',
      iconSurface: 'bg-white/18 border border-white/24',
      chipSurface: 'bg-white/10 border border-white/16',
    };
  }
  if (state === 'triggered') {
    return {
      background: 'bg-rose-500/20',
      border: 'border-rose-300/45',
      glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_22px_rgba(225,29,72,0.28)]',
      iconSurface: 'bg-white/24 border border-white/28',
      chipSurface: 'bg-white/12 border border-white/18',
    };
  }
  return {
    background: 'bg-orange-500/16',
    border: 'border-orange-300/35',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_22px_rgba(234,88,12,0.25)]',
    iconSurface: 'bg-white/20 border border-white/24',
    chipSurface: 'bg-white/10 border border-white/16',
  };
}

function resolveAlarmIcon(state: string) {
  if (state === 'disarmed') {
    return ShieldOff;
  }
  if (state === 'triggered') {
    return ShieldAlert;
  }
  if (state.startsWith('armed_')) {
    return ShieldCheck;
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
  const { ref: cardRef, density: cardDensity, hasSize: hasCardSize } = useCardSize({
    tinyWidth: 245,
    tinyHeight: 145,
    compactWidth: 330,
    compactHeight: 210,
  });
  const rawAttributes = liveEntity?.rawAttributes;
  const resolvedState = normalizeAlarmState(
    toTrimmedString(liveEntity?.state) ??
      toTrimmedString(liveEntity?.stateLabel) ??
      widget.status,
  );
  const stateLabel = getAlarmStateLabel(resolvedState);
  const supportedFeatures = resolveAlarmSupportedFeatures(liveEntity);
  const armChoices = useMemo(() => resolveArmChoices(supportedFeatures), [supportedFeatures]);
  const primaryArmChoice = armChoices[0];
  const surface = resolveAlarmSurface(resolvedState);
  const StateIcon = resolveAlarmIcon(resolvedState);
  const codeArmRequired = typeof rawAttributes?.code_arm_required === 'boolean' ? rawAttributes.code_arm_required : false;
  const localUnlockEnabled = (widget.alarmUnlockCode ?? '').trim().length > 0;
  const quickActionsLocked = codeArmRequired || localUnlockEnabled;
  const isLayoutCompact = widget.layout.h <= 1 || widget.layout.w <= 1;
  const isTinyCard = hasCardSize && cardDensity === 'tiny';
  const isCompact = isLayoutCompact || (hasCardSize && cardDensity !== 'regular');
  const cardRadiusClass = isCompact ? 'rounded-[1.55rem]' : 'rounded-3xl';
  const cardPaddingClass = isTinyCard ? 'px-2.5 py-2' : isCompact ? 'px-3 py-2' : 'px-3 py-2.5';
  const iconShellClass = isTinyCard ? 'h-7 w-7' : isCompact ? 'h-8 w-8' : 'h-9 w-9';
  const iconSize = isTinyCard ? 13 : isCompact ? 14 : 16;
  const compactButtonClass = isTinyCard
    ? 'h-7 rounded-[0.9rem] px-2 text-[10px]'
    : 'h-8 rounded-[1rem] px-2.5 text-[11px]';
  const regularButtonClass = isCompact ? 'h-8 rounded-2xl px-3 text-[11px]' : 'h-9 rounded-2xl px-3.5 text-xs';
  const compactTitleClass = isTinyCard
    ? 'truncate text-[0.88rem] leading-tight font-normal tracking-tight text-white'
    : 'truncate text-[0.97rem] leading-tight font-normal tracking-tight text-white';
  const compactSubtitleClass = isTinyCard
    ? 'mt-0.5 truncate text-[0.68rem] leading-none text-white/76'
    : 'mt-0.5 truncate text-[0.74rem] leading-none text-white/76';
  const regularTitleClass = isCompact
    ? 'truncate text-[0.98rem] leading-[1.05] font-normal tracking-tight text-white'
    : 'truncate text-[1.05rem] leading-[1.05] font-normal tracking-tight text-white';
  const regularSubtitleClass = isCompact
    ? 'mt-0.5 truncate text-[0.74rem] leading-none text-white/78'
    : 'mt-0.5 truncate text-[0.82rem] leading-none text-white/78';
  const disarmLabel = isTinyCard ? 'Disins.' : 'Disinserisci';
  const armLabel = isTinyCard ? 'Inser.' : 'Inserisci';

  const handleQuickDisarm = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (quickActionsLocked) {
      onClick();
      return;
    }
    onQuickDisarm?.();
  };

  const handleQuickArm = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (quickActionsLocked) {
      onClick();
      return;
    }
    if (primaryArmChoice) {
      onQuickArm?.(primaryArmChoice.mode);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden ${cardRadiusClass} ${
        isSelected ? 'selection-corners' : ''
      }`}
      onClick={(event) => {
        if (isEditMode) {
          return;
        }
        event.stopPropagation();
        onClick();
      }}
    >
      <div
        className={`relative h-full w-full min-h-0 min-w-0 overflow-hidden ${cardRadiusClass} border ${surface.background} ${surface.border} ${surface.glow} ${cardPaddingClass} flex ${
          isCompact ? 'items-center' : 'flex-col'
        } ${
          isEditMode ? 'pointer-events-none' : ''
        }`}
      >
        <div className={`pointer-events-none absolute inset-0 ${cardRadiusClass} bg-[radial-gradient(95%_78%_at_0%_0%,rgba(255,255,255,0.16),transparent_64%)]`} />

        {isCompact ? (
          <div className={`relative flex w-full items-center min-w-0 ${isTinyCard ? 'gap-1.5' : 'gap-2'}`}>
            <div className={`${iconShellClass} shrink-0 rounded-full ${surface.iconSurface} flex items-center justify-center text-white`}>
              <StateIcon size={iconSize} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={compactTitleClass}>{widget.title}</p>
              <p className={compactSubtitleClass}>{stateLabel}</p>
            </div>
            <div className={`shrink-0 flex items-center ${isTinyCard ? 'gap-0.5' : 'gap-1'}`}>
              <button
                type="button"
                onClick={handleQuickDisarm}
                className={`${compactButtonClass} ${surface.chipSurface} flex items-center justify-center whitespace-nowrap font-medium text-white/85 transition-colors ${
                  quickActionsLocked ? 'opacity-60 cursor-pointer' : 'hover:bg-white/15 active:scale-[0.98]'
                }`}
                title={quickActionsLocked ? 'Inserisci il codice nel pannello contestuale' : 'Disinserisci'}
                aria-label="Disinserisci allarme"
              >
                {disarmLabel}
              </button>
              <button
                type="button"
                onClick={handleQuickArm}
                className={`${compactButtonClass} ${surface.chipSurface} flex items-center justify-center whitespace-nowrap font-medium text-white/85 transition-colors ${
                  quickActionsLocked ? 'opacity-60 cursor-pointer' : 'hover:bg-white/15 active:scale-[0.98]'
                }`}
                title={quickActionsLocked ? 'Inserisci il codice nel pannello contestuale' : `Inserisci ${primaryArmChoice?.label ?? 'allarme'}`}
                aria-label={`Inserisci ${primaryArmChoice?.label ?? 'allarme'}`}
              >
                {armLabel}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative flex items-center min-w-0 gap-2">
              <div className={`${iconShellClass} shrink-0 rounded-full ${surface.iconSurface} flex items-center justify-center text-white`}>
                <StateIcon size={iconSize} />
              </div>
              <div className="min-w-0">
                <p className={regularTitleClass}>{widget.title}</p>
                <p className={regularSubtitleClass}>{stateLabel}</p>
              </div>
            </div>

            <div className="relative mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickDisarm}
                className={`${regularButtonClass} ${surface.chipSurface} flex items-center justify-center whitespace-nowrap font-medium text-white/85 transition-colors ${
                  quickActionsLocked ? 'opacity-60 cursor-pointer' : 'hover:bg-white/15 active:scale-[0.98]'
                }`}
                title={quickActionsLocked ? 'Inserisci il codice nel pannello contestuale' : 'Disinserisci'}
                aria-label="Disinserisci allarme"
              >
                <ShieldOff size={13} className="mr-1" />
                {disarmLabel}
              </button>
              <button
                type="button"
                onClick={handleQuickArm}
                className={`${regularButtonClass} ${surface.chipSurface} flex items-center justify-center whitespace-nowrap font-medium text-white/85 transition-colors ${
                  quickActionsLocked ? 'opacity-60 cursor-pointer' : 'hover:bg-white/15 active:scale-[0.98]'
                }`}
                title={quickActionsLocked ? 'Inserisci il codice nel pannello contestuale' : `Inserisci ${primaryArmChoice?.label ?? 'allarme'}`}
                aria-label={`Inserisci ${primaryArmChoice?.label ?? 'allarme'}`}
              >
                {primaryArmChoice?.icon ?? <Shield size={13} />}
                <span className="ml-1">{armLabel}</span>
              </button>
            </div>
          </>
        )}
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
          className={`absolute inset-0 ${cardRadiusClass} widget-card-handle cursor-grab`}
          aria-label={`Apri ${widget.title}`}
        />
      ) : null}
    </div>
  );
}
