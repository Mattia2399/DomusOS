import { FileClock, RotateCcw, Trash2 } from 'lucide-react';
import type { DashboardEditDraft } from '../../services/dashboardEditDraft';
import GlassButton from '../ui/GlassButton';
import GlassModal from '../ui/GlassModal';

type DashboardEditDraftRecoveryModalProps = {
  draft: DashboardEditDraft | null;
  hasRevisionConflict: boolean;
  onResume: () => void;
  onDiscard: () => void;
};

export default function DashboardEditDraftRecoveryModal({
  draft,
  hasRevisionConflict,
  onResume,
  onDiscard,
}: DashboardEditDraftRecoveryModalProps) {
  if (!draft) return null;
  const time = new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(draft.updatedAt);

  return (
    <GlassModal
      isOpen
      dismissible={false}
      showCloseButton={false}
      onClose={() => {}}
      eyebrow="Recupero modifica"
      title="Hai una bozza non salvata"
      description={
        hasRevisionConflict
          ? 'Nel frattempo il layout su Home Assistant è cambiato. Puoi riprendere la bozza, ma controllala prima di salvarla.'
          : 'La precedente sessione Edit non è stata chiusa correttamente.'
      }
      variant="responsive"
      size="md"
      zIndex={245}
      backdropClassName="!bg-black/60 !backdrop-blur-3xl"
      footerClassName="grid grid-cols-1 gap-2 sm:grid-cols-2"
      footer={
        <>
          <GlassButton size="md" onClick={onDiscard} className="w-full justify-center">
            <Trash2 size={16} />
            Elimina bozza
          </GlassButton>
          <GlassButton size="md" variant="primary" onClick={onResume} className="w-full justify-center">
            <RotateCcw size={16} />
            Riprendi modifica
          </GlassButton>
        </>
      }
    >
      <div className="onboarding-notice">
        <span className="onboarding-notice-icon"><FileClock size={17} /></span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[color:var(--ui-text-primary)]">Ultima bozza</div>
          <p className="mt-1 text-sm text-[color:var(--ui-text-secondary)]">Aggiornata il {time}</p>
        </div>
      </div>
    </GlassModal>
  );
}
