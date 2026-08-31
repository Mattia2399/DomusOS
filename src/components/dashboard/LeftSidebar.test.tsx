import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationProvider } from '../../context/NotificationProvider';
import { createDefaultSidebarPaths } from '../../navigation/applicationRoutes';
import { LeftSidebar } from './LeftSidebar';

afterEach(cleanup);

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

describe('LeftSidebar tablet density', () => {
  it('keeps every route and Edit Mode directly available in the compact rail', () => {
    setViewport(1024, 600);
    const onPathClick = vi.fn();

    render(
      <NotificationProvider>
        <LeftSidebar
          isEditMode={false}
          haStatus="connected"
          quickPaths={createDefaultSidebarPaths()}
          activeRoute="/home"
          canToggleEditMode
          onPathClick={onPathClick}
          onToggleEditMode={vi.fn()}
          onOpenProfile={vi.fn()}
          onOpenSettings={vi.fn()}
        />
      </NotificationProvider>,
    );

    for (const label of ['Home', 'Stanze', 'Sicurezza', 'Consumi', 'Automazioni', 'App Gallery']) {
      expect(screen.getByRole('button', { name: `Apri ${label}` })).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: 'Toggle edit mode' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Apri altre sezioni' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Apri App Gallery' }));
    expect(onPathClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'appgallery' }));
  });
});
