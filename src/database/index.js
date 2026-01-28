import { sql, SQL } from 'bun'
import seed from './seed'
import { runMigrations } from './migrations'

// Simple connection string built from existing Postgres env vars
const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB } = process.env

const connectionUrl = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`

console.debug('Connecting to database at', connectionUrl)

export const database = new SQL(connectionUrl)

export const init = async () => {
    console.log('Database initialized')

    // Run pending migrations
    await runMigrations()

    await seed()
}
