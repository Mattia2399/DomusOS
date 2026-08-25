import React from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { buildTitle, formatDate } from './utils';

export function SavedAutomationsPanel({
  records,
  connected,
  runningId,
  deletingId,
  onToggle,
  onEdit,
  onDelete,
  onRun,
}) {
  return (
    <section className="rounded-[1.7rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-glass-soft)] p-5 backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ui-text-tertiary)]">Locale</p>
          <h2 className="text-lg font-semibold text-[color:var(--ui-text-primary)]">Automazioni create da noi</h2>
        </div>
        <span className="rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] px-3 py-1 text-xs text-[color:var(--ui-text-secondary)]">
          {records.length}
        </span>
      </div>

      {records.length === 0 ? (
        <p className="rounded-2xl border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] p-4 text-[color:var(--ui-text-tertiary)]">
          Nessuna automazione salvata.
        </p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <motion.div
              key={record.id}
              layout
              className="rounded-2xl border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] p-4 transition-colors hover:bg-[color:var(--ui-fill-secondary)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--ui-text-tertiary)]">
                  {record.enabled ? 'Attiva' : 'Disattivata'}
                </p>
                {record.haConfigId ? (
                  <span className="rounded-full border border-emerald-300/25 bg-emerald-400/12 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-[color:var(--ui-success)]">
                    Home Assistant
                  </span>
                ) : (
                  <span className="rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-secondary)] px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-[color:var(--ui-text-secondary)]">
                    Indice locale
                  </span>
                )}
              </div>
              <h3 className="mt-1 text-lg font-semibold text-[color:var(--ui-text-primary)]">{record.name}</h3>
              <p className="mt-1 text-sm text-[color:var(--ui-text-secondary)]">{buildTitle(record)}</p>
              <p className="mt-2 text-xs text-[color:var(--ui-text-tertiary)]">
                Aggiornata: {formatDate(record.updatedAt)} | Ultima esecuzione:{' '}
                {formatDate(record.lastTriggeredAt)}
              </p>
              {record.event?.triggerType === 'manual_event' ? (
                <p className="mt-1 text-xs text-[color:var(--ui-info)]">
                  Trigger manuale evento: {record.manualEventType ?? 'n/d'}
                </p>
              ) : null}
              {record.event?.triggerType === 'time' && record.eventTime ? (
                <p className="mt-1 text-xs text-[color:var(--ui-info)]">
                  Orario pianificato: {record.eventTime}
                </p>
              ) : null}
              {record.haConfigId ? (
                <p className="mt-1 text-xs text-[color:var(--ui-success)]">
                  Config ID: {record.haConfigId} | Entity: {record.linkedHaEntityId ?? 'in sincronizzazione'} | Stato HA:{' '}
                  {record.linkedHaState ?? 'n/d'} | Ultimo trigger HA:{' '}
                  {formatDate(record.linkedHaLastTriggered)}
                </p>
              ) : null}
              {record.missingInHaSince ? (
                <p className="mt-1 text-xs text-[color:var(--ui-warning)]">
                  In attesa sincronizzazione da Home Assistant...
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!connected || !record.linkedHaEntityId}
                  onClick={() => onToggle(record)}
                  className="rounded-xl border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] px-3 py-2 text-xs text-[color:var(--ui-text-secondary)] hover:bg-[color:var(--ui-fill-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {record.enabled ? 'Disattiva' : 'Attiva'}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(record)}
                  className="rounded-xl border border-sky-300/25 bg-sky-400/12 px-3 py-2 text-xs text-[color:var(--ui-info)] hover:bg-sky-400/20"
                >
                  Modifica
                </button>
                <button
                  type="button"
                  disabled={deletingId === record.id}
                  onClick={() => onDelete(record.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-300/25 bg-rose-400/12 px-3 py-2 text-xs text-[color:var(--ui-danger)] hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  {deletingId === record.id ? 'Eliminazione...' : 'Elimina su HA'}
                </button>
                <button
                  type="button"
                  disabled={
                    !connected ||
                    !record.enabled ||
                    (record.event?.triggerType !== 'manual_event' && !record.linkedHaEntityId) ||
                    runningId === record.id
                  }
                  onClick={() => onRun(record)}
                  className="rounded-xl border border-emerald-300/25 bg-emerald-400/12 px-3 py-2 text-xs text-[color:var(--ui-success)] hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {runningId === record.id
                    ? 'Esecuzione...'
                    : record.event?.triggerType === 'manual_event'
                      ? 'Invia Trigger'
                      : 'Esegui'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

export default SavedAutomationsPanel;
