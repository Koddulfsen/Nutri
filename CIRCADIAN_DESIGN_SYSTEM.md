# Circadian Design System

> The Innocent archetype after dark — a living palette that breathes with the sun.  
> Aurora (cyan/ice) at solar noon. Salmon Night (dusky pink) at dusk and through the night.  
> The transition is continuous, never a hard switch.

## Philosophy

This system treats the UI as a living organism that follows the user's local sun. At peak daylight hours the interface is cool and alert — arctic cyan, deep ocean blues. As the sun drops, warmth seeps in — the cyans blush into salmon, the ice melts into ember. By night the palette is fully warm: intimate, soft, candlelit pink on charcoal.

The transition is never a binary toggle. Every color token is interpolated on a sine curve mapped to solar altitude. The user never notices a "switch" — they notice the interface feels *right* for the time of day.

### Principles

1. **Follow the sun** — palette shifts continuously based on solar position, not clock time.
2. **Soft over sharp** — rounded corners, gentle transitions, muted borders. No hard edges.
3. **Glow over flash** — accents feel like they emit light. Cyan glows cold, salmon glows warm.
4. **Breathe** — generous padding, ample line-height, whitespace is structural.
5. **One voice** — restrained, calm, inviting. The UI whispers at any hour.

---

## The Three Stops

A direct two-stop blend between cyan (Aurora) and salmon creates a dead gray zone
at the midpoint — the complementary hues cancel each other out. The fix is a warm
amber/gold **bridge stop** (Ember) at golden hour that keeps the palette alive
through the entire transition.

### Aurora (solar peak — midday)
Cold, crisp, alert. Northern lights over dark ice. Peak blue-light hours.

### Ember (golden hour — transition)
Warm amber and gold. The bridge between ice and fire. Prevents gray washout.

### Salmon Night (solar trough — dusk/night)
Warm, intimate, dusky. Candlelit pink on charcoal. The world winding down.

The blend curve:
- **t = 0.0** → Pure Aurora (±1h from solar noon)
- **t = 0.5** → Pure Ember (±4–5h from noon, golden hour)
- **t = 1.0** → Pure Salmon Night (±8h+ from noon, deep night)
- Dawn reverses the path: Salmon → Ember → Aurora

### Implementation

