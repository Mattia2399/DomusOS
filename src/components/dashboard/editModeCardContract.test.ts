// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('edit-mode card interaction contract', () => {
  it('forwards edit mode to cards rendered on the canvas and inside stacks', () => {
    const canvas = readSource('src/components/dashboard/GridCanvas.tsx');
    const stack = readSource('src/components/dashboard/StackGrid.tsx');

    expect(canvas).toMatch(/<WidgetCardRenderer[\s\S]*?isEditMode=\{isEditMode\}/);
    expect(stack).toMatch(/<WidgetCardRenderer[\s\S]*?isEditMode=\{isEditMode\}/);
  });

  it('removes device command adapters while edit mode is active', () => {
    const renderer = readSource('src/components/widgets/CardRenderer.tsx');
    const guardedCommands = renderer.match(/controlsEnabled && on[A-Z][A-Za-z]+/g) ?? [];

    expect(guardedCommands.length).toBeGreaterThanOrEqual(20);
    expect(renderer).toContain('const controlsEnabled = !isEditMode && isInteractive');
  });

  it('removes command adapters from real cards while Home Assistant is unavailable', () => {
    const canvas = readSource('src/components/dashboard/GridCanvas.tsx');
    const stack = readSource('src/components/dashboard/StackGrid.tsx');

    expect(canvas).toContain("isInteractive={haConnected || runtimeWidget.dataSource === 'mock'}");
    expect(stack).toContain("isInteractive={haConnected || runtimeWidget.dataSource === 'mock'}");
  });

  it('keeps direct resize disabled because dimensions are configured in the Builder', () => {
    const canvas = readSource('src/components/dashboard/GridCanvas.tsx');
    const stack = readSource('src/components/dashboard/StackGrid.tsx');

    expect(canvas).toContain('isResizable={false}');
    expect(stack).toContain('isResizable={false}');
    expect(canvas).toContain('resizeHandles={[]}');
    expect(stack).toContain('resizeHandles={[]}');
    expect(canvas).not.toContain('isResizable={isEditMode}');
    expect(canvas).not.toContain('onResizeStart=');
    expect(canvas).not.toContain('onResizeStop=');
  });

  it('forces the runtime grid to consume an undo or redo snapshot immediately', () => {
    const mainBoard = readSource('src/components/dashboard/MainBoard.tsx');
    const canvas = readSource('src/components/dashboard/GridCanvas.tsx');

    expect(mainBoard).toContain('setDashboardEditorLayoutRevision((current) => current + 1)');
    expect(mainBoard).toContain('layoutRevision={dashboardEditorLayoutRevision}');
    expect(canvas).toContain('hasPendingAuthoritativeLayout ? undefined : gridEngineLayouts[breakpoint]');
    expect(canvas).toContain('key={`dashboard-grid:${layoutRevision}`}');
    expect(canvas).toContain('key={`${section.id}:${layoutRevision}`}');
  });
});
