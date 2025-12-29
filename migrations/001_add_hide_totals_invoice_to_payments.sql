-- Add hide_totals_invoice column to payments table
ALTER TABLE payments ADD COLUMN hide_totals_invoice BOOLEAN NOT NULL DEFAULT 0;
