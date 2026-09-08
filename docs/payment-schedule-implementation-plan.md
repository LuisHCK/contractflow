# Payment Schedule Implementation Plan

> **STATUS: COMPLETE** — all sections (1–9) implemented.

This document outlines the step-by-step plan to add a **fixed payment schedule** to a stage: the stage's estimated cost is split into a fixed number of equal installments, each due on a recurring date (e.g. "4 payments, one each Saturday").

## Scope & Decisions

- **Attaches to a stage** (one schedule per stage).
- **Plan only** — the schedule is a visual reference. Payments are still registered manually; there is no linking between installments and real payments in v1.
- **Based on the full estimated cost** of the stage.
- **Equal-split only** for v1 (recurring interval + optional weekday). The schema reserves room for deposit / percentage / manual types later via `schedule_type`, `interval`, and `weekday`.

## Deferred (schema-ready, not implemented now)

- Deposit-first, percentage/milestone, and manual installments.
- Payment linking ("mark paid" auto-creates a real payment from an installment).
- Reminders / notifications for upcoming or overdue installments.

---

## 1. Migration — [x] COMPLETE — `migrations/003_payment_schedules.sql`

Create the migration file with two tables:

- `payment_schedules` — one row per stage (`stage_id` unique), a currency snapshot, and the schedule configuration.
- `schedule_installments` — generated rows, one per planned payment.

```sql
-- Fixed payment schedule: a stage's estimated cost split into equal installments

CREATE TABLE IF NOT EXISTS payment_schedules (
    id SERIAL PRIMARY KEY,
    stage_id INTEGER NOT NULL UNIQUE,
    total_amount DOUBLE PRECISION NOT NULL,
    total_amount_base DOUBLE PRECISION NOT NULL,
    display_currency_code TEXT,
    display_currency_symbol TEXT,
    exchange_rate DOUBLE PRECISION NOT NULL DEFAULT 1,
    schedule_type TEXT NOT NULL DEFAULT 'fixed',
    frequency TEXT NOT NULL,
    interval INTEGER NOT NULL DEFAULT 1,
    weekday INTEGER,
    installment_count INTEGER NOT NULL,
    start_date DATE NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY (stage_id) REFERENCES stage(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS schedule_installments (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    amount_base DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY (schedule_id) REFERENCES payment_schedules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schedule_installments_schedule_id
    ON schedule_installments (schedule_id);
```

Notes:
- `weekday` uses ISO 0–6 (0 = Monday … 6 = Sunday). The "every Saturday" example is `weekday = 5` in ISO terms, but confirm the convention used in the code (the plan uses ISO; adjust if the frontend uses Sunday-first).
- `frequency` values: `daily`, `weekly`, `biweekly`, `monthly`.
- `interval` multiplies the frequency step (e.g. `weekly` + `interval 2` = every two weeks) and is kept for future flexibility.

## 2. Queries — [x] COMPLETE — `src/database/queries.js`

Add two query objects following the existing `$1`-parameter style:

