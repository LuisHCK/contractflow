export class User {
    constructor(user) {
        this.id = user.id
        this.name = user.name ?? ''
        this.email = user.email ?? ''
        this.password = user.password ?? ''
        this.role = user.role
        this.active = user.active
    }
}

export class Contractor {
    constructor(contractor) {
        this.id = contractor.id
        this.name = contractor.name ?? ''
        this.email = contractor.email ?? ''
        this.phone = contractor.phone ?? ''
        this.address = contractor.address ?? ''
    }
}

/**
 * Represents a project with its associated details.
 */
export class Project {
    /**
     * Creates an instance of the Project class.
     * @param {Object} project - The project data object.
     * @param {number} project.id - The unique identifier of the project.
     * @param {string} project.name - The name of the project.
     * @param {string} project.description - A brief description of the project.
     * @param {string} [project.startDate] - The start date of the project in ISO format.
     * @param {string} [project.endDate] - The end date of the project in ISO format.
     * @param {string} project.status - The current status of the project.
     * @param {number} [project.estimatedCost] - The estimated cost of the project.
     * @param {number} [project.actualCost] - The actual cost of the project.
     * @param {number} [project.progress] - The progress percentage of the project.
     */
    constructor(project) {
        this.id = project.id
        this.name = project.name
        this.description = project.description
        this.startDate = project.startDate || project.start_date
        this.endDate = project.endDate || project.end_date
        this.status = project.status
        this.estimatedCost = project.estimatedCost || project.total_estimated_cost
        this.actualCost = project.actualCost || project.actual_cost
        this.progress = Number(project.progress) || 0
    }

    /**
     * Retrieves the status label by replacing underscores with spaces in the `status` property.
     *
     * @returns {string | undefined} The formatted status label, or `undefined` if `status` is not set.
     */
    get statusLabel() {
        if (this.status) {
            return this.status.replace('_', ' ')
        }
    }
}

export class Stage {
    constructor(stage) {
        this.id = stage.id
        this.name = stage.name ?? ''
        this.projectId = stage.projectId || stage.project_id
        this.estimatedCost = Number(stage.estimatedCost || stage.estimated_cost || 0)
        this.finalCost = Number(stage.finalCost || stage.final_cost || 0)
        this.createdBy = stage.createdBy || stage.created_by
    }
}

export class Payment {
    constructor(payment) {
        this.id = payment.id
        this.stageId = payment.stageId || payment.stage_id
        this.amount = Number(payment.amount || 0)
        this.date = payment.date
        this.payer = payment.payer ?? ''
    }
}

export class Setting {
    constructor(setting) {
        this.id = setting.id
        this.key = setting.key
        this.value = setting.value
        this.details = setting.details ?? ''
        this.active = Boolean(setting.active ?? 1)
        this.createdBy = setting.createdBy || setting.created_by || null
        this.createdAt = setting.createdAt || setting.created_at || null
        this.updatedAt = setting.updatedAt || setting.updated_at || null
    }
}