```typescript
// circadian-theme.ts

type RGB = [number, number, number];

interface ThemePole {
  bg: RGB;
  bgSoft: RGB;
  bgAccent: RGB;
  surface: RGB;
  border: RGB;
  borderSoft: RGB;
  text1: RGB;
  text2: RGB;
  text3: RGB;
  accent: RGB;
  accentSoft: RGB;
  accentText: RGB;
  warm: RGB;
  warmSoft: RGB;
  warmText: RGB;
}

const AURORA: ThemePole = {
  bg:         [10,14,20],
  bgSoft:     [16,22,30],
  bgAccent:   [21,30,40],
  surface:    [14,19,24],
  border:     [28,42,56],
  borderSoft: [24,36,48],
  text1:      [200,224,240],
  text2:      [106,142,168],
  text3:      [62,100,128],
  accent:     [0,212,204],
  accentSoft: [12,40,40],
  accentText: [64,240,232],
  warm:       [0,168,180],
  warmSoft:   [12,32,36],
  warmText:   [48,216,224],
};

const EMBER: ThemePole = {
  bg:         [16,13,11],
  bgSoft:     [22,18,15],
  bgAccent:   [30,24,20],
  surface:    [19,16,13],
  border:     [46,36,28],
  borderSoft: [38,30,24],
  text1:      [240,220,195],
  text2:      [180,148,110],
  text3:      [120,94,68],
  accent:     [240,180,80],
  accentSoft: [36,28,14],
  accentText: [255,208,120],
  warm:       [210,150,60],
  warmSoft:   [30,22,10],
  warmText:   [240,190,100],
};

const SALMON_NIGHT: ThemePole = {
  bg:         [18,16,15],
  bgSoft:     [26,22,21],
  bgAccent:   [34,30,28],
  surface:    [22,19,18],
  border:     [52,40,40],
  borderSoft: [42,34,34],
  text1:      [240,220,214],
  text2:      [192,144,136],
  text3:      [138,94,88],
  accent:     [232,107,107],
  accentSoft: [44,22,22],
  accentText: [255,136,136],
  warm:       [212,112,110],
  warmSoft:   [38,20,20],
  warmText:   [240,144,144],
};

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)];
}

function toHex([r, g, b]: RGB): string {
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

/**
 * Three-stop interpolation: a → mid → b
 * t=0 → a, t=0.5 → mid, t=1 → b
 */
function threeStopLerp(a: RGB, mid: RGB, b: RGB, t: number): RGB {
  if (t <= 0.5) {
    return lerpRgb(a, mid, t / 0.5);
  } else {
    return lerpRgb(mid, b, (t - 0.5) / 0.5);
  }
}

/**
 * Calculate blend factor (0 = Aurora, 0.5 = Ember, 1 = Salmon Night)
 * 
 * Cosine curve centered on solar noon:
 *   ±1h from noon  → t = 0.0 (pure Aurora)
 *   ±4-5h from noon → t ≈ 0.5 (golden hour / Ember)
 *   ±8h+ from noon → t = 1.0 (pure Salmon Night)
 */
function getBlendFactor(solarNoonHour: number = 12.0): number {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const hoursFromNoon = Math.abs(currentHour - solarNoonHour);
  
  const AURORA_WINDOW = 1;  // hours of pure Aurora around noon
  const SALMON_ONSET = 8;   // hours from noon to full Salmon
  
  if (hoursFromNoon <= AURORA_WINDOW) return 0;
  if (hoursFromNoon >= SALMON_ONSET) return 1;
  
  const progress = (hoursFromNoon - AURORA_WINDOW) / (SALMON_ONSET - AURORA_WINDOW);
  return (1 - Math.cos(progress * Math.PI)) / 2;
}

/**
 * Generate the full interpolated theme as hex values
 */
function getCircadianTheme(solarNoonHour?: number): Record<string, string> {
  const t = getBlendFactor(solarNoonHour);
  const keys = Object.keys(AURORA) as (keyof ThemePole)[];
  const result: Record<string, string> = {};
  for (const key of keys) {
    result[key] = toHex(threeStopLerp(AURORA[key], EMBER[key], SALMON_NIGHT[key], t));
  }
  return result;
}

/**
 * Apply theme to CSS custom properties on :root
 * Call on load and on a 5-minute interval
 */
function applyCircadianTheme(solarNoonHour?: number): void {
  const theme = getCircadianTheme(solarNoonHour);
  const root = document.documentElement;
  const tokenMap: Record<string, string> = {
    bg: '--bg', bgSoft: '--bg-soft', bgAccent: '--bg-accent',
    surface: '--surface', border: '--border', borderSoft: '--border-soft',
    text1: '--text-1', text2: '--text-2', text3: '--text-3',
    accent: '--accent', accentSoft: '--accent-soft', accentText: '--accent-text',
    warm: '--warm', warmSoft: '--warm-soft', warmText: '--warm-text',
  };
  for (const [key, prop] of Object.entries(tokenMap)) {
    root.style.setProperty(prop, theme[key]);
  }
}

export {
  AURORA,
  EMBER,
  SALMON_NIGHT,
  getBlendFactor,
  getCircadianTheme,
  applyCircadianTheme,
  threeStopLerp,
  lerpRgb,
  toHex,
};
```

### React hook

```typescript
// use-circadian-theme.ts
import { useEffect, useState } from 'react';
import { getBlendFactor, applyCircadianTheme } from './circadian-theme';

const UPDATE_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

export function useCircadianTheme() {
  const [blendFactor, setBlendFactor] = useState(0);

  useEffect(() => {
    const solarNoon = 12.0; // replace with SunCalc for precision

    function update() {
      applyCircadianTheme(solarNoon);
      setBlendFactor(getBlendFactor(solarNoon));
    }

    update();
    const interval = setInterval(update, UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // blendFactor: 0 = Aurora, ~0.5 = Ember/golden hour, 1 = Salmon Night
  return { blendFactor };
}
```

### Optional: precision with SunCalc

```typescript
// For accurate solar position, install suncalc:
// npm install suncalc

import SunCalc from 'suncalc';

function getPreciseSolarNoon(lat: number, lng: number): number {
  const times = SunCalc.getTimes(new Date(), lat, lng);
  const noon = times.solarNoon;
  return noon.getHours() + noon.getMinutes() / 60;
}

// Usage with geolocation:
navigator.geolocation.getCurrentPosition((pos) => {
  const solarNoon = getPreciseSolarNoon(pos.coords.latitude, pos.coords.longitude);
  applyCircadianTheme(solarNoon);
});
```

