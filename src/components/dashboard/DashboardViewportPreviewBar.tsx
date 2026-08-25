import type { ReactNode } from 'react';
import { Monitor, Scan, Smartphone, Tablet } from 'lucide-react';
import type { DashboardGridBreakpoint } from '../../types/widgetTypeLayout';
import GlassSegmentSelect, { type GlassSegmentOption } from '../ui/GlassSegmentSelect';
import type { DashboardViewportPreviewMode } from './dashboardViewport';

const PREVIEW_OPTIONS: readonly GlassSegmentOption<DashboardViewportPreviewMode>[] = [
  {
    value: 'auto',
    label: 'Auto',
    ariaLabel: 'Anteprima automatica',
    title: 'Usa tutto lo spazio disponibile',
  },
  {
    value: 'desktop',
    label: 'Desktop',
    ariaLabel: 'Anteprima desktop',
    title: 'Simula un canvas desktop',
  },
  {
    value: 'tablet',
    label: 'Tablet',
    ariaLabel: 'Anteprima tablet',
    title: 'Simula un canvas tablet',
  },
  {
    value: 'compact',
    label: 'Verticale',
    ariaLabel: 'Anteprima tablet verticale',
    title: 'Simula il breakpoint compatto SM',
  },
  {
    value: 'mobile',
    label: 'Mobile',
    ariaLabel: 'Anteprima mobile',
    title: 'Simula un canvas mobile',
  },
];

const PREVIEW_ICONS = {
  auto: Scan,
  desktop: Monitor,
  tablet: Tablet,
  compact: Tablet,
  mobile: Smartphone,
} as const;

type DashboardViewportPreviewBarProps = {
  previewMode: DashboardViewportPreviewMode;
  canvasBreakpoint: DashboardGridBreakpoint;
  onPreviewModeChange: (mode: DashboardViewportPreviewMode) => void;
  availableModes?: readonly DashboardViewportPreviewMode[];
  primaryAction?: ReactNode;
  desktopActions?: ReactNode;
};

export function DashboardViewportPreviewBar({
  previewMode,
  canvasBreakpoint,
  onPreviewModeChange,
  availableModes,
  primaryAction,
  desktopActions,
}: DashboardViewportPreviewBarProps) {
  const previewOptions = availableModes
    ? PREVIEW_OPTIONS.filter((option) => availableModes.includes(option.value))
    : PREVIEW_OPTIONS;

  return (
    <div
      className="liquid-glass-navigation flex max-w-[calc(100vw-1rem)] items-center gap-1.5 overflow-visible rounded-[1.4rem] p-1.5 shadow-2xl sm:gap-2 sm:rounded-full"
      role="toolbar"
      aria-label="Anteprima responsive della dashboard"
    >
      <GlassSegmentSelect
        ariaLabel="Dimensione anteprima"
        options={previewOptions}
        value={previewMode}
        onChange={onPreviewModeChange}
        minOptionWidth="2.25rem"
        className="shrink-0"
        optionClassName="!h-9 !px-2 sm:!px-2.5"
        renderOption={(option) => {
          const Icon = PREVIEW_ICONS[option.value];
          return (
            <span className="flex min-w-0 items-center justify-center gap-1.5">
              <Icon
                className={`h-3.5 w-3.5 shrink-0 ${option.value === 'compact' ? 'rotate-90' : ''}`}
                aria-hidden
              />
              <span className="hidden sm:inline">{option.label}</span>
            </span>
          );
        }}
      />

      <span
        className="liquid-glass-control flex h-9 shrink-0 items-center rounded-full px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--ui-text-secondary)]"
        aria-label={`Breakpoint visualizzato ${canvasBreakpoint.toUpperCase()}`}
        title="Il breakpoint visualizzato è anche quello modificato"
      >
        <span className="hidden sm:inline">Vista&nbsp;</span>
        <strong className="text-[color:var(--ui-text-primary)]">{canvasBreakpoint.toUpperCase()}</strong>
      </span>

      {primaryAction ? (
        <>
          <span aria-hidden className="h-5 w-px shrink-0 bg-[color:var(--ui-separator)]" />
          <div className="flex min-w-0 items-center">{primaryAction}</div>
        </>
      ) : null}

      {desktopActions ? (
        <>
          <span aria-hidden className="hidden h-5 w-px shrink-0 bg-[color:var(--ui-separator)] lg:block" />
          <div className="hidden min-w-0 items-center lg:flex">{desktopActions}</div>
        </>
      ) : null}
    </div>
  );
}

export default DashboardViewportPreviewBar;
