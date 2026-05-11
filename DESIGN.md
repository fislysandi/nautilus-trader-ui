---
version: alpha
name: Linear-M3 (adapted for NautilusTrader UI)
description: "A dark-theme dashboard for algorithmic trading built on Material 3 design tokens. Follows M3 color roles (primary, secondary, tertiary, error, surface), M3 typescale (display/headline/title/body/label), M3 shape families, and M3 elevation system — adapted for a data-dense trading interface with Linear's dark canvas aesthetic."

m3_framework:
  version: "Material 3 (Material You)"
  color_scheme: dark
  key_principle: "UI components use the `@material/web` web component library. The design follows M3 color roles (primary/surface/outline), M3 typescale categories, M3 shape tokens, and M3 elevation tokens. See m3.material.io for full spec."

# ───────────────────────────────────────────────
# M3 COLOR TOKENS — Dark scheme
#   All tokens map to Material 3 color roles.
#   - primary maps to M3 `md-sys-color-primary`
#   - surface-1..4 maps to M3 `md-sys-color-surface` variants
#   - tonal palettes available for surface container layers
# ───────────────────────────────────────────────

colors:
  # M3 Primary — lavender-blue brand accent (#5e6ad2 ~ M3 TonalPalette primary 70)
  primary: "#5e6ad2"
  on-primary: "#ffffff"
  primary-container: "#3c4ab8"
  on-primary-container: "#e0e0ff"

  # M3 Secondary — muted blue-gray for secondary actions
  secondary: "#a0a5b8"
  on-secondary: "#1a1c2a"
  secondary-container: "#30334a"
  on-secondary-container: "#d2d6e8"

  # M3 Tertiary — teal accent for alternative actions
  tertiary: "#78d2c6"
  on-tertiary: "#003731"
  tertiary-container: "#005048"
  on-tertiary-container: "#a0f0e2"

  # M3 Error
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  semantic-danger: "#ef4444"
  semantic-warning: "#eab308"

  # M3 Surface (dark) — follows M3 tonal surface layers
  surface: "#010102"
  surface-dim: "#010102"
  surface-bright: "#3a3a3d"
  surface-container-lowest: "#08080a"
  surface-container-low: "#0f1011"
  surface-container: "#141516"
  surface-container-high: "#1e1f21"
  surface-container-highest: "#292a2c"
  on-surface: "#f7f8f8"
  on-surface-variant: "#c4c6d0"
  outline: "#8e9099"
  outline-variant: "#43464f"

  # Semantic — PnL signals
  semantic-success: "#27a644"
  semantic-info: "#5e6ad2"

# ───────────────────────────────────────────────
# M3 TYPESCALE — Full Material 3 typescale
#   Maps to `md-sys-typescale-*` tokens.
#   Uses Inter for display/headline/title/body,
#   JetBrains Mono for label categories.
# ───────────────────────────────────────────────

typography:
  display-large:
    fontFamily: Inter, Roboto
    fontSize: 57px
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: -0.25px
  display-medium:
    fontFamily: Inter, Roboto
    fontSize: 45px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: 0px
  display-small:
    fontFamily: Inter, Roboto
    fontSize: 36px
    fontWeight: 400
    lineHeight: 1.22
    letterSpacing: 0px
  headline-large:
    fontFamily: Inter, Roboto
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0px
  headline-medium:
    fontFamily: Inter, Roboto
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.29
    letterSpacing: 0px
  headline-small:
    fontFamily: Inter, Roboto
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: 0px
  title-large:
    fontFamily: Inter, Roboto
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.27
    letterSpacing: 0px
  title-medium:
    fontFamily: Inter, Roboto
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.50
    letterSpacing: 0.15px
  title-small:
    fontFamily: Inter, Roboto
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: 0.1px
  body-large:
    fontFamily: Inter, Roboto
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0.5px
  body-medium:
    fontFamily: Inter, Roboto
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0.25px
  body-small:
    fontFamily: Inter, Roboto
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: 0.4px
  label-large:
    fontFamily: JetBrains Mono, ui-monospace
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: 0.1px
  label-medium:
    fontFamily: JetBrains Mono, ui-monospace
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: 0.5px
  label-small:
    fontFamily: JetBrains Mono, ui-monospace
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: 0.5px
  metric:
    fontFamily: Inter, Roboto
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.10
    letterSpacing: -0.8px

