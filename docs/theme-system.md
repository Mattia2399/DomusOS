# Dashboard theme system

## Public model

The visual system has independent axes:

- `appearanceMode`: `auto | light | dark`;
- resolved appearance: `light | dark`;
- background: `neutral | home-hub | ocean-mist | sunset-amber | forest-glass`;
- accent: adaptive application accent, never inferred from the background;
- status and device colors: semantic, local to their domain.

`neutral` is the default background. It resolves to the grouped Apple-style off-white canvas in Light appearance and to the black base canvas in Dark appearance.

`total-white` and `total-black` are legacy storage values only. They must never be rendered or offered by the UI. The migration contract lives in `src/theme/dashboardTheme.ts`. The current background key is `ha.dashboard.background`; the former `ha.dashboard.wallpaper` key is read once and removed after migration.

## Semantic color layers

Components must consume `--ui-*` tokens rather than selecting a color based on appearance:

- canvas and containers: `--ui-bg-canvas`, `--ui-bg-grouped`, `--ui-bg-elevated`, `--ui-panel-bg`, `--ui-page-bg`;
- surfaces: `--ui-surface-primary`, `--ui-surface-secondary`, `--ui-surface-tertiary`, `--ui-surface-glass*`;
- text: `--ui-text-primary`, `--ui-text-secondary`, `--ui-text-tertiary`, `--ui-text-disabled`;
- structure: `--ui-border`, `--ui-border-strong`, `--ui-separator`, `--ui-fill-*`;
- interaction: `--ui-accent`, `--ui-accent-strong`, `--ui-focus-ring`;
- status: `--ui-success`, `--ui-warning`, `--ui-danger`, `--ui-info`;
- depth: `--ui-scrim`, `--ui-shadow`, `--ui-shadow-soft`.

The former `--profile-sheet-*` namespace has been removed. Components, onboarding and portaled UI all consume the same `--ui-*` contract.

## Component rules

1. Structural text never uses `text-white`, `text-black` or a raw gray.
2. Structural surfaces never use `bg-white/*` or `bg-black/*`.
3. Content surfaces such as camera video, photographs and color pickers may use intrinsic colors.
4. Device and status colors must pair color with an icon or text label.
5. Portaled UI must inherit the theme from the root document.
6. Small text must keep at least WCAG AA contrast in both appearances.
7. Shared Glass components must support increased contrast and reduced transparency.

## Liquid Glass on the web

`liquid-glass-navigation`, `liquid-glass-panel`, `liquid-glass-sheet` and
`liquid-glass-control` share one adaptive material. It uses a translucent
theme-aware base plus `backdrop-filter`, so wallpaper and live dashboard
content remain visible and affect the material instead of being covered by a
hardcoded dark layer.

- `navigation`: bottom bars and small floating navigation surfaces;
- `panel`: sidebars and modal shells;
- `sheet`: mobile bottom sheets;
- `control`: isolated floating buttons over content.

Liquid Glass belongs to the floating navigation/control layer. Content cards
use semantic fills. Components inside a glass shell have their nested blur
disabled to avoid glass-on-glass; selected items use `liquid-glass-selection`,
which is a tint/fill inside the parent material. Reduced Transparency switches
the material to an opaque elevated surface, Increased Contrast raises opacity
and border contrast, and unsupported browsers receive the same opaque fallback.

## Migration order

1. Shared Glass components.
2. App shell, navigation, Builder and modal shells.
3. Top-level pages.
4. Context panels.
5. Cards, preserving intentional device-state palettes.
6. Remove the temporary class-substring Light Mode overrides.

Current migration status:

- shared Glass primitives and the app shell are migrated;
- Builder/RightSidebar, its catalog and the shared context-panel shell use
  semantic fields, content surfaces and shared segmented/toggle controls;
- structural surfaces for Rooms, Security, Settings and Consumptions use the
  shared semantic content material;
- Sensor, Light and Switch context panels now use semantic structural colors,
  shared content surfaces and the common context header/secondary-page shells;
- Climate, Alarm and Lock panels now use the same structural contract while
  keeping HVAC, protection and lock-state colors local to their status visuals;
- camera/video surfaces and utility/device palettes intentionally retain their
  intrinsic colors;
- Camera, Media, Vacuum, Cover and Weather panels are migrated. Intrinsic camera
  video and vacuum map surfaces deliberately keep a dark contrast layer for
  controls drawn over unpredictable imagery.
- the context-panel phase is complete, including the Consumption editor and
  guided setup surfaces;
- card internals and their Builder skeletons use the semantic contract. White
  overlays remain only over unpredictable visual content such as camera video,
  media artwork, color gradients and explicit device-state palettes;
- support cards (Greeting, Members, Scenes) and context micro widgets use the
  same tokens. The temporary dashboard Light Mode class-substring corrections
  have been removed, so each component is now responsible for its own contrast.

## Release matrix

Validate every route at `xs`, `sm`, `md`, `xl` and `2xl` using:

- Light + Neutral;
- Dark + Neutral;
- Light and Dark with every artistic background;
- increased contrast;
- reduced transparency;
- keyboard focus, disabled, warning, error and selected states.
