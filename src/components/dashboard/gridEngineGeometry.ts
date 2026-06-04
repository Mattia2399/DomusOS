import type { GridItem } from '../../types/dashboardModels';

export type ScaleLayoutColumnsOptions = {
  preserveSingleWidthCell?: boolean;
};

export function normalizeRuntimeLayout(next: readonly GridItem[], cols?: number): GridItem[] {
  const hasCols = typeof cols === 'number' && Number.isFinite(cols) && cols > 0;
  const safeCols = hasCols ? Math.max(1, Math.round(cols)) : undefined;
  return next.map((item) => {
    const safeH = Math.max(1, Math.round(item.h));
    const safeY = Math.max(0, Math.round(item.y));
    if (!safeCols) {
      return {
        i: item.i,
        x: Math.max(0, Math.round(item.x)),
        y: safeY,
        w: Math.max(1, Math.round(item.w)),
        h: safeH,
      };
    }
    const safeW = Math.min(safeCols, Math.max(1, Math.round(item.w)));
    const maxX = Math.max(0, safeCols - safeW);
    return {
      i: item.i,
      x: Math.min(Math.max(0, Math.round(item.x)), maxX),
      y: safeY,
      w: safeW,
      h: safeH,
    };
  });
}

export function scaleLayoutColumns(
  item: GridItem,
  sourceCols: number,
  targetCols: number,
  options?: ScaleLayoutColumnsOptions,
): GridItem {
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

  if (options?.preserveSingleWidthCell && normalizedW === 1) {
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

export function clampLayoutToColumns(item: GridItem, cols: number): GridItem {
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

export function intersects(first: Pick<GridItem, 'x' | 'y' | 'w' | 'h'>, second: Pick<GridItem, 'x' | 'y' | 'w' | 'h'>) {
  return (
    first.x < second.x + second.w &&
    first.x + first.w > second.x &&
    first.y < second.y + second.h &&
    first.y + first.h > second.y
  );
}

export function sortByTopLeft(layouts: GridItem[]) {
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

export function compactLayoutUp(layouts: GridItem[], cols: number): GridItem[] {
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

export function packLayoutDense(layouts: GridItem[], cols: number): GridItem[] {
  const safeCols = Math.max(1, Math.round(cols));
  const ordered = sortByTopLeft(layouts.map((item) => clampLayoutToColumns(item, safeCols)));
  const placed: GridItem[] = [];
  const maxSearchY =
    ordered.reduce((sum, entry) => sum + Math.max(1, Math.round(entry.h)), 0) +
    ordered.reduce((maxY, entry) => Math.max(maxY, Math.max(0, Math.round(entry.y))), 0) +
    ordered.length;

  ordered.forEach((item) => {
    const safeW = Math.min(safeCols, Math.max(1, Math.round(item.w)));
    const safeH = Math.max(1, Math.round(item.h));
    const maxX = Math.max(0, safeCols - safeW);
    let placedItem: GridItem | null = null;

    for (let y = 0; y <= maxSearchY && !placedItem; y += 1) {
      for (let x = 0; x <= maxX; x += 1) {
        const candidate = { i: item.i, x, y, w: safeW, h: safeH };
        if (!placed.some((existing) => intersects(candidate, existing))) {
          placedItem = candidate;
          break;
        }
      }
    }

    if (!placedItem) {
      const fallbackY = placed.reduce((maxY, entry) => Math.max(maxY, entry.y + entry.h), 0);
      placedItem = {
        i: item.i,
        x: 0,
        y: fallbackY,
        w: safeW,
        h: safeH,
      };
    }

    placed.push(placedItem);
  });

  return placed;
}

export function isSmallOneByOne(item: GridItem) {
  return Math.max(1, Math.round(item.w)) === 1 && Math.max(1, Math.round(item.h)) === 1;
}

export function adaptToMobileColumns(
  layouts: GridItem[],
  sourceCols: number,
  targetCols: number,
  smallOneByOneIds?: ReadonlySet<string>,
): GridItem[] {
  const safeCols = Math.max(1, Math.round(targetCols));
  const halfSpan = Math.max(1, Math.floor(safeCols / 2));
  const ordered = sortByTopLeft(layouts.map((item) => scaleLayoutColumns(item, sourceCols, safeCols)));
  const adapted = ordered.map((source) => {
    const safeH = Math.max(1, Math.round(source.h));
    const isSmallItem = smallOneByOneIds ? smallOneByOneIds.has(source.i) : isSmallOneByOne(source);
    const safeW = isSmallItem ? Math.min(safeCols, halfSpan) : safeCols;
    return {
      i: source.i,
      x: Math.min(Math.max(0, Math.round(source.x)), Math.max(0, safeCols - safeW)),
      y: Math.max(0, Math.round(source.y)),
      w: safeW,
      h: safeH,
    };
  });

  return packLayoutDense(adapted, safeCols);
}

export function reflowLayoutsToColumns(
  layouts: GridItem[],
  cols: number,
  currentWidget?: Pick<GridItem, 'i' | 'x' | 'y' | 'w' | 'h'>,
): GridItem[] {
  const safeCols = Math.max(1, Math.round(cols));
  const normalized = layouts.map((item) => clampLayoutToColumns(item, safeCols));
  const byId = new Map(normalized.map((item) => [item.i, item]));
  if (currentWidget) {
    byId.set(currentWidget.i, clampLayoutToColumns(currentWidget as GridItem, safeCols));
  }

  const ordered = sortByTopLeft([...byId.values()]);
  const placed: GridItem[] = [];
  const maxIterations = Math.max(16, ordered.length * 12);

  ordered.forEach((item) => {
    let candidate: GridItem = { ...item };
    let iterations = 0;

    while (true) {
      const collision = placed.find((existing) => intersects(candidate, existing));
      if (!collision) {
        break;
      }
      candidate = {
        ...candidate,
        y: Math.max(candidate.y, collision.y + collision.h),
      };
      iterations += 1;
      if (iterations > maxIterations) {
        const fallbackBottom = placed.reduce((maxY, entry) => Math.max(maxY, entry.y + entry.h), 0);
        candidate = {
          ...candidate,
          y: Math.max(candidate.y, fallbackBottom),
        };
        break;
      }
    }

    placed.push(candidate);
  });

  return placed;
}

export function resolveClosestParentBreakpointWithLayout<TBreakpoint extends string>(
  layouts: Partial<Record<TBreakpoint, GridItem[]>>,
  currentBreakpoint: TBreakpoint,
  breakpointOrder: readonly TBreakpoint[],
): TBreakpoint | null {
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  if (currentIndex >= 0) {
    for (let index = currentIndex - 1; index >= 0; index -= 1) {
      const candidate = breakpointOrder[index];
      const candidateLayout = layouts[candidate];
      if (candidateLayout && candidateLayout.length > 0) {
        return candidate;
      }
    }
  }
  for (const candidate of breakpointOrder) {
    const candidateLayout = layouts[candidate];
    if (candidateLayout && candidateLayout.length > 0) {
      return candidate;
    }
  }
  return null;
}
