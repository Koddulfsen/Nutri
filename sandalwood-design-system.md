# Sandalwood Design System

> The Innocent archetype by candlelight — olive-dark, warm gold, apricot glow.  
> Warmth doesn't need brightness. Safety through softness, not absence of shadow.

---

## Philosophy

Sandalwood is built on the Innocent archetype's core: safety, purity, simplicity. In dark mode this means **gentle contrast**, **generous breathing room**, and **nothing that shouts**. Every element invites — nothing demands. The palette draws from aged wood, candlelit parchment, and warm earth: olive-blacks, apricot accents that glow like embers, and gold-cream tones that feel nourishing.

### Principles

1. **Warm over cold** — every surface carries a warm undertone. No blue-grays, no cool neutrals. Even the darkest background should feel like a room with a fire, not a void.
2. **Glow over flash** — accent colors should feel like they emit warmth, not reflect light. Use accent-soft backgrounds to create a halo effect around interactive elements.
3. **Breathe** — generous padding, ample line-height, whitespace is structural. When in doubt, add more space.
4. **One voice** — restrained, calm, inviting. The UI whispers. Reserve high-contrast accent for a single focal point per view.
5. **Depth through layering** — use the bg → bg-soft → bg-accent → surface progression to create subtle depth without shadows or elevation.

---

## Color Tokens

### Backgrounds

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0A0A06` | Page/app background, deepest layer |
| `--bg-soft` | `#10100A` | Cards, panels, sidebar backgrounds |
| `--bg-accent` | `#181610` | Hover states, active backgrounds, subtle emphasis |
| `--surface` | `#0E0E08` | Elevated surfaces, modals, dropdowns, input backgrounds |

### Borders

| Token | Hex | Usage |
|---|---|---|
| `--border` | `#262218` | Default borders, dividers, separators |
| `--border-soft` | `#1C1A14` | Subtle borders, inner dividers, section breaks |

### Text

| Token | Hex | Usage |
|---|---|---|
| `--text-1` | `#E0D4B8` | Primary text, headings, important content |
| `--text-2` | `#9A8E6E` | Secondary text, descriptions, body copy |
| `--text-3` | `#686048` | Tertiary text, labels, placeholders, hints |

### Accent (apricot / warm gold)

| Token | Hex | Usage |
|---|---|---|
| `--accent` | `#D4A468` | Primary interactive elements, focus rings, active states |
| `--accent-soft` | `#221C10` | Accent backgrounds, badges, notification fills |
| `--accent-text` | `#E8B880` | Text on accent-soft backgrounds, links |
| `--accent-border` | `rgba(212, 164, 104, 0.16)` | Border for accent-soft containers |
| `--accent-hover` | `#2A2214` | Hover state for accent-soft backgrounds |

### Warn (deeper amber)

| Token | Hex | Usage |
|---|---|---|
| `--warn` | `#C48850` | Warning indicators, elevated values, attention without alarm |
| `--warn-soft` | `#201A0E` | Warning badge backgrounds, subtle highlights |
| `--warn-text` | `#D8A068` | Text on warn-soft backgrounds |
| `--warn-border` | `rgba(196, 136, 80, 0.12)` | Border for warn-soft containers |

### Semantic ring colors (data visualization)

| Token | Hex | Usage |
|---|---|---|
| `--ring-1` | `#D4A468` | Primary data ring (protein, primary metric) |
| `--ring-2` | `#C4B490` | Secondary data ring (carbs, secondary metric) |
| `--ring-3` | `#7A7458` | Tertiary data ring (fat, muted metric) |
| `--ring-4` | `#D4A468` | Quaternary data ring (sugar, accent echo) |

---

## Typography

### Font stack

```
--font-display: 'Instrument Serif', Georgia, serif
--font-body: 'DM Sans', sans-serif
--font-mono: 'DM Mono', monospace
--font-jp: 'Noto Serif JP', serif
```

### Scale

| Role | Font | Size | Weight | Line-height | Extra |
|---|---|---|---|---|---|
| Display heading | `--font-display` | 30px | 400 | 1.2 | `letter-spacing: -0.01em` |
| Section heading | `--font-display` | 20px | 400 | 1.3 | Italic variant available |
| Japanese accent | `--font-jp` | 20px | 200 | 1.3 | Cultural section headers only |
| Japanese small | `--font-jp` | 12px | 300 | 1.4 | Logo subtext, seasonal labels |
| Body | `--font-body` | 14px | 400 | 1.6 | Color: `--text-2` |
| Body emphasis | `--font-body` | 14px | 500 | 1.6 | Color: `--text-1` |
| Small body | `--font-body` | 13px | 400 | 1.6 | Sidebar items, food names |
| Label / overline | `--font-body` | 10px | 500 | 1.4 | `uppercase`, `letter-spacing: 0.12em`, color: `--text-3` |
| Data value | `--font-mono` | 12px | 400 | 1.6 | Color: `--text-2`, right-aligned |
| Data small | `--font-mono` | 11px | 400 | 1.6 | Compound values, percentages |
| Data tiny | `--font-mono` | 10px | 400 | 1.4 | DV percentages, tertiary data |

