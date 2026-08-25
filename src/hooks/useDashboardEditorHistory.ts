import { useCallback, useEffect, useRef, useState } from 'react';

type DashboardEditorHistoryOptions<TSnapshot> = {
  enabled: boolean;
  current: TSnapshot;
  onApply: (snapshot: TSnapshot) => void;
  transactionMs?: number;
  limit?: number;
};

function cloneSnapshot<TSnapshot>(snapshot: TSnapshot): TSnapshot {
  if (typeof structuredClone === 'function') {
    return structuredClone(snapshot);
  }
  return JSON.parse(JSON.stringify(snapshot)) as TSnapshot;
}

function snapshotFingerprint(snapshot: unknown) {
  return JSON.stringify(snapshot);
}

function isEditableKeyboardTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(
    target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'),
  );
}

export function useDashboardEditorHistory<TSnapshot>({
  enabled,
  current,
  onApply,
  transactionMs = 260,
  limit = 50,
}: DashboardEditorHistoryOptions<TSnapshot>) {
  const currentRef = useRef(current);
  const onApplyRef = useRef(onApply);
  const enabledRef = useRef(enabled);
  const pastRef = useRef<TSnapshot[]>([]);
  const futureRef = useRef<TSnapshot[]>([]);
  const transactionBaselineRef = useRef<TSnapshot | null>(null);
  const transactionTimeoutRef = useRef<number | null>(null);
  const [historyState, setHistoryState] = useState({ past: 0, future: 0 });

  currentRef.current = current;
  onApplyRef.current = onApply;
  enabledRef.current = enabled;

  const publishHistoryState = useCallback(() => {
    setHistoryState({
      past: pastRef.current.length,
      future: futureRef.current.length,
    });
  }, []);

  const finalizeTransaction = useCallback(() => {
    if (transactionTimeoutRef.current !== null) {
      window.clearTimeout(transactionTimeoutRef.current);
      transactionTimeoutRef.current = null;
    }
    const baseline = transactionBaselineRef.current;
    transactionBaselineRef.current = null;
    if (!baseline || snapshotFingerprint(baseline) === snapshotFingerprint(currentRef.current)) {
      publishHistoryState();
      return false;
    }
    pastRef.current = [...pastRef.current, baseline].slice(-limit);
    futureRef.current = [];
    publishHistoryState();
    return true;
  }, [limit, publishHistoryState]);

  const beginMutation = useCallback(() => {
    if (!enabledRef.current) {
      return;
    }
    if (!transactionBaselineRef.current) {
      transactionBaselineRef.current = cloneSnapshot(currentRef.current);
    }
    if (transactionTimeoutRef.current !== null) {
      window.clearTimeout(transactionTimeoutRef.current);
    }
    transactionTimeoutRef.current = window.setTimeout(() => {
      finalizeTransaction();
    }, transactionMs);
  }, [finalizeTransaction, transactionMs]);

  const undo = useCallback(() => {
    if (!enabledRef.current) {
      return false;
    }
    finalizeTransaction();
    const target = pastRef.current.at(-1);
    if (!target) {
      return false;
    }
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, cloneSnapshot(currentRef.current)].slice(-limit);
    onApplyRef.current(cloneSnapshot(target));
    publishHistoryState();
    return true;
  }, [finalizeTransaction, limit, publishHistoryState]);

  const redo = useCallback(() => {
    if (!enabledRef.current) {
      return false;
    }
    finalizeTransaction();
    const target = futureRef.current.at(-1);
    if (!target) {
      return false;
    }
    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [...pastRef.current, cloneSnapshot(currentRef.current)].slice(-limit);
    onApplyRef.current(cloneSnapshot(target));
    publishHistoryState();
    return true;
  }, [finalizeTransaction, limit, publishHistoryState]);

  useEffect(() => {
    if (!enabled) {
      if (transactionTimeoutRef.current !== null) {
        window.clearTimeout(transactionTimeoutRef.current);
        transactionTimeoutRef.current = null;
      }
      transactionBaselineRef.current = null;
      pastRef.current = [];
      futureRef.current = [];
      setHistoryState({ past: 0, future: 0 });
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || isEditableKeyboardTarget(event.target)) {
        return;
      }
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier) {
        return;
      }
      if (event.key.toLowerCase() === 'z') {
        const handled = event.shiftKey ? redo() : undo();
        if (handled) {
          event.preventDefault();
        }
        return;
      }
      if (event.key.toLowerCase() === 'y' && !event.shiftKey) {
        if (redo()) {
          event.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, redo, undo]);

  useEffect(() => () => {
    if (transactionTimeoutRef.current !== null) {
      window.clearTimeout(transactionTimeoutRef.current);
    }
  }, []);

  return {
    beginMutation,
    undo,
    redo,
    canUndo: historyState.past > 0 || transactionBaselineRef.current !== null,
    canRedo: historyState.future > 0,
    undoCount: historyState.past,
    redoCount: historyState.future,
  };
}
