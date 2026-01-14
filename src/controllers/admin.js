import { database } from '@/database'
import { ADMIN } from '@/database/queries'
import { User } from '@/database/models'

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
