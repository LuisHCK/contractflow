export const PROJECT_FORM = {
    fields: [
        { label: 'Name', name: 'name', placeholder: 'Project name', required: true },
        {
            label: 'Description',
            name: 'description',
            placeholder: 'Project description',
            required: true,
            type: 'textarea'
        },
        {
            label: 'Estimated cost',
            name: 'estimatedCost',
            placeholder: 'Estimated cost',
            required: true,
            type: 'number'
        },
        {
            label: 'Start date',
            name: 'startDate',
            placeholder: 'Start date',
            required: true,
            type: 'date'
        },
        { label: 'End date', name: 'endDate', placeholder: 'End date', type: 'date' },
        {
            label: 'Status',
            name: 'status',
            type: 'select',
            required: true,
            options: ['planned', 'in_progress', 'on_hold', 'canceled', 'delayed']
        }
    ]
}

export const STAGE_FORM = {
    fields: [
        { label: 'Name', name: 'name', placeholder: 'Stage name', required: true },
        {
            label: 'Estimated cost',
            name: 'estimatedCost',
            placeholder: 'Estimated cost',
            required: true,
            type: 'number'
        }
    ]
}

export const PAYMENT_FORM = {
    fields: [
        {
            label: 'Amount',
            name: 'amount',
            placeholder: 'Payment amount',
            required: true,
            type: 'number'
        },
        {
            label: 'Date',
            name: 'date',
            placeholder: 'Payment date',
            required: true,
            type: 'date',
            value: new Date().toISOString().split('T')[0]
        },
        { label: 'Payer', name: 'payer', placeholder: 'Payment payer', required: true },
        { label: 'Payee', name: 'payee', placeholder: 'Payment payee', required: true }
    ]
}
