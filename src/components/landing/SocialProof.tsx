import { motion } from 'framer-motion';
import { Star, Home, Cpu, Wifi, Globe, Hexagon } from 'lucide-react';
import { GlassCard } from './ui';

export const SocialProof = () => {
  const testimonials = [
    {
      quote: "Finalmente un'interfaccia all'altezza della potenza di Home Assistant. Il livello di cura dei dettagli e le animazioni sono incredibili. Configurare tutto senza YAML è una boccata d'aria fresca.",
      author: "Marco V.",
      role: "Home Automation Enthusiast",
      initial: "M",
      color: "from-cyan-400 to-blue-500"
    },
    {
      quote: "Ho abbandonato completamente le vecchie dashboard. Questa interfaccia ha trasformato il tablet appeso in salotto in un vero e proprio hub di design premium. Assolutamente consigliata.",
      author: "Elena R.",
      role: "Maker & Tech Reviewer",
      initial: "E",
      color: "from-purple-400 to-pink-500"
    },
    {
      quote: "La reattività su mobile e la gestione sicura di allarme e serrature mi hanno convinto al primo utilizzo. È esattamente ciò che mancava nell'ecosistema smart home.",
      author: "Alessandro T.",
      role: "Smart Home Installer",
      initial: "A",
      color: "from-amber-400 to-orange-500"
    }
  ];

  const logos = [
    { name: "SmartHome Italia", icon: <Home className="w-5 h-5" /> },
    { name: "Tech Domotica", icon: <Cpu className="w-5 h-5" /> },
    { name: "Connected Living", icon: <Wifi className="w-5 h-5" /> },
    { name: "HA Community", icon: <Hexagon className="w-5 h-5" /> },
    { name: "Global Smart", icon: <Globe className="w-5 h-5" /> }
  ];

  return (
    <section className="py-24 px-4 md:px-8 relative z-10 border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">Scelto da chi ama la smart home</h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Installatori, appassionati e maker utilizzano ogni giorno la nostra dashboard per controllare la loro casa.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <GlassCard className="p-8 h-full flex flex-col glass-panel-hover">
                <div className="flex gap-1 mb-6 text-cyan-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-white/80 leading-relaxed mb-8 flex-1 text-sm md:text-base">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-semibold shadow-lg`}>
                    {testimonial.initial}
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">{testimonial.author}</h4>
                    <p className="text-white/40 text-xs">{testimonial.role}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Trusted By Logos */}
        <div className="text-center">
          <p className="text-sm font-medium text-white/30 tracking-widest uppercase mb-8">Compatibile e apprezzato da</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {logos.map((logo, idx) => (
              <div key={idx} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors cursor-default">
                {logo.icon}
                <span className="font-semibold text-sm md:text-base">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
