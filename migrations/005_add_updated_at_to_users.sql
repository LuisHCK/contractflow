-- Migration: Add updated_at field to users table
-- Adds a column to track last update datetime for users

ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- If you want to update the value on every change, you should set it in your update queries or use a trigger.
