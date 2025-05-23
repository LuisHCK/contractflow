export const formatToCurrency = (amount, options = {}) => {
    if (!amount) return '$0'

    const locale = options.locale || 'en-US'
    const formatOptions = { style: 'currency', currency: 'USD', ...options }

    return new Intl.NumberFormat(locale, formatOptions).format(amount)
}
