import React, { useEffect, useMemo, useState } from 'react';

export type GuidedSetupStep = {
  title: string;
  description: string;
  hint?: string;
};

type GuidedSetupOverlayProps = {
  isOpen: boolean;
  tag: string;
  heading: string;
  steps: GuidedSetupStep[];
  onDismiss: () => void;
  completeLabel?: string;
  skipLabel?: string;
};

export function GuidedSetupOverlay({
  isOpen,
  tag,
  heading,
  steps,
  onDismiss,
  completeLabel = 'Fine guida',
  skipLabel = 'Salta guida',
}: GuidedSetupOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setStepIndex(0);
  }, [heading, isOpen]);

  const safeSteps = useMemo(
    () =>
      steps.length > 0
        ? steps
        : [
            {
              title: 'Guida rapida',
              description: 'Nessuno step configurato.',
            } satisfies GuidedSetupStep,
          ],
    [steps],
  );

  if (!isOpen) {
    return null;
  }

  const currentStep = safeSteps[Math.min(stepIndex, safeSteps.length - 1)];
  const isLastStep = stepIndex >= safeSteps.length - 1;

  return (
    <div className="fixed inset-0 z-[240] flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute inset-0 bg-black/70 backdrop-blur-3xl"
        aria-label="Chiudi guida"
      />

      <div
        className="liquid-glass-panel relative w-full max-w-2xl overflow-hidden p-6 sm:p-8 text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-sky-200/80">{tag}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{heading}</h2>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            {safeSteps.map((step, index) => (
              <span
                key={`${step.title}-${index}`}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index <= stepIndex ? 'bg-sky-300' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/45">
            Step {stepIndex + 1} di {safeSteps.length}
          </p>
          <h3 className="mt-3 text-xl font-semibold text-white">{currentStep.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{currentStep.description}</p>
          {currentStep.hint ? <p className="mt-3 text-xs text-sky-200/80">{currentStep.hint}</p> : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            {skipLabel}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              disabled={stepIndex === 0}
              className="rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Indietro
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  onDismiss();
                  return;
                }
                setStepIndex((current) => Math.min(safeSteps.length - 1, current + 1));
              }}
              className="rounded-xl border border-sky-300/50 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/30"
            >
              {isLastStep ? completeLabel : 'Avanti'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuidedSetupOverlay;
