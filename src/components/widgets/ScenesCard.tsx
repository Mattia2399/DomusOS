import React, { useEffect, useRef, useState } from 'react';
import { mdiCarHatchback } from '@mdi/js';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  BedDouble,
  CheckCircle2,
  Coffee,
  Film,
  Home,
  Leaf,
  Moon,
  Music,
  PersonStanding,
  Plus,
  Sparkles,
  Sun,
  Tv,
  type LucideIcon,
} from 'lucide-react';
import type { SceneIconKey, SceneKey } from '../../types/dashboardModels';
import { useCardSize } from './useCardSize';

type SceneItem = {
  id: SceneKey;
  label: string;
  color: string;
  defaultIcon: SceneIconKey;
};

export const SCENES_CATALOG: SceneItem[] = [
  { id: 'music', label: 'Music', color: 'from-pink-500 to-rose-500', defaultIcon: 'music' },
  { id: 'going-out', label: 'Going out', color: 'from-blue-400 to-blue-600', defaultIcon: 'person' },
  { id: 'night', label: 'Night', color: 'from-indigo-600 to-blue-900', defaultIcon: 'moon' },
  { id: 'movie', label: 'Movie', color: 'from-red-500 to-red-700', defaultIcon: 'film' },
  { id: 'arrive', label: 'Arrive', color: 'from-emerald-400 to-emerald-600', defaultIcon: 'car' },
  { id: 'morning', label: 'Morning', color: 'from-orange-400 to-orange-600', defaultIcon: 'sun' },
];

export const SCENE_ICON_OPTIONS: Array<{ id: SceneIconKey; label: string }> = [
  { id: 'music', label: 'Musica' },
  { id: 'person', label: 'Persona' },
  { id: 'moon', label: 'Luna' },
  { id: 'film', label: 'Film' },
  { id: 'car', label: 'Auto' },
  { id: 'sun', label: 'Sole' },
  { id: 'home', label: 'Casa' },
  { id: 'sparkles', label: 'Sparkles' },
  { id: 'bed', label: 'Letto' },
  { id: 'coffee', label: 'Caffe' },
  { id: 'tv', label: 'TV' },
  { id: 'leaf', label: 'Foglia' },
];

const SCENE_ICON_COMPONENTS: Record<Exclude<SceneIconKey, 'car'>, LucideIcon> = {
  music: Music,
  person: PersonStanding,
  moon: Moon,
  film: Film,
  sun: Sun,
  home: Home,
  sparkles: Sparkles,
  bed: BedDouble,
  coffee: Coffee,
  tv: Tv,
  leaf: Leaf,
};

function MdiCarHatchbackIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <path d={mdiCarHatchback} fill="currentColor" />
    </svg>
  );
}

export function getSceneIconNode(iconKey: SceneIconKey, size = 20) {
  if (iconKey === 'car') {
    return <MdiCarHatchbackIcon size={size} />;
  }
  const Icon = SCENE_ICON_COMPONENTS[iconKey] ?? Music;
  return <Icon size={size} />;
}

const SCENE_RUNNING_PROGRESS_TARGET = 0.75;
const SCENE_RUNNING_PROGRESS_MS = 30000;
const SCENE_COMPLETION_PROGRESS_MS = 1500;
const SCENE_MIN_VISIBLE_PROGRESS = 0.03;

function createExitVariant(x = 16): Variants['completing'] {
  return {
    x,
    opacity: 0,
    scale: 0.88,
    rotate: 4,
    transition: { duration: 0.42, ease: 'easeIn' },
  };
}

