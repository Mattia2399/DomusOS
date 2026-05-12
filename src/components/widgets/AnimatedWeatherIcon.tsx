import React, { useId } from 'react';
import clsx from 'clsx';

type WeatherVariant =
  | 'sun'
  | 'moon'
  | 'cloud-sun'
  | 'cloud'
  | 'fog'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'wind'
  | 'cloud-moon';

type AnimatedWeatherIconProps = {
  condition?: string;
  size?: number | string;
  className?: string;
};

const CONDITION_VARIANTS: Record<string, WeatherVariant> = {
  sunny: 'sun',
  'clear-night': 'moon',
  partlycloudy: 'cloud-sun',
  cloudy: 'cloud',
  fog: 'fog',
  rainy: 'rain',
  pouring: 'rain',
  lightning: 'storm',
  'lightning-rainy': 'storm',
  snowy: 'snow',
  'snowy-rainy': 'snow',
  hail: 'snow',
  windy: 'wind',
  'windy-variant': 'wind',
  exceptional: 'cloud-moon',
};

function SunSvg({ size }: { size: number | string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-anim__icon" aria-hidden="true">
      <g stroke="#FDE68A" strokeWidth="3" strokeLinecap="round">
        <line x1="32" y1="6" x2="32" y2="14" />
        <line x1="32" y1="50" x2="32" y2="58" />
        <line x1="6" y1="32" x2="14" y2="32" />
        <line x1="50" y1="32" x2="58" y2="32" />
        <line x1="12" y1="12" x2="18" y2="18" />
        <line x1="46" y1="46" x2="52" y2="52" />
        <line x1="12" y1="52" x2="18" y2="46" />
        <line x1="46" y1="18" x2="52" y2="12" />
      </g>
      <circle cx="32" cy="32" r="11" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2" />
    </svg>
  );
}

function MoonSvg({ size, maskId }: { size: number | string; maskId: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-anim__icon" aria-hidden="true">
      <mask id={maskId}>
        <rect width="64" height="64" fill="white" />
        <circle cx="38" cy="24" r="16" fill="black" />
      </mask>
      <circle cx="28" cy="30" r="18" fill="#93C5FD" mask={`url(#${maskId})`} />
      <circle cx="24" cy="28" r="18" fill="none" stroke="#60A5FA" strokeWidth="2" mask={`url(#${maskId})`} />
    </svg>
  );
}

function CloudBase({ size, accent = false }: { size: number | string; accent?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-anim__icon" aria-hidden="true">
      <path
        d="M20 46h26a11 11 0 0 0 0-22 15 15 0 0 0-29-4A10 10 0 0 0 20 46z"
        fill={accent ? '#93C5FD' : '#B8C0CC'}
        stroke={accent ? '#60A5FA' : '#94A3B8'}
        strokeWidth="2"
      />
      <path d="M22 44h22a9 9 0 0 0 0-18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
    </svg>
  );
}

function CloudSunSvg({ size }: { size: number | string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-anim__icon" aria-hidden="true">
      <g opacity="0.9">
        <circle cx="22" cy="22" r="9" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2" />
        <g stroke="#FDE68A" strokeWidth="2" strokeLinecap="round">
          <line x1="22" y1="6" x2="22" y2="12" />
          <line x1="22" y1="32" x2="22" y2="38" />
          <line x1="6" y1="22" x2="12" y2="22" />
          <line x1="32" y1="22" x2="38" y2="22" />
        </g>
      </g>
      <path
        d="M22 46h26a11 11 0 0 0 0-22 15 15 0 0 0-29-4A10 10 0 0 0 22 46z"
        fill="#B8C0CC"
        stroke="#94A3B8"
        strokeWidth="2"
      />
    </svg>
  );
}

