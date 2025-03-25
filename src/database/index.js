import { Database } from 'bun:sqlite'

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
        
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            start_date DATE NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            end_date DATE
        );
        
        CREATE TABLE IF NOT EXISTS stage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            project_id INTEGER NOT NULL,
            estimated_cost REAL NOT NULL,
            final_cost REAL,
            created_by INTEGER NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );
        
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stage_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            date DATE NOT NULL,
            payer TEXT NOT NULL,
            payee TEXT NOT NULL,
            FOREIGN KEY (stage_id) REFERENCES stage(id) ON DELETE CASCADE
        );

        INSERT INTO users (name, email, password, role, active)
        SELECT 'admin', 'admin@example.com', 'hashed_password_here', 'admin', 1
        WHERE NOT EXISTS (SELECT id FROM users WHERE email = 'admin@example.com' AND role = 'admin');
    `)
    console.log('Database initialized')
}
