import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GridLayout from 'react-grid-layout/legacy';
import { WidgetCardRenderer } from '../widgets/CardRenderer';
import type { DashboardStateShape } from '../../hooks/useDashboardState';
import type { DashboardSection, GridItem, Widget } from '../../types/dashboardModels';
import type { MockEntityStateMap } from '../../types/ha';
import {
  ALARM_WIDGET_SPAN_BY_BREAKPOINT,
  CAMERA_WIDGET_SPAN_BY_BREAKPOINT,
  CLIMATE_WIDGET_SPAN_BY_BREAKPOINT,
  COVER_WIDGET_SPAN_BY_BREAKPOINT,
  LIGHT_WIDGET_SPAN_BY_BREAKPOINT,
  LOCK_WIDGET_SPAN_BY_BREAKPOINT,
  MEDIA_WIDGET_SPAN_BY_BREAKPOINT,
  SENSOR_WIDGET_SPAN_BY_BREAKPOINT,
  STACK_GRID_COLS_BY_BREAKPOINT,
  VACUUM_WIDGET_SPAN_BY_BREAKPOINT,
  type GridEngineBreakpoint,
} from './dashboardBreakpointConfig';

const STACK_WIDGET_MIN_WIDTH_PX: Record<Widget['kind'], number> = {
  light: 168,
  climate: 208,
  camera: 208,
  sensor: 156,
  media: 224,
  alarm: 200,
  vacuum: 208,
  lock: 168,
  cover: 168,
};
const ADAPTIVE_SPAN_ENABLE_COL_WIDTH_PX = 78;
const ADAPTIVE_SPAN_DISABLE_COL_WIDTH_PX = 90;
const XS_CONTEXT_OPEN_LONG_PRESS_MS = 420;
const XS_CONTEXT_OPEN_MOVE_TOLERANCE_PX = 14;

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

  // Keep true single-cell cards (w=1) as single-cell even when columns are rescaled.
  // This preserves 1x1 visual behavior across stack/canvas on narrow viewports.
  if (normalizedW === 1) {
    const sourceMaxX = Math.max(0, safeSourceCols - 1);
    const sourceSafeX = Math.min(normalizedX, sourceMaxX);
    let safeX = 0;
    if (safeSourceCols > 1 && safeTargetCols > 1) {
      const ratio = sourceSafeX / (safeSourceCols - 1);
      safeX = Math.round(ratio * (safeTargetCols - 1));
    }
    safeX = Math.min(Math.max(0, safeX), safeTargetCols - 1);
    return {
      i: item.i,
      x: safeX,
      y: normalizedY,
      w: 1,
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

function normalizeRuntimeLayout(next: GridItem[]): GridItem[] {
  return next.map((item) => ({
    i: item.i,
    x: Math.max(0, Math.round(item.x)),
    y: Math.max(0, Math.round(item.y)),
    w: Math.max(1, Math.round(item.w)),
    h: Math.max(1, Math.round(item.h)),
  }));
}

function clampLayoutToColumns(item: GridItem, cols: number): GridItem {
  const safeCols = Math.max(1, Math.round(cols));
  const safeW = Math.min(safeCols, Math.max(1, Math.round(item.w)));
  const maxX = Math.max(0, safeCols - safeW);

  return {
    i: item.i,
    x: Math.min(Math.max(0, Math.round(item.x)), maxX),
    y: Math.max(0, Math.round(item.y)),
    w: safeW,
    h: Math.max(1, Math.round(item.h)),
  };
}

function intersects(
  first: Pick<GridItem, 'x' | 'y' | 'w' | 'h'>,
  second: Pick<GridItem, 'x' | 'y' | 'w' | 'h'>,
) {
  return (
    first.x < second.x + second.w &&
    first.x + first.w > second.x &&
    first.y < second.y + second.h &&
    first.y + first.h > second.y
  );
}

function findFirstFreePosition(
  occupied: Array<Pick<GridItem, 'x' | 'y' | 'w' | 'h'>>,
  cols: number,
  width: number,
  height: number,
) {
  const safeCols = Math.max(1, Math.round(cols));
  const safeW = Math.min(safeCols, Math.max(1, Math.round(width)));
  const safeH = Math.max(1, Math.round(height));
  const maxBottom = occupied.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  const searchLimit = maxBottom + 40;

  for (let y = 0; y <= searchLimit; y += 1) {
    for (let x = 0; x <= safeCols - safeW; x += 1) {
      const candidate = { x, y, w: safeW, h: safeH };
      if (!occupied.some((item) => intersects(candidate, item))) {
        return { x, y };
      }
    }
  }

  return { x: 0, y: maxBottom };
}

function reflowLayoutsToColumns(layouts: GridItem[], cols: number): GridItem[] {
  const safeCols = Math.max(1, Math.round(cols));
  const placed: GridItem[] = [];
  const ordered = [...layouts].sort((first, second) => {
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

  ordered.forEach((item) => {
    const normalized = clampLayoutToColumns(item, safeCols);
    const position = findFirstFreePosition(placed, safeCols, normalized.w, normalized.h);
    placed.push({
      ...normalized,
      x: position.x,
      y: position.y,
    });
  });

  return placed;
}

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

function enforceClimateWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  climateWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (climateWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
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
  );
}

function enforceCameraWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  cameraWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (cameraWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
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
  );
}

function enforceCoverWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  coverWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (coverWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
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
  );
}

function enforceMediaWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  mediaWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (mediaWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
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
  );
}

function enforceVacuumWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  vacuumWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (vacuumWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
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
  );
}

function enforceSensorWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  sensorWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (sensorWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
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
  );
}

function enforceAlarmWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  alarmWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (alarmWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
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
  );
}

function enforceLockWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  lockWidgetIds: ReadonlySet<string>,
): GridItem[] {
  if (lockWidgetIds.size === 0) {
    return normalizeRuntimeLayout(layouts);
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
  );
}

function enforceLightWidgetSpan(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  lightWidgetStateById: ReadonlyMap<string, boolean>,
): GridItem[] {
  if (lightWidgetStateById.size === 0) {
    return normalizeRuntimeLayout(layouts);
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
      return {
        ...item,
        w: forcedW,
        h: Math.max(1, Math.round(lightIsOn ? span.hOn : span.hOff)),
      };
    }),
  );
}

function enforceGridStackWidgetSpans(
  layouts: GridItem[],
  breakpoint: GridEngineBreakpoint,
  cols: number,
  lightWidgetStateById: ReadonlyMap<string, boolean>,
  climateWidgetIds: ReadonlySet<string>,
  cameraWidgetIds: ReadonlySet<string>,
  mediaWidgetIds: ReadonlySet<string>,
  sensorWidgetIds: ReadonlySet<string>,
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
  const withAlarm = enforceAlarmWidgetSpan(withSensor, breakpoint, cols, alarmWidgetIds);
  const withLock = enforceLockWidgetSpan(withAlarm, breakpoint, cols, lockWidgetIds);
  const withVacuum = enforceVacuumWidgetSpan(withLock, breakpoint, cols, vacuumWidgetIds);
  return enforceCoverWidgetSpan(withVacuum, breakpoint, cols, coverWidgetIds);
}

type StackGridProps = {
  isEditMode: boolean;
  isXsViewport: boolean;
  sectionsMounted: boolean;
  state: DashboardStateShape;
  section: DashboardSection;
  gridBreakpoint: GridEngineBreakpoint;
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
  onWidgetBrightnessChange: (widget: Widget, value: number) => void;
  onWidgetClimateTargetTempChange: (widget: Widget, value: number) => void;
  onWidgetClimateTargetRangeChange: (widget: Widget, low: number, high: number) => void;
  onWidgetClimateModeChange: (widget: Widget, mode: string) => void;
  onWidgetClimateFanModeChange: (widget: Widget, mode: string) => void;
  onWidgetMediaToggle: (widget: Widget) => void;
  onWidgetMediaSeek: (widget: Widget, position: number) => void;
  onWidgetAlarmDisarm: (widget: Widget) => void;
  onWidgetAlarmArm: (widget: Widget, mode: 'home' | 'away' | 'night' | 'vacation' | 'custom_bypass') => void;
  onWidgetVacuumStartPause: (widget: Widget) => void;
  onWidgetVacuumReturnToBase: (widget: Widget) => void;
  onWidgetLockToggle: (widget: Widget) => void;
  onWidgetLockOpen: (widget: Widget) => void;
  onWidgetLayoutChange: (sectionId: string, next: GridItem[]) => void;
  haConnected: boolean;
  haStates: MockEntityStateMap;
};

