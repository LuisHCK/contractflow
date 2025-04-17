/**
 * Populates a form object with data by mapping the values from the data object
 * to the corresponding fields in the form based on field names.
 *
 * @param {Object} params - The parameters object.
 * @param {Object} params.form - The form object to be populated.
 * @param {Array} params.form.fields - An array of field objects in the form.
 * @param {Object} params.data - The data object containing values to populate the form.
 * @param {string} params.error - An optional error message to be displayed.
 * @returns {Object} The updated form object with populated field values.
 */
export const populateForm = ({ form = {}, data = {}, error = '' }) => {
    const updatedForm = {
        ...form,
        error,
        fields: form.fields.map((field) => {
            let value
            // Check if the field is a select field
            if (field.type === 'select') {
                // Check if the field has options
                if (!field.options?.length) {
                    field.options = data[field.name] || []
                }
            }
            // Check if the field is a checkbox
            else if (field.type === 'checkbox') {
                // Set the checked property based on the data value
                field.checked = data[field.name] === 'true'
            }
            // Check if the field is a radio button
            else if (field.type === 'radio') {
                // Map the options to include a checked property based on the data value
                field.options = field.options.map((option) => ({
                    ...option,
                    checked: option.value === data[field.name]
                }))
            }
            // add generic field value
            else {
                value = data[field.name]
            }
            return { ...field, value }
        })
    }

    return updatedForm
}

/**
 * Formats an array of objects into a specific structure for options.
 *
 * @param {Object} params - The parameters object.
 * @param {Array} [params.items=[]] - The array of items to format.
 * @param {string} [params.key='id'] - The key to use for the `value` property in the formatted object.
 * @param {string} [params.value='name'] - The key to use for the `label` property in the formatted object.
 * @returns {Array<{ value: any, label: any }>} An array of formatted objects with `value` and `label` properties.
 */
export const formatOptions = ({ items = [], key = 'id', value = 'name' }) => {
    if (!Array.isArray(items)) {
        return []
    }

    return items.map((category) => ({
        value: category[key],
        label: category[value]
    }))
}
