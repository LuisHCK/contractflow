import { database } from '@/database' // TODO: Move this code to a service
import { CONTRACTORS } from '@/database/queries'
import { CONTRACTOR_FORM } from '@/forms'
import { populateForm } from '@/forms/utils'
import * as contractorService from '@/services/contractors'
import { formatTableViewData } from '@/utils/generic-views'

// Get all contractors
export const index = async (_req, res) => {
    try {
        const contractors = await contractorService.getAll()
        const pageData = formatTableViewData({
            data: contractors,
            form: CONTRACTOR_FORM,
            baseRoute: 'contractors',
            title: 'Contractors',
            description: 'List of contractors',
            showCreate: true,
            createPath: '/contractors/create'
        })

        return res.render('generic/table-view', pageData)
    } catch (error) {
        console.error(`Error fetching contractors: ${error.message}`)
        res.status(500).json({ error: 'Failed to fetch contractors' })
    }
}

// Get a contractor by ID
export const show = async (req, res) => {
    const { id } = req.params
    try {
        const contractor = await contractorService.getById(id)
        const projects = await contractorService.getProjects(id)

        if (!contractor) {
            return res.status(404).json({ error: 'Contractor not found' })
        }
        res.render('app/contractors/show', { contractor, projects })
    } catch (error) {
        console.error(`Error fetching contractor: ${error.message}`)
        res.status(500).json({ error: 'Failed to fetch contractor' })
    }
}

// Create a new contractor
export const create = async (req, res) => {
    const { name, email, phone, address, createdBy } = req.body
    try {
        // Render the form for creating a new contractor
        if (req.method === 'GET') {
            return res.render('generic/form-view', {
                title: 'Create contractor',
                form: CONTRACTOR_FORM
            })
        }
        // Handle form submission for creating a new contractor
        const newContractor = await contractorService.create({
            name,
            email,
            phone,
            address
        })

        if (!newContractor?.id) {
            return res.render('generic/form-view', {
                title: 'Create contractor',
                form: populateForm({
                    form: CONTRACTOR_FORM,
                    data: { name, email, phone, address },
                    error: 'Failed to create contractor'
                })
            })
        }

        res.redirect(`/contractors/show/${newContractor.id}`)
    } catch (error) {
        console.error(`Error adding contractor: ${error.message}`)
        res.status(500).json({ error: 'Failed to add contractor' })
    }
}

// Update a contractor
export const update = async (req, res) => {
    const { id } = req.params
    const { name, email, phone, address } = req.body
    try {
        // Render the form for editing a contractor
        if (req.method === 'GET') {
            const contractor = await contractorService.getById(id)

            if (!contractor) {
                return res.status(404).json({ error: 'Contractor not found' })
            }

            // Render the form with the contractor data
            return res.render('generic/form-view', {
                title: 'Edit contractor',
                form: populateForm({
                    form: CONTRACTOR_FORM,
                    data: contractor
                }),
                title: `Edit contractor: ${contractor.name}`
            })
        }

        // Handle form submission for updating a contractor
        const existingContractor = await contractorService.getById(id)

        if (!existingContractor) {
            return res.status(404).json({ error: 'Contractor not found' })
        }
        // Update the contractor in the database
        const query = database.query(CONTRACTORS.UPDATE)
        const { changes } = query.run({ ...existingContractor, id, name, email, phone, address })

        if (changes === 0) {
            return res.status(404).json({ error: 'Contractor not found' })
        }

        res.status(200).json({ id, name, email, phone, address })
    } catch (error) {
        console.error(`Error updating contractor: ${error.message}`)
        res.status(500).json({ error: 'Failed to update contractor' })
    }
}

// Delete a contractor
export const remove = async (req, res) => {
    const { id } = req.params
    try {
        const query = database.query(CONTRACTORS.DELETE)
        const { changes } = query.run({ id })
        if (changes === 0) {
            return res.status(404).json({ error: 'Contractor not found' })
        }
        res.status(200).json({ message: 'Contractor deleted successfully' })
    } catch (error) {
        console.error(`Error deleting contractor: ${error.message}`)
        res.status(500).json({ error: 'Failed to delete contractor' })
    }
}
