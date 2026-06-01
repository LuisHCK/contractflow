# Hourly Billing Feature Implementation Plan

This document outlines the complete implementation of hourly billing support for stages. Currently, all stages use fixed-price billing with a required `estimated_cost`. This feature adds support for **hourly billing** where payments are calculated as `hours × rate`.

---

## Table of Contents

1. [Feature Summary](#1-feature-summary)
2. [Database Schema Changes](#2-database-schema-changes)
3. [Query Changes](#3-query-changes)
4. [Service Layer Changes](#4-service-layer-changes)
5. [Controller Changes](#5-controller-changes)
6. [Form Definition Changes](#6-form-definition-changes)
7. [View Changes](#7-view-changes)
8. [i18n Keys](#8-i18n-keys)
9. [Invoice Format Changes](#9-invoice-format-changes)
10. [Validation Rules & Edge Cases](#10-validation-rules--edge-cases)
11. [Testing Checklist](#11-testing-checklist)
12. [Migration Strategy](#12-migration-strategy)
13. [Future Considerations](#13-future-considerations)

---

## 1. Feature Summary

### Billing Types

| Type | Description | Stage Fields | Payment Fields |
|------|-------------|--------------|----------------|
| **Fixed** (default) | Upfront agreed cost | `estimated_cost` (required) | `amount` (required) |
| **Hourly** | Billed by hours worked | `hourly_rate` (required), `estimated_cost` (optional budget) | `hours_worked` (required), `amount` (calculated) |

### Key Decisions

- **Billing type is immutable** after stage creation (prevents report inconsistencies)
- **Amount is calculated-only** for hourly stages: `amount = hours_worked × hourly_rate`
- **Progress** for hourly stages:
  - With estimate: `(total_payments / estimated_cost) × 100`
  - Without estimate: `NULL` (displayed as "N/A")
- **Invoices** show detailed breakdown: "5 hrs × $250/hr = $1,250"
- **Hours must be > 0** for hourly stage payments
- **Hourly rate** follows project currency (no separate currency per stage rate)

---

## 2. Database Schema Changes

### File: `migrations/003_stage_billing_type.sql`

```sql
-- Add billing type support to stages
-- Billing type: 'fixed' (default) or 'hourly'

-- Step 1: Add new columns to stage table
ALTER TABLE stage
    ADD COLUMN IF NOT EXISTS billing_type TEXT NOT NULL DEFAULT 'fixed',
    ADD COLUMN IF NOT EXISTS hourly_rate DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS hourly_rate_base DOUBLE PRECISION;

-- Step 2: Make estimated_cost nullable (required only for fixed stages)
ALTER TABLE stage
    ALTER COLUMN estimated_cost DROP NOT NULL;

-- Step 3: Add hours_worked to payments (required only for hourly stage payments)
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS hours_worked DOUBLE PRECISION;

-- Step 4: Add check constraint for billing type validation
-- Fixed stages: must have estimated_cost
-- Hourly stages: must have hourly_rate
ALTER TABLE stage
    ADD CONSTRAINT chk_stage_billing_type CHECK (
        (billing_type = 'fixed' AND estimated_cost IS NOT NULL) OR
        (billing_type = 'hourly' AND hourly_rate IS NOT NULL)
    );

-- Step 5: Create index for billing_type queries
CREATE INDEX IF NOT EXISTS idx_stage_billing_type ON stage (billing_type);
```

### Schema Summary

**`stage` table additions:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `billing_type` | TEXT | NO | 'fixed' | 'fixed' or 'hourly' |
| `hourly_rate` | DOUBLE PRECISION | YES | NULL | Rate per hour (in project currency) |
| `hourly_rate_base` | DOUBLE PRECISION | YES | NULL | Rate in base currency (for multi-currency) |

**`payments` table additions:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `hours_worked` | DOUBLE PRECISION | YES | NULL | Hours worked (required for hourly stages) |

---

## 3. Query Changes

### File: `src/database/queries.js`

### 3.1 STAGES.ADD

```javascript
ADD: `
    INSERT INTO stage (
        project_id, name, estimated_cost, created_by, start_date, end_date, 
        description, contractor_id, display_currency_code, display_currency_symbol, 
        exchange_rate, estimated_cost_base,
        billing_type, hourly_rate, hourly_rate_base
    ) 
    VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    )
    RETURNING id;`
```

### 3.2 STAGES.UPDATE

```javascript
UPDATE: `
    UPDATE stage
    SET name = $1,
        estimated_cost = $2,
        start_date = $3,
        end_date = $4,
        description = $5,
        contractor_id = $6,
        display_currency_code = $7,
        display_currency_symbol = $8,
        exchange_rate = $9,
        estimated_cost_base = $10,
        hourly_rate = $11,
        hourly_rate_base = $12
    WHERE id = $13
    RETURNING id;`

-- Note: billing_type is NOT updatable after creation
```

### 3.3 STAGES.GET_ALL (progress calculation)

Update to handle NULL progress for hourly stages without estimate:

```javascript
GET_ALL: `
    SELECT s.*, 
        CASE 
            WHEN COALESCE(s.estimated_cost_base, s.estimated_cost, 0) = 0 THEN NULL
            ELSE ROUND(
                ((100.0 * COALESCE(SUM(COALESCE(p.amount_base, p.amount * COALESCE(NULLIF(p.exchange_rate, 0), 1), p.amount)), 0)) 
                / COALESCE(s.estimated_cost_base, s.estimated_cost))::numeric,
                1
            )
        END AS progress,
        COALESCE(SUM(COALESCE(p.amount_base, p.amount * COALESCE(NULLIF(p.exchange_rate, 0), 1), p.amount)), 0) AS total_payments_base,
        COALESCE(SUM(COALESCE(p.amount_base, p.amount * COALESCE(NULLIF(p.exchange_rate, 0), 1), p.amount)), 0) 
            / COALESCE(NULLIF(s.exchange_rate, 0), 1) AS total_payments
    FROM stage s 
    LEFT JOIN payments p ON s.id = p.stage_id AND p.deleted = false
    WHERE s.project_id = $1 AND s.deleted = false
    GROUP BY s.id
    ORDER BY s.id DESC;`
```

### 3.4 PROJECTS.GET_ALL (project totals)

Update the `stage_totals` subquery to handle hourly stages without estimates:

```javascript
-- In stage_totals subquery, replace the SUM with:
SUM(
    CASE 
        WHEN s.estimated_cost_base IS NOT NULL THEN s.estimated_cost_base
        WHEN s.estimated_cost IS NOT NULL THEN s.estimated_cost * COALESCE(NULLIF(s.exchange_rate, 0), 1)
        ELSE COALESCE(
            (SELECT SUM(COALESCE(py.amount_base, py.amount)) 
             FROM payments py 
             WHERE py.stage_id = s.id AND py.deleted = false),
            0
        )
    END
) AS total_estimated_base
```

### 3.5 STAGES.REPORT_SUMMARY

This query also calculates `outstanding_balance_base` using `estimated_cost_base`. Update:

```javascript
-- Replace the outstanding_balance_base expression:
-- Current:
(COALESCE(s.estimated_cost_base, s.estimated_cost) - COALESCE(SUM(...), 0)) AS outstanding_balance_base

-- New:
CASE 
    WHEN COALESCE(s.estimated_cost_base, s.estimated_cost) IS NULL THEN NULL
    ELSE (COALESCE(s.estimated_cost_base, s.estimated_cost) - COALESCE(SUM(COALESCE(py.amount_base, py.amount * COALESCE(NULLIF(py.exchange_rate, 0), 1), py.amount)), 0))
END AS outstanding_balance_base

-- Also update progress_percentage:
CASE 
    WHEN COALESCE(s.estimated_cost_base, s.estimated_cost) IS NULL 
         OR COALESCE(s.estimated_cost_base, s.estimated_cost) = 0 THEN NULL
    ELSE ROUND(
        ((COALESCE(SUM(...), 0) * 100.0) / COALESCE(s.estimated_cost_base, s.estimated_cost))::numeric,
        1
    )
END AS progress_percentage
```

### 3.6 PROJECTS.GET_ALL and PROJECTS.GET (progress)

The project-level `progress` also needs to handle NULL when all stages lack estimates:

```javascript
-- Replace:
CASE WHEN COALESCE(stage_totals.total_estimated_base, 0) = 0 THEN 0

-- With:
CASE WHEN COALESCE(stage_totals.total_estimated_base, 0) = 0 THEN NULL
```

**Note**: Both `PROJECTS.GET_ALL` and `PROJECTS.GET` share this same subquery pattern — update both.

### 3.7 PAYMENTS.ADD

```javascript
ADD: `
    INSERT INTO payments (
        stage_id, amount, date, payer, payment_category_id, contractor_id, 
        description, payment_method, created_by, balance, hide_totals_invoice, 
        display_currency_code, display_currency_symbol, exchange_rate, 
        amount_base, balance_base,
        hours_worked
    ) 
    VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    )
    RETURNING id;`
```

---

## 4. Service Layer Changes

### 4.1 File: `src/services/stages.js`

#### Stage Class Updates

```javascript
export class Stage {
    constructor(stage) {
        // ... existing fields ...
        
        // New fields
        this.billingType = stage.billingType || stage.billing_type || 'fixed'
        this.hourlyRate = stage.hourlyRate || stage.hourly_rate || null
        this.hourlyRateBase = stage.hourlyRateBase || stage.hourly_rate_base || null
    }

    get isHourly() {
        return this.billingType === 'hourly'
    }

    get isFixed() {
        return this.billingType === 'fixed'
    }

    get formattedHourlyRate() {
        if (!this.hourlyRate) return null
        return formatToCurrency(this.hourlyRate, {
            currency: this.displayCurrencyCode,
            symbol: this.displayCurrencySymbol
        })
    }
}
```

#### createStage Updates

```javascript
export const createStage = async (stage) => {
    try {
        const projectCurrency = await resolveProjectCurrencyContext(stage.projectId)
        const billingType = stage.billingType || 'fixed'
        
        // Validate based on billing type
        if (billingType === 'fixed' && !stage.estimatedCost) {
            console.error('Fixed stages require estimatedCost')
            return null
        }
        if (billingType === 'hourly' && !stage.hourlyRate) {
            console.error('Hourly stages require hourlyRate')
            return null
        }

        const estimatedCost = billingType === 'fixed' 
            ? Number(stage.estimatedCost || 0) 
            : (stage.estimatedCost ? Number(stage.estimatedCost) : null)
        const estimatedCostBase = estimatedCost 
            ? toBaseAmount(estimatedCost, projectCurrency.exchangeRate) 
            : null
        
        const hourlyRate = billingType === 'hourly' ? Number(stage.hourlyRate || 0) : null
        const hourlyRateBase = hourlyRate 
            ? toBaseAmount(hourlyRate, projectCurrency.exchangeRate) 
            : null

        const rows = await database.unsafe(STAGES.ADD, [
            stage.projectId,
            stage.name,
            estimatedCost,
            stage.createdBy,
            formatToISOString(stage.startDate),
            formatToISOString(stage.endDate),
            stage.description,
            stage.contractorId,
            projectCurrency.currencyCode,
            projectCurrency.currencySymbol,
            projectCurrency.exchangeRate,
            estimatedCostBase,
            billingType,
            hourlyRate,
            hourlyRateBase
        ])
        
        const id = rows?.[0]?.id
        if (!id) return null
        
        return new Stage({
            id,
            ...stage,
            billingType,
            estimatedCost,
            estimatedCostBase,
            hourlyRate,
            hourlyRateBase,
            displayCurrencyCode: projectCurrency.currencyCode,
            displayCurrencySymbol: projectCurrency.currencySymbol,
            exchangeRate: projectCurrency.exchangeRate
        })
    } catch (error) {
        console.error(`Error creating stage: ${error.message}`)
        return null
    }
}
```

#### updateStage Updates

**Important**: The current `updateStage(id, stage)` signature takes `(id, stage)` — not `(stageId, updates)`. Preserve this signature.

```javascript
export const updateStage = async (id, stage) => {
    try {
        const existingStage = await getStageById(id)
        if (!existingStage?.id) return null

        // billing_type cannot be changed - use existing value
        const billingType = existingStage.billingType

        const projectCurrency = await resolveProjectCurrencyContext(existingStage.projectId)

        // Validate based on billing type
        if (billingType === 'fixed') {
            if (!stage.estimatedCost && !existingStage.estimatedCost) {
                console.error('Fixed stages require estimatedCost')
                return null
            }
        }
        if (billingType === 'hourly') {
            if (!stage.hourlyRate && !existingStage.hourlyRate) {
                console.error('Hourly stages require hourlyRate')
                return null
            }
        }

        // For fixed stages: estimatedCost required
        // For hourly stages: estimatedCost is optional (budget), hourlyRate required
        const estimatedCost = billingType === 'fixed'
            ? Number(stage.estimatedCost || existingStage.estimatedCost || 0)
            : (stage.estimatedCost ? Number(stage.estimatedCost) : null)
        const estimatedCostBase = estimatedCost
            ? toBaseAmount(estimatedCost, projectCurrency.exchangeRate)
            : null

        const hourlyRate = billingType === 'hourly'
            ? Number(stage.hourlyRate || existingStage.hourlyRate || 0)
            : null
        const hourlyRateBase = hourlyRate
            ? toBaseAmount(hourlyRate, projectCurrency.exchangeRate)
            : null

        const rows = await database.unsafe(STAGES.UPDATE, [
            stage.name,
            estimatedCost,
            formatToISOString(stage.startDate),
            formatToISOString(stage.endDate),
            stage.description,
            stage.contractorId,
            projectCurrency.currencyCode,
            projectCurrency.currencySymbol,
            projectCurrency.exchangeRate,
            estimatedCostBase,
            hourlyRate,
            hourlyRateBase,
            id
        ])
        if (!rows || rows.length === 0) return null
        return getStageById(id)
    } catch (error) {
        console.error(`Error updating stage: ${error.message}`)
        return null
    }
}
```

### 4.2 File: `src/services/payments.js`

#### Payment Class Updates

```javascript
export class Payment {
    constructor(payment) {
        // ... existing fields ...
        
        // New field
        this.hoursWorked = payment.hoursWorked || payment.hours_worked || null
    }

    get formattedHoursWorked() {
        if (!this.hoursWorked) return null
        return `${this.hoursWorked} hrs`
    }
}
```

#### createPayment Updates

```javascript
export const createPayment = async (payment = {}) => {
    try {
        const stage = await getStageById(payment.stageId)
        if (!stage?.id || !stage.contractorId) return null

        let paymentAmount
        let hoursWorked = null

        if (stage.isHourly) {
            // Hourly stage: calculate amount from hours
            hoursWorked = Number(payment.hoursWorked || 0)
            if (hoursWorked <= 0) {
                console.error('Hourly stage payments require hours_worked > 0')
                return null
            }
            // Calculate amount: round to 2 decimal places
            paymentAmount = Math.round(hoursWorked * stage.hourlyRate * 100) / 100
        } else {
            // Fixed stage: use provided amount
            paymentAmount = Number(payment.amount || 0)
            if (paymentAmount <= 0) {
                console.error('Fixed stage payments require amount > 0')
                return null
            }
        }

        const paymentExchangeRate = normalizeExchangeRate(stage.exchangeRate || 1)
        const amountBase = toBaseAmount(paymentAmount, paymentExchangeRate)

        // Calculate balance (only meaningful for stages with estimated_cost)
        let balanceBase = 0
        let balance = 0
        if (stage.estimatedCost) {
            const previousPayments = await getAllPayments(payment.stageId)
            const overallPaidAmountBase = previousPayments.reduce(
                (sum, p) => Number(sum) + Number(p.amountBase || toBaseAmount(p.amount, p.exchangeRate || paymentExchangeRate)),
                0
            )
            const currentPaidAmountBase = overallPaidAmountBase + amountBase
            const estimatedCostBase = Number(stage.estimatedCostBase || toBaseAmount(stage.estimatedCost, stage.exchangeRate))
            balanceBase = estimatedCostBase - currentPaidAmountBase
            balance = fromBaseAmount(balanceBase, paymentExchangeRate)
        }

        const rows = await database.unsafe(PAYMENTS.ADD, [
            payment.stageId,
            paymentAmount,
            formatToISOString(payment.date),
            payment.payer,
            payment.paymentCategoryId,
            stage.contractorId,
            payment.description,
            payment.paymentMethod,
            payment.createdBy,
            balance,
            payment.hideTotalsInvoice,
            stage.displayCurrencyCode,
            stage.displayCurrencySymbol,
            paymentExchangeRate,
            amountBase,
            balanceBase,
            hoursWorked
        ])

        const id = rows?.[0]?.id
        if (!id) return null

        return new Payment({
            id,
            stageId: payment.stageId,
            amount: paymentAmount,
            amountBase,
            hoursWorked,
            // ... other fields
        })
    } catch (error) {
        console.error(`Error creating payment: ${error.message}`)
        return null
    }
}
```

#### getStageReportSummary Updates

This function builds the summary for the `print` route. Handle NULL estimated cost and include billing type info:

```javascript
export const getStageReportSummary = async (stageId) => {
    try {
        const rows = await database.unsafe(STAGES.REPORT_SUMMARY, [stageId])
        const summary = rows?.[0]
        if (!summary) return null

        const exchangeRate = normalizeExchangeRate(summary.stage_exchange_rate || 1)
        const stageCurrencyCode = summary.stage_currency_code || summary.project_currency_code || 'USD'
        const stageCurrencySymbol = summary.stage_currency_symbol || summary.project_currency_symbol || null
        
        // Handle NULL estimated_cost for hourly stages
        const estimatedCostBase = summary.estimated_cost_base ? Number(summary.estimated_cost_base) : null
        const totalPaidBase = Number(summary.total_paid_base) || 0
        const outstandingBalanceBase = summary.outstanding_balance_base != null 
            ? Number(summary.outstanding_balance_base) 
            : null

        const estimatedCost = estimatedCostBase ? fromBaseAmount(estimatedCostBase, exchangeRate) : null
        const totalPaid = fromBaseAmount(totalPaidBase, exchangeRate)
        const outstandingBalance = outstandingBalanceBase != null 
            ? fromBaseAmount(outstandingBalanceBase, exchangeRate) 
            : null
        const progress = summary.progress_percentage != null 
            ? Number(summary.progress_percentage) 
            : null

        const formatOptions = getCurrencyOptions({
            displayCurrencyCode: stageCurrencyCode,
            displayCurrencySymbol: stageCurrencySymbol,
            exchangeRate
        })

        // New: billing type fields
        const billingType = summary.billing_type || 'fixed'
        const hourlyRate = summary.hourly_rate ? Number(summary.hourly_rate) : null

        return {
            project: { /* ... unchanged ... */ },
            stage: {
                id: summary.stage_id,
                name: summary.stage_name,
                description: summary.stage_description,
                estimatedCost,
                estimatedCostBase,
                exchangeRate,
                displayCurrencyCode: stageCurrencyCode,
                displayCurrencySymbol: stageCurrencySymbol,
                formattedEstimatedCost: estimatedCost 
                    ? formatToCurrency(estimatedCost, formatOptions) 
                    : null,
                startDate: formatDateValue(summary.stage_start_date),
                endDate: formatDateValue(summary.stage_end_date),
                // New fields:
                billingType,
                hourlyRate,
                formattedHourlyRate: hourlyRate 
                    ? formatToCurrency(hourlyRate, formatOptions) 
                    : null
            },
            totals: {
                totalPaid,
                totalPaidBase,
                formattedTotalPaid: formatToCurrency(totalPaid, formatOptions),
                outstandingBalance,
                outstandingBalanceBase,
                formattedOutstandingBalance: outstandingBalance != null 
                    ? formatToCurrency(outstandingBalance, formatOptions) 
                    : null,
                paymentsCount: summary.payments_count || 0,
                progress
            }
        }
    } catch (error) {
        console.error(`Error fetching stage report summary: ${error.message}`)
        return null
    }
}
```

**REPORT_SUMMARY query must also SELECT** `s.billing_type` and `s.hourly_rate` — add them to the SELECT clause.

**Key change**: When `estimated_cost` is NULL, `outstandingBalance` and `progress` will be NULL. The print view must handle these nulls (see Section 7).

---

## 5. Controller Changes

### 5.1 File: `src/controllers/stages.js`

#### create action

```javascript
export const create = async (req, res) => {
    const FORM_VIEW = 'generic/form-view'
    
    try {
        if (req.method === 'POST') {
            const { body, params } = req
            const billingType = body.billingType || 'fixed'
            
            const stageData = {
                ...body,
                projectId: params.id,
                billingType,
                createdBy: req.user.id
            }

            const stage = await createStage(stageData)
            
            if (stage?.id) {
                req.flash('success', req.__('stages_create_success'))
                return res.redirect(`/projects/show/${params.id}`)
            }

            const contractors = await getAllContractors()
            return res.render(FORM_VIEW, {
                title: req.__('stages_create_title'),
                form: populateForm({
                    form: getStageFormForBillingType(billingType, { contractors }),
                    data: body,
                    error: req.__('stages_create_error')
                })
            })
        }

        // GET: check for billing type query param
        const billingType = req.query.type
        
        // If no type specified, show type selector
        if (!billingType) {
            return res.render('app/stages/select-type', {
                title: req.__('stages_select_type_title'),
                projectId: req.params.id
            })
        }

        const contractors = await getAllContractors()
        const form = getStageFormForBillingType(billingType, {
            contractors: formatOptions({ items: contractors })
        })

        res.render(FORM_VIEW, {
            title: req.__('stages_create_title'),
            form
        })
    } catch (error) {
        console.error(`Error creating stage: ${error.message}`)
        return res.status(500).send('Error creating stage')
    }
}

// Helper function
function getStageFormForBillingType(billingType, options = {}) {
    const baseForm = billingType === 'hourly' ? STAGE_FORM_HOURLY : STAGE_FORM
    return {
        ...baseForm,
        fields: baseForm.fields.map(field => {
            if (field.name === 'contractorId' && options.contractors) {
                return { ...field, options: options.contractors }
            }
            return field
        })
    }
}
```

#### edit action

The current `edit` controller hardcodes `STAGE_FORM`. Must select the correct form based on existing stage's `billingType`:

```javascript
export const edit = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { body, params, query } = req
            const updatedStage = await updateStage(params.stageId, { ...body })

            if (updatedStage?.id) {
                if (query.backto === 'details') {
                    return res.redirect(`/projects/show/${params.id}/stages/show/${params.stageId}`)
                }
                return res.redirect(`/projects/show/${params.id}`)
            }

            res.redirect(`/projects/show/${params.id}/stages/edit/${params.stageId}?error=true`)
            return
        }

        const stage = await getStageById(req.params.stageId)
        if (!stage?.id) {
            return res.status(404).json({ message: 'Stage not found' })
        }

        // Select form based on existing billing type
        const baseForm = stage.isHourly ? STAGE_FORM_HOURLY : STAGE_FORM
        const contractors = await getAllContractors()

        res.render('generic/form-view', {
            form: {
                ...baseForm,
                method: 'POST',
                action: req.params.stageId,
                fields: baseForm.fields.map((field) => {
                    if (field.name === 'contractorId') {
                        return { 
                            ...field, 
                            value: stage.contractorId,
                            options: formatOptions({ items: contractors })
                        }
                    }
                    const value = stage[field.name]
                    return { ...field, value }
                })
            },
            title: req.__('stages_edit_title', { name: stage.name })
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
```

**Key**: The `billingType` hidden field retains the original value, ensuring the service ignores any attempt to change it.

#### show action

```javascript
export const show = async (req, res) => {
    try {
        const { params } = req
        const stage = await getStageById(params.stageId)
        const project = await getProjectById(params.id)
        const payments = await getAllPayments(stage.id, { includeRelated: true })

        if (!stage?.id) {
            return res.status(404).send('Stage not found')
        }

        const currencyOpts = { 
            currency: stage.displayCurrencyCode, 
            symbol: stage.displayCurrencySymbol 
        }
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
        const estimatedCost = Number(stage.estimatedCost || 0)
        
        // For hourly stages without estimate, balance and progress don't apply
        let outstandingBalance = null
        let progress = null
        
        if (estimatedCost > 0) {
            outstandingBalance = estimatedCost - totalPaid
            progress = Math.min(100, Math.round((totalPaid / estimatedCost) * 1000) / 10)
        }

        // Calculate total hours for hourly stages
        const totalHours = stage.isHourly 
            ? payments.reduce((sum, p) => sum + Number(p.hoursWorked || 0), 0)
            : null

        res.render('app/stages/show', { 
            stage, 
            project, 
            payments, 
            currencyOpts, 
            totalPaid, 
            estimatedCost, 
            outstandingBalance, 
            progress,
            totalHours
        })
    } catch (error) {
        console.error(`[StagesController.show] Error: ${error}`)
        return res.status(500).send('Error')
    }
}
```

### 5.2 File: `src/controllers/payments.js`

#### createStagePayment action

```javascript
export const createStagePayment = async (req, res) => {
    try {
        const { params } = req
        const stage = await getStageById(params.stageId)
        
        if (!stage?.id) {
            return res.status(404).send('Stage not found')
        }

        if (req.method === 'POST') {
            const { body } = req
            
            // For hourly stages, validate hours
            if (stage.isHourly && !body.hoursWorked) {
                const form = await buildPaymentForm(stage)
                return res.render('generic/form-view', {
                    title: req.__('payments_create_title'),
                    form: populateForm({
                        form,
                        data: body,
                        error: req.__('payments_hours_required')
                    }),
                    stage
                })
            }

            const paymentData = {
                ...body,
                stageId: params.stageId,
                hideTotalsInvoice: body.hideTotalsInvoice === 'on',
                createdBy: req.user.id
            }

            const payment = await createPayment(paymentData)

            if (payment?.id) {
                req.flash('success', req.__('payments_create_success'))
                return res.redirect(`/projects/show/${params.id}/stages/show/${params.stageId}`)
            }

            const form = await buildPaymentForm(stage)
            return res.render('generic/form-view', {
                title: req.__('payments_create_title'),
                form: populateForm({
                    form,
                    data: body,
                    error: req.__('payments_create_error')
                }),
                stage
            })
        }

        // GET: render form based on stage billing type
        const form = await buildPaymentForm(stage)
        res.render('generic/form-view', {
            title: req.__('payments_create_title'),
            form,
            stage
        })
    } catch (error) {
        console.error(`Error creating payment: ${error.message}`)
        return res.status(500).send('Error')
    }
}

// Helper function
async function buildPaymentForm(stage) {
    const paymentCategories = await getAllPaymentCategories()
    const stageContractor = stage.contractorId 
        ? await getContractorById(stage.contractorId) 
        : null
    
    const baseForm = stage.isHourly ? PAYMENT_FORM_HOURLY : PAYMENT_FORM
    
    return {
        ...baseForm,
        fields: baseForm.fields.map(field => {
            if (field.name === 'contractorId' && stageContractor) {
                return { 
                    ...field, 
                    options: [{ value: stageContractor.id, label: stageContractor.name }],
                    value: stageContractor.id
                }
            }
            if (field.name === 'paymentCategoryId') {
                return { 
                    ...field, 
                    options: formatOptions({ items: paymentCategories }) 
                }
            }
            return field
        }),
        // Include stage info for hourly rate display
        meta: stage.isHourly ? {
            hourlyRate: stage.hourlyRate,
            formattedHourlyRate: stage.formattedHourlyRate
        } : null
    }
}
```

---

## 6. Form Definition Changes

### File: `src/forms/index.js`

#### Updated STAGE_FORM (add hidden billingType)

```javascript
export const STAGE_FORM = {
    fields: [
        {
            name: 'billingType',
            type: 'hidden',
            value: 'fixed'
        },
        {
            label: 'stages_name',
            name: 'name',
            placeholder: 'stages_create_name_placeholder',
            required: true
        },
        {
            label: 'stages_estimated_cost',
            name: 'estimatedCost',
            placeholder: 'stages_create_estimated_cost_placeholder',
            required: true,
            type: 'number'
        },
        // ... rest of existing fields unchanged
    ]
}
```

#### New Form: STAGE_FORM_HOURLY

```javascript
export const STAGE_FORM_HOURLY = {
    fields: [
        {
            name: 'billingType',
            type: 'hidden',
            value: 'hourly'
        },
        {
            label: 'stages_name',
            name: 'name',
            placeholder: 'stages_create_name_placeholder',
            required: true
        },
        {
            label: 'stages_hourly_rate',
            name: 'hourlyRate',
            placeholder: 'stages_hourly_rate_placeholder',
            required: true,
            type: 'number',
            step: '0.01',
            min: '0.01'
        },
        {
            label: 'stages_estimated_cost',
            name: 'estimatedCost',
            placeholder: 'stages_estimated_budget_placeholder',
            hint: 'stages_estimated_budget_hint',
            required: false,
            type: 'number'
        },
        {
            label: 'stages_create_start_date',
            name: 'startDate',
            placeholder: 'stages_create_start_date_placeholder',
            required: true,
            type: 'date'
        },
        {
            label: 'stages_create_end_date',
            name: 'endDate',
            placeholder: 'stages_create_end_date_placeholder',
            type: 'date'
        },
        {
            label: 'stages_create_description',
            name: 'description',
            placeholder: 'stages_create_description_placeholder',
            required: true,
            type: 'textarea'
        },
        {
            label: 'contractor_name',
            name: 'contractorId',
            placeholder: 'payments_create_contractor_placeholder',
            required: true,
            type: 'select',
            options: [],
            showCreateOption: true,
            createOptionLabel: 'stages_create_new_contractor',
            createOptionPath: '/contractors/create',
            optionsSource: '/contractors'
        }
    ]
}
```

#### New Form: PAYMENT_FORM_HOURLY

```javascript
export const PAYMENT_FORM_HOURLY = {
    fields: [
        {
            label: 'payments_hours_worked',
            name: 'hoursWorked',
            placeholder: 'payments_hours_worked_placeholder',
            required: true,
            type: 'number',
            step: '0.25',
            min: '0.25'
        },
        // Note: 'amount' field is NOT included - it's calculated
        {
            label: 'payments_create_date',
            name: 'date',
            placeholder: 'payments_create_date_placeholder',
            required: true,
            type: 'date',
            value: new Date().toISOString().split('T')[0]
        },
        {
            label: 'payments_create_payer',
            name: 'payer',
            placeholder: 'payments_create_payer_placeholder',
            required: true
        },
        {
            label: 'contractor_name',
            name: 'contractorId',
            placeholder: 'payments_create_contractor_placeholder',
            required: false,
            type: 'select',
            options: [],
            disabled: true
        },
        {
            label: 'payment_category',
            name: 'paymentCategoryId',
            placeholder: 'payments_create_category_placeholder',
            required: true,
            type: 'select',
            options: []
        },
        {
            label: 'payments_create_description',
            name: 'description',
            placeholder: 'payments_create_description_placeholder',
            required: false,
            type: 'textarea'
        },
        {
            label: 'payments_create_payment_method',
            name: 'paymentMethod',
            placeholder: 'payments_create_payment_method_placeholder',
            required: true
        },
        {
            label: 'payments_create_hide_totals',
            name: 'hideTotalsInvoice',
            type: 'checkbox'
        }
    ]
}
```

---

## 7. View Changes

### 7.1 Stage Type Selector

**New file: `src/views/app/stages/select-type.ejs`**

```ejs
<!DOCTYPE html>
<html lang="<%= locale %>" data-theme="<%= locals.theme || 'light' %>">
<%- include('../../partials/head', { title }) %>

<body>
    <%- include('../../partials/navigation') %>
    <%- include('../../partials/flash-messages') %>

    <main class="container is-max-widescreen py-6 px-4">
        <h1 class="title is-3"><%= __('stages_select_type_title') %></h1>
        <p class="subtitle"><%= __('stages_select_type_description') %></p>

        <div class="columns mt-5">
            <div class="column is-6">
                <div class="box has-text-centered" style="height: 100%">
                    <span class="icon is-large has-text-primary">
                        <i class="fas fa-dollar-sign fa-3x"></i>
                    </span>
                    <h3 class="title is-4 mt-4"><%= __('stages_type_fixed') %></h3>
                    <p class="mb-4"><%= __('stages_type_fixed_description') %></p>
                    <a href="?type=fixed" class="button is-primary is-medium">
                        <%= __('stages_select_fixed') %>
                    </a>
                </div>
            </div>
            <div class="column is-6">
                <div class="box has-text-centered" style="height: 100%">
                    <span class="icon is-large has-text-info">
                        <i class="fas fa-clock fa-3x"></i>
                    </span>
                    <h3 class="title is-4 mt-4"><%= __('stages_type_hourly') %></h3>
                    <p class="mb-4"><%= __('stages_type_hourly_description') %></p>
                    <a href="?type=hourly" class="button is-info is-medium">
                        <%= __('stages_select_hourly') %>
                    </a>
                </div>
            </div>
        </div>

        <div class="mt-5">
            <a href="/projects/show/<%= projectId %>" class="button is-light">
                <%= __('cancel') %>
            </a>
        </div>
    </main>
</body>
</html>
```

### 7.2 Stage Show - Conditional Summary Cards

**Update: `src/views/app/stages/show.ejs`**

Replace the summary cards section with conditional display:

```ejs
<!-- Summary cards -->
<section class="mb-5">
    <div class="columns is-multiline">
        <% if (stage.isHourly) { %>
            <!-- Hourly Rate Card -->
            <div class="column is-12-mobile is-6-tablet is-3-desktop">
                <div class="box">
                    <p class="heading"><%= __('stages_hourly_rate') %></p>
                    <p class="title is-4"><%= stage.formattedHourlyRate %>/hr</p>
                </div>
            </div>
            <!-- Total Hours Card -->
            <div class="column is-12-mobile is-6-tablet is-3-desktop">
                <div class="box">
                    <p class="heading"><%= __('stages_total_hours') %></p>
                    <p class="title is-4"><%= totalHours || 0 %> hrs</p>
                </div>
            </div>
        <% } else { %>
            <!-- Estimated Budget Card (fixed only) -->
            <div class="column is-12-mobile is-6-tablet is-3-desktop">
                <div class="box">
                    <p class="heading"><%= __('estimated_budget') %></p>
                    <p class="title is-4"><%= formatToCurrency(estimatedCost, currencyOpts) %></p>
                    <p class="is-size-7 has-text-grey mt-2">
                        <%= __('stages_report_stage_dates') %>:
                        <span><%= stage.startDate || __('stages_report_not_defined') %></span>
                        <span> - </span>
                        <span><%= stage.endDate || __('stages_report_not_defined') %></span>
                    </p>
                </div>
            </div>
        <% } %>

        <!-- Total Paid Card (both types) -->
        <div class="column is-12-mobile is-6-tablet is-3-desktop">
            <div class="box">
                <p class="heading"><%= __('invoice_total_amount') %></p>
                <p class="title is-4"><%= formatToCurrency(totalPaid, currencyOpts) %></p>
                <p class="is-size-7 has-text-grey mt-2">
                    <%= __('payments_count') %>: <%= payments.length %>
                </p>
            </div>
        </div>

        <% if (estimatedCost > 0) { %>
            <!-- Balance Card (only if estimate exists) -->
            <div class="column is-12-mobile is-6-tablet is-3-desktop">
                <div class="box">
                    <p class="heading"><%= __('balance') %></p>
                    <p class="title is-4 <%= outstandingBalance > 0 ? 'has-text-danger' : 'has-text-success' %>">
                        <%= formatToCurrency(outstandingBalance, currencyOpts) %>
                    </p>
                    <p class="is-size-7 has-text-grey mt-2">
                        <%= __('payments_balance_hint') %>
                    </p>
                </div>
            </div>
            <!-- Progress Card (only if estimate exists) -->
            <div class="column is-12-mobile is-6-tablet is-3-desktop">
                <div class="box">
                    <p class="heading"><%= __('progress') %></p>
                    <p class="title is-4"><%= progress %>%</p>
                    <progress class="progress is-success mt-2" value="<%= progress %>" max="100"></progress>
                </div>
            </div>
        <% } else if (stage.isHourly) { %>
            <!-- No Budget Notice for hourly without estimate -->
            <div class="column is-12-mobile is-6-tablet is-6-desktop">
                <div class="box">
                    <p class="heading"><%= __('budget_status') %></p>
                    <p class="title is-5 has-text-grey"><%= __('stages_no_budget_set') %></p>
                    <p class="is-size-7 has-text-grey mt-2">
                        <%= __('stages_no_budget_hint') %>
                    </p>
                </div>
            </div>
        <% } %>
    </div>
</section>
```

### 7.3 Payment Table - Show Hours Column for Hourly Stages

In the payments table section of `show.ejs`:

```ejs
<table class="table is-fullwidth is-striped">
    <thead>
        <tr>
            <th><%= __('payments_create_date') %></th>
            <% if (stage.isHourly) { %>
                <th><%= __('payments_hours') %></th>
                <th><%= __('payments_rate') %></th>
            <% } %>
            <th><%= __('payments_amount') %></th>
            <th><%= __('payments_create_payer') %></th>
            <th><%= __('actions') %></th>
        </tr>
    </thead>
    <tbody>
        <% payments.forEach(payment => { %>
            <tr>
                <td><%= formatDate(payment.date) %></td>
                <% if (stage.isHourly) { %>
                    <td><%= payment.hoursWorked %> hrs</td>
                    <td><%= stage.formattedHourlyRate %>/hr</td>
                <% } %>
                <td>
                    <span class="tag is-primary">
                        <%= formatToCurrency(payment.amount, currencyOpts) %>
                    </span>
                </td>
                <td><%= payment.payer %></td>
                <td>
                    <a href="payments/show/<%= payment.id %>" class="button is-small">
                        <%= __('view') %>
                    </a>
                </td>
            </tr>
        <% }) %>
    </tbody>
</table>
```

### 7.4 Payment Create - Hourly Rate Notice and Live Calculation

When rendering the payment form for hourly stages, add this before the form:

```ejs
<% if (stage && stage.isHourly) { %>
    <div class="notification is-info is-light mb-4">
        <strong><%= __('payments_hourly_rate_notice') %>:</strong>
        <%= stage.formattedHourlyRate %>/hr
    </div>
    
    <!-- Live calculation display -->
    <div class="field" id="calculated-amount-container" style="display: none;">
        <label class="label"><%= __('payments_calculated_amount') %></label>
        <p class="is-size-4 has-text-weight-bold" id="calculatedAmount">$0.00</p>
    </div>
<% } %>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const hoursInput = document.querySelector('input[name="hoursWorked"]')
    const container = document.getElementById('calculated-amount-container')
    const display = document.getElementById('calculatedAmount')
    
    if (hoursInput && container && display) {
        const rate = <%= stage?.hourlyRate || 0 %>
        const currencyCode = '<%= stage?.displayCurrencyCode || "USD" %>'
        
        hoursInput.addEventListener('input', function() {
            const hours = parseFloat(this.value) || 0
            const amount = hours * rate
            
            display.textContent = new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: currencyCode 
            }).format(amount)
            
            container.style.display = hours > 0 ? 'block' : 'none'
        })
    }
})
</script>
```

### 7.5 Project List - Handle NULL Progress

**Update: `src/views/app/projects/partials/_list.ejs`**

```ejs
<% if (project.progress !== null && project.progress !== undefined) { %>
    <div class="column pb-1"><%= __('progress') %></div>
    <div class="column pb-1 has-text-right">
        <%= project.progress %>%
    </div>
    <progress class="progress is-small" value="<%= project.progress %>" max="100">
        <%= project.progress %>%
    </progress>
<% } else { %>
    <div class="column pb-1"><%= __('progress') %></div>
    <div class="column pb-1 has-text-right has-text-grey">
        <%= __('progress_not_applicable') %>
    </div>
<% } %>
```

### 7.6 Stage Print Report - Handle NULL Values

**Update: `src/views/app/stages/print.ejs`**

The print view displays summary cards with `stage.formattedEstimatedCost`, `totals.outstandingBalance`, and `totals.progress`. For hourly stages without an estimate, these will be NULL.

```ejs
<!-- Replace the estimated_budget card with conditional: -->
<% if (stage.estimatedCost) { %>
    <div class="column is-12-mobile is-6-tablet is-3-desktop">
        <div class="box">
            <p class="heading"><%= __('estimated_budget') %></p>
            <p class="title is-4"><%= stage.formattedEstimatedCost %></p>
        </div>
    </div>
<% } else { %>
    <div class="column is-12-mobile is-6-tablet is-3-desktop">
        <div class="box">
            <p class="heading"><%= __('stages_hourly_rate') %></p>
            <p class="title is-4"><%= stage.formattedHourlyRate %>/hr</p>
        </div>
    </div>
<% } %>

<!-- Replace the balance card: -->
<% if (totals.outstandingBalance !== null) { %>
    <div class="column is-12-mobile is-6-tablet is-3-desktop">
        <div class="box">
            <p class="heading"><%= __('balance') %></p>
            <p class="title is-4 <%= totals.outstandingBalance > 0 ? 'has-text-danger' : 'has-text-success' %>">
                <%= totals.formattedOutstandingBalance %>
            </p>
        </div>
    </div>
<% } %>

<!-- Replace the progress card: -->
<% if (totals.progress !== null) { %>
    <div class="column is-12-mobile is-6-tablet is-3-desktop">
        <div class="box">
            <p class="heading"><%= __('progress') %></p>
            <p class="title is-4"><%= totals.progress %>%</p>
            <progress class="progress is-success mt-2" value="<%= totals.progress %>" max="100"></progress>
        </div>
    </div>
<% } %>
```

Also add hours column to the payments table in this view for hourly stages:

```ejs
<!-- Add to table header (after payment_method): -->
<% if (stage.billingType === 'hourly') { %>
    <th><%= __('payments_hours') %></th>
<% } %>

<!-- Add to table body rows: -->
<% if (stage.billingType === 'hourly') { %>
    <td><%= payment.hoursWorked ? `${payment.hoursWorked} hrs` : '-' %></td>
<% } %>
```

**Note**: The `stage` object passed to print comes from `getStageReportSummary` — it must include `billingType`, `hourlyRate`, and `formattedHourlyRate`. Update the summary builder in Section 4 accordingly.

### 7.7 Stage Stats Partial

**Update: `src/views/app/stages/partials/_stats.ejs`**

This partial computes `totalDue = Math.max(0, estimatedCost - totalPaid)`. For hourly stages without estimate, `estimatedCost` is `null` / `0`:

```ejs
<%
    const currencyOpts = { currency: stage.displayCurrencyCode, symbol: stage.displayCurrencySymbol }
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const totalDue = stage.estimatedCost 
        ? Math.max(0, Number(stage.estimatedCost) - totalPaid) 
        : null
    const totalHours = stage.billingType === 'hourly'
        ? payments.reduce((sum, p) => sum + Number(p.hoursWorked || 0), 0)
        : null
%>
```

Update the "Estimated Budget" card to conditionally show hourly rate instead:

```ejs
<% if (stage.billingType === 'hourly') { %>
    <!-- Show hourly rate instead of estimated budget -->
    <p class="title is-6 mb-1"><%= __('stages_hourly_rate') %></p>
    <p class="subtitle is-5 mb-0"><%= stage.formattedHourlyRate %>/hr</p>
<% } else { %>
    <p class="title is-6 mb-1"><%= __('estimated_budget') %></p>
    <p class="subtitle is-5 mb-0"><%= formatToCurrency(stage.estimatedCost, currencyOpts) %></p>
<% } %>
```

### 7.8 Admin Deleted Elements

**Update: `src/views/app/admin/partials/_deleted-elements.ejs`**

This view displays `stage.estimated_cost` for deleted stages. Wrap with a null check:

```ejs
<td>
    <%= stage.estimated_cost 
        ? formatToCurrency(stage.estimated_cost) 
        : (stage.hourly_rate ? `${formatToCurrency(stage.hourly_rate)}/hr` : '-') 
    %>
</td>
```

---

## 8. i18n Keys

### File: `locales/en.json` (additions)

```json
{
    "stages_billing_type": "Billing Type",
    "stages_select_type_title": "Select Stage Type",
    "stages_select_type_description": "Choose how this stage will be billed",
    "stages_type_fixed": "Fixed Price",
    "stages_type_hourly": "Hourly Rate",
    "stages_type_fixed_description": "Set a fixed total cost for this stage upfront. Best for well-defined scope.",
    "stages_type_hourly_description": "Bill by hours worked at a specified rate. Best for flexible or ongoing work.",
    "stages_select_fixed": "Create Fixed Stage",
    "stages_select_hourly": "Create Hourly Stage",
    
    "stages_hourly_rate": "Hourly Rate",
    "stages_hourly_rate_placeholder": "Enter rate per hour",
    "stages_estimated_budget_placeholder": "Optional budget estimate",
    "stages_estimated_budget_hint": "Optional. Used for progress tracking if set.",
    "stages_total_hours": "Total Hours",
    "stages_no_budget_set": "No budget defined",
    "stages_no_budget_hint": "Set an estimated cost to track progress",
    "budget_status": "Budget Status",
    
    "payments_hours_worked": "Hours Worked",
    "payments_hours_worked_placeholder": "Enter hours worked",
    "payments_hours": "Hours",
    "payments_rate": "Rate",
    "payments_calculated_amount": "Calculated Amount",
    "payments_hourly_rate_notice": "This stage bills at",
    "payments_hours_required": "Hours worked is required for hourly stages",
    
    "progress_not_applicable": "N/A",
    
    "invoice_hours_detail": "{{hours}} hrs × {{rate}}/hr"
}
```

### File: `locales/es.json` (additions)

```json
{
    "stages_billing_type": "Tipo de Facturación",
    "stages_select_type_title": "Seleccionar Tipo de Etapa",
    "stages_select_type_description": "Elija cómo se facturará esta etapa",
    "stages_type_fixed": "Precio Fijo",
    "stages_type_hourly": "Por Horas",
    "stages_type_fixed_description": "Establece un costo total fijo para esta etapa. Ideal para alcance bien definido.",
    "stages_type_hourly_description": "Factura por horas trabajadas a una tarifa especificada. Ideal para trabajo flexible.",
    "stages_select_fixed": "Crear Etapa Fija",
    "stages_select_hourly": "Crear Etapa por Horas",
    
    "stages_hourly_rate": "Tarifa por Hora",
    "stages_hourly_rate_placeholder": "Ingrese tarifa por hora",
    "stages_estimated_budget_placeholder": "Presupuesto estimado (opcional)",
    "stages_estimated_budget_hint": "Opcional. Se usa para seguimiento de progreso.",
    "stages_total_hours": "Horas Totales",
    "stages_no_budget_set": "Sin presupuesto definido",
    "stages_no_budget_hint": "Establezca un costo estimado para seguir el progreso",
    "budget_status": "Estado del Presupuesto",
    
    "payments_hours_worked": "Horas Trabajadas",
    "payments_hours_worked_placeholder": "Ingrese horas trabajadas",
    "payments_hours": "Horas",
    "payments_rate": "Tarifa",
    "payments_calculated_amount": "Monto Calculado",
    "payments_hourly_rate_notice": "Esta etapa factura a",
    "payments_hours_required": "Las horas trabajadas son requeridas para etapas por hora",
    
    "progress_not_applicable": "N/A",
    
    "invoice_hours_detail": "{{hours}} hrs × {{rate}}/hr"
}
```

---

## 9. Invoice Format Changes

### All Invoice Formats

Update all three invoice templates to show hours breakdown for hourly stage payments.

**File: `src/views/app/payments/formats/standard.ejs`**

Add hours detail after amount line:

```ejs
<div>
    <b><%= __('invoice_amount') %></b>
    <span class="is-underlined">
        <%= utils.formatToCurrency(payment.amount, utils.paymentCurrencyOptions) %>
    </span>
</div>

<% if (payment.hoursWorked) { %>
<div>
    <b><%= __('payments_hours') %></b>
    <span class="is-underlined">
        <%= __('invoice_hours_detail', { 
            hours: payment.hoursWorked, 
            rate: stage.formattedHourlyRate 
        }) %>
    </span>
</div>
<% } %>
```

Update the table section:

```ejs
<table class="table is-bordered is-narrow is-dark-bordered span-col">
    <tbody>
        <% if (payment.hoursWorked) { %>
        <tr>
            <td><%= __('payments_hours') %></td>
            <td><%= payment.hoursWorked %> hrs × <%= stage.formattedHourlyRate %>/hr</td>
        </tr>
        <% } %>
        
        <tr>
            <td><%= __('invoice_this_payment') %></td>
            <td><%= utils.formatToCurrency(payment.amount, utils.paymentCurrencyOptions) %></td>
        </tr>

        <% if (!payment.hideTotalsInvoice && stage.estimatedCost) { %>
        <tr>
            <td><%= __('invoice_acc_amount') %></td>
            <td><%= utils.formatToCurrency(stage.estimatedCost, utils.stageCurrencyOptions) %></td>
        </tr>
        <tr>
            <td><%= __('invoice_balance_due') %></td>
            <td><%= utils.formatToCurrency(payment.balance, utils.paymentCurrencyOptions) %></td>
        </tr>
        <% } %>
    </tbody>
</table>
```

Apply similar changes to:
- `src/views/app/payments/formats/letter.ejs`
- `src/views/app/payments/formats/thermal.ejs`

---

## 10. Validation Rules & Edge Cases

### 10.1 Stage Creation Validation

| Rule | Condition | Error Key |
|------|-----------|-----------|
| Fixed requires estimate | `billing_type = 'fixed' AND estimated_cost IS NULL` | `stages_error_estimate_required` |
| Hourly requires rate | `billing_type = 'hourly' AND hourly_rate IS NULL` | `stages_error_rate_required` |
| Rate must be positive | `hourly_rate <= 0` | `stages_error_rate_positive` |
| Estimate must be positive | `estimated_cost <= 0` (when provided) | `stages_error_estimate_positive` |

### 10.2 Stage Update Validation

| Rule | Condition | Action |
|------|-----------|--------|
| Billing type immutable | `billing_type` in update payload | Ignore / strip field |
| Fixed requires estimate | Same as creation | Return error |
| Hourly rate editable | Allow changes | Warn if payments exist |

### 10.3 Payment Creation Validation

| Rule | Condition | Error Key |
|------|-----------|-----------|
| Hourly requires hours | `stage.billing_type = 'hourly' AND hours_worked IS NULL` | `payments_hours_required` |
| Hours must be positive | `hours_worked <= 0` | `payments_error_hours_positive` |
| Fixed requires amount | `stage.billing_type = 'fixed' AND amount IS NULL` | `payments_error_amount_required` |
| Amount must be positive | `amount <= 0` (for fixed) | `payments_error_amount_positive` |

### 10.4 Edge Cases Matrix

| Scenario | Expected Behavior |
|----------|-------------------|
| Hourly stage, no estimate, view progress | Display "N/A" |
| Hourly stage, estimate set, payments > estimate | Allow, progress > 100%, no warning |
| Hours = 0.25 (15 minutes) | Allow (step="0.25" in form) |
| Payment amount rounding | `Math.round(hours * rate * 100) / 100` |
| Changing hourly rate after payments | Allow, existing payments unchanged, new payments use new rate |
| Deleting hourly stage payment | Hours total recalculated |
| Soft-deleted payments | Excluded from totals (existing behavior) |
| Project totals with mixed stage types | Sum estimates + actuals for hourly without estimate |

### 10.5 Hourly Rate Changes Decision

**Implemented behavior**: 
- Allow rate changes at any time
- Existing payments keep their recorded `amount` (calculated at creation time)
- New payments use the new rate
- No retroactive recalculation

**Optional future enhancement**: 
- Show warning when editing rate if payments exist
- Track rate change history

---

## 11. Testing Checklist

### 11.1 Migration Tests

- [ ] Run migration on empty database - no errors
- [ ] Run migration on database with existing stages - all become 'fixed'
- [ ] Verify CHECK constraint prevents NULL `estimated_cost` for fixed stages
- [ ] Verify CHECK constraint allows NULL `estimated_cost` for hourly stages
- [ ] Verify index created on `billing_type`

### 11.2 Stage CRUD Tests

- [ ] Create fixed stage with `estimated_cost` → success
- [ ] Create fixed stage without `estimated_cost` → validation error
- [ ] Create hourly stage with `hourly_rate` → success
- [ ] Create hourly stage without `hourly_rate` → validation error
- [ ] Create hourly stage with optional `estimated_cost` → success
- [ ] Edit fixed stage → cannot change `billing_type`
- [ ] Edit hourly stage → can update `hourly_rate`
- [ ] Edit hourly stage → can add/update `estimated_cost`
- [ ] Delete stage → soft delete works for both types

### 11.3 Payment CRUD Tests

- [ ] Create payment for fixed stage with amount → success
- [ ] Create payment for fixed stage without amount → validation error
- [ ] Create payment for hourly stage with hours → success, amount calculated correctly
- [ ] Create payment for hourly stage without hours → validation error
- [ ] Create payment for hourly stage with 0 hours → validation error
- [ ] Verify `amount = hours_worked × hourly_rate` calculation
- [ ] Verify `hours_worked` stored in database
- [ ] Delete payment → soft delete, totals update

### 11.4 View Tests

- [ ] Stage type selector shows two options
- [ ] Fixed stage form shows `estimated_cost` as required
- [ ] Hourly stage form shows `hourly_rate` as required, `estimated_cost` as optional
- [ ] Stage show page: fixed shows estimate/balance/progress cards
- [ ] Stage show page: hourly shows rate/hours cards
- [ ] Stage show page: hourly without estimate shows "No budget" card
- [ ] Payment form: fixed shows amount field
- [ ] Payment form: hourly shows hours field with live calculation
- [ ] Payment table: hourly stage shows hours column
- [ ] Project list: progress shows "N/A" for mixed projects with hourly stages without estimates

### 11.5 Invoice Tests

- [ ] Invoice for fixed payment shows standard format
- [ ] Invoice for hourly payment shows hours breakdown
- [ ] Invoice thermal format works for hourly
- [ ] Invoice letter format works for hourly

### 11.6 Report/Query Tests

- [ ] Project totals include hourly stages correctly
- [ ] Stage progress = NULL when hourly without estimate
- [ ] Stage progress calculated correctly when hourly with estimate
- [ ] Multi-currency: `hourly_rate_base` calculated correctly

---

## 12. Migration Strategy

### 12.1 Backward Compatibility

- All existing stages automatically get `billing_type = 'fixed'` (via DEFAULT)
- All existing payments have `hours_worked = NULL` (correct for fixed stages)
- No data migration script required beyond schema changes
- All existing functionality continues to work unchanged

### 12.2 Deployment Steps

1. **Backup database** (production safety)
2. **Deploy migration** `003_stage_billing_type.sql`
3. **Deploy code changes** (services, controllers, forms, views)
4. **Deploy i18n updates** (both locale files)
5. **Test in staging** with existing data + new hourly stages
6. **Deploy to production**

### 12.3 Rollback Plan

If critical issues arise after deployment:

```sql
-- Emergency rollback (keeps columns, removes constraint)
ALTER TABLE stage DROP CONSTRAINT IF EXISTS chk_stage_billing_type;

-- Code rollback: revert to previous version
-- Data: new hourly stages would need manual review
```

**Note**: Full column removal not recommended as it would lose any hourly stage data created.

---

## 13. Future Considerations

### Noted for Later Implementation

1. **Refunds Feature** (noted during planning)
   - Negative payments or separate refund table?
   - How refunds affect balance calculations
   - Invoice format for refunds

2. **Rate Change History**
   - Track when `hourly_rate` changed
   - Show rate at time of each payment on reports

3. **Time Tracking Integration**
   - Import hours from external system
   - Start/stop timer in app
   - Automatic daily/weekly submissions

4. **Budget Alerts**
   - Notify when hourly stage approaching estimate
   - Configurable thresholds (75%, 90%, 100%)

5. **Blended Rates**
   - Different rates for different work types within a stage
   - Rate tiers (e.g., regular vs overtime)

6. **Batch Hour Entry**
   - Enter multiple days/weeks of hours at once
   - Timesheet-style interface

---

## Implementation Order

### Phase 1: Database & Backend (Estimated: 4-6 hours)

- [ ] Create migration file `migrations/003_stage_billing_type.sql`
- [ ] Update `src/database/queries.js` (STAGES.ADD, UPDATE, GET_ALL, REPORT_SUMMARY; PAYMENTS.ADD; PROJECTS.GET_ALL, PROJECTS.GET)
- [ ] Update `src/services/stages.js` (Stage class, createStage, updateStage, getStageReportSummary)
- [ ] Update `src/services/payments.js` (Payment class, createPayment)

### Phase 2: Forms & Controllers (Estimated: 3-4 hours)

- [ ] Add form definitions to `src/forms/index.js` (STAGE_FORM_HOURLY, PAYMENT_FORM_HOURLY)
- [ ] Update `src/controllers/stages.js` (create, show, edit)
- [ ] Update `src/controllers/payments.js` (createStagePayment)

### Phase 3: Views (Estimated: 4-5 hours)

- [ ] Create `src/views/app/stages/select-type.ejs`
- [ ] Update `src/views/app/stages/show.ejs` (conditional cards, table columns)
- [ ] Update payment create form (hours input, live calculation JS)
- [ ] Update invoice templates (all 3 formats)
- [ ] Update project list progress display

### Phase 4: i18n & Polish (Estimated: 1-2 hours)

- [ ] Add all keys to `locales/en.json`
- [ ] Add all keys to `locales/es.json`
- [ ] Review and test translations

### Phase 5: Testing (Estimated: 3-4 hours)

- [ ] Run through all checklist items
- [ ] Fix discovered issues
- [ ] Test with sample data in staging
- [ ] Document any deviations from plan

---

**Total Estimated Time: 15-21 hours**
