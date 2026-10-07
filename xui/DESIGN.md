---
name: Financial Editorial Modernism
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#424751'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#737782'
  outline-variant: '#c2c6d3'
  surface-tint: '#255dac'
  primary: '#003f82'
  on-primary: '#ffffff'
  primary-container: '#1a56a4'
  on-primary-container: '#b6ceff'
  inverse-primary: '#aac7ff'
  secondary: '#455f87'
  on-secondary: '#ffffff'
  secondary-container: '#b5d0fd'
  on-secondary-container: '#3e5980'
  tertiary: '#004464'
  on-tertiary: '#ffffff'
  tertiary-container: '#005d86'
  on-tertiary-container: '#9ad4ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e3ff'
  primary-fixed-dim: '#aac7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#00458e'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#adc8f5'
  on-secondary-fixed: '#001c3b'
  on-secondary-fixed-variant: '#2d486d'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  headline-xl:
    fontFamily: Source Serif 4
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Public Sans
    fontSize: 1.125rem
    fontWeight: '700'
    lineHeight: 1.625rem
    letterSpacing: -0.01em
  title-md:
    fontFamily: Public Sans
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Public Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
    letterSpacing: 0em
  body-md:
    fontFamily: Public Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Public Sans
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
    letterSpacing: 0.01em
  data-metric-lg:
    fontFamily: Public Sans
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 1.75rem
    letterSpacing: -0.02em
  data-metric-md:
    fontFamily: Public Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.375rem
    letterSpacing: -0.01em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Public Sans
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system synthesizes traditional financial broadsheet authority with contemporary fintech precision. Designed specifically for an intelligence-driven weekly financial dashboard, it balances high information density with exceptional scannability. 

The emotional tone balances analytical rigor with executive calm: authoritative, objective, fastidious, and restrained. It eschews generic consumer-tech gloss, aggressive gradients, and decorative micro-interactions in favor of a crisp editorial architecture, disciplined tabular grids, and deliberate typographic rhythm.

Visual style attributes:
- **Broadsheet Editorial Rigor**: Crisp dividing rules (`1px`), structured content groupings, explicit column hierarchies, and warm paper-like tints evoke the physical presence of classic financial periodicals.
- **Fintech Operational Clarity**: High-speed utility, clear delta badges, monospaced numerical alignments (`tabular-nums`), and unambiguous status indicators eliminate visual ambiguity.
- **Data-Dense Elegance**: Compact, scannable cards and horizontal tickers organize macroeconomic indicators without visual clutter or unnecessary decorative padding.

## Colors

The palette establishes an authoritative hierarchy rooted in institution-grade deep blues, balanced against an editorial warm canvas rather than sterile, stark white. 

### Core Palette
- **Primary Navy (`#1E3A5F`)**: Applied to foundational structural anchors, headers, active navigation chrome, and prominent editorial cards.
- **Primary Financial Blue (`#1A56A4`)**: The functional brand color for primary interactions, selected states, and standard down-market movements in East Asian equity conventions.
- **Sky Accent (`#0EA5E9`)**: High-precision accent for active tabs, AI summary highlights, trend sparkline peaks, and live indicator dots.
- **Neutral Dark (`#0F172A`, `#1E293B`)**: High-contrast, fatigue-reducing ink tones for primary analytical text and numbers.
- **Editorial Canvas (`#FAF7F2`)**: Warm, low-strain ground layer evoking premium financial press print.
- **Card Surface (`#FFFFFF`)**: Pure white containers elevated subtly against the warm ground for optical clarity.
- **Subtle Surface Tint (`#F8F9FA`)**: Cool secondary neutral for table headers, inactive card footers, and code-like data containers.

### Market Movement & Analytical Tokens
Financial indicators conform strictly to Korean equity market conventions:
- **Market Up / Bullish (`#D92D20`)**: Deep crimson red for positive price deltas and upward momentum indicators.
- **Market Down / Bearish (`#1A56A4`)**: Structured institutional blue for negative deltas, maintaining brand cohesion.
- **Volume Spike / Alert (`#F59E0B` / `#D97706`)**: Amber/orange reserved exclusively for volume anomalies, critical macro alerts, and special disclosure flags.
- **Editorial Muted Ink (`#64748B`)**: Secondary caption, label, and timestamp tone.
- **Hairline Border (`#E2E8F0` / `#E8E5DF`)**: Sharp, low-contrast structural dividers between data columns and rows.