function CloudMoonSvg({ size, maskId }: { size: number | string; maskId: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-anim__icon" aria-hidden="true">
      <mask id={maskId}>
        <rect width="64" height="64" fill="white" />
        <circle cx="36" cy="22" r="14" fill="black" />
      </mask>
      <circle cx="26" cy="28" r="16" fill="#93C5FD" mask={`url(#${maskId})`} />
      <path
        d="M22 46h26a11 11 0 0 0 0-22 15 15 0 0 0-29-4A10 10 0 0 0 22 46z"
        fill="#B8C0CC"
        stroke="#94A3B8"
        strokeWidth="2"
      />
    </svg>
  );
}

function FogSvg({ size }: { size: number | string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-anim__icon" aria-hidden="true">
      <path
        d="M20 40h26a10 10 0 0 0 0-20 14 14 0 0 0-27-4A10 10 0 0 0 20 40z"
        fill="#C7CCD6"
        stroke="#A3AAB5"
        strokeWidth="2"
      />
      <g stroke="#94A3B8" strokeWidth="3" strokeLinecap="round">
        <line x1="16" y1="46" x2="48" y2="46" />
        <line x1="12" y1="54" x2="44" y2="54" />
      </g>
    </svg>
  );
}

function RainSvg({ size }: { size: number | string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-anim__icon" aria-hidden="true">
      <path
        d="M20 36h26a10 10 0 0 0 0-20 14 14 0 0 0-27-4A10 10 0 0 0 20 36z"
        fill="#B8C0CC"
        stroke="#94A3B8"
        strokeWidth="2"
      />
      <g stroke="#7DD3FC" strokeWidth="3" strokeLinecap="round">
        <line x1="24" y1="44" x2="20" y2="52" />
        <line x1="34" y1="44" x2="30" y2="52" />
        <line x1="44" y1="44" x2="40" y2="52" />
      </g>
    </svg>
  );
}

function StormSvg({ size }: { size: number | string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-anim__icon" aria-hidden="true">
      <path
        d="M20 34h26a10 10 0 0 0 0-20 14 14 0 0 0-27-4A10 10 0 0 0 20 34z"
        fill="#B8C0CC"
        stroke="#94A3B8"
        strokeWidth="2"
      />
      <polygon points="30,36 24,50 32,50 28,62 42,44 34,44 38,36" fill="#FACC15" />
    </svg>
  );
}

function SnowSvg({ size }: { size: number | string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-anim__icon" aria-hidden="true">
      <path
        d="M20 34h26a10 10 0 0 0 0-20 14 14 0 0 0-27-4A10 10 0 0 0 20 34z"
        fill="#C7D2FE"
        stroke="#A5B4FC"
        strokeWidth="2"
      />
      <g fill="#E2E8F0">
        <circle cx="24" cy="46" r="2.5" />
        <circle cx="34" cy="50" r="2.5" />
        <circle cx="44" cy="46" r="2.5" />
      </g>
    </svg>
  );
}

function WindSvg({ size }: { size: number | string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-anim__icon" aria-hidden="true">
      <g stroke="#93C5FD" strokeWidth="4" strokeLinecap="round">
        <path d="M12 26h26a6 6 0 1 0-6-6" />
        <path d="M10 38h34a6 6 0 1 1-6 6" />
        <path d="M18 50h18" />
      </g>
    </svg>
  );
}

function renderIcon(variant: WeatherVariant, size: number | string, maskId: string) {
  switch (variant) {
    case 'sun':
      return <SunSvg size={size} />;
    case 'moon':
      return <MoonSvg size={size} maskId={maskId} />;
    case 'cloud-sun':
      return <CloudSunSvg size={size} />;
    case 'cloud':
      return <CloudBase size={size} />;
    case 'fog':
      return <FogSvg size={size} />;
    case 'rain':
      return <RainSvg size={size} />;
    case 'storm':
      return <StormSvg size={size} />;
    case 'snow':
      return <SnowSvg size={size} />;
    case 'wind':
      return <WindSvg size={size} />;
    case 'cloud-moon':
      return <CloudMoonSvg size={size} maskId={maskId} />;
    default:
      return <CloudBase size={size} />;
  }
}

