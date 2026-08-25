import type { ComponentProps, ReactNode } from 'react';
import { motion } from 'framer-motion';

export const Badge = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-md ${className}`}
  >
    {children}
  </span>
);

export const Pill = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/55 ${className}`}
  >
    {children}
  </span>
);

type ButtonVariant = 'primary' | 'secondary' | 'premium';

export const Button = ({
  children,
  variant = 'primary',
  className = '',
  as = 'button',
  href,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  as?: 'button' | 'a';
  href?: string;
}) => {
  const base =
    'group/btn inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-all duration-300 cursor-pointer md:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070d]';
  const variants: Record<ButtonVariant, string> = {
    // Premium gradient CTA for the Pro path.
    premium:
      'relative overflow-hidden bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 text-[#04121a] font-semibold shadow-[0_10px_40px_-8px_rgba(56,189,248,0.6)] hover:shadow-[0_16px_60px_-8px_rgba(99,102,241,0.7)] hover:scale-[1.03]',
    // Clean, high-contrast white button.
    primary:
      'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white/90 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]',
    // Glassy secondary.
    secondary: 'glass-panel text-white hover:bg-white/10 hover:scale-[1.03]',
  };

  const combinedClassName = `${base} ${variants[variant]} ${className}`;

  if (as === 'a' || href) {
    return (
      <a href={href ?? '#'} className={combinedClassName}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={combinedClassName}>
      {children}
    </button>
  );
};

export const GlassCard = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`glass-panel overflow-hidden rounded-[24px] md:rounded-[36px] ${className}`}>{children}</div>
);

/**
 * Scroll-triggered reveal. Fades + slides content in once it enters the viewport.
 * Respects prefers-reduced-motion via Framer Motion's built-in reduced-motion handling
 * (transforms collapse to opacity-only for users who opt out).
 */
export const Reveal = ({
  children,
  delay = 0,
  y = 24,
  className = '',
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'li' | 'section';
}) => {
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </MotionTag>
  );
};

/** Consistent, centered section heading with an optional eyebrow + subtitle. */
export const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'center' | 'left';
  className?: string;
}) => {
  const alignment = align === 'center' ? 'mx-auto text-center items-center' : 'text-left items-start';
  return (
    <Reveal className={`flex max-w-3xl flex-col ${alignment} ${className}`}>
      {eyebrow ? (
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/70">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-3xl font-semibold leading-[1.1] text-white md:text-5xl">{title}</h2>
      {subtitle ? (
        <p className={`mt-5 text-lg leading-relaxed text-white/55 ${align === 'center' ? 'max-w-2xl' : ''}`}>
          {subtitle}
        </p>
      ) : null}
    </Reveal>
  );
};

/** Reusable aurora blob for section backgrounds. */
export const Aurora = ({
  className = '',
  drift = false,
  ...rest
}: { drift?: boolean } & ComponentProps<'div'>) => (
  <div aria-hidden className={`aurora ${drift ? 'aurora-drift' : ''} ${className}`} {...rest} />
);
