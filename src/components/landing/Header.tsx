import { useState, useEffect } from 'react';
import { Download, Menu, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './ui';
import { BRAND_NAME, SECTION_IDS } from './brand';

const navLinks = [
  { name: 'Funzionalità', href: `#${SECTION_IDS.features}` },
  { name: 'Demo', href: `#${SECTION_IDS.demo}` },
  { name: 'Edizioni', href: `#${SECTION_IDS.editions}` },
  { name: 'Prezzi', href: `#${SECTION_IDS.pricing}` },
  { name: 'FAQ', href: `#${SECTION_IDS.faq}` },
];

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled || menuOpen
            ? 'border-b border-white/5 bg-[#05070d]/85 shadow-2xl backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-[padding] duration-300 md:px-8 ${
            scrolled ? 'py-3' : 'py-4 md:py-5'
          }`}
        >
          {/* Logo */}
          <a href="#top" onClick={closeMenu} className="group flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.12] to-white/[0.02] shadow-inner backdrop-blur-md transition-colors group-hover:border-white/20">
              <Sparkles className="h-4 w-4 text-cyan-300" strokeWidth={2} />
            </span>
            <span className="hidden font-display font-semibold tracking-tight text-white sm:block">{BRAND_NAME}</span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-white/60 transition-colors hover:text-white"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <a
              href={`#${SECTION_IDS.pricing}`}
              className="hidden text-sm font-medium text-white/60 transition-colors hover:text-white lg:block"
            >
              Installa gratis
            </a>
            <Button variant="premium" href={`#${SECTION_IDS.pricing}`} className="px-4 py-2 text-sm md:px-5 md:py-2.5">
              <Sparkles className="h-4 w-4" />
              Versione Pro
            </Button>
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
              aria-expanded={menuOpen}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {menuOpen ? (
            <motion.nav
              key="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-white/5 md:hidden"
            >
              <div className="flex flex-col gap-1 px-4 pb-5 pt-2">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={closeMenu}
                    className="rounded-xl px-3 py-3 text-base font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {link.name}
                  </a>
                ))}
                <a
                  href={`#${SECTION_IDS.editions}`}
                  onClick={closeMenu}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                  Installa gratis (HACS)
                </a>
              </div>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </motion.header>

      {/* Backdrop */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.button
            key="menu-backdrop"
            type="button"
            aria-hidden
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMenu}
            className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm md:hidden"
          />
        ) : null}
      </AnimatePresence>
    </>
  );
};
