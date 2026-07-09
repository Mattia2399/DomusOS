import { GlassCard } from './ui';

export const FAQ = () => {
  const faqs = [
    {
      q: "È compatibile con la mia installazione di Home Assistant?",
      a: "Sì, HA Dashboard Builder si collega direttamente al tuo Home Assistant. Supporta installazioni Home Assistant OS, Supervised e Container (Docker)."
    },
    {
      q: "Devo conoscere o scrivere codice YAML?",
      a: "No, la configurazione è completamente visuale. Puoi posizionare, ridimensionare e configurare le card direttamente dall'interfaccia utente senza toccare una riga di codice."
    },
    {
      q: "Come viene garantita la sicurezza per allarmi e serrature?",
      a: "La sicurezza è una priorità. Per le azioni sensibili puoi richiedere l'autenticazione biometrica (Face ID, Touch ID) del tuo dispositivo o impostare un PIN di sicurezza per evitare tocchi accidentali."
    },
    {
      q: "Posso usarlo sia su smartphone che su tablet?",
      a: "Assolutamente sì. Il layout è nativamente responsive: si adatta automaticamente alle dimensioni dello schermo, ottimizzando la disposizione delle card per desktop, tablet (landscape/portrait) e smartphone."
    },
    {
      q: "I miei dati vengono inviati su server esterni?",
      a: "No, la dashboard comunica direttamente e in locale (o tramite la tua connessione remota sicura) con la tua istanza di Home Assistant. Non raccogliamo i dati dei tuoi sensori o delle tue telecamere."
    },
    {
      q: "Posso personalizzare l'aspetto delle card?",
      a: "Sì, il design system integrato permette di scegliere tra varianti visive (es. compatte o estese) in base allo spazio e alle tue preferenze, mantenendo sempre un look premium e coerente."
    }
  ];

  return (
    <section id="faq" className="py-24 px-4 md:px-8 relative z-10 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">Domande Frequenti</h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Tutto quello che c'è da sapere su HA Dashboard Builder per la tua smart home.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, idx) => (
            <div key={idx}>
              <GlassCard className="p-6 h-full glass-panel-hover">
                <h4 className="font-medium text-white mb-3 text-lg">{faq.q}</h4>
                <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
