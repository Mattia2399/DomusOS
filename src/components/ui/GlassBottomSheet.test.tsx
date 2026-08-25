import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GlassBottomSheet from './GlassBottomSheet';

afterEach(cleanup);

describe('GlassBottomSheet', () => {
  it('uses the shared themed sheet and dismisses from the backdrop', () => {
    const onClose = vi.fn();
    render(
      <GlassBottomSheet isOpen onClose={onClose} title="Filtri">
        <div>Contenuto</div>
      </GlassBottomSheet>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('liquid-glass-sheet');
    expect(dialog.className).toContain('!max-w-none');
    expect(dialog.className).toContain('sm:!max-w-md');
    expect(dialog.className).toContain('before:rounded-full');
    fireEvent.click(dialog.previousElementSibling as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports container-bound sheets with an accessible hidden heading', () => {
    render(
      <GlassBottomSheet
        isOpen
        onClose={vi.fn()}
        title="Gestisci dispositivi"
        position="container"
        usePortal={false}
        showHeader={false}
      >
        <div>Contenuto Rooms</div>
      </GlassBottomSheet>,
    );

    expect(screen.getByRole('heading', { name: 'Gestisci dispositivi' })).toBeTruthy();
    expect(screen.getByText('Contenuto Rooms')).toBeTruthy();
  });
});