function StackGridComponent({
  isEditMode,
  isXsViewport,
  sectionsMounted,
  state,
  section,
  gridBreakpoint,
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
  onWidgetBrightnessChange,
  onWidgetClimateTargetTempChange,
  onWidgetClimateTargetRangeChange,
  onWidgetClimateModeChange,
  onWidgetClimateFanModeChange,
  onWidgetMediaToggle,
  onWidgetMediaSeek,
  onWidgetAlarmDisarm,
  onWidgetAlarmArm,
  onWidgetVacuumStartPause,
  onWidgetVacuumReturnToBase,
  onWidgetLockToggle,
  onWidgetLockOpen,
  onWidgetLayoutChange,
  haConnected,
  haStates,
}: StackGridProps) {
  const isStackInteractingRef = useRef(false);
  const xsLongPressTimerRef = useRef<number | null>(null);
  const xsLongPressPointerIdRef = useRef<number | null>(null);
  const xsLongPressStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const xsSuppressNextCardClickRef = useRef(false);
  const stackHostRef = useRef<HTMLDivElement | null>(null);
  const [stackPreviewLayout, setStackPreviewLayout] = useState<GridItem[] | null>(null);
  const [measuredStackWidth, setMeasuredStackWidth] = useState(0);
  const [isAdaptiveSpanEnabled, setIsAdaptiveSpanEnabled] = useState(false);
  const stableWidthRef = useRef(0);
  const isHorizontalStack = section.kind === 'stack-horizontal';
  const isGridStack = section.kind === 'stack-grid';
  const canvasLinkedCols = section.kind === 'stack-vertical' ? 1 : Math.max(1, Math.round(sectionCanvasCols));
  const gridStackBreakpointCols = Math.max(1, Math.round(STACK_GRID_COLS_BY_BREAKPOINT[gridBreakpoint] ?? 1));
  const gridStackCols = Math.max(canvasLinkedCols, gridStackBreakpointCols);
  const canonicalCols = isGridStack
    ? canvasLinkedCols
    : section.kind === 'stack-vertical'
      ? 1
      : Math.max(1, Math.round(section.layout.w));
  const renderedCols = isGridStack ? gridStackCols : canvasLinkedCols;
  const overlayCompactType = isHorizontalStack ? 'horizontal' : null;
  const innerWidth = Math.max(measuredStackWidth || Math.round(stackWidth), 1);
  const marginX = rootMargin;
  const marginY = rootMargin;
  const stackInsetX = 0;
  const cols = isHorizontalStack ? Math.max(1, stackWidgets.length) : Math.max(1, renderedCols);
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
    if (!isGridStack) {
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
          .map((widget, index) => ({
            i: widget.id,
            x: index,
            y: 0,
            w: 1,
            h: 1,
          }));
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
          stackClimateWidgetIds,
          stackCameraWidgetIds,
          stackMediaWidgetIds,
          stackSensorWidgetIds,
          stackAlarmWidgetIds,
          stackLockWidgetIds,
          stackVacuumWidgetIds,
          stackCoverWidgetIds,
        );
        if (!isAdaptiveSpanEnabled) {
          return reflowLayoutsToColumns(baseLayouts, cols);
        }
        const adaptedLayouts = enforceGridStackWidgetSpans(
          adaptLayoutsToMinWidth(
            baseLayouts,
            cols,
            stackColWidth,
            marginX,
            stackWidgetMinWidthById,
          ),
          gridBreakpoint,
          cols,
          stackLightWidgetStateById,
          stackClimateWidgetIds,
          stackCameraWidgetIds,
          stackMediaWidgetIds,
          stackSensorWidgetIds,
          stackAlarmWidgetIds,
          stackLockWidgetIds,
          stackVacuumWidgetIds,
          stackCoverWidgetIds,
        );
        return reflowLayoutsToColumns(
          adaptedLayouts,
          cols,
        );
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

        if (section.kind === 'stack-horizontal') {
          next = {
            ...next,
            h: 1,
          };
        }

        next = scaleLayoutColumns(next, canonicalCols, cols);

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
      isGridStack,
      isHorizontalStack,
      isAdaptiveSpanEnabled,
      marginX,
      section.kind,
      stackColWidth,
      stackLightWidgetStateById,
      stackClimateWidgetIds,
      stackCameraWidgetIds,
      stackMediaWidgetIds,
      stackSensorWidgetIds,
      stackAlarmWidgetIds,
      stackLockWidgetIds,
      stackVacuumWidgetIds,
      stackCoverWidgetIds,
      stackWidgetMinWidthById,
      stackWidgets,
    ],
  );

  const stackShowBackground = section.stackShowBackground ?? true;
  const stackShowBorder = section.stackShowBorder ?? true;
  const stackBackgroundClass = stackShowBackground ? 'bg-black/15' : 'bg-transparent';
  const stackBorderClass = stackShowBorder ? 'border border-white/10' : 'border border-transparent';
  const stackLayoutMap = useMemo(
    () => new Map((stackPreviewLayout ?? stackLayout).map((item) => [item.i, item])),
    [stackLayout, stackPreviewLayout],
  );
  const liveStackLayout = stackPreviewLayout ?? stackLayout;
  const updateStackPreviewLayout = useCallback((next: GridItem[]) => {
    const normalized = normalizeRuntimeLayout(next);
    setStackPreviewLayout(
      isGridStack
        ? enforceGridStackWidgetSpans(
            normalized,
            gridBreakpoint,
            cols,
            stackLightWidgetStateById,
            stackClimateWidgetIds,
            stackCameraWidgetIds,
            stackMediaWidgetIds,
            stackSensorWidgetIds,
            stackAlarmWidgetIds,
            stackLockWidgetIds,
            stackVacuumWidgetIds,
            stackCoverWidgetIds,
          )
        : normalized,
    );
  }, [
    cols,
    gridBreakpoint,
    isGridStack,
    stackLightWidgetStateById,
    stackClimateWidgetIds,
    stackCameraWidgetIds,
    stackMediaWidgetIds,
    stackSensorWidgetIds,
    stackAlarmWidgetIds,
    stackLockWidgetIds,
    stackVacuumWidgetIds,
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
  const toCanonicalStackLayout = useCallback(
    (next: GridItem[]) => {
      if (isHorizontalStack) {
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
          .map((item, index) => ({
            i: item.i,
            x: index,
            y: 0,
            w: 1,
            h: 1,
          }));
      }
      if (isGridStack) {
        return enforceGridStackWidgetSpans(
          next.map((item) => clampLayoutToColumns(item, cols)),
          gridBreakpoint,
          cols,
          stackLightWidgetStateById,
          stackClimateWidgetIds,
          stackCameraWidgetIds,
          stackMediaWidgetIds,
          stackSensorWidgetIds,
          stackAlarmWidgetIds,
          stackLockWidgetIds,
          stackVacuumWidgetIds,
          stackCoverWidgetIds,
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
              );
        if (section.kind === 'stack-horizontal') {
          scaled = {
            ...scaled,
            h: 1,
          };
        }
        return scaled;
      });
    },
    [
      canonicalCols,
      cols,
      gridBreakpoint,
      isGridStack,
      isHorizontalStack,
      section.kind,
      stackLightWidgetStateById,
      stackClimateWidgetIds,
      stackCameraWidgetIds,
      stackMediaWidgetIds,
      stackSensorWidgetIds,
      stackAlarmWidgetIds,
      stackLockWidgetIds,
      stackVacuumWidgetIds,
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
      className={`relative w-full flex-1 min-h-0 min-w-0 rounded-[1.5rem] p-0 ${stackBackgroundClass} ${stackBorderClass} ${
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
        <div className="pointer-events-none absolute right-2 top-2 z-20 rounded-md border border-cyan-200/35 bg-slate-900/55 px-2 py-1 text-[10px] font-medium text-cyan-100">
          {`stack cols ${cols} | canvas cols ${canvasLinkedCols}`}
        </div>
      ) : null}
      {sectionsMounted ? (
        <div ref={stackHostRef} className="relative w-full min-h-0">
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
              const previewWidget =
                stackPreviewLayout && stackLayoutMap.has(widget.id)
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
                      if (isEditMode) {
                        onSelectWidget(widget.id);
                        onSelectSection(null);
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
                      widget={previewWidget}
                      dashboardState={state}
                      isEditMode={false}
                      isSelected={selectedWidgetId === widget.id}
                      gridBreakpoint={gridBreakpoint}
                      value={value}
                      onClick={() => {
                        if (isXsLongPressMode) {
                          if (xsSuppressNextCardClickRef.current) {
                            xsSuppressNextCardClickRef.current = false;
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
                      onMediaSeek={onWidgetMediaSeek}
                      onAlarmDisarm={onWidgetAlarmDisarm}
                      onAlarmArm={onWidgetAlarmArm}
                      onVacuumStartPause={onWidgetVacuumStartPause}
                      onVacuumReturnToBase={onWidgetVacuumReturnToBase}
                      onLockToggle={onWidgetLockToggle}
                      onLockOpen={onWidgetLockOpen}
                      liveEntity={haConnected ? haStates[widget.entityId] : undefined}
                    />
                  </div>
                </div>
              );
            })}
          </div>
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
                isDraggable
                isResizable={!isHorizontalStack}
                resizeHandles={['se']}
                compactType={overlayCompactType}
                draggableCancel=".react-resizable-handle"
                onDragStart={(_, item) => {
                  isStackInteractingRef.current = true;
                  updateStackPreviewLayout(liveStackLayout);
                  if (item?.i) {
                    onSelectWidget(item.i);
                    onSelectSection(null);
                  }
                }}
                onResizeStart={(_, item) => {
                  isStackInteractingRef.current = true;
                  updateStackPreviewLayout(liveStackLayout);
                  if (item?.i) {
                    onSelectWidget(item.i);
                    onSelectSection(null);
                  }
                }}
                onDrag={(next) => {
                  updateStackPreviewLayout(next as GridItem[]);
                }}
                onResize={(next) => {
                  updateStackPreviewLayout(next as GridItem[]);
                }}
                onDragStop={(next) => {
                  updateStackPreviewLayout(next as GridItem[]);
                  isStackInteractingRef.current = false;
                  commitStackLayout(next as GridItem[]);
                }}
                onResizeStop={(next) => {
                  updateStackPreviewLayout(next as GridItem[]);
                  isStackInteractingRef.current = false;
                  commitStackLayout(next as GridItem[]);
                }}
                onLayoutChange={(next) => {
                  if (!isStackInteractingRef.current) {
                    return;
                  }
                  updateStackPreviewLayout(next as GridItem[]);
                }}
              >
                {liveStackLayout.map((item) => (
                  <div key={item.i} className="relative h-full w-full m-0 p-0">
                    <button
                      type="button"
                      className="absolute inset-0 m-0 h-full w-full rounded-[1rem] border-0 bg-transparent p-0 cursor-grab active:cursor-grabbing"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        onSelectWidget(item.i);
                        onSelectSection(null);
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectWidget(item.i);
                        onSelectSection(null);
                      }}
                      aria-label={`Muovi ${item.i}`}
                    />
                  </div>
                ))}
              </GridLayout>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const StackGrid = memo(StackGridComponent);
