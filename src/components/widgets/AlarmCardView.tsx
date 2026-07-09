import React from 'react';
import {
  House,
  Moon,
  Plane,
  Shield,
  ShieldAlert,
  ShieldBan,
  ShieldEllipsis,
  ShieldPlus,
  ShieldQuestion,
  X,
} from 'lucide-react';
import type { AlarmArmMode, AlarmCardModel, AlarmCardTone } from './alarmCardModel';
import type { WidgetDisplayVariant } from './widgetDisplayVariant';

type AlarmCardViewProps = {
  model: AlarmCardModel;
  layoutVariant: WidgetDisplayVariant;
  isSelected: boolean;
  isEditMode: boolean;
  isModeMenuOpen: boolean;
  selectedArmMode?: AlarmArmMode;
  rootRef: React.Ref<HTMLDivElement>;
  onOpen: () => void;
  onOpenModeMenu: () => void;
  onCloseModeMenu: () => void;
  onSelectArmMode: (mode: AlarmArmMode) => void;
  onConfirmArm: () => void;
  onDisarm: () => void;
  onArm: (mode: AlarmArmMode) => void;
};

const MODE_DESCRIPTIONS: Record<AlarmArmMode, string> = {
  home: 'Protezione perimetrale',
  away: 'Protezione completa',
  night: 'Protezione silenziosa',
  vacation: 'Protezione prolungata',
  custom_bypass: 'Esclusioni attive',
};

function resolveStateIcon(model: AlarmCardModel) {
  if (model.isTriggered) return ShieldAlert;
  if (model.isTransitioning) return ShieldEllipsis;
  if (model.isUnavailable) return ShieldQuestion;
  if (model.state === 'disarmed') return ShieldBan;
  return Shield;
}

function resolveModeIcon(mode: AlarmArmMode, size = 17) {
  if (mode === 'home') return <House size={size} />;
  if (mode === 'night') return <Moon size={size} />;
  if (mode === 'vacation') return <Plane size={size} />;
  if (mode === 'custom_bypass') return <ShieldPlus size={size} />;
  return <Shield size={size} />;
}

