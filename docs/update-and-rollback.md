# Updates and rollback

Updated: 2026-09-02

## Before updating

1. Download a dashboard backup from Domus UI.
2. Create a Home Assistant backup.
3. Read the new release notes in `CHANGELOG.md`.
4. Confirm that the GitHub Release contains `domusos.zip` and `SHA256SUMS`.
5. Remember that backups and synchronization exclude tokens, PINs, codes, and passkeys.

## Update through HACS

1. Open HACS and select Domus UI.
2. Install the offered release.
3. Restart Home Assistant when requested.
4. Hard-refresh the browser or fully reopen the Home Assistant app.
5. Check the version in Settings, then verify Home, Rooms, and Security.

HACS updates the integration, bridge, and frontend together. Do not manually overwrite individual files: mixing files from different releases can cause a black page or incompatible bridge protocols.

## Post-update checks

- The panel opens and finishes loading.
- The Home Assistant connection and role are correct.
- The layout is unchanged on desktop, tablet, and mobile.
- Home and Rooms navigation works.
- A non-critical card can be edited and saved.
- A Light or Switch command works.
- A new backup can be downloaded.
- No blocking errors appear in the browser console or Home Assistant logs.

## Roll back the integration

1. Open Domus UI in HACS.
2. From the download menu, select one of the available previous releases.
3. Reinstall it and restart Home Assistant.
4. Hard-refresh the browser.
5. If the newer version changed the shared configuration, restore a layout version or the backup created before updating.

HACS rollback and layout restore are separate operations: the first changes application code, while the second changes dashboard configuration.

## Emergency recovery

If Domus UI does not open:

- use the standard Home Assistant dashboard;
- temporarily disable or remove the Domus UI integration;
- reinstall a known release from HACS and restart Home Assistant;
- record the installed version, browser, operating system, and `domusos` log messages;
- never share tokens, PINs, or complete storage files in support tickets.
