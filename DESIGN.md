---
name: ContractFlow
description: Simple project payment tracking for small business owners.
colors:
  primary: "#f0cfb7"
  link: "#1ba8bf"
  info: "#a2b6b3"
  success: "#8ec9b8"
  warning: "#efd9a8"
  danger: "#e8685a"
  body-bg: "#f5f5f5"
  text: "#4a4a4a"
  surface: "#ffffff"
  border: "#dbdbdb"
  ink-dark: "#191c1d"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "2.5rem"
    fontWeight: 600
    lineHeight: 1.25
  heading:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Open Sans, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
  small:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.25
rounded:
  sm: "0.25rem"
  md: "0.5rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.sm}"
    padding: "0.7em 1.5em"
  button-primary-hover:
    backgroundColor: "#e8bc9f"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.sm}"
    padding: "0.7em 1.5em"
  button-dark:
    backgroundColor: "{colors.ink-dark}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "0.7em 1.5em"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0.5em 0.75em"
    border: "1px solid {colors.border}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "1.25rem"
  tag-active:
    backgroundColor: "#48c774"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "0.125em 0.75em"
  tag-warning:
    backgroundColor: "#ffe08a"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.sm}"
    padding: "0.125em 0.75em"
---

# Design System: ContractFlow

## 0. Framework Layer — Bulma CSS

ContractFlow uses **Bulma 1.0.4** as its CSS framework. The design system lives inside Bulma's component model rather than replacing it.

**Principle: Bulma components first; custom CSS last.** Every UI element should use a Bulma component, modifier, or utility before writing a single line of custom CSS. Custom CSS is reserved for:
- Design tokens not exposed by Bulma (custom color ramps, font families, border radius overrides)
- Layout patterns that don't exist in Bulma (e.g., project grid with `repeat(auto-fill, minmax(300px, 1fr))`)
- One-off interaction details (hover lifts, transitions)

**When a Bulma component exists, use it.** The component vocabulary is:
- `.card` — for grouped content surfaces (overview stats, stage detail cards)
- `.level` — for horizontal financial comparisons (estimated vs actual)
- `.media` + `.media-left` + `.media-content` — for icon + label + value rows
- `.tag` — for status badges, with semantic color modifiers
- `.icon` — for SVG icon containers (sized via `.icon svg { width: 100%; height: 100%; }`)
- `.progress` — for burn bars and completion bars
- `.heading` — Bulma's uppercase eye-brow label (the only allowed uppercase text)
- `.help` — for secondary footnotes below values
- `.columns` + `.column` — for every grid/row layout (responsive via `is-N-desktop` modifiers)
- `.card-footer` + `.card-footer-item` — for card action rows
- `.button` and its modifier variants — for all interactive actions
- `.notification` — for empty states and alerts
- `.navbar`, `.breadcrumb`, `.table`, `.form` elements — for their respective roles

No custom CSS class should duplicate a Bulma component's purpose. If a review surfaces a custom class that maps to a Bulma equivalent, replace it.

## 1. Overview

**Creative North Star: "The Ledger"**

ContractFlow is designed like a well-kept financial journal. Every number has its place, every transaction leaves a clear trail, and nothing is decorative. The system conveys precision, security, and absolute control — because when the user is dealing with money, uncertainty is the enemy.

This is not accounting software re-skinned. It's a tool built for a business owner who needs to run projects and pay contractors without becoming a bookkeeper. The interface is restrained: neutral surfaces with warm peach accents, readable data without density, and interactions that give confidence without ceremony.

**Key Characteristics:**
- Clean slate surfaces with subtle structure (grid background hero, bordered step numbers)
- Cards lift on interaction — a tactile response, not a decorative flourish
- Serif headings for authority; sans body for readability
- Status communicated through color (green for active, yellow for paused, blue for complete) — the only place color carries semantic weight
- No decoration that doesn't serve a task

## 2. Colors