## Typography

The typography architecture uses a deliberate dual-pairing model:
1. **Editorial Headers (`Source Serif 4`)**: Applied selectively to top-level section headers, weekly macro briefings, and article leads to invoke classical broadsheet journalism.
2. **Operational Body & Metrics (`Public Sans`)**: A rigorous, highly legible sans-serif for content and financial figures. Pretendard can be seamlessly swapped in Korean-native production environments without altering line metrics.
3. **Data Identifiers & Numerical Codes (`JetBrains Mono`)**: Ticker symbols (e.g., `005930`), ISINs, trade timestamps, and technical indicators use monospaced formatting.

### Numerical Execution & Rules
- All prices, percentage changes, ratios, volume metrics, and index values must enforce `font-feature-settings: "tnum" 1, "zero" 1` (tabular figures and slashed zero) to ensure column alignment in tables.
- Market change symbols must be followed by a fixed half-space before digits (e.g., `▲ 1.45%`, `▼ 0.82%`).
- Headline serifs must never be used on compact badges, table rows, or metric values.

## Layout & Spacing

This design system employs a **desktop-first, fixed-maximum fluid grid** optimized for high-resolution displays (`1440px` target canvas width, capped at `1600px`). It balances newspaper column layouts with dynamic dashboard modules.

### Layout Modules
- **Macro Ticker Bar**: Full-width sticky strip at the top (`h-10` / 40px), displaying real-time indices (KOSPI, KOSDAQ, USD/KRW, US 10Y Treasury, WTI Crude) with horizontal scrolling and subtle `1px` borders.
- **Top 10 Hero Grid**: A 5-column x 2-row or 10-card horizontal-overflow carousel presenting the week's most actively monitored equities. Each card maintains an identical aspect ratio with strict vertical alignment for quick scanning.
- **Primary Body (12-Column Grid)**:
  - **Columns 1–8 (Main Stage)**: Weekly AI 3-line briefing hero, detailed stock breakdowns, institutional flow charts, and disclosure dossiers.
  - **Columns 9–12 (Analytical Rail)**: Fixed-width contextual sidebar containing central bank rate calendars, theme performance heatmaps, and curated weekly watchlists.

### Responsive Breakpoints
- **Desktop (`>= 1280px`)**: Full 12-column analytical layout with persistent side rail.
- **Compact Desktop / Tablet (`768px – 1279px`)**: 8-column layout. The analytical rail drops below the main editorial body; the Top 10 Hero grid converts to a 2-column or 3-column wrap.
- **Mobile (`< 768px`)**: Single-column vertical stream. The Macro bar becomes horizontally swipable; tables activate sticky left columns with horizontal scroll for numerical fields.

## Elevation & Depth

Visual hierarchy is communicated through **tonal layering and low-contrast architectural borders**, avoiding heavy shadows and exaggerated blurs.

### Depth Hierarchy
- **Canvas Base (`Level 0`)**: The warm editorial paper base (`#FAF7F2`). No shadows.
- **Content Cards & Panels (`Level 1`)**: Pure white background (`#FFFFFF`) with a continuous `1px` structural outline (`#E8E5DF`). No drop shadows on static state; clean, border-defined separation mimics columns in a printed broadsheet.
- **Interactive Hover & Focused Cards (`Level 2`)**: Used for Top 10 cards and clickable stocks. Elevation is indicated by border tint shift (`#CBD5E1`) and a soft, low-radius contact shadow: `box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -1px rgba(15, 23, 42, 0.03)`.
- **Flyouts, Dropdowns & Disclosure Modals (`Level 3`)**: Pure white surfaces with crisp borders (`#CBD5E1`) and a directional drop shadow: `box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 4px 8px -2px rgba(15, 23, 42, 0.04)`.
- **Dividers & Structural Rules**: Solid `1px` rules without blur. Horizontal section headers incorporate a subtle double-rule treatment (a classic editorial marker) composed of a `1px` solid border, `2px` transparent gap, and a second `1px` solid border in muted slate.

