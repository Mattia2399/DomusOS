import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { IconGlyph } from './IconGlyph';
import { normalizeName } from './utils';

function cn(...values) {
  return twMerge(clsx(values));
}

export function SelectionModal({
  isOpen,
  kind,
  title,
  options,
  connected,
  onSelect,
  onClose,
}) {
  const [query, setQuery] = React.useState('');
  const [sourceFilter, setSourceFilter] = React.useState('all');

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    setQuery('');
    if (kind === 'event' || kind === 'action') {
      setSourceFilter(connected ? 'ha' : 'template');
    } else {
      setSourceFilter('all');
    }
  }, [connected, isOpen, kind]);

  const normalizedQuery = normalizeName(query);

  const filteredOptions = React.useMemo(() => {
    const filtered = options.filter((item) => {
      if (sourceFilter === 'template' && item.source !== 'template') {
        return false;
      }
      if (sourceFilter === 'ha' && item.source !== 'ha') {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const haystack = normalizeName(
        `${item.label} ${item.description ?? ''} ${item.keywords ?? ''} ${item.group ?? ''}`,
      );
      return haystack.includes(normalizedQuery);
    });

    return filtered.sort((first, second) => {
      if (sourceFilter === 'all' && first.source !== second.source) {
        return first.source === 'template' ? -1 : 1;
      }
      return first.label.localeCompare(second.label, 'it-IT');
    });
  }, [normalizedQuery, options, sourceFilter]);

  const templateOptions = filteredOptions.filter((item) => item.source !== 'ha');
  const haOptions = filteredOptions.filter((item) => item.source === 'ha');

  const optionKindLabel =
    kind === 'event' ? 'evento' : kind === 'action' ? 'azione' : 'condizione';
  const searchPlaceholder =
    kind === 'event'
      ? 'Cerca evento: porta, movimento, tramonto...'
      : kind === 'action'
        ? 'Cerca azione: luci, allarme, clima...'
        : 'Cerca condizione...';

  const renderOption = (item) => (
    <button
      key={item.id}
      type="button"
      onClick={() => onSelect(item)}
      className="flex w-full items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-white transition-colors hover:bg-white/10"
    >
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80">
        <IconGlyph name={item.icon} size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-base text-white">{item.label}</p>
        {item.description ? (
          <p className="mt-1 text-sm leading-relaxed text-white/60">{item.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em]">
          <span
            className={cn(
              'rounded-full border px-2 py-1',
              item.source === 'ha'
                ? 'border-emerald-300/35 bg-emerald-400/16 text-emerald-100'
                : 'border-sky-300/30 bg-sky-400/16 text-sky-100',
            )}
          >
            {item.source === 'ha' ? 'Home Assistant' : 'Suggerito'}
          </span>
          {item.group ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-white/70">
              {item.group}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[260] flex items-center justify-center p-6"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi menu selezione"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="relative w-full max-w-xl rounded-[2rem] border border-white/10 bg-neutral-900/80 p-6 shadow-2xl backdrop-blur-3xl"
            onClick={(eventClick) => eventClick.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <div className="mt-2 text-xs uppercase tracking-[0.16em] text-white/45">
              {connected ? 'Dati live + template' : 'Template locale'}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                <Search size={16} className="text-white/45" />
                <input
                  value={query}
                  onChange={(eventInput) => setQuery(eventInput.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSourceFilter('all')}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-xs transition-colors',
                    sourceFilter === 'all'
                      ? 'border-emerald-300/30 bg-emerald-400/16 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white',
                  )}
                >
                  Tutti
                </button>
                <button
                  type="button"
                  onClick={() => setSourceFilter('template')}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-xs transition-colors',
                    sourceFilter === 'template'
                      ? 'border-emerald-300/30 bg-emerald-400/16 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white',
                  )}
                >
                  Suggeriti
                </button>
                <button
                  type="button"
                  onClick={() => setSourceFilter('ha')}
                  disabled={!connected}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                    sourceFilter === 'ha'
                      ? 'border-emerald-300/30 bg-emerald-400/16 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white',
                  )}
                >
                  Home Assistant
                </button>
              </div>
            </div>

            <div className="mt-5 max-h-[52vh] space-y-4 overflow-y-auto pr-1">
              {templateOptions.length > 0 ? (
                <section>
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-sky-100/80">
                    Suggeriti ({optionKindLabel})
                  </p>
                  <div className="space-y-2">{templateOptions.map(renderOption)}</div>
                </section>
              ) : null}

              {haOptions.length > 0 ? (
                <section>
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-emerald-100/80">
                    Home Assistant ({optionKindLabel})
                  </p>
                  <div className="space-y-2">{haOptions.map(renderOption)}</div>
                </section>
              ) : null}

              {filteredOptions.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                  Nessun risultato trovato. Prova con un termine diverso o cambia filtro.
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default SelectionModal;
