import React from 'react';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { IconGlyph } from './IconGlyph';
import { normalizeName } from './utils';
import GlassModal from '../../components/ui/GlassModal';

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
      className="flex w-full items-start gap-4 rounded-2xl border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] p-4 text-left text-[color:var(--ui-text-primary)] transition-colors hover:bg-[color:var(--ui-fill-secondary)]"
    >
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-secondary)] text-[color:var(--ui-text-secondary)]">
        <IconGlyph name={item.icon} size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-base text-[color:var(--ui-text-primary)]">{item.label}</p>
        {item.description ? (
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--ui-text-secondary)]">{item.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em]">
          <span
            className={cn(
              'rounded-full border px-2 py-1',
              item.source === 'ha'
                ? 'border-emerald-300/35 bg-emerald-400/16 text-[color:var(--ui-success)]'
                : 'border-sky-300/30 bg-sky-400/16 text-[color:var(--ui-info)]',
            )}
          >
            {item.source === 'ha' ? 'Home Assistant' : 'Suggerito'}
          </span>
          {item.group ? (
            <span className="rounded-full border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-secondary)] px-2 py-1 text-[color:var(--ui-text-secondary)]">
              {item.group}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      eyebrow={connected ? 'Dati live + template' : 'Template locale'}
      variant="responsive"
      size="lg"
      zIndex={260}
      closeLabel="Chiudi menu selezione"
      backdropClassName="bg-[color:var(--ui-scrim)] backdrop-blur-md"
      panelClassName="bg-[color:var(--ui-surface-glass-strong)] shadow-2xl"
      bodyClassName="flex flex-col overflow-hidden"
    >
            <div className="mt-4 rounded-2xl border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] p-3">
              <div className="flex items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] px-3 py-2">
                <Search size={16} className="text-[color:var(--ui-text-tertiary)]" />
                <input
                  value={query}
                  onChange={(eventInput) => setQuery(eventInput.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm text-[color:var(--ui-text-primary)] placeholder:text-[color:var(--ui-text-disabled)] focus:outline-none"
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSourceFilter('all')}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-xs transition-colors',
                    sourceFilter === 'all'
                      ? 'border-emerald-300/30 bg-emerald-400/16 text-[color:var(--ui-success)]'
                      : 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)] hover:bg-[color:var(--ui-fill-secondary)] hover:text-[color:var(--ui-text-primary)]',
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
                      ? 'border-emerald-300/30 bg-emerald-400/16 text-[color:var(--ui-success)]'
                      : 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)] hover:bg-[color:var(--ui-fill-secondary)] hover:text-[color:var(--ui-text-primary)]',
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
                      ? 'border-emerald-300/30 bg-emerald-400/16 text-[color:var(--ui-success)]'
                      : 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)] hover:bg-[color:var(--ui-fill-secondary)] hover:text-[color:var(--ui-text-primary)]',
                  )}
                >
                  Home Assistant
                </button>
              </div>
            </div>

            <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 glass-scrollbar">
              {templateOptions.length > 0 ? (
                <section>
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[color:var(--ui-info)]">
                    Suggeriti ({optionKindLabel})
                  </p>
                  <div className="space-y-2">{templateOptions.map(renderOption)}</div>
                </section>
              ) : null}

              {haOptions.length > 0 ? (
                <section>
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[color:var(--ui-success)]">
                    Home Assistant ({optionKindLabel})
                  </p>
                  <div className="space-y-2">{haOptions.map(renderOption)}</div>
                </section>
              ) : null}

              {filteredOptions.length === 0 ? (
                <div className="rounded-2xl border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] p-4 text-sm text-[color:var(--ui-text-secondary)]">
                  Nessun risultato trovato. Prova con un termine diverso o cambia filtro.
                </div>
              ) : null}
            </div>
    </GlassModal>
  );
}

export default SelectionModal;
