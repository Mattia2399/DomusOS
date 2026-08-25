import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardViewportPreviewBar } from './DashboardViewportPreviewBar';

afterEach(cleanup);

describe('DashboardViewportPreviewBar', () => {
  it('changes the active preview mode through one responsive control', () => {
    const onPreviewModeChange = vi.fn();
    const { getByRole, queryByRole } = render(
      <DashboardViewportPreviewBar
        previewMode="auto"
        canvasBreakpoint="xl"
        onPreviewModeChange={onPreviewModeChange}
        availableModes={['auto', 'tablet', 'compact', 'mobile']}
        primaryAction={<button type="button">Catalogo</button>}
        desktopActions={<button type="button">Annulla</button>}
      />,
    );

    fireEvent.click(getByRole('radio', { name: 'Anteprima mobile' }));

    expect(onPreviewModeChange).toHaveBeenCalledWith('mobile');
    expect(queryByRole('radio', { name: 'Anteprima desktop' })).toBeNull();
    expect(getByRole('radio', { name: 'Anteprima tablet verticale' })).toBeTruthy();
    expect(getByRole('button', { name: 'Catalogo' })).toBeTruthy();
    expect(getByRole('button', { name: 'Annulla' })).toBeTruthy();
    expect(getByRole('toolbar', { name: 'Anteprima responsive della dashboard' })).toBeTruthy();
  });
});
