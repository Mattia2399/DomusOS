import type { ReactNode } from 'react';

export const Badge = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/80 backdrop-blur-md ${className}`}>
    {children}
  </span>
);

export const Button = ({ 
  children, 
  variant = 'primary', 
  className = '',
  as = 'button',
  href
}: { 
  children: ReactNode; 
  variant?: 'primary' | 'secondary'; 
  className?: string;
  as?: 'button' | 'a';
  href?: string;
}) => {
  const base = "inline-flex items-center justify-center px-7 py-3.5 rounded-full font-medium transition-all duration-300 text-sm md:text-base cursor-pointer";
  const variants = {
    primary: "bg-white text-black hover:bg-white/90 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]",
    secondary: "glass-panel text-white hover:bg-white/10 hover:scale-105"
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

export const GlassCard = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <div className={`glass-panel rounded-[24px] md:rounded-[36px] overflow-hidden ${className}`}>
    {children}
  </div>
);
