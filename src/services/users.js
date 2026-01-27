import { database } from '@/database'
import { USERS } from '@/database/queries'

class User {
    constructor(user) {
        this.id = user.id ? Number(user.id) : undefined
        this.name = user.name
        this.email = user.email
        this.password = user.password
        this.role = user.role
        this.active = user.active
    }
}

/**
 * Hashes a password using the Argon2i algorithm.
 *
 * @param {string} password - The plaintext password to be hashed.
 * @returns {Promise<string>} A promise that resolves with the hashed password.
 */
export const hashPassword = async (password) => {
    return await Bun.password.hash(password, {
        algorithm: 'argon2i',
        memoryCost: Number(process.env.MEMORY_COST || 4),
        timeCost: Number(process.env.TIME_COST || 3)
    })
}

/**
 * Retrieves a user from the database based on their email address.
 * Logs an error message and returns null if the query fails or if the user is not found.
 *
 * @async
 * @param {string} email - The email address of the user to retrieve.
 * @returns {Promise<object|null>} A promise that resolves to the user object if found, otherwise null.
 */
export const getUserByEmail = async (email) => {
    try {
        const rows = await database.unsafe(USERS.FIND_BY_EMAIL, [email])
        const user = rows?.[0]

        if (!user) {
            console.log(`User with email ${email} not found`)
            return null
        }

        return new User(user)
    } catch (error) {
        console.error(`Error fetching user by email: ${error}`)
        return null
    }
}

/**
 * Fetches a user from the database by their ID.
 * Logs an error message if the user is not found or if a database error occurs.
 *
 * @async
 * @function getUserById
 * @param {number | string} id - The unique identifier of the user to fetch.
 * @returns {Promise<object | null>} A promise that resolves with the user object if found, or null if not found or in case of an error.
 */
export const getUserById = async (id) => {
    try {
        const rows = await database.unsafe(USERS.GET, [id])
        const user = rows?.[0]

        if (!user) {
            console.log(`User with id ${id} not found`)
            return null
        }

        return new User(user)
    } catch (error) {
        console.error(`Error fetching user by id: ${error.message}`)
        return null
    }
}

/**
 * Seeds the database with an admin user if no users exist.
 *
 * This function checks if the user table is empty. If so, it creates an admin user
 * using the email and password specified in the environment variables `ADMIN_EMAIL`
 * and `ADMIN_PASSWORD`. If the admin user already exists or the environment variables
 * are not set, the function does nothing.
 *
 * @async
 * @function
 * @returns {Promise<null|void>} Returns null if the database is already seeded or required environment variables are missing.
 */
export const seedAdminUser = async () => {
    try {
        // Check if theres no users in the database
        const countRows = await database.unsafe(USERS.COUNT)
        const { count } = countRows?.[0] || { count: 0 }

        if (count > 0) {
            console.log('Database already seeded with admin user')
            return null
        }

        const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            return null
        }

        console.info('Seeding admin user...')

        const rows = await database.unsafe(USERS.ADD, [
            await hashPassword(ADMIN_PASSWORD),
            ADMIN_EMAIL,
            'admin',
            true,
            'admin'
        ])

        if (!rows || rows.length === 0) {
            console.warn('Admin user already exists')
        }

        console.info('Admin user seeded successfully')
    } catch (error) {
        console.error(error)
        console.error(`Error seeding admin user: ${error}`)
    }
}
