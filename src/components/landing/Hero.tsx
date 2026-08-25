import { motion } from 'framer-motion';
import { ArrowRight, Download, Sparkles } from 'lucide-react';
import { Badge, Button } from './ui';
import { DashboardMockup } from './Mockup';
import { BRAND_TAGLINE, SECTION_IDS } from './brand';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export const Hero = () => {
  return (
    <section id="top" className="relative overflow-hidden px-4 pb-20 pt-28 md:px-8 md:pb-24 md:pt-40">
      {/* Aurora depth field */}
      <div className="aurora aurora-drift left-[-12%] top-[-18%] h-[46rem] w-[46rem] bg-[radial-gradient(circle,rgba(56,189,248,0.28),transparent_60%)]" />
      <div className="aurora left-[38%] top-[-10%] h-[34rem] w-[34rem] bg-[radial-gradient(circle,rgba(129,140,248,0.22),transparent_60%)]" />
      <div className="aurora right-[-14%] top-[6%] h-[38rem] w-[38rem] bg-[radial-gradient(circle,rgba(45,212,191,0.14),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6 }}
          className="mb-8 flex justify-center"
        >
          <Badge>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>
            Beta pubblica · Design Liquid Glass
          </Badge>
        </motion.div>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display mb-6 text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-7xl"
        >
          La tua casa,
          <br className="hidden md:block" /> <span className="text-gradient-glass">fluida come il vetro.</span>
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/60 md:text-xl"
        >
          {BRAND_TAGLINE} Trasforma qualsiasi tablet in una console di lusso per Home Assistant:
          controlli avanzati, sicurezza biometrica e animazioni native. Zero lag.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-14 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button variant="premium" href={`#${SECTION_IDS.pricing}`} className="w-full sm:w-auto">
            <Sparkles className="h-4 w-4" />
            Scopri la versione Pro
          </Button>
          <Button variant="secondary" href={`#${SECTION_IDS.editions}`} className="w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Installa gratis (HACS)
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mb-4 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-medium text-white/40"
        >
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" /> 14+ card supportate
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Desktop · Tablet · Mobile
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Face ID &amp; Touch ID
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Home Assistant live
          </span>
        </motion.div>
      </div>

      <DashboardMockup />
    </section>
  );
};