## Shapes

The design system maintains a **compact, softly disciplined corner geometry (Roundedness Level 1)**. Sharp enough to feel serious and institutional, yet smoothed just enough to avoid harsh visual corners.

### Component Corner Radius Rules
- **Structural Cards, Panels, & Data Containers**: `rounded-md` (`4px` / `0.25rem`). Maintains the crispness of grid-aligned editorial modules.
- **Badges, Delta Pills, and Tickers**: `rounded-sm` (`2px` / `0.125rem`). Ensures compact visual footprints inside dense table rows without encroaching on numerical values.
- **Interactive Buttons & Input Controls**: `rounded-md` (`4px` / `0.25rem`). Consistent with card container geometry.
- **Theme Tags & AI Insight Labels**: `rounded-sm` (`2px` / `0.125rem`) with `1px` inset borders. Rounded pill shapes are deliberately avoided to maintain an institutional aesthetic.

## Components

### 1. Hero KRX Top 10 Cards
- **Structure**: Compact cards arranged in an organized grid. Contains ticker code (`JetBrains Mono`, `0.75rem`), company name (`Public Sans Bold`, `0.875rem`), current price (`tabular-nums`, `1.125rem`), and 7-day sparkline.
- **Movement Stamp**: Delta badge situated in the upper right. Upward (`#D92D20` text on `#FEF2F2` background), downward (`#1A56A4` text on `#EFF6FF` background).
- **Border Indicator**: A subtle `2px` left border in the brand color (`#1E3A5F`) marks equities carrying high-priority weekly disclosures.

### 2. Weekly 3-Line AI Executive Briefing
- **Frame**: Anchored in a pale cream container (`#FDFCF9`) framed by a `1px` border (`#E5E0D8`) with an editorial double-rule header.
- **Typography**: Header uses `Source Serif 4` (`1.25rem`, bold). The three briefing items use bullet points with highlighted bold takeaways and Sky Accent (`#0EA5E9`) keyword markers.
- **Action Footnote**: Includes small timestamp, AI model confidence score, and primary source links in `JetBrains Mono` (`0.6875rem`).

### 3. Macroeconomic & FX Ribbon Bar
- **Dimensions**: Fixed 38px height, continuous horizontal row with subtle vertical divider rules (`1px solid #E2E8F0`).
- **Data Pairs**: Metric label (e.g., `USD/KRW`, `CD 91D`, `WTI`) in uppercase neutral ink (`0.6875rem`, weight 600), followed by current value and directional delta glyph (`▲`/`▼`).

### 4. Tables & Dense Stock Lists
- **Header**: `#F8F9FA` background, uppercase `0.6875rem` labels, tracking `0.05em`, bottom border `1.5px solid #CBD5E1`.
- **Row Styling**: Standard row height `44px`. Border bottom `1px solid #F1F5F9`. Alternating row zebra striping is omitted; row hover triggers a gentle background change to `#F8FAFC`.
- **Alignment**: Text fields align left; currency, percentage, and volume figures align strictly to the right using `tabular-nums`.

### 5. Buttons & Action Links
- **Primary Editorial Button**: Deep Navy (`#1E3A5F`) fill, `#FFFFFF` text, `4px` radius, hover transition to `#1A56A4`. No pill shapes.
- **Secondary / Ghost Button**: White fill, `1px` border (`#CBD5E1`), Navy text. Hover fill `#F8FAFC`.
- **Data Export / Filter Chip**: Muted grey ground (`#F1F5F9`), text `#334155`, active state highlighted with `#1E3A5F` background and white text.

### 6. Theme & Disclosure Insight Badges
- **Volume Surge Badge**: Amber fill (`#FEF3C7`), text (`#B45309`), border (`#FDE68A`).
- **Regulatory Disclosure Tag**: Slate fill (`#F1F5F9`), text (`#334155`), code font (`JetBrains Mono`).
- **AI Trend Tag**: Sky tint (`#E0F2FE`), text (`#0369A1`), paired with a minimal `#0EA5E9` dot icon.