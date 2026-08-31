import React from 'react';
import { Hand, Move, Plus, Trash2, X } from 'lucide-react';

type RoomSectionInteractionGuideProps = {
  onDismiss: () => void;
};

const GUIDE_ACTIONS = [
  { label: 'Aggiungi', detail: 'nuovi', icon: Plus },
  { label: 'Sposta', detail: 'stanza', icon: Move },
  { label: 'Rimuovi', detail: 'dalla stanza', icon: Trash2 },
] as const;

export function RoomSectionInteractionGuide({ onDismiss }: RoomSectionInteractionGuideProps) {
  return (
    <section
      aria-label="Guida gestione dispositivi"
      className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[1.5rem] border border-white/[0.09] bg-white/[0.055] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_42px_rgba(0,0,0,0.14)] backdrop-blur-2xl sm:p-4"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Nascondi guida gestione dispositivi"
        className="absolute right-2.5 top-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.055] text-white/48 transition-all hover:bg-white/[0.1] hover:text-white active:scale-95"
      >
        <X size={14} />
      </button>

      <div className="flex min-w-0 items-center gap-3 pr-8 sm:gap-4">
        <div aria-hidden="true" className="relative h-14 w-14 shrink-0">
          <span className="absolute inset-1 rounded-[1.05rem] border border-white/[0.12] bg-white/[0.06]" />
          <span className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-[#85adff]/35 bg-[#85adff]/10 motion-reduce:animate-none" />
          <span className="absolute bottom-0 right-0 inline-flex h-8 w-8 animate-pulse items-center justify-center rounded-full border border-white/15 bg-[#18233d]/90 text-[#a8c1ff] shadow-lg motion-reduce:animate-none">
            <Hand size={16} />
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white/92">Tieni premuto per organizzare</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-white/48">
            Tieni premuta una card, poi tocca le altre per selezionarle. Su desktop puoi anche usare il clic destro.
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-3">
        {GUIDE_ACTIONS.map(({ label, detail, icon: Icon }) => (
          <div
            key={label}
            className="flex min-w-0 items-center justify-center gap-2 rounded-xl bg-white/[0.045] px-2 py-2 text-white/62"
          >
            <Icon size={14} className={label === 'Rimuovi' ? 'text-rose-300/80' : 'text-[#a8c1ff]'} />
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-bold leading-tight text-white/78">{label}</span>
              <span className="hidden truncate text-[9px] font-semibold leading-tight text-white/34 sm:block">{detail}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RoomSectionInteractionGuide;
