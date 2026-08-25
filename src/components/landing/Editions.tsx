import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Boxes,
  Check,
  Container,
  Crown,
  MonitorPlay,
  Package,
  Radar,
  ScanFace,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { Button, Pill, Reveal, SectionHeading } from './ui';
import { SECTION_IDS } from './brand';

const installMethods: { icon: LucideIcon; name: string; detail: string; recommended?: boolean }[] = [
  { icon: Package, name: 'HACS · Custom Repository', detail: 'Il modo più semplice per HA OS', recommended: true },
  { icon: Boxes, name: 'Add-on / Panel Bridge', detail: 'Integrata nella tua istanza HA' },
  { icon: Container, name: 'Docker o installazione manuale', detail: 'Per setup avanzati e sviluppatori' },
];

const communityFeatures = [
  'Interfaccia Liquid Glass completa',
  'Web app responsive e installabile (PWA)',
  '14+ famiglie di card e pannelli contestuali',
  'Editor visuale drag & drop, senza YAML',
  'Autenticazione biometrica del browser',
  'Nessun abbonamento, nessun account',
];

const proFeatures: { icon: LucideIcon; text: string }[] = [
  { icon: MonitorPlay, text: 'Kiosk Mode nativo, senza browser né barre' },
  { icon: Radar, text: 'Wake-on-Motion: lo schermo si accende quando entri' },
  { icon: ScanFace, text: 'Face ID e Touch ID di sistema, non solo del browser' },
  { icon: Sparkles, text: 'Screensaver avanzato in stile ambient display' },
  { icon: Crown, text: 'Aggiornamenti prioritari e supporto dedicato' },
];

export const Editions = () => {
  return (
    <section id={SECTION_IDS.editions} className="relative z-10 overflow-hidden px-4 py-16 md:px-8 md:py-32">
      <div className="aurora right-[-10%] top-[20%] h-[34rem] w-[34rem] bg-[radial-gradient(circle,rgba(129,140,248,0.16),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Due anime, una sola esperienza"
          title="Scegli come vuoi viverla."
          subtitle="Parti gratis con la Community Edition self-hosted. Quando vuoi la potenza nativa del dispositivo, passa a Pro."
          className="mb-16"
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Community Edition */}
          <Reveal className="glass-panel flex flex-col rounded-[32px] p-8 md:p-10">
            <div className="mb-6 flex items-center justify-between">
              <Pill>Community Edition</Pill>
              <span className="font-display text-lg font-semibold text-white/70">Gratis, per sempre</span>
            </div>
            <h3 className="font-display text-2xl font-semibold text-white md:text-3xl">Open &amp; self-hosted</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/55 md:text-base">
              Installala sul tuo Home Assistant e personalizza tutto. Il codice gira a casa tua, i dati non escono
              dalla tua rete.
            </p>

            <ul className="mt-8 space-y-3">
              {communityFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-white/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" strokeWidth={2.4} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="my-8 hairline" />

            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
              Tre modi per installarla
            </p>
            <div className="space-y-2.5">
              {installMethods.map(({ icon: Icon, name, detail, recommended }) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                    <Icon className="h-4 w-4 text-white/70" strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-white">
                      <span>{name}</span>
                      {recommended ? (
                        <span className="shrink-0 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-cyan-300">
                          Consigliato
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-white/40">{detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Button variant="secondary" href={`#${SECTION_IDS.pricing}`} className="w-full">
                <Package className="h-4 w-4" />
                Installa gratis via HACS
              </Button>
            </div>
          </Reveal>

          {/* Pro Edition (highlighted) */}
          <Reveal delay={0.1} className="relative rounded-[32px]">
            <div className="glass-premium flex h-full flex-col rounded-[32px] p-8 md:p-10">
              <div className="mb-6 flex items-center justify-between">
                <Pill className="border-cyan-300/30 bg-cyan-400/10 text-cyan-200">
                  <Sparkles className="h-3 w-3" /> Pro Edition
                </Pill>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
                  In arrivo
                </span>
              </div>
              <h3 className="font-display flex items-center gap-2 text-2xl font-semibold text-white md:text-3xl">
                <Smartphone className="h-6 w-6 text-cyan-300" strokeWidth={1.7} /> L&apos;app nativa
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60 md:text-base">
                Tutto della Community Edition, potenziato dall&apos;hardware. iOS e Android, pensata per i tablet a
                muro come veri pannelli di controllo.
              </p>

              <ul className="mt-8 space-y-3.5">
                {proFeatures.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-white/85">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-300/25 to-indigo-400/20">
                      <Icon className="h-3.5 w-3.5 text-cyan-200" strokeWidth={2} />
                    </span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-10">
                <Button variant="premium" href={`#${SECTION_IDS.pricing}`} className="w-full">
                  Unisciti alla lista Pro
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Button>
                <p className="mt-3 text-center text-xs text-white/40">
                  Accesso anticipato e prezzo di lancio riservato agli iscritti.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
