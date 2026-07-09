import { motion } from 'framer-motion';
import { GlassCard, Button } from './ui';

export const ActionSections = () => {
  return (
    <div className="relative z-10">
      
      {/* Design System Section */}
      <section className="py-24 px-4 md:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h2 className="text-3xl md:text-5xl font-semibold mb-6">Un design system pensato <br className="hidden md:block"/> per sembrare nativo.</h2>
            <p className="text-lg text-white/60 leading-relaxed">
              Ogni elemento è progettato per integrarsi in una dashboard moderna: card morbide, 
              pannelli contestuali, animazioni fluide, stati dinamici e componenti responsive 
              che mantengono leggibilità e proporzioni su ogni dispositivo.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-80">
             {/* Decorative design system elements */}
             <div className="h-24 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/5 flex items-center justify-center text-white/30 text-sm font-medium">Glassmorphism</div>
             <div className="h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-transparent border border-cyan-500/10 flex items-center justify-center text-cyan-400/50 text-sm font-medium">Fluidity</div>
             <div className="h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/10 flex items-center justify-center text-blue-400/50 text-sm font-medium">Consistency</div>
             <div className="h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/10 flex items-center justify-center text-purple-400/50 text-sm font-medium">Typography</div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-4 md:px-8 text-center relative overflow-hidden bg-gradient-to-t from-cyan-900/10 to-transparent">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] opacity-20 [mask-image:linear-gradient(to_bottom,transparent,white,transparent)]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[100px] -z-10"></div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Porta la tua smart home <br className="hidden md:block"/>
            a un altro livello.
          </h2>
          <p className="text-xl text-white/60 mb-10">
            Una dashboard più bella, più chiara e più sicura per controllare la casa ogni giorno.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button className="w-full sm:w-auto text-lg px-8 py-4">
              Inizia ora
            </Button>
            <Button variant="secondary" href="#installation" className="w-full sm:w-auto text-lg px-8 py-4">
              Scopri l'installazione
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
