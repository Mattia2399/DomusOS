import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Boxes,
  Check,
  Container,
  Crown,
  Download,
  MonitorPlay,
  Package,
  Radar,
  ScanFace,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { Button, Pill, Reveal, SectionHeading } from './ui';
import { PRO_PRICE, SECTION_IDS } from './brand';

type PlanTab = 'free' | 'pro';

const freeFeatures = [
  'Interfaccia Liquid Glass completa',
  'Web app responsive e installabile (PWA)',
  '14+ card ed editor visuale, senza YAML',
  'Autenticazione biometrica del browser',
  'Nessun abbonamento, nessun account',
];

const installMethods: { icon: LucideIcon; name: string; recommended?: boolean }[] = [
  { icon: Package, name: 'HACS · Custom Repository', recommended: true },
  { icon: Boxes, name: 'Add-on / Panel Bridge' },
  { icon: Container, name: 'Docker o installazione manuale' },
];

const proFeatures: { icon: LucideIcon; text: string }[] = [
  { icon: MonitorPlay, text: 'Kiosk Mode nativo, senza browser né barre' },
  { icon: Radar, text: 'Wake-on-Motion: lo schermo si accende quando entri' },
  { icon: ScanFace, text: 'Face ID e Touch ID di sistema' },
  { icon: Sparkles, text: 'Screensaver ambient avanzato' },
  { icon: Crown, text: 'Aggiornamenti prioritari + supporto dedicato' },
];

const contentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function TabButton({
  active,
  label,
  sub,
  onClick,
}: {
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="relative flex-1 rounded-full px-4 py-2.5 text-center transition-colors"
    >
      {active ? (
        <motion.span
          layoutId="plan-tab-pill"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400 shadow-[0_6px_24px_-6px_rgba(56,189,248,0.6)]"
        />
      ) : null}
      <span className={`relative z-10 block text-sm font-semibold ${active ? 'text-[#04121a]' : 'text-white'}`}>
        {label}
      </span>
      <span className={`relative z-10 block text-[0.68rem] ${active ? 'text-[#04121a]/70' : 'text-white/45'}`}>
        {sub}
      </span>
    </button>
  );
}

export const PlansMobile = () => {
  const [tab, setTab] = useState<PlanTab>('free');
  const isPro = tab === 'pro';

  return (
    <section id={SECTION_IDS.pricing} className="relative z-10 overflow-hidden px-4 py-16">
      {/* Secondary anchor so the "Edizioni" nav link lands on this same card. */}
      <span id={SECTION_IDS.editions} aria-hidden className="pointer-events-none absolute -top-2 block scroll-mt-[4.75rem]" />
      <div className="aurora left-1/2 top-[22%] h-[26rem] w-[26rem] -translate-x-1/2 bg-[radial-gradient(circle,rgba(56,189,248,0.13),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-xl">
        <SectionHeading
          eyebrow="Edizioni e prezzi"
          title="Gratis, o Pro?"
          subtitle="Parti dalla Community self-hosted. Passa a Pro quando vuoi la potenza nativa del dispositivo."
          className="mb-8"
        />

        {/* Wrapper carries the radius so glass-premium's `border-radius: inherit` matches the card. */}
        <Reveal className="rounded-[30px]">
          <div className={`rounded-[30px] p-2 transition-shadow duration-500 ${isPro ? 'glass-premium' : 'glass-panel'}`}>
          {/* Tab switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
            <TabButton active={!isPro} label="Gratis" sub="Community · 0€" onClick={() => setTab('free')} />
            <TabButton active={isPro} label="Pro" sub={`${PRO_PRICE.amount}${PRO_PRICE.currency} · ${PRO_PRICE.availability}`} onClick={() => setTab('pro')} />
          </div>

          {/* Panel */}
          <div className="px-4 pb-5 pt-6 sm:px-5">
            <AnimatePresence mode="wait" initial={false}>
              {isPro ? (
                <motion.div key="pro" {...contentVariants} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                  <div className="flex items-center justify-between gap-3">
                    <Pill className="border-cyan-300/30 bg-cyan-400/10 text-cyan-200">
                      <Sparkles className="h-3 w-3" /> Pro Edition
                    </Pill>
                    <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
                      {PRO_PRICE.availability}
                    </span>
                  </div>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold text-white">
                      {PRO_PRICE.amount}
                      {PRO_PRICE.currency}
                    </span>
                    <span className="text-sm text-white/50">/ {PRO_PRICE.cadence}</span>
                  </div>
                  <h3 className="font-display mt-3 flex items-center gap-2 text-xl font-semibold text-white">
                    <Smartphone className="h-5 w-5 text-cyan-300" strokeWidth={1.7} /> L&apos;app nativa
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    Tutto della Community, potenziato dall&apos;hardware. iOS e Android, pensata per i tablet a muro.
                  </p>

                  <ul className="mt-6 space-y-3">
                    {proFeatures.map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-start gap-3 text-sm text-white/85">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-300/25 to-indigo-400/20">
                          <Icon className="h-3.5 w-3.5 text-cyan-200" strokeWidth={2} />
                        </span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7">
                    <Button variant="premium" href={`#${SECTION_IDS.faq}`} className="w-full">
                      Ottieni accesso anticipato
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <p className="mt-3 text-center text-xs text-white/40">
                      Prezzo di lancio bloccato per i primi iscritti.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="free" {...contentVariants} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                  <div className="flex items-center justify-between gap-3">
                    <Pill>Community Edition</Pill>
                    <span className="font-display text-base font-semibold text-white/70">Gratis</span>
                  </div>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold text-white">0€</span>
                    <span className="text-sm text-white/50">/ per sempre</span>
                  </div>
                  <h3 className="font-display mt-3 text-xl font-semibold text-white">Open &amp; self-hosted</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    Installala sul tuo Home Assistant. Il codice gira a casa tua, i dati non escono dalla tua rete.
                  </p>

                  <ul className="mt-6 space-y-3">
                    {freeFeatures.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-white/75">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" strokeWidth={2.4} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="my-6 hairline" />
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                    Tre modi per installarla
                  </p>
                  <div className="space-y-2">
                    {installMethods.map(({ icon: Icon, name, recommended }) => (
                      <div
                        key={name}
                        className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-2.5"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                          <Icon className="h-4 w-4 text-white/70" strokeWidth={1.7} />
                        </span>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium text-white">
                          {name}
                          {recommended ? (
                            <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-cyan-300">
                              Consigliato
                            </span>
                          ) : null}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-7">
                    <Button variant="secondary" href={`#${SECTION_IDS.faq}`} className="w-full">
                      <Download className="h-4 w-4" />
                      Installa gratis (HACS)
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>
        </Reveal>

        <Reveal className="mt-6 text-center text-xs text-white/30">
          I prezzi sono indicativi per la fase beta e potrebbero cambiare al lancio ufficiale.
        </Reveal>
      </div>
    </section>
  );
};
