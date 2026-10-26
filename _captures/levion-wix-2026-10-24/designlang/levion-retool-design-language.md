# Design Language: Home | LEVION MATERIALS

> Extracted from `https://www.levion-materials.com` on October 24, 2026
> 697 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role | Hex | RGB | HSL | Usage Count |
|------|-----|-----|-----|-------------|
| Primary | `#d96502` | rgb(217, 101, 2) | hsl(28, 98%, 43%) | 15 |
| Secondary | `#116dff` | rgb(17, 109, 255) | hsl(217, 100%, 53%) | 2 |
| Accent | `#b74101` | rgb(183, 65, 1) | hsl(21, 99%, 36%) | 1 |

### Tonal Ramps

Generated in OKLCH from each role colour, so the steps are perceptually even. The site's own colour keeps its position in the ladder.

| Role | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| primary | `#ffe2b9` | `#ffd4a7` | `#ffc08d` | `#ffa267` | `#ed7c34` | **`#d96502`** | `#b24600` | `#943300` | `#7c2600` | `#671c00` | `#3e0a00` |
| secondary | `#bff6ff` | `#aeeaff` | `#96d8ff` | `#72bdff` | `#4598ff` | **`#116dff`** | `#035fe8` | `#0049c5` | `#003aa8` | `#002c8d` | `#001558` |
| accent | `#ffe0c3` | `#ffd2b2` | `#ffbe9a` | `#ffa078` | `#ef794c` | `#cf5826` | **`#b74101`** | `#953000` | `#7d2400` | `#681900` | `#3e0800` |
| neutral | `#f1f6fb` | `#e5eaf0` | `#d4dae0` | `#bbc1c8` | **`#969da5`** | `#7c838a` | `#676d74` | `#52575e` | `#42474d` | `#35393e` | `#1c1f22` |

### Semantic Pairs

| Role | Background | Foreground | Contrast | Level |
|------|------------|------------|----------|-------|
| `surface.page` | `#ffffff` | `#000000` | 21:1 | AAA |
| `surface.raised` | `#b74101` | `#ffffff` | 5.57:1 | AA |
| `action.primary` | `#d96502` | `#000000` | 5.81:1 | AA |
| `action.secondary` | `#116dff` | `#000000` | 4.66:1 | AA |
| `action.accent` | `#b74101` | `#ffffff` | 5.57:1 | AA |

### Dominance

Share of painted background area — what the page looks like, as opposed to what it declares most often.

- `#ffffff` — 84%
- `#043c53` — 8%
- `#b74101` — 6%
- `#000000` — 2%
- `#141414` — 0%

### Neutral Colors

| Hex | HSL | Usage Count |
|-----|-----|-------------|
| `#000000` | hsl(0, 0%, 0%) | 1194 |
| `#ffffff` | hsl(0, 0%, 100%) | 90 |
| `#141414` | hsl(0, 0%, 8%) | 35 |
| `#969da5` | hsl(212, 8%, 62%) | 1 |
| `#d6d6d6` | hsl(0, 0%, 84%) | 1 |

### Background Colors

Used on large-area elements: `#ffffff`, `#b74101`, `#043c53`, `#000000`

### Text Colors

Text color palette: `#000000`, `#116dff`, `#0000ee`, `#d96502`, `#055f84`, `#ffffff`, `#141414`

### Full Color Inventory

| Hex | Contexts | Count |
|-----|----------|-------|
| `#000000` | text, border, background | 1194 |
| `#ffffff` | background, border, text | 90 |
| `#055f84` | text, border | 40 |
| `#0000ee` | text, border | 35 |
| `#141414` | text, border, background | 35 |
| `#d96502` | border, text | 15 |
| `#116dff` | text, border | 2 |
| `#b74101` | background | 1 |
| `#043c53` | background | 1 |
| `#969da5` | border | 1 |
| `#d6d6d6` | border | 1 |

## Typography

### Font Families

- **wfont_ced490_9eb54a17069041c7b3a2095964951377** — used for body (38 elements)
- **wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4** — used for body (21 elements)
- **Arial** — used for body (6 elements)
- **wfont_66a541_b524e145baef478c9a1712a046b1333b** — used for body (2 elements)
- **Helvetica** — used for body (1 elements)

### Type System

- **Scale ratio** — irregular (11 distinct sizes, no modular ratio fits)
- **Measure** — ~62 characters per line (comfortable)
- **Fluid type** — none; sizes are fixed per breakpoint

### Named Scale

