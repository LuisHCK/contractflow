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
        this.currencyCode =
            project.currencyCode || project.currency_code || project.display_currency_code || null
        this.currencySymbol =
            project.currencySymbol ||
            project.currency_symbol ||
            project.display_currency_symbol ||
            null
        this.defaultExchangeRate = Number(
            project.defaultExchangeRate || project.default_exchange_rate || 1
        )
        this.estimatedCost =
            project.estimatedCost || project.total_estimated_cost || project.total_estimated_base || 0
        this.actualCost = project.actualCost || project.actual_cost || project.actual_cost_base || 0
        this.totalEstimatedBase = Number(project.totalEstimatedBase || project.total_estimated_base || 0)
        this.actualCostBase = Number(project.actualCostBase || project.actual_cost_base || 0)
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
        this.estimatedCostBase = Number(stage.estimatedCostBase || stage.estimated_cost_base || 0)
        this.finalCost = Number(stage.finalCost || stage.final_cost || 0)
        this.exchangeRate = Number(stage.exchangeRate || stage.exchange_rate || 1)
        this.displayCurrencyCode = stage.displayCurrencyCode || stage.display_currency_code || null
        this.displayCurrencySymbol =
            stage.displayCurrencySymbol || stage.display_currency_symbol || null
        this.totalPayments = Number(stage.totalPayments || stage.total_payments || 0)
        this.totalPaymentsBase = Number(stage.totalPaymentsBase || stage.total_payments_base || 0)
        this.progress = Number(stage.progress || 0)
        this.createdBy = stage.createdBy || stage.created_by
    }
}

export class Payment {
    constructor(payment) {
        this.id = payment.id
        this.stageId = payment.stageId || payment.stage_id
        this.amount = Number(payment.amount || 0)
        this.amountBase = Number(payment.amountBase || payment.amount_base || 0)
        this.balance = Number(payment.balance || 0)
        this.balanceBase = Number(payment.balanceBase || payment.balance_base || 0)
        this.exchangeRate = Number(payment.exchangeRate || payment.exchange_rate || 1)
        this.displayCurrencyCode = payment.displayCurrencyCode || payment.display_currency_code || null
        this.displayCurrencySymbol =
            payment.displayCurrencySymbol || payment.display_currency_symbol || null
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
