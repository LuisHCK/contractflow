export const normalizeExchangeRate = (value) => {
    const rate = Number(value)
    if (!Number.isFinite(rate) || rate <= 0) {
        return 1
    }

    return rate
}

export const toBaseAmount = (amount, exchangeRate = 1) => {
    return Number(amount || 0) * normalizeExchangeRate(exchangeRate)
}

export const fromBaseAmount = (baseAmount, exchangeRate = 1) => {
    return Number(baseAmount || 0) / normalizeExchangeRate(exchangeRate)
}

export const getCurrencyOptions = (source = {}) => {
    return {
        currency:
            source.currencyCode ||
            source.currency_code ||
            source.displayCurrencyCode ||
            source.display_currency_code ||
            'USD',
        symbol:
            source.currencySymbol ||
            source.currency_symbol ||
            source.displayCurrencySymbol ||
            source.display_currency_symbol ||
            null,
        exchangeRate:
            source.defaultExchangeRate ||
            source.default_exchange_rate ||
            source.exchangeRate ||
            source.exchange_rate ||
            1
    }
}

export const formatToCurrency = (amount, options = {}) => {
    const value = Number(amount || 0)
    const locale = options.locale || 'en-US'
    const currency = String(options.currency || 'USD').toUpperCase()
    const symbol = options.symbol ? String(options.symbol) : null

    if (symbol) {
        const minimumFractionDigits = options.minimumFractionDigits ?? 2
        const maximumFractionDigits = options.maximumFractionDigits ?? 2
        const sign = value < 0 ? '-' : ''
        const formatted = new Intl.NumberFormat(locale, {
            minimumFractionDigits,
            maximumFractionDigits
        }).format(Math.abs(value))

        return `${sign}${symbol}${formatted}`
    }

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: options.minimumFractionDigits,
            maximumFractionDigits: options.maximumFractionDigits
        }).format(value)
    } catch {
        const fallback = new Intl.NumberFormat(locale, {
            minimumFractionDigits: options.minimumFractionDigits ?? 2,
            maximumFractionDigits: options.maximumFractionDigits ?? 2
        }).format(value)
        return `${currency} ${fallback}`
    }
}