| Role | Size | Weight | Line Height | Tracking |
|------|------|--------|-------------|----------|
| `h1` | 64px / 4rem | 400 | 89.6px | normal |
| `title-1` | 28px / 1.75rem | 400 | 32px | normal |
| `title-2` | 26px / 1.625rem | 400 | 36.4px | normal |
| `h4` | 20px / 1.25rem | 700 | 20px | normal |
| `h2` | 18px / 1.125rem | 400 | 32.4px | normal |
| `body` | 16px / 1rem | 400 | normal | normal |
| `body-sm` | 14.994px / 0.9371rem | 700 | 18.7425px | normal |
| `micro` | 14px / 0.875rem | 400 | normal | normal |
| `sm-3` | 13.3333px / 0.8333rem | 400 | normal | normal |
| `sm-4` | 10.5px / 0.6563rem | 400 | 13.125px | normal |
| `sm-5` | 10px / 0.625rem | 400 | normal | normal |

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On |
|-----------|------------|--------|-------------|----------------|---------|
| 64px | 4rem | 400 | 89.6px | normal | h1, span |
| 28px | 1.75rem | 400 | 32px | normal | span |
| 26px | 1.625rem | 400 | 36.4px | normal | p, span |
| 20px | 1.25rem | 700 | 20px | normal | h4, span |
| 18px | 1.125rem | 400 | 32.4px | normal | h2, span |
| 16px | 1rem | 400 | normal | normal | html, head, meta, link |
| 14.994px | 0.9371rem | 700 | 18.7425px | normal | span, a, button |
| 14px | 0.875rem | 400 | normal | normal | button, span, h2, div |
| 13.3333px | 0.8333rem | 400 | normal | normal | button |
| 10.5px | 0.6563rem | 400 | 13.125px | normal | span, a |
| 10px | 0.625rem | 400 | normal | normal | body, script, svg, defs |

### Heading Scale

```css
h1 { font-size: 64px; font-weight: 400; line-height: 89.6px; }
h4 { font-size: 20px; font-weight: 700; line-height: 20px; }
h2 { font-size: 18px; font-weight: 400; line-height: 32.4px; }
h2 { font-size: 14px; font-weight: 400; line-height: normal; }
```

### Body Text

```css
body { font-size: 16px; font-weight: 400; line-height: normal; }
```

### Font Weights in Use

`400` (682x), `700` (11x), `600` (4x)

## Spacing

| Token | Value | Rem |
|-------|-------|-----|
| spacing-1 | 1px | 0.0625rem |
| spacing-8 | 8px | 0.5rem |
| spacing-16 | 16px | 1rem |
| spacing-24 | 24px | 1.5rem |
| spacing-29 | 29px | 1.8125rem |
| spacing-37 | 37px | 2.3125rem |
| spacing-40 | 40px | 2.5rem |
| spacing-43 | 43px | 2.6875rem |
| spacing-52 | 52px | 3.25rem |
| spacing-59 | 59px | 3.6875rem |
| spacing-68 | 68px | 4.25rem |
| spacing-81 | 81px | 5.0625rem |
| spacing-85 | 85px | 5.3125rem |
| spacing-120 | 120px | 7.5rem |
| spacing-149 | 149px | 9.3125rem |
| spacing-190 | 190px | 11.875rem |
| spacing-194 | 194px | 12.125rem |
| spacing-197 | 197px | 12.3125rem |
| spacing-257 | 257px | 16.0625rem |

## Border Radii

| Label | Value | Count |
|-------|-------|-------|
| sm | 4px | 3 |
| md | 8px | 4 |
| lg | 16px | 6 |
| xl | 24px | 1 |

## Elevation

2 levels from 3 raw shadows · neutral tint

**xs** — blur 21px, y 2.67px, used 5×
```css
box-shadow: rgba(0, 0, 0, 0.25) -1.36px 2.67px 21px 1px;
```

**sm** — blur 68px, y 32px, used 1×
```css
box-shadow: rgba(0, 0, 0, 0.3) 0px 32px 68px 0px;
```

## CSS Custom Properties

### Colors

