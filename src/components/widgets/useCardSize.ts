import { useEffect, useMemo, useRef, useState } from 'react';

type CardSize = {
  width: number;
  height: number;
};

export type CardDensity = 'tiny' | 'compact' | 'regular';

type CardDensityThresholds = {
  tinyWidth: number;
  tinyHeight: number;
  compactWidth: number;
  compactHeight: number;
};

const DEFAULT_THRESHOLDS: CardDensityThresholds = {
  tinyWidth: 220,
  tinyHeight: 150,
  compactWidth: 320,
  compactHeight: 210,
};

export function useCardSize(
  thresholds: Partial<CardDensityThresholds> = {},
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<CardSize>({ width: 0, height: 0 });
  const mergedThresholds = useMemo<CardDensityThresholds>(
    () => ({
      ...DEFAULT_THRESHOLDS,
      ...thresholds,
    }),
    [thresholds.compactHeight, thresholds.compactWidth, thresholds.tinyHeight, thresholds.tinyWidth],
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const updateSize = () => {
      const bounds = node.getBoundingClientRect();
      const nextWidth = Math.max(0, Math.round(bounds.width));
      const nextHeight = Math.max(0, Math.round(bounds.height));
      setSize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight },
      );
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => {
        window.removeEventListener('resize', updateSize);
      };
    }

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  const density: CardDensity =
    size.width > 0 &&
    size.height > 0 &&
    (size.width <= mergedThresholds.tinyWidth || size.height <= mergedThresholds.tinyHeight)
      ? 'tiny'
      : size.width > 0 &&
          size.height > 0 &&
          (size.width <= mergedThresholds.compactWidth || size.height <= mergedThresholds.compactHeight)
        ? 'compact'
        : 'regular';

  return {
    ref,
    width: size.width,
    height: size.height,
    density,
    hasSize: size.width > 0 && size.height > 0,
  };
}

