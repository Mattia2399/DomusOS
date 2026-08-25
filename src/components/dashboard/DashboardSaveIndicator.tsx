import { useEffect, useState } from 'react';
import { Check, RefreshCw, Save, SaveOff } from 'lucide-react';
import type { DashboardLayoutSaveStatus } from '../../hooks/useDashboardLayoutPersistence';

type DashboardSaveIndicatorProps = {
  status: DashboardLayoutSaveStatus;
  embedded?: boolean;
};

const ERROR_LABELS: Record<Extract<DashboardLayoutSaveStatus, { phase: 'error' }>['code'], string> = {
  storage_unavailable: 'Archivio non disponibile',
  server_unavailable: 'Home Assistant non raggiungibile',
  server_unauthorized: 'Permessi insufficienti per salvare',
  server_unsupported: 'Archivio Home Assistant non supportato',
  server_conflict: 'Layout modificato da un altro dispositivo',
  migration_required: 'Layout da trasferire su Home Assistant',
  quota_exceeded: 'Spazio di salvataggio esaurito',
  security_error: 'Salvataggio bloccato dal browser',
  serialization_error: 'Layout non salvabile',
  unknown: 'Salvataggio non riuscito',
};

function SaveCheckIcon() {
  return (
    <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
      <Save size={14} />
      <Check
        size={9}
        strokeWidth={3}
        className="absolute -bottom-0.5 -right-0.5 rounded-full bg-[color:var(--ui-surface-glass)]"
      />
    </span>
  );
}

export function DashboardSaveIndicator({ status, embedded = false }: DashboardSaveIndicatorProps) {
  const [showSavedLabel, setShowSavedLabel] = useState(false);

  useEffect(() => {
    if (status.phase !== 'saved') {
      setShowSavedLabel(false);
      return undefined;
    }

    setShowSavedLabel(true);
    const timeoutId = window.setTimeout(() => {
      setShowSavedLabel(false);
    }, 1800);
    return () => window.clearTimeout(timeoutId);
  }, [status.phase, status.phase === 'saved' ? status.savedAt : null]);

  if (status.phase === 'idle') {
    return null;
  }

  const isSaving = status.phase === 'saving';
  const isError = status.phase === 'error';
  const isDirty = status.phase === 'dirty';
  const label = isSaving
    ? 'Salvataggio…'
    : isError || isDirty
      ? 'Modifiche non salvate'
      : 'Salvato';
  const showLabel = isSaving || isError || isDirty || showSavedLabel;

  return (
    <div
      className={`${embedded ? '' : 'liquid-glass-control shadow-xl'} pointer-events-none inline-flex min-h-9 items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-[gap] duration-300 ${
        showLabel ? 'gap-2' : 'gap-0'
      } ${
        isError
          ? 'text-[color:var(--ui-danger,#ff453a)]'
          : isDirty
            ? 'text-[color:var(--ui-warning,#ff9f0a)]'
            : 'text-[color:var(--ui-text-primary)]'
      }`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-label={label}
      title={
        status.phase === 'saved'
          ? `Layout salvato alle ${new Date(status.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : status.phase === 'error'
            ? ERROR_LABELS[status.code]
            : status.phase === 'dirty'
              ? 'Le modifiche verranno salvate quando uscirai dalla modalità Edit'
            : label
      }
    >
      {isSaving ? (
        <RefreshCw size={14} className="animate-spin" aria-hidden />
      ) : isError || isDirty ? (
        <SaveOff size={14} aria-hidden />
      ) : (
        <SaveCheckIcon />
      )}
      {showLabel ? <span>{label}</span> : null}
    </div>
  );
}
