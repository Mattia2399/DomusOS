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
  { id: 'bottom-dashboard', label: 'Dashboard', path: '/home', icon: 'home' },
  { id: 'bottom-rooms', label: 'Stanze', path: '/rooms', icon: 'rooms' },
  { id: 'bottom-security', label: 'Sicurezza', path: '/security', icon: 'security' },
  { id: 'bottom-consumi', label: 'Consumi', path: '/consumi', icon: 'chart' },
  { id: 'bottom-appgallery', label: 'App Gallery', path: '/appgallery', icon: 'dashboard' },
  { id: 'bottom-automations', label: 'Automazioni', path: '/automations', icon: 'automation' },
];

const XS_PRIMARY_PATH_CONFIG: Array<Pick<SidebarQuickPath, 'id' | 'label' | 'path' | 'icon'>> = [
  { id: 'bottom-dashboard', label: 'Dashboard', path: '/home', icon: 'home' },
  { id: 'bottom-rooms', label: 'Stanze', path: '/rooms', icon: 'rooms' },
  { id: 'bottom-security', label: 'Sicurezza', path: '/security', icon: 'security' },
  { id: 'bottom-consumi', label: 'Consumi', path: '/consumi', icon: 'chart' },
];

function normalizeBottomNavPath(path: string) {
  const trimmed = path.trim().toLowerCase();
  if (!trimmed) {
    return '/';
  }
  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
}

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
  const quickPathByNormalizedPath = new Map(
    effectiveQuickPaths.map((entry) => [normalizeBottomNavPath(entry.path), entry] as const),
  );
  const primaryPathSet = new Set(XS_PRIMARY_PATH_CONFIG.map((entry) => normalizeBottomNavPath(entry.path)));

  const primaryActions = XS_PRIMARY_PATH_CONFIG.map((configEntry) => {
    const matchedEntry = quickPathByNormalizedPath.get(normalizeBottomNavPath(configEntry.path));
    const entry: SidebarQuickPath = matchedEntry
      ? {
          ...matchedEntry,
          label: configEntry.label,
          icon: configEntry.icon,
        }
      : {
          id: configEntry.id,
          label: configEntry.label,
          path: configEntry.path,
          icon: configEntry.icon,
        };
    return { entry } satisfies BottomBarPrimaryAction;
  });

  const moreActions = effectiveQuickPaths
    .filter((entry) => !primaryPathSet.has(normalizeBottomNavPath(entry.path)))
    .map((entry) => ({ entry } satisfies BottomBarMoreAction));
  const moreQuickActions = moreActions.slice(0, 3);
  const remainingMoreActions = moreActions.slice(3);

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

      <div className="fixed inset-x-0 bottom-0 z-[170] px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <div className="relative mx-auto max-w-xl">
          <div
            className={`absolute inset-x-0 bottom-full mb-2 transition-all duration-220 ${
              isMoreOpen ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0 pointer-events-none'
            }`}
          >
            <div
              className="liquid-glass-panel relative flex max-h-[72dvh] flex-col overflow-hidden rounded-t-[2.2rem] rounded-b-[1.4rem] transition-transform duration-220 ease-out"
              style={
                moreSheetDragOffset > 0
                  ? { transform: `translateY(${moreSheetDragOffset}px)`, transitionDuration: '0ms' }
                  : undefined
              }
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(140%_130%_at_50%_0%,rgba(255,255,255,0.16),rgba(255,255,255,0.02)_52%,rgba(4,10,20,0.18))]" />
              <div
                className={`relative mb-2 flex flex-col items-center gap-2 pt-2 touch-none ${
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

              <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scrollbar [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-3 pb-3 pr-2">
                <div className="liquid-glass-card px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-white/86">
                      <PencilLine size={15} />
                      <span className="text-sm">Modalita edit</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEditMode}
                      disabled={!canToggleEditMode}
                      onClick={() => {
                        if (!canToggleEditMode) {
                          return;
                        }
                        onToggleEditMode();
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all ${
                        !canToggleEditMode
                          ? 'cursor-not-allowed border-white/12 bg-white/8 opacity-55'
                          : isEditMode
                            ? 'border-blue-300/55 bg-blue-500/45'
                            : 'border-white/16 bg-white/12'
                      }`}
                      title={canToggleEditMode ? 'Attiva/disattiva modalita modifica' : 'Disponibile solo nelle view supportate'}
                    >
                      <span
                        className={`h-4 w-4 rounded-full bg-white shadow-[0_2px_8px_rgba(3,8,20,0.45)] transition-transform ${
                          isEditMode ? 'translate-x-[22px]' : 'translate-x-[3px]'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                    {moreQuickActions.map((action) => {
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
                          className={`group flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition-all ${
                            active
                              ? 'border-blue-300/45 bg-blue-500/22 text-blue-100 shadow-[0_8px_20px_rgba(37,99,235,0.32)]'
                              : 'liquid-glass-card text-white/78 hover:bg-white/[0.08]'
                          }`}
                        >
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                              active ? 'bg-white/16' : 'bg-transparent group-hover:bg-white/10'
                            }`}
                          >
                            <Icon size={active ? 18 : 17} className={active ? '' : 'group-hover:scale-105 transition-transform'} />
                          </span>
                          <span className={`w-full truncate text-[11px] leading-none tracking-[0.01em] ${active ? 'font-semibold' : 'font-medium'}`}>
                            {entry.label}
                          </span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        onOpenProfile();
                        setIsMoreOpen(false);
                      }}
                      className="liquid-glass-card group flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-white/78 transition-all hover:bg-white/[0.08]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent transition-all group-hover:bg-white/10">
                        <User size={17} className="group-hover:scale-105 transition-transform" />
                      </span>
                      <span className="w-full truncate text-[11px] font-medium leading-none tracking-[0.01em]">Profilo</span>
                    </button>
                </div>

                {remainingMoreActions.length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {remainingMoreActions.map((action) => {
                      const entry = action.entry;
                      const Icon = PATH_ICONS[entry.icon] ?? LayoutGrid;
                      const active = isEditMode
                        ? selectedPathId === entry.id
                        : isPathActiveForCurrentLocation(entry.path);
                      return (
                        <button
                          key={`sheet-more-${entry.id}`}
                          type="button"
                          onClick={() => {
                            onPathClick(entry);
                            setIsMoreOpen(false);
                          }}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                            active
                              ? 'border-blue-300/45 bg-blue-500/22 text-blue-100 shadow-[0_8px_20px_rgba(37,99,235,0.32)]'
                              : 'liquid-glass-card text-white/78 hover:bg-white/[0.08]'
                          }`}
                        >
                          <Icon size={16} />
                          <span className="truncate">{entry.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div className="pb-1" />
              </div>
            </div>
          </div>

          <div className="liquid-glass-panel relative overflow-hidden rounded-[1.35rem]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.26),rgba(255,255,255,0.1)_22%,rgba(255,255,255,0.03)_58%,rgba(8,16,30,0.14))]" />
          <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <div className="pointer-events-none absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />
          <div className="relative grid grid-cols-5 gap-1 p-1.5">
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
                  className={`group relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[0.85rem] px-1 py-1.5 transition-all ${
                    active
                      ? 'text-white'
                      : 'text-white/62 hover:text-white/90 hover:bg-white/[0.06]'
                  }`}
                  aria-label={`Apri ${entry.label}`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all ${
                      active ? 'bg-transparent' : 'bg-transparent group-hover:bg-white/10'
                    }`}
                  >
                    <Icon
                      size={16}
                      strokeWidth={active ? 1.85 : 2}
                      fill={active ? 'currentColor' : 'none'}
                      className={active ? '' : 'group-hover:scale-105 transition-transform'}
                    />
                  </span>
                  <span className={`max-w-full truncate text-[9.5px] leading-none tracking-[0.01em] ${active ? 'font-semibold' : 'font-medium'}`}>
                    {entry.label}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsMoreOpen((current) => !current)}
              className={`group relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[0.85rem] px-1 py-1.5 transition-all ${
                isMoreOpen
                  ? 'text-white'
                  : 'text-white/62 hover:text-white/90 hover:bg-white/[0.06]'
              }`}
              aria-label="Apri menu altro"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all ${
                  isMoreOpen ? 'bg-transparent' : 'bg-transparent group-hover:bg-white/10'
                }`}
              >
                <MoreHorizontal
                  size={16}
                  strokeWidth={isMoreOpen ? 1.85 : 2}
                  fill={isMoreOpen ? 'currentColor' : 'none'}
                  className={isMoreOpen ? '' : 'group-hover:scale-105 transition-transform'}
                />
              </span>
              <span className={`max-w-full truncate text-[9.5px] leading-none tracking-[0.01em] ${isMoreOpen ? 'font-semibold' : 'font-medium'}`}>
                Altro
              </span>
            </button>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
