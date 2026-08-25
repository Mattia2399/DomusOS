import { describe, expect, it } from 'vitest';
import {
  SETTINGS_MANAGEMENT_SECTIONS,
  isSettingsManagementSection,
  resolveSettingsManagementSection,
} from './settingsManagementRegistry';

describe('settingsManagementRegistry', () => {
  it('contains only shared house administration sections', () => {
    expect(SETTINGS_MANAGEMENT_SECTIONS.map((section) => section.id)).toEqual([
      'members',
      'ha',
      'config',
    ]);
  });

  it('fails closed to Casa e accessi for unknown or personal sections', () => {
    expect(resolveSettingsManagementSection('ha')).toBe('ha');
    expect(resolveSettingsManagementSection('security')).toBe('members');
    expect(resolveSettingsManagementSection(undefined)).toBe('members');
    expect(isSettingsManagementSection('config')).toBe(true);
    expect(isSettingsManagementSection('theme')).toBe(false);
  });
});
