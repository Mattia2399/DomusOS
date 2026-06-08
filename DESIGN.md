# Design System Documentation: High-End Smart Home Dashboard

## 1. Overview & Creative North Star

### Creative North Star: "The Luminescent Sanctuary"
This design system moves beyond the utility of a standard dashboard and enters the realm of a digital concierge. It is inspired by the tactile elegance of high-end hardware and the fluid responsiveness of iPadOS. The "Luminescent Sanctuary" focuses on the intersection of depth, glass, and light. 

Instead of a flat, rigid grid, we employ an **Editorial Layout** approach. This means utilizing intentional asymmetry—grouping high-priority controls in larger, more expressive containers while allowing secondary information to breathe in smaller, nested modules. We break the "template" look by treating the UI as a physical stack of semi-transparent materials, where light from the background "bleeds" through the interface to create a sense of environmental harmony.

---

## 2. Colors

Our palette is rooted in a deep, nocturnal base that allows accent colors to vibrate with functional clarity.

*   **Primary (`#85adff`):** Our signature electric blue. Used for active states, primary toggles, and "System On" indicators.
*   **Secondary (`#9392ff`):** A soft violet used for atmospheric controls (e.g., mood lighting, media states).
*   **Tertiary/Error (`#ff716c`):** A high-visibility red reserved for "LIVE" camera feeds, critical alerts, or emergency shut-offs.
*   **Neutral/Surface (`#0e0e0e`):** The foundation. This deep neutral ensures the glass effects feel premium rather than muddy.

### The "No-Line" Rule
Standard UI relies on 1px borders to separate content. **In this system, 1px solid borders for sectioning are prohibited.** Boundaries must be defined through:
1.  **Background Color Shifts:** Use `surface-container-low` for large background areas and `surface-container-highest` for interactive elements.
2.  **Tonal Transitions:** Vertical white space (`Spacing 6` or `8`) should be used to separate content groups before a line is even considered.

### The "Glass & Gradient" Rule
To achieve a signature feel, floating interactive elements must use **Glassmorphism**. 
*   **Fill:** `white/5` to `white/10`.
*   **Effect:** `backdrop-blur-xl`.
*   **Stroke:** A subtle `white/5` inner-glow border.
*   **Gradients:** Use subtle linear gradients (e.g., `primary` to `primary-container`) for main CTAs to give them a "machined" tactile feel that flat colors lack.

---

## 3. Typography

The typography strategy relies on the contrast between **Manrope** (Editorial/Display) and **Inter** (Utility/Body).

*   **Display & Headlines (Manrope):** Large, bold, and authoritative. Use `display-md` for "Welcome Home" messages. These should feel like headers in a high-end architecture magazine.
*   **Titles & Body (Inter):** Clean and functional. Use `title-md` for device names and `body-md` for status descriptions.
*   **Secondary Text:** Always use `text-white/70` to create a clear hierarchy against the `semibold white` headers.

The hierarchy is designed to be "glanceable." A user should be able to distinguish between a room name (Headline) and a device state (Label) from six feet away.

---

## 4. Elevation & Depth

We reject drop shadows as a primary means of depth. Instead, we use **Tonal Layering**.

*   **The Layering Principle:** Treat the UI as layers of frosted glass.
    *   **Base:** `surface` (#0e0e0e).
    *   **Sectioning:** `surface-container-low`.
    *   **Cards:** `white/5` translucency with `backdrop-blur-xl`.
*   **Ambient Shadows:** If an element must "float" (like a popup or a remote control overlay), use a shadow with a 40px–60px blur at 8% opacity. The shadow should not be black; it should be a tinted version of the background to simulate light passing through glass.
*   **The "Ghost Border" Fallback:** If a container requires further definition for accessibility, use the `outline-variant` token at **15% opacity**. Never use 100% opaque lines.

---

## 5. Components

### Cards (The Hero Component)
Cards are the heart of the dashboard.
*   **Corner Radius:** Always `rounded-3xl` (24px) for primary containers.
*   **Padding:** Use `Spacing 4` (1.4rem) for internal content breathing room.
*   **Layout:** No dividers. Separate device name from status using `body-sm` typography and `Spacing 1.5` vertical gaps.

### Buttons & Toggles
*   **Primary Button:** Uses a vibrant `primary` fill with `on-primary` text. The shape should be `full` (pill-shaped) for high touch-target ergonomics.
*   **Tactile Toggles:** For smart switches, use a background shift from `white/10` (Off) to `primary` (On). The transition must feel "weighty" and smooth.

### Sliders (Dimmer/Volume)
*   **Track:** `surface-container-highest` with 40% opacity.
*   **Active Fill:** `primary-fixed`.
*   **Thumb:** A large, tactile `white` circle with a subtle ambient shadow. Sliders should be thick (at least 8px) to feel premium and easy to use on a tablet.

### Live Status Chips
*   **State:** Red for `LIVE` or `ALARM`.
*   **Animation:** A soft "breathing" opacity animation (100% to 60%) to draw the eye without being distracting.

---

## 6. Do's and Don'ts

### Do
*   **DO** use intentional asymmetry. A large weather widget next to four small light toggles creates visual interest.
*   **DO** use high-contrast typography. If a label is `semibold white`, its description should be `medium white/70`.
*   **DO** utilize the full `backdrop-blur-xl` effect. It makes the UI feel integrated into the user's wallpaper/home environment.

### Don't
*   **DON'T** use 1px solid white borders. They make the UI look like a wireframe rather than a finished product.
*   **DON'T** use pure black `#000000` for cards. It kills the glass effect. Stick to the translucent `white/5` or `white/10` tokens.
*   **DON'T** crowd the layout. If in doubt, increase the spacing. High-end design is defined by the luxury of "wasted" space.
*   **DON'T** use standard system icons. Use high-quality, thick-stroke icons that match the `semibold` weight of your Manrope headlines.

---

## 7. Spacing & Rhythm

All spacing must follow the defined scale to maintain a mathematical harmony.
*   **Gaps between cards:** `Spacing 3` (1rem).
*   **Section Margins:** `Spacing 6` (2rem).
*   **Internal Card Padding:** `Spacing 4` (1.4rem).

By adhering to this rhythm, the dashboard will feel organized and "engineered," even when the layout is asymmetrical.