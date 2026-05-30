
import { sql, SQL } from 'bun'
import seed from './seed'
import { runMigrations } from './migrations'

const { DATABASE_URL } = process.env

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

export const init = async () => {
    console.log('Database initialized')
    await runMigrations()
    await seed()
}
