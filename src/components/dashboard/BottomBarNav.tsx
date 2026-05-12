import React from 'react';
import {
  BarChart3,
  DoorOpen,
  HelpCircle,
  Home,
  LayoutGrid,
  Lightbulb,
  MonitorSmartphone,
  MoreHorizontal,
  Music2,
  PencilLine,
  Rocket,
  Settings,
  ShieldCheck,
  Thermometer,
  User,
} from 'lucide-react';
import type { SidebarQuickPath, SidebarQuickPathIconKey } from '../../hooks/useProfileSettings';
import { isPathActiveForCurrentLocation } from '../../utils/navigationPathMatch';

type BottomBarNavProps = {
  isEditMode: boolean;
  canToggleEditMode: boolean;
  quickPaths: SidebarQuickPath[];
  selectedPathId?: string | null;
  onPathClick: (entry: SidebarQuickPath) => void;
  onToggleEditMode: () => void;
  onOpenProfile: () => void;
};

const PATH_ICONS: Record<SidebarQuickPathIconKey, typeof LayoutGrid> = {
  dashboard: LayoutGrid,
  devices: MonitorSmartphone,
  settings: Settings,
  automation: Rocket,
  security: ShieldCheck,
  help: HelpCircle,
  home: Home,
  rooms: DoorOpen,
  chart: BarChart3,
  light: Lightbulb,
  climate: Thermometer,
  media: Music2,
};

type BottomBarPrimaryAction = {
  entry: SidebarQuickPath;
};

type BottomBarMoreAction = {
  entry: SidebarQuickPath;
};

const DEFAULT_BOTTOM_BAR_PATHS: SidebarQuickPath[] = [
  { id: 'bottom-dashboard', label: 'Dashboard', path: '/home', icon: 'dashboard' },
  { id: 'bottom-rooms', label: 'Stanze', path: '/rooms', icon: 'rooms' },
  { id: 'bottom-consumi', label: 'Consumi', path: '/consumi', icon: 'chart' },
  { id: 'bottom-security', label: 'Sicurezza', path: '/security', icon: 'security' },
  { id: 'bottom-homeview', label: 'Homeview', path: '/appgallery', icon: 'home' },
  { id: 'bottom-automations', label: 'Automazioni', path: '/automations', icon: 'automation' },
];

