import type { LucideIcon } from 'lucide-react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  Wind,
} from 'lucide-react';

const weatherVisualMap: Record<string, { icon: LucideIcon; label: string }> = {
  sunny: { icon: Sun, label: 'Soleggiato' },
  'clear-night': { icon: Moon, label: 'Sereno (notte)' },
  partlycloudy: { icon: CloudSun, label: 'Parzialmente nuvoloso' },
  cloudy: { icon: Cloud, label: 'Nuvoloso' },
  fog: { icon: CloudFog, label: 'Nebbia' },
  rainy: { icon: CloudRain, label: 'Pioggia' },
  pouring: { icon: CloudDrizzle, label: 'Pioggia intensa' },
  lightning: { icon: CloudLightning, label: 'Temporale' },
  'lightning-rainy': { icon: CloudLightning, label: 'Temporale con pioggia' },
  snowy: { icon: CloudSnow, label: 'Neve' },
  'snowy-rainy': { icon: CloudSnow, label: 'Nevischio' },
  hail: { icon: CloudSnow, label: 'Grandine' },
  windy: { icon: Wind, label: 'Ventoso' },
  'windy-variant': { icon: Wind, label: 'Ventoso' },
  exceptional: { icon: CloudMoon, label: 'Meteo instabile' },
};

export const WEATHER_CONDITIONS = Object.keys(weatherVisualMap);

export function getWeatherVisual(condition: string | undefined) {
  const normalizedCondition = (condition ?? '').trim().toLowerCase();
  return weatherVisualMap[normalizedCondition] ?? { icon: CloudSun, label: condition || 'Weather' };
}
