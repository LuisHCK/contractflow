# Agent Context

## Design Context

This project has a captured design system. Before modifying any UI:

1. Read `PRODUCT.md` for strategic context (register, users, positioning, brand personality, anti-references, design principles).
2. Read `DESIGN.md` for the visual system (colors, typography, elevation, components, do's/don'ts).
3. The sidecar at `.impeccable/design.json` contains machine-readable tokens, component CSS snippets, and tonal ramps.
4. Live mode is configured at `.impeccable/live/config.json` for in-browser iteration.

## Session Summary: Layout Hardening + Polish (2026-07-20)

### Goal
Harden and improve layout of the ContractFlow project detail view (Express + EJS + Bulma).

### What Was Done

1. **`_overview-cards.ejs`** — Broke the P1 identical-card-grid anti-pattern:
   - Replaced 4 identical `.box` cards with two Bulma `.card` components in `columns is-variable` (2/3 + 1/3)
   - Primary card: `.level` comparison of Estimated Cost vs Actual Cost side-by-side with a `.progress` bar showing % of budget used
   - Secondary card: Status as a Bulma `.tag` (color-coded by `statusStyles` map) and Total Stages as a `.title is-4`
   - Computes `budgetPercent` for the burn bar; color shifts from `is-link` → `is-warning` → `is-danger` as budget is consumed
   - Status maps: `in_progress` → `is-success`, `on_hold` → `is-warning`, `planned` → `is-info`, `canceled/delayed` → `is-danger`

2. **`_stats.ejs`** (stage detail) — Same treatment:
   - Same `.card` in `.columns` layout: Estimated Budget vs Total Paid with `.progress` bar
   - Secondary card: Outstanding Balance (with conditional `.has-text-danger`/`.has-text-success`) + Payment Count
   - Balance taken from computed `totalDue`

3. **`_stages.ejs`** (project stage cards):
   - Replaced custom `.stage-stats` flex layout with Bulma `.columns.is-multiline` + `.media` component for each stat
   - Icons use Bulma `.icon` containers; sized via `.icon svg { width: 100%; height: 100%; }`

4. **`main.css`** — Typography + cleanup:
   - Changed `--bulma-family-primary` from `'Open Sans'` → `'Source Sans 3', system-ui, sans-serif`
   - Added `--bulma-family-secondary`: `'Source Serif 4', Georgia, serif`
   - All `.title` and `h1-h6` now use the serif secondary font
   - Imported both fonts from Google Fonts (replaced Open Sans import)
   - Removed all custom `.overview-*` and `.stage-*` CSS classes (no longer needed; Bulma components used instead)
   - Added `.icon svg { width: 100%; height: 100%; }` for SVG sizing inside Bulma icons

5. **Locales** — Added `overview_budget_used` key to both en.json and es.json with `{{value}}` interpolation

### Before vs After

| Component | Before | After |
|-----------|--------|-------|
| Overview cards | 4 identical `.box` with custom `.overview-card-*` CSS | 2 Bulma `.card` components in `columns`: `.level` comparison + `.tag` status |
| Stage stats | 4 identical `.box` with custom `.overview-card-*` CSS | Same card layout as overview |
| Stage card stats | `columns is-multiline` with inline flex items | `columns` + `.media` + `.icon` Bulma components |
| CSS custom footprint | ~300px custom overview/stage CSS | 4 lines (`.icon svg` fill rule) |

## Session Summary: Stage Detail Alignment (2026-07-20)

### Goal
Apply the same treatment done for the project detail view to the stage detail view — asymmetric cards, consistent spacing, design system alignment.

### What Was Done

1. **`_stats.ejs`** (stage partial) — Converged with `_overview-cards.ejs`:
   - Right card now includes `progress` as a third row (balance → payment count → progress), matching the project detail's metadata card pattern
   - Progress bar gets `mb-4` for local spacing consistency (same as overview card)
   - Already used `.columns.is-mobile` left-aligned layout (from previous pass)

