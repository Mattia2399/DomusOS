import { useEffect, useRef, useState } from 'react';

export type ObservedElementSize = {
  identity: string;
  width: number;
  height: number;
};

function toRoundedSize(identity: string, width: number, height: number): ObservedElementSize | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return {
    identity,
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

export function useObservedElementSize<T extends HTMLElement>(identity: string) {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<ObservedElementSize | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    let animationFrame = 0;
    const commitSize = (width: number, height: number) => {
      const nextSize = toRoundedSize(identity, width, height);
      if (!nextSize) {
        return;
      }
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        setSize((current) =>
          current?.identity === nextSize.identity &&
          current.width === nextSize.width &&
          current.height === nextSize.height
            ? current
            : nextSize,
        );
      });
    };
    const measureElement = () => {
      const bounds = element.getBoundingClientRect();
      commitSize(bounds.width, bounds.height);
    };

    measureElement();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureElement);
      return () => {
        window.cancelAnimationFrame(animationFrame);
        window.removeEventListener('resize', measureElement);
      };
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const borderBox = Array.isArray(entry.borderBoxSize)
        ? entry.borderBoxSize[0]
        : entry.borderBoxSize;
      commitSize(
        borderBox?.inlineSize ?? entry.contentRect.width,
        borderBox?.blockSize ?? entry.contentRect.height,
      );
    });
    observer.observe(element, { box: 'border-box' });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [identity]);

  return { ref, size };
}
