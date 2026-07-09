import { motion } from 'framer-motion';
import { 
  Settings, Layout, Zap, Thermometer, ShieldAlert, Lock, Lightbulb, 
  Power, Droplet, Flame, Camera, Palette, Fingerprint, Move, PanelsTopLeft, ShieldCheck
} from 'lucide-react';
import { GlassCard } from './ui';

export const Features = () => {
  const allFeatures = [
    { title: "Layout Responsive", icon: <Layout className="text-white/70" />, desc: "Design adattivo per desktop, tablet e mobile." },
    { title: "Drag & Drop", icon: <Move className="text-white/70" />, desc: "Riordina le card liberamente per creare la dashboard perfetta." },
    { title: "Card Dinamiche", icon: <Zap className="text-white/70" />, desc: "Varianti visive compatte o complete in base allo spazio." },
    { title: "Pannelli Contestuali", icon: <PanelsTopLeft className="text-white/70" />, desc: "Controlli avanzati disponibili con un tap senza ingombrare la UI." },
    { title: "Controlli Clima Avanzati", icon: <Thermometer className="text-white/70" />, desc: "Termostati, ventole e sensori con controlli intuitivi." },
    { title: "Luci e Colori", icon: <Palette className="text-white/70" />, desc: "Gestione avanzata della luminosità e della temperatura colore." },
    { title: "Sensori Intelligenti", icon: <Zap className="text-white/70" />, desc: "Stato in tempo reale, unità di misura e preview visive." },
    { title: "Allarme e Sicurezza", icon: <ShieldAlert className="text-white/70" />, desc: "Gestione completa del sistema di allarme con overlay sicuri." },
    { title: "Serrature Smart", icon: <Lock className="text-white/70" />, desc: "Controllo immediato delle porte con feedback sullo stato." },
    { title: "Autenticazione Biometrica", icon: <Fingerprint className="text-white/70" />, desc: "Supporto a Face ID e Touch ID per azioni sensibili." },
    { title: "PIN Protetto", icon: <ShieldCheck className="text-white/70" />, desc: "Protezione aggiuntiva configurabile per singoli dispositivi." },
    { title: "Design Premium", icon: <Settings className="text-white/70" />, desc: "Glassmorphism, sfocature e micro-animazioni fluide." }
  ];

  const supportedCards = [
    { name: "Sensor", icon: <Zap className="w-5 h-5" /> },
    { name: "Light", icon: <Lightbulb className="w-5 h-5" /> },
    { name: "Switch", icon: <Power className="w-5 h-5" /> },
    { name: "Climate", icon: <Thermometer className="w-5 h-5" /> },
    { name: "Alarm", icon: <ShieldAlert className="w-5 h-5" /> },
    { name: "Lock", icon: <Lock className="w-5 h-5" /> },
    { name: "Environment", icon: <Droplet className="w-5 h-5" /> },
    { name: "Energy", icon: <Zap className="w-5 h-5" /> },
    { name: "Electricity", icon: <Power className="w-5 h-5" /> },
    { name: "Gas", icon: <Flame className="w-5 h-5" /> },
    { name: "Water", icon: <Droplet className="w-5 h-5" /> },
    { name: "Consumption", icon: <Zap className="w-5 h-5" /> },
    { name: "Camera", icon: <Camera className="w-5 h-5" /> },
    { name: "Scene", icon: <Palette className="w-5 h-5" /> },
  ];

  return (
    <section id="features" className="py-24 px-4 md:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Core Capabilities */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-semibold mb-6">
            Una dashboard più bella,<br className="hidden md:block"/>
            <span className="text-white/50">fluida e personalizzabile.</span>
          </h2>
          <p className="text-lg text-white/60 leading-relaxed max-w-3xl mx-auto">
            Configurazione visuale direttamente dalla dashboard. Dimentica lo YAML 
            per il posizionamento degli elementi: seleziona, trascina, configura e goditi la tua casa.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-32">
          {allFeatures.map((feat, idx) => (
            <GlassCard key={idx} className="p-6 glass-panel-hover">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                {feat.icon}
              </div>
              <h3 className="font-medium text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{feat.desc}</p>
            </GlassCard>
          ))}
        </div>

        {/* Supported Cards */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">Supporto completo per la tua casa</h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Ogni card può assumere varianti visive diverse in base allo spazio disponibile e al breakpoint. 
            Modalità compatte, standard o complete, decidi tu.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
          {supportedCards.map((card, idx) => (
            <div key={idx} className="flex items-center gap-2 px-5 py-3 rounded-full glass-panel border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-cyan-400">{card.icon}</span>
              <span className="text-white/80 font-medium text-sm">{card.name}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
