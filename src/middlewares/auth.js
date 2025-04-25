const PUBLIC_ROUTES = [
    'login',
    'register',
    'about',
    'contact',
    'privacy',
    'terms',
    'faq',
    'help',
    'support'
]

/**
 * Express middleware to ensure the user is authenticated before accessing a route.
 * Checks if `req.isAuthenticated()` returns true (typically provided by Passport.js).
 * If authenticated, it calls the `next()` middleware function to proceed.
 * If not authenticated, it sets a flash message in the session (`req.session.messages`)
 * and redirects the user to the '/login' page.
 *
 * @param {import('express').Request} req - The Express request object. Expected to have `isAuthenticated` method and `session` object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The callback function to invoke the next middleware.
 */
export const ensureAuthenticated = (req, res, next) => {
    if (PUBLIC_ROUTES.includes(req.originalUrl.replace('/', ''))) {
        return next() // Allow access to public routes
    }

    // Check if the user is authenticated
    if (req.isAuthenticated()) {
        return next() // User is authenticated, continue to the next middleware/route handler
    }
    // User is not authenticated, redirect to login page
    // Store message in session before redirecting
    req.session.messages = ['Please log in to view this page.']
    res.redirect('/login')
    return
}
