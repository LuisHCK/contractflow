import { getUserByEmail, getUserById } from '@/services/users'
import { Strategy as LocalStrategy } from 'passport-local'

const initializePassport = (passport) => {
    // Local Strategy configuration
    passport.use(
        new LocalStrategy(
            {
                usernameField: 'email', // Use 'email' as the username field
                passwordField: 'password'
            },
            async (email, password, done) => {
                try {
                    // Find the user by email using the provided function
                    const user = await getUserByEmail(email)

                    if (!user) {
                        return done(null, false, { message: 'Incorrect email.' })
                    }

                    // Compare provided password with the stored hashed password
                    const isMatch = await Bun.password.verify(password, user.password)

                    if (!isMatch) {
                        return done(null, false, { message: 'Incorrect password.' })
                    }

                    // Authentication successful
                    return done(null, user)
                } catch (err) {
                    return done(err)
                }
            }
        )
    )

    // Serialization: What user information is stored in the session
    passport.serializeUser((user, done) => {
        done(null, user.id) // Store only the user ID in the session
    })

    // Deserialization: How to retrieve the user from the session ID
    passport.deserializeUser(async (id, done) => {
        try {
            // Retrieve the user from your data source using the provided function
            const user = await getUserById(id)
            done(null, user)
        } catch (err) {
            done(err)
        }
    })

    passport.hola = 'hola'
}

// Export the function using export default
export default initializePassport
