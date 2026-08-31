import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ModernProfilePage from './ModernProfilePage';

afterEach(cleanup);

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  currentUserId: 'user-1',
  userAvatarAlt: 'Mattia',
  userEmail: 'mattia@example.com',
  userRoleLabel: 'Owner',
  userOwnedDeviceCount: 2,
  houseMembers: [
    {
      id: 'person.mattia',
      name: 'Mattia',
      userId: 'user-1',
      isCurrent: true,
    },
  ],
  movementTimeline: [
    {
      id: 'movement-1',
      title: 'Casa',
      subtitle: 'Presenza rilevata',
      timestampLabel: '14:20',
      timestampMs: 1,
      isCurrent: true,
    },
  ],
  movementPoints: [],
  movementUpdatedLabel: 'Aggiornato alle 14:20',
  haStatus: 'connected' as const,
  appearanceMode: 'auto' as const,
  onAppearanceModeChange: vi.fn(),
  background: 'neutral' as const,
  onBackgroundChange: vi.fn(),
};

describe('ModernProfilePage', () => {
  it('keeps the overview focused on the current person', () => {
    render(<ModernProfilePage {...baseProps} />);

    expect(screen.getByRole('heading', { name: 'Profilo', level: 1 })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Informazioni personali/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Attività e spostamenti/ })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Tema del dispositivo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Temi colorati/ })).toBeTruthy();
    expect(screen.queryByText('Persone/Membri')).toBeNull();
  });

  it('drills into personal activity and returns to the overview', () => {
    render(<ModernProfilePage {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Attività e spostamenti/ }));
    expect(screen.getByRole('heading', { name: 'Attività e spostamenti' })).toBeTruthy();
    expect(screen.getByText('Cronologia recente')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Indietro' }));
    expect(screen.getByRole('heading', { name: 'Profilo', level: 1 })).toBeTruthy();
  });

  it('exposes appearance and background as device-local preferences', () => {
    const onAppearanceModeChange = vi.fn();
    const onBackgroundChange = vi.fn();
    render(
      <ModernProfilePage
        {...baseProps}
        onAppearanceModeChange={onAppearanceModeChange}
        onBackgroundChange={onBackgroundChange}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Scuro' }));
    fireEvent.click(screen.getByRole('button', { name: /Temi colorati/ }));
    expect(screen.getByRole('heading', { name: 'Temi colorati' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Sunset Amber/ }));

    expect(onAppearanceModeChange).toHaveBeenCalledWith('dark');
    expect(onBackgroundChange).toHaveBeenCalledWith('sunset-amber');
  });

  it('closes the profile when back is pressed from the overview', () => {
    const onClose = vi.fn();
    render(<ModernProfilePage {...baseProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Indietro' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('collapses the mobile identity beside the back button while scrolling', () => {
    render(<ModernProfilePage {...baseProps} />);

    const scrollContainer = screen.getByTestId('modern-profile-scroll');
    const collapsingHeader = screen.getByTestId('profile-collapsing-header');
    expect(collapsingHeader.getAttribute('data-collapsed')).toBe('false');

    scrollContainer.scrollTop = 96;
    fireEvent.scroll(scrollContainer);

    expect(collapsingHeader.getAttribute('data-collapsed')).toBe('true');
    expect(collapsingHeader.getAttribute('data-collapse-progress')).toBe('1.00');
    expect(collapsingHeader.textContent).toContain('Mattia');
    expect(collapsingHeader.textContent).toContain('mattia@example.com');
  });

  it('keeps nested profile navigation addressable by URL', () => {
    const onNavigate = vi.fn();
    const { rerender } = render(
      <ModernProfilePage {...baseProps} navigationRoute="/profile" onNavigate={onNavigate} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Informazioni personali/ }));
    expect(onNavigate).toHaveBeenCalledWith('/profile/personal');

    rerender(
      <ModernProfilePage
        {...baseProps}
        navigationRoute="/profile/devices"
        onNavigate={onNavigate}
      />,
    );
    expect(screen.getByRole('heading', { name: 'I miei dispositivi' })).toBeTruthy();
  });

  it('opens the support center from the profile overview', () => {
    const onNavigate = vi.fn();
    render(
      <ModernProfilePage {...baseProps} navigationRoute="/profile" onNavigate={onNavigate} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Supporto e feedback/ }));
    expect(onNavigate).toHaveBeenCalledWith('/support');
  });
});
