import { useCallback, useEffect, useRef, useState } from 'react';

type UseHoldToConfirmOptions = {
  enabled: boolean;
  durationMs?: number;
  onComplete: () => void;
};

export function useHoldToConfirm({
  enabled,
  durationMs = 1000,
  onComplete,
}: UseHoldToConfirmOptions) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isSuccessPulse, setIsSuccessPulse] = useState(false);

  const rafRef = useRef<number | null>(null);
  const startTsRef = useRef<number>(0);
  const completedRef = useRef(false);
  const pulseTimeoutRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearFrame = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const clearPulseTimeout = useCallback(() => {
    if (pulseTimeoutRef.current !== null) {
      window.clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = null;
    }
  }, []);

  const resetProgress = useCallback(() => {
    startTsRef.current = 0;
    completedRef.current = false;
    setProgress(0);
    setIsHolding(false);
  }, []);

  const completeHold = useCallback(() => {
    clearFrame();
    completedRef.current = true;
    setIsHolding(false);
    setProgress(1);
    onCompleteRef.current();
    setIsSuccessPulse(true);
    clearPulseTimeout();
    pulseTimeoutRef.current = window.setTimeout(() => {
      setIsSuccessPulse(false);
      resetProgress();
    }, 340);
  }, [clearFrame, clearPulseTimeout, resetProgress]);

  const tick = useCallback(
    (timestamp: number) => {
      if (startTsRef.current === 0) {
        startTsRef.current = timestamp;
      }
      const elapsed = timestamp - startTsRef.current;
      const nextProgress = Math.max(0, Math.min(1, elapsed / durationMs));
      setProgress(nextProgress);
      if (nextProgress >= 1) {
        completeHold();
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    },
    [completeHold, durationMs],
  );

  const startHold = useCallback(() => {
    if (!enabled || completedRef.current) {
      return;
    }
    clearPulseTimeout();
    clearFrame();
    startTsRef.current = 0;
    completedRef.current = false;
    setIsSuccessPulse(false);
    setProgress(0);
    setIsHolding(true);
    rafRef.current = window.requestAnimationFrame(tick);
  }, [clearFrame, clearPulseTimeout, enabled, tick]);

  const endHold = useCallback(() => {
    if (!enabled) {
      return;
    }
    if (completedRef.current) {
      return;
    }
    clearFrame();
    startTsRef.current = 0;
    setIsHolding(false);
    setProgress(0);
  }, [clearFrame, enabled]);

  const forceReset = useCallback(() => {
    clearFrame();
    clearPulseTimeout();
    setIsSuccessPulse(false);
    resetProgress();
  }, [clearFrame, clearPulseTimeout, resetProgress]);

  useEffect(() => {
    if (enabled) {
      return;
    }
    forceReset();
  }, [enabled, forceReset]);

  useEffect(() => {
    return () => {
      clearFrame();
      clearPulseTimeout();
    };
  }, [clearFrame, clearPulseTimeout]);

  return {
    progress,
    isHolding,
    isSuccessPulse,
    startHold,
    endHold,
    forceReset,
  };
}