# ───────────────────────────────────────────────
# M3 SHAPE — Maps to `md-sys-shape-corner-*`
# ───────────────────────────────────────────────

shape:
  corner-none: 0px
  corner-extra-small: 4px
  corner-small: 8px
  corner-medium: 12px
  corner-large: 16px
  corner-extra-large: 28px
  corner-full: 9999px

# ───────────────────────────────────────────────
# M3 ELEVATION — Maps to `md-sys-elevation-*`
# ───────────────────────────────────────────────

elevation:
  level-0: "0px 0px 0px 0px rgba(0,0,0,0)"
  level-1: "0px 1px 3px 1px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.30)"
  level-2: "0px 2px 6px 2px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.30)"
  level-3: "0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px 0px rgba(0,0,0,0.30)"
  level-4: "0px 6px 10px 4px rgba(0,0,0,0.15), 0px 2px 3px 0px rgba(0,0,0,0.30)"
  level-5: "0px 8px 12px 6px rgba(0,0,0,0.15), 0px 4px 4px 0px rgba(0,0,0,0.30)"

# ───────────────────────────────────────────────
# SPACING — M3 reference 8dp grid, 4dp base unit
# ───────────────────────────────────────────────

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  # ── M3: Filled Button ──
  button-filled:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-large}"
    shape: "{shape.corner-small}"
    padding: 10px 24px
    elevation: "{elevation.level-0}"
  button-filled-hover:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    typography: "{typography.label-large}"
    shape: "{shape.corner-small}"
    padding: 10px 24px
    elevation: "{elevation.level-1}"
  button-tonal:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    typography: "{typography.label-large}"
    shape: "{shape.corner-small}"
    padding: 10px 24px
  button-outlined:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-large}"
    shape: "{shape.corner-small}"
    padding: 10px 24px
    border: "1px solid {colors.outline}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-large}"
    shape: "{shape.corner-small}"
    padding: 10px 12px
  button-danger:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-error}"
    typography: "{typography.label-large}"
    shape: "{shape.corner-small}"
    padding: 10px 24px

  # ── M3: Navigation Drawer ──
  navigation-drawer:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    width: 256px
    shape: "{shape.corner-none}"
    elevation: "{elevation.level-0}"
    border-right: "1px solid {colors.outline-variant}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-large}"
    shape: "{shape.corner-full}"
    padding: 12px 16px
  nav-item-selected:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    typography: "{typography.label-large}"
    shape: "{shape.corner-full}"
    padding: 12px 16px
  nav-item-icon:
    color: "{colors.on-surface-variant}"
    size: 24px
  nav-section-divider:
    border: "1px solid {colors.outline-variant}"

  # ── M3: Card ──
  card:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    shape: "{shape.corner-medium}"
    padding: 16px
    elevation: "{elevation.level-0}"
  card-hover:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    shape: "{shape.corner-medium}"
    padding: 16px
    elevation: "{elevation.level-1}"

  # ── Metric card (trading-specific, composited from M3 Card) ──
  metric-card:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    shape: "{shape.corner-medium}"
    padding: 16px
    elevation: "{elevation.level-0}"
  metric-value:
    typography: "{typography.metric}"
    color: "{colors.on-surface}"
  metric-label:
    typography: "{typography.label-medium}"
    color: "{colors.on-surface-variant}"
    textTransform: uppercase
  metric-positive:
    color: "{colors.semantic-success}"
  metric-negative:
    color: "{colors.semantic-danger}"

  # ── M3: Data Table (composited) ──
  data-table:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    shape: "{shape.corner-medium}"
    elevation: "{elevation.level-0}"
  data-table-header:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-large}"
    border-bottom: "1px solid {colors.outline-variant}"
  data-table-row:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-medium}"
    border-bottom: "1px solid {colors.outline-variant}"
  data-table-row-hover:
    backgroundColor: "{colors.surface-container-high}"

  # ── M3: Filled Text Field ──
  text-input:
    backgroundColor: "{colors.surface-container-highest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-large}"
    shape: "{shape.corner-extra-small}"
    padding: 12px 16px
    border: "1px solid {colors.outline}"
  text-input-focused:
    border: "2px solid {colors.primary}"

  # ── M3: Filled Card / Chart container ──
  chart-container:
    backgroundColor: "{colors.surface-container-low}"
    shape: "{shape.corner-medium}"
    padding: 16px
    elevation: "{elevation.level-0}"

  # ── M3: Top App Bar ──
  top-app-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.title-large}"
    height: 64px
    elevation: "{elevation.level-0}"
    border-bottom: "1px solid {colors.outline-variant}"

  # ── M3: Filter Chip ──
  filter-chip:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-large}"
    shape: "{shape.corner-small}"
    padding: 8px 16px
    border: "1px solid {colors.outline}"
  filter-chip-selected:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    shape: "{shape.corner-small}"
    padding: 8px 16px

  # ── M3: Badge (status indicator) ──
  badge:
    typography: "{typography.label-small}"
    shape: "{shape.corner-full}"
    padding: 2px 8px
  badge-active:
    backgroundColor: "{colors.semantic-success}"
    textColor: "#000000"
  badge-inactive:
    backgroundColor: "{colors.outline}"
    textColor: "{colors.on-surface}"
  badge-error:
    backgroundColor: "{colors.error}"
    textColor: "#000000"
  metric-card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 16px
    border: "1px solid {colors.hairline}"
  metric-card-favorable:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.semantic-success}"
    rounded: "{rounded.lg}"
    padding: 16px
    border: "1px solid {colors.hairline}"
  metric-card-unfavorable:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.semantic-danger}"
    rounded: "{rounded.lg}"
    padding: 16px
    border: "1px solid {colors.hairline}"
  data-table:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.hairline}"
  data-table-header:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    border-bottom: "1px solid {colors.hairline}"
  data-table-row:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    border-bottom: "1px solid {colors.hairline}"
  data-table-row-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
  chart-container:
    backgroundColor: "{colors.surface-1}"
    rounded: "{rounded.lg}"
    padding: 16px
    border: "1px solid {colors.hairline}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  button-secondary:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
    border: "1px solid {colors.hairline}"
  button-danger:
    backgroundColor: "{colors.semantic-danger}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  text-input:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 8px 12px
    border: "1px solid {colors.hairline}"
  sidebar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    width: 240px
    border-right: "1px solid {colors.hairline}"
  sidebar-item:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body-sm}"
    padding: 8px 16px
    rounded: "{rounded.md}"
  sidebar-item-active:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: 8px 16px
    rounded: "{rounded.md}"
    border-left: "2px solid {colors.primary}"
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    height: 48px
    border-bottom: "1px solid {colors.hairline}"
  status-badge:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 8px
  status-badge-active:
    backgroundColor: "{colors.semantic-success}22"
    textColor: "{colors.semantic-success}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 8px
  status-badge-error:
    backgroundColor: "{colors.semantic-danger}22"
    textColor: "{colors.semantic-danger}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 8px
  modal:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: 24px
    border: "1px solid {colors.hairline}"
