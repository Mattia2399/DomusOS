import { ArrowRight, Download, Sparkles } from 'lucide-react';
import { Button, Reveal } from './ui';
import { SECTION_IDS } from './brand';

export const FinalCTA = () => {
  return (
    <section className="relative z-10 overflow-hidden px-4 py-20 text-center md:px-8 md:py-32">
      <div className="aurora aurora-drift left-1/2 top-1/2 h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(56,189,248,0.16),transparent_60%)]" />
      <div className="aurora left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(129,140,248,0.14),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      <Reveal className="relative z-10 mx-auto max-w-3xl">
        <h2 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl">
          Porta la tua casa
          <br className="hidden md:block" /> in un&apos;altra dimensione.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">
          Installa gratis la Community Edition oggi, o mettiti in prima fila per l&apos;app Pro nativa.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button variant="premium" href={`#${SECTION_IDS.pricing}`} className="w-full px-8 py-4 text-base sm:w-auto">
            <Sparkles className="h-4 w-4" />
            Scopri la versione Pro
          </Button>
          <Button
            variant="secondary"
            href={`#${SECTION_IDS.editions}`}
            className="w-full px-8 py-4 text-base sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Installa gratis (HACS)
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Button>
        </div>
      </Reveal>
    </section>
  );
};
