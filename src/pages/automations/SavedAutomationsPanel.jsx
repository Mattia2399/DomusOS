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
    <section className="rounded-[1.7rem] border border-white/10 bg-neutral-800/40 p-5 backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Locale</p>
          <h2 className="text-lg font-semibold text-white">Automazioni create da noi</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
          {records.length}
        </span>
      </div>

      {records.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/55">
          Nessuna automazione salvata.
        </p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <motion.div
              key={record.id}
              layout
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/[0.075]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                  {record.enabled ? 'Attiva' : 'Disattivata'}
                </p>
                {record.haConfigId ? (
                  <span className="rounded-full border border-emerald-300/25 bg-emerald-400/12 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-emerald-100">
                    Home Assistant
                  </span>
                ) : (
                  <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-white/65">
                    Indice locale
                  </span>
                )}
              </div>
              <h3 className="mt-1 text-lg font-semibold text-white">{record.name}</h3>
              <p className="mt-1 text-sm text-white/60">{buildTitle(record)}</p>
              <p className="mt-2 text-xs text-white/45">
                Aggiornata: {formatDate(record.updatedAt)} | Ultima esecuzione:{' '}
                {formatDate(record.lastTriggeredAt)}
              </p>
              {record.event?.triggerType === 'manual_event' ? (
                <p className="mt-1 text-xs text-sky-100/80">
                  Trigger manuale evento: {record.manualEventType ?? 'n/d'}
                </p>
              ) : null}
              {record.event?.triggerType === 'time' && record.eventTime ? (
                <p className="mt-1 text-xs text-sky-100/80">
                  Orario pianificato: {record.eventTime}
                </p>
              ) : null}
              {record.haConfigId ? (
                <p className="mt-1 text-xs text-emerald-200/80">
                  Config ID: {record.haConfigId} | Entity: {record.linkedHaEntityId ?? 'in sincronizzazione'} | Stato HA:{' '}
                  {record.linkedHaState ?? 'n/d'} | Ultimo trigger HA:{' '}
                  {formatDate(record.linkedHaLastTriggered)}
                </p>
              ) : null}
              {record.missingInHaSince ? (
                <p className="mt-1 text-xs text-amber-200/85">
                  In attesa sincronizzazione da Home Assistant...
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!connected || !record.linkedHaEntityId}
                  onClick={() => onToggle(record)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/75 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {record.enabled ? 'Disattiva' : 'Attiva'}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(record)}
                  className="rounded-xl border border-sky-300/25 bg-sky-400/12 px-3 py-2 text-xs text-sky-100 hover:bg-sky-400/20"
                >
                  Modifica
                </button>
                <button
                  type="button"
                  disabled={deletingId === record.id}
                  onClick={() => onDelete(record.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-300/25 bg-rose-400/12 px-3 py-2 text-xs text-rose-100 hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="rounded-xl border border-emerald-300/25 bg-emerald-400/12 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
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