---

## M3 Framework

This design follows **Material 3 (Material You)** guidelines from m3.material.io.

### Key M3 Tokens Used

| M3 Token Category | How It's Applied |
|---|---|
| `md-sys-color-*` | All color tokens map to M3 dark-scheme roles: primary, secondary, tertiary, error, surface-container layers |
| `md-sys-typescale-*` | Full typescale: display, headline, title, body, label sizes |
| `md-sys-shape-corner-*` | Shape tokens for component surfaces |
| `md-sys-elevation-*` | Levels 0-5 shadow elevation |
| `md-sys-state-*` | Hover/focus/pressed/dragged state layers |
| `md-comp-*` | Component tokens for buttons, cards, dialogs, nav |

### Using `@material/web` components

All UI controls should use `@material/web` web components:
- `<md-filled-button>` — primary actions
- `<md-outlined-button>` — secondary actions
- `<md-text-button>` — tertiary actions
- `<md-filled-text-field>` — text inputs
- `<md-filter-chip>` — filter toggles
- `<md-navigation-drawer>` — sidebar
- `<md-navigation-rail>` — collapsed sidebar
- `<md-top-app-bar>` — top bar
- `<md-card>` — content containers
- `<md-checkbox>`, `<md-radio>`, `<md-switch>` — form controls
- `<md-dialog>` — modals
- `<md-menu>` — dropdowns
- `<md-list>` — list items
- `<md-divider>` — separators

