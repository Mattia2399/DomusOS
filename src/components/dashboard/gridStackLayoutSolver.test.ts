import { describe, expect, it } from 'vitest';
import { resolveGridStackContainerSpan, solveGridStackLayout } from './gridStackLayoutSolver';

describe('grid stack layout solver', () => {
  it('removes horizontal holes and shrinks auto width to the packed content', () => {
    const solution = solveGridStackLayout(
      [
        { i: 'first', x: 0, y: 0, w: 2, h: 1 },
        { i: 'second', x: 4, y: 0, w: 2, h: 1 },
      ],
      6,
      'auto',
    );

    expect(solution.layout).toEqual([
      { i: 'first', x: 0, y: 0, w: 2, h: 1 },
      { i: 'second', x: 2, y: 0, w: 2, h: 1 },
    ]);
    expect(solution.usedCols).toBe(4);
    expect(solution.usedRows).toBe(1);
  });

  it('preserves the requested row structure while removing unused right columns', () => {
    const solution = solveGridStackLayout(
      [
        { i: 'first', x: 0, y: 0, w: 2, h: 2 },
        { i: 'second', x: 2, y: 0, w: 2, h: 2 },
        { i: 'third', x: 0, y: 2, w: 2, h: 1 },
      ],
      6,
      'auto',
    );

    expect(solution.usedCols).toBe(4);
    expect(solution.usedRows).toBe(3);
    expect(solution.layout.find((item) => item.i === 'third')).toMatchObject({ x: 0, y: 2 });
  });

  it('keeps the configured width in manual mode', () => {
    const solution = solveGridStackLayout(
      [{ i: 'only', x: 0, y: 0, w: 2, h: 3 }],
      6,
      'manual',
    );

    expect(solution.usedCols).toBe(6);
    expect(solution.usedRows).toBe(3);
  });

  it('gives an empty stack a stable one-by-one geometry', () => {
    expect(solveGridStackLayout([], 6, 'auto')).toEqual({
      layout: [],
      usedCols: 1,
      usedRows: 1,
    });
  });

  it('derives one outer header row and respects automatic width', () => {
    expect(
      resolveGridStackContainerSpan({
        geometry: { usedCols: 3, usedRows: 4 },
        availableCols: 6,
        currentCols: 6,
        widthMode: 'auto',
        headerVisible: true,
      }),
    ).toEqual({ w: 3, h: 5 });
  });

  it('never changes a manually configured outer width', () => {
    expect(
      resolveGridStackContainerSpan({
        geometry: { usedCols: 2, usedRows: 3 },
        availableCols: 6,
        currentCols: 5,
        widthMode: 'manual',
        headerVisible: false,
      }),
    ).toEqual({ w: 5, h: 3 });
  });
});
