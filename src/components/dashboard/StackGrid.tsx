import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GridLayout from 'react-grid-layout/legacy';
import { MoreHorizontal } from 'lucide-react';
import { WidgetCardRenderer } from '../widgets/CardRenderer';
import type { DashboardStateShape } from '../../hooks/useDashboardState';
import type { DashboardSection, GridItem, Widget } from '../../types/dashboardModels';
import type { MockEntityStateMap } from '../../types/ha';
import type { WidgetTypeLayoutOverrides } from '../../types/widgetTypeLayout';
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
  type GridEngineBreakpoint,
  resolveWidgetTypeLayoutSpan,
} from './dashboardBreakpointConfig';
import {
  compactLayoutUp,
  clampLayoutToColumns,
  normalizeRuntimeLayout,
  reflowLayoutsToColumns,
  scaleLayoutColumns,
} from './gridEngineGeometry';

type HouseMemberCardItem = {
  id: string;
  name: string;
  avatarUrl?: string;
  roleLabel?: string;
  isCurrent?: boolean;
};

const STACK_WIDGET_MIN_WIDTH_PX: Record<Widget['kind'], number> = {
  light: 168,
  switch: 168,
  climate: 208,
  camera: 208,
  sensor: 156,
  media: 224,
  alarm: 200,
  vacuum: 208,
  lock: 168,
  cover: 168,
  members: 232,
};
const ADAPTIVE_SPAN_ENABLE_COL_WIDTH_PX = 78;
const ADAPTIVE_SPAN_DISABLE_COL_WIDTH_PX = 90;
const ENABLE_STACK_ADAPTIVE_MIN_WIDTH = false;
const XS_CONTEXT_OPEN_LONG_PRESS_MS = 420;
const XS_CONTEXT_OPEN_MOVE_TOLERANCE_PX = 14;

function resolveMinSpanForWidth(minWidthPx: number, colWidthPx: number, cols: number, gapPx: number) {
  if (!Number.isFinite(minWidthPx) || minWidthPx <= 0) {
    return 1;
  }
  const safeCols = Math.max(1, Math.round(cols));
  const safeColWidth = Math.max(1, colWidthPx);
  for (let span = 1; span <= safeCols; span += 1) {
    const spanWidth = span * safeColWidth + Math.max(0, span - 1) * gapPx;
    if (spanWidth >= minWidthPx) {
      return span;
    }
  }
  return safeCols;
}

function adaptLayoutsToMinWidth(
  layouts: GridItem[],
  cols: number,
  colWidthPx: number,
  gapPx: number,
  minWidthById: Map<string, number>,
): GridItem[] {
  const safeCols = Math.max(1, Math.round(cols));
  return layouts.map((layout) => {
    const baseW = Math.max(1, Math.round(layout.w));
    const minWidthPx = minWidthById.get(layout.i) ?? 0;
    const minSpan = resolveMinSpanForWidth(minWidthPx, colWidthPx, safeCols, gapPx);
    const safeW = Math.min(safeCols, Math.max(baseW, minSpan));
    const center = Math.max(0, Math.round(layout.x)) + baseW / 2;
    let safeX = Math.round(center - safeW / 2);
    safeX = Math.min(Math.max(0, safeX), Math.max(0, safeCols - safeW));
    return {
      i: layout.i,
      x: safeX,
      y: Math.max(0, Math.round(layout.y)),
      w: safeW,
      h: Math.max(1, Math.round(layout.h)),
    };
  });
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

function compactAndResolveLayout(layouts: GridItem[], cols: number): GridItem[] {
  // Keep stack reflow column-preserving like canvas: vertical compact + collision push-down.
  return reflowLayoutsToColumns(compactLayoutUp(layouts, cols), cols);
}

function enforceClimateWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  climateWidgetIds: ReadonlySet<string>,
  widgetTypeLayoutOverrides: WidgetTypeLayoutOverrides,
): GridItem[] {
  if (climateWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
  }
  const span = resolveWidgetTypeLayoutSpan('climate', breakpoint, widgetTypeLayoutOverrides);
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
  );
}

function enforceSwitchWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  switchWidgetIds: ReadonlySet<string>,
  widgetTypeLayoutOverrides: WidgetTypeLayoutOverrides,
): GridItem[] {
  if (switchWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
  }
  const span = resolveWidgetTypeLayoutSpan('switch', breakpoint, widgetTypeLayoutOverrides);
  const safeCols = Math.max(1, Math.round(cols));
  const forcedW = Math.min(safeCols, Math.max(1, Math.round(span.w)));
  const forcedH = Math.max(1, Math.round(span.h));
  return normalizeRuntimeLayout(
    layouts.map((item) => {
      if (!switchWidgetIds.has(item.i)) {
        return item;
      }
      return {
        ...item,
        w: forcedW,
        h: forcedH,
      };
    }),
  );
}

function enforceCameraWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  cameraWidgetIds: ReadonlySet<string>,
  widgetTypeLayoutOverrides: WidgetTypeLayoutOverrides,
): GridItem[] {
  if (cameraWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
  }
  const span = resolveWidgetTypeLayoutSpan('camera', breakpoint, widgetTypeLayoutOverrides);
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
  );
}

function enforceCoverWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  coverWidgetIds: ReadonlySet<string>,
  widgetTypeLayoutOverrides: WidgetTypeLayoutOverrides,
): GridItem[] {
  if (coverWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
  }
  const span = resolveWidgetTypeLayoutSpan('cover', breakpoint, widgetTypeLayoutOverrides);
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
  );
}

function enforceMediaWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  mediaWidgetIds: ReadonlySet<string>,
  widgetTypeLayoutOverrides: WidgetTypeLayoutOverrides,
): GridItem[] {
  if (mediaWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
  }
  const span = resolveWidgetTypeLayoutSpan('media', breakpoint, widgetTypeLayoutOverrides);
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
  );
}

function enforceVacuumWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  vacuumWidgetIds: ReadonlySet<string>,
  widgetTypeLayoutOverrides: WidgetTypeLayoutOverrides,
): GridItem[] {
  if (vacuumWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
  }
  const span = resolveWidgetTypeLayoutSpan('vacuum', breakpoint, widgetTypeLayoutOverrides);
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
  );
}

function enforceLockWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  lockWidgetIds: ReadonlySet<string>,
  widgetTypeLayoutOverrides: WidgetTypeLayoutOverrides,
): GridItem[] {
  if (lockWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
  }
  const span = resolveWidgetTypeLayoutSpan('lock', breakpoint, widgetTypeLayoutOverrides);
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
  );
}

function enforceSensorWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  sensorWidgetIds: ReadonlySet<string>,
  widgetTypeLayoutOverrides: WidgetTypeLayoutOverrides,
): GridItem[] {
  if (sensorWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
  }
  const span = resolveWidgetTypeLayoutSpan('sensor', breakpoint, widgetTypeLayoutOverrides);
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
  );
}

function enforceMembersWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  membersWidgetIds: ReadonlySet<string>,
  widgetTypeLayoutOverrides: WidgetTypeLayoutOverrides,
): GridItem[] {
  if (membersWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
  }
  const span = resolveWidgetTypeLayoutSpan('members', breakpoint, widgetTypeLayoutOverrides);
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
  );
}

function enforceAlarmWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  alarmWidgetIds: ReadonlySet<string>,
  widgetTypeLayoutOverrides: WidgetTypeLayoutOverrides,
): GridItem[] {
  if (alarmWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
  }
  const span = resolveWidgetTypeLayoutSpan('alarm', breakpoint, widgetTypeLayoutOverrides);
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
  );
}

function enforceLightWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  lightWidgetStateById: ReadonlyMap<string, boolean>,
  useExplicitLightSpan: boolean,
  widgetTypeLayoutOverrides: WidgetTypeLayoutOverrides,
): GridItem[] {
  if (lightWidgetStateById.size === 0) {
    return normalizeRuntimeLayout(layouts);
  }
  const span = resolveWidgetTypeLayoutSpan('light', breakpoint, widgetTypeLayoutOverrides);
  const safeCols = Math.max(1, Math.round(cols));
  const forcedW = Math.min(safeCols, Math.max(1, Math.round(span.w)));
  return normalizeRuntimeLayout(
    layouts.map((item) => {
      const lightIsOn = lightWidgetStateById.get(item.i);
      if (lightIsOn === undefined) {
        return item;
      }
      const currentH = Math.max(1, Math.round(item.h));
      const configuredH = Math.max(1, Math.round(lightIsOn ? span.hOn : span.hOff));
      return {
        ...item,
        w: forcedW,
        h: useExplicitLightSpan
          ? lightIsOn && configuredH <= 1
            ? Math.max(2, Math.round(span.hOn))
            : configuredH
          : lightIsOn
          ? currentH <= 1
            ? Math.max(2, Math.round(span.hOn))
            : currentH
          : currentH <= 2
            ? Math.max(1, Math.round(span.hOff))
            : currentH,
      };
    }),
  );
}

function enforceGridStackWidgetSpans(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  lightWidgetStateById: ReadonlyMap<string, boolean>,
  useExplicitLightSpan: boolean,
  widgetTypeLayoutOverrides: WidgetTypeLayoutOverrides,
  switchWidgetIds: ReadonlySet<string>,
  climateWidgetIds: ReadonlySet<string>,
  cameraWidgetIds: ReadonlySet<string>,
  mediaWidgetIds: ReadonlySet<string>,
  sensorWidgetIds: ReadonlySet<string>,
  membersWidgetIds: ReadonlySet<string>,
  alarmWidgetIds: ReadonlySet<string>,
  vacuumWidgetIds: ReadonlySet<string>,
  lockWidgetIds: ReadonlySet<string>,
  coverWidgetIds: ReadonlySet<string>,
): GridItem[] {
  const withLight = enforceLightWidgetSpan(
    layouts,
    breakpoint,
    cols,
    lightWidgetStateById,
    useExplicitLightSpan,
    widgetTypeLayoutOverrides,
  );
  const withSwitch = enforceSwitchWidgetSpan(
    withLight,
    breakpoint,
    cols,
    switchWidgetIds,
    widgetTypeLayoutOverrides,
  );
  const withClimate = enforceClimateWidgetSpan(
    withSwitch,
    breakpoint,
    cols,
    climateWidgetIds,
    widgetTypeLayoutOverrides,
  );
  const withCamera = enforceCameraWidgetSpan(
    withClimate,
    breakpoint,
    cols,
    cameraWidgetIds,
    widgetTypeLayoutOverrides,
  );
  const withMedia = enforceMediaWidgetSpan(
    withCamera,
    breakpoint,
    cols,
    mediaWidgetIds,
    widgetTypeLayoutOverrides,
  );
  const withSensor = enforceSensorWidgetSpan(
    withMedia,
    breakpoint,
    cols,
    sensorWidgetIds,
    widgetTypeLayoutOverrides,
  );
  const withMembers = enforceMembersWidgetSpan(
    withSensor,
    breakpoint,
    cols,
    membersWidgetIds,
    widgetTypeLayoutOverrides,
  );
  const withAlarm = enforceAlarmWidgetSpan(
    withMembers,
    breakpoint,
    cols,
    alarmWidgetIds,
    widgetTypeLayoutOverrides,
  );
  const withVacuum = enforceVacuumWidgetSpan(
    withAlarm,
    breakpoint,
    cols,
    vacuumWidgetIds,
    widgetTypeLayoutOverrides,
  );
  const withLock = enforceLockWidgetSpan(
    withVacuum,
    breakpoint,
    cols,
    lockWidgetIds,
    widgetTypeLayoutOverrides,
  );
  return enforceCoverWidgetSpan(
    withLock,
    breakpoint,
    cols,
    coverWidgetIds,
    widgetTypeLayoutOverrides,
  );
}