A restrained palette anchored by a warm peach primary and teal link color. The palette is intentionally quiet — it conveys calm and control, not excitement.

### Primary
- **Warm Peach** (`#f0cfb7`, hsl(25, 66%, 83%)): Primary action buttons, create CTAs. At 83% lightness this reads as a gentle tint against dark text.

### Link / Interactive
- **Teal** (`#1ba8bf`, hsl(189, 79%, 50%)): Links, interactive indicators, secondary interactive states. The only saturated color in common use.

### Semantic
- **Seafoam** (`#8ec9b8`, hsl(171, 48%, 69%)): Success states, active status tags.
- **Warm Sand** (`#efd9a8`, hsl(43, 72%, 79%)): Warning states, paused status tags.
- **Coral** (`#e8685a`, hsl(16, 71%, 67%)): Danger states, destructive actions, archived indicators.
- **Muted Sage** (`#a2b6b3`, hsl(174, 20%, 68%)): Info notifications.

### Neutral
- **Light Slate** (`#f5f5f5`): Body background. A cool near-white that reads as clean, not clinical.
- **Surface White** (`#ffffff`): Cards, input backgrounds, modal surfaces.
- **Border Stone** (`#dbdbdb`): Default borders and dividers. Subtle — structure without weight.
- **Ink Gray** (`#4a4a4a`): Body text. Dark enough for 4.5:1+ contrast on all surfaces.
- **Ink Dark** (`#191c1d`): Dark button backgrounds, high-emphasis labels, hero CTAs.

### Named Rules

**The No-Centered-Data Rule.** Financial values, headings, and labels are left-aligned inside cards and surfaces. Centered text is reserved for one-off hero moments (landing page CTAs, empty states) and never for data comparisons. Financial data is read left-to-right; centering it adds cognitive friction for zero semantic gain.

**The Semantic Restraint Rule.** Color carries meaning or it doesn't appear. Peach = action, teal = navigation, green = active, yellow = paused, blue = complete, coral = danger. No decorative color use.

**The One Accent Rule.** Teal is the only saturated interactive color. It appears on links and interactive indicators only. At any distance, the teal tells the eye "this is clickable."

## 3. Typography

**Display Font:** Source Serif 4 (Georgia, Times New Roman, serif)
**Body Font:** Source Sans 3 (system-ui, Segoe UI, sans-serif)
**UI Font:** Open Sans (system-ui, sans-serif)

**Character:** The pairing is editorial meets utility. Serif headings carry authority — they say "this is official, this is about money." Sans body and UI text work efficiently without competing. The two families contrast on the serif/sans axis, which avoids the "similar but not identical" trap.

### Hierarchy

- **Display** (600, 2.5rem / 40px, 1.25): Hero headlines and page titles. Used sparingly — one per page.
- **Heading** (600, 1.5rem / 24px, 1.3): Section titles and card titles. Sets the section's authority.
- **Title** (600, 1.25rem / 20px, 1.3): Subsection titles, dialog headings. The header that organizes without dominating.
- **Body** (400, 1rem / 16px, 1.5): All prose, descriptions, cell content. Max line length 75ch for readability.
- **Label** (600, 0.875rem / 14px, 1.25): Form labels, table headers, button text. Bold weight distinguishes from body.
- **Small** (400, 0.75rem / 12px, 1.25): Metadata, timestamps, helper text, footnotes.

### Named Rules

**The Single Source Rule.** All body copy and UI labels use Source Sans 3. Open Sans is exclusively for the navbar brand text. Source Serif 4 is exclusively for headings. No mixing within a role.

## 4. Elevation

The system is flat by default with subtle lift on interaction. Cards sit flush against the surface at rest. On hover, they lift 2px with a small shadow. This is not a layered shadow system; depth is earned through interaction.

### Shadow Vocabulary

- **Card Rest** (`none`): Cards and surfaces sit flat. No ambient shadow.
- **Card Hover** (`0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0px 0 1px rgba(10, 10, 10, 0.02)`): The only shadow in the system. Appears on cards and clickable surfaces on hover. A 2px translateY accompanies it.

