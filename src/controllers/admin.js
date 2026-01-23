/**
 * Import business data (Projects, Contractors, Stages, Payments, Payment Categories) from JSON.
 * Excludes Users and Evidences. If a user association is missing, defaults to the current user.
 * Maintains relationships between entities.
 */
export const importData = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).send('Authentication required')
        }
        const currentUserId = req.user.id
        if (!req.files || !req.files.data) {
            return res.status(400).send('No import file provided')
        }
        const file = req.files.data
        let importObj
        try {
            importObj = JSON.parse(file.data.toString())
        } catch (e) {
            return res.status(400).send('Invalid JSON file')
        }

        // Insert Contractors
        const contractorIdMap = {}
        for (const contractor of importObj.contractors || []) {
            const { id, ...fields } = contractor
            const result = database.query('INSERT INTO contractors (name, email, phone, address) VALUES (:name, :email, :phone, :address)').run(fields)
            contractorIdMap[id] = result.lastInsertRowid
        }

        // Insert Payment Categories
        const paymentCategoryIdMap = {}
        for (const cat of importObj.paymentCategories || []) {
            const { id, ...fields } = cat
            const result = database.query('INSERT INTO payment_categories (name, description) VALUES (:name, :description)').run(fields)
            paymentCategoryIdMap[id] = result.lastInsertRowid
        }

        // Insert Projects
        const projectIdMap = {}
        for (const project of importObj.projects || []) {
            const { id, created_by, ...fields } = project
            const newCreatedBy = await getValidUserId(created_by, currentUserId)
            const result = database.query('INSERT INTO projects (name, description, start_date, status, end_date, created_by) VALUES (:name, :description, :start_date, :status, :end_date, :created_by)').run({ ...fields, created_by: newCreatedBy })
            projectIdMap[id] = result.lastInsertRowid
        }

        // Insert Stages
        const stageIdMap = {}
        for (const stage of importObj.stages || []) {
            const { id, project_id, contractor_id, created_by, ...fields } = stage
            const newProjectId = projectIdMap[project_id]
            const newContractorId = contractorIdMap[contractor_id]
            const newCreatedBy = await getValidUserId(created_by, currentUserId)
            const result = database.query('INSERT INTO stage (name, project_id, estimated_cost, final_cost, start_date, end_date, description, contractor_id, created_by) VALUES (:name, :project_id, :estimated_cost, :final_cost, :start_date, :end_date, :description, :contractor_id, :created_by)').run({ ...fields, project_id: newProjectId, contractor_id: newContractorId, created_by: newCreatedBy })
            stageIdMap[id] = result.lastInsertRowid
        }

        // Insert Payments
        for (const payment of importObj.payments || []) {
            const { id, stage_id, payment_category_id, contractor_id, created_by, ...fields } = payment
            const newStageId = stageIdMap[stage_id]
            const newPaymentCategoryId = paymentCategoryIdMap[payment_category_id]
            const newContractorId = contractorIdMap[contractor_id]
            const newCreatedBy = await getValidUserId(created_by, currentUserId)
            database.query('INSERT INTO payments (stage_id, payment_category_id, contractor_id, description, payment_method, amount, balance, date, payer, evidence, created_by) VALUES (:stage_id, :payment_category_id, :contractor_id, :description, :payment_method, :amount, :balance, :date, :payer, :evidence, :created_by)').run({ ...fields, stage_id: newStageId, payment_category_id: newPaymentCategoryId, contractor_id: newContractorId, created_by: newCreatedBy })
        }

        res.status(200).send('Import successful')
    } catch (error) {
        console.error('Import error:', error)
        res.status(500).send('Failed to import data')
    }
}

// Helper to check if user exists, else fallback to current user
async function getValidUserId(userId, fallbackId) {
    if (!userId) return fallbackId
    const user = database.query('SELECT id FROM users WHERE id = :id').get({ id: userId })
    return user ? userId : fallbackId
}
/**
 * Export business data (Projects, Contractors, Stages, Payments, Payment Categories) as JSON.
 * Excludes Users and Evidences. Preserves relationships.
 */