function resolveAccent(tone: AlarmCardTone) {
  if (tone === 'danger') return {
    surface: 'bg-[linear-gradient(145deg,rgba(98,36,54,0.52)_0%,rgba(50,24,35,0.48)_46%,rgba(255,255,255,0.026)_100%)]',
    wash: 'bg-[radial-gradient(78%_70%_at_12%_0%,rgba(251,113,133,0.20),transparent_62%),radial-gradient(70%_75%_at_100%_100%,rgba(244,63,94,0.14),transparent_68%),radial-gradient(80%_70%_at_8%_0%,rgba(255,255,255,0.10),transparent_64%)]',
    line: 'via-rose-300/90', glow: 'bg-rose-400/24', icon: 'text-rose-200', action: 'bg-rose-400/[0.16] border-rose-200/24 hover:bg-rose-400/[0.22]', progress: 'bg-rose-300/80', selectedMode: 'border-rose-200/30 bg-rose-300/[0.16] text-rose-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_3px_12px_rgba(244,63,94,0.18)]',
  };
  if (tone === 'home') return {
    surface: 'bg-[linear-gradient(145deg,rgba(35,88,75,0.58)_0%,rgba(24,63,58,0.46)_45%,rgba(255,255,255,0.026)_100%)]',
    wash: 'bg-[radial-gradient(78%_70%_at_12%_0%,rgba(110,231,183,0.18),transparent_62%),radial-gradient(70%_75%_at_100%_100%,rgba(16,185,129,0.12),transparent_68%),radial-gradient(80%_70%_at_8%_0%,rgba(255,255,255,0.10),transparent_64%)]',
    line: 'via-emerald-300/82', glow: 'bg-emerald-400/20', icon: 'text-emerald-200', action: 'bg-emerald-300/[0.11] border-emerald-100/14 hover:bg-emerald-300/[0.16]', progress: 'bg-emerald-300/76', selectedMode: 'border-emerald-200/28 bg-emerald-300/[0.15] text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_3px_12px_rgba(16,185,129,0.16)]',
  };
  if (tone === 'away') return {
    surface: 'bg-[linear-gradient(145deg,rgba(34,70,112,0.58)_0%,rgba(25,45,78,0.46)_46%,rgba(255,255,255,0.026)_100%)]',
    wash: 'bg-[radial-gradient(78%_70%_at_12%_0%,rgba(147,197,253,0.19),transparent_62%),radial-gradient(70%_75%_at_100%_100%,rgba(59,130,246,0.13),transparent_68%),radial-gradient(80%_70%_at_8%_0%,rgba(255,255,255,0.10),transparent_64%)]',
    line: 'via-blue-300/84', glow: 'bg-blue-400/21', icon: 'text-blue-200', action: 'bg-blue-300/[0.11] border-blue-100/14 hover:bg-blue-300/[0.16]', progress: 'bg-blue-300/78', selectedMode: 'border-blue-200/28 bg-blue-300/[0.15] text-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_3px_12px_rgba(59,130,246,0.16)]',
  };
  if (tone === 'night') return {
    surface: 'bg-[linear-gradient(145deg,rgba(55,52,116,0.56)_0%,rgba(34,32,82,0.48)_46%,rgba(255,255,255,0.026)_100%)]',
    wash: 'bg-[radial-gradient(78%_70%_at_12%_0%,rgba(165,180,252,0.19),transparent_62%),radial-gradient(70%_75%_at_100%_100%,rgba(99,102,241,0.14),transparent_68%),radial-gradient(80%_70%_at_8%_0%,rgba(255,255,255,0.10),transparent_64%)]',
    line: 'via-indigo-300/84', glow: 'bg-indigo-400/22', icon: 'text-indigo-200', action: 'bg-indigo-300/[0.11] border-indigo-100/14 hover:bg-indigo-300/[0.16]', progress: 'bg-indigo-300/78', selectedMode: 'border-indigo-200/28 bg-indigo-300/[0.15] text-indigo-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_3px_12px_rgba(99,102,241,0.17)]',
  };
  if (tone === 'vacation') return {
    surface: 'bg-[linear-gradient(145deg,rgba(101,70,35,0.56)_0%,rgba(72,45,24,0.46)_46%,rgba(255,255,255,0.026)_100%)]',
    wash: 'bg-[radial-gradient(78%_70%_at_12%_0%,rgba(252,211,77,0.18),transparent_62%),radial-gradient(70%_75%_at_100%_100%,rgba(245,158,11,0.13),transparent_68%),radial-gradient(80%_70%_at_8%_0%,rgba(255,255,255,0.10),transparent_64%)]',
    line: 'via-amber-300/80', glow: 'bg-amber-400/20', icon: 'text-amber-200', action: 'bg-amber-300/[0.11] border-amber-100/14 hover:bg-amber-300/[0.16]', progress: 'bg-amber-300/76', selectedMode: 'border-amber-200/28 bg-amber-300/[0.15] text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_3px_12px_rgba(245,158,11,0.16)]',
  };
  if (tone === 'bypass') return {
    surface: 'bg-[linear-gradient(145deg,rgba(28,86,101,0.54)_0%,rgba(22,61,73,0.46)_46%,rgba(255,255,255,0.026)_100%)]',
    wash: 'bg-[radial-gradient(78%_70%_at_12%_0%,rgba(103,232,249,0.17),transparent_62%),radial-gradient(70%_75%_at_100%_100%,rgba(6,182,212,0.12),transparent_68%),radial-gradient(80%_70%_at_8%_0%,rgba(255,255,255,0.10),transparent_64%)]',
    line: 'via-cyan-300/80', glow: 'bg-cyan-400/19', icon: 'text-cyan-200', action: 'bg-cyan-300/[0.10] border-cyan-100/14 hover:bg-cyan-300/[0.15]', progress: 'bg-cyan-300/76', selectedMode: 'border-cyan-200/28 bg-cyan-300/[0.14] text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_3px_12px_rgba(6,182,212,0.15)]',
  };
  return {
    surface: 'bg-[linear-gradient(145deg,rgba(255,255,255,0.078),rgba(255,255,255,0.024))]',
    wash: 'bg-[radial-gradient(80%_70%_at_8%_0%,rgba(255,255,255,0.10),transparent_64%)]',
    line: 'via-white/36', glow: 'bg-white/[0.07]', icon: 'text-white/52', action: 'bg-white/[0.075] border-white/[0.10] hover:bg-white/[0.12]', progress: 'bg-white/50', selectedMode: 'border-white/24 bg-white/[0.14] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.17),0_3px_10px_rgba(0,0,0,0.16)]',
  };
}