### Named Rules

**The Flat-By-Default Rule.** Every surface starts at rest with no shadow. Shadows appear only as a response to hover state. A static page should read as flat and calm.

**The One-Shadow Rule.** There is exactly one shadow in the system — the card hover. No modal shadows, no dropdown shadows, no tooltip shadows. Structure comes from borders and spacing, not depth.

**The Bulma-First Rule.** Every UI element must be built from a Bulma component, modifier, or utility before writing custom CSS. Custom CSS is limited to design tokens (`:root` variable overrides), the `.icon svg` fill rule, and project-specific layout patterns (project grid). A custom class that duplicates a Bulma component's purpose is a design debt and should be replaced.

## 5. Components

All components are Bulma CSS classes. Custom CSS is not used unless explicitly noted.

### Buttons (`<button class="button is-*">`)
- **Shape:** Slightly rounded (4px radius, `--bulma-radius`).
- **Primary (`is-primary`):** Warm Peach (`#f0cfb7`) background, Ink Dark (`#191c1d`) text. Lightly tinted; the low contrast against white surfaces signals approachability. Hover: slightly deeper peach (`#e8bc9f`).
- **Dark (`is-dark`):** Ink Dark (`#191c1d`) background, white text. Used for the main landing page CTA and high-emphasis actions.
- **Secondary (`is-secondary`):** Standard Bulma secondary (light gray bg, dark text). Used for cancel and auxiliary actions.
- **Small variant** available via `is-small`. Compact padding, smaller type.
- **States:** Hover darkens the background. Focus uses the default Bulma focus ring. Active no visible flash — the state change is the navigation itself.

### Cards (`<div class="card">`)
- **Corner Style:** Slightly rounded (8px, `.card` default).
- **Background:** Surface White (`#ffffff`).
- **Shadow Strategy:** None at rest; Card Hover on hover with 2px upward translate.
- **Border:** None separate from the shadow's 1px edge.
- **Internal Padding:** 1.25rem (`card-content`).
- **Text Alignment:** All card content is left-aligned. Financial comparisons inside cards use `.columns` (not `.level`) for side-by-side left-aligned layout.
- **Structure:** `.card-content` for body content, `.card-footer` with `.card-footer-item` for action rows.
- **Varied layout:** When cards contain different data (e.g., budget comparison vs status), use `columns` with different column widths (`is-two-thirds` / `is-one-third`) to avoid identical-card grids.

### Financial Comparison (`<div class="columns is-mobile">`)
- **Usage:** Side-by-side comparison of two financial values (estimated vs actual, budget vs paid). Replaces `.level` for left-aligned financial data.
- **Structure:** Two `.column` children, each with `.heading` label above a `.title` value. Text is left-aligned in both columns — financial figures are read left to right, not centered.
- **Custom CSS:** None.

### Media (`<div class="media">`) + Icon (`<span class="icon">`)
- **Usage:** Icon + label + value rows inside cards (stage cost breakdowns, stat detail rows).
- **Structure:** `.media > .media-left > .icon` for the SVG, `.media-content > p` for label and value.
- **SVG sizing:** Icons auto-fill the `.icon` container via the single custom CSS rule `.icon svg { width: 100%; height: 100%; }`.

### Tags / Status Badges (`<span class="tag is-*">`)
- **Shape:** Slightly rounded (4px), uppercase, `is-light` variant for reduced visual weight.
- **Active:** Green (`is-success is-light`).
- **Paused:** Yellow (`is-warning is-light`).
- **Planned:** Blue (`is-info is-light`).
- **Canceled / Delayed:** Coral (`is-danger is-light`).
- Tags are read-only indicators, not interactive.

