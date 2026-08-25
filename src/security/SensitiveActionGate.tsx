import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import GlassModal from '../components/ui/GlassModal';
import { useDeviceAuth, type AuthUserContext } from '../hooks/useDeviceAuth';
import { useDashboardSecurity, type DashboardCapability } from './dashboardAccess';

export type SensitiveActionKind =
  | 'view_security_codes'
  | 'save_security_codes'
  | 'restore_backup'
  | 'reset_dashboard'
  | 'restart_home_assistant';

export type SensitiveActionRequest = {
  action: SensitiveActionKind;
  capability: DashboardCapability;
  title: string;
  description: string;
  confirmationPhrase?: string;
};

type SensitiveActionGateValue = {
  isUnlocked: boolean;
  authorize: (request: SensitiveActionRequest) => Promise<boolean>;
  lock: () => void;
};

type PendingConfirmation = SensitiveActionRequest & {
  resolve: (allowed: boolean) => void;
};

const SensitiveActionGateContext = createContext<SensitiveActionGateValue>({
  isUnlocked: false,
  authorize: async () => false,
  lock: () => undefined,
});

export function SensitiveActionGateProvider({
  user,
  children,
}: {
  user?: Partial<AuthUserContext>;
  children: ReactNode;
}) {
  const security = useDashboardSecurity();
  const deviceAuth = useDeviceAuth(user);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [phraseInput, setPhraseInput] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const pendingRef = useRef<PendingConfirmation | null>(null);

  const settlePending = useCallback((allowed: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    setPhraseInput('');
    setIsConfirming(false);
    if (allowed) {
      setIsUnlocked(true);
    }
    current?.resolve(allowed);
  }, []);

  const lock = useCallback(() => {
    setIsUnlocked(false);
    settlePending(false);
  }, [settlePending]);

  useEffect(() => {
    lock();
  }, [lock, security.runtimeMode, security.user?.id]);

  const authorize = useCallback(
    async (request: SensitiveActionRequest) => {
      if (!security.can(request.capability)) {
        return false;
      }
      const isCodeSessionAction = request.action === 'view_security_codes' || request.action === 'save_security_codes';
      if (isCodeSessionAction && isUnlocked) {
        return true;
      }
      if (pendingRef.current) {
        return false;
      }

      if (!isCodeSessionAction) {
        return new Promise<boolean>((resolve) => {
          const nextPending = { ...request, resolve };
          pendingRef.current = nextPending;
          setPending(nextPending);
          setPhraseInput('');
        });
      }

      const biometricAvailable = await deviceAuth.isBiometricAvailable();
      if (biometricAvailable && deviceAuth.isEnrolled) {
        const verified = await deviceAuth.authenticate(request.title);
        if (verified) setIsUnlocked(true);
        return verified;
      }

      return new Promise<boolean>((resolve) => {
        const nextPending = { ...request, resolve };
        pendingRef.current = nextPending;
        setPending(nextPending);
        setPhraseInput('');
      });
    },
    [deviceAuth, isUnlocked, security],
  );

  const expectedPhrase = pending?.confirmationPhrase ?? '';
  const canConfirm = expectedPhrase.length === 0 || phraseInput.trim() === expectedPhrase;
  const confirmPending = useCallback(async () => {
    if (!pendingRef.current || !canConfirm || isConfirming) return;
    setIsConfirming(true);
    const current = pendingRef.current;
    const biometricAvailable = await deviceAuth.isBiometricAvailable();
    if (biometricAvailable && deviceAuth.isEnrolled) {
      const verified = await deviceAuth.authenticate(current.title);
      if (!verified) {
        settlePending(false);
        return;
      }
    }
    settlePending(true);
  }, [canConfirm, deviceAuth, isConfirming, settlePending]);

  return (
    <SensitiveActionGateContext.Provider value={{ isUnlocked, authorize, lock }}>
      {children}
      <GlassModal
        isOpen={Boolean(pending)}
        onClose={() => settlePending(false)}
        eyebrow="Conferma locale"
        title={pending?.title ?? 'Conferma azione'}
        description={pending?.description}
        variant="responsive"
        size="sm"
        zIndex={285}
        showCloseButton={false}
        backdropClassName="bg-black/75 backdrop-blur-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => settlePending(false)}
              className="glass-button rounded-xl px-4 py-2.5 text-sm text-white/70"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={() => { void confirmPending(); }}
              disabled={!canConfirm || isConfirming}
              className="glass-button rounded-xl border-blue-300/45 bg-blue-500/18 px-4 py-2.5 text-sm font-semibold text-blue-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isConfirming ? 'Verifica...' : 'Conferma'}
            </button>
          </>
        }
      >
        <p className="text-xs leading-relaxed text-white/55">
          Questa verifica conferma la presenza sul dispositivo. L&apos;autorizzazione effettiva resta quella di Home Assistant.
        </p>
        {expectedPhrase ? (
          <label className="mt-4 block">
            <span className="text-xs font-medium text-white/65">
              Digita <strong className="text-white">{expectedPhrase}</strong> per continuare
            </span>
            <input
              value={phraseInput}
              onChange={(event) => setPhraseInput(event.target.value)}
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300/55"
            />
          </label>
        ) : null}
      </GlassModal>
    </SensitiveActionGateContext.Provider>
  );
}

export function useSensitiveActionGate() {
  return useContext(SensitiveActionGateContext);
}
