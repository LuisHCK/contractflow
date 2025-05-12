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
            label: 'Description',
            name: 'description',
            placeholder: 'Stage description',
            required: true,
            type: 'textarea'
        },
        {
            label: 'Contractor',
            name: 'contractorId',
            placeholder: 'Select the contractor',
            required: true,
            type: 'select',
            options: [] // to be populated dynamically
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
        {
            label: 'Contractor',
            name: 'contractorId',
            placeholder: 'Select the contractor',
            required: true,
            type: 'select',
            options: [] // to be populated dynamically
        },
        {
            label: 'Description',
            name: 'description',
            placeholder: 'Payment description',
            type: 'textarea'
        },
        {
            label: 'Payment method',
            name: 'paymentMethod',
            placeholder: 'Payment method',
            required: true,
            type: 'select',
            options: ['cash', 'credit_card', 'bank_transfer', 'check']
        },
        {
            label: 'Category',
            name: 'paymentCategoryId',
            placeholder: 'Select the payment category',
            required: false,
            type: 'select',
            options: [] // to be populated dynamically
        }
    ]
}

export const CONTRACTOR_FORM = {
    fields: [
        { label: 'Name', name: 'name', placeholder: 'Contractor name', required: true },
        { label: 'Email', name: 'email', placeholder: 'Contractor email', type: 'email' },
        { label: 'Phone', name: 'phone', placeholder: 'Contractor phone' },
        { label: 'Address', name: 'address', placeholder: 'Contractor address' }
    ]
}

export const PAYMENT_CATEGORY_FORM = {
    fields: [
        { label: 'Name', name: 'name', placeholder: 'Payment category name', required: true },
        {
            label: 'Description',
            name: 'description',
            placeholder: 'Payment category description',
            type: 'textarea'
        }
    ]
}

export const EVIDENCE_FORM = {
    fields: [
        {
            label: 'Attachment',
            name: 'attachment',
            placeholder: 'Attach file as evidence',
            required: true,
            type: 'file',
            // Accept most common document types and images
            accept: 'application/pdf, image/*, .docx, .xlsx, .pptx, .txt'
        },
        {
            label: 'Description',
            name: 'description',
            placeholder: 'Description of the evidence',
            type: 'textarea'
        }
    ]
}

export const LOGIN_FORM = {
    fields: [
        { label: 'Email', name: 'email', placeholder: 'Email', type: 'email', required: true },
        {
            label: 'Password',
            name: 'password',
            placeholder: 'Password',
            type: 'password',
            required: true
        }
    ]
}
