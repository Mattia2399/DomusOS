import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Lock, Thermometer, ShieldAlert, Zap } from 'lucide-react';
import { GlassCard } from './ui';

export const InteractiveDemo = () => {
  const [lightOn, setLightOn] = useState(false);
  const [locked, setLocked] = useState(true);
  const [temp, setTemp] = useState(21.5);
  const [alarmArmed, setAlarmArmed] = useState(true);

  return (
    <section id="demo" className="py-24 px-4 md:px-8 relative z-10 border-t border-white/5 bg-gradient-to-b from-transparent to-blue-900/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-semibold mb-6">Tocca con mano l'esperienza</h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Interagisci con le card qui sotto per farti un'idea della fluidità e della reattività della dashboard. Prova a cliccare o passare il cursore sopra gli elementi.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          
          {/* Light Interactive Card */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="col-span-2 md:col-span-1 cursor-pointer">
            <GlassCard className={`p-5 h-full transition-all duration-500 relative overflow-hidden ${lightOn ? 'border-yellow-500/50 bg-yellow-500/10' : 'hover:border-white/20'}`} >
              <div 
                className="absolute inset-0 z-10" 
                onClick={() => setLightOn(!lightOn)}
              />
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-700 pointer-events-none ${lightOn ? 'bg-yellow-500/20 scale-150' : 'bg-transparent scale-100'}`}></div>
              
              <div className="flex justify-between items-start mb-6 relative z-0">
                <div className={`p-3 rounded-xl transition-colors duration-300 ${lightOn ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/50'}`}>
                  <Lightbulb size={24} />
                </div>
              </div>
              <div className="relative z-0">
                <p className="font-medium text-white/90">Luce Salotto</p>
                <p className={`text-sm transition-colors duration-300 ${lightOn ? 'text-yellow-400' : 'text-white/40'}`}>
                  {lightOn ? 'Accesa • 100%' : 'Spenta'}
                </p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Lock Interactive Card */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="col-span-2 md:col-span-1 cursor-pointer">
            <GlassCard className={`p-5 h-full transition-all duration-500 relative overflow-hidden ${!locked ? 'border-amber-500/50 bg-amber-500/10' : 'hover:border-white/20'}`}>
              <div 
                className="absolute inset-0 z-10" 
                onClick={() => setLocked(!locked)}
              />
              <div className="flex justify-between items-start mb-6 relative z-0">
                <div className={`p-3 rounded-xl transition-colors duration-300 ${locked ? 'bg-white/5 text-white/50' : 'bg-amber-500/20 text-amber-400'}`}>
                  <Lock size={24} />
                </div>
              </div>
              <div className="relative z-0">
                <p className="font-medium text-white/90">Porta Ingresso</p>
                <p className={`text-sm transition-colors duration-300 ${locked ? 'text-white/40' : 'text-amber-400'}`}>
                  {locked ? 'Bloccata' : 'Sbloccata'}
                </p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Climate Interactive Card */}
          <motion.div className="col-span-2">
            <GlassCard className="p-5 h-full hover:border-white/20 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                    <Thermometer size={20} />
                  </div>
                  <span className="font-medium text-white/90">Termostato</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-md bg-orange-500/20 text-orange-400">Riscaldamento</span>
              </div>
              <div className="flex items-center justify-between mt-6">
                <button 
                  onClick={() => setTemp(prev => prev - 0.5)}
                  className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors"
                >
                  -
                </button>
                <div className="text-center">
                  <span className="text-4xl font-light text-white">{temp.toFixed(1)}°</span>
                  <p className="text-white/40 text-xs mt-1">Obiettivo</p>
                </div>
                <button 
                  onClick={() => setTemp(prev => prev + 0.5)}
                  className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors"
                >
                  +
                </button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Alarm Interactive Card */}
          <motion.div className="col-span-2 md:col-span-4">
             <GlassCard className={`p-6 transition-all duration-500 ${alarmArmed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${alarmArmed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      <ShieldAlert size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Allarme Casa</h3>
                      <p className={`text-sm ${alarmArmed ? 'text-green-400' : 'text-red-400'}`}>
                        {alarmArmed ? 'Inserito Totale - Nessuna anomalia' : 'Disinserito - Sistema in standby'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setAlarmArmed(false)}
                      className={`px-6 py-3 rounded-xl font-medium transition-colors text-sm ${!alarmArmed ? 'bg-white/10 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                    >
                      Disinserisci
                    </button>
                    <button 
                      onClick={() => setAlarmArmed(true)}
                      className={`px-6 py-3 rounded-xl font-medium transition-colors text-sm ${alarmArmed ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                    >
                      Inserisci
                    </button>
                  </div>
                </div>
             </GlassCard>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
