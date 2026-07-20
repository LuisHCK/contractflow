---
target: Project detail page (src/views/app/projects/show.ejs)
total_score: 24
p0_count: 1
p1_count: 1
timestamp: 2026-07-20T15-29-17Z
slug: src-views-app-projects-show-ejs
---
**Method: dual-agent (A: ses_07fdce51bffec17vwhcnjVQTyB · B: ses_07fdcbccfffeI1FLmWywwXyDCi)**

### Anti-Patterns Verdict

**Fail** — the overview cards section is a textbook identical-card-grid anti-pattern: 4 cards, each with SVG icon + label + value, in a 4-column grid. This violates DESIGN.md's explicit don't-rule. The same pattern is duplicated verbatim in the stage detail stats partial. The rest of the page avoids the other AI tells (no glassmorphism, no gradient text, no side-stripe borders), but the card grid is a clear tell.

**Detector scan:** Empty — no automated technical issues found (no inline styles, no contrast problems detected).

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Stage delete has no confirmation; no loading indicators for async ops |
| 2 | Match System / Real World | 4 | Financial terminology matches business owner mental model |
| 3 | User Control and Freedom | 2 | Stage delete has zero confirmation; no undo anywhere |
| 4 | Consistency and Standards | 3 | Stage detail h1 misuses sans-serif; overview cards are identical when they shouldn't be |
| 5 | Error Prevention | 2 | Stage delete posts immediately — no confirm() unlike project archive which does have it |
| 6 | Recognition Rather Than Recall | 4 | All metrics visibly labeled; breadcrumb gives full context |
| 7 | Flexibility and Efficiency | 1 | Zero keyboard shortcuts, no bulk operations, no customization |
| 8 | Aesthetic and Minimalist Design | 3 | Overview cards are an identical grid; otherwise clean and restrained |
| 9 | Error Recovery | 1 | No undo for any destructive action; no soft-delete or trash |
| 10 | Help and Documentation | 1 | Zero contextual help, tooltips, or documentation cues |
| **Total** | | **24/40** | **Acceptable** |

### Overall Impression

The project detail page has a solid foundation — clean IA (two sections), proper breadcrumbs, restrained color usage, strong budget-first financial display. But it's held back by two major gaps: the identical-card-grid overview that feels templated, and the absence of undo/recovery for financial data operations. The lack of delete confirmation on stages (P0) is the kind of thing that costs real money.

### What's Working

- **Budget-first display** — estimates shown alongside actuals on every financial view, directly delivering on PRODUCT.md's core promise
- **Restrained semantic color** — peach for CTAs, teal for links, green/red for balance — perfectly following The Semantic Restraint Rule
- **Flat-by-default surfaces** with hover-only lift, avoiding gratuitous depth
- **Solid accessibility foundations** — breadcrumb ARIA, form label associations, HTML5 landmarks

### Priority Issues

**P0 — Stage deletion has no confirmation dialog**
- **What:** The delete form in `_stages.ejs:72-77` submits on button click with no `onsubmit` guard. Project archive (`show.ejs:42`) has `return confirm()`, but stage delete doesn't.
- **Why it matters:** One accidental click deletes a stage and all associated payment data — irreversible financial data loss. The inconsistency with the archive pattern makes it worse.
- **Fix:** Add `onsubmit="return confirm(...)"` to the delete form, matching the archive pattern.
- **Suggested command:** /impeccable harden

**P1 — Overview cards are an identical-card-grid anti-pattern**
- **What:** `_overview-cards.ejs` renders 4 cards with identical structure (SVG icon + label + value) in a 4-column grid. The same pattern is duplicated in `_stats.ejs` for stage detail. DESIGN.md explicitly bans this.
- **Why it matters:** Makes the page feel templated and contradicts the brand's precision claim.
- **Fix:** Make Estimated Cost the hero metric with a visual comparison bar. Show Status as a styled tag. Show Total Stages as a compact badge.
- **Suggested command:** /impeccable layout

**P2 — No undo or recovery for any destructive action**
- **What:** Stage delete has no confirm dialog. Archive has a confirm but no undo banner. Soft-delete doesn't exist.
- **Why it matters:** For a financial tool tracking real money, this creates justified anxiety and erodes trust.
- **Fix:** Implement soft-delete with a 30-second undo banner. Or at minimum add consistent confirm() to all destructive actions.
- **Suggested command:** /impeccable harden

**P2 — Hover-only dropdowns are keyboard-inaccessible**
- **What:** The Actions dropdown (`show.ejs:21`) and language switcher (`navigation.ejs:43`) use Bulma's `is-hoverable` — menu appears on hover only, not on focus. Keyboard-only users cannot reach dropdown items.
- **Why it matters:** Blocks keyboard users from editing, archiving, or changing language — core functionality.
- **Fix:** Add focus-within support or use a click-toggle pattern instead of hover-only.
- **Suggested command:** /impeccable adapt

**P3 — SVG icons missing aria-hidden**
- **What:** All 5 SVG icons in `partials/icons/` lack `aria-hidden="true"`. The chevron SVG in the Actions button also lacks it.
- **Fix:** Add `aria-hidden="true"` to all SVG icon includes.
- **Suggested command:** /impeccable harden

**P3 — No loading states for async operations**
- **What:** All templates show static content with no spinners, skeleton screens, or disabled-state indicators for in-progress server operations.
- **Fix:** Add inline spinners to form submit buttons. Add error notification slots for failed operations.
- **Suggested command:** /impeccable harden

### Persona Red Flags

**Jordan (First-Timer)**
- The Actions dropdown trigger is a subtle is-small button with a chevron — a new user may not discover it
- Stage delete has no confirmation — a first-timer could permanently delete data with one click
- No explanation of what Owed vs Balance means — distinct financial concepts, same visual treatment

**Alex (Power User)**
- Zero keyboard shortcuts for frequent actions
- No bulk operations for multi-stage projects
- No export of project financial data to CSV/PDF

**Sam (Accessibility)**
- Archive button uses inline styles stripping native button affordances
- Hover-only dropdowns block keyboard access to edit/archive
- Progress bar only has is-success at 100% — no non-color cue for intermediate states
- Table headers missing scope="col"

### Minor Observations
- Project subtitle uses `<h2 class="subtitle">` — polluting heading outline
- Heading hierarchy skips h3: h1 → h2 → h4
- Stage card footer uses 3 items but Bulma card-footer is designed for 2
- Progress bar is-success only at 100% — 1-99% looks untracked
- Stage detail re-calculates totalPaid via reduce() in template
- Forgot password link uses href="#" — dead link
- Payments table is-narrow may reduce touch targets below 44px on mobile

### Questions to Consider
- Should the Estimated vs Actual cost comparison be visually dominant rather than four equal cards?
- Could stage list use progressive disclosure (show names only, expand on click) for projects with 10+ stages?
- Is the Actions dropdown worth its discoverability cost vs inline buttons?
