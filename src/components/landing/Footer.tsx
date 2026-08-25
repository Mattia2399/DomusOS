import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, Github, Mail, Sparkles, Twitter, Youtube } from 'lucide-react';
import { BRAND_NAME, SECTION_IDS } from './brand';

function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    // TODO: collegare a un provider newsletter reale (es. Buttondown, ConvertKit...).
    setSubmitted(true);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8">
      <div className="mb-4 flex items-center gap-2 text-white">
        <Sparkles className="h-4 w-4 text-cyan-300" />
        <span className="font-display font-semibold">Resta aggiornato</span>
      </div>
      <p className="mb-5 text-sm leading-relaxed text-white/50">
        Novità sulla beta e accesso anticipato all&apos;app Pro. Niente spam, solo aggiornamenti che contano.
      </p>

      {submitted ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <Check className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          Perfetto! Ti scriviamo appena l&apos;app Pro è pronta.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="newsletter-email">
            Indirizzo email
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@esempio.com"
            className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400 px-5 py-2.5 text-sm font-semibold text-[#04121a] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          >
            Iscriviti
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      title: 'Prodotto',
      links: [
        { name: 'Funzionalità', href: `#${SECTION_IDS.features}` },
        { name: 'Demo', href: `#${SECTION_IDS.demo}` },
        { name: 'Edizioni', href: `#${SECTION_IDS.editions}` },
        { name: 'Prezzi', href: `#${SECTION_IDS.pricing}` },
      ],
    },
    {
      title: 'Risorse',
      links: [
        { name: 'Documentazione', href: '#' },
        { name: 'Guida all’installazione', href: `#${SECTION_IDS.editions}` },
        { name: 'Community Forum', href: '#' },
        { name: 'Changelog', href: '#' },
      ],
    },
    {
      title: 'Legale',
      links: [
        { name: 'Termini di Servizio', href: '#' },
        { name: 'Privacy Policy', href: '#' },
        { name: 'Cookie Policy', href: '#' },
        { name: 'Licenze', href: '#' },
      ],
    },
  ];

  return (
    <footer className="relative z-10 border-t border-white/5 bg-black/20 px-4 pt-16 md:px-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1.6fr]">
          {/* Brand + newsletter */}
          <div>
            <div className="mb-4 flex items-center gap-2.5 font-semibold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.12] to-white/[0.02]">
                <Sparkles className="h-4 w-4 text-cyan-300" />
              </span>
              <span className="font-display">{BRAND_NAME}</span>
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-white/50">
              La dashboard Liquid Glass per Home Assistant. Pieno controllo, zero compromessi.
            </p>
            <div className="mb-8 flex gap-4">
              {[Twitter, Github, Youtube, Mail].map((Icon, idx) => (
                <a key={idx} href="#" className="text-white/40 transition-colors hover:text-cyan-300">
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <div className="max-w-sm">
              <Newsletter />
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 font-medium text-white">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.name}>
                      <a href={link.href} className="text-sm text-white/50 transition-colors hover:text-white">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-center md:flex-row md:text-left">
          <p className="text-xs text-white/30">
            © {currentYear} {BRAND_NAME}. Tutti i diritti riservati.
          </p>
          <p className="max-w-xl text-xs text-white/30">
            Progetto indipendente, non affiliato ufficialmente con Nabu Casa o Home Assistant. Non è un sistema di
            sicurezza certificato.
          </p>
        </div>
      </div>
    </footer>
  );
};