```css
--wst-button-color-fill-primary: rgb(var(--color_48));
--wst-button-color-border-primary: rgb(var(--color_49));
--wst-button-color-text-primary: rgb(var(--color_50));
--wst-button-color-fill-primary-hover: rgb(var(--color_51));
--wst-button-color-border-primary-hover: rgb(var(--color_52));
--wst-button-color-text-primary-hover: rgb(var(--color_53));
--wst-button-color-fill-primary-disabled: rgb(var(--color_54));
--wst-button-color-border-primary-disabled: rgb(var(--color_55));
--wst-button-color-text-primary-disabled: rgb(var(--color_56));
--wst-button-color-fill-secondary: rgb(var(--color_57));
--wst-button-color-border-secondary: rgb(var(--color_58));
--wst-button-color-text-secondary: rgb(var(--color_59));
--wst-button-color-fill-secondary-hover: rgb(var(--color_60));
--wst-button-color-border-secondary-hover: rgb(var(--color_61));
--wst-button-color-text-secondary-hover: rgb(var(--color_62));
--wst-button-color-fill-secondary-disabled: rgb(var(--color_63));
--wst-button-color-border-secondary-disabled: rgb(var(--color_64));
--wst-button-color-text-secondary-disabled: rgb(var(--color_65));
--wst-color-fill-base-1: rgb(var(--color_36));
--wst-color-fill-base-2: rgb(var(--color_37));
--wst-color-fill-base-shade-1: rgb(var(--color_38));
--wst-color-fill-base-shade-2: rgb(var(--color_39));
--wst-color-fill-base-shade-3: rgb(var(--color_40));
--wst-color-fill-accent-1: rgb(var(--color_41));
--wst-color-fill-accent-2: rgb(var(--color_42));
--wst-color-fill-accent-3: rgb(var(--color_43));
--wst-color-fill-accent-4: rgb(var(--color_44));
--wst-color-fill-background-primary: rgb(var(--color_11));
--wst-color-fill-background-secondary: rgb(var(--color_12));
--wst-color-text-primary: rgb(var(--color_15));
--wst-color-text-secondary: rgb(var(--color_14));
--wst-color-action: rgb(var(--color_18));
--wst-color-disabled: rgb(var(--color_39));
--wst-color-title: rgb(var(--color_45));
--wst-color-subtitle: rgb(var(--color_46));
--wst-color-line: rgb(var(--color_47));
--wst-color-custom-1: rgb(var(--color_13));
--wst-color-custom-2: rgb(var(--color_16));
--wst-color-custom-3: rgb(var(--color_17));
--wst-color-custom-4: rgb(var(--color_19));
--wst-color-custom-5: rgb(var(--color_20));
--wst-color-custom-6: rgb(var(--color_21));
--wst-color-custom-7: rgb(var(--color_22));
--wst-color-custom-8: rgb(var(--color_23));
--wst-color-custom-9: rgb(var(--color_24));
--wst-color-custom-10: rgb(var(--color_25));
--wst-color-custom-11: rgb(var(--color_26));
--wst-color-custom-12: rgb(var(--color_27));
--wst-color-custom-13: rgb(var(--color_28));
--wst-color-custom-14: rgb(var(--color_29));
--wst-color-custom-15: rgb(var(--color_30));
--wst-color-custom-16: rgb(var(--color_31));
--wst-color-custom-17: rgb(var(--color_32));
--wst-color-custom-18: rgb(var(--color_33));
--wst-color-custom-19: rgb(var(--color_34));
--wst-color-custom-20: rgb(var(--color_35));
--color_55: 150,157,165;
--color_43: 183,65,1;
--color_37: 0,0,0;
--color_12: 200,204,207;
--color_60: 4,60,83;
--color_25: 3,50,80;
--color_48: 4,60,83;
--color_21: 180,195,234;
--color_51: 255,255,255;
--color_50: 255,255,255;
--color_13: 150,157,165;
--color_10: 176,176,176;
--color_54: 150,157,165;
--color_20: 75,32,3;
--color_58: 4,60,83;
--color_65: 150,157,165;
--color_46: 0,0,0;
--color_2: 0,0,0;
--color_3: 237,28,36;
--color_41: 4,60,83;
--color_22: 9,139,225;
--color_23: 7,109,177;
--color_31: 240,245,167;
--color_30: 75,3,22;
--color_42: 5,95,132;
--color_44: 217,101,2;
--color_56: 255,255,255;
--color_9: 114,114,114;
--color_27: 235,122,152;
--color_61: 4,60,83;
--color_33: 211,225,9;
--color_0: 255,255,255;
--color_62: 255,255,255;
--color_39: 150,157,165;
--color_63: 255,255,255;
--color_4: 0,136,203;
--color_7: 176,176,176;
--color_52: 4,60,83;
--color_34: 141,150,6;
--color_47: 111,117,122;
--color_45: 0,0,0;
--color_59: 4,60,83;
--color_5: 255,203,5;
--color_1: 255,255,255;
--color_14: 111,117,122;
--color_17: 183,65,1;
--color_40: 111,117,122;
--color_16: 5,95,132;
--color_24: 5,79,129;
--color_19: 217,101,2;
--color_15: 0,0,0;
--color_26: 245,167,188;
--color_49: 4,60,83;
--color_6: 114,114,114;
--color_38: 200,204,207;
--color_57: 255,255,255;
--color_8: 255,255,255;
--color_36: 255,255,255;
--color_18: 4,60,83;
--color_64: 150,157,165;
--color_53: 4,60,83;
--color_28: 225,9,67;
--color_35: 70,75,3;
--color_32: 228,235,122;
--color_11: 255,255,255;
--color_29: 150,6,45;
```

### Spacing

```css
--maxViewportSize: 1920;
--minViewportSize: 320;
```

### Typography

```css
--wst-font-style-h2: var(--font_2);
--wst-font-style-h3: var(--font_3);
--wst-font-style-h4: var(--font_4);
--wst-font-style-h5: var(--font_5);
--wst-font-style-h6: var(--font_6);
--wst-font-style-body-large: var(--font_7);
--wst-font-style-body-medium: var(--font_8);
--wst-font-style-body-small: var(--font_9);
--wst-font-style-body-x-small: var(--font_10);
--font_9: normal normal normal 14px/1.4em wfont_ced490_9eb54a17069041c7b3a2095964951377,wf_9eb54a17069041c7b3a209596,orig_sarabun_light;
--font_7: normal normal normal 24px/1.4em wfont_ced490_9eb54a17069041c7b3a2095964951377,wf_9eb54a17069041c7b3a209596,orig_sarabun_light;
--font_6: normal normal normal 14px/1.4em wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4,wf_7b8b892c305e412dbd37a4fcb,orig_utendo_bold;
--font_4: normal normal bold 20px/1.4em wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4,wf_7b8b892c305e412dbd37a4fcb,orig_utendo_bold;
--font_3: normal normal normal 24px/1.4em wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4,wf_7b8b892c305e412dbd37a4fcb,orig_utendo_bold;
--font_5: normal normal normal 18px/1.4em wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4,wf_7b8b892c305e412dbd37a4fcb,orig_utendo_bold;
--font_8: normal normal normal 16px/1.4em wfont_ced490_9eb54a17069041c7b3a2095964951377,wf_9eb54a17069041c7b3a209596,orig_sarabun_light;
--font_2: normal normal normal 40px/1.4em wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4,wf_7b8b892c305e412dbd37a4fcb,orig_utendo_bold;
--font_0: normal normal normal 64px/1.4em wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4,wf_7b8b892c305e412dbd37a4fcb,orig_utendo_bold;
--font_10: normal normal normal 12px/1.4em din-next-w01-light,sans-serif;
--font_1: normal normal normal 16px/1.4em din-next-w01-light,sans-serif;
```

