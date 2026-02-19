export const INVOICE_FORMAT_SETTING_KEY = 'invoice_format'
export const DEFAULT_INVOICE_FORMAT = 'standard'

export const INVOICE_FORMATS = [
    {
        key: 'standard',
        template: 'formats/standard',
        labelKey: 'system_settings_invoice_format_standard',
        descriptionKey: 'system_settings_invoice_format_standard_description'
    },
    {
        key: 'letter',
        template: 'formats/letter',
        labelKey: 'system_settings_invoice_format_letter',
        descriptionKey: 'system_settings_invoice_format_letter_description'
    },
    {
        key: 'thermal',
        template: 'formats/thermal',
        labelKey: 'system_settings_invoice_format_thermal',
        descriptionKey: 'system_settings_invoice_format_thermal_description'
    }
]

export const getInvoiceFormatOptions = () => INVOICE_FORMATS

export const isInvoiceFormatSupported = (format) =>
    INVOICE_FORMATS.some((item) => item.key === format)

export const normalizeInvoiceFormat = (format) =>
    isInvoiceFormatSupported(format) ? format : DEFAULT_INVOICE_FORMAT

export const getInvoiceFormatTemplate = (format) => {
    const normalized = normalizeInvoiceFormat(format)
    const selected = INVOICE_FORMATS.find((item) => item.key === normalized)
    return selected?.template || 'formats/standard'
}
