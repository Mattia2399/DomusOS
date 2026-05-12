import React, { useEffect, useMemo, useState } from 'react';
import type { DashboardStateShape } from '../../hooks/useDashboardState';
import { useCardSize } from './useCardSize';

export type GreetingDefaults = {
  title: string;
  subtitle: string;
  greeting: string;
  name: string;
};

const GREETING_REFRESH_MS = 60000;
const SUBTITLE_ROTATE_MS = 120000;

function resolveGreetingLabel(state: DashboardStateShape, now: Date) {
  if (state.livingRoomMasterOff) {
    return 'Bentornato';
  }

  const hour = now.getHours();
  if (hour >= 5 && hour < 11) {
    return 'Buongiorno';
  }
  if (hour >= 11 && hour < 17) {
    return 'Buon pomeriggio';
  }
  if (hour >= 17 && hour < 22) {
    return 'Buonasera';
  }
  return 'Bentornato';
}

function formatStatus(status?: string) {
  if (!status) {
    return '';
  }
  const normalized = status.toLowerCase();
  const map: Record<string, string> = {
    opening: 'in apertura',
    closed: 'spenta',
    connected: 'connessa',
    tracking: 'attiva',
    unavailable: 'non disponibile',
    online: 'online',
    playing: 'in riproduzione',
    paused: 'in pausa',
  };
  return map[normalized] ?? normalized;
}

