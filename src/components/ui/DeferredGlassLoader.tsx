import { useEffect, useState } from 'react';
import GlassLoader from './GlassLoader';

type DeferredGlassLoaderProps = {
  label: string;
  description?: string;
  delayMs?: number;
  overlay?: boolean;
};

export function DeferredGlassLoader({
  label,
  description = 'Carichiamo soltanto gli strumenti necessari.',
  delayMs = 200,
  overlay = false,
}: DeferredGlassLoaderProps) {
  const [isVisible, setIsVisible] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) {
      setIsVisible(true);
      return undefined;
    }

    const timer = window.setTimeout(() => setIsVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  return (
    <div
      data-testid="deferred-glass-loader"
      data-visible={isVisible ? 'true' : 'false'}
      aria-busy="true"
      className={
        overlay
          ? `fixed inset-0 z-[230] flex items-center justify-center transition-[background-color,backdrop-filter] duration-200 motion-reduce:transition-none ${
              isVisible
                ? 'pointer-events-auto bg-[color:var(--ui-scrim)] backdrop-blur-xl'
                : 'pointer-events-auto bg-transparent'
            }`
          : 'flex h-full min-h-0 flex-1 items-center justify-center'
      }
    >
      <div
        className={`transition-opacity duration-200 motion-reduce:transition-none ${
          isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isVisible}
      >
        {isVisible ? (
          <GlassLoader size="md" label={label} description={description} />
        ) : null}
      </div>
    </div>
  );
}

export default DeferredGlassLoader;
