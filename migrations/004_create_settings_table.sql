-- Create settings table for flexible key-value configuration
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    details TEXT,
    active BOOLEAN NOT NULL DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_settings_key UNIQUE (key)
);

-- Indexes to speed up lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings (key);
CREATE INDEX IF NOT EXISTS idx_settings_active ON settings (active);
