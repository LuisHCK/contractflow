-- Add deleted column to stage table for soft deletes
ALTER TABLE stage ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT 0;