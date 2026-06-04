import React, { type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';

type WidgetWrapperProps = {
  width: number;
  mdWidth?: number;
  lgWidth?: number;
  height: number;
  columnStart?: number;
  mdColumnStart?: number;
  lgColumnStart?: number;
  rowStart?: number;
  chrome?: 'apple' | 'none';
  children: ReactNode;
  className?: string;
};

const COL_SPAN_CLASSES: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
};

const MD_COL_SPAN_CLASSES: Record<number, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12',
};

const LG_COL_SPAN_CLASSES: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
};

const ROW_SPAN_CLASSES: Record<number, string> = {
  1: 'row-span-1',
  2: 'row-span-2',
  3: 'row-span-3',
  4: 'row-span-4',
  5: 'row-span-5',
  6: 'row-span-6',
  7: 'row-span-7',
  8: 'row-span-8',
  9: 'row-span-9',
  10: 'row-span-10',
  11: 'row-span-11',
  12: 'row-span-12',
};

const BASE_GRID_COLS = 4;
const MD_GRID_COLS = 8;
const LG_GRID_COLS = 12;

function clampToColSpan(value: number, maxCols: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(maxCols, Math.max(1, Math.round(value)));
}

function normalizeRowSpan(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.round(value));
}

function normalizePositiveStart(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) {
    return undefined;
  }
  return Math.max(1, Math.round(value));
}

function clampToColumnStart(value: number | undefined, maxCols: number, span: number) {
  const start = normalizePositiveStart(value);
  if (start === undefined) {
    return undefined;
  }
  const maxStart = Math.max(1, maxCols - span + 1);
  return Math.min(maxStart, start);
}

function WidgetWrapperComponent({
  width,
  mdWidth,
  lgWidth,
  height,
  columnStart,
  mdColumnStart,
  lgColumnStart,
  rowStart,
  chrome = 'apple',
  children,
  className,
}: WidgetWrapperProps) {
  const baseSpan = clampToColSpan(width, BASE_GRID_COLS);
  const mdSpan = clampToColSpan(mdWidth ?? width, MD_GRID_COLS);
  const lgSpan = clampToColSpan(lgWidth ?? mdWidth ?? width, LG_GRID_COLS);
  const baseColSpan = COL_SPAN_CLASSES[baseSpan];
  const mdColSpan = MD_COL_SPAN_CLASSES[mdSpan];
  const lgColSpan = LG_COL_SPAN_CLASSES[lgSpan];
  const safeRowSpan = normalizeRowSpan(height);
  const rowSpanClass = ROW_SPAN_CLASSES[safeRowSpan];
  const colStart = clampToColumnStart(columnStart, BASE_GRID_COLS, baseSpan);
  const colStartMd = clampToColumnStart(mdColumnStart, MD_GRID_COLS, mdSpan);
  const colStartLg = clampToColumnStart(lgColumnStart, LG_GRID_COLS, lgSpan);
  const safeRowStart = normalizePositiveStart(rowStart);

  return (
    <div
      className={clsx(
        baseColSpan,
        mdColSpan,
        lgColSpan,
        rowSpanClass ?? null,
        'relative h-full w-full min-h-0 min-w-0 box-border',
        (colStart || colStartMd || colStartLg) ? 'grid-engine-item' : null,
        className,
      )}
      style={
        {
          ...(colStart ? ({ '--grid-engine-col-start': `${colStart}` } as CSSProperties) : null),
          ...(colStartMd ? ({ '--grid-engine-col-start-md': `${colStartMd}` } as CSSProperties) : null),
          ...(colStartLg ? ({ '--grid-engine-col-start-lg': `${colStartLg}` } as CSSProperties) : null),
          ...(rowSpanClass ? null : { gridRowEnd: `span ${safeRowSpan}` }),
          ...(safeRowStart ? { gridRowStart: safeRowStart } : null),
        } as CSSProperties
      }
    >
      <div
        className={clsx(
          'relative h-full w-full min-h-0 min-w-0 overflow-hidden',
          chrome === 'apple'
            ? 'liquid-glass-card rounded-3xl'
            : 'bg-transparent',
        )}
      >
        {children}
      </div>
    </div>
  );
}

function areWidgetWrapperPropsEqual(prevProps: WidgetWrapperProps, nextProps: WidgetWrapperProps) {
  return (
    prevProps.width === nextProps.width &&
    prevProps.mdWidth === nextProps.mdWidth &&
    prevProps.lgWidth === nextProps.lgWidth &&
    prevProps.height === nextProps.height &&
    prevProps.columnStart === nextProps.columnStart &&
    prevProps.mdColumnStart === nextProps.mdColumnStart &&
    prevProps.lgColumnStart === nextProps.lgColumnStart &&
    prevProps.rowStart === nextProps.rowStart &&
    prevProps.chrome === nextProps.chrome &&
    prevProps.className === nextProps.className &&
    prevProps.children === nextProps.children
  );
}

export const WidgetWrapper = React.memo(WidgetWrapperComponent, areWidgetWrapperPropsEqual);

export default WidgetWrapper;
