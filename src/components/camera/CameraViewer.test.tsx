import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CameraViewer, { type CameraViewerItem } from './CameraViewer';

const cameras: CameraViewerItem[] = [
  {
    entityId: 'camera.ingresso',
    name: 'Ingresso',
    statusLabel: 'Live',
    streamUrl: '/api/camera_proxy_stream/camera.ingresso',
    snapshotUrl: '/api/camera_proxy/camera.ingresso',
    supportsPtz: true,
  },
  {
    entityId: 'camera.giardino',
    name: 'Giardino',
    statusLabel: 'Online',
    snapshotUrl: '/api/camera_proxy/camera.giardino',
  },
];

afterEach(cleanup);

describe('CameraViewer', () => {
  it('switches camera inside the shared immersive viewer', () => {
    const onActiveEntityChange = vi.fn();
    render(
      <CameraViewer
        isOpen
        cameras={cameras}
        activeEntityId="camera.ingresso"
        onActiveEntityChange={onActiveEntityChange}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Ingresso' })).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Telecamera successiva' }));
    expect(onActiveEntityChange).toHaveBeenCalledWith('camera.giardino');
  });

  it('shows only real capabilities and routes PTZ with the active entity id', () => {
    const onPtzMove = vi.fn();
    const onPtzStop = vi.fn();
    render(
      <CameraViewer
        isOpen
        cameras={cameras}
        activeEntityId="camera.ingresso"
        onActiveEntityChange={vi.fn()}
        onClose={vi.fn()}
        onPtzMove={onPtzMove}
        onPtzStop={onPtzStop}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Attiva audio' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Mostra controllo PTZ' }));
    const moveUp = screen.getByRole('button', { name: 'PTZ in alto' });
    fireEvent.pointerDown(moveUp, { pointerId: 1 });
    expect(onPtzMove).toHaveBeenCalledWith('camera.ingresso', 'up');
    fireEvent.pointerUp(moveUp, { pointerId: 1 });
    expect(onPtzStop).toHaveBeenCalledWith('camera.ingresso');
  });

  it('disables device commands while the host is offline or read-only', () => {
    render(
      <CameraViewer
        isOpen
        cameras={cameras}
        activeEntityId="camera.ingresso"
        onActiveEntityChange={vi.fn()}
        onClose={vi.fn()}
        commandsEnabled={false}
        onPtzMove={vi.fn()}
        onPtzStop={vi.fn()}
      />,
    );

    expect((screen.getByRole('button', { name: 'Mostra controllo PTZ' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
