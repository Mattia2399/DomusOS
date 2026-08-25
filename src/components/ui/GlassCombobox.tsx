import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import clsx from 'clsx';
import { Check, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

type GlassComboboxProps = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxOptions?: number;
  emptyLabel?: string;
};

function scoreOption(option: string, query: string) {
  const normalizedOption = option.trim().toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return 0;
  }
  if (normalizedOption === normalizedQuery) {
    return 1000;
  }
  if (normalizedOption.startsWith(normalizedQuery)) {
    return 900 - normalizedOption.length * 0.01;
  }
  const dotIndex = normalizedOption.indexOf(`.${normalizedQuery}`);
  if (dotIndex >= 0) {
    return 800 - dotIndex * 0.1;
  }
  const includesIndex = normalizedOption.indexOf(normalizedQuery);
  if (includesIndex >= 0) {
    return 600 - includesIndex * 0.1;
  }
  return Number.NEGATIVE_INFINITY;
}

export function GlassCombobox({
  value,
  options,
  onChange,
  label,
  placeholder = 'Seleziona o digita',
  disabled = false,
  className,
  maxOptions = 80,
  emptyLabel = 'Nessun risultato',
}: GlassComboboxProps) {
  const [query, setQuery] = useState('');
  const normalizedOptions = useMemo(
    () =>
      Array.from(
        new Set(
          options
            .map((option) => option.trim())
            .filter((option) => option.length > 0),
        ),
      ),
    [options],
  );
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return normalizedOptions.slice(0, maxOptions);
    }
    return normalizedOptions
      .map((option) => ({
        option,
        score: scoreOption(option, normalizedQuery),
      }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((first, second) => {
        if (second.score !== first.score) {
          return second.score - first.score;
        }
        return first.option.localeCompare(second.option);
      })
      .slice(0, maxOptions)
      .map((entry) => entry.option);
  }, [maxOptions, normalizedOptions, query]);

  return (
    <Combobox
      value={value}
      onChange={(nextValue) => {
        if (typeof nextValue === 'string') {
          onChange(nextValue);
        }
      }}
      onClose={() => setQuery('')}
      disabled={disabled}
      immediate
    >
      {({ open }) => (
        <div className={clsx('relative w-full min-w-0', className)}>
          {label ? <Combobox.Label className="mb-2 block text-xs font-medium text-[color:var(--ui-text-secondary)]">{label}</Combobox.Label> : null}
          <div className="relative">
            <ComboboxInput
              displayValue={(selectedValue: string) => selectedValue ?? ''}
              onChange={(event) => {
                setQuery(event.target.value);
                onChange(event.target.value);
              }}
              placeholder={placeholder}
              className="liquid-glass-control btn-premium flex w-full rounded-2xl px-3.5 py-2.5 pr-10 text-left text-sm font-medium text-[color:var(--ui-text-primary)] outline-none transition duration-200 placeholder:text-[color:var(--ui-text-tertiary)] focus:border-[color:var(--ui-focus-ring)] focus:ring-2 focus:ring-[color:var(--ui-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
            />
            <ComboboxButton className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-[color:var(--ui-text-tertiary)] transition-colors hover:text-[color:var(--ui-text-primary)]">
              <ChevronDown
                aria-hidden="true"
                className={clsx('h-4 w-4 transition-transform duration-200', open && 'rotate-180 text-[color:var(--ui-text-primary)]')}
              />
            </ComboboxButton>
          </div>

          <ComboboxOptions
            anchor={{ to: 'bottom start', gap: 8, padding: 12 }}
            portal
            transition
            className="liquid-glass-navigation glass-scrollbar z-50 max-h-64 w-[var(--input-width)] origin-top overflow-auto rounded-2xl p-1.5 text-sm text-[color:var(--ui-text-primary)] outline-none transition duration-150 ease-out data-[closed]:-translate-y-1 data-[closed]:scale-[0.98] data-[closed]:opacity-0"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <ComboboxOption
                  key={option}
                  value={option}
                  className={({ focus, selected }) =>
                    clsx(
                      'relative cursor-pointer select-none rounded-xl px-3 py-2.5 pr-9 transition-colors duration-150',
                      focus && 'bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-primary)]',
                      selected ? 'font-medium text-[color:var(--ui-text-primary)]' : 'text-[color:var(--ui-text-secondary)]',
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className="block truncate">{option}</span>
                      {selected ? (
                        <span className="absolute inset-y-0 right-3 flex items-center text-[color:var(--ui-accent)]">
                          <Check aria-hidden="true" className="h-4 w-4" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ComboboxOption>
              ))
            ) : (
              <div className="rounded-xl px-3 py-2.5 text-[color:var(--ui-text-tertiary)]">{emptyLabel}</div>
            )}
          </ComboboxOptions>
        </div>
      )}
    </Combobox>
  );
}

export default GlassCombobox;
