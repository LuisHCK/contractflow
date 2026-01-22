import { LOGIN_FORM } from '@/forms'
import * as jose from 'jose'
import { getUserByEmail } from '@/services/users'

/**
 * Handles user login requests.
 *
 * - If the request method is POST, attempts to authenticate the user.
 *   On success, generates a JWT, sets it as a cookie, and redirects to '/projects'.
 *   On failure, renders the login form with an error message.
 * - If the request method is not POST, renders the login form.
 *
 * @async
 * @function login
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const login = async (req, res) => {
    const FORM_VIEW = 'app/login'
    try {
        if (req.method === 'POST') {
            const { email, password } = req.body
            const user = await getUserByEmail(email)

            if (!user) {
                return res.render(FORM_VIEW, {
                    title: req.__('auth_login_title'),
                    form: LOGIN_FORM,
                    messages: [{ content: req.__('auth_login_invalid_credentials'), type: 'danger' }]
                })
            }

            const isMatch = await Bun.password.verify(password, user.password)

            if (!isMatch) {
                return res.render(FORM_VIEW, {
                    title: req.__('auth_login_title'),
                    form: LOGIN_FORM,
                    messages: [{ content: req.__('auth_login_invalid_credentials'), type: 'warning' }]
                })
            }

            const secret = new TextEncoder().encode(process.env.SECRET_KEY)
            const alg = 'HS256'
            const token = await new jose.SignJWT({ id: user.id, role: user.role })
                .setProtectedHeader({ alg })
                .setExpirationTime('1d')
                .setIssuedAt()
                .sign(secret)

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 1000 * 60 * 60 * 24 // 1 day
            })

            return res.redirect('/projects')
        } else {
            return res.render(FORM_VIEW, { title: req.__('auth_login_title'), form: LOGIN_FORM })
        }
    } catch (error) {
        console.error(`Error during login: ${error.message}`)
        return res.render(FORM_VIEW, {
            title: req.__('auth_login_title'),
            form: LOGIN_FORM,
            messages: [{ content: req.__('auth_login_invalid_credentials'), type: 'warning' }]
        })
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token')
        res.redirect('/login')
    } catch (error) {
        console.error(`Error during logout: ${error.message}`)
        res.redirect('/?error=logout_failed')
    }
}
