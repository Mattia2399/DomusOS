import {
  ChevronRight,
  Link2,
  RotateCcw,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type {
  SettingsManagementSectionDefinition,
  SettingsManagementSectionIconKey,
  SettingsManagementSectionId,
} from './settingsManagementRegistry';

const SECTION_ICONS: Record<SettingsManagementSectionIconKey, LucideIcon> = {
  members: Users,
  ha: Link2,
  config: RotateCcw,
};

type SettingsSectionNavigationProps = {
  sections: readonly SettingsManagementSectionDefinition[];
  activeSection: SettingsManagementSectionId;
  isCompactViewport: boolean;
  onSelect: (sectionId: SettingsManagementSectionId) => void;
};

export function SettingsSectionNavigation({
  sections,
  activeSection,
  isCompactViewport,
  onSelect,
}: SettingsSectionNavigationProps) {
  return (
    <div className="mt-2 overflow-hidden rounded-[1.35rem] border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-glass-soft)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
      {sections.map((section) => {
        const isActive = activeSection === section.id;
        const SectionIcon = SECTION_ICONS[section.icon];

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex w-full items-center gap-3 rounded-[1.05rem] border px-3 py-2.5 text-left transition-[background-color,border-color,color,box-shadow,transform] duration-200 active:scale-[0.99] ${
              isActive
                ? 'liquid-glass-selection border-[color:rgb(var(--ui-accent-rgb)/0.46)] text-[color:var(--ui-text-primary)] shadow-[0_8px_20px_var(--ui-shadow-soft)]'
                : 'border-transparent text-[color:var(--ui-text-primary)] hover:bg-[color:var(--ui-fill-tertiary)]'
            } ${isCompactViewport ? 'min-h-[3.65rem] py-3' : ''}`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                isActive
                  ? 'border-[color:rgb(var(--ui-accent-rgb)/0.34)] bg-[color:rgb(var(--ui-accent-rgb)/0.16)] text-[color:var(--ui-accent-strong)]'
                  : 'border-[color:var(--ui-border)] bg-[color:var(--ui-fill-tertiary)] text-[color:var(--ui-text-secondary)]'
              }`}
            >
              <SectionIcon size={15} />
            </span>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{section.label}</p>
                {!isCompactViewport ? (
                  <p
                    className={`mt-0.5 text-xs ${
                      isActive
                        ? 'text-[color:rgb(var(--ui-accent-rgb)/0.96)]'
                        : 'text-[color:var(--ui-text-secondary)]'
                    }`}
                  >
                    {section.hint}
                  </p>
                ) : null}
              </div>
              {isCompactViewport ? (
                <ChevronRight size={16} className="shrink-0 text-[color:var(--ui-text-secondary)]" />
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default SettingsSectionNavigation;
