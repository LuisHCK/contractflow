import { readdirSync } from 'fs'
import { join, resolve } from 'path'
import { database } from './index'

const MIGRATIONS_DIR = resolve(import.meta.dir, '../../migrations')

/**
 * Initializes the migrations table if it doesn't exist.
 */
const initMigrationsTable = () => {
    database.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `)
}

/**
 * Gets a list of already executed migration names.
 * @returns {Set<string>} Set of executed migration names
 */
const getExecutedMigrations = () => {
    const rows = database.query('SELECT name FROM _migrations').all()
    return new Set(rows.map(row => row.name))
}

/**
 * Gets all pending migration files sorted by name.
 * @returns {string[]} Array of pending migration filenames
 */
const getPendingMigrations = () => {
    const executed = getExecutedMigrations()
    
    try {
        const files = readdirSync(MIGRATIONS_DIR)
            .filter(file => file.endsWith('.sql'))
            .sort()
        
        return files.filter(file => !executed.has(file))
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.info('No migrations folder found, skipping migrations.')
            return []
        }
        throw error
    }
}

/**
 * Executes a single migration file within a transaction.
 * @param {string} filename - The migration filename
 */
const executeMigration = async (filename) => {
    const filePath = join(MIGRATIONS_DIR, filename)
    const sql = await Bun.file(filePath).text()
    
    const transaction = database.transaction(() => {
        database.exec(sql)
        database.query('INSERT INTO _migrations (name) VALUES (?)').run(filename)
    })
    
    transaction()
}

/**
 * Runs all pending migrations in order.
 * Each migration is executed in its own transaction.
 */
export const runMigrations = async () => {
    initMigrationsTable()
    
    const pending = getPendingMigrations()
    
    if (pending.length === 0) {
        console.info('No pending migrations.')
        return
    }
    
    console.info(`Running ${pending.length} migration(s)...`)
    
    for (const migration of pending) {
        try {
            console.info(`  → ${migration}`)
            await executeMigration(migration)
        } catch (error) {
            console.error(`  ✗ Migration failed: ${migration}`)
            console.error(`    ${error.message}`)
            throw error
        }
    }
    
    console.info('Migrations completed successfully.')
}
