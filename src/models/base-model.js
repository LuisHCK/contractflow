import { database } from '@/database'

class BaseModel {
    static tableName = ''

    /**
     * Creates an instance of the base model.
     *
     * @constructor
     * @param {Object} data - The data object used to initialize the model.
     * @param {string} data.tableName - The name of the database table associated with the model.
     * @param {String[]} data.fields - The fields of the model.
     * @property {string} tableName - The name of the database table associated with the model.
     */
    constructor(data) {
        this.tableName = data.tableName
        this.fields = data.fields
        Object.assign(this, data)
    }

    /**
     * Retrieves all records from the database table associated with this model.
     *
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects representing the records in the table.
     */
    static findAll({ queryString = '' } = {}) {
        const query = database.query(queryString || `SELECT * FROM ${BaseModel.tableName}`)
        return query.all()
    }


    /**
     * Finds a record by its ID in the database.
     *
     * @param {Object} params - The parameters for the query.
     * @param {number|string} params.id - The ID of the record to find. This is required.
     * @param {string} [params.queryString=''] - An optional custom SQL query string. Defaults to a query that selects all columns from the table where the ID matches.
     * @throws {Error} Throws an error if the ID is not provided.
     * @returns {Promise<Object>} A promise that resolves to the record found in the database.
     */
    static findById({ id, queryString = '' } = {}) {
        if (!id) {
            throw new Error('ID is required to find a record')
        }

        const query = queryString || `SELECT * FROM ${BaseModel.tableName} WHERE id = ?`

        return database.query(query).get(id)
    }

    /**
     * Inserts a new record into the database table associated with this model.
     *
     * @param {Object} data - An object containing the key-value pairs to be inserted into the table.
     * @returns {Object} The inserted record, including the newly generated `id` and the original data.
     */
    static create(data) {
        const keys = Object.keys(data).filter((key) => key !== 'id')
        const values = Object.values(data)
        const placeholders = keys.map(() => '?').join(',')

        if (keys.length === 0) {
            throw new Error('No data provided for insertion')
        }

        if (values.length !== keys.length) {
            throw new Error('Data and keys length mismatch')
        }

        if (values.some((value) => value === undefined || value === null)) {
            throw new Error('Null or undefined values are not allowed')
        }

        const query = `INSERT INTO ${BaseModel.tableName} (${keys.join(
            ', '
        )}) VALUES (${placeholders})`
        const stmt = database.query(query)
        stmt.run(...values)

        return { id: database.lastInsertRowId, ...data }
    }

    /**
     * Updates a record in the database table associated with this model.
     *
     * @param {number|string} id - The unique identifier of the record to update.
     * @param {Object} data - An object containing the fields and their new values to update in the record.
     * @returns {Object} An object containing the updated record's ID and the new data.
     */
    update(data) {
        const fields = this.fields
            .filter((field) => field.name !== 'id')
            .map((field) => `${field.name} = ?`)
            .join(', ')
        const values = Object.values(data)

        const query = `UPDATE ${BaseModel.tableName} SET ${fields} WHERE id = ?`
        const stmt = database.query(query)
        stmt.run(...values, this.id)

        return { id: this.id, ...data }
    }

    /**
     * Saves the current state of the model instance to the database.
     * If the instance has an ID, it updates the existing record.
     * If it doesn't, it creates a new record.
     */
    save() {
        if (this.id) {
            return this.update(this)
        } else {
            return BaseModel.create(this)
        }
    }

    /**
     * Deletes a record from the database table associated with this model.
     *
     * @param {number|string} id - The unique identifier of the record to be deleted.
     * @returns {{ deletedId: number|string }} An object containing the ID of the deleted record.
     */
    delete(_id) {
        database.query(`DELETE FROM ${BaseModel.tableName} WHERE id = ?`).run(this.id)
        return { deletedId: this.id }
    }
}

export default BaseModel
