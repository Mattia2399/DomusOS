import type { GridItem } from '../../types/dashboardModels';
import { normalizeRuntimeLayout, packLayoutDense } from './gridEngineGeometry';

export type GridStackWidthMode = 'auto' | 'manual';

export type GridStackLayoutSolution = {
  layout: GridItem[];
  usedCols: number;
  usedRows: number;
};

export type GridStackContainerSpanInput = {
  geometry: Pick<GridStackLayoutSolution, 'usedCols' | 'usedRows'>;
  availableCols: number;
  currentCols: number;
  widthMode: GridStackWidthMode;
  headerVisible: boolean;
};

function measureLayout(layout: readonly GridItem[]) {
  return layout.reduce(
    (geometry, item) => ({
      usedCols: Math.max(geometry.usedCols, item.x + item.w),
      usedRows: Math.max(geometry.usedRows, item.y + item.h),
    }),
    { usedCols: 0, usedRows: 0 },
  );
}

export function solveGridStackLayout(
  sourceLayout: readonly GridItem[],
  availableCols: number,
  widthMode: GridStackWidthMode,
): GridStackLayoutSolution {
  const safeAvailableCols = Math.max(1, Math.round(availableCols));
  const normalized = normalizeRuntimeLayout(sourceLayout, safeAvailableCols);

  if (normalized.length === 0) {
    return { layout: [], usedCols: 1, usedRows: 1 };
  }

  if (widthMode === 'manual') {
    const geometry = measureLayout(normalized);
    return {
      layout: normalized,
      usedCols: safeAvailableCols,
      usedRows: Math.max(1, geometry.usedRows),
    };
  }

  const sourceGeometry = measureLayout(normalized);
  let targetCols = Math.max(1, Math.min(safeAvailableCols, sourceGeometry.usedCols));
  let packed = packLayoutDense(normalized, targetCols);

  // A sparse source can become narrower after dense packing. Re-run once at
  // the measured width so layout and outer container share the same geometry.
  const firstGeometry = measureLayout(packed);
  if (firstGeometry.usedCols < targetCols) {
    targetCols = Math.max(1, firstGeometry.usedCols);
    packed = packLayoutDense(packed, targetCols);
  }

  const geometry = measureLayout(packed);
  return {
    layout: packed,
    usedCols: Math.max(1, geometry.usedCols),
    usedRows: Math.max(1, geometry.usedRows),
  };
}

export function resolveGridStackContainerSpan({
  geometry,
  availableCols,
  currentCols,
  widthMode,
  headerVisible,
}: GridStackContainerSpanInput) {
  const safeAvailableCols = Math.max(1, Math.round(availableCols));
  const w = widthMode === 'manual'
    ? Math.max(1, Math.min(safeAvailableCols, Math.round(currentCols)))
    : Math.max(1, Math.min(safeAvailableCols, Math.round(geometry.usedCols)));
  const h = Math.max(1, Math.round(geometry.usedRows) + (headerVisible ? 1 : 0));
  return { w, h };
}
