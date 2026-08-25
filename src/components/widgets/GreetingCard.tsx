import React, { useEffect, useMemo, useState } from 'react';
import type { DashboardStateShape } from '../../hooks/useDashboardState';
import { useCardSize } from './useCardSize';

export type GreetingDefaults = {
  title: string;
  subtitle: string;
  greeting: string;
  name: string;
};

export type GreetingResponsiveDensity = 'tiny' | 'compact' | 'regular';

const GREETING_REFRESH_MS = 60000;

function resolveTimeGreetingLabel(now: Date) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 11) return 'Buongiorno';
  if (hour >= 11 && hour < 17) return 'Buon pomeriggio';
  if (hour >= 17 && hour < 22) return 'Buonasera';
  return 'Bentornato';
}

function isWeekend(now: Date) {
  const day = now.getDay();
  return day === 0 || day === 6;
}

function resolveGreetingLabel(state: DashboardStateShape, now: Date) {
  const baseGreeting = resolveTimeGreetingLabel(now);
  const hour = now.getHours();
  if (hour >= 22 || hour < 5) return 'Buonanotte';
  if (state.livingRoomMasterOff) return 'Bentornato';
  if (isWeekend(now) && (baseGreeting === 'Buongiorno' || baseGreeting === 'Buon pomeriggio')) {
    return 'Buon weekend';
  }
  return baseGreeting;
}

function buildHomeSummary(state: DashboardStateShape, now: Date) {
  const lines: string[] = [];
  const activeFavorites = state.favorites.filter((device) => device.isOn).length;
  const activePrimaryFunctions = [
    state.lamp.isOn,
    state.climate.isOn,
    state.speaker.isPlaying,
  ].filter(Boolean).length;
  const isHouseQuiet =
    state.livingRoomMasterOff &&
    !state.speaker.isPlaying &&
    activeFavorites === 0;

  if (isHouseQuiet) {
    lines.push('Casa in quiete.');
  } else if (activeFavorites > 0) {
    lines.push(
      activeFavorites === 1
        ? 'Casa pronta. Un preferito è attivo.'
        : `Casa pronta. ${activeFavorites} preferiti attivi.`,
    );
  } else if (activePrimaryFunctions > 0) {
    lines.push(
      activePrimaryFunctions === 1
        ? 'Una funzione principale è attiva.'
        : `${activePrimaryFunctions} funzioni principali attive.`,
    );
  } else {
    lines.push('Tutto tranquillo. Nessuna attività rilevante.');
  }

  if (state.lamp.activeTimerEnd) {
    const remainingMs = Math.max(0, state.lamp.activeTimerEnd - now.getTime());
    const remainingMinutes = Math.max(1, Math.round(remainingMs / 60000));
    lines.push(`Timer luce attivo per altri ${remainingMinutes} min.`);
  }

  return lines.slice(0, 2);
}

export function getGreetingDefaults(state: DashboardStateShape, now = new Date()): GreetingDefaults {
  const greeting = resolveGreetingLabel(state, now);
  const name = state.userName.trim();
  return {
    title: name ? `${greeting}, ${name}!` : `${greeting}!`,
    subtitle: buildHomeSummary(state, now).join('\n'),
    greeting,
    name,
  };
}

export function resolveGreetingResponsiveDensity({
  width,
  height,
  hasSize,
  compact,
}: {
  width: number;
  height: number;
  hasSize: boolean;
  compact: boolean;
}): GreetingResponsiveDensity {
  if (hasSize && (width <= 340 || height <= 104)) {
    return 'tiny';
  }
  if (compact || (hasSize && (width <= 720 || height <= 172))) {
    return 'compact';
  }
  return 'regular';
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
  const {
    ref: cardRef,
    width: cardWidth,
    height: cardHeight,
    hasSize: hasCardSize,
  } = useCardSize({
    tinyWidth: 330,
    tinyHeight: 95,
    compactWidth: 640,
    compactHeight: 165,
  });
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), GREETING_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const now = useMemo(() => new Date(clock), [clock]);
  const defaults = useMemo(() => getGreetingDefaults(state, now), [state, now]);
  const resolvedTitle = (!titleAuto ? title ?? '' : defaults.title)
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const resolvedSubtitle = !subtitleAuto ? subtitle ?? '' : defaults.subtitle;
  const subtitleLines = resolvedSubtitle.split('\n').filter((line) => line.length > 0);
  const responsiveDensity = resolveGreetingResponsiveDensity({
    width: cardWidth,
    height: cardHeight,
    hasSize: hasCardSize,
    compact,
  });
  const isTinyCard = responsiveDensity === 'tiny';
  const isCompactCard = responsiveDensity === 'compact';
  const subtitleClass = isTinyCard
    ? 'text-[0.76rem] leading-[1.2] text-[color:var(--ui-text-secondary)]'
    : isCompactCard
      ? 'text-[0.84rem] leading-[1.24] text-[color:var(--ui-text-secondary)]'
      : 'text-[0.94rem] leading-[1.26] text-[color:var(--ui-text-secondary)]';
  const rowGapClass = isTinyCard ? 'gap-0.5' : isCompactCard ? 'gap-1.5' : 'gap-2.5';
  const titleClampLines = clampTitle
    ? subtitleLines.length > 0
      ? isTinyCard
        ? 1
        : 2
      : isTinyCard
        ? 2
        : 3
    : subtitleLines.length > 0
      ? isTinyCard
        ? 1
        : 2
      : 2;
  const subtitleClampLines = isTinyCard || isCompactCard ? 1 : 2;
  const subtitleLinesLimit = isTinyCard ? 1 : isCompactCard ? 2 : 3;
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

  return (
    <div
      ref={cardRef}
      className={`@container flex h-full w-full min-h-0 min-w-0 flex-col justify-center overflow-hidden ${rowGapClass}`}
    >
      {resolvedTitle ? (
        <h1
          className={`dashboard-page-title whitespace-normal break-words pb-[0.14em] pt-[0.03em] [overflow-wrap:anywhere] ${
            clampTitle ? 'overflow-hidden' : 'overflow-visible'
          }`}
          style={titleWrapStyle}
        >
          {resolvedTitle}
        </h1>
      ) : null}

      {subtitleLines.length ? (
        <div className={subtitleClass}>
          {isCompactCard || isTinyCard ? (
            <p className={`${subtitleItemWrapClass} text-[color:var(--ui-text-secondary)]`} style={subtitleWrapStyle}>
              {compactSubtitle}
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {visibleSubtitleLines.slice(0, 2).map((line, index) => (
                <p
                  key={`${line}-${index}`}
                  className={`${subtitleItemWrapClass} ${
                    index === 1 ? 'text-[color:var(--ui-text-tertiary)]' : 'text-[color:var(--ui-text-secondary)]'
                  }`}
                  style={subtitleWrapStyle}
                >
                  {line}
                </p>
              ))}
              {hiddenSubtitleCount > 0 ? (
                <p className="text-[color:var(--ui-text-disabled)]">{`+${hiddenSubtitleCount}`}</p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
