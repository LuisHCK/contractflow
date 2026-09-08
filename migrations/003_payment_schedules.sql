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
