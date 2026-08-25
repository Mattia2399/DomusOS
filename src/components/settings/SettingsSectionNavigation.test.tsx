import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SettingsSectionNavigation from './SettingsSectionNavigation';
import { SETTINGS_MANAGEMENT_SECTIONS } from './settingsManagementRegistry';

afterEach(cleanup);

describe('SettingsSectionNavigation', () => {
  it('exposes the current desktop section and selects another one', () => {
    const onSelect = vi.fn();
    render(
      <SettingsSectionNavigation
        sections={SETTINGS_MANAGEMENT_SECTIONS}
        activeSection="members"
        isCompactViewport={false}
        onSelect={onSelect}
      />,
    );

    expect(
      screen.getByRole('button', { name: /Casa e accessi/ }).getAttribute('aria-current'),
    ).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: /Home Assistant/ }));
    expect(onSelect).toHaveBeenCalledWith('ha');
  });

  it('keeps compact navigation concise without dropping accessible labels', () => {
    render(
      <SettingsSectionNavigation
        sections={SETTINGS_MANAGEMENT_SECTIONS}
        activeSection="members"
        isCompactViewport
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Casa e accessi' })).toBeTruthy();
    expect(screen.queryByText('Membri, ruoli e condivisione')).toBeNull();
  });
});
