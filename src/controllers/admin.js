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

        const filePath = req.files.data[0].path
        const importObj = await Bun.file(filePath).json()

        // Insert Contractors (Postgres)
        const contractorIdMap = {}
        for (const contractor of importObj.contractors || []) {
            const { id, ...fields } = contractor
            const rows = await database.unsafe(ADMIN.IMPORT_CONTRACTOR, [
                fields.name,
                fields.email,
                fields.phone,
                fields.address
            ])
            contractorIdMap[id] = rows?.[0]?.id
        }

        // Insert Payment Categories
        const paymentCategoryIdMap = {}
        for (const cat of importObj.paymentCategories || []) {
            const { id, ...fields } = cat

            const existingRows = await database.unsafe(ADMIN.GET_PAYMENT_CATEGORY_ID_BY_NAME, [fields.name])
            const existingCategory = existingRows?.[0]

            if (existingCategory) {
                paymentCategoryIdMap[id] = existingCategory.id
            } else {
                const rows = await database.unsafe(ADMIN.IMPORT_PAYMENT_CATEGORY, [fields.name, fields.description])
                paymentCategoryIdMap[id] = rows?.[0]?.id
            }
        }

        // Insert Projects
        const projectIdMap = {}
        for (const project of importObj.projects || []) {
            const { id, created_by, ...fields } = project
            const newCreatedBy = await getValidUserId(created_by, currentUserId)
            const rows = await database.unsafe(ADMIN.IMPORT_PROJECT, [
                fields.name,
                fields.description,
                fields.start_date,
                fields.status,
                normalizeEmptyToNull(fields.end_date),
                newCreatedBy
            ])
            projectIdMap[id] = rows?.[0]?.id
        }

        // Insert Stages
        const stageIdMap = {}
        for (const stage of importObj.stages || []) {
            const { id, project_id, contractor_id, created_by, ...fields } = stage
            const newProjectId = projectIdMap[project_id]
            const newContractorId = contractorIdMap[contractor_id]
            const newCreatedBy = await getValidUserId(created_by, currentUserId)
            const rows = await database.unsafe(ADMIN.IMPORT_STAGE, [
                fields.name,
                newProjectId,
                fields.estimated_cost,
                fields.final_cost,
                fields.start_date,
                normalizeEmptyToNull(fields.end_date),
                fields.description,
                newContractorId,
                newCreatedBy
            ])
            stageIdMap[id] = rows?.[0]?.id
        }

        // Insert Payments
        for (const payment of importObj.payments || []) {
            const { id, stage_id, payment_category_id, created_by, ...fields } = payment
            const newStageId = stageIdMap[stage_id]
            const newPaymentCategoryId = paymentCategoryIdMap[payment_category_id]
            const newCreatedBy = await getValidUserId(created_by, currentUserId)

            // Preserve boolean-like flags from SQLite export (supports "0"/"1", numbers, booleans)
            const hideTotals = toBooleanFlag(fields.hide_totals_invoice)
            const deleted = toBooleanFlag(fields.deleted)

            await database.unsafe(ADMIN.IMPORT_PAYMENT, [
                // stage_id, payment_category_id
                newStageId,
                newPaymentCategoryId,
                // description, payment_method, amount, balance
                fields.description,
                fields.payment_method,
                fields.amount,
                fields.balance,
                // date, payer, evidence, created_by
                fields.date,
                fields.payer,
                fields.evidence,
                newCreatedBy,
                // flags
                hideTotals,
                deleted
            ])
        }

        req.flash('success', 'Import successful')
        return res.redirect('/admin')
    } catch (error) {
        console.error('Import error:', error)
        req.flash('danger', 'Failed to import data')
        return res.redirect('/admin')
    }
}

// Helper to check if user exists, else fallback to current user
async function getValidUserId(userId, fallbackId) {
    if (!userId) return fallbackId
    const rows = await database.unsafe(ADMIN.CHECK_USER_EXISTS, [userId])
    const user = rows?.[0]
    return user ? userId : fallbackId
}

// Normalize "boolean" flags from SQLite JSON ("0"/"1", numbers, booleans) into real booleans
function toBooleanFlag(value) {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') {
        const v = value.trim().toLowerCase()
        return v === '1' || v === 'true' || v === 'yes'
    }
    return false
}

// Convert empty-string or whitespace-only values to null (for nullable DATE columns, etc.)
function normalizeEmptyToNull(value) {
    if (value === null || value === undefined) return null
    if (typeof value === 'string' && value.trim() === '') return null
    return value
}
/**
 * Export business data (Projects, Contractors, Stages, Payments, Payment Categories) as JSON.
 * Excludes Users and Evidences. Preserves relationships.
 */
export const exportData = async (req, res) => {
    try {
        // Fetch all entities
        const contractors = await database.unsafe(ADMIN.EXPORT_CONTRACTORS)
        const paymentCategories = await database.unsafe(ADMIN.EXPORT_PAYMENT_CATEGORIES)
        const projects = await database.unsafe(ADMIN.EXPORT_PROJECTS)
        const stages = await database.unsafe(ADMIN.EXPORT_STAGES)
        const payments = await database.unsafe(ADMIN.EXPORT_PAYMENTS)

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
        const exportData = JSONSerializer(exportObj)
        res.status(200).send(JSON.stringify(exportData, null, 2))
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
import JSONSerializer from '@/utils/json-serializer'

export const index = async (_req, res) => {
    try {
        // Get summary counts
        const userCountRows = await database.unsafe(ADMIN.COUNT_USERS)
        const projectCountRows = await database.unsafe(ADMIN.COUNT_PROJECTS)
        const contractorCountRows = await database.unsafe(ADMIN.COUNT_CONTRACTORS)
        const userCountResult = userCountRows?.[0]
        const projectCountResult = projectCountRows?.[0]
        const contractorCountResult = contractorCountRows?.[0]

        const summary = {
            totalUsers: userCountResult?.count || 0,
            totalProjects: projectCountResult?.count || 0,
            totalContractors: contractorCountResult?.count || 0
        }

        // Get all users
        const usersData = await database.unsafe(ADMIN.GET_ALL_USERS)
        const users = usersData.map(user => new User(user))

        // Get soft-deleted elements
        const deletedProjects = await database.unsafe(ADMIN.GET_DELETED_PROJECTS)
        const deletedStages = await database.unsafe(ADMIN.GET_DELETED_STAGES)
        const deletedPayments = await database.unsafe(ADMIN.GET_DELETED_PAYMENTS)

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

        await database.unsafe(USERS.UPDATE_ROLE, [role, targetId])

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
            console.log({success})
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