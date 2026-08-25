import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RoomsDashboard } from './RoomsDashboard';

afterEach(cleanup);

function renderRooms(canManageRooms: boolean) {
  return render(
    <RoomsDashboard
      haConnected={false}
      canManageRooms={canManageRooms}
      haAreas={[]}
      haStates={{}}
    />,
  );
}

describe('RoomsDashboard permissions', () => {
  it('keeps room management entry points hidden for a limited user', () => {
    renderRooms(false);

    expect(screen.queryByRole('button', { name: /^Aggiungi dispositivi$/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Apri lista piani/i }));

    expect(screen.queryByRole('button', { name: /Modifica piano/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Elimina piano/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Aggiungi un piano/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Gestisci o Aggiungi Stanza/i })).toBeNull();
  });

  it('exposes local room management to an authorized dashboard editor', () => {
    renderRooms(true);

    fireEvent.click(screen.getByRole('button', { name: /Apri lista piani/i }));

    expect(screen.getByRole('button', { name: /Aggiungi un piano/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /Gestisci o Aggiungi Stanza/i })).not.toBeNull();
  });
});