function buildSubtitleOptions(state: DashboardStateShape, now: Date) {
  const options: string[] = [];
  const lampStatus = state.lamp.isOn
    ? `${state.lamp.name} ${formatStatus(state.lamp.status)} al ${state.lamp.brightness}%.`
    : `${state.lamp.name} spenta.`;
  options.push(lampStatus);

  if (state.lamp.activeTimerEnd) {
    const remainingMs = Math.max(0, state.lamp.activeTimerEnd - now.getTime());
    const remainingMinutes = Math.max(1, Math.round(remainingMs / 60000));
    options.push(`Timer lampada: ${remainingMinutes} min.`);
  }

  if (state.climate.isOn) {
    const diff = state.climate.targetTemp - state.climate.currentTemp;
    const action = diff < -0.3 ? 'raffreddamento' : diff > 0.3 ? 'riscaldamento' : 'stabile';
    options.push(`${state.climate.name} in ${action} a ${state.climate.targetTemp.toFixed(1)}\u00B0C.`);
  } else {
    options.push(`${state.climate.name} spento.`);
  }

  options.push(state.speaker.isPlaying ? 'Speaker in riproduzione.' : 'Speaker in pausa.');
  options.push(`Wi-Fi ${state.wifiDownloadMbps} Mbps download.`);

  const favoritesOn = state.favorites.filter((device) => device.isOn).length;
  if (favoritesOn === 0) {
    options.push('Tutti i preferiti sono spenti.');
  } else {
    options.push(`${favoritesOn} preferiti attivi.`);
  }

  if (state.livingRoomMasterOff) {
    options.push('Soggiorno in standby.');
  }

  return Array.from(new Set(options.filter((line) => line.trim().length > 0)));
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickDynamicSubtitle(state: DashboardStateShape, now: Date) {
  const options = buildSubtitleOptions(state, now);
  if (!options.length) {
    return [];
  }

  const signature = [
    state.lamp.isOn,
    state.lamp.brightness,
    state.climate.isOn,
    state.climate.currentTemp,
    state.climate.targetTemp,
    state.speaker.isPlaying,
    state.wifiDownloadMbps,
    state.favorites.filter((device) => device.isOn).length,
  ].join('|');

  const timeSlice = Math.floor(now.getTime() / SUBTITLE_ROTATE_MS);
  const seed = hashString(signature) + timeSlice;
  const rng = mulberry32(seed);
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const baseCount = Math.min(2, shuffled.length);
  const picked = shuffled.slice(0, baseCount);
  const remaining = shuffled.length - baseCount;
  if (remaining > 0) {
    picked.push(`e ${remaining} altre >`);
  }
  return picked;
}

export function getGreetingDefaults(state: DashboardStateShape, now = new Date()): GreetingDefaults {
  const greeting = resolveGreetingLabel(state, now);
  const name = state.userName;
  const subtitleLines = pickDynamicSubtitle(state, now);

  return {
    title: `${greeting}, ${name}!`,
    subtitle: subtitleLines.join('\n'),
    greeting,
    name,
  };
}

type GreetingCardProps = {
  state: DashboardStateShape;
  title?: string;
  subtitle?: string;
  titleAuto?: boolean;
  subtitleAuto?: boolean;
  compact?: boolean;
  clampTitle?: boolean;
};

export function GreetingCard({
  state,
  title,
  subtitle,
  titleAuto = true,
  subtitleAuto = true,
  compact = false,
  clampTitle = false,
}: GreetingCardProps) {
  const { ref: cardRef, density: cardDensity, width: cardWidth, height: cardHeight, hasSize: hasCardSize } = useCardSize({
    tinyWidth: 330,
    tinyHeight: 95,
    compactWidth: 640,
    compactHeight: 165,
  });
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), GREETING_REFRESH_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const now = useMemo(() => new Date(clock), [clock]);
  const defaults = useMemo(() => getGreetingDefaults(state, now), [state, now]);
  const isCustomTitle = !titleAuto;
  const isCustomSubtitle = !subtitleAuto;
  const resolvedTitle = (isCustomTitle ? title ?? '' : defaults.title)
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const resolvedSubtitle = isCustomSubtitle ? subtitle ?? '' : defaults.subtitle;
  const subtitleLines = resolvedSubtitle.split('\n').filter((line) => line.length > 0);
  const isTinyCard = hasCardSize && cardDensity === 'tiny';
  const isCompactCard = hasCardSize && cardDensity === 'compact';
  const isTightCard = compact || isTinyCard || (hasCardSize && (cardWidth <= 560 || cardHeight <= 120));
  const isMediumCard = !isTightCard && (isCompactCard || (hasCardSize && (cardWidth <= 860 || cardHeight <= 170)));
  const isClampTitleTight = clampTitle && (isTightCard || (hasCardSize && cardWidth <= 500));
  const titleClass = clampTitle
    ? isClampTitleTight
      ? 'text-[clamp(1.5rem,3.9vw,2.2rem)] leading-[1.04]'
      : 'text-[clamp(1.18rem,3.5vw,2.35rem)] leading-[1.06]'
    : isTightCard
      ? 'text-[1.7rem] leading-[1.1]'
      : isMediumCard
        ? 'text-[2.06rem] leading-[1.08]'
        : 'text-[2.48rem] leading-[1.07]';
  const subtitleClass = isTightCard
    ? 'text-[0.76rem] leading-[1.2] text-white/72'
    : isMediumCard
      ? 'text-[0.84rem] leading-[1.24] text-white/72'
      : 'text-[0.94rem] leading-[1.26] text-white/70';
  const rowGapClass = clampTitle && isTightCard ? 'gap-0.5' : isTightCard ? 'gap-1' : isMediumCard ? 'gap-1.5' : 'gap-2.5';
  const titleClampLines = clampTitle ? (subtitleLines.length > 0 ? 2 : 3) : subtitleLines.length > 0 ? (isTightCard ? 1 : 2) : 2;
  const subtitleClampLines = clampTitle && isTightCard ? 1 : isTightCard ? 1 : isMediumCard ? 1 : 2;
  const subtitleLinesLimit = clampTitle && isTightCard ? 1 : isTightCard ? 2 : isMediumCard ? 2 : 3;
  const visibleSubtitleLines = subtitleLines.slice(0, subtitleLinesLimit);
  const hiddenSubtitleCount = Math.max(0, subtitleLines.length - visibleSubtitleLines.length);
  const compactSubtitle =
    hiddenSubtitleCount > 0
      ? `${visibleSubtitleLines.join(' | ')} | +${hiddenSubtitleCount}`
      : visibleSubtitleLines.join(' | ');
  const titleWrapStyle: React.CSSProperties = {
    display: '-webkit-box',
    WebkitLineClamp: titleClampLines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };
  const subtitleWrapStyle: React.CSSProperties = {
    display: '-webkit-box',
    WebkitLineClamp: subtitleClampLines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };
  const subtitleItemWrapClass = 'whitespace-normal break-words [overflow-wrap:anywhere]';
  const subtitleInline = compactSubtitle;

  return (
    <div
      ref={cardRef}
      className={`h-full w-full min-h-0 min-w-0 overflow-hidden flex flex-col justify-center ${rowGapClass}`}
    >
      {resolvedTitle.trim().length ? (
        <h1
          className={`${titleClass} font-normal tracking-tight whitespace-normal break-words [overflow-wrap:anywhere] ${
            clampTitle ? 'overflow-hidden' : 'overflow-visible pb-[0.08em]'
          }`}
          style={titleWrapStyle}
        >
          {resolvedTitle}
        </h1>
      ) : null}

      {subtitleLines.length ? (
        <div className={subtitleClass}>
          {isMediumCard || isTightCard ? (
            <p className={`${subtitleItemWrapClass} ${isTightCard ? 'text-white/74' : 'text-white/72'}`} style={subtitleWrapStyle}>
              {subtitleInline}
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {visibleSubtitleLines.slice(0, 2).map((line, index) => (
                <p
                  key={`${line}-${index}`}
                  className={`${subtitleItemWrapClass} ${index === 1 ? 'text-white/64' : 'text-white/78'}`}
                  style={subtitleWrapStyle}
                >
                  {line}
                </p>
              ))}
              {hiddenSubtitleCount > 0 ? <p className="text-white/55">{`+${hiddenSubtitleCount}`}</p> : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