function stateCaption(model: AlarmCardModel) {
  if (model.isTriggered) return 'Richiede attenzione immediata';
  if (model.isTransitioning) return 'Aggiornamento del sistema in corso';
  if (model.isUnavailable) return 'Connessione al sistema non disponibile';
  const active = model.supportedModes.find((mode) => mode.id === model.activeMode);
  if (active) return MODE_DESCRIPTIONS[active.id];
  return 'Sistema non inserito';
}

function scrollModesWithWheel(event: React.WheelEvent<HTMLDivElement>) {
  const rail = event.currentTarget;
  const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
  if (maxScrollLeft <= 0) return;

  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  if (delta === 0) return;

  const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, rail.scrollLeft + delta));
  if (nextScrollLeft !== rail.scrollLeft) {
    event.preventDefault();
    rail.scrollLeft = nextScrollLeft;
  }
}

export function AlarmCardView({
  model,
  layoutVariant,
  isSelected,
  isEditMode,
  isModeMenuOpen,
  selectedArmMode,
  rootRef,
  onOpen,
  onOpenModeMenu,
  onCloseModeMenu,
  onSelectArmMode,
  onConfirmArm,
  onDisarm,
  onArm,
}: AlarmCardViewProps) {
  const isCompact = layoutVariant === 'compact' || layoutVariant === 'mini';
  const isFull = layoutVariant === 'full';
  const StateIcon = resolveStateIcon(model);
  const accent = resolveAccent(model.tone);
  const radiusClass = isCompact ? 'rounded-[1.2rem]' : isFull ? 'rounded-[2rem]' : 'rounded-[1.85rem]';
  const selectedMode = selectedArmMode ? model.supportedModes.find((mode) => mode.id === selectedArmMode) : undefined;
  const selectedIsActive = Boolean(selectedArmMode && selectedArmMode === model.activeMode);

  const actionLabel = model.isTriggered
    ? 'Disattiva'
    : model.isTransitioning
      ? 'Comando in corso'
      : model.isUnavailable || model.primaryAction === 'none'
        ? 'Non disponibile'
        : model.state === 'disarmed'
          ? isFull
            ? `Inserisci ${selectedMode?.label ?? 'sistema'}`
            : 'Inserisci'
          : isFull && selectedArmMode && !selectedIsActive
            ? `Passa a ${selectedMode?.label ?? 'modalità'}`
            : 'Disinserisci';

  const runAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (model.isTriggered || (model.state !== 'disarmed' && (!isFull || selectedIsActive))) {
      onDisarm();
      return;
    }
    if (isFull) {
      onConfirmArm();
      return;
    }
    onOpenModeMenu();
  };

  const actionButton = (compact = false) => (
    <button
      type="button"
      onClick={runAction}
      disabled={model.primaryAction === 'none' || model.isTransitioning}
      className={`${compact ? 'h-[2.36rem] text-[0.72rem]' : isFull ? 'h-9 text-[0.74rem]' : 'h-10 text-xs'} flex w-full shrink-0 items-center justify-center rounded-full border px-3 font-semibold text-white/86 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl transition active:scale-[0.985] disabled:cursor-default disabled:opacity-45 ${accent.action}`}
      aria-label={actionLabel}
    >
      <span className="truncate">{actionLabel}</span>
    </button>
  );

  return (
    <div
      ref={rootRef}
      data-alarm-variant={isCompact ? 'compact' : isFull ? 'full' : 'standard'}
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden ${radiusClass} ${isSelected ? 'selection-corners' : ''}`}
      onClick={(event) => {
        if (isEditMode) return;
        event.stopPropagation();
        onOpen();
      }}
      aria-label={`${model.title}, ${model.stateLabel}`}
      aria-busy={model.isTransitioning || undefined}
    >
      <div className={`relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border border-white/[0.10] ${accent.surface} shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_14px_34px_rgba(0,0,0,0.22)] backdrop-blur-[28px] backdrop-saturate-[1.35] ${radiusClass} ${isCompact ? 'p-3' : 'p-3.5'} ${isEditMode ? 'pointer-events-none' : ''}`}>
        <div className={`pointer-events-none absolute inset-x-[12%] top-0 h-px bg-gradient-to-r from-transparent ${accent.line} to-transparent`} />
        <div className={`pointer-events-none absolute -top-8 left-1/2 h-16 w-36 -translate-x-1/2 rounded-full blur-[30px] ${accent.glow}`} />
        <div className={`pointer-events-none absolute inset-0 ${radiusClass} ${accent.wash}`} />

        {model.isTransitioning ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-white/[0.04]">
            <div className={`h-full w-1/2 animate-[alarm-progress_1.4s_ease-in-out_infinite] rounded-full ${accent.progress}`} />
          </div>
        ) : null}

        {isCompact ? (
          <>
            <div className="relative z-10 flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]">
                <StateIcon size={18} className={accent.icon} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-[0.86rem] font-semibold leading-tight text-white">{model.title}</h2>
                <p className={`mt-0.5 truncate text-[0.68rem] font-medium ${model.isTriggered ? 'text-rose-200' : 'text-white/48'}`}>{model.stateLabel}</p>
              </div>
            </div>
            <div className="relative z-10 mt-auto">{actionButton(true)}</div>
          </>
        ) : (
          <>
            <div className="relative z-10 flex min-w-0 items-center justify-between gap-3">
              <span className="min-w-0 truncate text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white/44">{isFull ? 'Stato sistema' : model.title}</span>
              <StateIcon size={17} className={`shrink-0 ${accent.icon} ${model.isTransitioning ? 'animate-pulse' : ''}`} />
            </div>

            <div className={`relative z-10 ${isFull ? 'mt-2.5' : 'my-auto'} min-w-0`}>
              <p className={`${isFull ? 'text-[1.48rem]' : 'text-[1.35rem]'} truncate font-bold leading-none tracking-[-0.035em] text-white`}>{model.stateLabel.toUpperCase()}</p>
              <p className={`${isFull ? 'mt-1' : 'mt-1.5'} truncate text-[0.68rem] font-medium text-white/42`}>{stateCaption(model)}</p>
            </div>

            {isFull && !model.isTriggered && !model.isUnavailable && model.supportedModes.length > 0 ? (
              <div className="liquid-segmented-control relative z-10 mt-2.5">
                <div
                  className="grid w-full grid-flow-col gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [touch-action:pan-x] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
                  style={{ gridAutoColumns: 'minmax(2.35rem, 1fr)' }}
                  onWheel={scrollModesWithWheel}
                >
                  {model.supportedModes.map((mode) => {
                    const selected = selectedArmMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        disabled={model.isTransitioning}
                        title={mode.label}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectArmMode(mode.id);
                        }}
                        className={`flex h-8 w-full min-w-0 items-center justify-center rounded-full border px-1.5 transition-all active:scale-[0.95] disabled:cursor-default disabled:opacity-45 ${
                          selected
                            ? 'liquid-segmented-option-active border-transparent'
                            : 'liquid-segmented-option-inactive border-transparent'
                        }`}
                        aria-pressed={selected}
                        aria-label={`Seleziona modalità ${mode.label}`}
                      >
                        {resolveModeIcon(mode.id, 15)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {isFull && !model.isTriggered ? (
              <div className="relative z-10 mt-2 space-y-1 text-[0.6rem] leading-tight text-white/42">
                <p className="truncate"><span className="text-white/58">Ultima modifica:</span> {model.changedBy ?? 'Sincronizzato'}</p>
                <p className="truncate"><span className="text-white/58">Sicurezza:</span> {model.armActionLocked || model.disarmActionLocked ? 'Autorizzazione richiesta' : 'Accesso rapido'}</p>
              </div>
            ) : null}

            <div className={`relative z-10 ${isFull ? 'mt-auto pt-2.5' : 'mt-auto border-t border-white/[0.06] pt-3'}`}>{actionButton()}</div>
          </>
        )}

        {isModeMenuOpen ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Scegli modalità allarme"
            tabIndex={-1}
            className={`absolute inset-0 z-40 flex min-h-0 flex-col overflow-hidden ${radiusClass} border border-white/[0.24] bg-[#080d16]/90 bg-[linear-gradient(145deg,rgba(72,78,92,0.84)_0%,rgba(27,32,43,0.93)_38%,rgba(7,11,18,0.98)_100%)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.34),inset_0_-1px_0_rgba(255,255,255,0.08),0_18px_44px_rgba(4,8,18,0.42)] backdrop-blur-[30px] backdrop-saturate-[1.45]`}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onCloseModeMenu();
            }}
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_68%_at_12%_0%,rgba(255,255,255,0.24),transparent_58%),radial-gradient(70%_72%_at_100%_100%,rgba(255,255,255,0.08),transparent_66%)]" />
            <div aria-hidden="true" className="pointer-events-none absolute -left-[12%] -top-[34%] h-[62%] w-[72%] rotate-[-10deg] rounded-[50%] border border-white/[0.10] bg-white/[0.08] blur-[1px]" />
            <div className="relative z-10 mb-1.5 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs font-semibold tracking-[-0.01em] text-white/94">Scegli la modalità:</p>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.22] bg-white/[0.11] text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.26),0_5px_16px_rgba(0,0,0,0.12)] backdrop-blur-xl transition hover:bg-white/[0.18] hover:text-white active:scale-95"
                onClick={(event) => {
                  event.stopPropagation();
                  onCloseModeMenu();
                }}
                aria-label="Chiudi modalità allarme"
              >
                <X size={15} />
              </button>
            </div>
            <div className="relative z-10 grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-1.5 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {model.supportedModes.map((mode) => {
                const active = selectedArmMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    className={`flex min-h-[2.6rem] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-1 text-center transition-all active:scale-[0.96] ${
                      active
                        ? 'border-white/40 bg-white/[0.22] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.34),inset_0_-1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(0,0,0,0.16)] backdrop-blur-2xl'
                        : 'border-white/[0.14] bg-white/[0.075] text-white/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl hover:border-white/[0.24] hover:bg-white/[0.13] hover:text-white'
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectArmMode(mode.id);
                      onArm(mode.id);
                    }}
                    aria-pressed={active}
                    aria-label={`Inserisci modalità ${mode.label}`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center">{resolveModeIcon(mode.id, 17)}</span>
                    <span className="max-w-full truncate text-[0.64rem] font-semibold">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {isEditMode ? (
        <div
          role="button"
          tabIndex={0}
          className={`widget-card-handle absolute inset-0 cursor-grab ${radiusClass}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              onOpen();
            }
          }}
          aria-label={`Apri ${model.title}`}
        />
      ) : null}
    </div>
  );
}
