import { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui';

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Funzionalità', href: '#features' },
    { name: 'Demo', href: '#demo' },
    { name: 'Installazione', href: '#installation' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'py-4 bg-[#05070d]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl' 
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
            <Home className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="font-semibold text-white tracking-tight hidden sm:block">
            HA Dashboard
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          <Button href="#installation" className="px-5 py-2.5 text-sm">
            Inizia Ora
          </Button>
        </div>

      </div>
    </motion.header>
  );
};