const SCENE_ICON_MOTION_VARIANTS: Record<SceneIconKey, Variants> = {
  music: {
    idle: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
    running: {
      y: [0, -1.5, 0, 1, 0],
      rotate: [0, -6, 6, -4, 0],
      scale: [1, 1.04, 1, 1.03, 1],
      transition: { duration: 0.95, repeat: Infinity, ease: 'easeInOut' },
    },
    completing: createExitVariant(15),
  },
  person: {
    idle: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
    running: {
      y: [0, -1, 0, -1, 0],
      x: [0, 0.7, 0, -0.7, 0],
      transition: { duration: 0.55, repeat: Infinity, ease: 'linear' },
    },
    completing: createExitVariant(14),
  },
  moon: {
    idle: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
    running: {
      y: [0, -1.8, 0, -1.1, 0],
      rotate: [0, -3, 2, -2, 0],
      transition: { duration: 1.35, repeat: Infinity, ease: 'easeInOut' },
    },
    completing: createExitVariant(14),
  },
  film: {
    idle: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
    running: {
      rotate: [0, -4, 4, -3, 0],
      x: [0, -0.6, 0.6, -0.4, 0],
      transition: { duration: 0.5, repeat: Infinity, ease: 'linear' },
    },
    completing: createExitVariant(15),
  },
  car: {
    idle: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
    running: {
      y: [0, -1.6, 0, 1.4, 0],
      x: [0, -0.7, 0.7, 0],
      transition: { duration: 0.14, repeat: Infinity, ease: 'linear' },
    },
    completing: createExitVariant(18),
  },
  sun: {
    idle: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
    running: {
      rotate: [0, 90, 180, 270, 360],
      scale: [1, 1.03, 1.02, 1.03, 1],
      transition: { duration: 1.9, repeat: Infinity, ease: 'linear' },
    },
    completing: createExitVariant(14),
  },
  home: {
    idle: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
    running: {
      y: [0, -1.2, 0, -0.7, 0],
      scale: [1, 1.025, 1, 1.02, 1],
      transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
    },
    completing: createExitVariant(14),
  },
  sparkles: {
    idle: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
    running: {
      scale: [1, 1.12, 0.98, 1.1, 1],
      rotate: [0, 6, -4, 8, 0],
      opacity: [1, 0.88, 1, 0.9, 1],
      transition: { duration: 0.85, repeat: Infinity, ease: 'easeInOut' },
    },
    completing: createExitVariant(15),
  },
  bed: {
    idle: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
    running: {
      y: [0, -0.6, 0, -0.3, 0],
      scale: [1, 1.03, 1, 1.02, 1],
      transition: { duration: 1.25, repeat: Infinity, ease: 'easeInOut' },
    },
    completing: createExitVariant(13),
  },
  coffee: {
    idle: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
    running: {
      y: [0, -1.3, 0, -0.8, 0],
      rotate: [0, -1.5, 1.5, -1, 0],
      transition: { duration: 0.72, repeat: Infinity, ease: 'easeInOut' },
    },
    completing: createExitVariant(14),
  },
  tv: {
    idle: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
    running: {
      x: [0, -1, 1, -0.8, 0.8, 0],
      y: [0, 0.3, -0.2, 0.2, 0],
      transition: { duration: 0.34, repeat: Infinity, ease: 'linear' },
    },
    completing: createExitVariant(16),
  },
  leaf: {
    idle: { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
    running: {
      rotate: [0, -8, 6, -5, 0],
      y: [0, -0.8, 0.6, -0.3, 0],
      transition: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' },
    },
    completing: createExitVariant(14),
  },
};

type ScenesCardProps = {
  title?: string;
  scenes: SceneKey[];
  sceneLabels?: Partial<Record<SceneKey, string>>;
  sceneIcons?: Partial<Record<SceneKey, SceneIconKey>>;
  compact?: boolean;
  isEditMode?: boolean;
  runningSceneId?: SceneKey | null;
  runningSceneStartedAt?: number | null;
  onAddScene?: (sceneId: SceneKey) => void;
  onSceneTrigger?: (sceneId: SceneKey) => void;
};

export function ScenesCard({
  title,
  scenes,
  sceneLabels,
  sceneIcons,
  compact = false,
  isEditMode = false,
  runningSceneId = null,
  runningSceneStartedAt = null,
  onAddScene,
  onSceneTrigger,
}: ScenesCardProps) {
  const [runningProgress, setRunningProgress] = useState(0);
  const runningProgressRef = useRef(0);
  const runningAnimationFrameRef = useRef<number | null>(null);
  const previousRunningSceneRef = useRef<SceneKey | null>(null);

  const [completedSceneId, setCompletedSceneId] = useState<SceneKey | null>(null);
  const [completedProgress, setCompletedProgress] = useState(0);
  const completionAnimationFrameRef = useRef<number | null>(null);
  const [confirmedSceneId, setConfirmedSceneId] = useState<SceneKey | null>(null);
  const confirmationHideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const previousRunningSceneId = previousRunningSceneRef.current;
    if (previousRunningSceneId && previousRunningSceneId !== runningSceneId) {
      const startProgress = Math.max(
        0,
        Math.min(SCENE_RUNNING_PROGRESS_TARGET, runningProgressRef.current),
      );
      if (completionAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(completionAnimationFrameRef.current);
      }
      if (confirmationHideTimerRef.current !== null) {
        window.clearTimeout(confirmationHideTimerRef.current);
        confirmationHideTimerRef.current = null;
      }
      setConfirmedSceneId(null);
      setCompletedSceneId(previousRunningSceneId);
      setCompletedProgress(startProgress);
      const animationStart = window.performance.now();
      const animateCompletion = (timestamp: number) => {
        const elapsed = Math.max(0, timestamp - animationStart);
        const progress = Math.min(1, elapsed / SCENE_COMPLETION_PROGRESS_MS);
        const easedProgress = 1 - Math.pow(1 - progress, 2);
        const nextProgress = startProgress + (1 - startProgress) * easedProgress;
        setCompletedProgress(nextProgress);
        if (progress < 1) {
          completionAnimationFrameRef.current = window.requestAnimationFrame(animateCompletion);
          return;
        }
        completionAnimationFrameRef.current = null;
        setCompletedSceneId((current) => (current === previousRunningSceneId ? null : current));
        setCompletedProgress(0);
        setConfirmedSceneId(previousRunningSceneId);
        confirmationHideTimerRef.current = window.setTimeout(() => {
          setConfirmedSceneId((current) => (current === previousRunningSceneId ? null : current));
          setCompletedProgress(0);
          confirmationHideTimerRef.current = null;
        }, 1100);
      };
      completionAnimationFrameRef.current = window.requestAnimationFrame(animateCompletion);
    }
    previousRunningSceneRef.current = runningSceneId ?? null;
  }, [runningSceneId]);

  useEffect(() => {
    if (runningAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(runningAnimationFrameRef.current);
      runningAnimationFrameRef.current = null;
    }

    if (!runningSceneId) {
      runningProgressRef.current = 0;
      setRunningProgress(0);
      return;
    }

    const startedAt =
      typeof runningSceneStartedAt === 'number' && Number.isFinite(runningSceneStartedAt)
        ? runningSceneStartedAt
        : Date.now();

    const updateProgress = () => {
      const elapsed = Math.max(0, Date.now() - startedAt);
      const normalized = Math.min(
        SCENE_RUNNING_PROGRESS_TARGET,
        (elapsed / SCENE_RUNNING_PROGRESS_MS) * SCENE_RUNNING_PROGRESS_TARGET,
      );
      const nextProgress = Math.max(SCENE_MIN_VISIBLE_PROGRESS, normalized);
      if (Math.abs(nextProgress - runningProgressRef.current) >= 0.002) {
        runningProgressRef.current = nextProgress;
        setRunningProgress(nextProgress);
      }
      runningAnimationFrameRef.current = window.requestAnimationFrame(updateProgress);
    };

    runningAnimationFrameRef.current = window.requestAnimationFrame(updateProgress);

    return () => {
      if (runningAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(runningAnimationFrameRef.current);
        runningAnimationFrameRef.current = null;
      }
    };
  }, [runningSceneId, runningSceneStartedAt]);

  useEffect(
    () => () => {
      if (runningAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(runningAnimationFrameRef.current);
      }
      if (completionAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(completionAnimationFrameRef.current);
      }
      if (confirmationHideTimerRef.current !== null) {
        window.clearTimeout(confirmationHideTimerRef.current);
      }
    },
    [],
  );

  const {
    ref: cardRef,
    density: cardDensity,
    hasSize: hasCardSize,
    height: cardHeight,
  } = useCardSize({
    tinyWidth: 280,
    tinyHeight: 160,
    compactWidth: 460,
    compactHeight: 240,
  });

  const selectedScenes = scenes;
  const isTinyCard = hasCardSize && cardDensity === 'tiny';
  const isDenseLayout = compact || (hasCardSize && cardDensity !== 'regular');
  const isSingleLineLayout =
    hasCardSize &&
    (cardHeight <= 126 || (compact && cardHeight <= 152) || (cardDensity === 'tiny' && cardHeight <= 154));
  const useCompactLayout = (compact || isTinyCard || isSingleLineLayout) && !isEditMode;
  const displayedScenes = selectedScenes;
  const availableScenes = SCENES_CATALOG.filter((scene) => !selectedScenes.includes(scene.id));
  const addSlots = useCompactLayout ? availableScenes.slice(0, isTinyCard ? 1 : 2) : availableScenes;
  const visibleItemsCount = Math.max(1, displayedScenes.length + (isEditMode ? addSlots.length : 0));
  const iconSize = isSingleLineLayout ? (isTinyCard ? 14 : 15) : isTinyCard ? 17 : isDenseLayout ? 19 : 21;
  const sceneItemGapClass = isSingleLineLayout ? 'gap-1.5' : isTinyCard ? 'gap-1' : isDenseLayout ? 'gap-1.5' : 'gap-2';
  const sceneCellPaddingClass = isSingleLineLayout ? 'px-1 py-0.5' : isTinyCard ? 'px-1 py-0.5' : 'px-1.5 py-1';
  const sceneButtonSizeClass = isSingleLineLayout ? (isTinyCard ? 'w-8 h-8' : 'w-9 h-9') : isTinyCard ? 'w-11 h-11' : isDenseLayout ? 'w-12 h-12' : 'w-15 h-15';
  const sceneLabelClass = isSingleLineLayout
    ? isTinyCard
      ? 'text-[10px] leading-none whitespace-nowrap'
      : 'text-[11px] leading-none whitespace-nowrap'
    : isTinyCard
      ? 'text-[10px] leading-[1.05] whitespace-nowrap'
      : isDenseLayout
        ? 'text-[11px] leading-[1.08] whitespace-nowrap'
        : 'text-xs leading-[1.1] whitespace-nowrap';
  const sceneLabelMinHeightClass = isSingleLineLayout
    ? ''
    : isTinyCard
      ? 'min-h-[0.8rem]'
      : isDenseLayout
        ? 'min-h-[0.92rem]'
        : 'min-h-[1.02rem]';
  const titleClass = isSingleLineLayout
    ? isTinyCard
      ? 'text-[0.74rem] font-semibold text-white/62 tracking-tight truncate'
      : 'text-[0.82rem] font-semibold text-white/64 tracking-tight truncate'
    : isDenseLayout
      ? isTinyCard
        ? 'text-[0.86rem] font-semibold text-white/70 tracking-tight'
        : 'text-[0.95rem] font-semibold text-white/70 tracking-tight'
      : 'text-base font-semibold text-white/70 tracking-tight';
  const addLabelClass = isSingleLineLayout
    ? isTinyCard
      ? 'text-[10px] text-white/52 font-medium truncate'
      : 'text-[11px] text-white/52 font-medium truncate'
    : isTinyCard
      ? 'text-[9px] text-white/50 font-medium'
      : isDenseLayout
        ? 'text-[10px] text-white/50 font-medium'
        : 'text-[11px] text-white/50 font-medium';
  const rowGapClass = isSingleLineLayout ? (isTinyCard ? 'gap-x-1.5' : 'gap-x-2') : isTinyCard ? 'gap-x-1.5 gap-y-1' : 'gap-x-2 gap-y-1.5';
  const titleMarginClass = isSingleLineLayout ? 'mb-0.5' : isTinyCard ? 'mb-1' : isDenseLayout ? 'mb-1.5' : 'mb-3';

  return (
    <div ref={cardRef} className="h-full w-full min-h-0 min-w-0 overflow-hidden flex flex-col">
      {title ? (
        <div className={`${titleMarginClass} flex items-center justify-between px-0`}>
          <p className={titleClass}>{title}</p>
        </div>
      ) : null}
      <div
        className={`grid min-h-0 min-w-0 flex-1 items-center ${rowGapClass} ${isSingleLineLayout ? 'py-0' : 'pt-0.5 pb-1.5'}`}
        style={{ gridTemplateColumns: `repeat(${visibleItemsCount}, minmax(0, 1fr))` }}
      >
        {displayedScenes.map((sceneId) => {
          const scene = SCENES_CATALOG.find((item) => item.id === sceneId);
          if (!scene) {
            return null;
          }
          const configuredLabel = sceneLabels?.[scene.id]?.trim();
          const displayLabel = configuredLabel && configuredLabel.length > 0 ? configuredLabel : scene.label;
          const iconKey = sceneIcons?.[scene.id] ?? scene.defaultIcon;
          const isRunning = !isEditMode && runningSceneId === scene.id;
          const isCompleting = !isEditMode && !isRunning && completedSceneId === scene.id;
          const isConfirmed = !isEditMode && !isRunning && confirmedSceneId === scene.id;
          const ringProgress = isRunning ? runningProgress : isCompleting ? completedProgress : null;
          return (
            <SceneButton
              key={scene.id}
              icon={getSceneIconNode(iconKey, iconSize)}
              label={displayLabel}
              color={scene.color}
              iconKey={iconKey}
              isRunning={isRunning}
              isCompleting={isCompleting}
              isConfirmed={isConfirmed}
              ringProgress={ringProgress}
              itemGapClass={sceneItemGapClass}
              cellPaddingClass={sceneCellPaddingClass}
              buttonSizeClass={sceneButtonSizeClass}
              labelClass={sceneLabelClass}
              labelMinHeightClass={sceneLabelMinHeightClass}
              singleLine={isSingleLineLayout}
              onClick={() => {
                if (isEditMode || isRunning) {
                  return;
                }
                onSceneTrigger?.(scene.id);
              }}
            />
          );
        })}
        {isEditMode
          ? addSlots.map((scene) => (
              <button
                key={`add-${scene.id}`}
                type="button"
                onClick={() => onAddScene?.(scene.id)}
                className={`widget-action w-full min-w-0 ${sceneCellPaddingClass} ${
                  isSingleLineLayout
                    ? `flex items-center justify-center ${sceneItemGapClass}`
                    : `flex flex-col items-center justify-center ${sceneItemGapClass}`
                } group`}
              >
                <div className={`${sceneButtonSizeClass} rounded-full border border-white/20 border-dashed bg-white/5 flex items-center justify-center text-white/65 transition-colors group-hover:text-white group-hover:border-white/40 group-hover:bg-white/10`}>
                  <Plus size={isSingleLineLayout ? (isTinyCard ? 13 : 14) : isTinyCard ? 16 : isDenseLayout ? 18 : 20} />
                </div>
                <span className={`${addLabelClass} max-w-full text-center`}>Aggiungi</span>
              </button>
            ))
          : null}
      </div>
    </div>
  );
}

