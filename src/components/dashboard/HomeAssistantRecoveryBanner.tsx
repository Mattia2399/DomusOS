import { CloudOff, KeyRound, LogIn, RefreshCw, WifiOff } from 'lucide-react';
import type { HaConnectionStatus } from '../../services/haConnectionState';
import GlassButton from '../ui/GlassButton';
import GlassModal from '../ui/GlassModal';

type HomeAssistantRecoveryBannerProps = {
  status: HaConnectionStatus;
  error?: string | null;
  isRetrying?: boolean;
  lastUpdatedAt?: number | null;
  onRetry: () => void;
  onReconnect: () => void;
};

export function HomeAssistantRecoveryBanner({
  status,
  error,
  isRetrying = false,
  lastUpdatedAt,
  onRetry,
  onReconnect,
}: HomeAssistantRecoveryBannerProps) {
  const needsAuthentication = status === 'reauth_required';
  const isOffline = status === 'offline';
  const isReconnecting = status === 'reconnecting';
  const title = needsAuthentication
    ? 'Sessione Home Assistant scaduta'
    : isOffline
      ? 'Home Assistant non raggiungibile'
      : isReconnecting
        ? 'Riconnessione a Home Assistant'
        : 'Connessione Home Assistant interrotta';
  const fallbackMessage = needsAuthentication
    ? 'Per proteggere la tua casa è necessario effettuare nuovamente l’accesso.'
    : isOffline
      ? 'Manteniamo visibili gli ultimi dati ricevuti, ma i controlli sono temporaneamente bloccati.'
      : isReconnecting
        ? 'La connessione è instabile. Il ripristino automatico è già in corso.'
        : 'Riprova la connessione oppure effettua nuovamente l’accesso.';
  const lastUpdateLabel = lastUpdatedAt
    ? new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(lastUpdatedAt)
    : null;
  const StatusIcon = needsAuthentication ? KeyRound : isOffline ? CloudOff : WifiOff;
  const showRetry = !needsAuthentication;
  const showReconnect = needsAuthentication || status === 'error';

  if (needsAuthentication) {
    return (
      <GlassModal
        isOpen
        onClose={() => {}}
        dismissible={false}
        showCloseButton={false}
        size="sm"
        eyebrow="Connessione protetta"
        title="Accedi di nuovo"
        description="La sessione Home Assistant non è più valida. Dashboard e configurazione resteranno al sicuro durante il nuovo accesso."
        backdropClassName="!bg-black/55 !backdrop-blur-3xl"
        footer={(
          <GlassButton size="md" variant="primary" onClick={onReconnect} className="w-full justify-center">
            <LogIn size={16} />
            Accedi di nuovo
          </GlassButton>
        )}
      >
        <div className="onboarding-notice onboarding-notice-danger">
          <span className="onboarding-notice-icon"><KeyRound size={17} /></span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[color:var(--ui-text-primary)]">Sessione scaduta</div>
            <p className="mt-1 text-sm leading-6 text-[color:var(--ui-text-secondary)]">
              I comandi e le modifiche sono bloccati finché l’identità non viene verificata nuovamente.
            </p>
          </div>
        </div>
      </GlassModal>
    );
  }

  return (
    <section
      role="alert"
      aria-live="assertive"
      className="liquid-glass-navigation fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-[230] mx-auto max-w-xl p-3.5 text-[color:var(--ui-text-primary)] sm:p-4 md:bottom-auto md:top-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-300/24 bg-rose-500/12 text-rose-300">
          <StatusIcon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-[color:var(--ui-text-primary)]">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-[color:var(--ui-text-secondary)]">
            {error?.trim() || fallbackMessage}
          </p>
          {lastUpdateLabel && !needsAuthentication ? (
            <p className="mt-1 text-[10px] font-medium text-[color:var(--ui-text-disabled)]">
              Ultimo aggiornamento: {lastUpdateLabel}
            </p>
          ) : null}
        </div>
      </div>
      <div className={`mt-3 grid gap-2 ${showRetry && showReconnect ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {showRetry ? (
          <GlassButton size="sm" onClick={onRetry} disabled={isRetrying || isReconnecting} className="w-full justify-center">
            <RefreshCw size={14} className={isRetrying || isReconnecting ? 'animate-spin' : ''} />
            {isRetrying || isReconnecting ? 'Riconnessione…' : 'Riprova'}
          </GlassButton>
        ) : null}
        {showReconnect ? (
          <GlassButton size="sm" variant="primary" onClick={onReconnect} className="w-full justify-center">
            <LogIn size={14} />
            Accedi di nuovo
          </GlassButton>
        ) : null}
      </div>
    </section>
  );
}

export default HomeAssistantRecoveryBanner;