export function AnimatedWeatherIcon({ condition, size = 28, className }: AnimatedWeatherIconProps) {
  const normalized = (condition ?? '').trim().toLowerCase();
  const variant = CONDITION_VARIANTS[normalized] ?? 'cloud-sun';
  const maskId = useId();

  return (
    <span className={clsx('relative inline-flex items-center justify-center weather-anim', className)}>
      <span className={`weather-anim__wrapper weather-anim__wrapper--${variant}`}>
        {renderIcon(variant, size, maskId)}
      </span>
      {variant === 'rain' ? (
        <>
          <span className="weather-anim__drop weather-anim__drop--1" />
          <span className="weather-anim__drop weather-anim__drop--2" />
          <span className="weather-anim__drop weather-anim__drop--3" />
        </>
      ) : null}
      {variant === 'snow' ? (
        <>
          <span className="weather-anim__flake weather-anim__flake--1" />
          <span className="weather-anim__flake weather-anim__flake--2" />
        </>
      ) : null}
      {variant === 'storm' ? <span className="weather-anim__flash" /> : null}
      {variant === 'wind' ? <span className="weather-anim__wind" /> : null}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes weather-float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-4px); }
              100% { transform: translateY(0px); }
            }
            @keyframes weather-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes weather-rain {
              0% { transform: translateY(0px); opacity: 0; }
              30% { opacity: 1; }
              100% { transform: translateY(10px); opacity: 0; }
            }
            @keyframes weather-snow {
              0% { transform: translateY(0px) translateX(0px); opacity: 0; }
              40% { opacity: 1; }
              100% { transform: translateY(10px) translateX(4px); opacity: 0; }
            }
            @keyframes weather-flash {
              0% { opacity: 0; }
              8% { opacity: 0.9; }
              16% { opacity: 0; }
              100% { opacity: 0; }
            }
            @keyframes weather-wind {
              0% { transform: translateX(0px); opacity: 0.2; }
              50% { transform: translateX(6px); opacity: 0.6; }
              100% { transform: translateX(0px); opacity: 0.2; }
            }

            .weather-anim__wrapper { display: inline-flex; animation: weather-float 6s ease-in-out infinite; }
            .weather-anim__wrapper--sun { animation: weather-float 5s ease-in-out infinite; }
            .weather-anim__wrapper--sun .weather-anim__icon { animation: weather-spin 18s linear infinite; }
            .weather-anim__wrapper--wind { animation: weather-float 4.5s ease-in-out infinite; }
            .weather-anim__wrapper--storm .weather-anim__icon { animation: weather-float 4s ease-in-out infinite; }

            .weather-anim__drop {
              position: absolute;
              bottom: -2px;
              width: 4px;
              height: 10px;
              border-radius: 999px;
              background: rgba(56,189,248,0.85);
              animation: weather-rain 1.2s ease-in-out infinite;
            }
            .weather-anim__drop--1 { left: 45%; animation-delay: 0s; }
            .weather-anim__drop--2 { left: 55%; animation-delay: 0.2s; }
            .weather-anim__drop--3 { left: 35%; animation-delay: 0.4s; }

            .weather-anim__flake {
              position: absolute;
              bottom: -2px;
              width: 5px;
              height: 5px;
              border-radius: 999px;
              background: rgba(255,255,255,0.9);
              animation: weather-snow 1.6s ease-in-out infinite;
            }
            .weather-anim__flake--1 { left: 40%; animation-delay: 0s; }
            .weather-anim__flake--2 { left: 60%; animation-delay: 0.4s; }

            .weather-anim__flash {
              position: absolute;
              inset: -8px;
              border-radius: 999px;
              background: radial-gradient(circle, rgba(251,191,36,0.55) 0%, transparent 70%);
              animation: weather-flash 5s ease-in-out infinite;
            }

            .weather-anim__wind {
              position: absolute;
              bottom: -4px;
              left: -6px;
              width: 24px;
              height: 3px;
              border-radius: 999px;
              background: linear-gradient(90deg, rgba(148,163,184,0.1), rgba(148,163,184,0.65), rgba(148,163,184,0.1));
              animation: weather-wind 3s ease-in-out infinite;
            }
          `,
        }}
      />
    </span>
  );
}