### Rules

- Only two weights: 400 (regular) and 500 (medium). Never use 600 or 700.
- Display font (Instrument Serif) is for headings and hero text only. Never for body copy, labels, or UI elements.
- Japanese font (Noto Serif JP) is for cultural accent headers and brand marks only. Never for labels, body text, or UI chrome.
- All labels and overlines are uppercase with wide letter-spacing (0.12em).
- Sentence case everywhere. Never Title Case or ALL CAPS for content text.
- Mono font (DM Mono) is for all numerical data, values, and technical readouts.

---

## Spacing

| Token | Value | Usage |
|---|---|---|
| `--space-xs` | `4px` | Tight gaps, badge padding vertical |
| `--space-sm` | `8px` | Icon gaps, inline element spacing |
| `--space-md` | `16px` | Standard content gap, card internal padding |
| `--space-lg` | `24px` | Section spacing, card padding, sidebar padding |
| `--space-xl` | `36px` | Major section breaks, section bottom padding |
| `--space-2xl` | `48px` | Page-level vertical rhythm, main content padding |

### Rule

When choosing between tighter or looser, always choose looser. Breathing room is the Innocent's signature.

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `12px` | Inputs, compound grid container, small cards |
| `--radius` | `20px` | Cards, panels, modals, primary containers |
| `--radius-pill` | `50px` | Buttons, pills, tags, picker toggles |

### Rule

Default to `--radius` (20px) for containers and `--radius-pill` (50px) for interactive elements. The roundness is core to the Innocent's softness — never use sharp corners (0–4px) unless rendering a code block or data table cell.

---

## Components

### Buttons

```
Primary:    bg: --accent       | color: --bg         | radius: --radius-pill | weight: 500
Secondary:  bg: --accent-soft  | color: --accent-text | border: --accent-border | radius: --radius-pill
Ghost:      bg: transparent    | color: --text-2      | border: --border     | radius: --radius-pill
Warn:       bg: --warn-soft    | color: --warn-text   | border: --warn-border | radius: --radius-pill
```

- Padding: `10px 22px`
- Font: `--font-body`
- Font size: `13px`
- Font weight: `500`
- One primary button per view maximum. Everything else is secondary or ghost.
- Hover state: shift background one step warmer (accent-soft → accent-hover), no transforms or scale effects.
- No box shadows on buttons. Ever.

### Badges / pills

```
Accent:  bg: --accent-soft  | color: --accent-text | border: --accent-border
Warn:    bg: --warn-soft    | color: --warn-text   | border: --warn-border
Muted:   bg: --bg-accent    | color: --text-2      | border: --border
Solid:   bg: --accent       | color: --bg          | no border
```

- Padding: `5px 14px`
- Font: `--font-body`
- Font size: `11px`
- Font weight: `500`
- Border radius: `--radius-pill`

### Ratio badges

A specialized badge for displaying mineral/nutrient ratios:

```
Normal:  bg: --bg-accent    | color: --text-2  | border: --border       | radius: --radius-pill
Warn:    bg: --warn-soft    | color: --warn-text | border: --warn-border | radius: --radius-pill
```

- Contains two elements: `.ratio-label` (10px, uppercase, `--text-3`) and the ratio value (11px mono, inherits color).
- Used for Ca:P, Cu:Zn, Na:K, and other mineral ratio callouts.

### Inputs

- Background: `--surface`
- Border: `1px solid --border`
- Border radius: `--radius-sm`
- Padding: `10px 16px`
- Font: `--font-body`, 14px, color `--text-1`
- Placeholder color: `--text-3`
- Focus state: `border-color: --accent` with `box-shadow: 0 0 0 2px --accent-soft`
- No background color change on focus.

### Numeric inputs

- Same as inputs but: `--font-mono`, 12px, `text-align: center`, width `44px`.
- Used for age, serving size, quantity fields.

### Search bar

- Same as inputs with left icon padding (44px left).
- Icon: 16px, stroke `--text-3`, 1.5px weight, outline style.
- Max width: `480px`, centered.

### Picker / segmented toggle

