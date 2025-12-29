const languages = {
    en: {
        units: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
        teens: [
            'eleven',
            'twelve',
            'thirteen',
            'fourteen',
            'fifteen',
            'sixteen',
            'seventeen',
            'eighteen',
            'nineteen'
        ],
        tens: ['ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
        thousands: ['', 'thousand', 'million', 'billion', 'trillion'],
        negative: 'negative',
        decimal: 'point'
    },
    es: {
        units: ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'],
        teens: [
            'once',
            'doce',
            'trece',
            'catorce',
            'quince',
            'dieciséis',
            'diecisiete',
            'dieciocho',
            'diecinueve'
        ],
        tens: ['diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'],
        thousands: ['', 'mil', 'millón', 'mil millones', 'billón'],
        thousandsPlural: ['', 'mil', 'millones', 'mil millones', 'billones'],
        hundred: 'ciento',
        hundredExact: 'cien',
        negative: 'menos',
        decimal: 'punto',
        and: 'y'
    }
}

/**
 * Converts a number into its word representation in the specified language.
 *
 * @param {number} num - The number to convert to words.
 * @param {string} [lang='en'] - The language code for the conversion (default is 'en').
 * @throws {Error} Throws an error if the specified language is not supported.
 * @returns {string} The word representation of the number.
 *
 * @example
 * // Assuming 'en' is the default language:
 * numberToWords(123); // "one hundred twenty-three"
 * numberToWords(-45.67); // "negative forty-five point six seven"
 * numberToWords(1000, 'en'); // "one thousand"
 */
const numberToWords = (num, lang = 'en') => {
    if (!languages[lang]) throw new Error(`Language '${lang}' is not supported.`)
    const langData = languages[lang]
    const { units, teens, tens, thousands, negative, decimal } = langData

    if (isNaN(num)) return 'Invalid number'
    if (num === 0) return units[0]

    const isNegative = num < 0
    num = Math.abs(num)

    const integerPart = Math.floor(num)
    const decimalPart = num % 1

    const integerToWords = (n) => {
        if (lang === 'es') {
            return spanishIntegerToWords(n, langData)
        }
        if (n < 10) return units[n]
        if (n < 20) return teens[n - 11]
        if (n < 100) {
            const ten = Math.floor(n / 10)
            const unit = n % 10
            return tens[ten - 1] + (unit ? `-${units[unit]}` : '')
        }
        if (n < 1000) {
            const hundred = Math.floor(n / 100)
            const remainder = n % 100
            return units[hundred] + ' hundred' + (remainder ? ` ${integerToWords(remainder)}` : '')
        }
        for (let i = 0, divisor = 1000; i < thousands.length; i++, divisor *= 1000) {
            if (n < divisor * 1000) {
                const quotient = Math.floor(n / divisor)
                const remainder = n % divisor
                return (
                    integerToWords(quotient) +
                    ' ' +
                    thousands[i] +
                    (remainder ? ` ${integerToWords(remainder)}` : '')
                )
            }
        }
    }

    const spanishIntegerToWords = (n, lang) => {
        const { units, teens, tens, thousands, thousandsPlural, hundred, hundredExact, and } = lang

        if (n < 10) return units[n]
        if (n === 10) return tens[0]
        if (n < 20) return teens[n - 11]
        if (n < 30) {
            const unit = n % 10
            return unit === 0 ? tens[1] : 'veinti' + units[unit]
        }
        if (n < 100) {
            const ten = Math.floor(n / 10)
            const unit = n % 10
            return tens[ten - 1] + (unit ? ` ${and} ${units[unit]}` : '')
        }
        if (n < 1000) {
            const hundredVal = Math.floor(n / 100)
            const remainder = n % 100
            if (hundredVal === 1) {
                return remainder === 0 ? hundredExact : `${hundred} ${spanishIntegerToWords(remainder, lang)}`
            }
            const hundredWords = ['', '', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']
            return hundredWords[hundredVal] + (remainder ? ` ${spanishIntegerToWords(remainder, lang)}` : '')
        }
        if (n < 1000000) {
            const mil = Math.floor(n / 1000)
            const remainder = n % 1000
            const milWord = mil === 1 ? 'mil' : `${spanishIntegerToWords(mil, lang)} mil`
            return milWord + (remainder ? ` ${spanishIntegerToWords(remainder, lang)}` : '')
        }
        if (n < 1000000000) {
            const millon = Math.floor(n / 1000000)
            const remainder = n % 1000000
            const millonWord = millon === 1 ? 'un millón' : `${spanishIntegerToWords(millon, lang)} millones`
            return millonWord + (remainder ? ` ${spanishIntegerToWords(remainder, lang)}` : '')
        }
        // Billions and beyond
        for (let i = 3, divisor = 1000000000; i < thousands.length; i++, divisor *= 1000) {
            if (n < divisor * 1000) {
                const quotient = Math.floor(n / divisor)
                const remainder = n % divisor
                const word = quotient === 1 ? thousands[i] : thousandsPlural[i]
                const quotientWord = quotient === 1 ? 'un' : spanishIntegerToWords(quotient, lang)
                return (
                    quotientWord +
                    ' ' +
                    word +
                    (remainder ? ` ${spanishIntegerToWords(remainder, lang)}` : '')
                )
            }
        }
    }

    const decimalToWords = (d) => {
        const decimalStr = d.toString().split('.')[1]
        return decimalStr
            .split('')
            .map((digit) => units[parseInt(digit, 10)])
            .join(' ')
    }

    const words = integerToWords(integerPart)
    const decimalWords = decimalPart ? `${decimal} ${decimalToWords(decimalPart)}` : ''

    return (isNegative ? `${negative} ` : '') + words + (decimalWords ? ` ${decimalWords}` : '')
}

export default numberToWords
