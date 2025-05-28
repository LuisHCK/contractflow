import { Database } from 'bun:sqlite'
import seed from './seed'

export const database = new Database('database.db', {
    create: true,
    strict: true,
    safeIntegers: true
})

export const init = async () => {
    database.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            active BOOLEAN NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS contractors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            start_date DATE NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            end_date DATE,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
        );
        
        CREATE TABLE IF NOT EXISTS stage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            project_id INTEGER NOT NULL,
            estimated_cost REAL NOT NULL,
            final_cost REAL,
            start_date DATE NOT NULL,
            end_date DATE,
            description TEXT,
            contractor_id INTEGER NOT NULL,
            created_by INTEGER NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS payment_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT
        );
        
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stage_id INTEGER NOT NULL,
            payment_category_id INTEGER NOT NULL,
            contractor_id INTEGER NOT NULL,
            description TEXT,
            payment_method TEXT NOT NULL,
            amount REAL NOT NULL,
            date DATE NOT NULL,
            payer TEXT NOT NULL,
            evidence TEXT,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (stage_id) REFERENCES stage(id) ON DELETE RESTRICT,
            FOREIGN KEY (payment_category_id) REFERENCES payment_categories(id) ON DELETE RESTRICT,
            FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE RESTRICT
        );

        CREATE TABLE IF NOT EXISTS evidences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_id INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            description TEXT,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
        );

        CREATE INDEX IF NOT EXISTS idx_evidences_payment_id ON evidences(payment_id);

        CREATE TABLE IF NOT EXISTS sessions (
            sid TEXT PRIMARY KEY,
            sess TEXT NOT NULL,
            expire INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
    `)

    console.log('Database initialized')

    await seed()
}
