# HACS and Home Assistant branding

Starting with Home Assistant 2026.3, custom integrations can distribute their own brand assets. Domus UI therefore includes its icons in `custom_components/domusos/brand` without depending on the centralized Home Assistant Brands catalog.

## Included assets

- `brand/icon.png`: 256 x 256 px;
- `brand/icon@2x.png`: 512 x 512 px;
- the same files are included in `custom_components/domusos/brand` and in `domusos.zip`.

Regenerate the assets from the vector source with:

```bash
node scripts/generate-brand-assets.mjs
```

## Policy verification

The verification pull request opened on August 31, 2026 was closed automatically because the repository no longer accepts icons for new custom integrations:

- <https://github.com/home-assistant/brands/pull/11076>

The official source referenced by the Home Assistant bot is:

- <https://developers.home-assistant.io/blog/2026/02/24/brands-proxy-api>

To verify a release, confirm that `domusos.zip` contains both assets in the `brand/` directory.

The directory name must continue to match the technical domain declared by the manifest (`domusos`), even when the integration's display name changes.

## Recommended GitHub metadata

Description:

> Premium responsive dashboard and visual builder for Home Assistant - desktop, tablet and mobile.

Topics:

`home-assistant`, `hacs`, `dashboard`, `smart-home`, `home-automation`, `react`, `responsive-design`, `custom-integration`, `domus-ui`.