---

## Color Tokens (all three poles)

### Backgrounds

| Token | Aurora (noon) | Ember (golden hour) | Salmon Night | Usage |
|---|---|---|---|---|
| `--bg` | `#0A0E14` | `#100D0B` | `#12100F` | Page background |
| `--bg-soft` | `#10161E` | `#16120F` | `#1A1615` | Cards, panels |
| `--bg-accent` | `#151E28` | `#1E1814` | `#221E1C` | Hover, emphasis |
| `--surface` | `#0E1318` | `#13100D` | `#161312` | Modals, dropdowns |

### Borders

| Token | Aurora | Ember | Salmon Night | Usage |
|---|---|---|---|---|
| `--border` | `#1C2A38` | `#2E241C` | `#342828` | Default borders |
| `--border-soft` | `#182430` | `#261E18` | `#2A2222` | Subtle dividers |

### Text

| Token | Aurora | Ember | Salmon Night | Usage |
|---|---|---|---|---|
| `--text-1` | `#C8E0F0` | `#F0DCC3` | `#F0DCD6` | Primary text |
| `--text-2` | `#6A8EA8` | `#B4946E` | `#C09088` | Body copy |
| `--text-3` | `#3E6480` | `#785E44` | `#8A5E58` | Labels, hints |

### Accent

| Token | Aurora | Ember | Salmon Night | Usage |
|---|---|---|---|---|
| `--accent` | `#00D4CC` | `#F0B450` | `#E86B6B` | Primary interactive |
| `--accent-soft` | `#0C2828` | `#241C0E` | `#2C1616` | Accent backgrounds |
| `--accent-text` | `#40F0E8` | `#FFD078` | `#FF8888` | Links, accent labels |

### Warm / secondary

| Token | Aurora | Ember | Salmon Night | Usage |
|---|---|---|---|---|
| `--warm` | `#00A8B4` | `#D2963C` | `#D4706E` | Secondary actions |
| `--warm-soft` | `#0C2024` | `#1E160A` | `#261414` | Secondary fills |
| `--warm-text` | `#30D8E0` | `#F0BE64` | `#F09090` | Secondary text |

---

## Typography

### Font stack

```
--font-display: 'Instrument Serif', Georgia, serif
--font-body: 'DM Sans', sans-serif
--font-mono: 'DM Mono', monospace
```

### Scale

| Role | Font | Size | Weight | Line-height |
|---|---|---|---|---|
| Display heading | `--font-display` | 30px | 400 | 1.2 |
| Section heading | `--font-display` | 20px | 400 | 1.3 |
| Body | `--font-body` | 14px | 400 | 1.6 |
| Body emphasis | `--font-body` | 14px | 500 | 1.6 |
| Label / overline | `--font-body` | 10px | 500 | 1.4 |
| Code | `--font-mono` | 12px | 400 | 1.6 |

### Rules

- Only weights 400 and 500. Never 600+.
- Display font for headings only. Never body, labels, or UI.
- Labels: uppercase, `letter-spacing: 0.12em`, color `--text-3`.
- Sentence case everywhere.

---

## Spacing

| Token | Value |
|---|---|
| `--space-xs` | `4px` |
| `--space-sm` | `8px` |
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `36px` |
| `--space-2xl` | `48px` |

When choosing between tighter or looser, always choose looser.

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `12px` | Inputs, small cards, code blocks |
| `--radius` | `20px` | Cards, panels, modals |
| `--radius-pill` | `50px` | Buttons, pills, tags |

Never use sharp corners (0-4px) except for code blocks or data tables.

---

## Components

All components use CSS custom properties so they automatically follow the circadian blend. No component needs to know what time it is — it just references `var(--accent)` and the system handles the rest.

### Buttons

```
Primary:    bg: var(--accent)      | color: var(--bg)         | radius: var(--radius-pill)
Secondary:  bg: var(--accent-soft) | color: var(--accent-text) | border: 1px solid accent/20%
Ghost:      bg: transparent        | color: var(--text-2)      | border: 1px solid var(--border)
Warm:       bg: var(--warm-soft)   | color: var(--warm-text)   | border: 1px solid warm/20%
```

- Padding: `10px 22px`, font: 13px/500
- One primary per view. No shadows. Hover: opacity shift only.

### Badges

