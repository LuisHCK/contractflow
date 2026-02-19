-- Additive migration: project-level multi-currency support with historical snapshots

-- Projects: default currency context
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS currency_code TEXT,
    ADD COLUMN IF NOT EXISTS currency_symbol TEXT,
    ADD COLUMN IF NOT EXISTS default_exchange_rate DOUBLE PRECISION NOT NULL DEFAULT 1;

UPDATE projects
SET default_exchange_rate = 1
WHERE default_exchange_rate IS NULL OR default_exchange_rate <= 0;

-- Stage: snapshot display context + base amount
ALTER TABLE stage
    ADD COLUMN IF NOT EXISTS display_currency_code TEXT,
    ADD COLUMN IF NOT EXISTS display_currency_symbol TEXT,
    ADD COLUMN IF NOT EXISTS exchange_rate DOUBLE PRECISION NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS estimated_cost_base DOUBLE PRECISION;

UPDATE stage
SET exchange_rate = 1
WHERE exchange_rate IS NULL OR exchange_rate <= 0;

UPDATE stage s
SET
    display_currency_code = COALESCE(s.display_currency_code, p.currency_code),
    display_currency_symbol = COALESCE(s.display_currency_symbol, p.currency_symbol),
    estimated_cost_base = COALESCE(
        s.estimated_cost_base,
        s.estimated_cost * COALESCE(NULLIF(s.exchange_rate, 0), 1),
        s.estimated_cost
    )
FROM projects p
WHERE s.project_id = p.id;

UPDATE stage
SET estimated_cost_base = COALESCE(estimated_cost_base, estimated_cost)
WHERE estimated_cost_base IS NULL;

-- Payments: immutable display snapshot + base amounts
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS display_currency_code TEXT,
    ADD COLUMN IF NOT EXISTS display_currency_symbol TEXT,
    ADD COLUMN IF NOT EXISTS exchange_rate DOUBLE PRECISION NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS amount_base DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS balance_base DOUBLE PRECISION;

UPDATE payments
SET exchange_rate = 1
WHERE exchange_rate IS NULL OR exchange_rate <= 0;

UPDATE payments py
SET
    display_currency_code = COALESCE(py.display_currency_code, s.display_currency_code, p.currency_code),
    display_currency_symbol = COALESCE(py.display_currency_symbol, s.display_currency_symbol, p.currency_symbol),
    amount_base = COALESCE(
        py.amount_base,
        py.amount * COALESCE(NULLIF(py.exchange_rate, 0), 1),
        py.amount
    ),
    balance_base = COALESCE(
        py.balance_base,
        py.balance * COALESCE(NULLIF(py.exchange_rate, 0), 1),
        py.balance
    )
FROM stage s
JOIN projects p ON p.id = s.project_id
WHERE py.stage_id = s.id;

UPDATE payments
SET
    amount_base = COALESCE(amount_base, amount),
    balance_base = COALESCE(balance_base, balance)
WHERE amount_base IS NULL OR balance_base IS NULL;
