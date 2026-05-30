
import { sql, SQL } from 'bun'
import seed from './seed'
import { runMigrations } from './migrations'

const { DATABASE_URL } = process.env

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set.')
}

console.debug('Database connected to:', DATABASE_URL)

let databaseInstance = globalThis.__databaseInstance
if (!databaseInstance) {
    databaseInstance = new SQL({
        url: DATABASE_URL,
        idleTimeout: 20,
        max: 10,
    })
    globalThis.__databaseInstance = databaseInstance
}
export const database = databaseInstance

export const init = async (retries = 5, delayMs = 3000) => {
    console.log('Database initialized')
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await runMigrations()
            await seed()
            return
        } catch (err) {
            if (attempt < retries && err.code === 'ERR_POSTGRES_CONNECTION_CLOSED') {
                console.warn(`Database not ready, retrying in ${delayMs}ms (${attempt}/${retries})...`)
                await Bun.sleep(delayMs)
            } else {
                throw err
            }
        }
    }
}
