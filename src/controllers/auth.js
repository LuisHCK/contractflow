import { LOGIN_FORM } from '@/forms'
import passport from 'passport'

/**
 * Handles user login requests.
 *
 * - If the request method is POST, attempts to authenticate the user using Passport's 'local' strategy.
 *   On success, redirects to '/projects'. On failure, redirects to '/login' and enables failure messages.
 * - If the request method is not POST, renders the login form.
 *
 * @async
 * @function login
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const login = async (req, res, next) => {
    try {
        // Handle login form submission
        if (req.method === 'POST') {
            const { email, password } = req.body
            passport.authenticate('local', {
                successRedirect: '/projects', // Redirect on successful login
                failureRedirect: '/login', // Redirect on failed login
                failureMessage: true // Enable flash messages for failure
            })(req, res, next)
        } else {
            // Render the login form
            return res.render('generic/form-view', { title: 'Login', form: LOGIN_FORM })
        }
    } catch (error) {
        console.error(`Error during login: ${error.message}`)
        res.status(500).json({ error: 'Failed to log in' })
    }
}
