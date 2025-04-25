import { seedPaymentCategories } from '@/services/payment-categories'
import { seedAdminUser } from '@/services/users'

/**
 * Seeds the database with initial data.
 * Calls functions to seed the admin user and payment categories.
 *
 * @async
 * @function
 * @returns {Promise<void>} Resolves when seeding is complete.
 */
const seed = async () => {
    console.info('Seeding database...')
    await seedAdminUser()
    await seedPaymentCategories()
    console.info('Database seeded successfully.')
}

export default seed