```
Container: border: 1px solid --border | radius: --radius-pill | overflow: hidden
Option:    padding: 5px 14px | font: --font-body 11px 500 | color: --text-3
Hover:     bg: --bg-accent | color: --text-2
Selected:  bg: --accent-soft | color: --accent-text
```

- Options separated by `1px solid --border`.
- Used for sex picker (Male/Female), activity level, goal selection.

### Cards

- Background: `--surface`
- Border: `1px solid --border-soft`
- Border radius: `--radius`
- Padding: `22px 20px`
- No shadows. No gradients. Depth from background color only.
- Card titles use `--font-display` at 19px.
- Card body uses `--font-body` at 13px, color `--text-2`.

### Sidebar

- Width: `260px`
- Background: `--bg-soft`
- Border right: `1px solid --border-soft`
- Position: sticky, full viewport height
- Head section: `--space-lg` padding, bordered bottom
- Food items: 10px vertical padding, `--space-lg` horizontal, border-bottom `--border-soft`
- Hover: background shifts to `--bg-accent`
- Totals footer: `--surface` background, `--font-mono` 12px

### Compound grid

- 2-column CSS grid, 1px gap colored `--border-soft`
- Container: `--radius-sm` border radius, overflow hidden
- Cell: `--bg` background, 14px vertical / `--space-md` horizontal padding
- Cell hover: `--bg-soft` background
- Name: 76px width, `--font-body` 12px, `--text-2`
- Bar: 4px height, `--bg-accent` track, 2px radius, fill uses `--accent` at 0.15–0.32 opacity
- Value: `--font-mono` 11px, `--text-2`, 58px width, right-aligned
- DV%: `--font-mono` 10px, `--text-3`, 42px width, right-aligned
- Elevated state: name/value shift to `--warn-text`, DV shifts to `--warn`, bar fill uses `--warn`

### Macro rings

- SVG circle, 80×80px container
- Track: 3px stroke, `--bg-accent` color
- Fill: 3px stroke, ring color token at 0.22–0.45 opacity, `stroke-linecap: round`
- Value: `--font-display` 20px, `--text-1`
- Unit: `--font-mono` 10px, `--text-3`
- Label: 10px overline style below ring

---

## Interaction & Motion

### Transitions

- Default: `all 0.2s ease`
- Background/color changes: `0.15s ease`
- Layout shifts: `0.3s ease`
- Data bar fills: `0.8s ease` (gentle reveal)
- Never use bounce, elastic, or spring easing. The Innocent doesn't jump — it glides.

### Hover states

- Backgrounds: lighten by one step (bg → bg-soft, bg-soft → bg-accent)
- Borders: shift from `--border-soft` to `--border`
- Text: shift from `--text-2` to `--text-1`
- No scale transforms, no lifts, no shadows appearing on hover.

### Focus states

- `box-shadow: 0 0 0 2px --accent-soft`
- `border-color: --accent`
- Visible and obvious but not aggressive.

---

## Layout Rules

1. Max content width: `720px`. Center with auto margins.
2. Sidebar width: `260px`. Background: `--bg-soft`. Sticky, full height.
3. Main content padding: `--space-2xl` (48px).
4. Section spacing: `--space-2xl` (48px) margin-bottom, `--space-xl` (36px) padding-bottom with `--border-soft` divider.
5. Card grids: `gap: 12px`. Prefer 2-column on desktop, single column on mobile.
6. No decorative dividers. Use spacing to separate sections. If a divider is truly needed, use `1px solid --border-soft`.
7. No shadows. Depth comes from background color layering only.
8. No gradients on surfaces.

---

## Data Visualization

### Compound bars

- Track: 4px height, `--bg-accent`, 2px radius
- Fill: accent color at variable opacity (0.10–0.32) based on percentage
- Opacity scale: `<20%` → 0.10, `20–50%` → 0.15–0.18, `50–80%` → 0.20–0.25, `>80%` → 0.28–0.32
- Elevated/warning values use `--warn` instead of `--accent`, at 0.35–0.40 opacity

### Macro rings

- Use `stroke-dasharray` on SVG circles: `value / total * circumference` for filled portion
- Circumference for r=34: `214px`
- Each macro gets a distinct ring color from the `--ring-*` tokens
- Protein: `--ring-1` (accent gold), Carbs: `--ring-2` (muted cream), Fat: `--ring-3` (olive), Sugar: `--ring-4` (accent echo)

### Ratio badges

- Displayed in a horizontal flex row below the compound grid
- Normal ratios: muted badge style
- Out-of-range ratios: warn badge style
- Common ratios to display: Ca:P, Cu:Zn, Na:K

---

## Iconography

