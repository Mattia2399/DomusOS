import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Responsive, WidthProvider, type ResponsiveLayouts } from 'react-grid-layout/legacy';
import { LayoutGrid, Plus, X } from 'lucide-react';
import { SectionCardRenderer, WidgetCardRenderer } from '../widgets/CardRenderer';
import { SCENES_CATALOG } from '../widgets/ScenesCard';
import {
  GRID_ENGINE_BREAKPOINTS,
  GRID_ENGINE_COLS,
  GRID_ENGINE_GAP_PX,
  GRID_ENGINE_ROW_UNIT_PX,
} from './DashboardGrid';
import { StackGrid } from './StackGrid';
import type { DashboardStateShape } from '../../hooks/useDashboardState';
import type { MockEntityStateMap } from '../../types/ha';
import type {
  DashboardSection,
  GridItem,
  SceneRunState,
  SectionKind,
  Widget,
  WidgetKind,
  SceneKey,
} from '../../types/dashboardModels';
import { ROOT_CANVAS_COLS, ROOT_CANVAS_ROW_UNITS, SECTION_CATALOG, WIDGET_CATALOG } from '../../types/dashboardModels';
import {
  ALARM_WIDGET_SPAN_BY_BREAKPOINT,
  CAMERA_WIDGET_SPAN_BY_BREAKPOINT,
  CLIMATE_WIDGET_SPAN_BY_BREAKPOINT,
  COVER_WIDGET_SPAN_BY_BREAKPOINT,
  LIGHT_WIDGET_SPAN_BY_BREAKPOINT,
  LOCK_WIDGET_SPAN_BY_BREAKPOINT,
  MEMBERS_WIDGET_SPAN_BY_BREAKPOINT,
  MEDIA_WIDGET_SPAN_BY_BREAKPOINT,
  SENSOR_WIDGET_SPAN_BY_BREAKPOINT,
  VACUUM_WIDGET_SPAN_BY_BREAKPOINT,
} from './dashboardBreakpointConfig';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);
type GridBreakpoint = keyof typeof GRID_ENGINE_BREAKPOINTS;
type GridLayouts = Partial<Record<GridBreakpoint, GridItem[]>>;
type HouseMemberCardItem = {
  id: string;
  name: string;
  avatarUrl?: string;
  roleLabel?: string;
  isCurrent?: boolean;
};

type GridCanvasProps = {
  isEditMode: boolean;
  developerMode: boolean;
  isXsViewport: boolean;
  topRightOverlay?: React.ReactNode;
  state: DashboardStateShape;
  sections: DashboardSection[];
  widgets: Widget[];
  runningSceneBySectionId: Partial<Record<string, SceneRunState>>;
  selectedWidgetId: string | null;
  selectedSectionId: string | null;
  isCatalogOpen: boolean;
  onOpenCatalog: () => void;
  onCloseCatalog: () => void;
  onSelectWidget: (id: string | null) => void;
  onSelectSection: (id: string | null) => void;
  onWeatherClick: () => void;
  onSceneTrigger: (section: DashboardSection, sceneId: SceneKey) => void | Promise<void>;
  onWidgetClick: (widget: Widget) => void;
  onWidgetLightToggle: (widget: Widget) => void;
  onWidgetBrightnessChange: (widget: Widget, value: number) => void;
  onWidgetClimateTargetTempChange: (widget: Widget, value: number) => void;
  onWidgetClimateTargetRangeChange: (widget: Widget, low: number, high: number) => void;
  onWidgetClimateModeChange: (widget: Widget, mode: string) => void;
  onWidgetClimateFanModeChange: (widget: Widget, mode: string) => void;
  onWidgetMediaToggle: (widget: Widget) => void;
  onWidgetMediaPrevious: (widget: Widget) => void;
  onWidgetMediaNext: (widget: Widget) => void;
  onWidgetMediaSeek: (widget: Widget, position: number) => void;
  onWidgetAlarmDisarm: (widget: Widget) => void;
  onWidgetAlarmArm: (widget: Widget, mode: 'home' | 'away' | 'night' | 'vacation' | 'custom_bypass') => void;
  onWidgetVacuumStartPause: (widget: Widget) => void;
  onWidgetVacuumReturnToBase: (widget: Widget) => void;
  onWidgetLockToggle: (widget: Widget) => void;
  onWidgetLockOpen: (widget: Widget) => void;
  onOpenMembersPanel: () => void;
  onWidgetLayoutChange: (sectionId: string, next: GridItem[]) => void;
  onSectionsLayoutChange: (next: GridItem[]) => void;
  onAddWidget: (kind: WidgetKind) => void;
  onAddSection: (kind: SectionKind) => void;
  onRemoveSection: (id: string) => void;
  onUpdateSection: (id: string, updater: (section: DashboardSection) => DashboardSection) => void;
  haConnected: boolean;
  haStates: MockEntityStateMap;
  sensorHistoryByEntity?: Record<string, number[]>;
  houseMembers?: HouseMemberCardItem[];
};

const SECTION_LABELS: Record<SectionKind, string> = {
  greeting: 'Titolo',
  weather: 'Meteo',
  scenes: 'Scenes',
  'stack-vertical': 'Vertical Stack',
  'stack-horizontal': 'Horizontal Stack',
  'stack-grid': 'Grid Stack',
};
const WIDGET_GROUP_SECTION_KINDS: SectionKind[] = ['greeting', 'weather', 'scenes'];
const GRID_ENGINE_2XL_COLS = GRID_ENGINE_COLS['2xl'];
const GRID_ENGINE_XL_COLS = GRID_ENGINE_COLS.xl;
const GRID_ENGINE_XS_COLS = GRID_ENGINE_COLS.xs;
const GRID_ENGINE_SM_COLS = GRID_ENGINE_COLS.sm;
const GRID_ENGINE_MD_COLS = GRID_ENGINE_COLS.md;
const GRID_ENGINE_LG_COLS = GRID_ENGINE_COLS.lg;
const GRID_ENGINE_CANONICAL_BREAKPOINT: GridBreakpoint = 'xl';
const GRID_ENGINE_CANONICAL_COLS = GRID_ENGINE_XL_COLS;
const GRID_ENGINE_ROW_UNIT = GRID_ENGINE_ROW_UNIT_PX;
const GRID_ENGINE_BREAKPOINT_ORDER: GridBreakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
const RUNTIME_GRID_WIDTH_JITTER_PX = 2;
const GRID_ENGINE_CONTAINER_PADDING: Record<GridBreakpoint, [number, number]> = {
  '2xl': [24, 14],
  xl: [24, 14],
  lg: [20, 12],
  md: [14, 10],
  sm: [10, 8],
  xs: [2, 8],
};
const XS_CONTEXT_OPEN_LONG_PRESS_MS = 420;
const XS_CONTEXT_OPEN_MOVE_TOLERANCE_PX = 14;

function getViewportWidth() {
  if (typeof window === 'undefined') {
    return GRID_ENGINE_BREAKPOINTS.xl;
  }
  return Math.max(0, Math.round(window.innerWidth));
}

function resolveActiveBreakpoint(viewportWidth: number): GridBreakpoint {
  if (viewportWidth >= GRID_ENGINE_BREAKPOINTS['2xl']) {
    return '2xl';
  }
  if (viewportWidth >= GRID_ENGINE_BREAKPOINTS.xl) {
    return 'xl';
  }
  if (viewportWidth >= GRID_ENGINE_BREAKPOINTS.lg) {
    return 'lg';
  }
  if (viewportWidth >= GRID_ENGINE_BREAKPOINTS.md) {
    return 'md';
  }
  return viewportWidth >= GRID_ENGINE_BREAKPOINTS.sm ? 'sm' : 'xs';
}

function normalizeRuntimeLayout(next: readonly GridItem[], cols: number): GridItem[] {
  const safeCols = Math.max(1, Math.round(cols));
  return next.map((item) => {
    const safeW = Math.min(safeCols, Math.max(1, Math.round(item.w)));
    return {
      i: item.i,
      x: Math.min(Math.max(0, Math.round(item.x)), Math.max(0, safeCols - safeW)),
      y: Math.max(0, Math.round(item.y)),
      w: safeW,
      h: Math.max(1, Math.round(item.h)),
    };
  });
}

function toGridLayouts(layouts: ResponsiveLayouts<GridBreakpoint>): GridLayouts {
  const next: GridLayouts = {};
  GRID_ENGINE_BREAKPOINT_ORDER.forEach((breakpoint) => {
    const source = layouts[breakpoint] ?? [];
    next[breakpoint] = normalizeRuntimeLayout(source as GridItem[], GRID_ENGINE_COLS[breakpoint]);
  });
  return next;
}

function sameGridLayout(a: readonly GridItem[] | undefined, b: readonly GridItem[] | undefined) {
  const first = a ?? [];
  const second = b ?? [];
  if (first === second) {
    return true;
  }
  if (first.length !== second.length) {
    return false;
  }
  const secondById = new Map(second.map((item) => [item.i, item]));
  return first.every((item) => {
    const match = secondById.get(item.i);
    if (!match) {
      return false;
    }
    return (
      item.x === match.x &&
      item.y === match.y &&
      item.w === match.w &&
      item.h === match.h
    );
  });
}