### Other

```css
--one-unit: 1vw;
--section-max-width: 9999px;
--spx-stopper-max: 9999px;
--spx-stopper-min: 0px;
--browser-zoom: 1;
--wix-opt-in-direction: ltr;
--wix-ads-height: 0px;
--scaling-factor: clamp(0px, 100 * 1cqw * 1, min(9999px, 9999px));
--theme-spx-ratio: 1px;
--customScaleViewportLimit: clamp(320 * 1px, 100 * 1cqw * 1, min(9999px, 1920 * 1px));
--portals-z-index: 100001;
--full-viewport: 100 * 1cqw * 1;
--site-width: 980px;
--wix-ads-top-height: 0px;
--sticky-offset: 0px;
--wix-opt-in-direction-multiplier: 1;
--above-all-z-index: 100000;
```

### Dependencies

```css
0: --color_48;
0: --color_49;
0: --color_50;
0: --color_51;
0: --color_52;
0: --color_53;
0: --color_54;
0: --color_55;
0: --color_56;
0: --color_57;
0: --color_58;
0: --color_59;
0: --color_60;
0: --color_61;
0: --color_62;
0: --color_63;
0: --color_64;
0: --color_65;
0: --color_36;
0: --color_37;
0: --color_38;
0: --color_39;
0: --color_40;
0: --color_41;
0: --color_42;
0: --color_43;
0: --color_44;
0: --color_11;
0: --color_12;
0: --color_15;
0: --color_14;
0: --color_18;
0: --color_39;
0: --color_45;
0: --color_46;
0: --color_47;
0: --font_2;
0: --font_3;
0: --font_4;
0: --font_5;
0: --font_6;
0: --font_7;
0: --font_8;
0: --font_9;
0: --font_10;
0: --color_13;
0: --color_16;
0: --color_17;
0: --color_19;
0: --color_20;
0: --color_21;
0: --color_22;
0: --color_23;
0: --color_24;
0: --color_25;
0: --color_26;
0: --color_27;
0: --color_28;
0: --color_29;
0: --color_30;
0: --color_31;
0: --color_32;
0: --color_33;
0: --color_34;
0: --color_35;
```

## Transitions & Animations

**Easing functions:** `cubic-bezier(0, 0, 1, 1)`

**Durations:** `0.3s`, `0.08s`, `0.4s`

### Common Transitions

```css
transition: all;
transition: 0.3s;
transition: 0.08s cubic-bezier(0, 0, 1, 1);
transition: transform;
transition: border-color 0.4s, background-color 0.4s;
transition: color 0.4s;
```

### Keyframe Animations

**slide-horizontal-new**
```css
@keyframes slide-horizontal-new {
  0% { transform: translate(100%); }
}
```

**slide-horizontal-old**
```css
@keyframes slide-horizontal-old {
  80% { opacity: 1; }
  100% { opacity: 0; transform: translate(-100%); }
}
```

**slide-vertical-new**
```css
@keyframes slide-vertical-new {
  0% { transform: translateY(-100%); }
}
```

**slide-vertical-old**
```css
@keyframes slide-vertical-old {
  80% { opacity: 1; }
  100% { opacity: 0; transform: translateY(100%); }
}
```

**out-in-new**
```css
@keyframes out-in-new {
  0% { opacity: 0; }
}
```

**out-in-old**
```css
@keyframes out-in-old {
  100% { opacity: 0; }
}
```

**itemDepth02233374943__fadeIn**
```css
@keyframes itemDepth02233374943__fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

**itemDepth12472627565__fadeIn**
```css
@keyframes itemDepth12472627565__fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

**irnogM**
```css
@keyframes irnogM {
  0% { animation-timing-function: ease-out; transform: rotate(180deg); }
  45% { transform: rotate(198deg); }
  55% { transform: rotate(234deg); }
  100% { transform: rotate(540deg); }
}
```

