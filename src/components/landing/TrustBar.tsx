import { Gauge, Home, Music2, RadioTower, ScanFace, ShieldCheck, WifiOff, Zap } from 'lucide-react';
import { Reveal } from './ui';

const integrations = [
  { name: 'Home Assistant', icon: Home },
  { name: 'Spotify', icon: Music2 },
  { name: 'Apple / Face ID', icon: ScanFace },
  { name: 'Zigbee · Z-Wave', icon: RadioTower },
  { name: 'MQTT', icon: Zap },
];

const stats = [
  { icon: Gauge, value: '60 fps', label: 'Animazioni fluide, sempre' },
  { icon: WifiOff, value: '100% locale', label: 'Nessun cloud obbligatorio' },
  { icon: ShieldCheck, value: 'Biometrica', label: 'Face ID e Touch ID nativi' },
  { icon: Zap, value: 'Zero lag', label: 'Prestazioni native' },
];

export const TrustBar = () => {
  return (
    <section className="relative z-10 border-y border-white/5 bg-white/[0.015] px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-12 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/35">
            Si integra con tutto ciò che già usi
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {integrations.map(({ name, icon: Icon }) => (
              <div
                key={name}
                className="flex items-center gap-2.5 text-white/45 transition-colors hover:text-white/80"
              >
                <Icon className="h-5 w-5" strokeWidth={1.6} />
                <span className="text-sm font-semibold tracking-tight md:text-base">{name}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-white/25">
            Le integrazioni sono fornite dalle oltre 2.000 estensioni di Home Assistant. Marchi citati a solo scopo di
            compatibilità.
          </p>
        </Reveal>

        <div className="hairline mb-10" />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {stats.map(({ icon: Icon, value, label }, idx) => (
            <Reveal
              key={value}
              delay={idx * 0.08}
              className="glass-panel glass-panel-hover flex flex-col items-center gap-2 rounded-3xl px-4 py-7 text-center"
            >
              <Icon className="mb-1 h-6 w-6 text-cyan-300" strokeWidth={1.6} />
              <span className="font-display text-2xl font-semibold text-white">{value}</span>
              <span className="text-xs leading-relaxed text-white/45">{label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