function SceneButton({
  icon,
  label,
  color,
  iconKey,
  isRunning,
  isCompleting,
  isConfirmed,
  ringProgress,
  itemGapClass,
  cellPaddingClass,
  buttonSizeClass,
  labelClass,
  labelMinHeightClass,
  singleLine = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  iconKey: SceneIconKey;
  isRunning: boolean;
  isCompleting: boolean;
  isConfirmed: boolean;
  ringProgress: number | null;
  itemGapClass: string;
  cellPaddingClass: string;
  buttonSizeClass: string;
  labelClass: string;
  labelMinHeightClass: string;
  singleLine?: boolean;
  onClick?: () => void;
}) {
  const iconVariants = SCENE_ICON_MOTION_VARIANTS[iconKey] ?? SCENE_ICON_MOTION_VARIANTS.music;
  const normalizedLabel = label.trim();
  const labelLength = normalizedLabel.length;
  const longLabelClass =
    labelLength >= 16
      ? 'text-[9px] sm:text-[10px] leading-[1.02]'
      : labelLength >= 12
        ? 'text-[10px] sm:text-[11px] leading-[1.05]'
        : '';

  return (
    <div
      className={`w-full min-w-0 ${cellPaddingClass} ${
        singleLine ? `flex items-center justify-center ${itemGapClass}` : `flex flex-col items-center justify-center ${itemGapClass} pb-0.5`
      }`}
    >
      <motion.button
        type="button"
        onClick={onClick}
        disabled={isRunning}
        aria-busy={isRunning}
        whileTap={{ scale: 0.94 }}
        className={`widget-action relative ${buttonSizeClass} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg transition-shadow hover:shadow-xl ${
          isRunning ? 'scale-[1.02]' : ''
        }`}
      >
        {ringProgress !== null ? (
          <span
            className="pointer-events-none absolute inset-0 z-10 rounded-full transition-opacity duration-300"
            style={{
              opacity: isConfirmed ? 0 : 1,
              background: `conic-gradient(rgba(255,255,255,0.88) ${Math.max(
                0,
                Math.min(1, ringProgress),
              ) * 360}deg, rgba(255,255,255,0.14) 0deg)`,
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
              transform: 'rotate(-90deg)',
              filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.25))',
            }}
          />
        ) : null}

        <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-full">
          <motion.span
            className="flex h-full w-full items-center justify-center leading-none"
            variants={iconVariants}
            initial="idle"
            animate={isRunning ? 'running' : isCompleting ? 'completing' : 'idle'}
          >
            {icon}
          </motion.span>
        </span>

        <AnimatePresence>
          {isConfirmed && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.3, type: 'spring', bounce: 0.4 }}
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-full border border-emerald-100/45 bg-emerald-500/80"
            >
              <CheckCircle2 size={20} className="text-emerald-50 drop-shadow-[0_1px_4px_rgba(16,185,129,0.5)]" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <span
        className={`${labelClass} ${longLabelClass} ${labelMinHeightClass} inline-flex items-center ${
          singleLine ? 'max-w-full truncate justify-start text-left' : 'max-w-full justify-center text-center'
        } text-white/70 font-medium`}
      >
        {label}
      </span>
    </div>
  );
}