Set theme colors via CSS custom properties:
```css
:root {
  --md-sys-color-primary: #5e6ad2;
  --md-sys-color-surface: #010102;
  --md-sys-color-surface-container-low: #0f1011;
  --md-sys-color-surface-container: #141516;
  --md-sys-color-outline: #8e9099;
  --md-sys-color-outline-variant: #43464f;
}
```

## Overview

A dark-theme algorithmic trading dashboard built on **Material 3 design tokens**. The canvas is M3 `surface` (#010102), text is M3 `on-surface` (#f7f8f8), and the primary accent is M3 `primary` (#5e6ad2 lavender-blue).

Three semantic colors augment PnL signal:
- **Success green** (#27a644) — positive PnL, winning trades
- **Warning amber** (#eab308) — drawdown warnings
- **Danger red** (#ef4444) — negative PnL, losing trades

### Design Rhythm

- **Data density** is the priority — metric cards, tables, charts
- **Surface container layers** (low/container/high) carry hierarchy instead of decorative flourishes
- **Hairline outlines** (M3 `outline-variant`) separate content regions
- **No illustrations, no gradients, no decorative color** — the data is the decoration
- **Monospace labels** (JetBrains Mono at `label-*` sizes) for all code-adjacent values

## Key Differences from Original Linear

- Added `metric` typography for large P&L display numbers (32px, semibold)
- Added `semantic-warning` and `semantic-danger` colors for PnL signal
- Added `metric-card` component with favorable/unfavorable color variants
- Added `data-table` component family for trade/position/order tables
- Added `chart-container` for equity curve and drawdown charts
- Added `sidebar` and `sidebar-item` for dashboard navigation
- Added `status-badge-active` and `status-badge-error` for live trading status
- Replaced proprietary Linear fonts with open-source Inter + JetBrains Mono

## Layout

### Page Structure (M3 Navigation Drawer + Top App Bar)

```
┌──────────────────────────────────────────────────────────────────┐
│ Top App Bar (64px) — Logo | Page Title | Status Badge | Actions │
├─────────────────┬────────────────────────────────────────────────┤
│                 │                                                │
│ Navigation      │  Main Content Area                             │
│ Drawer (256px)  │                                                │
│                 │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│ Dashboard       │  │ Sharpe │ │  PnL   │ │Win Rate│ │Max DD  │  │
│ Backtest        │  └────────┘ └────────┘ └────────┘ └────────┘  │
│ Live            │                                                │
│ Strategies      │  ┌───────────────────────────────────────┐     │
│ Data            │  │  Chart: Equity Curve                  │     │
│ Settings        │  └───────────────────────────────────────┘     │
│                 │                                                │
│                 │  ┌───────────────────────────────────────┐     │
│                 │  │  Data Table: Trades                   │     │
│                 │  │  Date │ Side│ Size│ Entry│ PnL        │     │
│                 │  └───────────────────────────────────────┘     │
└─────────────────┴────────────────────────────────────────────────┘
```

### Metric Cards (4-up row)

Four `<md-card>` components in a CSS grid (4 columns). Each contains:
- Metric value in `{typography.metric}` (32px, semibold)
- Label in `{typography.label-medium}` uppercase
- Delta indicator colored `metric-positive` or `metric-negative`

### Data Tables

Use a custom table composited from M3 surface + typography tokens:
- Sticky header row on `surface-container` background
- Body rows with `outline-variant` hairline separators
- Row hover lifts to `surface-container-high`
- Numeric columns right-aligned
- PnL column uses `semantic-success` / `semantic-danger`

### Data Tables

Tables use hairline borders, sticky headers on dark canvas background, and row hover to surface-2. Columns can be sorted. Numeric columns right-align. PnL columns use semantic colors (green positive, red negative).

## Component Usage Guide for Build Agent

Use `@material/web` components where applicable. Style overrides go through CSS custom properties (`--md-sys-color-*`, `--md-sys-typescale-*`, `--md-sys-shape-*`, `--md-sys-elevation-*`).

### Building the Main Dashboard

```
<md-top-app-bar>
  ├── Logo/Title (left, typography: title-large)
  ├── Status indicator (center) — <md-badge> with Active/Inactive variant
  └── Action buttons (right) — <md-filled-button> Run, <md-outlined-button> Stop

<md-navigation-drawer>
  ├── Dashboard nav item (nav-item-selected)
  ├── Backtest nav item
  ├── Live Monitor nav item
  ├── Strategies nav item
  ├── Data nav item
  └── Settings nav item

<!-- Metric Row — 4 md-card in CSS grid -->
<md-card>
  Sharpe Ratio
  <span class="metric-value">1.42</span>
  <span class="metric-positive">↑ +0.12</span>
</md-card>
<!-- repeat for PnL, Win Rate, Max Drawdown -->

<!-- Chart Section — custom div with chart-container class -->
<div class="chart-container">
  <canvas>Equity Curve Chart</canvas>
</div>

<!-- Data Table Section — custom composited table -->
<table class="data-table">
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

### Live Trading Monitor

```
Live Status Bar
  ├── Status badge (active = green, stopped = muted, error = red)
  ├── Uptime counter
  └── Node version

Positions Panel
  └── Table: Instrument | Side | Qty | Entry | Current | Unrealized PnL

Orders Panel
  └── Table: Instrument | Side | Type | Price | Qty | Status

Account Panel
  └── Card: Balance | Available | In-use | Margin Usage %
```

## Do's and Don'ts

### Do
- Use `@material/web` components for all UI controls (buttons, inputs, navigation, dialogs)
- Override M3 theme via CSS custom properties `--md-sys-color-*` in `:root`
- Use surface-container layers (`low`/`container`/`high`) for hierarchy
- Use M3 elevation levels (0-5) for modals, menus, and interactive surfaces
- Use surface color (not shadows) as the default card separation mechanism
- Reserve primary color for primary actions, selected states, and focus rings
- Right-align numeric columns in data tables
- Use semantic-success / semantic-danger for PnL values
- Keep metric cards compact — no icons, no decorative elements
- Use hairline outline-variant borders instead of elevation for section separation
- Use monospace label tokens (label-large/medium/small) for all data-display text (trade prices, quantities, IDs)

### Don't
- Don't import non-M3 components when `@material/web` has a matching component
- Don't use primary color as a section background
- Don't add gradients or decorative flourishes
- Don't use emoji or illustrations in data views
- Don't ship a light mode — dark scheme only
- Don't add scrollbars to metric cards
- Don't use true black (#000000) as the surface — use #010102 (M3 dark surface)
- Don't use primary color for error states — use error-container instead

## Responsive Behavior

| Breakpoint | Changes |
|---|---|
| <1280px | 4 metric cards → 2x2 grid |
| <1024px | Sidebar collapses to icon-only |
| <768px | Stack layout, tables horizontal scroll |