```js
export const PAYMENT_SCHEDULES = {
    ADD: `
        INSERT INTO payment_schedules (
            stage_id, total_amount, total_amount_base, display_currency_code,
            display_currency_symbol, exchange_rate, schedule_type, frequency,
            interval, weekday, installment_count, start_date, created_by
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
        RETURNING id;`,

    GET_BY_STAGE: `
        SELECT * FROM payment_schedules
        WHERE stage_id = $1 AND deleted = false
        LIMIT 1;`,

    GET: `
        SELECT * FROM payment_schedules
        WHERE id = $1 AND deleted = false;`,

    SOFT_DELETE: `
        UPDATE payment_schedules
        SET deleted = true
        WHERE id = $1;`
}

export const SCHEDULE_INSTALLMENTS = {
    ADD: `
        INSERT INTO schedule_installments (
            schedule_id, installment_number, due_date, amount, amount_base
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;`,

    GET_BY_SCHEDULE: `
        SELECT * FROM schedule_installments
        WHERE schedule_id = $1 AND deleted = false
        ORDER BY installment_number ASC;`
}
```

## 3. Service — [x] COMPLETE — `src/services/payment-schedules.js`

Create the service module. It depends on `getStageById` (from `./stages`), `getCurrencyOptions` / `toBaseAmount` (from `@/utils/money`), and `formatToISOString` (from `@/utils/date`).

Key functions:

- `generateInstallments(total, count, frequency, weekday, startDate)` — pure helper returning `[{ installmentNumber, dueDate, amount, amountBase }]`.
  - Equal split: each installment = `Math.floor(total * 100 / count) / 100`; the **last installment absorbs the remainder** so the sum is exact (e.g. `$100 ÷ 3` → `33.33 / 33.33 / 33.34`).
  - Dates advance from `startDate` by frequency/interval; for `weekly`/`biweekly` with a `weekday`, the first date snaps to the first occurrence of that weekday on/after `startDate`, then advances by 7/14 days.
- `createSchedule({ stageId, installmentCount, frequency, interval, weekday, startDate, createdBy })` — reads the stage for `estimatedCost` + currency context, generates installments, inserts schedule + installments **in a transaction**. Returns `null` if a schedule already exists for the stage.
- `getScheduleByStage(stageId)` — returns the schedule + its installments, or `null`.
- `deleteScheduleByStage(stageId)` — soft-deletes the schedule.

Validation in `createSchedule`:
- `installmentCount` is a positive integer (`>= 1`).
- `total > 0`.
- `frequency` is one of `daily`, `weekly`, `biweekly`, `monthly`.
- `weekday` is `null` or an integer 0–6.

## 4. Controller — [x] COMPLETE — `src/controllers/payment-schedules.js`

- `create(req, res)`:
  - `POST` → call `createSchedule({ ...body, stageId: params.stageId, createdBy: req.user.id })`, then redirect to `/projects/show/:id/stages/show/:stageId` (or back to the create form on failure).
  - `GET` → load the stage and render the create form (see step 6).
- `destroy(req, res)`:
  - `POST` → call `deleteScheduleByStage(params.stageId)`, redirect back to the stage detail page.

## 5. Routes — [x] COMPLETE — `src/routes/private.js`

Add under the `PAYMENTS` section:

```js
router.get(
    '/projects/show/:id/stages/show/:stageId/schedule/create',
    paymentSchedulesController.create
)
router.post(
    '/projects/show/:id/stages/show/:stageId/schedule/create',
    paymentSchedulesController.create
)
router.post(
    '/projects/show/:id/stages/show/:stageId/schedule/delete',
    paymentSchedulesController.destroy
)
```

Import the new controller at the top of the file.

## 6. Forms — [x] COMPLETE — `src/forms/index.js`

Add `PAYMENT_SCHEDULE_FORM`:

```js
export const PAYMENT_SCHEDULE_FORM = {
    fields: [
        { label: 'payment_schedule_installments', name: 'installmentCount', placeholder: 'payment_schedule_installments_placeholder', required: true, type: 'number' },
        {
            label: 'payment_schedule_frequency', name: 'frequency', type: 'select', required: true,
            options: [
                { label: 'payment_schedule_frequency_daily', value: 'daily' },
                { label: 'payment_schedule_frequency_weekly', value: 'weekly' },
                { label: 'payment_schedule_frequency_biweekly', value: 'biweekly' },
                { label: 'payment_schedule_frequency_monthly', value: 'monthly' }
            ]
        },
        {
            label: 'payment_schedule_weekday', name: 'weekday', type: 'select', required: false,
            options: [
                { label: 'payment_schedule_weekday_monday', value: '0' },
                { label: 'payment_schedule_weekday_tuesday', value: '1' },
                { label: 'payment_schedule_weekday_wednesday', value: '2' },
                { label: 'payment_schedule_weekday_thursday', value: '3' },
                { label: 'payment_schedule_weekday_friday', value: '4' },
                { label: 'payment_schedule_weekday_saturday', value: '5' },
                { label: 'payment_schedule_weekday_sunday', value: '6' }
            ]
        },
        { label: 'payment_schedule_start_date', name: 'startDate', placeholder: 'payment_schedule_start_date_placeholder', required: true, type: 'date', value: new Date().toISOString().split('T')[0] }
    ]
}
```

## 7. Views — [x] COMPLETE

### 7a. Create view — `src/views/app/payment-schedules/create.ejs`

Dedicated form view (reuse `partials/head`, `partials/navigation`, and the `partials/form` rendering pattern) with a **client-side live preview**: a small inline `<script>` (plain JS, in the style of `src/public/scripts.js`) that recomputes the installment dates + amounts as the user changes `installmentCount`, `frequency`, `weekday`, and `startDate`. It reads the stage's `estimatedCost` from a `data-total` attribute so the preview reflects the real total before saving.

The preview table shows `#`, due date, and amount for each planned installment, plus a footer total that must equal the estimated cost.

### 7b. Schedule partial — `src/views/app/stages/partials/_schedule.ejs`

Rendered on the stage detail page, **below the payments table**:

- If no schedule exists → a `notification` with a "Create schedule" button linking to `.../schedule/create`.
- If a schedule exists:
  - A summary header: total amount, installment count, next due date.
  - A table of installments: `#`, due date, amount, and an `overdue` tag when `due_date < today`.
  - A "Delete schedule" action (POST form with CSRF token + `confirm()`).

### 7c. Stage detail — `src/views/app/stages/show.ejs`

Add a new `<section>` after the payments section:

```ejs
<section class="mt-6">
    <h2 class="title is-5 mb-4"><%= __('payment_schedule_title') %></h2>
    <%- include('./partials/_schedule', { schedule, stage, formatToCurrency, __ }) %>
</section>
```

### 7d. Controller wiring — `src/controllers/stages.js`

In `show`, fetch the schedule via `getScheduleByStage(stage.id)` and pass it to the render call.

## 8. i18n — [x] COMPLETE — `locales/en.json` + `locales/es.json`

Add the following keys (English listed; add Spanish equivalents):

- `payment_schedule_title` — "Payment schedule"
- `payment_schedule_create_title` — "Create payment schedule"
- `payment_schedule_no_schedule` — "No payment schedule set for this stage."
- `payment_schedule_create` — "Create schedule"
- `payment_schedule_delete` — "Delete schedule"
- `payment_schedule_delete_confirm` — "Delete this payment schedule? This action cannot be undone."
- `payment_schedule_installments` — "Number of installments"
- `payment_schedule_installments_placeholder` — "e.g. 4"
- `payment_schedule_frequency` — "Frequency"
- `payment_schedule_frequency_daily` / `_weekly` / `_biweekly` / `_monthly`
- `payment_schedule_weekday` — "Day of week"
- `payment_schedule_weekday_monday` … `payment_schedule_weekday_sunday`
- `payment_schedule_start_date` — "First payment date"
- `payment_schedule_start_date_placeholder` — "First payment date"
- `payment_schedule_due_date` — "Due date"
- `payment_schedule_amount` — "Amount"
- `payment_schedule_total` — "Total"
- `payment_schedule_next_due` — "Next due: {{date}}"
- `payment_schedule_overdue` — "Overdue"
- `payment_schedule_preview_title` — "Preview"

## 9. Verification — [x] COMPLETE

- [x] Run the app; the migration `003_payment_schedules.sql` applies automatically on boot.
- [x] Create a schedule for a stage with a total that is not evenly divisible (e.g. `$100` into 3) and confirm the last installment absorbs the remainder (sum equals the total).
- [x] Verify "every Saturday" produces dates that all fall on Saturdays, starting on/after the given start date.
- [x] Confirm a second schedule for the same stage is rejected (unique constraint).
- [x] Confirm the schedule section renders below the payments table, shows "overdue" tags correctly, and the delete action works.
- [x] Confirm both `en` and `es` locales display correctly.

## Notes

- Reuse the existing currency conventions: snapshot `display_currency_code`, `display_currency_symbol`, `exchange_rate`, and store `amount_base` via `toBaseAmount` so the schedule stays consistent with the rest of the app.
- The `schedule_type` column is `'fixed'` for v1; future types (`percentage`, `manual`, `deposit`) can be added without a new migration.
- Keep the create-form preview in plain JS matching `src/public/scripts.js`; do not introduce a frontend framework.
