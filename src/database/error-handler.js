export const formatSQLiteError = (error) => {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const field = error.message.split('UNIQUE constraint failed: ')[1]?.split('.')[1]
        return {
            field,
            message: `The ${field} is already in use. Please use a different value.`
        }
    }

    // Default error format for other cases
    return {
        field: null,
        message: 'An unexpected error occurred. Please try again.'
    }
}