type StackGridProps = {
  isEditMode: boolean;
  isXsViewport: boolean;
  sectionsMounted: boolean;
  state: DashboardStateShape;
  houseMembers?: HouseMemberCardItem[];
  section: DashboardSection;
  gridBreakpoint: GridEngineBreakpoint;
  widgetTypeLayoutOverrides: WidgetTypeLayoutOverrides;
  sectionCanvasCols: number;
  stackWidgets: Widget[];
  isSelected: boolean;
  stackWidth: number;
  rootRowHeight: number;
  rootMargin: number;
  selectedWidgetId: string | null;
  onSelectWidget: (id: string | null) => void;
  onSelectSection: (id: string | null) => void;
  onWidgetClick: (widget: Widget) => void;
  onWidgetLightToggle: (widget: Widget) => void;
  onWidgetSwitchToggle: (widget: Widget) => void;
  onWidgetBrightnessChange: (widget: Widget, value: number) => void;
  onWidgetClimateTargetTempChange: (widget: Widget, value: number) => void;
  onWidgetClimateTargetRangeChange: (widget: Widget, low: number, high: number) => void;
  onWidgetClimateModeChange: (widget: Widget, mode: string) => void;
  onWidgetClimateFanModeChange: (widget: Widget, mode: string) => void;
  onWidgetMediaToggle: (widget: Widget) => void;
  onWidgetMediaPrevious: (widget: Widget) => void;
  onWidgetMediaNext: (widget: Widget) => void;
  onWidgetMediaSeek: (widget: Widget, position: number) => void;
  onWidgetMediaSelectSource: (widget: Widget, source: string) => void;
  onWidgetAlarmDisarm: (widget: Widget) => void;
  onWidgetAlarmArm: (widget: Widget, mode: 'home' | 'away' | 'night' | 'vacation' | 'custom_bypass') => void;
  onWidgetVacuumStartPause: (widget: Widget) => void;
  onWidgetVacuumReturnToBase: (widget: Widget) => void;
  onWidgetLockToggle: (widget: Widget) => boolean | void;
  onWidgetLockOpen: (widget: Widget) => void;
  onOpenMembersPanel: () => void;
  onWidgetLayoutChange: (sectionId: string, next: GridItem[]) => void;
  haConnected: boolean;
  haStates: MockEntityStateMap;
  sensorHistoryByEntity?: Record<string, number[]>;
  onGridStackUsedRowsChange?: (sectionId: string, usedRows: number) => void;
};