function sameGridLayouts(a: GridLayouts, b: GridLayouts) {
  return GRID_ENGINE_BREAKPOINT_ORDER.every((breakpoint) => sameGridLayout(a[breakpoint], b[breakpoint]));
}

function normalizeGridItems(next: readonly GridItem[]): GridItem[] {
  return next.map((item) => ({
    i: item.i,
    x: Math.max(0, Math.round(item.x)),
    y: Math.max(0, Math.round(item.y)),
    w: Math.max(1, Math.round(item.w)),
    h: Math.max(1, Math.round(item.h)),
  }));
}

function scaleLayoutColumns(item: GridItem, sourceCols: number, targetCols: number): GridItem {
  const safeSourceCols = Math.max(1, sourceCols);
  const safeTargetCols = Math.max(1, targetCols);
  const normalizedY = Math.max(0, Math.round(item.y));
  const normalizedH = Math.max(1, Math.round(item.h));
  const normalizedW = Math.max(1, Math.round(item.w));
  const normalizedX = Math.max(0, Math.round(item.x));

  if (safeSourceCols === safeTargetCols) {
    const safeSameW = Math.min(safeTargetCols, normalizedW);
    const sameMaxX = Math.max(0, safeTargetCols - safeSameW);
    return {
      i: item.i,
      x: Math.min(normalizedX, sameMaxX),
      y: normalizedY,
      w: safeSameW,
      h: normalizedH,
    };
  }

  const sourceSafeW = Math.min(safeSourceCols, normalizedW);
  const sourceMaxX = Math.max(0, safeSourceCols - sourceSafeW);
  const sourceSafeX = Math.min(normalizedX, sourceMaxX);
  const sourceLeft = sourceSafeX / safeSourceCols;
  const sourceRight = (sourceSafeX + sourceSafeW) / safeSourceCols;
  let safeX = Math.floor(sourceLeft * safeTargetCols);
  let safeRight = Math.ceil(sourceRight * safeTargetCols);
  safeX = Math.min(Math.max(0, safeX), Math.max(0, safeTargetCols - 1));
  safeRight = Math.max(safeX + 1, Math.min(safeTargetCols, safeRight));
  const safeW = Math.max(1, safeRight - safeX);
  const maxX = Math.max(0, safeTargetCols - safeW);
  safeX = Math.min(safeX, maxX);
  return {
    i: item.i,
    x: safeX,
    y: normalizedY,
    w: safeW,
    h: normalizedH,
  };
}

function intersects(first: Pick<GridItem, 'x' | 'y' | 'w' | 'h'>, second: Pick<GridItem, 'x' | 'y' | 'w' | 'h'>) {
  return (
    first.x < second.x + second.w &&
    first.x + first.w > second.x &&
    first.y < second.y + second.h &&
    first.y + first.h > second.y
  );
}

function sortByTopLeft(layouts: GridItem[]) {
  return [...layouts].sort((first, second) => {
    const firstY = Math.max(0, Math.round(first.y));
    const secondY = Math.max(0, Math.round(second.y));
    if (firstY !== secondY) {
      return firstY - secondY;
    }
    const firstX = Math.max(0, Math.round(first.x));
    const secondX = Math.max(0, Math.round(second.x));
    if (firstX !== secondX) {
      return firstX - secondX;
    }
    return first.i.localeCompare(second.i, 'it-IT');
  });
}

function compactLayoutUp(layouts: GridItem[], cols: number): GridItem[] {
  const safeCols = Math.max(1, Math.round(cols));
  const placed: GridItem[] = [];
  const ordered = sortByTopLeft(layouts);

  ordered.forEach((item) => {
    const safeW = Math.min(safeCols, Math.max(1, Math.round(item.w)));
    const safeH = Math.max(1, Math.round(item.h));
    const safeX = Math.min(Math.max(0, Math.round(item.x)), Math.max(0, safeCols - safeW));
    let safeY = Math.max(0, Math.round(item.y));

    while (safeY > 0) {
      const candidate = { x: safeX, y: safeY - 1, w: safeW, h: safeH };
      if (placed.some((existing) => intersects(candidate, existing))) {
        break;
      }
      safeY -= 1;
    }

    placed.push({
      i: item.i,
      x: safeX,
      y: safeY,
      w: safeW,
      h: safeH,
    });
  });

  return placed;
}

function isSmallOneByOne(item: GridItem) {
  return Math.max(1, Math.round(item.w)) === 1 && Math.max(1, Math.round(item.h)) === 1;
}

function enforceLightWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridBreakpoint,
  cols: number,
  lightWidgetStateById: ReadonlyMap<string, boolean>,
): GridItem[] {
  if (lightWidgetStateById.size === 0) {
    return normalizeRuntimeLayout(layouts, cols);
  }
  const span = LIGHT_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  const safeCols = Math.max(1, Math.round(cols));
  const forcedW = Math.min(safeCols, Math.max(1, Math.round(span.w)));
  return normalizeRuntimeLayout(
    layouts.map((item) => {
      const lightIsOn = lightWidgetStateById.get(item.i);
      if (lightIsOn === undefined) {
        return item;
      }
      const forcedH = Math.max(1, Math.round(lightIsOn ? span.hOn : span.hOff));
      return {
        ...item,
        w: forcedW,
        h: forcedH,
      };
    }),
    safeCols,
  );
}

function enforceClimateWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridBreakpoint,
  cols: number,
  climateWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (climateWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts, cols);
  }
  const span = CLIMATE_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  const safeCols = Math.max(1, Math.round(cols));
  const forcedW = Math.min(safeCols, Math.max(1, Math.round(span.w)));
  const forcedH = Math.max(1, Math.round(span.h));
  return normalizeRuntimeLayout(
    layouts.map((item) => {
      if (!climateWidgetIds.has(item.i)) {
        return item;
      }
      return {
        ...item,
        w: forcedW,
        h: forcedH,
      };
    }),
    safeCols,
  );
}

function enforceCameraWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridBreakpoint,
  cols: number,
  cameraWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (cameraWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts, cols);
  }
  const span = CAMERA_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  const safeCols = Math.max(1, Math.round(cols));
  const forcedW = Math.min(safeCols, Math.max(1, Math.round(span.w)));
  const forcedH = Math.max(1, Math.round(span.h));
  return normalizeRuntimeLayout(
    layouts.map((item) => {
      if (!cameraWidgetIds.has(item.i)) {
        return item;
      }
      return {
        ...item,
        w: forcedW,
        h: forcedH,
      };
    }),
    safeCols,
  );
}

function enforceMediaWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridBreakpoint,
  cols: number,
  mediaWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (mediaWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts, cols);
  }
  const span = MEDIA_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  const safeCols = Math.max(1, Math.round(cols));
  const forcedW = Math.min(safeCols, Math.max(1, Math.round(span.w)));
  const forcedH = Math.max(1, Math.round(span.h));
  return normalizeRuntimeLayout(
    layouts.map((item) => {
      if (!mediaWidgetIds.has(item.i)) {
        return item;
      }
      return {
        ...item,
        w: forcedW,
        h: forcedH,
      };
    }),
    safeCols,
  );
}

function enforceSensorWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridBreakpoint,
  cols: number,
  sensorWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (sensorWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts, cols);
  }
  const span = SENSOR_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  const safeCols = Math.max(1, Math.round(cols));
  const forcedW = Math.min(safeCols, Math.max(1, Math.round(span.w)));
  const forcedH = Math.max(1, Math.round(span.h));
  return normalizeRuntimeLayout(
    layouts.map((item) => {
      if (!sensorWidgetIds.has(item.i)) {
        return item;
      }
      return {
        ...item,
        w: forcedW,
        h: forcedH,
      };
    }),
    safeCols,
  );
}

function enforceMembersWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridBreakpoint,
  cols: number,
  membersWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (membersWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts, cols);
  }
  const span = MEMBERS_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  const safeCols = Math.max(1, Math.round(cols));
  const forcedW = Math.min(safeCols, Math.max(1, Math.round(span.w)));
  const forcedH = Math.max(1, Math.round(span.h));
  return normalizeRuntimeLayout(
    layouts.map((item) => {
      if (!membersWidgetIds.has(item.i)) {
        return item;
      }
      return {
        ...item,
        w: forcedW,
        h: forcedH,
      };
    }),
    safeCols,
  );
}

function enforceAlarmWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridBreakpoint,
  cols: number,
  alarmWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (alarmWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts, cols);
  }
  const span = ALARM_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  const safeCols = Math.max(1, Math.round(cols));
  const forcedW = Math.min(safeCols, Math.max(1, Math.round(span.w)));
  const forcedH = Math.max(1, Math.round(span.h));
  return normalizeRuntimeLayout(
    layouts.map((item) => {
      if (!alarmWidgetIds.has(item.i)) {
        return item;
      }
      return {
        ...item,
        w: forcedW,
        h: forcedH,
      };
    }),
    safeCols,
  );
}

function enforceLockWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridBreakpoint,
  cols: number,
  lockWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (lockWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts, cols);
  }
  const span = LOCK_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  const safeCols = Math.max(1, Math.round(cols));
  const forcedW = Math.min(safeCols, Math.max(1, Math.round(span.w)));
  const forcedH = Math.max(1, Math.round(span.h));
  return normalizeRuntimeLayout(
    layouts.map((item) => {
      if (!lockWidgetIds.has(item.i)) {
        return item;
      }
      return {
        ...item,
        w: forcedW,
        h: forcedH,
      };
    }),
    safeCols,
  );
}

function enforceVacuumWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridBreakpoint,
  cols: number,
  vacuumWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (vacuumWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts, cols);
  }
  const span = VACUUM_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  const safeCols = Math.max(1, Math.round(cols));
  const forcedW = Math.min(safeCols, Math.max(1, Math.round(span.w)));
  const forcedH = Math.max(1, Math.round(span.h));
  return normalizeRuntimeLayout(
    layouts.map((item) => {
      if (!vacuumWidgetIds.has(item.i)) {
        return item;
      }
      return {
        ...item,
        w: forcedW,
        h: forcedH,
      };
    }),
    safeCols,
  );
}

function enforceCoverWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridBreakpoint,
  cols: number,
  coverWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (coverWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts, cols);
  }
  const span = COVER_WIDGET_SPAN_BY_BREAKPOINT[breakpoint];
  const safeCols = Math.max(1, Math.round(cols));
  const forcedW = Math.min(safeCols, Math.max(1, Math.round(span.w)));
  const forcedH = Math.max(1, Math.round(span.h));
  return normalizeRuntimeLayout(
    layouts.map((item) => {
      if (!coverWidgetIds.has(item.i)) {
        return item;
      }
      return {
        ...item,
        w: forcedW,
        h: forcedH,
      };
    }),
    safeCols,
  );
}

function enforceRootWidgetSpans(
  layouts: GridItem[],
  breakpoint: GridBreakpoint,
  cols: number,
  lightWidgetStateById: ReadonlyMap<string, boolean>,
  climateWidgetIds: ReadonlySet<string>,
  cameraWidgetIds: ReadonlySet<string>,
  mediaWidgetIds: ReadonlySet<string>,
  sensorWidgetIds: ReadonlySet<string>,
  membersWidgetIds: ReadonlySet<string>,
  alarmWidgetIds: ReadonlySet<string>,
  lockWidgetIds: ReadonlySet<string>,
  vacuumWidgetIds: ReadonlySet<string>,
  coverWidgetIds: ReadonlySet<string>,
): GridItem[] {
  const withLight = enforceLightWidgetSpan(layouts, breakpoint, cols, lightWidgetStateById);
  const withClimate = enforceClimateWidgetSpan(withLight, breakpoint, cols, climateWidgetIds);
  const withCamera = enforceCameraWidgetSpan(withClimate, breakpoint, cols, cameraWidgetIds);
  const withMedia = enforceMediaWidgetSpan(withCamera, breakpoint, cols, mediaWidgetIds);
  const withSensor = enforceSensorWidgetSpan(withMedia, breakpoint, cols, sensorWidgetIds);
  const withMembers = enforceMembersWidgetSpan(withSensor, breakpoint, cols, membersWidgetIds);
  const withAlarm = enforceAlarmWidgetSpan(withMembers, breakpoint, cols, alarmWidgetIds);
  const withLock = enforceLockWidgetSpan(withAlarm, breakpoint, cols, lockWidgetIds);
  const withVacuum = enforceVacuumWidgetSpan(withLock, breakpoint, cols, vacuumWidgetIds);
  return enforceCoverWidgetSpan(withVacuum, breakpoint, cols, coverWidgetIds);
}

function adaptToMobileColumns(
  layouts: GridItem[],
  sourceCols: number,
  targetCols: number,
  smallOneByOneIds?: ReadonlySet<string>,
): GridItem[] {
  const safeCols = Math.max(1, Math.round(targetCols));
  const halfSpan = Math.max(1, Math.floor(safeCols / 2));
  const ordered = sortByTopLeft(layouts.map((item) => scaleLayoutColumns(item, sourceCols, safeCols)));
  const placed: GridItem[] = [];

  ordered.forEach((source) => {
    const safeH = Math.max(1, Math.round(source.h));
    const isSmallItem = smallOneByOneIds ? smallOneByOneIds.has(source.i) : isSmallOneByOne(source);
    const safeW = isSmallItem ? Math.min(safeCols, halfSpan) : safeCols;
    const preferredX =
      safeW === safeCols
        ? 0
        : source.x + source.w / 2 >= safeCols / 2
          ? Math.max(0, safeCols - safeW)
          : 0;
    const fallbackXs: number[] = [];
    for (let x = 0; x <= safeCols - safeW; x += 1) {
      if (x !== preferredX) {
        fallbackXs.push(x);
      }
    }
    const candidateXs = [preferredX, ...fallbackXs];
    let safeY = Math.max(0, Math.round(source.y));
    let placedItem: GridItem | null = null;

    while (!placedItem) {
      const availableX = candidateXs.find((candidateX) => {
        const candidate = { x: candidateX, y: safeY, w: safeW, h: safeH };
        return !placed.some((existing) => intersects(candidate, existing));
      });
      if (availableX !== undefined) {
        placedItem = {
          i: source.i,
          x: availableX,
          y: safeY,
          w: safeW,
          h: safeH,
        };
        break;
      }
      safeY += 1;
    }

    placed.push(placedItem);
  });

  return compactLayoutUp(placed, safeCols);
}

function buildResponsiveLayoutsFromDesktop(
  desktopLayout: GridItem[],
  lightWidgetStateById: ReadonlyMap<string, boolean>,
  climateWidgetIds: ReadonlySet<string>,
  cameraWidgetIds: ReadonlySet<string>,
  mediaWidgetIds: ReadonlySet<string>,
  sensorWidgetIds: ReadonlySet<string>,
  membersWidgetIds: ReadonlySet<string>,
  alarmWidgetIds: ReadonlySet<string>,
  lockWidgetIds: ReadonlySet<string>,
  vacuumWidgetIds: ReadonlySet<string>,
  coverWidgetIds: ReadonlySet<string>,
): GridLayouts {
  const xl = compactLayoutUp(
    enforceRootWidgetSpans(
      normalizeRuntimeLayout(desktopLayout, GRID_ENGINE_XL_COLS),
      'xl',
      GRID_ENGINE_XL_COLS,
      lightWidgetStateById,
      climateWidgetIds,
      cameraWidgetIds,
      mediaWidgetIds,
      sensorWidgetIds,
      membersWidgetIds,
      alarmWidgetIds,
      lockWidgetIds,
      vacuumWidgetIds,
      coverWidgetIds,
    ),
    GRID_ENGINE_XL_COLS,
  );
  const twoXl = compactLayoutUp(
    enforceRootWidgetSpans(
      xl.map((item) => scaleLayoutColumns(item, GRID_ENGINE_XL_COLS, GRID_ENGINE_2XL_COLS)),
      '2xl',
      GRID_ENGINE_2XL_COLS,
      lightWidgetStateById,
      climateWidgetIds,
      cameraWidgetIds,
      mediaWidgetIds,
      sensorWidgetIds,
      membersWidgetIds,
      alarmWidgetIds,
      lockWidgetIds,
      vacuumWidgetIds,
      coverWidgetIds,
    ),
    GRID_ENGINE_2XL_COLS,
  );
  const lg = compactLayoutUp(
    enforceRootWidgetSpans(
      xl.map((item) => scaleLayoutColumns(item, GRID_ENGINE_XL_COLS, GRID_ENGINE_LG_COLS)),
      'lg',
      GRID_ENGINE_LG_COLS,
      lightWidgetStateById,
      climateWidgetIds,
      cameraWidgetIds,
      mediaWidgetIds,
      sensorWidgetIds,
      membersWidgetIds,
      alarmWidgetIds,
      lockWidgetIds,
      vacuumWidgetIds,
      coverWidgetIds,
    ),
    GRID_ENGINE_LG_COLS,
  );
  const smallOneByOneIds = new Set(
    xl.filter((item) => isSmallOneByOne(item)).map((item) => item.i),
  );
  const md = compactLayoutUp(
    enforceRootWidgetSpans(
      lg.map((item) => scaleLayoutColumns(item, GRID_ENGINE_LG_COLS, GRID_ENGINE_MD_COLS)),
      'md',
      GRID_ENGINE_MD_COLS,
      lightWidgetStateById,
      climateWidgetIds,
      cameraWidgetIds,
      mediaWidgetIds,
      sensorWidgetIds,
      membersWidgetIds,
      alarmWidgetIds,
      lockWidgetIds,
      vacuumWidgetIds,
      coverWidgetIds,
    ),
    GRID_ENGINE_MD_COLS,
  );
  const sm = compactLayoutUp(
    enforceRootWidgetSpans(
      adaptToMobileColumns(lg, GRID_ENGINE_LG_COLS, GRID_ENGINE_SM_COLS, smallOneByOneIds),
      'sm',
      GRID_ENGINE_SM_COLS,
      lightWidgetStateById,
      climateWidgetIds,
      cameraWidgetIds,
      mediaWidgetIds,
      sensorWidgetIds,
      membersWidgetIds,
      alarmWidgetIds,
      lockWidgetIds,
      vacuumWidgetIds,
      coverWidgetIds,
    ),
    GRID_ENGINE_SM_COLS,
  );
  const xs = compactLayoutUp(
    enforceRootWidgetSpans(
      adaptToMobileColumns(sm, GRID_ENGINE_SM_COLS, GRID_ENGINE_XS_COLS, smallOneByOneIds),
      'xs',
      GRID_ENGINE_XS_COLS,
      lightWidgetStateById,
      climateWidgetIds,
      cameraWidgetIds,
      mediaWidgetIds,
      sensorWidgetIds,
      membersWidgetIds,
      alarmWidgetIds,
      lockWidgetIds,
      vacuumWidgetIds,
      coverWidgetIds,
    ),
    GRID_ENGINE_XS_COLS,
  );
  return { '2xl': twoXl, xl, lg, md, sm, xs };
}

