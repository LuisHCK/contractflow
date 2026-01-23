import { database } from '@/database'
import { USERS } from '@/database/queries'
import { USER_FORM } from '@/forms'
import { populateForm } from '@/forms/utils'
import { hashPassword } from '@/services/users'

/**
 * Create a new user (admin only)
 */
export const create = async (req, res) => {
    const { name, email, password, role, active } = req.body || {}
    try {
        // Authorization: only admin users can access
        const requester = req.user
        if (!requester || requester.role !== 'admin') {
            req.flash('danger', 'Unauthorized')
            return res.status(403).redirect('/')
        }

        // Render the form
        if (req.method === 'GET') {
            return res.render('generic/form-view', {
                title: req.__('users_create_title') || 'Create User',
                form: USER_FORM
            })
        }

        // Handle POST: basic validation
        if (!name || !email || !password || !role) {
            return res.render('generic/form-view', {
                title: req.__('users_create_title') || 'Create User',
                form: populateForm({
                    form: USER_FORM,
                    data: { name, email, role, active },
                    error: req.__('users_create_error') || 'Please fill required fields'
                })
            })
        }

        // Insert user
        const query = database.query(USERS.ADD)
        const hashedPassword = await hashPassword(password)
        const result = query.run({
            password: hashedPassword,
            email,
            role,
            active: active ? 1 : 0,
            name
        })

        if (!result || !result || result.lastInsertRowid === 0) {
            return res.render('generic/form-view', {
                title: req.__('users_create_title') || 'Create User',
                form: populateForm({
                    form: USER_FORM,
                    data: { name, email, role, active },
                    error: req.__('users_create_error') || 'Failed to create user'
                })
            })
        }

        const newId = result.lastInsertRowid || result.id
        res.redirect(`/admin`)
    } catch (error) {
        console.error(`Error creating user: ${error.message}`)
        res.status(500).json({ error: 'Failed to create user' })
    }
}

export default { create }

export const edit = async (req, res) => {
    const { id } = req.params
    const { name, email, password, role, active } = req.body || {}
    try {
        // Authorization: only admin users can access
        const requester = req.user
        if (!requester || requester.role !== 'admin') {
            req.flash('danger', 'Unauthorized')
            return res.status(403).redirect('/')
        }

        // Render form for editing
        if (req.method === 'GET') {
            const q = database.query(USERS.GET)
            const user = q.get({ id })
            if (!user) {
                return res.status(404).json({ error: 'User not found' })
            }

            // Make a copy of the form and make password optional for edit
            const populated = populateForm({ form: USER_FORM, data: user })
            populated.fields = populated.fields.map((f) => {
                if (f.name === 'password') {
                    return {
                        ...f,
                        required: false,
                        value: '',
                        placeholder: req.__('users_edit_password_placeholder')
                    }
                }
                return f
            })

            return res.render('generic/form-view', {
                title: req.__('detail_edit'),
                form: populated
            })
        }

        // Handle POST: basic validation
        if (!name || !email || !role) {
            return res.render('generic/form-view', {
                title: req.__('detail_edit'),
                form: populateForm({
                    form: USER_FORM,
                    data: { name, email, role, active },
                    error: req.__('users_create_error')
                })
            })
        }

        // Get existing user to keep password if not provided
        const getQ = database.query(USERS.GET)
        const existing = getQ.get({ id })
        if (!existing) {
            return res.status(404).json({ error: 'User not found' })
        }

        let finalPassword = existing.password
        if (password && password.trim() !== '') {
            finalPassword = await hashPassword(password)
        }

        const updateQ = database.query(USERS.UPDATE)
        const { changes } = updateQ.run({
            id,
            password: finalPassword,
            email,
            role,
            name,
            active: active ? 1 : 0
        })

        if (changes === 0) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Redirect back to admin users list
        req.flash('success', 'User updated')
        return res.redirect('/admin')
    } catch (error) {
        console.error(error)
        console.error(`Error editing user: ${error.message}`)
        res.status(500).json({ error: 'Failed to edit user' })
    }
}