```
Accent:  bg: var(--accent-soft)  | color: var(--accent-text) | border: accent/15%
Warm:    bg: var(--warm-soft)    | color: var(--warm-text)   | border: warm/15%
Muted:   bg: var(--bg-accent)   | color: var(--text-2)      | border: var(--border)
```

- Padding: `5px 14px`, font: 11px/500, radius: `--radius-pill`

### Cards

- Background: `var(--surface)`, border: `1px solid var(--border-soft)`, radius: `var(--radius)`
- Optional subtle radial glow in corner with `var(--accent-soft)`
- Title: `--font-display` 19px, body: `--font-body` 13px `var(--text-2)`

### Inputs

- Background: `var(--surface)`, border: `var(--border)`, radius: `var(--radius-sm)`
- Focus: `border-color: var(--accent)`, `box-shadow: 0 0 0 2px var(--accent-soft)`

### Notifications

- Background: `var(--accent-soft)`, border: `accent/15%`, radius: `var(--radius-sm)`
- Icon: 24px circle `var(--accent)` bg

---

## Interaction & Motion

- Default transition: `all 0.2s ease`
- Theme interpolation: `5 minute` update interval with CSS transitions handling the smoothness
- Hover: lighten one background step. No transforms or shadows.
- Focus: `box-shadow: 0 0 0 2px var(--accent-soft)`, `border-color: var(--accent)`
- Never use bounce, elastic, or spring easing.

---

## Layout

- Max content width: `720px`
- Section spacing: `var(--space-xl)` (36px)
- Card grid gap: `12px`
- No shadows anywhere. Depth from background layering only.
- No surface gradients. Only subtle radial glow inside cards.

---

## Do / Don't

### Do

- Reference CSS variables for all colors — never hardcode hex values in components
- Let the circadian system handle all color transitions automatically
- Use generous whitespace
- Keep text hierarchy to 3 levels (text-1, text-2, text-3)
- Test components at both poles (noon and midnight) to ensure readability

### Don't

- Hardcode any color hex in components — always use `var(--token)`
- Add a manual dark/light toggle — the sun is the toggle
- Use shadows, gradients, or elevation for depth
- Use font weight above 500
- Use sharp corners under 8px except for code/data
- Fight the blend — if a component looks bad mid-transition, simplify it

---

## Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // These reference CSS custom properties set by the circadian system
        circadian: {
          bg:          'var(--bg)',
          'bg-soft':   'var(--bg-soft)',
          'bg-accent': 'var(--bg-accent)',
          surface:     'var(--surface)',
          border:      'var(--border)',
          'border-soft': 'var(--border-soft)',
          'text-1':    'var(--text-1)',
          'text-2':    'var(--text-2)',
          'text-3':    'var(--text-3)',
          accent:      'var(--accent)',
          'accent-soft': 'var(--accent-soft)',
          'accent-text': 'var(--accent-text)',
          warm:        'var(--warm)',
          'warm-soft': 'var(--warm-soft)',
          'warm-text': 'var(--warm-text)',
        },
      },
      borderRadius: {
        DEFAULT: '20px',
        sm: '12px',
        pill: '50px',
      },
      fontFamily: {
        display: ['Instrument Serif', 'Georgia', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
};
```

Usage: `bg-circadian-bg`, `text-circadian-accent-text`, `border-circadian-border`, `rounded-pill`, etc.

All colors resolve to CSS variables at runtime. The circadian engine updates the variables, Tailwind classes follow automatically. Zero component-level logic needed.

---

## CSS Variables (static fallback)

If the JS circadian engine hasn't loaded yet, these defaults (Aurora) prevent a flash:

```css
:root {
  --bg: #0A0E14;
  --bg-soft: #10161E;
  --bg-accent: #151E28;
  --surface: #0E1318;
  --border: #1C2A38;
  --border-soft: #182430;
  --text-1: #C8E0F0;
  --text-2: #6A8EA8;
  --text-3: #3E6480;
  --accent: #00D4CC;
  --accent-soft: #0C2828;
  --accent-text: #40F0E8;
  --warm: #00A8B4;
  --warm-soft: #0C2024;
  --warm-text: #30D8E0;
  --radius: 20px;
  --radius-sm: 12px;
  --radius-pill: 50px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 36px;
  --space-2xl: 48px;
  --font-display: 'Instrument Serif', Georgia, serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'DM Mono', monospace;
}
```
