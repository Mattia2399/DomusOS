import React from 'react';
import GlassDropdown from '../../components/ui/GlassDropdown';
import {
  SORT_OPTIONS,
  SOURCE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from './utils';

export function SearchControls({
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  sourceFilter,
  onSourceFilterChange,
}) {
  const statusOptions = STATUS_FILTER_OPTIONS.map((entry) => ({ id: entry.value, name: entry.label }));
  const sortOptions = SORT_OPTIONS.map((entry) => ({ id: entry.value, name: entry.label }));

  return (
    <section className="rounded-[1.5rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-glass-soft)] p-4 backdrop-blur-2xl">
      <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[color:var(--ui-text-tertiary)]">
        Filtri e ordinamento
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={searchQuery}
          onChange={(eventInput) => onSearchQueryChange(eventInput.target.value)}
          placeholder="Cerca nome, entita o testo..."
          className="w-full rounded-xl border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] px-3 py-2 text-sm text-[color:var(--ui-text-primary)] placeholder:text-[color:var(--ui-text-disabled)] focus:border-emerald-300/45 focus:outline-none"
        />

        <div className="flex items-center gap-2 rounded-xl border border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] p-1">
          {SOURCE_FILTER_OPTIONS.map((entry) => (
            <button
              key={entry.value}
              type="button"
              onClick={() => onSourceFilterChange(entry.value)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors ${
                sourceFilter === entry.value
                  ? 'bg-emerald-400/20 text-[color:var(--ui-success)] shadow-[0_0_16px_rgba(16,185,129,0.18)]'
                  : 'text-[color:var(--ui-text-secondary)] hover:bg-[color:var(--ui-fill-secondary)] hover:text-[color:var(--ui-text-primary)]'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GlassDropdown
          options={statusOptions}
          selected={statusOptions.find((entry) => entry.id === statusFilter) ?? statusOptions[0] ?? null}
          onChange={(option) => onStatusFilterChange(option.id)}
        />

        <GlassDropdown
          options={sortOptions}
          selected={sortOptions.find((entry) => entry.id === sortBy) ?? sortOptions[0] ?? null}
          onChange={(option) => onSortByChange(option.id)}
        />
      </div>
    </section>
  );
}

export default SearchControls;
