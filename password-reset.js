#!/usr/bin/env bun

/**
 * CLI tool to reset user passwords from the command line.
 * 
 * Usage: bun password-reset.js <email> <new-password>
 * Example: bun password-reset.js user@example.com newpass123
 * 
 * This tool is for administrative use only and should not be exposed via API.
 */

import { database } from './src/database/index.js'
import { USERS } from './src/database/queries.js'

/**
 * Hashes a password using Argon2i algorithm
 */
async function hashPassword(password) {
    return await Bun.password.hash(password, {
        algorithm: 'argon2i',
        memoryCost: Number(process.env.MEMORY_COST || 4),
        timeCost: Number(process.env.TIME_COST || 3)
    })
}

/**
 * Resets a user's password by email
 */
async function resetPassword(email, newPassword) {
    try {
        // Find the user by email
        const findQuery = database.query(USERS.FIND_BY_EMAIL)
        const user = findQuery.get({ email })

        if (!user) {
            console.error(`❌ Error: User with email "${email}" not found.`)
            process.exit(1)
        }

        // Hash the new password
        console.log('🔐 Hashing new password...')
        const hashedPassword = await hashPassword(newPassword)

        // Update the user's password
        const updateQuery = database.query(`
            UPDATE users
            SET password = :password,
                updated_at = CURRENT_TIMESTAMP
            WHERE email = :email;
        `)

        updateQuery.run({ email, password: hashedPassword })

        console.log(`✅ Password successfully reset for user: ${email}`)
        console.log(`   User ID: ${user.id}`)
        console.log(`   Name: ${user.name}`)
        console.log(`   Role: ${user.role}`)
    } catch (error) {
        console.error('❌ Error resetting password:', error.message)
        process.exit(1)
    }
}

// Main execution
function main() {
    const args = process.argv.slice(2)

    // Show help
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log('Password Reset CLI Tool')
        console.log('=======================\n')
        console.log('Reset user passwords from the command line.\n')
        console.log('Usage: bun password-reset.js <email> <new-password>')
        console.log('Example: bun password-reset.js user@example.com newpass123\n')
        console.log('Security Notes:')
        console.log('  • This tool is for administrative use only')
        console.log('  • Never expose this functionality via an API')
        console.log('  • Passwords must be at least 6 characters long')
        console.log('  • Passwords are hashed using Argon2i before storage')
        process.exit(args.length === 0 ? 1 : 0)
    }

    if (args.length !== 2) {
        console.error('❌ Invalid arguments.')
        console.error('\nUsage: bun password-reset.js <email> <new-password>')
        console.error('Example: bun password-reset.js user@example.com newpass123')
        process.exit(1)
    }

    const [email, newPassword] = args

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        console.error('❌ Error: Invalid email format.')
        process.exit(1)
    }

    // Validate password length
    if (newPassword.length < 6) {
        console.error('❌ Error: Password must be at least 6 characters long.')
        process.exit(1)
    }

    console.log('🔄 Resetting password...')
    resetPassword(email, newPassword)
}

main()
