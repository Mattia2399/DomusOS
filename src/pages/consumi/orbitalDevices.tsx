import React from 'react';
import { motion } from 'framer-motion';
import {
  Bolt,
  ChefHat,
  Flame,
  Shirt,
  Sprout,
  Thermometer,
  type LucideIcon,
} from 'lucide-react';

export type DeviceType = 'energy' | 'water' | 'gas';
export type DeviceIconName = 'Thermometer' | 'ChefHat' | 'Shirt' | 'Sprout' | 'Flame';

export type OrbitalDevice = {
  id: string;
  name: string;
  type: DeviceType;
  value: string;
  active: boolean;
  icon: DeviceIconName;
};

export const MOCK_DEVICES: OrbitalDevice[] = [
  { id: '1', name: 'Clima', type: 'energy', value: '1.2 kW', active: true, icon: 'Thermometer' },
  { id: '2', name: 'Forno', type: 'energy', value: '2.0 kW', active: true, icon: 'ChefHat' },
  { id: '3', name: 'Lavatrice', type: 'energy', value: '0.8 kW', active: true, icon: 'Shirt' },
  { id: '4', name: 'Irrigazione', type: 'water', value: '12 L/m', active: true, icon: 'Sprout' },
  { id: '5', name: 'Riscaldamento', type: 'gas', value: '8 kW', active: true, icon: 'Flame' },
];

const ICON_MAP: Record<DeviceIconName, LucideIcon> = {
  Thermometer,
  ChefHat,
  Shirt,
  Sprout,
  Flame,
};

const GLOW_BY_TYPE: Record<DeviceType, string> = {
  energy: 'rgba(250,204,21,0.5)',
  water: 'rgba(34,211,238,0.55)',
  gas: 'rgba(251,146,60,0.52)',
};

function resolvePosition(
  index: number,
  total: number,
  centerX: number,
  centerY: number,
  radius: number,
  angleOffsetDeg: number,
) {
  const normalizedIndex = total <= 0 ? 0 : index / total;
  const offsetRad = (angleOffsetDeg * Math.PI) / 180;
  const angle = normalizedIndex * Math.PI * 2 - Math.PI / 2 + offsetRad;
  return {
    left: centerX + radius * Math.cos(angle),
    top: centerY + radius * Math.sin(angle),
  };
}

function transparentGlow(color: string) {
  return color.replace(/[\d.]+\)$/, '0)');
}

export function OrbitalDevices({
  devices,
  centerX,
  centerY,
  radius,
  angleOffsetDeg = 0,
  zClassName = 'z-10',
}: {
  devices: OrbitalDevice[];
  centerX: number;
  centerY: number;
  radius: number;
  angleOffsetDeg?: number;
  zClassName?: string;
}) {
  const activeDevices = React.useMemo(
    () => devices.filter((device) => device.active),
    [devices],
  );

  if (activeDevices.length === 0) {
    return null;
  }

  return (
    <div className={`pointer-events-none absolute inset-0 flex items-center justify-center ${zClassName}`}>
      <div className="relative h-full max-h-full max-w-full aspect-square">
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.6"
            strokeDasharray="2 2.2"
            opacity="0.55"
          />
        </svg>

        {activeDevices.map((device, index) => {
          const { left, top } = resolvePosition(
            index,
            activeDevices.length,
            centerX,
            centerY,
            radius,
            angleOffsetDeg,
          );
          const Icon = ICON_MAP[device.icon] ?? Bolt;
          const glowColor = GLOW_BY_TYPE[device.type];

          return (
            <motion.div
              key={device.id}
              className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-md"
              style={{ left: `${left}%`, top: `${top}%` }}
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  `0 0 0 ${transparentGlow(glowColor)}`,
                  `0 0 16px ${glowColor}`,
                  `0 0 0 ${transparentGlow(glowColor)}`,
                ],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.12,
              }}
              title={`${device.name} - ${device.value}`}
            >
              <Icon size={11} className="text-white/85" />
              <span className="mt-0.5 max-w-[44px] truncate text-center text-[7px] font-medium leading-none text-white/80">
                {device.value}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default OrbitalDevices;
