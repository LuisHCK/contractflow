
import { sql, SQL } from 'bun'
import seed from './seed'
import { runMigrations } from './migrations'

const { DATABASE_URL } = process.env

console.debug('Database connected to:', DATABASE_URL)

let databaseInstance = globalThis.__databaseInstance
if (!databaseInstance) {
    databaseInstance = new SQL(DATABASE_URL)
    globalThis.__databaseInstance = databaseInstance
}
export const database = databaseInstance

export const init = async () => {
    console.log('Database initialized')
    await runMigrations()
    await seed()
}
