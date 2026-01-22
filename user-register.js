#!/usr/bin/env bun

/**
 * CLI tool to register new users from the command line.
 *
 * Usage: bun user-register.js <name> <email> <password> [role]
 * Example: bun user-register.js "Jane Doe" jane@example.com supersecret admin
 *
 * Flags:
 *   --role <role>      Explicitly set the user role (overrides positional role)
 *   --inactive         Creates the user as inactive (active by default)
 *
 * This tool is for administrative use only and should not be exposed via API.
 */

import { database } from './src/database/index.js'
import { USERS } from './src/database/queries.js'

/**
 * Hashes a password using Argon2i algorithm.
 *
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
    return await Bun.password.hash(password, {
        algorithm: 'argon2i',
        memoryCost: Number(process.env.MEMORY_COST || 4),
        timeCost: Number(process.env.TIME_COST || 3)
    })
}

/**
 * Registers a new user in the database.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.role
 * @param {boolean} params.active
 */
async function registerUser({ name, email, password, role, active }) {
    try {
        const findQuery = database.query(USERS.FIND_BY_EMAIL)
        const existingUser = findQuery.get({ email })

        if (existingUser) {
            console.error(`❌ Error: User with email "${email}" already exists.`)
            process.exit(1)
        }

        console.log('🔐 Hashing password...')
        const hashedPassword = await hashPassword(password)

        const insertQuery = database.query(USERS.ADD)
        insertQuery.run({
            password: hashedPassword,
            email,
            role,
            active: active ? 1 : 0,
            name
        })

        console.log(`✅ User registered successfully: ${name} <${email}>`)
        console.log(`   Role: ${role}`)
        console.log(`   Active: ${active ? 'yes' : 'no'}`)
    } catch (error) {
        console.error('❌ Error registering user:', error.message)
        process.exit(1)
    }
}

function printHelp(exitCode = 0) {
    console.log('User Registration CLI Tool')
    console.log('===========================\n')
    console.log('Register new users from the command line.\n')
    console.log('Usage: bun user-register.js <name> <email> <password> [role]')
    console.log('Example: bun user-register.js "Jane Doe" jane@example.com pass123 admin\n')
    console.log('Flags:')
    console.log('  --role <role>      Explicitly set the user role')
    console.log('  --inactive         Creates the user as inactive\n')
    console.log('Security Notes:')
    console.log('  • This tool is for administrative use only')
    console.log('  • Never expose this functionality via an API')
    console.log('  • Passwords must be at least 6 characters long')
    console.log('  • Passwords are hashed using Argon2i before storage')
    process.exit(exitCode)
}

function parseArgs(argv) {
    const args = [...argv]
    let role = 'user'
    let active = true
    const positional = []

    for (let i = 0; i < args.length; i++) {
        const arg = args[i]

        if (arg === '--help' || arg === '-h') {
            printHelp(0)
        }

        if (arg === '--inactive') {
            active = false
            continue
        }

        if (arg === '--role') {
            if (i + 1 >= args.length) {
                console.error('❌ Error: Missing value for --role')
                process.exit(1)
            }
            role = args[++i]
            continue
        }

        if (arg.startsWith('--role=')) {
            role = arg.split('=')[1] || role
            continue
        }

        positional.push(arg)
    }

    if (positional.length < 3) {
        console.error('❌ Invalid arguments.')
        console.error('\nUsage: bun user-register.js <name> <email> <password> [role]')
        console.error('Example: bun user-register.js "Jane Doe" jane@example.com pass123 admin')
        process.exit(1)
    }

    const [name, email, password, roleOverride] = positional

    if (roleOverride) {
        role = roleOverride
    }

    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
        console.error('❌ Error: Name must be at least 2 characters long.')
        process.exit(1)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        console.error('❌ Error: Invalid email format.')
        process.exit(1)
    }

    if (password.length < 6) {
        console.error('❌ Error: Password must be at least 6 characters long.')
        process.exit(1)
    }

    if (!role.trim()) {
        console.error('❌ Error: Role cannot be empty.')
        process.exit(1)
    }

    return { name: trimmedName, email, password, role: role.trim(), active }
}

async function main() {
    const args = process.argv.slice(2)

    if (args.length === 0) {
        printHelp(1)
    }

    const options = parseArgs(args)
    console.log('🆕 Registering user...')
    await registerUser(options)
}

main()
