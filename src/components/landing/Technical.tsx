import { motion } from 'framer-motion';
import { Smartphone, Monitor, Tablet, ShieldCheck, Lock, ScanFace, Fingerprint } from 'lucide-react';
import { GlassCard } from './ui';

export const Technical = () => {
  const installMethods = [
    {
      method: "Add-on Home Assistant",
      ideal: "Utenti HA OS / Supervised",
      functions: "Complete",
      updates: "Guidati",
      difficulty: "Bassa",
      highlight: true
    },
    {
      method: "Docker",
      ideal: "Server personali e setup avanzati",
      functions: "Complete",
      updates: "Manuali o automatizzabili",
      difficulty: "Media",
      highlight: false
    },
    {
      method: "Versione hosted/cloud",
      ideal: "Chi vuole iniziare rapidamente",
      functions: "In base al piano",
      updates: "Automatici",
      difficulty: "Molto bassa",
      highlight: false
    },
    {
      method: "Installazione manuale",
      ideal: "Sviluppatori o utenti esperti",
      functions: "Complete",
      updates: "Manuali",
      difficulty: "Alta",
      highlight: false
    }
  ];

  return (
    <section id="installation" className="py-24 px-4 md:px-8 relative z-10 border-t border-white/5 bg-white/[0.01]">
      <div className="max-w-7xl mx-auto">
        
        {/* Security Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Sicurezza pensata per la smart home reale.</h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Per i comandi sensibili come allarmi e serrature, HA Dashboard Builder offre un'autenticazione all'avanguardia, sicura e senza frizioni.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <GlassCard className="p-6 text-center glass-panel-hover flex flex-col items-center">
              <ScanFace className="w-12 h-12 text-blue-400 mb-4" strokeWidth={1.5} />
              <h3 className="font-medium text-white mb-2">Face ID</h3>
            </GlassCard>
            <GlassCard className="p-6 text-center glass-panel-hover flex flex-col items-center">
              <Fingerprint className="w-12 h-12 text-cyan-400 mb-4" strokeWidth={1.5} />
              <h3 className="font-medium text-white mb-2">Impronta Digitale</h3>
            </GlassCard>
            <GlassCard className="p-6 text-center glass-panel-hover flex flex-col items-center">
              <ShieldCheck className="w-12 h-12 text-green-400 mb-4" strokeWidth={1.5} />
              <h3 className="font-medium text-white mb-2">PIN Home Assistant</h3>
            </GlassCard>
            <GlassCard className="p-6 text-center glass-panel-hover flex flex-col items-center">
              <Lock className="w-12 h-12 text-amber-400 mb-4" strokeWidth={1.5} />
              <h3 className="font-medium text-white mb-2">PIN Locale Combinato</h3>
            </GlassCard>
          </div>
          
          <div className="max-w-3xl mx-auto text-center text-white/60 leading-relaxed">
            <p>
              HA Dashboard Builder può utilizzare l’autenticazione biometrica del dispositivo quando disponibile, 
              come Face ID o Touch ID. In alternativa, è possibile proteggere le azioni tramite PIN Home Assistant 
              o combinare PIN Home Assistant e PIN locale per un livello di sicurezza aggiuntivo.
            </p>
          </div>
        </div>

        {/* Installation Table */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4">Scegli come installarla</h2>
            <p className="text-white/50 text-lg">Integrata, ospitata o in container: c'è un metodo perfetto per la tua architettura.</p>
          </div>
          
          <div className="overflow-x-auto rounded-3xl border border-white/10 glass-panel">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-white/80 border-b border-white/10">
                <tr>
                  <th className="p-4 md:p-6 font-medium">Metodo di installazione</th>
                  <th className="p-4 md:p-6 font-medium">Ideale per</th>
                  <th className="p-4 md:p-6 font-medium hidden md:table-cell">Funzioni</th>
                  <th className="p-4 md:p-6 font-medium hidden lg:table-cell">Aggiornamenti</th>
                  <th className="p-4 md:p-6 font-medium">Difficoltà</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {installMethods.map((method, idx) => (
                  <tr key={idx} className={`transition-colors ${method.highlight ? 'bg-cyan-500/5 hover:bg-cyan-500/10' : 'hover:bg-white/[0.02]'}`}>
                    <td className="p-4 md:p-6 text-white font-medium flex items-center gap-2">
                      {method.method}
                      {method.highlight && <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">Consigliato</span>}
                    </td>
                    <td className="p-4 md:p-6 text-white/70">{method.ideal}</td>
                    <td className="p-4 md:p-6 text-white/50 hidden md:table-cell">{method.functions}</td>
                    <td className="p-4 md:p-6 text-white/50 hidden lg:table-cell">{method.updates}</td>
                    <td className="p-4 md:p-6">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        method.difficulty === 'Bassa' || method.difficulty === 'Molto bassa'
                          ? 'bg-green-500/20 text-green-400'
                          : method.difficulty === 'Media'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {method.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
};
