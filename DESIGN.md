# BAY — Design System

## Design language: "Glacier Noir"

The visual language of BAY is built on a single idea: a Swiss watchmaking atelier observed under moonlight on a glacier. Cool, precise, layered, and quiet. No warm tones. No gold. No decoration without purpose.

## Color system

### Core palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#08090B` | Page background — deep obsidian black |
| `--bg-soft` | `#0C0D10` | Alternate section background — barely-lit vault |
| `--surface-1` | `#0F1014` | Charcoal panel — base surface |
| `--surface-2` | `#14161B` | Elevated card surface |
| `--surface-3` | `#1B1E25` | Hovered card surface |
| `--surface-4` | `#232730` | Active card surface |
| `--text` | `#F2F2EF` | Primary text — pearl white (not pure white) |
| `--text-soft` | `#C9CACF` | Secondary body copy |
| `--text-muted` | `#6E7178` | Tertiary copy, labels |
| `--text-faint` | `#3F4248` | Disabled, faint markers |

### Accent palette (cool only — no gold, no warm tones)

| Token | Value | Usage |
|-------|-------|-------|
| `--platinum` | `#C8CCD3` | Primary accent — brushed silver. Used for key lines, hover states, section markers |
| `--platinum-dim` | `#8C9098` | Dimmed platinum — secondary accents |
| `--platinum-bright` | `#E8EAEE` | Bright platinum — highlights, specular |
| `--slate-deep` | `#2E4051` | Deep slate blue — sophisticated depth, aurora washes |
| `--steel` | `#6B8E9B` | Soft steel — interactive states |
| `--ice` | `#A8BCC7` | Ice — soft cool accent, second hand, sub-dial hands |

### Forbidden colors

- **Gold / brass / champagne** — never, anywhere. This was the user's primary request.
- **Warm whites** (cream, ivory) — the palette is cool.
- **Saturated reds, oranges, yellows** — except for the single destructive-action red (oklch 0.65 0.18 25), used sparingly.
- **Indigo / blue** — per the fullstack-dev skill's color restriction.

### Hairlines and glass

| Token | Value |
|-------|-------|
| `--hairline` | `rgba(255, 255, 255, 0.07)` |
| `--hairline-strong` | `rgba(255, 255, 255, 0.14)` |
| `--glass` | `rgba(255, 255, 255, 0.025)` |
| `--glass-strong` | `rgba(255, 255, 255, 0.05)` |

## Typography

### Font families

| Role | Font | Usage |
|------|------|-------|
| Display | **Cormorant Garamond** (300 weight) | Headlines, watch names, large editorial type. Italic for emphasis words. |
| Body | **Inter** (300–400 weight) | Paragraphs, descriptions, navigation |
| Mono | **JetBrains Mono** (400–500 weight) | Technical specs, reference numbers, eyebrows, labels |

### Type scale

| Class | Size | Usage |
|-------|------|-------|
| `.display-1` | `clamp(3.5rem, 10vw, 9rem)` | Hero headline only |
| `.display-2` | `clamp(2.5rem, 6vw, 5.5rem)` | Section headlines |
| `.display-3` | `clamp(2rem, 4vw, 3.5rem)` | Sub-section headlines, limited edition names |
| `.body-lg` | `1.125rem / 1.7` | Lead paragraphs |
| `.body-md` | `0.9375rem / 1.75` | Default body copy |
| `.eyebrow` | `11px, 0.32em tracking, uppercase` | Section labels, metadata |
| `.spec-mono` | `0.75rem, 0.08em tracking` | Technical specifications |

### Typography principles

- Display type is always **weight 300** (light) — never bold. Bold feels commercial; light feels editorial.
- Italic serif (`italic-serif` class) is used for emphasis words within headlines — e.g., "Quiet *Luxury.*"
- Letter-spacing on eyebrows and mono labels is wide (0.2em–0.32em) — this is where the "Swiss" feel lives.
- Numerals use `font-feature-settings: 'tnum'` (tabular) in the loader counter and spec readouts.

## Motion language

### Easing