export function GridCanvas({
  isEditMode,
  developerMode,
  isXsViewport,
  topRightOverlay,
  state,
  sections,
  widgets,
  runningSceneBySectionId,
  selectedWidgetId,
  selectedSectionId,
  isCatalogOpen,
  onOpenCatalog,
  onCloseCatalog,
  onSelectWidget,
  onSelectSection,
  onWeatherClick,
  onSceneTrigger,
  onWidgetClick,
  onWidgetLightToggle,
  onWidgetBrightnessChange,
  onWidgetClimateTargetTempChange,
  onWidgetClimateTargetRangeChange,
  onWidgetClimateModeChange,
  onWidgetClimateFanModeChange,
  onWidgetMediaToggle,
  onWidgetMediaPrevious,
  onWidgetMediaNext,
  onWidgetMediaSeek,
  onWidgetAlarmDisarm,
  onWidgetAlarmArm,
  onWidgetVacuumStartPause,
  onWidgetVacuumReturnToBase,
  onWidgetLockToggle,
  onWidgetLockOpen,
  onOpenMembersPanel,
  onWidgetLayoutChange,
  onSectionsLayoutChange,
  onAddWidget,
  onAddSection,
  onUpdateSection,
  haConnected,
  haStates,
  sensorHistoryByEntity = {},
  houseMembers = [],
}: GridCanvasProps) {
  const isCanvasInteractingRef = useRef(false);
  const xsLongPressTimerRef = useRef<number | null>(null);
  const xsLongPressPointerIdRef = useRef<number | null>(null);
  const xsLongPressStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const xsLongPressTriggeredRef = useRef(false);
  const xsSuppressNextCardClickRef = useRef(false);
  const runtimeGridHostRef = useRef<HTMLDivElement | null>(null);
  const stableRuntimeGridWidthRef = useRef(0);
  const lastLiveGridEngineLayoutsRef = useRef<GridLayouts>({});
  const [runtimeGridWidth, setRuntimeGridWidth] = useState(0);
  const [gridEngineActiveBreakpoint, setGridEngineActiveBreakpoint] = useState<GridBreakpoint>(() =>
    resolveActiveBreakpoint(getViewportWidth()),
  );
  const [gridEngineLayouts, setGridEngineLayouts] = useState<GridLayouts>({});
  const clearXsLongPressTimer = useCallback(() => {
    if (xsLongPressTimerRef.current !== null) {
      window.clearTimeout(xsLongPressTimerRef.current);
      xsLongPressTimerRef.current = null;
    }
  }, []);
  const resetXsLongPressState = useCallback(() => {
    clearXsLongPressTimer();
    xsLongPressPointerIdRef.current = null;
    xsLongPressStartPointRef.current = null;
    xsLongPressTriggeredRef.current = false;
  }, [clearXsLongPressTimer]);
  const isXsLongPressMode = !isEditMode && isXsViewport;
  const handleXsLongPressStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, widget: Widget) => {
      if (!isXsLongPressMode) {
        return;
      }
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }
      xsLongPressTriggeredRef.current = false;
      xsSuppressNextCardClickRef.current = false;
      const targetNode = event.target as Element | null;
      if (targetNode?.closest('button,input,select,textarea,a,[contenteditable="true"]')) {
        return;
      }
      if (event.pointerType !== 'mouse') {
        event.preventDefault();
      }
      resetXsLongPressState();
      xsLongPressPointerIdRef.current = event.pointerId;
      xsLongPressStartPointRef.current = { x: event.clientX, y: event.clientY };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // no-op: pointer capture may fail on some browsers
      }
      xsLongPressTimerRef.current = window.setTimeout(() => {
        xsLongPressTriggeredRef.current = true;
        xsSuppressNextCardClickRef.current = true;
        onWidgetClick(widget);
      }, XS_CONTEXT_OPEN_LONG_PRESS_MS);
    },
    [isXsLongPressMode, onWidgetClick, resetXsLongPressState],
  );
  const handleXsLongPressMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (xsLongPressPointerIdRef.current !== event.pointerId) {
      return;
    }
    const start = xsLongPressStartPointRef.current;
    if (!start) {
      return;
    }
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance > XS_CONTEXT_OPEN_MOVE_TOLERANCE_PX) {
      resetXsLongPressState();
    }
  }, [resetXsLongPressState]);
  const handleXsLongPressEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (xsLongPressPointerIdRef.current !== event.pointerId) {
      return;
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // no-op: capture may already be released
    }
    resetXsLongPressState();
  }, [resetXsLongPressState]);
  useEffect(() => {
    return () => {
      resetXsLongPressState();
    };
  }, [resetXsLongPressState]);
  useEffect(() => {
    if (!isXsLongPressMode) {
      resetXsLongPressState();
    }
  }, [isXsLongPressMode, resetXsLongPressState]);
  useEffect(() => {
    const host = runtimeGridHostRef.current;
    if (!host) {
      return;
    }

    const applyWidth = () => {
      const next = Math.max(0, Math.round(host.getBoundingClientRect().width));
      const previous = stableRuntimeGridWidthRef.current;
      if (previous > 0 && Math.abs(next - previous) < RUNTIME_GRID_WIDTH_JITTER_PX) {
        return;
      }
      stableRuntimeGridWidthRef.current = next;
      setRuntimeGridWidth((current) => (current === next ? current : next));
    };

    let rafId = 0;
    const updateWidth = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        applyWidth();
      });
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
        }
        window.removeEventListener('resize', updateWidth);
      };
    }

    const observer = new ResizeObserver(() => {
      updateWidth();
    });
    observer.observe(host);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      observer.disconnect();
    };
  }, []);
  const isStackSection = (section: DashboardSection) =>
    section.kind === 'stack-vertical' || section.kind === 'stack-horizontal' || section.kind === 'stack-grid';
  const rootWidgets = useMemo(() => widgets.filter((widget) => !widget.parentSectionId), [widgets]);
  const rootLightWidgetStateById = useMemo(
    () =>
      new Map(
        rootWidgets
          .filter((widget) => widget.kind === 'light')
          .map((widget) => [widget.id, widget.isOn] as const),
      ),
    [rootWidgets],
  );
  const rootClimateWidgetIds = useMemo(
    () =>
      new Set(
        rootWidgets
          .filter((widget) => widget.kind === 'climate')
          .map((widget) => widget.id),
      ),
    [rootWidgets],
  );
  const rootCameraWidgetIds = useMemo(
    () =>
      new Set(
        rootWidgets
          .filter((widget) => widget.kind === 'camera')
          .map((widget) => widget.id),
      ),
    [rootWidgets],
  );
  const rootMediaWidgetIds = useMemo(
    () =>
      new Set(
        rootWidgets
          .filter((widget) => widget.kind === 'media')
          .map((widget) => widget.id),
      ),
    [rootWidgets],
  );
  const rootSensorWidgetIds = useMemo(
    () =>
      new Set(
        rootWidgets
          .filter((widget) => widget.kind === 'sensor')
          .map((widget) => widget.id),
      ),
    [rootWidgets],
  );
  const rootMembersWidgetIds = useMemo(
    () =>
      new Set(
        rootWidgets
          .filter((widget) => widget.kind === 'members')
          .map((widget) => widget.id),
      ),
    [rootWidgets],
  );
  const rootAlarmWidgetIds = useMemo(
    () =>
      new Set(
        rootWidgets
          .filter((widget) => widget.kind === 'alarm')
          .map((widget) => widget.id),
      ),
    [rootWidgets],
  );
  const rootLockWidgetIds = useMemo(
    () =>
      new Set(
        rootWidgets
          .filter((widget) => widget.kind === 'lock')
          .map((widget) => widget.id),
      ),
    [rootWidgets],
  );
  const rootVacuumWidgetIds = useMemo(
    () =>
      new Set(
        rootWidgets
          .filter((widget) => widget.kind === 'vacuum')
          .map((widget) => widget.id),
      ),
    [rootWidgets],
  );
  const rootCoverWidgetIds = useMemo(
    () =>
      new Set(
        rootWidgets
          .filter((widget) => widget.kind === 'cover')
          .map((widget) => widget.id),
      ),
    [rootWidgets],
  );
  const desktopLayout = useMemo<GridItem[]>(
    () =>
      normalizeGridItems([
        ...sections.map((section) => ({
          i: section.id,
          x: section.layout.x,
          y: section.layout.y,
          w: section.layout.w,
          h: section.layout.h,
        })),
        ...rootWidgets.map((widget) => ({
          i: widget.id,
          x: widget.layout.x,
          y: widget.layout.y,
          w: widget.layout.w,
          h: widget.layout.h,
        })),
      ]),
    [rootWidgets, sections],
  );
  const derivedGridEngineLayouts = useMemo(
    () =>
      buildResponsiveLayoutsFromDesktop(
        desktopLayout,
        rootLightWidgetStateById,
        rootClimateWidgetIds,
        rootCameraWidgetIds,
        rootMediaWidgetIds,
        rootSensorWidgetIds,
        rootMembersWidgetIds,
        rootAlarmWidgetIds,
        rootLockWidgetIds,
        rootVacuumWidgetIds,
        rootCoverWidgetIds,
      ),
    [
      desktopLayout,
      rootLightWidgetStateById,
      rootClimateWidgetIds,
      rootCameraWidgetIds,
      rootMediaWidgetIds,
      rootSensorWidgetIds,
      rootMembersWidgetIds,
      rootAlarmWidgetIds,
      rootLockWidgetIds,
      rootVacuumWidgetIds,
      rootCoverWidgetIds,
    ],
  );
  const gridEngineActiveCols = GRID_ENGINE_COLS[gridEngineActiveBreakpoint];
  const isTabletCanvas =
    gridEngineActiveBreakpoint === 'md' ||
    gridEngineActiveBreakpoint === 'sm' ||
    gridEngineActiveBreakpoint === 'xs';
  const runtimeGridEffectiveWidth = useMemo(
    () => Math.max(0, runtimeGridWidth),
    [runtimeGridWidth],
  );
  const gridEngineColumnWidth = useMemo(() => {
    const activePadding = GRID_ENGINE_CONTAINER_PADDING[gridEngineActiveBreakpoint] ?? [0, 0];
    const horizontalPadding = activePadding[0] * 2;
    const safeWidth = Math.max(runtimeGridEffectiveWidth - horizontalPadding, 1);
    const totalGap = GRID_ENGINE_GAP_PX * Math.max(0, gridEngineActiveCols - 1);
    return Math.max(1, (safeWidth - totalGap) / Math.max(1, gridEngineActiveCols));
  }, [gridEngineActiveBreakpoint, gridEngineActiveCols, runtimeGridEffectiveWidth]);
  useEffect(() => {
    if (isCanvasInteractingRef.current) {
      return;
    }
    setGridEngineLayouts((current) =>
      sameGridLayouts(current, derivedGridEngineLayouts) ? current : derivedGridEngineLayouts,
    );
  }, [derivedGridEngineLayouts]);
  const liveGridEngineLayouts = useMemo<GridLayouts>(() => {
    const merged: GridLayouts = {};
    GRID_ENGINE_BREAKPOINT_ORDER.forEach((breakpoint) => {
      const source = gridEngineLayouts[breakpoint] ?? derivedGridEngineLayouts[breakpoint] ?? [];
      merged[breakpoint] = normalizeRuntimeLayout(source, GRID_ENGINE_COLS[breakpoint]);
    });
    const previous = lastLiveGridEngineLayoutsRef.current;
    if (sameGridLayouts(previous, merged)) {
      return previous;
    }
    lastLiveGridEngineLayoutsRef.current = merged;
    return merged;
  }, [derivedGridEngineLayouts, gridEngineLayouts]);
  const liveGridEngineLayout = liveGridEngineLayouts[gridEngineActiveBreakpoint] ?? [];
  const liveGridUsedRows = useMemo(
    () =>
      liveGridEngineLayout.reduce(
        (maxRows, item) => Math.max(maxRows, Math.max(0, Math.round(item.y)) + Math.max(1, Math.round(item.h))),
        0,
      ),
    [liveGridEngineLayout],
  );
  const liveGridEngineLayoutMap = useMemo(
    () => new Map(liveGridEngineLayout.map((item) => [item.i, item])),
    [liveGridEngineLayout],
  );
  const layoutSections = useMemo(
    () => SECTION_CATALOG.filter((item) => !WIDGET_GROUP_SECTION_KINDS.includes(item.kind)),
    [],
  );
  const widgetGroupSections = useMemo(
    () => SECTION_CATALOG.filter((item) => WIDGET_GROUP_SECTION_KINDS.includes(item.kind)),
    [],
  );
  const sectionIdSet = useMemo(() => new Set(sections.map((section) => section.id)), [sections]);
  const rootWidgetIdSet = useMemo(() => new Set(rootWidgets.map((widget) => widget.id)), [rootWidgets]);
  const commitGridEngineLayouts = useCallback(
    (layouts: GridLayouts, activeLayout?: GridItem[]) => {
      const activeCols = GRID_ENGINE_COLS[gridEngineActiveBreakpoint];
      const activeAsCanonical = normalizeRuntimeLayout(activeLayout ?? [], activeCols).map((item) =>
        scaleLayoutColumns(item, activeCols, GRID_ENGINE_CANONICAL_COLS),
      );
      const desktop = layouts[GRID_ENGINE_CANONICAL_BREAKPOINT] ?? layouts['2xl'] ?? [];
      const source = activeAsCanonical.length > 0 ? activeAsCanonical : desktop;
      const normalizedDesktop = compactLayoutUp(
        enforceRootWidgetSpans(
          source,
          GRID_ENGINE_CANONICAL_BREAKPOINT,
          GRID_ENGINE_CANONICAL_COLS,
          rootLightWidgetStateById,
          rootClimateWidgetIds,
          rootCameraWidgetIds,
          rootMediaWidgetIds,
          rootSensorWidgetIds,
          rootMembersWidgetIds,
          rootAlarmWidgetIds,
          rootLockWidgetIds,
          rootVacuumWidgetIds,
          rootCoverWidgetIds,
        ),
        GRID_ENGINE_CANONICAL_COLS,
      );
      onSectionsLayoutChange(
        normalizedDesktop.map((item) =>
          scaleLayoutColumns(
            {
              i: item.i,
              x: Math.max(0, Math.round(item.x)),
              y: Math.max(0, Math.round(item.y)),
              w: Math.max(1, Math.round(item.w)),
              h: Math.max(1, Math.round(item.h)),
            },
            GRID_ENGINE_CANONICAL_COLS,
            ROOT_CANVAS_COLS,
          ),
        ),
      );
    },
    [
      gridEngineActiveBreakpoint,
      onSectionsLayoutChange,
      rootClimateWidgetIds,
      rootCameraWidgetIds,
      rootMediaWidgetIds,
      rootSensorWidgetIds,
      rootMembersWidgetIds,
      rootAlarmWidgetIds,
      rootLockWidgetIds,
      rootVacuumWidgetIds,
      rootCoverWidgetIds,
      rootLightWidgetStateById,
    ],
  );
  const updateGridEngineLayouts = useCallback(
    (nextLayouts: ResponsiveLayouts<GridBreakpoint>) => {
      const parsed = toGridLayouts(nextLayouts);
      const xlSource = (parsed.xl && parsed.xl.length > 0
        ? parsed.xl
        : parsed['2xl'] && parsed['2xl'].length > 0
          ? parsed['2xl'].map((item) => scaleLayoutColumns(item, GRID_ENGINE_2XL_COLS, GRID_ENGINE_XL_COLS))
          : derivedGridEngineLayouts.xl ?? derivedGridEngineLayouts['2xl']) ?? [];
      const xl = compactLayoutUp(
        enforceRootWidgetSpans(
          xlSource,
          'xl',
          GRID_ENGINE_XL_COLS,
          rootLightWidgetStateById,
          rootClimateWidgetIds,
          rootCameraWidgetIds,
          rootMediaWidgetIds,
          rootSensorWidgetIds,
          rootMembersWidgetIds,
          rootAlarmWidgetIds,
          rootLockWidgetIds,
          rootVacuumWidgetIds,
          rootCoverWidgetIds,
        ),
        GRID_ENGINE_XL_COLS,
      );
      const twoXl = compactLayoutUp(
        enforceRootWidgetSpans(
          parsed['2xl'] ??
            xl.map((item) => scaleLayoutColumns(item, GRID_ENGINE_XL_COLS, GRID_ENGINE_2XL_COLS)),
          '2xl',
          GRID_ENGINE_2XL_COLS,
          rootLightWidgetStateById,
          rootClimateWidgetIds,
          rootCameraWidgetIds,
          rootMediaWidgetIds,
          rootSensorWidgetIds,
          rootMembersWidgetIds,
          rootAlarmWidgetIds,
          rootLockWidgetIds,
          rootVacuumWidgetIds,
          rootCoverWidgetIds,
        ),
        GRID_ENGINE_2XL_COLS,
      );
      const lg = compactLayoutUp(
        enforceRootWidgetSpans(
          parsed.lg ?? xl.map((item) => scaleLayoutColumns(item, GRID_ENGINE_XL_COLS, GRID_ENGINE_LG_COLS)),
          'lg',
          GRID_ENGINE_LG_COLS,
          rootLightWidgetStateById,
          rootClimateWidgetIds,
          rootCameraWidgetIds,
          rootMediaWidgetIds,
          rootSensorWidgetIds,
          rootMembersWidgetIds,
          rootAlarmWidgetIds,
          rootLockWidgetIds,
          rootVacuumWidgetIds,
          rootCoverWidgetIds,
        ),
        GRID_ENGINE_LG_COLS,
      );
      const smallOneByOneIds = new Set(
        xl.filter((item) => isSmallOneByOne(item)).map((item) => item.i),
      );
      const withResponsiveRules: GridLayouts = {
        '2xl': twoXl,
        xl,
        lg,
        md: compactLayoutUp(
          enforceRootWidgetSpans(
            parsed.md ??
              lg.map((item) => scaleLayoutColumns(item, GRID_ENGINE_LG_COLS, GRID_ENGINE_MD_COLS)),
            'md',
            GRID_ENGINE_MD_COLS,
            rootLightWidgetStateById,
            rootClimateWidgetIds,
            rootCameraWidgetIds,
            rootMediaWidgetIds,
            rootSensorWidgetIds,
            rootMembersWidgetIds,
            rootAlarmWidgetIds,
            rootLockWidgetIds,
            rootVacuumWidgetIds,
            rootCoverWidgetIds,
          ),
          GRID_ENGINE_MD_COLS,
        ),
        sm: compactLayoutUp(
          enforceRootWidgetSpans(
            adaptToMobileColumns(
              parsed.sm ?? lg,
              parsed.sm ? GRID_ENGINE_SM_COLS : GRID_ENGINE_LG_COLS,
              GRID_ENGINE_SM_COLS,
              smallOneByOneIds,
            ),
            'sm',
            GRID_ENGINE_SM_COLS,
            rootLightWidgetStateById,
            rootClimateWidgetIds,
            rootCameraWidgetIds,
            rootMediaWidgetIds,
            rootSensorWidgetIds,
            rootMembersWidgetIds,
            rootAlarmWidgetIds,
            rootLockWidgetIds,
            rootVacuumWidgetIds,
            rootCoverWidgetIds,
          ),
          GRID_ENGINE_SM_COLS,
        ),
        xs: compactLayoutUp(
          enforceRootWidgetSpans(
            adaptToMobileColumns(
              parsed.xs ?? parsed.sm ?? lg,
              parsed.xs ? GRID_ENGINE_XS_COLS : parsed.sm ? GRID_ENGINE_SM_COLS : GRID_ENGINE_LG_COLS,
              GRID_ENGINE_XS_COLS,
              smallOneByOneIds,
            ),
            'xs',
            GRID_ENGINE_XS_COLS,
            rootLightWidgetStateById,
            rootClimateWidgetIds,
            rootCameraWidgetIds,
            rootMediaWidgetIds,
            rootSensorWidgetIds,
            rootMembersWidgetIds,
            rootAlarmWidgetIds,
            rootLockWidgetIds,
            rootVacuumWidgetIds,
            rootCoverWidgetIds,
          ),
          GRID_ENGINE_XS_COLS,
        ),
      };
      setGridEngineLayouts((current) =>
        sameGridLayouts(current, withResponsiveRules) ? current : withResponsiveRules,
      );
      return withResponsiveRules;
    },
    [
      derivedGridEngineLayouts['2xl'],
      derivedGridEngineLayouts.xl,
      rootClimateWidgetIds,
      rootCameraWidgetIds,
      rootMediaWidgetIds,
      rootSensorWidgetIds,
      rootMembersWidgetIds,
      rootAlarmWidgetIds,
      rootLockWidgetIds,
      rootVacuumWidgetIds,
      rootCoverWidgetIds,
      rootLightWidgetStateById,
    ],
  );
  const focusCanvasOverlayItem = useCallback(
    (itemId: string) => {
      if (sectionIdSet.has(itemId)) {
        onSelectSection(itemId);
        onSelectWidget(null);
        return;
      }
      if (rootWidgetIdSet.has(itemId)) {
        onSelectWidget(itemId);
        onSelectSection(null);
      }
    },
    [onSelectSection, onSelectWidget, rootWidgetIdSet, sectionIdSet],
  );
  const renderSectionCard = useCallback(
    (
      section: DashboardSection,
      sectionSpanW: number,
      sectionSpanH: number,
      sectionCanvasCols: number,
      stackWidth: number,
      stackRowHeight: number,
      stackMargin: number,
      stackMounted: boolean,
    ) => {
      const isTransparentSection = section.kind === 'greeting' || section.kind === 'weather';
      const isStack = isStackSection(section);
      const showBackground =
        section.kind === 'scenes'
          ? section.scenesShowBackground ?? true
          : isStack
            ? section.stackShowBackground ?? true
            : !isTransparentSection;
      const showBorder =
        section.kind === 'scenes'
          ? section.scenesShowBorder ?? true
          : isStack
            ? section.stackShowBorder ?? true
            : !isTransparentSection;
      const backgroundClass = showBackground ? 'bg-white/5' : 'bg-transparent';
      const borderClass = showBorder ? 'border border-white/10' : 'border border-transparent';
      const isWeatherClickable = !isEditMode && section.kind === 'weather';
      const isGreetingSection = section.kind === 'greeting';
      const isWeatherSection = section.kind === 'weather';
      const isScenesSection = section.kind === 'scenes';
      const isCompactWeatherSection = isWeatherSection && sectionSpanH <= ROOT_CANVAS_ROW_UNITS;
      const isSingleRowScenesSection = isScenesSection && sectionSpanH <= ROOT_CANVAS_ROW_UNITS;
      const hideEditModeBadges =
        section.kind === 'greeting' || section.kind === 'weather' || section.kind === 'scenes' || isStack;
      const sectionPaddingClass = isStack
        ? 'p-0'
        : isGreetingSection || isCompactWeatherSection
          ? isTabletCanvas
            ? 'px-3 py-2 sm:px-4 sm:py-2.5'
            : 'px-4 py-2 sm:px-5 sm:py-2.5'
          : isScenesSection
            ? isSingleRowScenesSection
              ? isTabletCanvas
                ? 'px-2 py-1 sm:px-2.5 sm:py-1.5'
                : 'px-2.5 py-1.5 sm:px-3 sm:py-1.5'
              : isTabletCanvas
                ? 'px-2.5 py-1.5 sm:px-3 sm:py-2'
                : 'px-3 py-2 sm:px-3.5 sm:py-2.5'
            : isTabletCanvas
              ? 'p-3'
              : 'p-4';
      const sectionOverflowClass = isStack ? 'overflow-visible' : 'overflow-hidden';
      const stackWidgets = widgets.filter((widget) => widget.parentSectionId === section.id);
      const sectionCompactPreview =
        sectionSpanH <= ROOT_CANVAS_ROW_UNITS ||
        isTabletCanvas ||
        sectionSpanW <= 3 ||
        (isScenesSection && (sectionSpanH <= 3 || sectionSpanW <= 4));

      return (
        <div
          className={`h-full w-full min-h-0 min-w-0 rounded-[2rem] ${sectionPaddingClass} ${sectionOverflowClass} transition-colors ${backgroundClass} ${borderClass} ${
            isEditMode && selectedSectionId === section.id ? 'selection-corners' : ''
          } ${isWeatherClickable ? 'cursor-pointer hover:opacity-90' : ''}`}
          onPointerDown={(event) => {
            if (!isEditMode) {
              return;
            }
            if (event.pointerType === 'mouse' && event.button !== 0) {
              return;
            }
            event.stopPropagation();
            onSelectSection(section.id);
          }}
          onClick={(event) => {
            if (isEditMode) {
              if (!isStack) {
                event.stopPropagation();
                onSelectSection(section.id);
              }
              return;
            }
            if (section.kind === 'weather') {
              event.stopPropagation();
              onWeatherClick();
            }
          }}
        >
          {isEditMode && !hideEditModeBadges ? (
            <div className={`flex items-center justify-between ${isGreetingSection ? 'mb-1.5' : 'mb-3'}`}>
              <button
                type="button"
                className="section-action inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/55 hover:bg-white/10"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onSelectSection(section.id);
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectSection(section.id);
                }}
              >
                {SECTION_LABELS[section.kind]}
              </button>
            </div>
          ) : null}
          {!isStack ? (
            <SectionCardRenderer
              section={section}
              state={state}
              compact={sectionCompactPreview}
              isEditMode={false}
              onWeatherClick={onWeatherClick}
              runningSceneId={runningSceneBySectionId[section.id]?.sceneId ?? null}
              runningSceneStartedAt={runningSceneBySectionId[section.id]?.startedAt ?? null}
              onAddScene={(sceneId: SceneKey) => {
                if (section.kind !== 'scenes') {
                  return;
                }
                onUpdateSection(section.id, (current) => {
                  const currentScenes =
                    current.scenes ?? SCENES_CATALOG.slice(0, 4).map((sceneEntry) => sceneEntry.id);
                  if (currentScenes.includes(sceneId)) {
                    return current;
                  }
                  return {
                    ...current,
                    scenes: [...currentScenes, sceneId],
                  };
                });
              }}
              onSceneTrigger={(sceneId) => {
                if (section.kind !== 'scenes') {
                  return;
                }
                void onSceneTrigger(section, sceneId);
              }}
            />
          ) : (
            <div className="flex h-full w-full min-h-0 min-w-0 flex-col">
              {section.stackShowHeader !== false && section.title ? (
                <div className="mb-3 px-3 pt-3 sm:px-4 sm:pt-4 flex items-center justify-between">
                  <p className="text-base font-semibold text-white/70 tracking-tight">
                    {section.title}
                  </p>
                  {isEditMode && selectedSectionId === section.id ? (
                    <span className="text-[10px] uppercase tracking-[0.2em] text-blue-200/80 border border-blue-300/30 bg-blue-500/15 px-2 py-1 rounded-full">
                      Stack attivo
                    </span>
                  ) : null}
                </div>
              ) : null}
              <StackGrid
                isEditMode={isEditMode}
                isXsViewport={isXsViewport}
                sectionsMounted={stackMounted}
                state={state}
                houseMembers={houseMembers}
                section={section}
                gridBreakpoint={gridEngineActiveBreakpoint}
                sectionCanvasCols={sectionCanvasCols}
                stackWidgets={stackWidgets}
                isSelected={isEditMode && selectedSectionId === section.id}
                stackWidth={Math.max(stackWidth, 1)}
                rootRowHeight={stackRowHeight}
                rootMargin={stackMargin}
                selectedWidgetId={selectedWidgetId}
                onSelectWidget={onSelectWidget}
                onSelectSection={onSelectSection}
                onWidgetClick={onWidgetClick}
                onWidgetLightToggle={onWidgetLightToggle}
                onWidgetBrightnessChange={onWidgetBrightnessChange}
                onWidgetClimateTargetTempChange={onWidgetClimateTargetTempChange}
                onWidgetClimateTargetRangeChange={onWidgetClimateTargetRangeChange}
                onWidgetClimateModeChange={onWidgetClimateModeChange}
                onWidgetClimateFanModeChange={onWidgetClimateFanModeChange}
                onWidgetMediaToggle={onWidgetMediaToggle}
                onWidgetMediaPrevious={onWidgetMediaPrevious}
                onWidgetMediaNext={onWidgetMediaNext}
                onWidgetMediaSeek={onWidgetMediaSeek}
                onWidgetAlarmDisarm={onWidgetAlarmDisarm}
                onWidgetAlarmArm={onWidgetAlarmArm}
                onWidgetVacuumStartPause={onWidgetVacuumStartPause}
                onWidgetVacuumReturnToBase={onWidgetVacuumReturnToBase}
                onWidgetLockToggle={onWidgetLockToggle}
                onWidgetLockOpen={onWidgetLockOpen}
                onOpenMembersPanel={onOpenMembersPanel}
                onWidgetLayoutChange={onWidgetLayoutChange}
                haConnected={haConnected}
                haStates={haStates}
                sensorHistoryByEntity={sensorHistoryByEntity}
              />
            </div>
          )}
        </div>
      );
    },
    [
      haConnected,
      haStates,
      sensorHistoryByEntity,
      gridEngineActiveBreakpoint,
      houseMembers,
      isEditMode,
      isStackSection,
      isTabletCanvas,
      onSelectSection,
      onSceneTrigger,
      onUpdateSection,
      onWeatherClick,
      onWidgetAlarmArm,
      onWidgetAlarmDisarm,
      onWidgetBrightnessChange,
      onWidgetClick,
      onWidgetLightToggle,
      onWidgetClimateFanModeChange,
      onWidgetClimateModeChange,
      onWidgetClimateTargetRangeChange,
      onWidgetClimateTargetTempChange,
      onWidgetLayoutChange,
      onWidgetLockOpen,
      onWidgetLockToggle,
      onOpenMembersPanel,
      onWidgetMediaPrevious,
      onWidgetMediaNext,
      onWidgetMediaSeek,
      onWidgetMediaToggle,
      onWidgetVacuumReturnToBase,
      onWidgetVacuumStartPause,
      onSelectWidget,
      isXsViewport,
      runningSceneBySectionId,
      selectedSectionId,
      selectedWidgetId,
      state,
      widgets,
    ],
  );

  return (
    <div className="relative flex-1 min-w-0 h-full min-h-0">
      <div className="h-full overflow-y-scroll pb-[calc(env(safe-area-inset-bottom)+8.25rem)] sm:pb-10 [scroll-padding-bottom:calc(env(safe-area-inset-bottom)+8.25rem)] sm:[scroll-padding-bottom:2.5rem] custom-scrollbar">
        <div
          ref={runtimeGridHostRef}
          className={`relative behance-canvas-shell rounded-[2rem] pt-2 pb-4 min-h-[48rem] ${
            isEditMode ? 'bg-white/5 border border-white/10' : 'bg-transparent border border-transparent'
          }`}
        >
          {topRightOverlay ? (
            <div className="absolute right-2 top-2 z-40 sm:right-3 sm:top-3">
              {topRightOverlay}
            </div>
          ) : null}
          {isEditMode ? (
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] dashboard-edit-overlay" />
          ) : null}
          {developerMode ? (
            <div className="pointer-events-none absolute left-4 top-4 z-30 rounded-xl border border-cyan-300/35 bg-slate-950/65 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-100">
              {`dev ${gridEngineActiveBreakpoint} | cols ${gridEngineActiveCols} | rows ${Math.max(1, liveGridUsedRows)}`}
            </div>
          ) : null}

          <ResponsiveGridLayout
            className={`sections-grid behance-grid relative ${isEditMode ? 'is-editing' : ''}`}
            breakpoints={GRID_ENGINE_BREAKPOINTS}
            cols={GRID_ENGINE_COLS}
            layouts={liveGridEngineLayouts as ResponsiveLayouts<GridBreakpoint>}
            rowHeight={GRID_ENGINE_ROW_UNIT}
            margin={[GRID_ENGINE_GAP_PX, GRID_ENGINE_GAP_PX]}
            containerPadding={GRID_ENGINE_CONTAINER_PADDING}
            compactType="vertical"
            preventCollision={false}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            resizeHandles={['se']}
            draggableCancel=".builder-grid,.widget-action,.section-action,.react-resizable-handle"
            onBreakpointChange={(nextBreakpoint) => {
              setGridEngineActiveBreakpoint(nextBreakpoint as GridBreakpoint);
            }}
            onDragStart={(_, __, newItem) => {
              if (!isEditMode) {
                return;
              }
              isCanvasInteractingRef.current = true;
              if (newItem?.i) {
                focusCanvasOverlayItem(newItem.i);
              }
            }}
            onResizeStart={(_, __, newItem) => {
              if (!isEditMode) {
                return;
              }
              isCanvasInteractingRef.current = true;
              if (newItem?.i) {
                focusCanvasOverlayItem(newItem.i);
              }
            }}
            onDragStop={(layout) => {
              if (!isEditMode) {
                return;
              }
              isCanvasInteractingRef.current = false;
              const committed = updateGridEngineLayouts({
                ...liveGridEngineLayouts,
                [gridEngineActiveBreakpoint]: layout as GridItem[],
              });
              commitGridEngineLayouts(committed, layout as GridItem[]);
            }}
            onResizeStop={(layout) => {
              if (!isEditMode) {
                return;
              }
              isCanvasInteractingRef.current = false;
              const committed = updateGridEngineLayouts({
                ...liveGridEngineLayouts,
                [gridEngineActiveBreakpoint]: layout as GridItem[],
              });
              commitGridEngineLayouts(committed, layout as GridItem[]);
            }}
            onLayoutChange={(layout, layouts) => {
              if (!isEditMode || !isCanvasInteractingRef.current) {
                return;
              }
              const nextLayouts = updateGridEngineLayouts(layouts as ResponsiveLayouts<GridBreakpoint>);
              commitGridEngineLayouts(nextLayouts, layout as GridItem[]);
            }}
          >
            {sections.map((section) => {
              const sectionLayoutItem = liveGridEngineLayoutMap.get(section.id);
              const sectionSpanW = Math.max(1, Math.round(sectionLayoutItem?.w ?? section.layout.w));
              const sectionSpanH = Math.max(1, Math.round(sectionLayoutItem?.h ?? section.layout.h));
              const sectionCanvasCols = sectionSpanW;
              const stackWidth = Math.max(
                1,
                Math.round(
                  gridEngineColumnWidth * sectionSpanW + GRID_ENGINE_GAP_PX * Math.max(0, sectionSpanW - 1),
                ),
              );
              return (
                <div key={section.id} className="relative h-full w-full min-h-0 min-w-0 overflow-hidden">
                  {renderSectionCard(
                    section,
                    sectionSpanW,
                    sectionSpanH,
                    sectionCanvasCols,
                    stackWidth,
                    GRID_ENGINE_ROW_UNIT,
                    GRID_ENGINE_GAP_PX,
                    runtimeGridEffectiveWidth > 0,
                  )}
                </div>
              );
            })}
            {rootWidgets.map((widget) => {
              const value =
                widget.entityId === 'sensor.nest_wifi_download'
                  ? state.wifiDownloadMbps
                  : widget.value ?? 0;
              return (
                <div
                  key={widget.id}
                  className="relative h-full w-full min-h-0 min-w-0 overflow-hidden"
                  style={
                    isXsLongPressMode
                      ? {
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                        }
                      : undefined
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isEditMode) {
                      onSelectWidget(widget.id);
                    }
                  }}
                  onPointerDown={(event) => {
                    if (!isEditMode) {
                      handleXsLongPressStart(event, widget);
                      return;
                    }
                    event.stopPropagation();
                    onSelectWidget(widget.id);
                  }}
                  onPointerMove={(event) => {
                    if (isEditMode) {
                      return;
                    }
                    handleXsLongPressMove(event);
                  }}
                  onPointerUp={(event) => {
                    if (isEditMode) {
                      return;
                    }
                    handleXsLongPressEnd(event);
                  }}
                  onPointerCancel={(event) => {
                    if (isEditMode) {
                      return;
                    }
                    handleXsLongPressEnd(event);
                  }}
                  onPointerLeave={() => {
                    if (isEditMode) {
                      return;
                    }
                    clearXsLongPressTimer();
                  }}
                >
                  <WidgetCardRenderer
                    widget={widget}
                    dashboardState={state}
                    isEditMode={false}
                    isSelected={selectedWidgetId === widget.id}
                    gridBreakpoint={gridEngineActiveBreakpoint}
                    value={value}
                    onClick={() => {
                      if (isXsLongPressMode) {
                        if (xsSuppressNextCardClickRef.current) {
                          xsSuppressNextCardClickRef.current = false;
                          xsLongPressTriggeredRef.current = false;
                          return;
                        }
                        if (widget.kind === 'light') {
                          onWidgetLightToggle(widget);
                        }
                        return;
                      }
                      onWidgetClick(widget);
                    }}
                    onLightBrightnessChange={onWidgetBrightnessChange}
                    onClimateTargetTempChange={onWidgetClimateTargetTempChange}
                    onClimateTargetRangeChange={onWidgetClimateTargetRangeChange}
                    onClimateModeChange={onWidgetClimateModeChange}
                    onClimateFanModeChange={onWidgetClimateFanModeChange}
                    onMediaToggle={onWidgetMediaToggle}
                    onMediaPrevious={onWidgetMediaPrevious}
                    onMediaNext={onWidgetMediaNext}
                    onMediaSeek={onWidgetMediaSeek}
                    onAlarmDisarm={onWidgetAlarmDisarm}
                    onAlarmArm={onWidgetAlarmArm}
                    onVacuumStartPause={onWidgetVacuumStartPause}
                    onVacuumReturnToBase={onWidgetVacuumReturnToBase}
                    onLockToggle={onWidgetLockToggle}
                    onLockOpen={onWidgetLockOpen}
                    onMembersOpenPanel={() => onOpenMembersPanel()}
                    liveEntity={haConnected ? haStates[widget.entityId] : undefined}
                    sensorHistory={sensorHistoryByEntity[widget.entityId]}
                    houseMembers={houseMembers}
                  />
                </div>
              );
            })}
          </ResponsiveGridLayout>
        </div>
      </div>

      {isEditMode ? (
        <button
          type="button"
          onClick={onOpenCatalog}
          className="absolute bottom-8 right-6 sm:right-8 z-20 w-16 h-16 rounded-full bg-white/15 border border-blue-300/35 backdrop-blur-2xl text-blue-200 shadow-[0_0_0_1px_rgba(147,197,253,0.3),0_16px_45px_rgba(56,189,248,0.35)] hover:scale-105 hover:bg-blue-500/20 transition-all"
          aria-label="Apri catalogo componenti"
        >
          <Plus size={30} className="mx-auto" />
        </button>
      ) : null}

      {isEditMode && isCatalogOpen ? (
        <div
          className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-3xl flex items-center justify-center p-6"
          onClick={onCloseCatalog}
        >
          <div
            className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.08] backdrop-blur-3xl p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Builder Catalog</p>
                <h3 className="text-2xl font-semibold mt-1">Aggiungi Componenti</h3>
              </div>
              <button
                type="button"
                onClick={onCloseCatalog}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45 mb-3">Blocchi Dashboard</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {layoutSections.map((item) => (
                    <button
                      key={item.kind}
                      type="button"
                      onClick={() => onAddSection(item.kind)}
                      className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-3 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <LayoutGrid size={14} />
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45 mb-3">Widget Stack</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {WIDGET_CATALOG.map((item) => (
                    <button
                      key={item.kind}
                      type="button"
                      onClick={() => onAddWidget(item.kind)}
                      className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-3 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          {item.label.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/45 mb-3">Sezioni Widget</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {widgetGroupSections.map((item) => (
                      <button
                        key={item.kind}
                        type="button"
                        onClick={() => onAddSection(item.kind)}
                        className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-3 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <LayoutGrid size={14} />
                          </div>
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .dashboard-edit-overlay {
              background-image: radial-gradient(#93c5fd2c 1px, transparent 1px);
              background-size: 18px 18px;
            }

            .builder-grid .react-resizable-handle::after,
            .sections-grid .react-resizable-handle::after { display: none; }

            .builder-grid .react-resizable-handle,
            .sections-grid .react-resizable-handle {
              padding: 0 !important;
              background-origin: border-box !important;
              box-sizing: border-box !important;
            }

            .builder-grid .react-resizable-handle-se,
            .sections-grid .react-resizable-handle-se {
              right: 10px !important;
              bottom: 10px !important;
              width: 20px !important;
              height: 20px !important;
              border-radius: 999px;
              border: 1px solid rgba(147,197,253,0.45);
              background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.65), rgba(96,165,250,0.28) 48%, rgba(15,23,42,0.9));
              transform: none !important;
              opacity: 0;
              pointer-events: none;
              transition: opacity 180ms ease;
            }

            .builder-grid.is-editing .react-resizable-handle-se,
            .sections-grid.is-editing .react-resizable-handle-se {
              opacity: 1;
              pointer-events: auto;
            }

            .builder-grid.horizontal-stack {
              height: 100% !important;
            }

            .builder-grid.horizontal-stack .react-grid-item {
              height: 100% !important;
            }

            .sections-grid.grid-engine-overlay,
            .sections-grid.grid-engine-overlay .react-grid-item,
            .sections-grid.grid-engine-overlay .react-grid-item > div,
            .sections-grid.grid-engine-overlay .react-grid-item > button,
            .sections-grid.grid-engine-overlay .react-grid-item > div > button,
            .builder-grid,
            .builder-grid .react-grid-item,
            .builder-grid .react-grid-item > div,
            .builder-grid .react-grid-item > button,
            .builder-grid .react-grid-item > div > button {
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box;
            }

            .sections-grid.grid-engine-overlay .react-grid-item.grid-engine-overlay-item {
              pointer-events: auto !important;
            }

            .dashboard-light-card .light-card-ui {
              display: flex;
              height: 100%;
              min-height: 0;
              align-self: stretch;
            }

            .dashboard-light-card .light-card-ui__surface {
              height: 100%;
              min-height: 0;
              flex: 1 1 auto;
              justify-content: space-between;
            }

            .dashboard-light-card .light-card-ui__slider {
              background: linear-gradient(
                90deg,
                #f8fbff 0%,
                #f8fbff var(--light-slider-fill, 50%),
                rgba(255, 255, 255, 0.35) var(--light-slider-fill, 50%),
                rgba(255, 255, 255, 0.35) 100%
              );
            }

            .dashboard-light-card .light-card-ui__icon-shell {
              background: rgba(255, 255, 255, 0.2);
            }

            .dashboard-light-card .light-card-ui__expand {
              max-height: 64px;
            }

            .dashboard-light-card .light-card-ui--off .light-card-ui__expand,
            .dashboard-light-card .light-card-ui--unavailable .light-card-ui__expand {
              max-height: 0;
              opacity: 0;
            }
          `,
        }}
      />
    </div>
  );
}
