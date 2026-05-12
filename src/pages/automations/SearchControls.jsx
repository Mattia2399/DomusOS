import React from 'react';
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
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-neutral-800/40 p-4 backdrop-blur-2xl">
      <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/45">
        Filtri e ordinamento
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={searchQuery}
          onChange={(eventInput) => onSearchQueryChange(eventInput.target.value)}
          placeholder="Cerca nome, entita o testo..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-emerald-300/45 focus:outline-none"
        />

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          {SOURCE_FILTER_OPTIONS.map((entry) => (
            <button
              key={entry.value}
              type="button"
              onClick={() => onSourceFilterChange(entry.value)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors ${
                sourceFilter === entry.value
                  ? 'bg-emerald-400/20 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.18)]'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={statusFilter}
          onChange={(eventSelect) => onStatusFilterChange(eventSelect.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-300/45 focus:outline-none"
        >
          {STATUS_FILTER_OPTIONS.map((entry) => (
            <option key={entry.value} value={entry.value} className="bg-neutral-900 text-white">
              {entry.label}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(eventSelect) => onSortByChange(eventSelect.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-300/45 focus:outline-none"
        >
          {SORT_OPTIONS.map((entry) => (
            <option key={entry.value} value={entry.value} className="bg-neutral-900 text-white">
              {entry.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

export default SearchControls;
