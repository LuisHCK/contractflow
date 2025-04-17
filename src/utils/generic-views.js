/**
 * @typedef {Object} Form
 * @property {Array<Object>} fields - An array of field objects.
 */

/**
 * Formats an array of data objects by adding an `actions` property to each object.
 * The `actions` property is a function that generates an HTML string for a "View" button.
 *
 * @param {Object} params - The parameters for the function.
 * @param {Array<Object>} params.data - The array of data objects to format. Defaults to an empty array.
 * @param {string} params.baseRoute - The base route used to generate the "View" button link. Defaults to an empty string.
 * @returns {Array<Object>} A new array of data objects with an added `actions` property.
 */
export const formatData = ({ data = [], baseRoute = '' }) => {
    return data.map((item) => ({
        ...item,
        actions: () => `<a href="/${baseRoute}/show/${item.id}" class="button is-small">View</a>` // TODO: Add customizable actions
    }))
}

/**
 * Formats the fields of a form by extracting their names and appending an "actions" field.
 *
 * @param {Object} options - The options object.
 * @param {Form} [options.form={}] - The form object containing fields.
 * @param {Array} [options.form.fields=[]] - An array of field objects, each containing a `name` property.
 * @returns {Array<string>} An array of field names with "actions" appended.
 */
export const formatFields = ({ form = {} }) => {
    const fields = form.fields.map((field) => field.name)
    fields.push('actions')

    return fields
}

/**
 * Formats page data for use in a table view.
 *
 * @param {Object} params - The parameters for formatting the page data.
 * @param {Array} params.data - The raw data to be formatted.
 * @param {Object} [params.form={}] - The form configuration object.
 * @param {string} [params.baseRoute=''] - The base route for navigation paths.
 * @param {string} [params.title=''] - The title of the page.
 * @param {string} [params.description=''] - The description of the page.
 * @param {boolean} [params.showCreate=false] - Whether to show the "Create" button.
 * @returns {Object} The formatted page data.
 * @returns {Array} returns.data - The formatted data for the table.
 * @returns {Array} returns.fields - The formatted fields for the form.
 * @returns {string} returns.title - The title of the page.
 * @returns {string} returns.description - The description of the page.
 * @returns {boolean} returns.showCreate - Indicates if the "Create" button should be displayed.
 * @returns {string} returns.createPath - The path for creating a new item.
 */
export const formatTableViewData = ({
    data,
    form = {},
    baseRoute = '',
    title = '',
    description = '',
    showCreate = false
}) => {
    const formattedData = formatData({ data, baseRoute })
    const fields = formatFields({ form })

    return {
        data: formattedData,
        fields,
        title,
        description,
        showCreate,
        createPath: `/${baseRoute}/create`
    }
}

export const formatDetailViewData = ({
    data,
    form = {},
    baseRoute = '',
    title = '',
    description = ''
}) => {
    const fields = formatFields({ form })

    return {
        data,
        fields,
        title,
        description,
        showCreate: false,
        baseRoute
    }
}
