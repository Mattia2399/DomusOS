import { motion } from 'framer-motion';
import { ArrowRight, Layout } from 'lucide-react';
import { Badge, Button } from './ui';
import { DashboardMockup } from './Mockup';

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden px-4 md:px-8">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <Badge>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Smart Home Interface V1 Now Available
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]"
        >
          Trasforma Home Assistant in <br className="hidden md:block" />
          una <span className="text-gradient">dashboard premium.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          Crea una smart home interface elegante, responsive e sicura, con card dinamiche, 
          controlli avanzati e un’esperienza pensata per desktop, tablet e mobile.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button href="#features" className="w-full sm:w-auto">
            Scopri le funzionalità
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button variant="secondary" href="#installation" className="w-full sm:w-auto">
            Guarda i metodi di installazione
            <Layout className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>

        {/* Feature indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-white/40 mb-8"
        >
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> 14+ Card Supportate</span>
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Desktop / Tablet / Mobile</span>
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Face ID & Touch ID</span>
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Home Assistant Live</span>
        </motion.div>

        <DashboardMockup />
      </div>
    </section>
  );
};
