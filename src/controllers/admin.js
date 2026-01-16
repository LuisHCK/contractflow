import { recoverStageById } from '@/services/stages'
import { recoverPaymentById } from '@/services/payments'

// Recover a deleted stage
export const recoverStage = async (req, res) => {
    try {
        const { id } = req.params
        const success = await recoverStageById(id)
        if (success) {
            req.session.messages = ['Stage recovered successfully']
        } else {
            req.session.messages = ['Failed to recover stage']
        }
        return res.redirect('/admin')
    } catch (error) {
        console.error(`Error recovering stage: ${error.message}`)
        req.session.messages = ['An error occurred while recovering the stage']
        return res.status(500).redirect('/admin')
    }
}

// Recover a deleted payment
export const recoverPayment = async (req, res) => {
    try {
        const { id } = req.params
        const success = await recoverPaymentById(id)
        if (success) {
            req.session.messages = ['Payment recovered successfully']
        } else {
            req.session.messages = ['Failed to recover payment']
        }
        return res.redirect('/admin')
    } catch (error) {
        console.error(`Error recovering payment: ${error.message}`)
        req.session.messages = ['An error occurred while recovering the payment']
        return res.status(500).redirect('/admin')
    }
}
import { database } from '@/database'
import { ADMIN } from '@/database/queries'
import { User } from '@/database/models'
import { USERS } from '@/database/queries'

export const index = async (_req, res) => {
    try {
        // Get summary counts
        const userCountResult = database.query(ADMIN.COUNT_USERS).get()
        const projectCountResult = database.query(ADMIN.COUNT_PROJECTS).get()
        const contractorCountResult = database.query(ADMIN.COUNT_CONTRACTORS).get()

        const summary = {
            totalUsers: userCountResult?.count || 0,
            totalProjects: projectCountResult?.count || 0,
            totalContractors: contractorCountResult?.count || 0
        }

        // Get all users
        const usersData = database.query(ADMIN.GET_ALL_USERS).all()
        const users = usersData.map(user => new User(user))

        // Get soft-deleted elements
        const deletedStages = database.query(ADMIN.GET_DELETED_STAGES).all()
        const deletedPayments = database.query(ADMIN.GET_DELETED_PAYMENTS).all()

        res.render('app/admin/index', {
            summary,
            users,
            deletedStages,
            deletedPayments
        })
    } catch (error) {
        console.error(`Error fetching admin data: ${error.message}`)
        return res
            .status(500)
            .send('An error occurred while fetching admin data. Please try again later.')
    }
}

/**
 * Change a user's role. Only accessible to admin users.
 */
export const changeUserRole = async (req, res) => {
    try {
        const requester = req.user
        if (!requester || requester.role !== 'admin') {
            req.session.messages = ['Unauthorized']
            return res.status(403).redirect('/admin')
        }

        const targetId = Number(req.params.id)
        const { role } = req.body

        // Basic validation
        const allowedRoles = ['admin', 'user']
        if (!allowedRoles.includes(role)) {
            req.session.messages = ['Invalid role']
            return res.status(400).redirect('/admin')
        }

        if (requester.id === targetId && role !== 'admin') {
            // Prevent an admin from demoting themselves
            req.session.messages = ['You cannot change your own admin role']
            return res.status(400).redirect('/admin')
        }

        const query = database.query(USERS.UPDATE_ROLE)
        query.run({ id: targetId, role })

        req.session.messages = ['User role updated']
        return res.redirect('/admin')
    } catch (error) {
        console.error(`Error updating user role: ${error.message}`)
        req.session.messages = ['An error occurred while updating the role']
        return res.status(500).redirect('/admin')
    }
}
