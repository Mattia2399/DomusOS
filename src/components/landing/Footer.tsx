import { Github, Twitter, Youtube, Mail, Home } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-black/20 pt-16 pb-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand & Description */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-white font-semibold mb-4">
              <Home className="w-5 h-5 text-cyan-400" />
              <span>HA Dashboard Builder</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              L'interfaccia premium di nuova generazione per controllare la tua smart home. 
              Pieno controllo, zero compromessi.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-white/40 hover:text-cyan-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/40 hover:text-cyan-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/40 hover:text-cyan-400 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/40 hover:text-cyan-400 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links - Product */}
          <div>
            <h4 className="text-white font-medium mb-4">Prodotto</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-white/50 hover:text-white transition-colors text-sm">Funzionalità</a></li>
              <li><a href="#installation" className="text-white/50 hover:text-white transition-colors text-sm">Installazione</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Card Supportate</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Roadmap</a></li>
            </ul>
          </div>

          {/* Links - Support */}
          <div>
            <h4 className="text-white font-medium mb-4">Risorse</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Documentazione</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Community Forum</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Centro Assistenza</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Changelog</a></li>
            </ul>
          </div>

          {/* Links - Legal */}
          <div>
            <h4 className="text-white font-medium mb-4">Legale</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Termini di Servizio</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Cookie Policy</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Licenze</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © {currentYear} HA Dashboard Builder. Tutti i diritti riservati.
          </p>
          <p className="text-white/30 text-xs">
            Un progetto indipendente, non affiliato ufficialmente con Nabu Casa o Home Assistant.
          </p>
        </div>
      </div>
    </footer>
  );
};
