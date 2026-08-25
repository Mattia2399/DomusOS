import React from 'react';
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Square,
} from 'lucide-react';

export type CameraPtzDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'up_left'
  | 'up_right'
  | 'down_left'
  | 'down_right';

type CameraPtzJoystickProps = {
  activeDirection: CameraPtzDirection | null;
  onDirectionStart: (direction: CameraPtzDirection) => void;
  onDirectionStop: () => void;
  compact?: boolean;
};

export function CameraPtzJoystick({
  activeDirection,
  onDirectionStart,
  onDirectionStop,
  compact = false,
}: CameraPtzJoystickProps) {
  const bindDirection = (direction: CameraPtzDirection) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      onDirectionStart(direction);
    },
    onPointerUp: onDirectionStop,
    onPointerLeave: (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.buttons === 0) onDirectionStop();
    },
    onPointerCancel: onDirectionStop,
    onLostPointerCapture: onDirectionStop,
    onContextMenu: (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault(),
  });

  const sizeClass = compact ? 'h-10 w-10 rounded-xl' : 'h-11 w-11 rounded-2xl';
  const buttonClass = (direction: CameraPtzDirection) =>
    `flex ${sizeClass} items-center justify-center border backdrop-blur-xl transition-all active:scale-95 ${
      activeDirection === direction
        ? 'border-[color:rgb(var(--ui-accent-rgb)/0.55)] bg-[color:rgb(var(--ui-accent-rgb)/0.20)] text-[color:var(--ui-accent)] shadow-[0_0_22px_rgb(var(--ui-accent-rgb)/0.22)]'
        : 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)] hover:bg-[color:var(--ui-fill-secondary)] hover:text-[color:var(--ui-text-primary)]'
    }`;

  return (
    <div className="flex w-full justify-center">
      <div className={`dashboard-content-surface-soft grid grid-cols-3 ${compact ? 'gap-1.5 rounded-[1.35rem] p-1.5' : 'gap-2 rounded-[1.6rem] p-2'}`}>
        <button type="button" className={buttonClass('up_left')} aria-label="PTZ in alto a sinistra" {...bindDirection('up_left')}><ArrowUpLeft size={15} /></button>
        <button type="button" className={buttonClass('up')} aria-label="PTZ in alto" {...bindDirection('up')}><ArrowUp size={16} /></button>
        <button type="button" className={buttonClass('up_right')} aria-label="PTZ in alto a destra" {...bindDirection('up_right')}><ArrowUpRight size={15} /></button>
        <button type="button" className={buttonClass('left')} aria-label="PTZ a sinistra" {...bindDirection('left')}><ArrowLeft size={16} /></button>
        <button type="button" className={`glass-button flex ${sizeClass} items-center justify-center text-[color:var(--ui-text-secondary)] transition active:scale-95`} aria-label="Ferma movimento PTZ" onClick={onDirectionStop}><Square size={14} /></button>
        <button type="button" className={buttonClass('right')} aria-label="PTZ a destra" {...bindDirection('right')}><ArrowRight size={16} /></button>
        <button type="button" className={buttonClass('down_left')} aria-label="PTZ in basso a sinistra" {...bindDirection('down_left')}><ArrowDownLeft size={15} /></button>
        <button type="button" className={buttonClass('down')} aria-label="PTZ in basso" {...bindDirection('down')}><ArrowDown size={16} /></button>
        <button type="button" className={buttonClass('down_right')} aria-label="PTZ in basso a destra" {...bindDirection('down_right')}><ArrowDownRight size={15} /></button>
      </div>
    </div>
  );
}

export default CameraPtzJoystick;
