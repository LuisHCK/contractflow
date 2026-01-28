import { sql, SQL } from 'bun'
import seed from './seed'
import { runMigrations } from './migrations'

// Prefer explicit connection string; fallback to env-detected default client
const { POSTGRES_PASSWORD, POSTGRES_DB } = process.env
const connectionUrl = `postgres://contractorpay:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`

export const database = connectionUrl ? new SQL(connectionUrl) : sql

export const init = async () => {
    console.log('Database initialized')

    // Run pending migrations
    await runMigrations()

    await seed()
}