### Progress Bars (`<progress class="progress is-small is-*">`)
- **Style:** Bulma progress bar, `is-small` by default. Thin (approx 4px), colored track.
- **Usage:** Burn bars on overview cards (budget used %), completion bars on stage cards.
- **Coloring:** `is-link` (teal) for nominal burn, `is-warning` (yellow) above 80%, `is-danger` (coral) at 100%.

### Headings + Labels inside Components
- `p.heading` — uppercase label above a value (estimated cost label, status label). The only uppercase text in the system.
- `p.title.is-4` / `p.title.is-5` — value display within cards and levels.
- `.help` — secondary footnote below a progress bar (e.g., "84% of budget used").

### Inputs / Fields
- **Style:** 1px Border Stone stroke, Surface White fill, 4px radius.
- **Focus:** Default Bulma focus treatment (colored border ring).
- **Error:** Standard Bulma `.is-danger` modifier (red border, red helper text).
- **Disabled:** Faded background, reduced opacity.
- **File upload:** Bulma file component with `.file-cta` and `.file-name`.

### Navigation (`<nav class="navbar">`)
- **Style:** Bulma navbar. Fixed top, full width, dark brand logo on the left.
- **Desktop:** Horizontal nav links with hoverable dropdowns (More > Payment Categories, Settings, Language switcher, Admin). Auth buttons on the right.
- **Mobile:** Burger menu expands the full nav vertically. Backdrop closes on click.
- **Typography:** Standard Bulma navbar-item styling. Active page via `.navbar-item` location.

### Tables (`<table class="table is-striped is-hoverable is-fullwidth">`)
- **Style:** Striped rows, hover highlight, full width.
- **Typography:** Body size (16px). Th headers in label weight (600).
- **Empty State:** Centered warning notification reading "No data available."

### Notifications (`<div class="notification is-warning has-text-centered">`)
- **Usage:** Empty states, flash messages, alerts.

## 6. Do's and Don'ts

### Do:
- **Do** use the Warm Peach primary for all primary CTAs to maintain consistent action affordance.
- **Do** use Teal for all links so the user instantly recognizes interactive text.
- **Do** keep the card grid responsive with `repeat(auto-fill, minmax(300px, 1fr))`.
- **Do** use semantic tags (green/yellow/blue/coral) for status — they're the only color that carries meaning.
- **Do** batch actions behind an "Actions" dropdown on detail views to keep the header clean.
- **Do** lead every page with a title and breadcrumb trail so the user always knows where they are.
- **Do** follow the budget-first flow: show estimates alongside actuals on every financial view.

### Don't:
- **Don't** use the primary peach as a background fill or decorative element — it's reserved for buttons and CTAs.
- **Don't** add colored left borders to cards as accents (side-stripe border anti-pattern).
- **Don't** use gradient text anywhere — all headings are solid colors.
- **Don't** add glassmorphism, blurred surfaces, or decorative overlays.
- **Don't** replicate the numbered section eyebrow (`01 / 02 / 03`) pattern — the landing page's "How it Works" steps are a genuine sequence, not scaffolding.
- **Don't** reinvent standard form controls — Bulma's `.input`, `.select`, `.checkbox`, and `.file` are the vocabulary.
- **Don't** use modals as the first solution for create/edit flows — inline and progressive disclosure are better.
- **Don't** add a card grid where the cards are all identical (icon + heading + text) — vary layout by content.
- **Don't** use tiny uppercase tracked eyebrows above every section — one named kicker is voice, repeating it is a tell.
- **Don't** look like traditional accounting software: no dense gray grids, no jargon-heavy labels, no overwhelming dashboards.
- **Don't** write custom CSS classes that map to an existing Bulma component. Instead of custom `.overview-card-box`, use `.card`. Instead of custom `.overview-amount`, use `.title.is-4`. Instead of custom `.stage-stat`, use `.media`. A custom class is only justified if no Bulma equivalent exists.
- **Don't** center financial data or labels inside cards. `.has-text-centered` on `.level-item` for budget comparisons creates cognitive friction — use left-aligned `.columns` instead.
