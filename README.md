# HA Dashboard Builder

Project focused on two views:
- `/home`
- `/consumi` (including detail routes `/consumi/energia`, `/consumi/acqua`, `/consumi/gas`, `/consumi/report`)

## Current scope

- Example dashboard page
- Consumi dashboard + detail pages
- Live data mapping from Home Assistant entities (WebSocket)

## Beta roadmap

- Release/security/go-to-market plan: [`docs/beta-roadmap.md`](docs/beta-roadmap.md)
- Security beta checklist: [`docs/security-beta-checklist.md`](docs/security-beta-checklist.md)

## Tech stack

- React + TypeScript
- Vite
- Tailwind CSS
- home-assistant-js-websocket

## Run locally

Prerequisites: Node.js 20+

1. `npm install`
2. `npm run dev`
3. Open `http://localhost:3000`

## Build and typecheck

- Typecheck: `npm run check`
- Production build: `npm run build`

## Home Assistant live connection

The dashboards support two authentication flows:

1. OAuth (recommended)
   - Open Profile panel
   - Insert your HA URL
   - Click `Accedi con OAuth`
   - Complete HA authorization flow and return to the app
2. Manual token (fallback)
   - Home Assistant -> user profile -> create Long-Lived Access Token
   - Insert HA URL and token in Profile panel
   - Click `Connetti`

3. Embedded panel bridge (automatic)
   - If the app is loaded inside a Home Assistant `panel_custom` iframe with the bridge protocol, live states and service/API calls are proxied by the parent HA frontend session.
   - In this mode, manual OAuth/token setup is not required inside the iframe.
   - Reference panel implementation: `docs/home-assistant-panel-bridge.md`

When connected, widgets read live entity states.

## Privacy and backup notes

- Configuration backup/restore/reset is available in Profile panel.
- Backup JSON excludes Home Assistant authentication secrets by default.

## Troubleshooting (Windows)

### Build error with `fileName ../../Desktop/.../index.html`

If the project folder is a Junction/Symlink, Vite may resolve mixed real/symlink paths.

Mitigations applied in this project:

- `resolve.preserveSymlinks: true` in `vite.config.ts`

If you still see issues:

1. Close any running `vite`/`node` process from other copies of the project
2. Remove `node_modules`
3. Reinstall with `npm ci`
4. Retry `npm run build`

### `npm ci` fails with `EPERM ... .node`

Usually the native module is locked by an active dev process or antivirus scan.

1. Stop running `node`/`vite` processes
2. Retry `npm ci`

## Notes

Legacy premium/editor-external files have been removed to keep the repository aligned with `/home` and `/consumi` only.
