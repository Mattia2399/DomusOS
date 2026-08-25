import { GlassCard, Reveal, SectionHeading } from './ui';
import { BRAND_NAME, SECTION_IDS } from './brand';

export const FAQ = () => {
  const faqs = [
    {
      q: 'È compatibile con la mia installazione di Home Assistant?',
      a: `Sì. ${BRAND_NAME} si collega direttamente al tuo Home Assistant e supporta installazioni HA OS, Supervised e Container (Docker).`,
    },
    {
      q: 'Che differenza c’è tra la HACS Edition e la Pro?',
      a: 'La HACS Edition è la web app completa, gratuita e self-hosted. La Pro è l’app nativa iOS/Android con funzioni che richiedono l’hardware del dispositivo: Kiosk Mode, Wake-on-Motion, Face ID di sistema e screensaver avanzato.',
    },
    {
      q: 'La versione Pro è già disponibile?',
      a: 'L’app Pro è in arrivo. Puoi iscriverti alla lista d’attesa per ricevere l’accesso anticipato e bloccare il prezzo di lancio una tantum, senza alcun abbonamento.',
    },
    {
      q: 'Devo conoscere o scrivere codice YAML?',
      a: 'No. La configurazione è completamente visuale: posiziona, ridimensiona e configura le card dall’interfaccia, senza toccare una riga di codice.',
    },
    {
      q: 'Come viene garantita la sicurezza per allarmi e serrature?',
      a: 'Per le azioni sensibili puoi richiedere l’autenticazione biometrica del dispositivo o un PIN. È una conferma di presenza locale, non sostituisce i permessi di Home Assistant, che resta l’autorità finale.',
    },
    {
      q: 'I miei dati vengono inviati su server esterni?',
      a: 'No. La dashboard comunica in locale (o tramite la tua connessione remota sicura) con la tua istanza di Home Assistant. Non raccogliamo i dati dei tuoi sensori o delle tue telecamere.',
    },
  ];

  return (
    <section id={SECTION_IDS.faq} className="relative z-10 border-t border-white/5 px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Domande frequenti"
          title="Tutto quello che ti serve sapere."
          subtitle={`Ancora dubbi su ${BRAND_NAME}? Ecco le risposte più richieste.`}
          className="mb-16"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {faqs.map((faq, idx) => (
            <Reveal key={faq.q} delay={(idx % 2) * 0.08}>
              <GlassCard className="glass-panel-hover h-full rounded-3xl p-6">
                <h4 className="mb-3 text-lg font-medium text-white">{faq.q}</h4>
                <p className="text-sm leading-relaxed text-white/55">{faq.a}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
