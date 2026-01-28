import { sql, SQL } from 'bun'
import seed from './seed'
import { runMigrations } from './migrations'

// Simple connection string built from existing Postgres env vars
const { DATABASE_URL } = process.env

console.debug('Database connected to:', DATABASE_URL)

export const database = new SQL(DATABASE_URL)


export const init = async () => {
    console.log('Database initialized')

    // Run pending migrations
    await runMigrations()

    await seed()
}
