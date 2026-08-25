// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const settingsManagementPanelSource = readFileSync(
  resolve(process.cwd(), 'src/components/settings/SettingsManagementPanel.tsx'),
  'utf8',
);

describe('Settings management lazy boundaries', () => {
  it('loads Home Assistant connection tools only when their section is opened', () => {
    expect(settingsManagementPanelSource).toContain(
      "const SettingsHomeAssistantSection = React.lazy(",
    );
    expect(settingsManagementPanelSource).toContain(
      "() => import('./SettingsHomeAssistantSection')",
    );
    expect(settingsManagementPanelSource).not.toContain(
      "from './SettingsHomeAssistantSection'",
    );
    expect(settingsManagementPanelSource).toContain(
      "{activeSection === 'ha' ? (",
    );
  });

  it('loads backup and destructive data tools only when their section is opened', () => {
    expect(settingsManagementPanelSource).toContain(
      "const SettingsDataBackupSection = React.lazy(",
    );
    expect(settingsManagementPanelSource).toContain(
      "() => import('./SettingsDataBackupSection')",
    );
    expect(settingsManagementPanelSource).not.toContain(
      "from './SettingsDataBackupSection'",
    );
    expect(settingsManagementPanelSource).toContain(
      "{activeSection === 'config' ? (",
    );
  });

  it('loads house members and access tools only when their section is opened', () => {
    expect(settingsManagementPanelSource).toContain(
      "const SettingsHouseAccessSection = React.lazy(",
    );
    expect(settingsManagementPanelSource).toContain(
      "() => import('./SettingsHouseAccessSection')",
    );
    expect(settingsManagementPanelSource).not.toContain(
      "from './SettingsHouseAccessSection'",
    );
    expect(settingsManagementPanelSource).toContain(
      "{activeSection === 'members' ? (",
    );
  });
});
