import React from 'react';
import {
  Clock3,
  DoorOpen,
  Home,
  Lightbulb,
  Lock,
  Moon,
  PersonStanding,
  Play,
  Power,
  Siren,
  Sparkles,
  Sunset,
  Thermometer,
  Wind,
} from 'lucide-react';

const ICONS = {
  Clock3,
  DoorOpen,
  Home,
  Lightbulb,
  Lock,
  Moon,
  PersonStanding,
  Play,
  Power,
  Siren,
  Sparkles,
  Sunset,
  Thermometer,
  Wind,
};

export function IconGlyph({ name, size = 18, className = '' }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon size={size} className={className} />;
}

export default IconGlyph;
