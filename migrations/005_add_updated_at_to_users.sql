-- Migration: Add updated_at field to users table
-- Adds a column to track last update datetime for users

-- SQLite doesn't support non-constant defaults in ALTER TABLE ADD COLUMN
-- So we add the column with NULL default, then update existing rows
ALTER TABLE users ADD COLUMN updated_at DATETIME;

-- Update existing rows to have the current timestamp
UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

-- Note: You should update the updated_at value in your update queries or use a trigger.
