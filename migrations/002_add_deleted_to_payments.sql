-- Add deleted column to payments table for soft deletes
ALTER TABLE payments ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT 0;