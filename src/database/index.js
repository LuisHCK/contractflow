import { sql, SQL } from 'bun'
import seed from './seed'
import { runMigrations } from './migrations'

// Prefer explicit connection string; fallback to env-detected default client
const connectionUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.PGURL ||
    process.env.PG_URL

export const database = connectionUrl ? new SQL(connectionUrl) : sql

export const init = async () => {
    console.log('Database initialized')

    // Run pending migrations
    await runMigrations()

    await seed()
}
