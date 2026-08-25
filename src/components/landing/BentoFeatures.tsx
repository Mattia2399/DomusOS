import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CheckCheck, Layers, MousePointerClick, Maximize, ScanFace } from 'lucide-react';
import { Reveal, SectionHeading } from './ui';
import { SECTION_IDS } from './brand';

function BentoCard({
  icon: Icon,
  title,
  description,
  className = '',
  delay = 0,
  children,
  accent = 'cyan',
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  delay?: number;
  children?: ReactNode;
  accent?: 'cyan' | 'indigo' | 'emerald' | 'amber';
}) {
  const accents: Record<string, string> = {
    cyan: 'text-cyan-300',
    indigo: 'text-indigo-300',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
  };
  return (
    <Reveal
      delay={delay}
      className={`glass-panel glass-panel-hover group relative flex flex-col overflow-hidden rounded-[28px] p-6 md:p-7 ${className}`}
    >
      <div className="relative z-10 flex flex-col">
        <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
          <Icon className={`h-5 w-5 ${accents[accent]}`} strokeWidth={1.7} />
        </span>
        <h3 className="font-display text-xl font-semibold text-white md:text-2xl">{title}</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55 md:text-[0.95rem]">{description}</p>
      </div>
      {children}
    </Reveal>
  );
}

export const BentoFeatures = () => {
  return (
    <section id={SECTION_IDS.features} className="relative z-10 px-4 py-16 md:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Progettato nei dettagli"
          title={
            <>
              Non è un tema.
              <br className="hidden md:block" /> <span className="text-white/45">È un design system.</span>
            </>
          }
          subtitle="Ogni card, ogni pannello e ogni animazione parlano la stessa lingua. Costruita per sembrare nativa su qualsiasi schermo appesa al muro."
          className="mb-16"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:auto-rows-[13.5rem]">
          {/* Feature hero: adaptive design */}
          <BentoCard
            icon={Maximize}
            title="Si adatta a ogni pixel."
            description="Grazie alle Container Queries, ogni card sceglie la variante — mini, standard o expanded — in base allo spazio reale, non solo al breakpoint. Desktop, tablet a muro o smartphone: sempre leggibile, mai tagliata."
            className="md:col-span-2 md:row-span-2"
            accent="cyan"
          >
            {/* Decorative adaptive-size preview */}
            <div className="pointer-events-none mt-auto flex items-end gap-3 pt-8 opacity-80">
              <div className="h-16 w-16 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.12] to-transparent" />
              <div className="h-24 w-24 rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/15 to-transparent" />
              <div className="h-32 flex-1 rounded-2xl border border-indigo-300/20 bg-gradient-to-br from-indigo-400/12 to-transparent" />
            </div>
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
          </BentoCard>

          {/* Biometric security */}
          <BentoCard
            icon={ScanFace}
            title="Sicurezza biometrica."
            description="Face ID, Touch ID e PIN Home Assistant proteggono allarmi e serrature. La conferma è locale, rapida e senza frizioni."
            className="md:col-span-2"
            accent="indigo"
            delay={0.05}
          />

          {/* Reliable commands */}
          <BentoCard
            icon={CheckCheck}
            title="Comandi affidabili."
            description="Ogni azione mostra invio, conferma o rollback — mai uno stato falso."
            className="md:col-span-1"
            accent="emerald"
            delay={0.1}
          />

          {/* Zero YAML editor */}
          <BentoCard
            icon={MousePointerClick}
            title="Zero YAML."
            description="Editor visuale con drag & drop, undo/redo e anteprime reali dei viewport."
            className="md:col-span-1"
            accent="amber"
            delay={0.15}
          />

          {/* Full-width Liquid Glass strip */}
          <BentoCard
            icon={Layers}
            title="Materiali Liquid Glass."
            description="Sfocature, bordi luminosi, profondità e micro-animazioni ispirate a visionOS — su ogni card e in ogni tema."
            className="md:col-span-4 md:!flex-row md:items-center md:justify-between"
            accent="cyan"
            delay={0.1}
          >
            <div className="pointer-events-none mt-6 flex gap-3 md:mt-0 md:pl-8">
              {['from-cyan-400/25', 'from-indigo-400/25', 'from-white/15'].map((g, i) => (
                <div
                  key={i}
                  className={`h-20 w-24 rounded-2xl border border-white/10 bg-gradient-to-br ${g} to-transparent backdrop-blur-md md:w-28`}
                />
              ))}
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
};
