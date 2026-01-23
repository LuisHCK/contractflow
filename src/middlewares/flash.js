export const flash = (req, res, next) => {
    // Read flash messages from cookie
    const cookieValue = req.cookies.flash_messages
    if (cookieValue) {
        try {
            res.locals.messages = JSON.parse(cookieValue)
        } catch (e) {
            res.locals.messages = []
        }
        res.clearCookie('flash_messages')
    } else {
        res.locals.messages = []
    }

    // Helper to set flash messages
    req.flash = (type, content) => {
        if (!res.locals._outgoingFlash) {
            res.locals._outgoingFlash = []
        }
        
        res.locals._outgoingFlash.push({ type, content })
        
        res.cookie('flash_messages', JSON.stringify(res.locals._outgoingFlash), {
            httpOnly: true,
            path: '/',
            // Short duration, just enough for the redirect
            maxAge: 5 * 1000 
        })
    }

    next()
}