| Token | Curve | Usage |
|-------|-------|-------|
| `--ease-lux` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default — long, considered ease-out |
| `--ease-precise` | `cubic-bezier(0.65, 0, 0.35, 1)` | Mechanical, symmetric |
| `--ease-emphasis` | `cubic-bezier(0.87, 0, 0.13, 1)` | Dramatic entrances/exits |

### Motion principles

1. **Scroll drives everything.** The 3D hero watch rotates ~540° and tilts as the user scrolls between sections. Horizontal-scroll Movements section. Sticky-scroll Craftsmanship. Scroll-revealed Heritage timeline.
2. **Long durations.** Entrances are 0.8s–1.2s. Exits are 1.1s. Nothing snaps.
3. **Staggered reveals.** Lists of items (collections grid, journal cards, boutique rows) entrance with 60–100ms stagger.
4. **No layout-thrash animations.** Use `transform` and `opacity` (or the independent `scale` property), never `width`/`height`/`padding`. (Detector-enforced.)
5. **Mouse parallax** on the hero watch — subtle (±0.3 rad).
6. **Magnetic buttons** drift toward the cursor (max 0.35× distance), release over 0.6s.
7. **Custom cursor** — platinum dot (instant) + delayed ring (0.18 lerp). Expands on interactive hover.
8. **Lenis smooth scroll** at 1.15s duration with exponential easing.

### Forbidden motion

- Bounce / spring physics (too playful for luxury)
- Linear easing (feels mechanical, not crafted)
- Animations under 0.4s (too abrupt)
- Rotation faster than 60s/revolution on ambient elements

## Layout

### Grid

- Max content width: `1600px`
- Horizontal padding: `1.5rem` (mobile) / `2.5rem` (desktop)
- 12-column grid with `gap: 2rem` (mobile) / `4rem` (desktop)
- Vertical grid lines are sometimes drawn as faint hairlines for structural texture

### Spacing rhythm

- Section padding: `8rem` (mobile) / `12rem` (desktop) top and bottom
- Between sub-sections: `4rem`–`8rem`
- Between paragraphs: `1.5rem`–`2.5rem`
- Card padding: `1.25rem`–`2rem`

### Responsive behavior

- Mobile-first. Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Collections grid: 1 col (mobile) → 2 (sm) → 3 (lg) → 4 (xl)
- Hero: single column on mobile, split-screen at `lg`
- Movements: horizontal scroll disabled on mobile (stacks vertically)

## Components

### Signature components

| Component | Purpose |
|-----------|---------|
| `MagneticButton` | CTA that drifts toward cursor |
| `WatchCard` | SVG-rendered watch face in collections grid |
| `Watch3D` | Procedural Three.js watch in hero |
| `Marquee` | Infinite horizontal scroll of brand values |
| `CustomCursor` | Platinum dot + delayed ring |
| `ScrollProgress` | Top progress bar + section label |
| `Loader` | Animated seconds-hand + 000–100 counter |

### Component principles

- Cards use `surface-elevated` (gradient + hairline border + soft shadow)
- Hover states: border brightens, subtle radial glow appears, content lifts
- All interactive elements have `data-cursor="hover"` to trigger cursor expansion
- Touch targets minimum 44px

## Iconography

- Custom SVG arrows for all "discover" / "read" links
- No icon library (Lucide) used in the BAY interface — icons are hand-drawn for specificity
- Watch face elements (hands, markers, gears) are all procedural SVG/Three.js

## Imagery direction

- **No photography currently** — all visuals are procedural (SVG watch faces, Three.js 3D watch, CSS gradients)
- When photography is added: macro shots of movement details, raking-light dial shots, hand shots on dark backgrounds
- Never use stock photography
- Never show watches on white backgrounds — always on `--bg` or `--surface-1`

## What NOT to do

- **No gold.** Anywhere. Ever.
- **No warm tones.** The palette is cool only.
- **No e-commerce patterns.** No carts, no prices in buttons, no "buy now."
- **No bold display type.** Weight 300 only.
- **No layout-thrash animations.** Transform/opacity/scale only.
- **No stock icons.** Hand-drawn SVG only.
- **No generic copy.** Every word is intentional and editorial.
- **No artificial endings.** No "------End------" markers.
