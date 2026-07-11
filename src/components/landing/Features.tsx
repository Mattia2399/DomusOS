import {
  Fingerprint,
  Layout,
  Lock,
  Move,
  Palette,
  PanelsTopLeft,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Zap,
} from 'lucide-react';
import { GlassCard } from './ui';

export const Features = () => {
  const allFeatures = [
    { title: 'Layout Responsive', icon: <Layout className="text-white/70" />, desc: 'Design adattivo per desktop, tablet e mobile.' },
    { title: 'Drag & Drop', icon: <Move className="text-white/70" />, desc: 'Riordina le card liberamente per creare la dashboard perfetta.' },
    { title: 'Card Dinamiche', icon: <Zap className="text-white/70" />, desc: 'Varianti visive compatte o complete in base allo spazio.' },
    { title: 'Pannelli Contestuali', icon: <PanelsTopLeft className="text-white/70" />, desc: 'Controlli avanzati disponibili con un tap senza ingombrare la UI.' },
    { title: 'Controlli Clima Avanzati', icon: <Thermometer className="text-white/70" />, desc: 'Termostati, ventole e sensori con controlli intuitivi.' },
    { title: 'Luci e Colori', icon: <Palette className="text-white/70" />, desc: 'Gestione avanzata della luminosita e della temperatura colore.' },
    { title: 'Sensori Intelligenti', icon: <Zap className="text-white/70" />, desc: 'Stato in tempo reale, unita di misura e preview visive.' },
    { title: 'Allarme e Sicurezza', icon: <ShieldAlert className="text-white/70" />, desc: 'Gestione completa del sistema di allarme con overlay sicuri.' },
    { title: 'Serrature Smart', icon: <Lock className="text-white/70" />, desc: 'Controllo immediato delle porte con feedback sullo stato.' },
    { title: 'Autenticazione Biometrica', icon: <Fingerprint className="text-white/70" />, desc: 'Supporto a Face ID e Touch ID per azioni sensibili.' },
    { title: 'PIN Protetto', icon: <ShieldCheck className="text-white/70" />, desc: 'Protezione aggiuntiva configurabile per singoli dispositivi.' },
    { title: 'Design Premium', icon: <Settings className="text-white/70" />, desc: 'Glassmorphism, sfocature e micro-animazioni fluide.' },
  ];

  return (
    <section id="features" className="relative z-10 px-4 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-3xl font-semibold md:text-5xl">
            Una dashboard piu bella,<br className="hidden md:block" />
            <span className="text-white/50">fluida e personalizzabile.</span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/60">
            Configurazione visuale direttamente dalla dashboard. Dimentica lo YAML
            per il posizionamento degli elementi: seleziona, trascina, configura e goditi la tua casa.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {allFeatures.map((feat, idx) => (
            <GlassCard key={idx} className="glass-panel-hover p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                {feat.icon}
              </div>
              <h3 className="mb-2 font-medium text-white">{feat.title}</h3>
              <p className="text-sm leading-relaxed text-white/50">{feat.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};
