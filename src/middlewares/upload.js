import multer from 'multer'
import { randomUUIDv7 } from 'bun'
import { mkdir } from "node:fs/promises";

/**
 * Filters uploaded files to allow only image files with specific extensions.
 *
 * @param {Object} _req - The HTTP request object (not used in this function).
 * @param {Object} file - The file object representing the uploaded file.
 * @param {Function} cb - A callback function to indicate whether the file is accepted or rejected.
 * @returns {void} - Calls the callback with an error if the file is not an image, otherwise accepts the file.
 */
const fileFilter = (_req, file, cb) => {
    // Accept most common documents and images
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|docx|xlsx|pptx|txt|pdf|json)$/i)) {
        return cb(new Error('Only image files are allowed!'), false)
    }
    cb(null, true)
}

/**
 * Configures the storage engine for multer to handle file uploads.
 *
 * The storage engine saves uploaded files to a directory named after the current date
 * (in the format `YYYY-MM-DD`) inside the `uploads` folder. Each file is assigned a
 * unique filename using a UUID and retains its original file extension.
 *
 * @type {import('multer').StorageEngine}
 * @property {Function} destination - Determines the destination folder for uploaded files.
 * @property {Function} filename - Generates a unique filename for each uploaded file.
 */
const storage = multer.diskStorage({
    destination: async (_req, _file, callback) => {
        const currentDate = new Date().toISOString().split('T')[0]
        const destination = `./uploads/${currentDate}`
        // Create the directory if it doesn't exist
        await mkdir(destination, { recursive: true })
        // Set the destination for the uploaded file
        callback(null, destination)
    },
    filename: (_req, file, callback) => {
        const id = randomUUIDv7()
        const ext = file.originalname.split('.').pop()
        callback(null, `${id}.${ext}`) // Generate a unique filename
    }
})

/**
 * Middleware for handling file uploads using Multer.
 *
 * This middleware is configured with the following options:
 * - `storage`: Specifies the storage engine for uploaded files.
 * - `fileFilter`: A function to control which files are accepted.
 * - `limits.fileSize`: Limits the size of uploaded files to 5MB.
 *
 * @type {import("express").RequestHandler}
 */
export const uploadFileMiddleware = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }
})
