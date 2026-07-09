import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock3, Info, Plus, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { IconGlyph } from './IconGlyph';

function cn(...values) {
  return twMerge(clsx(values));
}

function NarrativePill({ value, placeholder, onClick }) {
  return (
    <motion.button
      layout
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-white transition-colors hover:bg-white/20"
    >
      {value ? <IconGlyph name={value.icon} size={20} className="text-white/80" /> : null}
      <span className={cn('text-base lg:text-xl', value ? 'text-white' : 'text-white/65')}>
        {value ? value.label : placeholder}
      </span>
      <ChevronDown size={18} className="text-white/55" />
    </motion.button>
  );
}

function SequenceTimerPill({ label, value, onChange, onClear }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white">
      <Clock3 size={15} className="text-white/70" />
      <span className="text-[11px] uppercase tracking-[0.14em] text-white/60">
        {label}
      </span>
      <input
        type="number"
        min={1}
        step={1}
        value={value}
        onChange={(eventInput) =>
          onChange(Math.max(0, Number.parseInt(eventInput.target.value || '0', 10) || 0))
        }
        className="w-20 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm text-white focus:border-emerald-300/45 focus:outline-none"
      />
      <span className="text-xs text-white/60">s</span>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Rimuovi timer"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export function BuilderPanel({
  automationName,
  onAutomationNameChange,
  event,
  eventTime,
  onEventTimeChange,
  conditions,
  conditionLogic,
  onConditionLogicChange,
  onOpenConditionMenuAt,
  onAddCondition,
  onRemoveCondition,
  onClearConditions,
  action,
  showCondition,
  onOpenEventMenu,
  onOpenActionMenu,
  onShowCondition,
  eventPersistenceSeconds,
  onEventPersistenceSecondsChange,
  conditionPersistenceSeconds,
  onConditionPersistenceSecondsChange,
  actionDelaySeconds,
  onActionDelaySecondsChange,
  narrativePreview,
  canSave,
  onSave,
  onReset,
  editingId,
  onCancelEdit,
  connected,
  isSaving,
  saveError,
}) {
  const safeConditions = Array.isArray(conditions) ? conditions : [];
  const eventSupportsPersistence =
    event?.triggerType === 'state' || event?.triggerConfig?.trigger === 'state';
  const mainActionButtonClass = cn(
    'flex-1 rounded-[2rem] border px-8 py-4 text-base font-semibold transition-all bg-white/10 backdrop-blur-2xl',
    'border-emerald-300/45 text-emerald-100 shadow-[0_0_0_1px_rgba(110,231,183,0.22),0_0_32px_rgba(16,185,129,0.32)] hover:bg-emerald-400/18',
    'disabled:cursor-not-allowed disabled:opacity-50',
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="relative flex min-h-[360px] flex-col items-start justify-center gap-5 overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-800/40 p-8 lg:p-10 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_24px_64px_rgba(0,0,0,0.4)]">
        <div className="pointer-events-none absolute -left-32 -top-44 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative z-10 w-full space-y-4">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/60">
            Motore Causa-Effetto
          </div>
          <div>
            <label htmlFor="automation-name" className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">
              Nome automazione
            </label>
            <input
              id="automation-name"
              value={automationName}
              onChange={(eventInput) => onAutomationNameChange(eventInput.target.value)}
              placeholder="Es. Sicurezza ingresso serale"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white placeholder:text-white/35 focus:border-emerald-300/45 focus:outline-none"
            />
          </div>

          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4">
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-100/80">
                Frase Automazione
              </p>
              <span
                title={
                  connected
                    ? 'Questa automazione viene salvata direttamente su Home Assistant.'
                    : 'Per salvare direttamente su Home Assistant serve una connessione attiva.'
                }
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-400/12 text-emerald-100/80"
                aria-label="Informazioni salvataggio diretto"
              >
                <Info size={12} />
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-emerald-50/95">
              {narrativePreview}
            </p>
          </div>
          {saveError ? (
            <p className="rounded-xl border border-rose-300/30 bg-rose-500/12 px-4 py-3 text-sm text-rose-100">
              {saveError}
            </p>
          ) : null}
        </div>

        <motion.div
          layout
          className="relative z-10 flex w-full flex-col gap-4 text-xl font-medium tracking-tight lg:text-3xl"
        >
          <motion.div layout className="flex flex-wrap items-center gap-4">
            <span className="text-xl font-bold uppercase tracking-widest text-white/40">QUANDO</span>
            <NarrativePill value={event} placeholder="[ Seleziona Evento ]" onClick={onOpenEventMenu} />
            {eventSupportsPersistence && eventPersistenceSeconds > 0 ? (
              <SequenceTimerPill
                label="Per almeno"
                value={eventPersistenceSeconds}
                onChange={onEventPersistenceSecondsChange}
                onClear={() => onEventPersistenceSecondsChange(0)}
              />
            ) : null}
          </motion.div>
          {eventSupportsPersistence && eventPersistenceSeconds === 0 ? (
            <motion.button
              layout
              type="button"
              onClick={() => onEventPersistenceSecondsChange(30)}
              className="inline-flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white"
            >
              <Plus size={14} />
              Aggiungi "Per almeno..."
            </motion.button>
          ) : null}
          {event?.triggerType === 'time' ? (
            <motion.div layout className="ml-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <label className="block text-xs uppercase tracking-[0.16em] text-white/45">
                Orario
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(eventInput) => onEventTimeChange(eventInput.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-base text-white focus:border-emerald-300/45 focus:outline-none"
              />
            </motion.div>
          ) : null}
          {event?.triggerType === 'manual_event' ? (
            <motion.p layout className="ml-2 text-sm text-white/60">
              Trigger manuale: puoi avviarla dal pulsante "Esegui" e da qualsiasi bottone dashboard collegato.
            </motion.p>
          ) : null}
          {event?.triggerConfig?.trigger === 'event' && event?.triggerType !== 'manual_event' ? (
            <motion.p layout className="ml-2 text-sm text-white/60">
              Evento custom: deve essere inviato da una dashboard, webhook o integrazione esterna.
            </motion.p>
          ) : null}

          <AnimatePresence initial={false} mode="popLayout">
            {!showCondition ? (
              <motion.button
                key="show-condition"
                layout
                type="button"
                onClick={onShowCondition}
                className="mt-2 mb-2 inline-flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white"
              >
                <Plus size={16} />
                Aggiungi "Ma solo se..."
              </motion.button>
            ) : (
              <motion.div key="condition" layout className="flex w-full flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="liquid-segmented-control segmented-options min-w-[9rem] flex-1">
                    <button
                      type="button"
                      onClick={() => onConditionLogicChange('and')}
                      className={cn(
                        'w-full min-w-0 rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em] transition-colors',
                        conditionLogic === 'and'
                          ? 'liquid-segmented-option-active'
                          : 'liquid-segmented-option-inactive',
                      )}
                    >
                      AND
                    </button>
                    <button
                      type="button"
                      onClick={() => onConditionLogicChange('or')}
                      className={cn(
                        'w-full min-w-0 rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em] transition-colors',
                        conditionLogic === 'or'
                          ? 'liquid-segmented-option-active'
                          : 'liquid-segmented-option-inactive',
                      )}
                    >
                      OR
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={onClearConditions}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Rimuovi blocco
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {safeConditions.map((conditionItem, index) => (
                    <React.Fragment key={`${conditionItem.id}-${index}`}>
                      <span className="text-sm font-bold uppercase tracking-[0.16em] text-white/40">
                        {index === 0
                          ? 'MA SOLO SE'
                          : conditionLogic === 'and'
                            ? 'E ANCHE SE'
                            : 'OPPURE SE'}
                      </span>
                      <div className="flex items-center gap-2">
                        <NarrativePill
                          value={conditionItem}
                          placeholder="[ Seleziona Condizione ]"
                          onClick={() => onOpenConditionMenuAt(index)}
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveCondition(index)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                          aria-label="Rimuovi condizione"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </React.Fragment>
                  ))}
                  {safeConditions.length > 0 && conditionPersistenceSeconds > 0 ? (
                    <SequenceTimerPill
                      label="Valide da"
                      value={conditionPersistenceSeconds}
                      onChange={onConditionPersistenceSecondsChange}
                      onClear={() => onConditionPersistenceSecondsChange(0)}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={onAddCondition}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Plus size={14} />
                    Aggiungi "Ma solo se..."
                  </button>
                </div>
                {safeConditions.length > 0 && conditionPersistenceSeconds === 0 ? (
                  <button
                    type="button"
                    onClick={() => onConditionPersistenceSecondsChange(30)}
                    className="inline-flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white"
                  >
                    <Plus size={14} />
                    Aggiungi "Valide da..."
                  </button>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="flex flex-wrap items-center gap-4">
            <span className="text-xl font-bold uppercase tracking-widest text-white/40">ALLORA</span>
            <NarrativePill value={action} placeholder="[ Seleziona Azione ]" onClick={onOpenActionMenu} />
            {actionDelaySeconds > 0 ? (
              <SequenceTimerPill
                label="Dopo"
                value={actionDelaySeconds}
                onChange={onActionDelaySecondsChange}
                onClear={() => onActionDelaySecondsChange(0)}
              />
            ) : null}
          </motion.div>
          {actionDelaySeconds === 0 ? (
            <motion.button
              layout
              type="button"
              onClick={() => onActionDelaySecondsChange(10)}
              className="inline-flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white"
            >
              <Plus size={14} />
              Aggiungi "Dopo..."
            </motion.button>
          ) : null}
        </motion.div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canSave}
          onClick={onSave}
          className={mainActionButtonClass}
        >
          {isSaving
            ? 'Salvataggio...'
            : editingId
              ? 'Aggiorna su Home Assistant'
              : 'Salva su Home Assistant'}
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={onReset}
          className={mainActionButtonClass}
        >
          Reset
        </button>
        {editingId ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            Annulla modifica
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default BuilderPanel;
