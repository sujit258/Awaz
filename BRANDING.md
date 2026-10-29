# Awaz Brand Identity & Design System Guide

> **Brand Promise:** *One issue. Many voices. Visible evidence.*

Awaz is an independent public consumer issue and evidence platform. It empowers citizens to document delivery failures, dispute resolutions, and transaction issues with factual evidence, aggregating individual complaints into collective accountability.

---

## 1. Brand Values & Core Positioning

| Principle | Meaning & Application |
|---|---|
| **Trust & Transparency** | Clear methodology, open counting rules, no fabricated complaints or inflated metrics. |
| **Voice & Empowerment** | "Awaz" (आवाज़ / Voice) signifies giving consumers a credible platform to be heard. |
| **Evidence & Rigor** | Reports are grounded in verified documentation (order receipts, tracking logs, chat records), not angry hearsay. |
| **Independence & Neutrality** | Awaz is strictly non-partisan and independent. It is neither a corporate representative nor a government grievance portal. |
| **Professionalism** | Measured, calm, legal-grade aesthetics rather than activist outrage or protest imagery. |

---

## 2. Logo Symbolism & Architecture

The Awaz identity combines a **squircle badge**, **resonant voice soundwave**, and **evidence beacon**:

1. **Squircle Badge:** A modern, stable geometric container representing institutional trust and digital security.
2. **First Bar (Soft Blue `#93C5FD`):** The isolated consumer voice reporting a delivery or service failure.
3. **Middle Bars (Crisp White `#FFFFFF`):** Aggregation and community echo—shared patterns across multiple consumers.
4. **Outcome Bar & Beacon (Teal Gradient `#2DD4BF` to `#087E8B`):** Verified resolution, transparency, and consumer accountability.

### Logo Variants

| Asset | Format | Purpose / Dimensions |
|---|---|---|
| `public/brand/logo.svg` | SVG (240×48) | Primary horizontal logo for light backgrounds (Navbar desktop, Footer, Reports) |
| `public/brand/logo-dark.svg` | SVG (240×48) | Horizontal logo for dark mode or contrast containers |
| `public/brand/icon.svg` | SVG (64×64) | Standalone icon mark for light backgrounds & mobile headers |
| `public/brand/icon-dark.svg` | SVG (64×64) | Standalone icon mark for dark mode |
| `public/favicon.svg` | SVG (32×32) | Modern browser vector favicon |
| `public/favicon-32x32.png` | PNG (32×32) | High-DPI browser favicon fallback |
| `public/favicon-16x16.png` | PNG (16×16) | Standard legacy browser favicon fallback |
| `public/favicon.ico` | ICO / PNG (32×32) | Root fallback for legacy crawlers and browser address bars |
| `public/apple-touch-icon.png` | PNG (180×180) | iOS Home Screen bookmark & Touch Icon (`src/app/apple-icon.png`) |
| `public/og-image.png` | PNG (1200×630) | Open Graph & Twitter Summary card (`src/app/opengraph-image.png`) |

---

## 3. Brand Color System

### Primary & Accent Palette

| Swatch | Color Name | Hex Code | Purpose & Semantic Role |
|---|---|---|---|
| ![#17212F](https://via.placeholder.com/15/17212F/000000?text=+) | **Awaz Deep Slate** | `#17212F` | Primary text, high-contrast headings, dark backgrounds |
| ![#2457D6](https://via.placeholder.com/15/2457D6/000000?text=+) | **Awaz Primary Blue** | `#2457D6` | Core brand color, primary CTAs, links, active tab highlights |
| ![#1B44AA](https://via.placeholder.com/15/1B44AA/000000?text=+) | **Awaz Deep Blue** | `#1B44AA` | Interactive hover states, pressed buttons, gradient stops |
| ![#087E8B](https://via.placeholder.com/15/087E8B/000000?text=+) | **Awaz Teal Accent** | `#087E8B` | Evidence badges, verified status indicator, moderator actions |
| ![#2DD4BF](https://via.placeholder.com/15/2DD4BF/000000?text=+) | **Awaz Bright Teal** | `#2DD4BF` | Beacon dot, accent glow, Open Graph typography accent |

### Neutrals & Backgrounds

| Swatch | Color Name | Hex Code | Usage |
|---|---|---|---|
| ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) | **Pure White** | `#FFFFFF` | Card backgrounds, elevated surfaces |
| ![#F7F8FA](https://via.placeholder.com/15/F7F8FA/000000?text=+) | **Canvas Neutral** | `#F7F8FA` | Page background, subtle neutral wells |
| ![#E1E5EB](https://via.placeholder.com/15/E1E5EB/000000?text=+) | **Border Subtle** | `#E1E5EB` | Dividers, card borders, tab boundaries |
| ![#5B6573](https://via.placeholder.com/15/5B6573/000000?text=+) | **Secondary Slate** | `#5B6573` | Subtitles, supporting copy, captions, meta timestamps |

---

## 4. Typography

- **Primary Font Family:** `Inter` (sans-serif, Google Font loaded via `next/font/google`).
- **Wordmark Weight:** `800` (Extra Bold) with `-0.5px` letter spacing.
- **Tagline / Descriptor:** `PUBLIC CONSUMER EVIDENCE` — uppercase, `700` weight, `1.2px` letter spacing.

---

## 5. UI Component Usage

The brand is encapsulated in the reusable React component `src/components/brand/AwazLogo.tsx`:

```tsx
import AwazLogo from "@/components/brand/AwazLogo";

// Desktop Navbar / Header
<AwazLogo variant="full" size={38} />

// Mobile Navigation / Compact Icon
<AwazLogo variant="icon" size={32} />

// Dark Backgrounds / Footers
<AwazLogo variant="full" theme="dark" size={34} />
```

---

## 6. Sizing & Clear Space Rules

1. **Clear Space:** Maintain clear space around the logo equal to at least half the icon's height (0.5× $H$).
2. **Minimum Heights:**
   - Full horizontal logo: Minimum height **28px** (desktop), **36–40px** recommended.
   - Standalone icon: Minimum size **24×24px** (web), **16×16px** (favicon).
3. **Integrity Rules:**
   - Do not alter the proportions or stretch the SVG vectors.
   - Do not change the wordmark font or letter spacing.
   - Do not add Drop Shadows or generic shield clips to the logo.
   - Do not use red/hostile activist color schemes.
