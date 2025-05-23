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
    }
    // Add more languages here
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
    const { units, teens, tens, thousands, negative, decimal } = languages[lang]

    if (isNaN(num)) return 'Invalid number'
    if (num === 0) return units[0]

    const isNegative = num < 0
    num = Math.abs(num)

    const integerPart = Math.floor(num)
    const decimalPart = num % 1

    const integerToWords = (n) => {
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
