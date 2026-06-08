import { Listbox, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { Check, ChevronDown } from 'lucide-react';
import { Fragment } from 'react';

export type GlassDropdownOption = {
  id: string;
  name: string;
};

type GlassDropdownProps = {
  options: GlassDropdownOption[];
  selected: GlassDropdownOption | null;
  onChange: (option: GlassDropdownOption) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function GlassDropdown({
  options,
  selected,
  onChange,
  label,
  placeholder = 'Seleziona',
  disabled = false,
  className,
}: GlassDropdownProps) {
  return (
    <Listbox value={selected} onChange={(option) => option && onChange(option)} by="id" disabled={disabled}>
      {({ open }) => (
        <div className={clsx('relative w-full min-w-0', className)}>
          {label ? <Listbox.Label className="mb-2 block text-xs font-medium text-white/60">{label}</Listbox.Label> : null}

          <Listbox.Button className="liquid-glass-card btn-premium flex w-full items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-3.5 py-2.5 text-left text-sm font-medium text-white/90 outline-none backdrop-blur-xl transition duration-200 hover:bg-white/[0.08] focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50">
            <span className={clsx('block min-w-0 truncate', !selected && 'text-white/45')}>{selected?.name ?? placeholder}</span>
            <ChevronDown
              aria-hidden="true"
              className={clsx('h-4 w-4 shrink-0 text-white/55 transition-transform duration-200', open && 'rotate-180 text-white/80')}
            />
          </Listbox.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 -translate-y-1 scale-[0.98]"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 -translate-y-1 scale-[0.98]"
          >
            <Listbox.Options
              anchor={{ to: 'bottom start', gap: 8, padding: 12 }}
              portal
              className="liquid-glass-card glass-scrollbar z-50 max-h-64 w-[var(--button-width)] origin-top overflow-auto rounded-2xl bg-white/[0.04] p-1.5 text-sm text-white/88 outline-none backdrop-blur-xl ring-1 ring-black/5"
            >
              {options.map((option) => (
                <Listbox.Option
                  key={option.id}
                  value={option}
                  className={({ focus, selected: isSelected }) =>
                    clsx(
                      'relative cursor-pointer select-none rounded-xl px-3 py-2.5 pr-9 transition-colors duration-150',
                      focus && 'bg-white/10 text-white',
                      isSelected ? 'font-medium text-white' : 'text-white/72',
                    )
                  }
                >
                  {({ selected: isSelected }) => (
                    <>
                      <span className="block truncate">{option.name}</span>
                      {isSelected ? (
                        <span className="absolute inset-y-0 right-3 flex items-center text-white/80">
                          <Check aria-hidden="true" className="h-4 w-4" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}

export default GlassDropdown;
