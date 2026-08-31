import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RoomSectionInteractionGuide } from './RoomSectionInteractionGuide';

describe('RoomSectionInteractionGuide', () => {
  it('explains the real selection gesture and available actions', () => {
    const onDismiss = vi.fn();
    render(<RoomSectionInteractionGuide onDismiss={onDismiss} />);

    expect(screen.getByText('Tieni premuto per organizzare')).not.toBeNull();
    expect(screen.getByText('Aggiungi')).not.toBeNull();
    expect(screen.getByText('Sposta')).not.toBeNull();
    expect(screen.getByText('Rimuovi')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Nascondi guida gestione dispositivi' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
