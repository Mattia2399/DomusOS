export const CONTEXT_PANEL_LAYOUT = {
  shell:
    'flex flex-col gap-4 px-[clamp(0.75rem,2.8vw,1.5rem)] pt-[clamp(0.75rem,2.8vw,1.5rem)] pb-[max(1rem,env(safe-area-inset-bottom))] sm:gap-5',
  section:
    'context-content-surface rounded-[clamp(1.25rem,4.6vw,2rem)] p-[clamp(0.9rem,3vw,1.6rem)]',
  sectionSoft:
    'context-content-surface-soft rounded-[clamp(1.25rem,4.6vw,2rem)] p-[clamp(0.9rem,3vw,1.6rem)]',
  sectionCompact:
    'context-content-surface-soft rounded-[clamp(1.25rem,4.6vw,2rem)] p-[clamp(0.8rem,2.4vw,1.15rem)]',
  rail:
    'inline-flex w-full max-w-full items-center gap-1.5 overflow-x-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [touch-action:pan-x] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden',
  adaptiveGridTwo: 'grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5',
} as const;