- Style: outline, 1.5px stroke, rounded caps and joins
- Size: 16px default, 20px for nav/toolbar
- Color: `--text-3` default, `--text-2` on hover, `--accent` for active state
- Never use filled/solid icons. The Innocent prefers the openness of outlines.

---

## Cultural Accents

Sandalwood integrates Japanese typographic elements as cultural texture, not decoration:

- **Section headers** may pair a Japanese kanji label (Noto Serif JP, 20px, weight 200, `--text-1`) with an English overline label.
- **Brand mark** uses `栄養` (Noto Serif JP, 12px, weight 300, `--text-3`) above the Instrument Serif wordmark.
- **Seasonal markers** (optional) use Noto Serif JP at 11px for 24 solar terms (二十四節気).
- Japanese text is always secondary to English — it provides atmosphere, not information hierarchy.

---

## Do / Don't

### Do

- Use generous whitespace — it's your primary design tool
- Let accent colors glow warmly against olive-dark backgrounds
- Keep text hierarchy to 3 levels max (primary, secondary, tertiary)
- Use border-soft for most dividers, border for emphasis
- Let the serif display font carry elegance at large sizes
- Use accent-soft as a warm halo behind important elements
- Use the warn system for health data that needs attention without alarm

### Don't

- Use box shadows or drop shadows anywhere
- Use font weight above 500
- Use solid bright backgrounds for large areas — accent is for small touches
- Use cool colors (blue, purple, cold gray) anywhere in the system
- Use sharp corners (under 8px radius) except for code/data cells
- Add noise textures, grain overlays, or pattern backgrounds
- Use motion to draw attention — use color and space instead
- Put serif or Japanese font on body text, labels, or UI elements
- Use red for warnings — Sandalwood uses `--warn` (amber) to maintain warmth

---

## CSS Variables Export

```css
:root[data-theme="sandalwood"] {
  /* Backgrounds */
  --bg: #0A0A06;
  --bg-soft: #10100A;
  --bg-accent: #181610;
  --surface: #0E0E08;

  /* Borders */
  --border: #262218;
  --border-soft: #1C1A14;

  /* Text */
  --text-1: #E0D4B8;
  --text-2: #9A8E6E;
  --text-3: #686048;

  /* Accent */
  --accent: #D4A468;
  --accent-soft: #221C10;
  --accent-text: #E8B880;
  --accent-border: rgba(212, 164, 104, 0.16);
  --accent-hover: #2A2214;

  /* Warn */
  --warn: #C48850;
  --warn-soft: #201A0E;
  --warn-text: #D8A068;
  --warn-border: rgba(196, 136, 80, 0.12);

  /* Data rings */
  --ring-1: #D4A468;
  --ring-2: #C4B490;
  --ring-3: #7A7458;
  --ring-4: #D4A468;

  /* Radius */
  --radius: 20px;
  --radius-sm: 12px;
  --radius-pill: 50px;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 36px;
  --space-2xl: 48px;

  /* Typography */
  --font-display: 'Instrument Serif', Georgia, serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'DM Mono', monospace;
  --font-jp: 'Noto Serif JP', serif;
}
```

---

## Tailwind Configuration

```js
// tailwind.config.js — Sandalwood theme extension
module.exports = {
  theme: {
    extend: {
      colors: {
        sand: {
          bg: '#0A0A06',
          'bg-soft': '#10100A',
          'bg-accent': '#181610',
          surface: '#0E0E08',
          border: '#262218',
          'border-soft': '#1C1A14',
          'text-1': '#E0D4B8',
          'text-2': '#9A8E6E',
          'text-3': '#686048',
          accent: '#D4A468',
          'accent-soft': '#221C10',
          'accent-text': '#E8B880',
          'accent-hover': '#2A2214',
          warn: '#C48850',
          'warn-soft': '#201A0E',
          'warn-text': '#D8A068',
          'ring-1': '#D4A468',
          'ring-2': '#C4B490',
          'ring-3': '#7A7458',
          'ring-4': '#D4A468',
        },
      },
      borderRadius: {
        sand: '20px',
        'sand-sm': '12px',
        'sand-pill': '50px',
      },
      fontFamily: {
        display: ['Instrument Serif', 'Georgia', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        jp: ['Noto Serif JP', 'serif'],
      },
      spacing: {
        'sand-xs': '4px',
        'sand-sm': '8px',
        'sand-md': '16px',
        'sand-lg': '24px',
        'sand-xl': '36px',
        'sand-2xl': '48px',
      },
    },
  },
};
```

Usage: `bg-sand-bg`, `text-sand-accent-text`, `border-sand-border`, `rounded-sand-pill`, `font-display`, `p-sand-lg`, etc.
