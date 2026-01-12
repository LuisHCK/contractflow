export const PROJECT_FORM = {
    fields: [
        {
            label: 'projects_list_name',
            name: 'name',
            placeholder: 'projects_create_name_placeholder',
            required: true
        },
        {
            label: 'projects_list_description',
            name: 'description',
            placeholder: 'projects_create_description_placeholder',
            required: true,
            type: 'textarea'
        },
        {
            label: 'projects_create_start_date',
            name: 'startDate',
            placeholder: 'projects_create_start_date_placeholder',
            required: true,
            type: 'date'
        },
        {
            label: 'projects_create_end_date',
            name: 'endDate',
            placeholder: 'projects_create_end_date_placeholder',
            type: 'date'
        },
        {
            label: 'projects_list_status',
            name: 'status',
            type: 'select',
            required: true,
            options: [
                { label: 'projects_status_planned', value: 'planned' },
                { label: 'projects_status_in_progress', value: 'in_progress' },
                { label: 'projects_status_on_hold', value: 'on_hold' },
                { label: 'projects_status_canceled', value: 'canceled' },
                { label: 'projects_status_delayed', value: 'delayed' }
            ]
        }
    ]
}

export const STAGE_FORM = {
    fields: [
        {
            label: 'stages_name',
            name: 'name',
            placeholder: 'stages_create_name_placeholder',
            required: true
        },
        {
            label: 'stages_estimated_cost',
            name: 'estimatedCost',
            placeholder: 'stages_create_estimated_cost_placeholder',
            required: true,
            type: 'number'
        },
        {
            label: 'stages_create_start_date',
            name: 'startDate',
            placeholder: 'stages_create_start_date_placeholder',
            required: true,
            type: 'date'
        },
        {
            label: 'stages_create_end_date',
            name: 'endDate',
            placeholder: 'stages_create_end_date_placeholder',
            type: 'date'
        },
        {
            label: 'stages_create_description',
            name: 'description',
            placeholder: 'stages_create_description_placeholder',
            required: true,
            type: 'textarea'
        },
        {
            label: 'contractor_name',
            name: 'contractorId',
            placeholder: 'payments_create_contractor_placeholder',
            required: true,
            type: 'select',
            options: [], // to be populated dynamically
            showCreateOption: true,
            createOptionLabel: 'stages_create_new_contractor',
            createOptionPath: '/contractors/create',
            optionsSource: '/contractors'
        }
    ]
}

export const PAYMENT_FORM = {
    fields: [
        {
            label: 'payments_create_amount',
            name: 'amount',
            placeholder: 'payments_create_amount_placeholder',
            required: true,
            type: 'number'
        },
        {
            label: 'payments_create_date',
            name: 'date',
            placeholder: 'payments_create_date_placeholder',
            required: true,
            type: 'date',
            value: new Date().toISOString().split('T')[0]
        },
        {
            label: 'payments_create_payer',
            name: 'payer',
            placeholder: 'payments_create_payer_placeholder',
            required: true
        },
        {
            label: 'contractor_name',
            name: 'contractorId',
            placeholder: 'payments_create_contractor_placeholder',
            required: true,
            type: 'select',
            options: [], // to be populated dynamically
            showCreateOption: true,
            createOptionLabel: 'stages_create_new_contractor',
            createOptionPath: '/contractors/create',
            optionsSource: '/contractors'
        },
        {
            label: 'payments_create_description',
            name: 'description',
            placeholder: 'payments_create_description_placeholder',
            type: 'textarea'
        },
        {
            label: 'payments_create_payment_method',
            name: 'paymentMethod',
            placeholder: 'payments_create_payment_method_placeholder',
            required: true,
            type: 'select',
            options: [
                { label: 'payments_method_cash', value: 'cash' },
                { label: 'payments_method_credit_card', value: 'credit_card' },
                { label: 'payments_method_bank_transfer', value: 'bank_transfer' },
                { label: 'payments_method_check', value: 'check' }
            ]
        },
        {
            label: 'payments_create_category',
            name: 'paymentCategoryId',
            placeholder: 'payments_create_category_placeholder',
            required: false,
            type: 'select',
            options: [] // to be populated dynamically
        },
        {
            checkboxLabel: 'payments_hide_totals_invoice',
            name: 'hideTotalsInvoice',
            type: 'checkbox',
            description: 'payments_hide_totals_invoice_description'
        }
    ]
}

export const CONTRACTOR_FORM = {
    fields: [
        {
            label: 'contractor_name',
            name: 'name',
            placeholder: 'contractor_create_name_placeholder',
            required: true
        },
        {
            label: 'contractor_email',
            name: 'email',
            placeholder: 'contractor_create_email_placeholder',
            type: 'email'
        },
        {
            label: 'contractor_phone',
            name: 'phone',
            placeholder: 'contractor_create_phone_placeholder'
        },
        {
            label: 'contractor_address',
            name: 'address',
            placeholder: 'contractor_create_address_placeholder'
        }
    ]
}

export const PAYMENT_CATEGORY_FORM = {
    fields: [
        {
            label: 'payment_category_name',
            name: 'name',
            placeholder: 'payment_category_create_name_placeholder',
            required: true
        },
        {
            label: 'payment_category_description',
            name: 'description',
            placeholder: 'payment_category_create_description_placeholder',
            type: 'textarea'
        }
    ]
}

export const EVIDENCE_FORM = {
    fields: [
        {
            label: 'evidence_attachment',
            name: 'attachment',
            placeholder: 'evidence_attachment_placeholder',
            required: true,
            type: 'file',
            // Accept most common document types and images
            accept: 'application/pdf, image/*, .docx, .xlsx, .pptx, .txt'
        },
        {
            label: 'evidence_description',
            name: 'description',
            placeholder: 'evidence_description_placeholder',
            type: 'textarea'
        }
    ]
}

export const LOGIN_FORM = {
    fields: [
        {
            label: 'login_email',
            name: 'email',
            placeholder: 'login_email_placeholder',
            type: 'email',
            required: true
        },
        {
            label: 'login_password',
            name: 'password',
            placeholder: 'login_password_placeholder',
            type: 'password',
            required: true
        }
    ]
}