export function BottomBarNav({
  isEditMode,
  canToggleEditMode,
  quickPaths,
  selectedPathId = null,
  onPathClick,
  onToggleEditMode,
  onOpenProfile,
}: BottomBarNavProps) {
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const [isMoreSheetDragging, setIsMoreSheetDragging] = React.useState(false);
  const [moreSheetDragOffset, setMoreSheetDragOffset] = React.useState(0);
  const moreSheetStartYRef = React.useRef<number | null>(null);
  const moreSheetPointerIdRef = React.useRef<number | null>(null);
  const moreSheetDragOffsetRef = React.useRef(0);
  const MORE_SHEET_CLOSE_THRESHOLD_PX = 88;

  const resetMoreSheetDrag = React.useCallback(() => {
    setIsMoreSheetDragging(false);
    setMoreSheetDragOffset(0);
    moreSheetStartYRef.current = null;
    moreSheetPointerIdRef.current = null;
    moreSheetDragOffsetRef.current = 0;
  }, []);

  const handleMoreSheetDragStart = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMoreOpen) {
      return;
    }
    moreSheetStartYRef.current = event.clientY;
    moreSheetPointerIdRef.current = event.pointerId;
    moreSheetDragOffsetRef.current = 0;
    setMoreSheetDragOffset(0);
    setIsMoreSheetDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, [isMoreOpen]);

  const handleMoreSheetDragMove = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (moreSheetPointerIdRef.current !== event.pointerId || moreSheetStartYRef.current === null) {
      return;
    }
    const nextOffset = Math.max(0, event.clientY - moreSheetStartYRef.current);
    moreSheetDragOffsetRef.current = nextOffset;
    setMoreSheetDragOffset(nextOffset);
  }, []);

  const finishMoreSheetDrag = React.useCallback(
    (event?: React.PointerEvent<HTMLDivElement>) => {
      if (event && moreSheetPointerIdRef.current !== event.pointerId) {
        return;
      }
      if (event) {
        try {
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        } catch {
          // no-op: some browsers throw if capture was already released
        }
      }
      const shouldClose = moreSheetDragOffsetRef.current >= MORE_SHEET_CLOSE_THRESHOLD_PX;
      if (shouldClose) {
        setIsMoreOpen(false);
      }
      resetMoreSheetDrag();
    },
    [resetMoreSheetDrag],
  );

  React.useEffect(() => {
    if (!isMoreOpen) {
      resetMoreSheetDrag();
    }
  }, [isMoreOpen, resetMoreSheetDrag]);

  const effectiveQuickPaths = quickPaths.length > 0 ? quickPaths : DEFAULT_BOTTOM_BAR_PATHS;
  const primaryActions = effectiveQuickPaths
    .slice(0, 4)
    .map((entry) => ({ entry } satisfies BottomBarPrimaryAction));
  const moreActions = effectiveQuickPaths
    .slice(4)
    .map((entry) => ({ entry } satisfies BottomBarMoreAction));

  return (
    <>
      {isMoreOpen ? (
        <button
          type="button"
          onClick={() => setIsMoreOpen(false)}
          aria-label="Chiudi menu mobile"
          className="fixed inset-0 z-[165] bg-black/60 backdrop-blur-3xl"
        />
      ) : null}

      <div
        className={`fixed inset-x-0 bottom-0 z-[170] px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] transition-transform duration-200 ${
          isMoreOpen ? 'translate-y-0' : 'translate-y-0'
        }`}
      >
        <div className="relative mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_14px_42px_rgba(4,11,24,0.48)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_50%_-20%,rgba(255,255,255,0.2),rgba(255,255,255,0.02)_56%,rgba(4,10,20,0.2))]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/24 to-transparent" />
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
          <div className="relative grid grid-cols-5 gap-1.5 p-2">
            {primaryActions.map((action) => {
              const entry = action.entry;
              const Icon = PATH_ICONS[entry.icon] ?? LayoutGrid;
              const active = isEditMode
                ? selectedPathId === entry.id
                : isPathActiveForCurrentLocation(entry.path);
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    onPathClick(entry);
                  }}
                  className={`group flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2.5 transition-all ${
                    active
                      ? 'bg-[#3b82f6] text-white shadow-[0_8px_26px_rgba(37,99,235,0.46)]'
                      : 'text-white/62 hover:text-white hover:bg-white/8'
                  }`}
                  aria-label={`Apri ${entry.label}`}
                >
                  <Icon size={18} className={active ? '' : 'group-hover:scale-105 transition-transform'} />
                  <span className="max-w-full truncate text-[10px] leading-none tracking-[0.01em]">{entry.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsMoreOpen((current) => !current)}
              className={`relative group flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2.5 transition-all ${
                isMoreOpen
                  ? 'bg-[#3b82f6] text-white shadow-[0_8px_26px_rgba(37,99,235,0.46)]'
                  : 'text-white/62 hover:text-white hover:bg-white/8'
              }`}
              aria-label="Apri menu altro"
            >
              <MoreHorizontal size={18} className={isMoreOpen ? '' : 'group-hover:scale-105 transition-transform'} />
              <span className="max-w-full truncate text-[10px] leading-none tracking-[0.01em]">Altro</span>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-[175] px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] transition-all duration-220 ${
          isMoreOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="relative mx-auto flex max-h-[72dvh] max-w-xl flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.08] p-3 backdrop-blur-3xl shadow-[0_32px_90px_rgba(15,23,42,0.42)] transition-transform duration-220 ease-out"
          style={
            moreSheetDragOffset > 0
              ? { transform: `translateY(${moreSheetDragOffset}px)`, transitionDuration: '0ms' }
              : undefined
          }
        >
          <div
            className={`relative mb-2 flex flex-col items-center gap-2 pt-1 touch-none ${
              isMoreSheetDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onPointerDown={handleMoreSheetDragStart}
            onPointerMove={handleMoreSheetDragMove}
            onPointerUp={finishMoreSheetDrag}
            onPointerCancel={finishMoreSheetDrag}
          >
            <span className="h-1 w-11 rounded-full bg-white/28" />
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/62">Menu rapido</p>
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scrollbar [touch-action:pan-y] [-webkit-overflow-scrolling:touch] pr-1">
            <div className="grid grid-cols-1 gap-2">
              {moreActions.map((action) => {
                const entry = action.entry;
                const Icon = PATH_ICONS[entry.icon] ?? LayoutGrid;
                const active = isEditMode
                  ? selectedPathId === entry.id
                  : isPathActiveForCurrentLocation(entry.path);
                return (
                  <button
                    key={`sheet-${entry.id}`}
                    type="button"
                    onClick={() => {
                      onPathClick(entry);
                      setIsMoreOpen(false);
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                      active
                        ? 'border-blue-300/45 bg-blue-500/22 text-blue-100 shadow-[0_8px_20px_rgba(37,99,235,0.32)]'
                        : 'border-white/10 bg-white/5 text-white/78 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="truncate">{entry.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 pb-1">
              <button
                type="button"
                onClick={() => {
                  if (!canToggleEditMode) {
                    return;
                  }
                  onToggleEditMode();
                  setIsMoreOpen(false);
                }}
                disabled={!canToggleEditMode}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  canToggleEditMode
                    ? isEditMode
                      ? 'border-blue-300/45 bg-blue-500/22 text-blue-100 hover:bg-blue-500/28'
                      : 'border-white/12 bg-white/6 text-white/82 hover:bg-white/11'
                    : 'border-white/8 bg-white/4 text-white/35 cursor-not-allowed'
                }`}
                title={canToggleEditMode ? 'Attiva/disattiva modalita modifica' : 'Disponibile solo nelle view supportate'}
              >
                <PencilLine size={16} />
                {isEditMode ? 'Esci edit' : 'Modalita edit'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenProfile();
                  setIsMoreOpen(false);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-sm text-white/82 transition-colors hover:bg-white/11"
              >
                <User size={16} />
                Profilo
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
