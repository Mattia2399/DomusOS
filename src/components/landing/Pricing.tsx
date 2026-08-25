import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Check, Package, Sparkles, X } from 'lucide-react';
import { Button, Pill, Reveal, SectionHeading } from './ui';
import { PRO_PRICE, SECTION_IDS } from './brand';

type PlanFeature = { text: string; included: boolean };

const hacsFeatures: PlanFeature[] = [
  { text: 'Interfaccia Liquid Glass completa', included: true },
  { text: 'Web app responsive (PWA)', included: true },
  { text: '14+ card ed editor visuale', included: true },
  { text: 'Autenticazione biometrica del browser', included: true },
  { text: 'Nessun abbonamento, per sempre', included: true },
  { text: 'Kiosk Mode e Wake-on-Motion nativi', included: false },
  { text: 'Screensaver ambient avanzato', included: false },
];

const proFeatures: PlanFeature[] = [
  { text: 'Tutto ciò che include la HACS Edition', included: true },
  { text: 'App nativa iOS e Android', included: true },
  { text: 'Kiosk Mode nativo a schermo intero', included: true },
  { text: 'Wake-on-Motion e sensori del dispositivo', included: true },
  { text: 'Face ID / Touch ID di sistema', included: true },
  { text: 'Screensaver ambient avanzato', included: true },
  { text: 'Aggiornamenti prioritari + supporto dedicato', included: true },
];

function FeatureRow({ feature, tone }: { feature: PlanFeature; tone: 'cyan' | 'muted' }) {
  return (
    <li className={`flex items-start gap-3 text-sm ${feature.included ? 'text-white/80' : 'text-white/35'}`}>
      {feature.included ? (
        <Check
          className={`mt-0.5 h-4 w-4 shrink-0 ${tone === 'cyan' ? 'text-cyan-300' : 'text-white/60'}`}
          strokeWidth={2.4}
        />
      ) : (
        <X className="mt-0.5 h-4 w-4 shrink-0 text-white/20" strokeWidth={2.4} />
      )}
      <span>{feature.text}</span>
    </li>
  );
}

export const Pricing = () => {
  return (
    <section id={SECTION_IDS.pricing} className="relative z-10 overflow-hidden px-4 py-16 md:px-8 md:py-32">
      <div className="aurora left-1/2 top-[30%] h-[38rem] w-[38rem] -translate-x-1/2 bg-[radial-gradient(circle,rgba(56,189,248,0.12),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Prezzi trasparenti"
          title="Gratis per iniziare. Una tantum per il resto."
          subtitle="Nessun abbonamento nascosto. Paghi una volta la versione Pro, quando sarà disponibile."
          className="mb-16"
        />

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {/* HACS Edition */}
          <Reveal className="glass-panel flex flex-col rounded-[32px] p-8 md:p-10">
            <Pill className="self-start">HACS Edition</Pill>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-display text-5xl font-bold text-white">0€</span>
              <span className="text-sm text-white/45">/ per sempre</span>
            </div>
            <p className="mt-3 text-sm text-white/55">Self-hosted sul tuo Home Assistant. Open e senza account.</p>

            <ul className="mt-8 flex-1 space-y-3.5">
              {hacsFeatures.map((feature) => (
                <FeatureRow key={feature.text} feature={feature} tone="muted" />
              ))}
            </ul>

            <div className="mt-8">
              <Button variant="secondary" href={`#${SECTION_IDS.editions}`} className="w-full">
                <Package className="h-4 w-4" />
                Installa gratis
              </Button>
            </div>
          </Reveal>

          {/* Pro Edition (highlighted) */}
          <Reveal delay={0.1} className="relative rounded-[32px]">
            {/* Floating highlight ribbon */}
            <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400 px-4 py-1.5 text-xs font-semibold text-[#04121a] shadow-[0_8px_30px_-6px_rgba(56,189,248,0.6)]">
                <Sparkles className="h-3.5 w-3.5" /> Più potente
              </span>
            </div>

            <div className="glass-premium flex h-full flex-col rounded-[32px] p-8 md:p-10">
              <div className="flex items-center justify-between">
                <Pill className="border-cyan-300/30 bg-cyan-400/10 text-cyan-200">App Pro</Pill>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
                  {PRO_PRICE.availability}
                </span>
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold text-white">
                  {PRO_PRICE.amount}
                  {PRO_PRICE.currency}
                </span>
                <span className="text-sm text-white/50">/ {PRO_PRICE.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-white/60">
                Un solo acquisto. Nessun abbonamento, aggiornamenti dell&apos;app inclusi.
              </p>

              <ul className="mt-8 flex-1 space-y-3.5">
                {proFeatures.map((feature) => (
                  <FeatureRow key={feature.text} feature={feature} tone="cyan" />
                ))}
              </ul>

              <div className="mt-8">
                <Button variant="premium" href={`#${SECTION_IDS.faq}`} className="w-full">
                  Ottieni accesso anticipato
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Button>
                <p className="mt-3 text-center text-xs text-white/40">
                  Iscriviti ora: prezzo di lancio bloccato per i primi utenti.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-8 text-center text-xs text-white/30">
          I prezzi sono indicativi per la fase beta e potrebbero cambiare al lancio ufficiale.
        </Reveal>
      </div>
    </section>
  );
};