**x9GeVl**
```css
@keyframes x9GeVl {
  100% { opacity: 1; transform: rotate(115deg); }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (6 instances)

```css
.buttons {
  background-color: rgb(20, 20, 20);
  color: rgb(255, 255, 255);
  font-size: 14.994px;
  font-weight: 600;
  padding-top: 0px;
  padding-right: 16px;
  border-radius: 4px;
}
```

### Cards (6 instances)

```css
.cards {
  background-color: rgb(255, 255, 255);
  border-radius: 16px;
  box-shadow: rgba(0, 0, 0, 0.25) -1.36px 2.67px 21px 1px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Inputs (1 instances)

```css
.inputs {
  background-color: rgba(255, 255, 255, 0);
  color: rgb(0, 0, 0);
  border-color: rgb(0, 0, 0);
  border-radius: 8px;
  font-size: 16px;
  padding-top: 3px;
  padding-right: 3px;
}
```

### Links (15 instances)

```css
.links {
  color: rgb(0, 0, 238);
  font-size: 10px;
  font-weight: 400;
}
```

### Navigation (3 instances)

```css
.navigation {
  background-color: rgba(200, 204, 207, 0);
  color: rgb(0, 0, 0);
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  position: static;
}
```

### Footer (1 instances)

```css
.footer {
  color: rgb(0, 0, 0);
  padding-top: 0px;
  padding-bottom: 0px;
  font-size: 10px;
}
```

### Modals (1 instances)

```css
.modals {
  background-color: rgb(255, 255, 255);
  border-radius: 8px;
  box-shadow: rgba(0, 0, 0, 0.3) 0px 32px 68px 0px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Dropdowns (17 instances)

```css
.dropdowns {
  background-color: rgba(200, 204, 207, 0);
  border-radius: 0px;
  border-color: rgb(0, 0, 0);
  padding-top: 0px;
}
```

### Badges (6 instances)

```css
.badges {
  color: rgb(5, 95, 132);
  font-size: 14px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 0px;
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Input — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(255, 255, 255, 0);
  color: rgb(0, 0, 0);
  padding: 3px 3px 3px 16px;
  border-radius: 8px;
  border: 1px solid rgb(0, 0, 0);
  font-size: 16px;
  font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgb(0, 0, 0);
  color: rgb(0, 0, 0);
  padding: 0px 0px 0px 0px;
  border-radius: 8px;
  border: 1px solid rgb(0, 0, 0);
  font-size: 13.3333px;
  font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 16px;
  font-weight: 400;
```

## Layout System

**31 grid containers** and **39 flex containers** detected.

### The System

- **Gap scale** — 8px · 16px · 20px
- **Fluid layout** — 3 clamp/viewport declarations

```css
[data-prehydration] .NxO5nt:hover .rpHatU[data-anchor="screen"] { width: calc(100vw - 2*var(--computed-horizontal-margin)); }
.HamburgerOverlay547129737__root { width: 100vw; }
.xdu0As { width: 100vw; }
```

### Container Widths

| Max Width | Padding |
|-----------|---------|
| 100% | 0px |

### Grid Column Patterns

| Columns | Usage Count |
|---------|-------------|
| 1-column | 31x |

### Grid Templates

```css
grid-template-columns: 1280px;
grid-template-columns: 1280px;
grid-template-columns: 1280px;
grid-template-columns: 1280px;
grid-template-columns: 1280px;
```

### Flex Patterns

| Direction/Wrap | Count |
|----------------|-------|
| row/nowrap | 35x |
| row/wrap | 1x |
| column/nowrap | 3x |

**Gap values:** `normal 0px`, `normal 8px`, `16px`, `20px`

## Accessibility (WCAG 2.1)

**Overall Score: 100%** — 4 passing, 0 failing color pairs

### Passing Color Pairs

| Foreground | Background | Ratio | Level |
|------------|------------|-------|-------|
| `#ffffff` | `#141414` | 18.42:1 | AAA |
| `#116dff` | `#ffffff` | 4.51:1 | AA |

## Dark Mode

The site has a distinct dark mode color scheme:

- **Primary:** `#d96502`
- **Secondary:** `#116dff`
- **Backgrounds:** `#ffffff`, `#b74101`, `#043c53`, `#000000`
- **Text:** `#000000`, `#116dff`, `#0000ee`, `#d96502`, `#055f84`

### Dark Mode CSS Variables

```css
--wst-button-color-fill-primary: rgb(var(--color_48));
--wst-button-color-border-primary: rgb(var(--color_49));
--wst-button-color-text-primary: rgb(var(--color_50));
--wst-button-color-fill-primary-hover: rgb(var(--color_51));
--wst-button-color-border-primary-hover: rgb(var(--color_52));
--wst-button-color-text-primary-hover: rgb(var(--color_53));
--wst-button-color-fill-primary-disabled: rgb(var(--color_54));
--wst-button-color-border-primary-disabled: rgb(var(--color_55));
--wst-button-color-text-primary-disabled: rgb(var(--color_56));
--wst-button-color-fill-secondary: rgb(var(--color_57));
--wst-button-color-border-secondary: rgb(var(--color_58));
--wst-button-color-text-secondary: rgb(var(--color_59));
--wst-button-color-fill-secondary-hover: rgb(var(--color_60));
--wst-button-color-border-secondary-hover: rgb(var(--color_61));
--wst-button-color-text-secondary-hover: rgb(var(--color_62));
--wst-button-color-fill-secondary-disabled: rgb(var(--color_63));
--wst-button-color-border-secondary-disabled: rgb(var(--color_64));
--wst-button-color-text-secondary-disabled: rgb(var(--color_65));
--wst-color-fill-base-1: rgb(var(--color_36));
--wst-color-fill-base-2: rgb(var(--color_37));
--wst-color-fill-base-shade-1: rgb(var(--color_38));
--wst-color-fill-base-shade-2: rgb(var(--color_39));
--wst-color-fill-base-shade-3: rgb(var(--color_40));
--wst-color-fill-accent-1: rgb(var(--color_41));
--wst-color-fill-accent-2: rgb(var(--color_42));
--wst-color-fill-accent-3: rgb(var(--color_43));
--wst-color-fill-accent-4: rgb(var(--color_44));
--wst-color-fill-background-primary: rgb(var(--color_11));
--wst-color-fill-background-secondary: rgb(var(--color_12));
--wst-color-text-primary: rgb(var(--color_15));
--wst-color-text-secondary: rgb(var(--color_14));
--wst-color-action: rgb(var(--color_18));
--wst-color-disabled: rgb(var(--color_39));
--wst-color-title: rgb(var(--color_45));
--wst-color-subtitle: rgb(var(--color_46));
--wst-color-line: rgb(var(--color_47));
--wst-color-custom-1: rgb(var(--color_13));
--wst-color-custom-2: rgb(var(--color_16));
--wst-color-custom-3: rgb(var(--color_17));
--wst-color-custom-4: rgb(var(--color_19));
--wst-color-custom-5: rgb(var(--color_20));
--wst-color-custom-6: rgb(var(--color_21));
--wst-color-custom-7: rgb(var(--color_22));
--wst-color-custom-8: rgb(var(--color_23));
--wst-color-custom-9: rgb(var(--color_24));
--wst-color-custom-10: rgb(var(--color_25));
--wst-color-custom-11: rgb(var(--color_26));
--wst-color-custom-12: rgb(var(--color_27));
--wst-color-custom-13: rgb(var(--color_28));
--wst-color-custom-14: rgb(var(--color_29));
--wst-color-custom-15: rgb(var(--color_30));
--wst-color-custom-16: rgb(var(--color_31));
--wst-color-custom-17: rgb(var(--color_32));
--wst-color-custom-18: rgb(var(--color_33));
--wst-color-custom-19: rgb(var(--color_34));
--wst-color-custom-20: rgb(var(--color_35));
--color_55: 150,157,165;
--color_43: 183,65,1;
--color_37: 0,0,0;
--color_12: 200,204,207;
--color_60: 4,60,83;
--color_25: 3,50,80;
--color_48: 4,60,83;
--color_21: 180,195,234;
--color_51: 255,255,255;
--color_50: 255,255,255;
--color_13: 150,157,165;
--color_10: 176,176,176;
--color_54: 150,157,165;
--color_20: 75,32,3;
--color_58: 4,60,83;
--color_65: 150,157,165;
--color_46: 0,0,0;
--color_2: 0,0,0;
--color_3: 237,28,36;
--color_41: 4,60,83;
--color_22: 9,139,225;
--color_30: 75,3,22;
--color_23: 7,109,177;
--color_31: 240,245,167;
--color_42: 5,95,132;
--color_44: 217,101,2;
--color_56: 255,255,255;
--color_9: 114,114,114;
--color_27: 235,122,152;
--color_62: 255,255,255;
--color_61: 4,60,83;
--color_0: 255,255,255;
--color_33: 211,225,9;
--color_39: 150,157,165;
--color_63: 255,255,255;
--color_4: 0,136,203;
--color_7: 176,176,176;
--color_52: 4,60,83;
--color_34: 141,150,6;
--color_47: 111,117,122;
--color_45: 0,0,0;
--color_59: 4,60,83;
--color_5: 255,203,5;
--color_1: 255,255,255;
--color_14: 111,117,122;
--color_17: 183,65,1;
--color_40: 111,117,122;
--color_16: 5,95,132;
--color_19: 217,101,2;
--color_24: 5,79,129;
--color_15: 0,0,0;
--color_26: 245,167,188;
--color_6: 114,114,114;
--color_49: 4,60,83;
--color_38: 200,204,207;
--color_57: 255,255,255;
--color_8: 255,255,255;
--color_36: 255,255,255;
--color_18: 4,60,83;
--color_64: 150,157,165;
--color_53: 4,60,83;
--color_28: 225,9,67;
--color_35: 70,75,3;
--color_32: 228,235,122;
--color_11: 255,255,255;
--color_29: 150,6,45;
--maxViewportSize: 1920;
--minViewportSize: 320;
--wst-font-style-h2: var(--font_2);
--wst-font-style-h3: var(--font_3);
--wst-font-style-h4: var(--font_4);
--wst-font-style-h5: var(--font_5);
--wst-font-style-h6: var(--font_6);
--wst-font-style-body-large: var(--font_7);
--wst-font-style-body-medium: var(--font_8);
--wst-font-style-body-small: var(--font_9);
--wst-font-style-body-x-small: var(--font_10);
--font_9: normal normal normal 14px/1.4em wfont_ced490_9eb54a17069041c7b3a2095964951377,wf_9eb54a17069041c7b3a209596,orig_sarabun_light;
--font_7: normal normal normal 24px/1.4em wfont_ced490_9eb54a17069041c7b3a2095964951377,wf_9eb54a17069041c7b3a209596,orig_sarabun_light;
--font_6: normal normal normal 14px/1.4em wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4,wf_7b8b892c305e412dbd37a4fcb,orig_utendo_bold;
--font_3: normal normal normal 24px/1.4em wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4,wf_7b8b892c305e412dbd37a4fcb,orig_utendo_bold;
--font_4: normal normal bold 20px/1.4em wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4,wf_7b8b892c305e412dbd37a4fcb,orig_utendo_bold;
--font_5: normal normal normal 18px/1.4em wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4,wf_7b8b892c305e412dbd37a4fcb,orig_utendo_bold;
--font_8: normal normal normal 16px/1.4em wfont_ced490_9eb54a17069041c7b3a2095964951377,wf_9eb54a17069041c7b3a209596,orig_sarabun_light;
--font_2: normal normal normal 40px/1.4em wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4,wf_7b8b892c305e412dbd37a4fcb,orig_utendo_bold;
--font_0: normal normal normal 64px/1.4em wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4,wf_7b8b892c305e412dbd37a4fcb,orig_utendo_bold;
--font_10: normal normal normal 12px/1.4em din-next-w01-light,sans-serif;
--font_1: normal normal normal 16px/1.4em din-next-w01-light,sans-serif;
--one-unit: 1vw;
--section-max-width: 9999px;
--spx-stopper-max: 9999px;
--spx-stopper-min: 0px;
--browser-zoom: 1;
--wix-opt-in-direction: ltr;
--wix-ads-height: 0px;
--scaling-factor: clamp(0px, 100 * 1cqw * 1, min(9999px, 9999px));
--theme-spx-ratio: 1px;
--customScaleViewportLimit: clamp(320 * 1px, 100 * 1cqw * 1, min(9999px, 1920 * 1px));
--portals-z-index: 100001;
--full-viewport: 100 * 1cqw * 1;
--site-width: 980px;
--wix-ads-top-height: 0px;
--sticky-offset: 0px;
--wix-opt-in-direction-multiplier: 1;
--above-all-z-index: 100000;
--wst-button-color-fill-primary: --color_48;
--wst-button-color-border-primary: --color_49;
--wst-button-color-text-primary: --color_50;
--wst-button-color-fill-primary-hover: --color_51;
--wst-button-color-border-primary-hover: --color_52;
--wst-button-color-text-primary-hover: --color_53;
--wst-button-color-fill-primary-disabled: --color_54;
--wst-button-color-border-primary-disabled: --color_55;
--wst-button-color-text-primary-disabled: --color_56;
--wst-button-color-fill-secondary: --color_57;
--wst-button-color-border-secondary: --color_58;
--wst-button-color-text-secondary: --color_59;
--wst-button-color-fill-secondary-hover: --color_60;
--wst-button-color-border-secondary-hover: --color_61;
--wst-button-color-text-secondary-hover: --color_62;
--wst-button-color-fill-secondary-disabled: --color_63;
--wst-button-color-border-secondary-disabled: --color_64;
--wst-button-color-text-secondary-disabled: --color_65;
--wst-color-fill-base-1: --color_36;
--wst-color-fill-base-2: --color_37;
--wst-color-fill-base-shade-1: --color_38;
--wst-color-fill-base-shade-2: --color_39;
--wst-color-fill-base-shade-3: --color_40;
--wst-color-fill-accent-1: --color_41;
--wst-color-fill-accent-2: --color_42;
--wst-color-fill-accent-3: --color_43;
--wst-color-fill-accent-4: --color_44;
--wst-color-fill-background-primary: --color_11;
--wst-color-fill-background-secondary: --color_12;
--wst-color-text-primary: --color_15;
--wst-color-text-secondary: --color_14;
--wst-color-action: --color_18;
--wst-color-disabled: --color_39;
--wst-color-title: --color_45;
--wst-color-subtitle: --color_46;
--wst-color-line: --color_47;
--wst-font-style-h2: --font_2;
--wst-font-style-h3: --font_3;
--wst-font-style-h4: --font_4;
--wst-font-style-h5: --font_5;
--wst-font-style-h6: --font_6;
--wst-font-style-body-large: --font_7;
--wst-font-style-body-medium: --font_8;
--wst-font-style-body-small: --font_9;
--wst-font-style-body-x-small: --font_10;
--wst-color-custom-1: --color_13;
--wst-color-custom-2: --color_16;
--wst-color-custom-3: --color_17;
--wst-color-custom-4: --color_19;
--wst-color-custom-5: --color_20;
--wst-color-custom-6: --color_21;
--wst-color-custom-7: --color_22;
--wst-color-custom-8: --color_23;
--wst-color-custom-9: --color_24;
--wst-color-custom-10: --color_25;
--wst-color-custom-11: --color_26;
--wst-color-custom-12: --color_27;
--wst-color-custom-13: --color_28;
--wst-color-custom-14: --color_29;
--wst-color-custom-15: --color_30;
--wst-color-custom-16: --color_31;
--wst-color-custom-17: --color_32;
--wst-color-custom-18: --color_33;
--wst-color-custom-19: --color_34;
--wst-color-custom-20: --color_35;
success: [object Object];
warning: [object Object];
error: [object Object];
info: [object Object];
```

## Design System Score

**Overall: 81/100 (Grade: B)**

| Category | Score |
|----------|-------|
| Color Discipline | 100/100 |
| Typography Consistency | 50/100 |
| Spacing System | 70/100 |
| Shadow Consistency | 100/100 |
| Border Radius Consistency | 100/100 |
| Accessibility | 100/100 |
| CSS Tokenization | 100/100 |

**Strengths:** Tight, disciplined color palette, Clean elevation system, Consistent border radii, Strong accessibility compliance, Good CSS variable tokenization

**Issues:**
- 5 font families — consider limiting to 2 (heading + body)
- 174 !important rules — prefer specificity over overrides
- 62% of CSS is unused — consider purging
- 3066 duplicate CSS declarations

## Z-Index Map

**3 unique z-index values** across 2 layers.

| Layer | Range | Elements |
|-------|-------|----------|
| modal | 9999,2147483646 | button.S.K.I.P._.T.O._.C.O.N.T.E.N.T._.B.T.N. .B.q.Y.k.v.S. .h.a.s.-.c.u.s.t.o.m.-.f.o.c.u.s, div.c.m.p.-.w.r.a.p.p.e.r. .c.m.p. .f.i.r.s.t. .w.i.x. .b.o.t.t.o.m. .d.e.s.k.t.o.p. .z.o.o.m.-.n.o.r.m.a.l. .f.l.a.t |
| sticky | 52,52 | header.t.3.5.n.U.u. .S.I.T.E._.H.E.A.D.E.R. .w.i.x.u.i.-.h.e.a.d.e.r |

**Issues:**
- Very high z-index values: 2147483646

## SVG Icons

**2 unique SVG icons** detected. Dominant style: **filled**.

| Size Class | Count |
|------------|-------|
| xl | 2 |

**Icon colors:** `#191919`, `rgb(0, 0, 0)`, `#3467FE`

## Font Files

| Family | Source | Weights | Styles |
|--------|--------|---------|--------|
| wf_7b8b892c305e412dbd37a4fcb | self-hosted | 400, normal | normal |
| wf_9eb54a17069041c7b3a209596 | self-hosted | 400, normal | normal |
| din-next-w01-light | self-hosted | 400 | normal |
| futura-lt-w01-book | self-hosted | 400 | normal |
| futura-lt-w01-light | self-hosted | 400 | normal |
| helvetica-w01-roman | self-hosted | 400 | normal |
| wf_b524e145baef478c9a1712a04 | self-hosted | 400, normal | normal |

## Image Style Patterns

| Pattern | Count | Key Styles |
|---------|-------|------------|
| thumbnail | 9 | objectFit: cover, borderRadius: 0px, shape: square |
| hero | 5 | objectFit: cover, borderRadius: 0px, shape: square |
| general | 2 | objectFit: cover, borderRadius: 0px, shape: square |

**Aspect ratios:** 1:1 (5x), 16:9 (3x), 3:2 (2x), 4:3 (1x), 3:4 (1x), 2.76:1 (1x), 3.51:1 (1x), 21:9 (1x)

## Motion Language

**Feel:** smooth · **Scroll-linked:** yes

### Duration Tokens

| name | value | ms |
|---|---|---|
| `instant` | `80ms` | 80 |
| `md` | `300ms` | 300 |

### Easing Families

- **ease-in-out** (2 uses) — `cubic-bezier(0, 0, 1, 1)`

### Keyframes In Use

| name | kind | properties | uses |
|---|---|---|---|
| `motion-floatIn` | slide | opacity, animation-timing-function, transform | 5 |
| `motion-glideIn` | slide | opacity, animation-timing-function, transform | 8 |
| `motion-growIn` | slide | transform | 5 |

## Component Anatomy

### button — 2 instances

**Slots:** label

## Brand Voice

**Tone:** friendly · **Pronoun:** third-person · **Headings:** Title Case (tight)

### Top CTA Verbs

- **subscribe** (2)

### Button Copy Patterns

- "subscribe" (2×)

### Sample Headings

> THE VISION
> Materials Beyond Gravity
> THE MISSION
> Why Crystals Matter
> THE PROBLEM
> THE VISION
> Materials Beyond Gravity
> THE VISION
> Materials Beyond Gravity
> THE MISSION

## Page Intent

**Type:** `landing` (confidence 0.29)

Alternates: legal (0.4)

## Section Roles

Reading order (top→bottom): nav → content → nav → testimonial → content → content → testimonial → testimonial → feature-grid → content → content → testimonial → testimonial → content → content → testimonial → content → testimonial → content → content → footer → hero → sidebar

| # | Role | Heading | Confidence |
|---|------|---------|------------|
| 0 | nav | — | 0.4 |
| 1 | content | — | 0.3 |
| 2 | nav | — | 0.9 |
| 3 | testimonial | THE VISION | 0.8 |
| 4 | content | — | 0.3 |
| 5 | content | — | 0.3 |
| 6 | testimonial | THE VISION | 0.8 |
| 7 | testimonial | THE VISION | 0.8 |
| 8 | feature-grid | THE MISSION | 0.8 |
| 9 | content | THE MISSION | 0.3 |
| 10 | content | THE PROBLEM | 0.3 |
| 11 | testimonial | THE SOLUTION | 0.8 |
| 12 | testimonial | THE SOLUTION | 0.8 |
| 13 | content | TRACTION | 0.3 |
| 14 | content | TRACTION | 0.3 |
| 15 | testimonial | TRUE MICROGRAVITY ONLY EXISTS IN SPACE | 0.8 |
| 16 | content | — | 0.3 |
| 17 | testimonial | TRUE MICROGRAVITY ONLY EXISTS IN SPACE | 0.8 |
| 18 | content | THANKS TO OUR | 0.3 |
| 19 | content | THANKS TO OUR | 0.3 |

## Material Language

**Label:** `flat` (confidence 0)

| Metric | Value |
|--------|-------|
| Avg saturation | 0.538 |
| Shadow profile | soft |
| Avg shadow blur | 0px |
| Max radius | 24px |
| backdrop-filter in use | no |
| Gradients | 0 |

## Imagery Style

**Label:** `photography` (confidence 0.156)
**Counts:** total 16, svg 0, icon 0, screenshot-like 0, photo-like 2
**Dominant aspect:** square-ish
**Radius profile on images:** square

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `wfont_ced490_9eb54a17069041c7b3a2095964951377` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