export const exportData = async (req, res) => {
    try {
        // Fetch all entities
        const contractors = database.query('SELECT * FROM contractors').all()
        const paymentCategories = database.query('SELECT * FROM payment_categories').all()
        const projects = database.query('SELECT * FROM projects').all()
        const stages = database.query('SELECT * FROM stage').all()
        const payments = database.query('SELECT * FROM payments').all()

        // Compose export object
        const exportObj = {
            contractors,
            paymentCategories,
            projects,
            stages,
            payments
        }

        res.setHeader('Content-Disposition', 'attachment; filename="export.json"')
        res.setHeader('Content-Type', 'application/json')
        res.status(200).send(JSON.stringify(exportObj, null, 2))
    } catch (error) {
        console.error('Export error:', error)
        res.status(500).send('Failed to export data')
    }
}
import { database } from '@/database'
import { ADMIN } from '@/database/queries'
import { User } from '@/database/models'
import { USERS } from '@/database/queries'
import { recoverStageById } from '@/services/stages'
import { recoverPaymentById } from '@/services/payments'
import { recoverProjectById } from '@/services/projects'

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
        const deletedProjects = database.query(ADMIN.GET_DELETED_PROJECTS).all()
        const deletedStages = database.query(ADMIN.GET_DELETED_STAGES).all()
        const deletedPayments = database.query(ADMIN.GET_DELETED_PAYMENTS).all()

        res.render('app/admin/index', {
            summary,
            users,
            deletedProjects,
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
            req.flash('danger', 'Unauthorized')
            return res.status(403).redirect('/admin')
        }

        const targetId = Number(req.params.id)
        const { role } = req.body

        // Basic validation
        const allowedRoles = ['admin', 'user']
        if (!allowedRoles.includes(role)) {
            req.flash('warning', 'Invalid role')
            return res.status(400).redirect('/admin')
        }

        if (requester.id === targetId && role !== 'admin') {
            // Prevent an admin from demoting themselves
            req.flash('warning', 'You cannot change your own admin role')
            return res.status(400).redirect('/admin')
        }

        const query = database.query(USERS.UPDATE_ROLE)
        query.run({ id: targetId, role })

        req.flash('success', 'User role updated')
        return res.redirect('/admin')
    } catch (error) {
        console.error(`Error updating user role: ${error.message}`)
        req.flash('danger', 'An error occurred while updating the role')
        return res.status(500).redirect('/admin')
    }
}

// Recover a deleted project
export const recoverProject = async (req, res) => {
    try {
        const { id } = req.params
        const success = await recoverProjectById(id)
        if (success) {
            req.flash('success', 'Project recovered successfully')
        } else {
            req.flash('danger', 'Failed to recover project')
        }
        return res.redirect('/admin')
    } catch (error) {
        console.error(`Error recovering project: ${error.message}`)
        req.flash('danger', 'An error occurred while recovering the project')
        return res.status(500).redirect('/admin')
    }
}

// Recover a deleted stage
export const recoverStage = async (req, res) => {
    try {
        const { id } = req.params
        const success = await recoverStageById(id)
        if (success) {
            req.flash('success', 'Stage recovered successfully')
        } else {
            req.flash('danger', 'Failed to recover stage')
        }
        return res.redirect('/admin')
    } catch (error) {
        console.error(`Error recovering stage: ${error.message}`)
        req.flash('danger', 'An error occurred while recovering the stage')
        return res.status(500).redirect('/admin')
    }
}

// Recover a deleted payment
export const recoverPayment = async (req, res) => {
    try {
        const { id } = req.params
        const success = await recoverPaymentById(id)
        if (success) {
            req.flash('success', 'Payment recovered successfully')
        } else {
            req.flash('danger', 'Failed to recover payment')
        }
        return res.redirect('/admin')
    } catch (error) {
        console.error(`Error recovering payment: ${error.message}`)
        req.flash('danger', 'An error occurred while recovering the payment')
        return res.status(500).redirect('/admin')
    }
}