2. **`show.ejs`** (stage detail) — Major cleanup:
   - **Replaced 4 identical `.box` cards** with single `include('./partials/_stats')` — the asymmetric 2/3 + 1/3 card layout matching project show. Eliminates the identical-card-grid anti-pattern.
   - Removed `is-family-sans-serif` from `<h1>` (drift from DESIGN.md — all headings use Source Serif 4 per `main.css`)
   - Changed Edit button from `is-light` → `is-secondary` (consistent with project show's action buttons)
   - Added `mb-4` to Payments section heading (consistent with project show's heading-to-content spacing)
   - Removed `mt-4` from empty state notification (consistent spacing; section handles it)

### Before vs After

| Component | Before | After |
|-----------|--------|-------|
| Summary stats | 4 identical `.box` cards in `is-12-mobile is-6-tablet is-3-desktop` grid | Asymmetric 2/3 + 1/3 `.card` layout via `_stats.ejs` |
| Heading font | `is-family-sans-serif` (overrode DESIGN.md) | Inherits `--bulma-family-secondary` (Source Serif 4) |
| Edit button | `is-light` | `is-secondary` |

### Session Summary: Projects Polish (2026-07-20)

### Goal
Final polish pass across all project list + detail templates: visual consistency, design system alignment, edge cases, missing aria, and broken paths.

### What Was Done

1. **`_list.ejs`** — Major cleanup:
   - Progress label row: replaced nested `columns` with `pb-1`/`pb-2` with a single `is-flex is-justify-content-space-between mb-1` flex row (matching the stage card fix)
   - Icon wrappers: replaced custom `is-flex gap-2` + standalone SVG with Bulma `.media` + `.icon` components (design system alignment)
   - `aria-hidden="true"` on SVGs inside `.icon` containers
   - Description now conditionally rendered (hides empty subtitle markup)
   - Concatenated translation key `__('projects_list_view') + ' ' + __('detail_details')` → single key `projects_list_view_details`
   - Status styles map merged with the overview card map to cover all project status values
   - Archived/deleted duplicate tag removed (status tag handles it)
   - Progress bar gets `mb-0` for spacing consistency

2. **`index.ejs`** — Added `aria-hidden="true"` to the create button's plus-icon SVG. Already used `.icon` via `is-hidden-tablet` wrapper but SVG itself was missing the attribute.

3. **`create.ejs`** — Fixed broken include paths: `../partials/head` → `../../partials/head`, `../partials/navigation` → `../../partials/navigation`, `../partials/form` → `../../partials/form`. Changed heading from `.title.is-3` → `.title.is-2` for better hierarchy consistency with other page titles (`.is-1`).

4. **`form.ejs`** — Cancel button now checks for `document.referrer` before calling `history.back()`, falling back to `/projects`. Prevents silent no-op when browser history is empty.

5. **`show.ejs`** — Description subtitle now conditionally rendered (hides empty markup).

6. **Locales** — Added `projects_list_view_details` key to en.json ("View Details") and es.json ("Ver detalles").

### Detector & Assessment
- Detector returned empty (no hard anti-patterns — existing cleanup was working)
- Identified and fixed 11 issues: 1 broken include path (functional), 3 aria gaps (accessibility), 2 markup inconsistencies (progress label, icon wrappers), 1 translation drift, 1 hierarchy drift, 1 dead pattern (duplicate status tag), 1 edge case (empty history), 1 conditional rendering gap

### Not Changed
- `.projects-grid` / `.project-card` CSS classes remain in main.css (used elsewhere or kept for future use)
- `.create-button-wrapper` z-index remains at 100 (defined in main.css, would need a token-scale change to fix)

## Session Summary: Mobile Title Layout (2026-07-20)

### Goal
Fix the title + actions layout on both project and stage detail pages — on mobile, the flex row was convoluted (title and actions competing for horizontal space, buttons wrapping awkwardly).

### What Was Done

1. **`projects/show.ejs`** — Replaced inline `is-flex` row with Bulma `columns is-vcentered` (no `is-mobile`). Title in a `.column`, dropdown in `.column.is-narrow.has-text-right`. Columns stack on mobile, sit side by side on tablet+ — pure Bulma, no custom CSS. Changed subtitle from `<h2>` to `<p class="subtitle">` (semantic fix — it's not a heading).

2. **`stages/show.ejs`** — Same treatment: `columns is-vcentered` wrapping the title + action buttons. Buttons column gets `is-narrow` + `is-justify-content-flex-end` for right alignment when stacked. Replaced `section.is-flex` + `.page-header` (removed from `main.css`).

### Before vs After (mobile)

| Page | Before | After |
|------|--------|-------|
| Project detail | Title and actions dropdown side by side, convoluted on narrow screens | Title full width, actions dropdown below right-aligned |
| Stage detail | Title and buttons wrapped awkwardly in flex row on mobile | Title stacked above, buttons grouped below right-aligned |

### Session Summary: Responsive + Touch Adaptation (2026-07-20)

### Goal
Adapt the project detail page to work reliably across mobile, tablet, and touch-input devices — not scaling pixels, but rethinking interaction for the input context.

### What Was Done

1. **`show.ejs`** — Dropdown adapted from `is-hoverable` (touch-hostile) to click/tap toggle via `data-dropdown`. Removes the double-tap problem on mobile where hover activates on first tap and click on second.
2. **`scripts.js`** — Rewrote dropdown JS: uses `.dropdown-trigger .button` instead of `.dropdown .button` (more precise selector), adds a global document click handler to close any open dropdown when tapping outside. Removed the `focusout` handler (unreliable on touch).
3. **`head.ejs`** — Added `viewport-fit=cover` to the viewport meta tag, required for `env(safe-area-inset-*)` to work on modern phones.
4. **`main.css`** — Four additions:
   - **Safe area padding** on `<body>`: `padding-top/bottom/left/right: env(safe-area-inset-*)` to avoid notches and rounded corners overlapping content.
   - **Touch target sizing** (`@media (pointer: coarse)`): `.button.is-small` gets `min-height: 44px`, `.card-footer-item` gets `min-height: 44px` and vertical centering, `.tag` gets `min-height: 28px` for reliable tap targets.
   - **Hover → active fallback** (`@media (hover: none)`): `.card:hover` and `.project-card:hover` are neutralized on touch; the lift effect moves to `:active` with a smaller `-1px` translate for palm-friendly feedback.
   - **Stage card footer stacking** (≤480px): `.card-footer` switches from `flex-direction: row` to `column` so long action labels (Register Payment, Delete) don't overflow in narrow viewports.
5. **`main.css`** — Fixed broken `.is-hidden-print` (was `@media print` nested inside `.is-hidden-print` — plain-CSS-invalid, only works in SCSS), moved media query outside the selector.

### Detector & Assessment
- **Source context**: Desktop-first (Bulma columns with tablet breakpoints). Hover-dependent dropdowns. No safe area or touch-target consideration.
- **Target contexts**: Mobile web (touch), tablet (mixed), narrow viewports (320px+).
- **Key interactions adapted**: Dropdown hover→click, card hover→tap active, footer row→stacked column.
- **Print adaptation**: Fixed the broken `.is-hidden-print` for future print stylesheet work.

### Session Summary: Layout Spacing Pass (2026-07-20)

### Goal
Fix the monotone spacing, weak hierarchy between sections, and stage card footer density.

### What Was Done

1. **`_stages.ejs`** — Progress label row: replaced nested `columns mb-0` with a single `is-flex is-justify-content-space-between mb-1` flex row, unifying the inconsistent `pb-1`/`pb-2` to a single `is-size-7` span pair. Added `mb-0` to the progress bar below.
2. **`_stages.ejs`** — Stat grid gap bumped from `is-2` (0.5rem) to `is-3` (0.75rem) for label breathing room at `is-size-7`.
3. **`_stages.ejs`** — Delete button in card footer reduced from `.button.is-warning.is-small` to `.button.is-small.is-ghost.has-text-grey` so it recedes behind the primary actions (Register Payment, View).
4. **`_overview-cards.ejs`** — Added `mb-4` to the progress bar for local spacing consistency (surrounding elements use explicit `mb-4`).
5. **`show.ejs`** — Added `mb-4` to the "Overview" section heading for consistent heading-to-cards gap.

### Detector
- Mechanical pre-scan (layout scope) returned empty — no hard anti-patterns detected
- Layout assessment caught 6 spatial issues, all fixed

### Polish Pass

1. **`_overview-cards.ejs`** — Added variance delta indicator:
   - Left card shows a `.tag` between the columns comparison and the progress bar: green "{{amount}} under budget", coral "{{amount}} over budget", or blue "On budget"
   - Delta computed from `estimatedCost - actualCost` with safe `Number()` coercion
   - Right card: removed `<hr>` divider; replaced with `mb-4` spacing on the tag for consistent vertical rhythm
   - `estimated` and `actual` variables hoisted for reuse; `currencyOpts` object deduplicated
   - Switched from `.level.has-text-centered` to `.columns.is-mobile` for left-aligned financial comparison (consistency with rest of app)

2. **`_stats.ejs`** (stage detail) — Same layout switch: `.level` → `.columns.is-mobile` left-aligned, removed `<hr>`, added variance tag

3. **`main.css`** — Added card hover lift:
   - `.card { transition }` + `.card:hover { translateY(-2px) + shadow }` matching existing `.project-card:hover`
   - Makes all `.card` components lift on interaction, consistent with DESIGN.md's key characteristic

4. **`DESIGN.md`** — Added **The No-Centered-Data Rule**, updated Cards / Financial Comparison / Don'ts to enforce left-aligned financial data

5. **Locales** — Added `overview_under_budget`, `overview_over_budget`, `overview_on_budget` keys to both en.json and es.json

### Constraints Respected
- i18n: new key uses `{{value}}` interpolation consistent with existing pattern
- Stage cards still use Bulma `.card` (appropriate for card-list patterns)
- Fonts load from Google Fonts CDN with `display=swap`
- All SVGs already had `aria-hidden="true"` from previous pass
- Delete confirm dialog already in place from previous pass

### Not Changed
- `show.ejs` wrapper — unchanged; just includes the updated partials
- Stage card footer (register payment / view / delete) — kept as-is with existing confirm dialog
- `.is-hidden-print` has a pre-existing plain-CSS nesting bug (not introduced here)
