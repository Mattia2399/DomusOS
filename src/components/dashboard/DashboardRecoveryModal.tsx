import { History, RotateCcw, ShieldCheck } from 'lucide-react';
import type { DashboardRecoverySnapshot } from '../../services/dashboardRecovery';
import GlassButton from '../ui/GlassButton';
import GlassModal from '../ui/GlassModal';

type DashboardRecoveryModalProps = {
  snapshot: DashboardRecoverySnapshot | null;
  onKeepCurrent: () => void;
  onRestore: () => void;
};

export function DashboardRecoveryModal({
  snapshot,
  onKeepCurrent,
  onRestore,
}: DashboardRecoveryModalProps) {
  if (!snapshot) {
    return null;
  }

  const snapshotTime = new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(snapshot.createdAt);

  return (
    <GlassModal
      isOpen
      onClose={() => {}}
      dismissible={false}
      showCloseButton={false}
      variant="responsive"
      size="md"
      eyebrow="Protezione del layout"
      title="Copia di recupero disponibile"
      description="La precedente sessione di modifica non risulta chiusa normalmente. Scegli quale versione mantenere."
      backdropClassName="!bg-black/55 !backdrop-blur-3xl"
      footerClassName="grid grid-cols-1 gap-2 sm:grid-cols-2"
      footer={
        <>
          <GlassButton size="md" onClick={onKeepCurrent} className="w-full justify-center">
            <ShieldCheck size={16} />
            Mantieni attuale
          </GlassButton>
          <GlassButton size="md" variant="primary" onClick={onRestore} className="w-full justify-center">
            <RotateCcw size={16} />
            Ripristina copia
          </GlassButton>
        </>
      }
    >
      <div className="onboarding-notice">
        <span className="onboarding-notice-icon"><History size={17} /></span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[color:var(--ui-text-primary)]">Ultimo punto stabile</div>
          <p className="mt-1 text-sm leading-6 text-[color:var(--ui-text-secondary)]">
            Creato il {snapshotTime}, prima di iniziare le modifiche.
          </p>
        </div>
      </div>
    </GlassModal>
  );
}

export default DashboardRecoveryModal;
