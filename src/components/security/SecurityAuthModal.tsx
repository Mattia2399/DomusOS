import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Fingerprint, KeyRound, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getAlarmStateLabel } from '../../utils/alarmUtils';

type SecurityAuthModalProps = {
  isOpen: boolean;
  pendingAlarmState?: string | null;
  pendingStateRequiresCode: boolean;
  authError?: string;
  isAuthBusy?: boolean;
  supportsBiometric: boolean;
  prefersBiometric: boolean;
  isAlarmCodeNumeric: boolean;
  alarmCodeTypeLabel: string;
  authPinInput: string;
  onPinInputChange: (value: string) => void;
  onVerifyWithPin: () => void;
  onVerifyWithBiometric: () => void;
  onPushPinDigit: (digit: string) => void;
  onPopPinDigit: () => void;
  onClearPin: () => void;
  onClose: () => void;
  usePortal?: boolean;
};

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

export function SecurityAuthModal({
  isOpen,
  pendingAlarmState,
  pendingStateRequiresCode,
  authError,
  isAuthBusy = false,
  supportsBiometric,
  prefersBiometric,
  isAlarmCodeNumeric,
  alarmCodeTypeLabel,
  authPinInput,
  onPinInputChange,
  onVerifyWithPin,
  onVerifyWithBiometric,
  onPushPinDigit,
  onPopPinDigit,
  onClearPin,
  onClose,
  usePortal = false,
}: SecurityAuthModalProps) {
  const overlayTransition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] } as const;
  const panelTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] } as const;
  const modal = (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[280] flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={overlayTransition}
          style={{ willChange: 'opacity' }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi autenticazione"
            className="absolute inset-0 bg-black/45 backdrop-blur-3xl"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(0,0,0,0.28))]" />
          <motion.div
            className="liquid-glass-panel relative z-10 isolate w-full max-w-md transform-gpu overflow-hidden rounded-[34px] border border-white/[0.12] bg-white/[0.085] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-3xl"
            initial={{ y: -8, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.985 }}
            transition={panelTransition}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.16),transparent_36%),linear-gradient(145deg,rgba(255,255,255,0.10),rgba(255,255,255,0.025)_48%,transparent_78%)]" />
            <div className="pointer-events-none absolute inset-x-5 top-0 -z-10 h-px bg-white/36" />
            <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/[0.08] p-1.5 text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl hover:bg-white/[0.13] hover:text-white" aria-label="Chiudi"><X className="h-4 w-4" /></button>
            <p className="text-[11px] font-light uppercase tracking-[0.24em] text-white/60">Security Gate</p>
            <h3 className="mt-2 pr-10 text-xl font-semibold text-white">Autorizza: {pendingAlarmState ? getAlarmStateLabel(pendingAlarmState) : ''}</h3>
            <p className="mt-2 text-sm text-white/60">{pendingStateRequiresCode ? `${alarmCodeTypeLabel} richiesto dall'entita selezionata.` : 'Usa un metodo sicuro per autorizzare il cambio stato.'}</p>
            {prefersBiometric ? (
              <button type="button" onClick={onVerifyWithBiometric} disabled={isAuthBusy || !supportsBiometric} className={cn('mt-5 flex w-full items-center justify-center gap-2 rounded-[22px] border px-4 py-3.5 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-2xl', isAuthBusy || !supportsBiometric ? 'cursor-not-allowed border-white/10 bg-white/[0.045] text-white/40' : 'border-white/18 bg-white/[0.105] text-white hover:bg-white/[0.155]')}>
                <Fingerprint className="h-4 w-4" /> Sblocca con Face ID / Impronta
              </button>
            ) : null}
            {pendingStateRequiresCode ? (
              <div className="mt-4 rounded-[24px] border border-white/[0.09] bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl">
                <div className="flex items-center gap-2"><span className="inline-flex rounded-full border border-white/10 bg-white/10 p-1.5"><KeyRound className="h-3.5 w-3.5 text-white/85" /></span><p className="text-xs font-light uppercase tracking-[0.18em] text-white/60">{isAlarmCodeNumeric ? 'Tastierino Numerico' : 'Codice Allarme'}</p></div>
                <input type="password" value={authPinInput} onChange={(event) => onPinInputChange(event.target.value)} className="liquid-glass-card mt-3 w-full bg-white/[0.055] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/38 focus:border-white/30" placeholder={isAlarmCodeNumeric ? 'Inserisci PIN' : 'Inserisci codice'} />
                {isAlarmCodeNumeric ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => <button key={digit} type="button" onClick={() => onPushPinDigit(digit)} className="h-10 rounded-xl border border-white/[0.09] bg-white/[0.055] text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl hover:bg-white/[0.105]">{digit}</button>)}
                    <button type="button" onClick={onClearPin} className="h-10 rounded-xl border border-white/[0.09] bg-white/[0.055] text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl hover:bg-white/[0.105]">Clear</button>
                    <button type="button" onClick={() => onPushPinDigit('0')} className="h-10 rounded-xl border border-white/[0.09] bg-white/[0.055] text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl hover:bg-white/[0.105]">0</button>
                    <button type="button" onClick={onPopPinDigit} className="h-10 rounded-xl border border-white/[0.09] bg-white/[0.055] text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl hover:bg-white/[0.105]">Del</button>
                  </div>
                ) : null}
                <button type="button" onClick={onVerifyWithPin} disabled={isAuthBusy} className={cn('mt-3 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl', isAuthBusy ? 'cursor-not-allowed border-white/10 bg-white/[0.045] text-white/40' : 'border-white/18 bg-white/[0.095] text-white hover:bg-white/[0.145]')}>Conferma con {alarmCodeTypeLabel}</button>
              </div>
            ) : !prefersBiometric ? (
              <div className="mt-4 rounded-[24px] border border-amber-200/16 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-50/78">
                Nessun metodo di conferma disponibile. Configura biometria o codice per proseguire.
              </div>
            ) : null}
            {authError ? <p className="mt-3 text-xs text-rose-200/90">{authError}</p> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (usePortal && typeof document !== 'undefined') {
    return createPortal(modal, document.body);
  }

  return modal;
}

export default SecurityAuthModal;
