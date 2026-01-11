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
    const FORM_VIEW = 'app/login'
    try {
        // Handle login form submission
        if (req.method === 'POST') {
            return passport.authenticate('local', (err, user, _info) => {
                // If an error occurs during authentication
                if (err) {
                    return res.render(FORM_VIEW, {
                        title: req.__('auth_login_title'),
                        form: LOGIN_FORM,
                        messages: [
                            { content: 'An error occurred during authentication', type: 'danger' }
                        ]
                    })
                }

                // If user is not found or password is incorrect
                if (!user) {
                    return res.render(FORM_VIEW, {
                        title: req.__('auth_login_title'),
                        form: LOGIN_FORM,
                        messages: [{ content: 'Invalid credentials', type: 'warning' }]
                    })
                }

                // If user is found, log them in
                req.logIn(user, (err) => {
                    if (err) {
                        return res.render(FORM_VIEW, {
                            title: req.__('auth_login_title'),
                            form: LOGIN_FORM,
                            messages: [{ content: 'Failed to log in', type: 'warning' }]
                        })
                    }
                    return res.redirect('/projects')
                })
            })(req, res, next)
        } else {
            // Render the login form
            return res.render(FORM_VIEW, { title: req.__('auth_login_title'), form: LOGIN_FORM })
        }
    } catch (error) {
        console.error(`Error during login: ${error.message}`)

        return res.render(FORM_VIEW, {
            title: req.__('auth_login_title'),
            form: LOGIN_FORM,
            messages: [
                {
                    content: req.__('auth_login_message_continue'),
                    type: 'info'
                }
            ]
        })
    }
}

export const logout = async (req, res) => {
    try {
        // Log the user out
        req.logout((err) => {
            if (err) {
                console.error(`Error during logout: ${err.message}`)
                return res.status(500).json({ error: 'Failed to log out' })
            }

            // Redirect to login page after successful logout
            res.redirect('/login')
        })
    } catch (error) {
        console.error(`Error during logout: ${error.message}`)
        res.redirect('/?error=logout_failed')
    }
}