function StackGridComponent({
  isEditMode,
  isXsViewport,
  sectionsMounted,
  state,
  houseMembers = [],
  section,
  gridBreakpoint,
  widgetTypeLayoutOverrides,
  sectionCanvasCols,
  stackWidgets,
  isSelected,
  stackWidth,
  rootRowHeight,
  rootMargin,
  selectedWidgetId,
  onSelectWidget,
  onSelectSection,
  onWidgetClick,
  onWidgetLightToggle,
  onWidgetSwitchToggle,
  onWidgetBrightnessChange,
  onWidgetClimateTargetTempChange,
  onWidgetClimateTargetRangeChange,
  onWidgetClimateModeChange,
  onWidgetClimateFanModeChange,
  onWidgetMediaToggle,
  onWidgetMediaPrevious,
  onWidgetMediaNext,
  onWidgetMediaSeek,
  onWidgetMediaSelectSource,
  onWidgetAlarmDisarm,
  onWidgetAlarmArm,
  onWidgetVacuumStartPause,
  onWidgetVacuumReturnToBase,
  onWidgetLockToggle,
  onWidgetLockOpen,
  onOpenMembersPanel,
  onWidgetLayoutChange,
  haConnected,
  haStates,
  sensorHistoryByEntity = {},
  onGridStackUsedRowsChange,
}: StackGridProps) {
  const isStackInteractingRef = useRef(false);
  const xsLongPressTimerRef = useRef<number | null>(null);
  const xsLongPressPointerIdRef = useRef<number | null>(null);
  const xsLongPressStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const xsSuppressNextCardClickRef = useRef(false);
  const stackHostRef = useRef<HTMLDivElement | null>(null);
  const draggingStackItemRef = useRef<GridItem | null>(null);
  const stackDragStartItemRef = useRef<GridItem | null>(null);
  const hasStackDragMovedRef = useRef(false);
  const [stackPreviewLayout, setStackPreviewLayout] = useState<GridItem[] | null>(null);
  const [measuredStackWidth, setMeasuredStackWidth] = useState(0);
  const [isAdaptiveSpanEnabled, setIsAdaptiveSpanEnabled] = useState(false);
  const stableWidthRef = useRef(0);
  const isHorizontalStack = section.kind === 'stack-horizontal';
  const isGridStack = section.kind === 'stack-grid';
  const isCompactEditCardMenuMode = isEditMode && (gridBreakpoint === 'xs' || gridBreakpoint === 'sm');
  const canvasLinkedCols = section.kind === 'stack-vertical' ? 1 : Math.max(1, Math.round(sectionCanvasCols));
  const canonicalCols = isGridStack
    ? canvasLinkedCols
    : section.kind === 'stack-vertical'
      ? 1
      : Math.max(1, Math.round(section.layout.w));
  const renderedCols = canvasLinkedCols;
  const overlayCompactType = 'vertical';
  const innerWidth = Math.max(measuredStackWidth || Math.round(stackWidth), 1);
  const marginX = rootMargin;
  const marginY = rootMargin;
  const stackInsetX = 0;
  const horizontalContentCols = useMemo(
    () =>
      Math.max(
        1,
        stackWidgets.reduce((sum, widget) => sum + Math.max(1, Math.round(widget.layout.w)), 0),
      ),
    [stackWidgets],
  );
  const cols = isHorizontalStack ? horizontalContentCols : Math.max(1, renderedCols);
  const horizontalCardWidth = Math.max(170, Math.min(320, Math.round(innerWidth / Math.max(1, Math.min(3, stackWidgets.length || 1)))));
  const gridWidth = isHorizontalStack
    ? Math.max(
        innerWidth,
        cols * horizontalCardWidth + Math.max(0, cols - 1) * marginX + stackInsetX * 2,
      )
    : innerWidth;
  const stackColWidth = Math.max(
    1,
    (Math.max(1, gridWidth - stackInsetX * 2) - Math.max(0, cols - 1) * marginX) / Math.max(1, cols),
  );
  const rowHeight = Math.max(1, Math.round(rootRowHeight));
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
    if (!isXsLongPressMode) {
      resetXsLongPressState();
    }
  }, [isXsLongPressMode, resetXsLongPressState]);
  useEffect(() => {
    return () => {
      resetXsLongPressState();
    };
  }, [resetXsLongPressState]);
  useEffect(() => {
    const host = stackHostRef.current;
    if (!host || typeof ResizeObserver === 'undefined') {
      return;
    }

    const updateMeasuredWidth = () => {
      const rawWidth = host.getBoundingClientRect().width;
      const rounded = Math.max(1, Math.round(rawWidth));
      const previous = stableWidthRef.current;
      if (previous <= 0) {
        stableWidthRef.current = rounded;
        setMeasuredStackWidth(rounded);
        return;
      }
      const delta = Math.abs(rounded - previous);
      // Ignore tiny jitter from sub-pixel / scrollbar paint churn.
      if (delta < 3) {
        return;
      }
      stableWidthRef.current = rounded;
      setMeasuredStackWidth(rounded);
    };

    let rafId = 0;
    const updateWidth = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateMeasuredWidth();
      });
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(host);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!ENABLE_STACK_ADAPTIVE_MIN_WIDTH || !isGridStack) {
      setIsAdaptiveSpanEnabled(false);
      return;
    }
    setIsAdaptiveSpanEnabled((current) => {
      if (current) {
        return stackColWidth < ADAPTIVE_SPAN_DISABLE_COL_WIDTH_PX;
      }
      return stackColWidth <= ADAPTIVE_SPAN_ENABLE_COL_WIDTH_PX;
    });
  }, [isGridStack, stackColWidth]);
  const stackWidgetMinWidthById = useMemo(() => {
    const next = new Map<string, number>();
    stackWidgets.forEach((widget) => {
      next.set(widget.id, STACK_WIDGET_MIN_WIDTH_PX[widget.kind] ?? 156);
    });
    return next;
  }, [stackWidgets]);
  const stackLightWidgetStateById = useMemo(
    () =>
      new Map(
        stackWidgets
          .filter((widget) => widget.kind === 'light')
          .map((widget) => [widget.id, widget.isOn] as const),
      ),
    [stackWidgets],
  );
  const stackSwitchWidgetIds = useMemo(
    () =>
      new Set(
        stackWidgets
          .filter((widget) => widget.kind === 'switch')
          .map((widget) => widget.id),
      ),
    [stackWidgets],
  );
  const stackClimateWidgetIds = useMemo(
    () =>
      new Set(
        stackWidgets
          .filter((widget) => widget.kind === 'climate')
          .map((widget) => widget.id),
      ),
    [stackWidgets],
  );
  const stackCameraWidgetIds = useMemo(
    () =>
      new Set(
        stackWidgets
          .filter((widget) => widget.kind === 'camera')
          .map((widget) => widget.id),
      ),
    [stackWidgets],
  );
  const stackCoverWidgetIds = useMemo(
    () =>
      new Set(
        stackWidgets
          .filter((widget) => widget.kind === 'cover')
          .map((widget) => widget.id),
      ),
    [stackWidgets],
  );
  const stackVacuumWidgetIds = useMemo(
    () =>
      new Set(
        stackWidgets
          .filter((widget) => widget.kind === 'vacuum')
          .map((widget) => widget.id),
      ),
    [stackWidgets],
  );
  const stackMediaWidgetIds = useMemo(
    () =>
      new Set(
        stackWidgets
          .filter((widget) => widget.kind === 'media')
          .map((widget) => widget.id),
      ),
    [stackWidgets],
  );
  const stackSensorWidgetIds = useMemo(
    () =>
      new Set(
        stackWidgets
          .filter((widget) => widget.kind === 'sensor')
          .map((widget) => widget.id),
      ),
    [stackWidgets],
  );
  const stackMembersWidgetIds = useMemo(
    () =>
      new Set(
        stackWidgets
          .filter((widget) => widget.kind === 'members')
          .map((widget) => widget.id),
      ),
    [stackWidgets],
  );
  const stackAlarmWidgetIds = useMemo(
    () =>
      new Set(
        stackWidgets
          .filter((widget) => widget.kind === 'alarm')
          .map((widget) => widget.id),
      ),
    [stackWidgets],
  );
  const stackLockWidgetIds = useMemo(
    () =>
      new Set(
        stackWidgets
          .filter((widget) => widget.kind === 'lock')
          .map((widget) => widget.id),
      ),
    [stackWidgets],
  );
  const stackLayout = useMemo<GridItem[]>(
    () => {
      if (isHorizontalStack) {
        let cursorX = 0;
        return [...stackWidgets]
          .sort((first, second) => {
            const firstY = Math.max(0, Math.round(first.layout.y));
            const secondY = Math.max(0, Math.round(second.layout.y));
            if (firstY !== secondY) {
              return firstY - secondY;
            }
            const firstX = Math.max(0, Math.round(first.layout.x));
            const secondX = Math.max(0, Math.round(second.layout.x));
            if (firstX !== secondX) {
              return firstX - secondX;
            }
            return first.id.localeCompare(second.id, 'it-IT');
          })
          .map((widget) => {
            const safeW = Math.max(1, Math.round(widget.layout.w));
            const safeH = Math.max(1, Math.round(widget.layout.h));
            const next = {
              i: widget.id,
              x: cursorX,
              y: 0,
              w: safeW,
              h: safeH,
            };
            cursorX += safeW;
            return next;
          });
      }
      if (isGridStack) {
        const baseLayouts = enforceGridStackWidgetSpans(
          stackWidgets.map((widget) => ({
            i: widget.id,
            x: Math.max(0, Math.round(widget.layout.x)),
            y: Math.max(0, Math.round(widget.layout.y)),
            w: Math.max(1, Math.round(widget.layout.w)),
            h: Math.max(1, Math.round(widget.layout.h)),
          })),
          gridBreakpoint,
          cols,
          stackLightWidgetStateById,
          Boolean(widgetTypeLayoutOverrides.light?.[gridBreakpoint]),
          widgetTypeLayoutOverrides,
          stackSwitchWidgetIds,
          stackClimateWidgetIds,
          stackCameraWidgetIds,
          stackMediaWidgetIds,
          stackSensorWidgetIds,
          stackMembersWidgetIds,
          stackAlarmWidgetIds,
          stackVacuumWidgetIds,
          stackLockWidgetIds,
          stackCoverWidgetIds,
        );
        if (!ENABLE_STACK_ADAPTIVE_MIN_WIDTH || !isAdaptiveSpanEnabled) {
          return compactAndResolveLayout(baseLayouts, cols);
        }
        const adaptedLayouts = adaptLayoutsToMinWidth(
          baseLayouts,
          cols,
          stackColWidth,
          marginX,
          stackWidgetMinWidthById,
        );
        const enforcedAdaptedLayouts = enforceGridStackWidgetSpans(
          adaptedLayouts,
          gridBreakpoint,
          cols,
          stackLightWidgetStateById,
          Boolean(widgetTypeLayoutOverrides.light?.[gridBreakpoint]),
          widgetTypeLayoutOverrides,
          stackSwitchWidgetIds,
          stackClimateWidgetIds,
          stackCameraWidgetIds,
          stackMediaWidgetIds,
          stackSensorWidgetIds,
          stackMembersWidgetIds,
          stackAlarmWidgetIds,
          stackVacuumWidgetIds,
          stackLockWidgetIds,
          stackCoverWidgetIds,
        );
        return compactAndResolveLayout(enforcedAdaptedLayouts, cols);
      }
      return stackWidgets.map((widget) => {
        let next: GridItem = {
          i: widget.id,
          x: Math.max(0, Math.round(widget.layout.x)),
          y: Math.max(0, Math.round(widget.layout.y)),
          w: Math.max(1, Math.round(widget.layout.w)),
          h: Math.max(1, Math.round(widget.layout.h)),
        };

        if (section.kind === 'stack-vertical') {
          return {
            ...next,
            x: 0,
            w: 1,
          };
        }

        next = scaleLayoutColumns(next, canonicalCols, cols, { preserveSingleWidthCell: true });

        const safeW = Math.min(next.w, cols);
        const maxX = Math.max(0, cols - safeW);
        return {
          ...next,
          w: safeW,
          x: Math.min(next.x, maxX),
        };
      });
    },
    [
      canonicalCols,
      cols,
      gridBreakpoint,
      widgetTypeLayoutOverrides,
      isGridStack,
      isHorizontalStack,
      isAdaptiveSpanEnabled,
      marginX,
      section.kind,
      stackColWidth,
      stackLightWidgetStateById,
      stackSwitchWidgetIds,
      stackClimateWidgetIds,
      stackCameraWidgetIds,
      stackMediaWidgetIds,
      stackSensorWidgetIds,
      stackMembersWidgetIds,
      stackAlarmWidgetIds,
      stackVacuumWidgetIds,
      stackLockWidgetIds,
      stackCoverWidgetIds,
      stackWidgetMinWidthById,
      stackWidgets,
    ],
  );

  const stackShowBackground = section.stackShowBackground ?? true;
  const stackShowBorder = section.stackShowBorder ?? true;
  const stackSurfaceClass = stackShowBackground
    ? 'liquid-glass-card rounded-[1.5rem]'
    : stackShowBorder
      ? 'border border-white/[0.06] bg-transparent'
      : 'border border-transparent bg-transparent';
  const stackLayoutMap = useMemo(
    () => new Map((stackPreviewLayout ?? stackLayout).map((item) => [item.i, item])),
    [stackLayout, stackPreviewLayout],
  );
  const liveStackLayout = stackPreviewLayout ?? stackLayout;
  const stackCommittedUsedRows = useMemo(
    () =>
      Math.max(
        1,
        stackLayout.reduce(
          (maxRows, item) => Math.max(maxRows, Math.max(0, Math.round(item.y)) + Math.max(1, Math.round(item.h))),
          0,
        ),
      ),
    [stackLayout],
  );
  const hasGridItemMoved = useCallback((start: GridItem | null, next: GridItem | undefined | null) => {
    if (!start || !next) {
      return false;
    }
    return (
      Math.round(start.x) !== Math.round(next.x) ||
      Math.round(start.y) !== Math.round(next.y) ||
      Math.round(start.w) !== Math.round(next.w) ||
      Math.round(start.h) !== Math.round(next.h)
    );
  }, []);
  const updateStackPreviewLayout = useCallback((next: GridItem[]) => {
    const normalized = normalizeRuntimeLayout(next);
    const nextPreviewBase = isGridStack
      ? enforceGridStackWidgetSpans(
          normalized,
          gridBreakpoint,
          cols,
          stackLightWidgetStateById,
          Boolean(widgetTypeLayoutOverrides.light?.[gridBreakpoint]),
          widgetTypeLayoutOverrides,
          stackSwitchWidgetIds,
          stackClimateWidgetIds,
          stackCameraWidgetIds,
          stackMediaWidgetIds,
          stackSensorWidgetIds,
          stackMembersWidgetIds,
          stackAlarmWidgetIds,
          stackVacuumWidgetIds,
          stackLockWidgetIds,
          stackCoverWidgetIds,
        )
      : normalized;
    const nextPreview = isGridStack ? compactAndResolveLayout(nextPreviewBase, cols) : nextPreviewBase;
    setStackPreviewLayout((current) => (sameGridLayout(current, nextPreview) ? current : nextPreview));
  }, [
    cols,
    gridBreakpoint,
    widgetTypeLayoutOverrides,
    isGridStack,
    stackLightWidgetStateById,
    stackSwitchWidgetIds,
    stackClimateWidgetIds,
    stackCameraWidgetIds,
    stackMediaWidgetIds,
    stackSensorWidgetIds,
    stackMembersWidgetIds,
    stackAlarmWidgetIds,
    stackVacuumWidgetIds,
    stackLockWidgetIds,
    stackCoverWidgetIds,
  ]);
  useEffect(() => {
    if (!stackPreviewLayout || isStackInteractingRef.current) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setStackPreviewLayout(null);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [stackLayout, stackPreviewLayout]);
  useEffect(() => {
    if (!isGridStack || !onGridStackUsedRowsChange) {
      return;
    }
    onGridStackUsedRowsChange(section.id, stackCommittedUsedRows);
  }, [isGridStack, onGridStackUsedRowsChange, section.id, stackCommittedUsedRows]);
  const toCanonicalStackLayout = useCallback(
    (next: GridItem[]) => {
      if (isHorizontalStack) {
        let cursorX = 0;
        return [...next]
          .sort((first, second) => {
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
          })
          .map((item) => {
            const safeW = Math.max(1, Math.round(item.w));
            const safeH = Math.max(1, Math.round(item.h));
            const placed = {
              i: item.i,
              x: cursorX,
              y: 0,
              w: safeW,
              h: safeH,
            };
            cursorX += safeW;
            return placed;
          });
      }
      if (isGridStack) {
        return compactAndResolveLayout(
          enforceGridStackWidgetSpans(
            next.map((item) => clampLayoutToColumns(item, cols)),
            gridBreakpoint,
            cols,
            stackLightWidgetStateById,
            Boolean(widgetTypeLayoutOverrides.light?.[gridBreakpoint]),
            widgetTypeLayoutOverrides,
            stackSwitchWidgetIds,
            stackClimateWidgetIds,
            stackCameraWidgetIds,
            stackMediaWidgetIds,
            stackSensorWidgetIds,
            stackMembersWidgetIds,
            stackAlarmWidgetIds,
            stackVacuumWidgetIds,
            stackLockWidgetIds,
            stackCoverWidgetIds,
          ),
          cols,
        );
      }
      return next.map((item) => {
        let scaled =
          section.kind === 'stack-vertical'
            ? {
                i: item.i,
                x: 0,
                y: Math.max(0, Math.round(item.y)),
                w: 1,
                h: Math.max(1, Math.round(item.h)),
              }
            : scaleLayoutColumns(
                {
                  i: item.i,
                  x: Math.max(0, Math.round(item.x)),
                  y: Math.max(0, Math.round(item.y)),
                  w: Math.max(1, Math.round(item.w)),
                  h: Math.max(1, Math.round(item.h)),
                },
                cols,
                canonicalCols,
                { preserveSingleWidthCell: true },
              );
        return scaled;
      });
    },
    [
      canonicalCols,
      cols,
      gridBreakpoint,
      widgetTypeLayoutOverrides,
      isGridStack,
      isHorizontalStack,
      section.kind,
      stackLightWidgetStateById,
      stackSwitchWidgetIds,
      stackClimateWidgetIds,
      stackCameraWidgetIds,
      stackMediaWidgetIds,
      stackSensorWidgetIds,
      stackMembersWidgetIds,
      stackAlarmWidgetIds,
      stackVacuumWidgetIds,
      stackLockWidgetIds,
      stackCoverWidgetIds,
    ],
  );
  const commitStackLayout = useCallback(
    (next: GridItem[]) => {
      onWidgetLayoutChange(section.id, toCanonicalStackLayout(next));
    },
    [onWidgetLayoutChange, section.id, toCanonicalStackLayout],
  );

  return (
    <div
      className={`relative w-full flex-1 min-h-0 min-w-0 rounded-[1.5rem] p-0 ${stackSurfaceClass} ${
        isHorizontalStack ? 'overflow-x-auto overflow-y-hidden hide-scrollbar [scroll-behavior:smooth] [touch-action:pan-x]' : ''
      } ${
        isSelected ? 'selection-corners' : ''
      }`}
      onPointerDown={(event) => {
        if (!isEditMode) {
          return;
        }
        if (event.pointerType === 'mouse' && event.button !== 0) {
          return;
        }
        onSelectWidget(null);
        onSelectSection(section.id);
      }}
      onClick={() => {
        if (isEditMode) {
          onSelectWidget(null);
          onSelectSection(section.id);
        }
      }}
    >
      {isEditMode ? (
        <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] bg-[radial-gradient(#93c5fd3f_1px,transparent_1px)] bg-[size:16px_16px]" />
      ) : null}
      {isEditMode && isGridStack ? (
        <div className="liquid-glass-card pointer-events-none absolute right-2 top-2 z-20 rounded-md px-2 py-1 text-[10px] font-medium text-cyan-100">
          {`stack cols ${cols} | canvas cols ${canvasLinkedCols}`}
        </div>
      ) : null}
      {sectionsMounted ? (
        <div ref={stackHostRef} className="relative w-full min-h-0">
          {!isEditMode ? (
            <div
              className="grid min-h-0 min-w-0"
              style={{
                width: isHorizontalStack ? `${gridWidth}px` : '100%',
                gridTemplateColumns: `repeat(${Math.max(1, cols)}, minmax(0, 1fr))`,
                gridAutoRows: `${rowHeight}px`,
                columnGap: `${marginX}px`,
                rowGap: `${marginY}px`,
                paddingLeft: `${stackInsetX}px`,
                paddingRight: `${stackInsetX}px`,
              }}
            >
              {stackWidgets.map((widget) => {
                const value =
                  widget.entityId === 'sensor.nest_wifi_download'
                    ? state.wifiDownloadMbps
                    : widget.value ?? 0;
                const layout =
                  stackLayoutMap.get(widget.id) ?? {
                    i: widget.id,
                    x: 0,
                    y: 0,
                    w: 1,
                    h: 1,
                  };
                const rawW = Math.min(cols, Math.max(1, Math.round(layout.w)));
                const safeX = Math.min(Math.max(0, Math.round(layout.x)), Math.max(0, cols - rawW));
                const safeY = Math.max(0, Math.round(layout.y));
                const safeW = Math.min(rawW, Math.max(1, cols - safeX));
                const safeH = Math.max(1, Math.round(layout.h));
                const runtimeWidget =
                  stackLayoutMap.has(widget.id)
                    ? {
                        ...widget,
                        layout: {
                          ...widget.layout,
                          i: widget.id,
                          x: safeX,
                          y: safeY,
                          w: safeW,
                          h: safeH,
                        },
                      }
                    : widget;
                return (
                  <div
                    key={widget.id}
                    className="relative h-full w-full min-h-0 min-w-0 box-border"
                    style={{
                      gridColumn: `${safeX + 1} / span ${safeW}`,
                      gridRow: `${safeY + 1} / span ${safeH}`,
                    }}
                  >
                    <div
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
                        if (isEditMode && !isCompactEditCardMenuMode) {
                          onSelectWidget(widget.id);
                          onSelectSection(null);
                        }
                      }}
                      onPointerDown={(event) => {
                        if (!isEditMode) {
                          handleXsLongPressStart(event, widget);
                          return;
                        }
                        if (!isCompactEditCardMenuMode) {
                          event.stopPropagation();
                          onSelectWidget(widget.id);
                        }
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
                        widget={runtimeWidget}
                        dashboardState={state}
                        isEditMode={false}
                        isSelected={selectedWidgetId === widget.id}
                        gridBreakpoint={gridBreakpoint}
                        value={value}
                        onClick={() => {
                          if (isCompactEditCardMenuMode) {
                            return;
                          }
                          if (isXsLongPressMode) {
                            if (xsSuppressNextCardClickRef.current) {
                              xsSuppressNextCardClickRef.current = false;
                              return;
                            }
                            if (widget.kind === 'light') {
                              onWidgetLightToggle(widget);
                            }
                            if (widget.kind === 'switch') {
                              onWidgetSwitchToggle(widget);
                            }
                            return;
                          }
                          onWidgetClick(widget);
                        }}
                        onLightBrightnessChange={onWidgetBrightnessChange}
                        onSwitchToggle={onWidgetSwitchToggle}
                        onClimateTargetTempChange={onWidgetClimateTargetTempChange}
                        onClimateTargetRangeChange={onWidgetClimateTargetRangeChange}
                        onClimateModeChange={onWidgetClimateModeChange}
                        onClimateFanModeChange={onWidgetClimateFanModeChange}
                        onMediaToggle={onWidgetMediaToggle}
                        onMediaPrevious={onWidgetMediaPrevious}
                        onMediaNext={onWidgetMediaNext}
                        onMediaSeek={onWidgetMediaSeek}
                        onMediaSelectSource={onWidgetMediaSelectSource}
                        onAlarmDisarm={onWidgetAlarmDisarm}
                        onAlarmArm={onWidgetAlarmArm}
                        onVacuumStartPause={onWidgetVacuumStartPause}
                        onVacuumReturnToBase={onWidgetVacuumReturnToBase}
                        onLockToggle={onWidgetLockToggle}
                        onLockOpen={onWidgetLockOpen}
                        onMembersOpenPanel={() => onOpenMembersPanel()}
                        liveEntity={haConnected ? haStates[widget.entityId] : undefined}
                        sensorBatteryEntity={
                          haConnected && widget.sensorBatteryEntityId ? haStates[widget.sensorBatteryEntityId] : undefined
                        }
                        sensorHistory={sensorHistoryByEntity[widget.entityId]}
                        houseMembers={houseMembers}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          {isEditMode ? (
            <div className="absolute inset-0 z-30 m-0 h-full w-full p-0">
              <GridLayout
                className={`builder-grid relative h-full w-full m-0 p-0 ${isHorizontalStack ? 'horizontal-stack' : ''} is-editing`}
                width={gridWidth}
                layout={liveStackLayout}
                cols={cols}
                rowHeight={rowHeight}
                margin={[marginX, marginY]}
                containerPadding={[stackInsetX, 0]}
                useCSSTransforms
                isDraggable
                isResizable={false}
                compactType={overlayCompactType}
                draggableCancel=".widget-action,.react-resizable-handle"
                onDragStart={(_, item) => {
                  isStackInteractingRef.current = true;
                  const dragged = item as GridItem | undefined;
                  stackDragStartItemRef.current = dragged ? { ...dragged } : null;
                  hasStackDragMovedRef.current = false;
                  draggingStackItemRef.current = dragged ?? null;
                  if (item?.i && !isCompactEditCardMenuMode) {
                    onSelectWidget(item.i);
                    onSelectSection(null);
                  }
                }}
                onDrag={(_next, _oldItem, newItem) => {
                  const dragged = newItem as GridItem | undefined;
                  draggingStackItemRef.current = dragged ?? null;
                  if (!hasGridItemMoved(stackDragStartItemRef.current, dragged)) {
                    return;
                  }
                  hasStackDragMovedRef.current = true;
                }}
                onDragStop={(next, _oldItem, newItem) => {
                  const dragged = newItem as GridItem | undefined;
                  const hasMoved =
                    hasStackDragMovedRef.current ||
                    hasGridItemMoved(stackDragStartItemRef.current, dragged);
                  isStackInteractingRef.current = false;
                  draggingStackItemRef.current = null;
                  stackDragStartItemRef.current = null;
                  hasStackDragMovedRef.current = false;
                  if (!hasMoved) {
                    setStackPreviewLayout(null);
                    return;
                  }
                  commitStackLayout(next as GridItem[]);
                }}
                onLayoutChange={(next) => {
                  if (!isStackInteractingRef.current || !hasStackDragMovedRef.current) {
                    return;
                  }
                  updateStackPreviewLayout(next as GridItem[]);
                }}
              >
                {liveStackLayout.map((item) => {
                  const overlayWidget = stackWidgets.find((widget) => widget.id === item.i);
                  const overlayRuntimeWidget = overlayWidget
                    ? {
                        ...overlayWidget,
                        layout: {
                          ...overlayWidget.layout,
                          i: item.i,
                          x: Math.max(0, Math.round(item.x)),
                          y: Math.max(0, Math.round(item.y)),
                          w: Math.max(1, Math.round(item.w)),
                          h: Math.max(1, Math.round(item.h)),
                        },
                      }
                    : null;
                  const overlayValue =
                    overlayWidget?.entityId === 'sensor.nest_wifi_download'
                      ? state.wifiDownloadMbps
                      : overlayWidget?.value ?? 0;
                  return (
                    <div key={item.i} className="relative h-full w-full m-0 p-0">
                      {overlayRuntimeWidget ? (
                        <div className="pointer-events-none absolute inset-0 m-0 h-full w-full overflow-hidden">
                          <WidgetCardRenderer
                            widget={overlayRuntimeWidget}
                            dashboardState={state}
                            isEditMode={false}
                            isSelected={selectedWidgetId === item.i}
                            gridBreakpoint={gridBreakpoint}
                            value={overlayValue}
                            onClick={() => {}}
                            onLightBrightnessChange={onWidgetBrightnessChange}
                            onSwitchToggle={onWidgetSwitchToggle}
                            onClimateTargetTempChange={onWidgetClimateTargetTempChange}
                            onClimateTargetRangeChange={onWidgetClimateTargetRangeChange}
                            onClimateModeChange={onWidgetClimateModeChange}
                            onClimateFanModeChange={onWidgetClimateFanModeChange}
                            onMediaToggle={onWidgetMediaToggle}
                            onMediaPrevious={onWidgetMediaPrevious}
                            onMediaNext={onWidgetMediaNext}
                            onMediaSeek={onWidgetMediaSeek}
                            onMediaSelectSource={onWidgetMediaSelectSource}
                            onAlarmDisarm={onWidgetAlarmDisarm}
                            onAlarmArm={onWidgetAlarmArm}
                            onVacuumStartPause={onWidgetVacuumStartPause}
                            onVacuumReturnToBase={onWidgetVacuumReturnToBase}
                            onLockToggle={onWidgetLockToggle}
                            onLockOpen={onWidgetLockOpen}
                            onMembersOpenPanel={() => onOpenMembersPanel()}
                            liveEntity={haConnected ? haStates[overlayRuntimeWidget.entityId] : undefined}
                            sensorBatteryEntity={
                              haConnected && overlayRuntimeWidget.sensorBatteryEntityId
                                ? haStates[overlayRuntimeWidget.sensorBatteryEntityId]
                                : undefined
                            }
                            sensorHistory={sensorHistoryByEntity[overlayRuntimeWidget.entityId]}
                            houseMembers={houseMembers}
                          />
                        </div>
                      ) : null}
                      <button
                        type="button"
                        className="absolute inset-0 m-0 h-full w-full rounded-[1rem] border-0 bg-transparent p-0 cursor-grab active:cursor-grabbing"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          if (!isCompactEditCardMenuMode) {
                            onSelectWidget(item.i);
                            onSelectSection(null);
                          }
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!isCompactEditCardMenuMode) {
                            onSelectWidget(item.i);
                            onSelectSection(null);
                          }
                        }}
                        aria-label={`Muovi ${overlayWidget?.title || item.i}`}
                      />
                      {isCompactEditCardMenuMode ? (
                        <button
                          type="button"
                          className="widget-action absolute right-2 top-2 z-40 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/85 shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:bg-white/15 hover:text-white active:scale-95"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectWidget(item.i);
                            onSelectSection(null);
                          }}
                          aria-label={`Configura ${overlayWidget?.title || item.i}`}
                          title="Configura card"
                        >
                          <MoreHorizontal size={18} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </GridLayout>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const StackGrid = memo(StackGridComponent);
