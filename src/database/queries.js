export const USERS = {
    GET_ALL: `
        SELECT * FROM users;`,

    GET: `
        SELECT * FROM users WHERE id = :id;`,

    ADD: `
        INSERT INTO users (
            password, email, role, active, name
        )
        VALUES (
            :password, :email, :role, :active, :name
        );`,

    COUNT: `
        SELECT COUNT(*) AS count FROM users;`,

    UPDATE: `
        UPDATE users
        SET password = :password,
            email = :email,
            role = :role,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id;`,

    FIND_BY_EMAIL: `
        SELECT * FROM users WHERE email = :email;`
}

export const PROJECTS = {
    GET_ALL: `
        SELECT 
        p.*, 
        COALESCE(
            SUM(DISTINCT s.estimated_cost), 
            0
        ) AS total_estimated_cost, 
        COALESCE(
            SUM(py.amount), 
            0
        ) AS actual_cost 
        FROM 
        projects p 
        LEFT JOIN stage s ON p.id = s.project_id 
        LEFT JOIN payments py ON s.id = py.stage_id 
        GROUP BY 
        p.id;`,

    ADD: `
        INSERT INTO projects (
            name, description, start_date, end_date, status, created_by
        ) 
        VALUES (
            :name, :description, :startDate, :endDate, :status, :createdBy
        );`,

    GET: `
        SELECT 
            p.*, 
        COALESCE(
            SUM(DISTINCT s.estimated_cost), 
            0
        ) AS total_estimated_cost, 
        COALESCE(
            SUM(py.amount), 
            0
        ) AS actual_cost 
        FROM 
            projects p 
            LEFT JOIN stage s ON p.id = s.project_id 
            LEFT JOIN payments py ON s.id = py.stage_id 
        WHERE 
            p.id = :id 
        GROUP BY 
            p.id;`,

    UPDATE: `
        UPDATE projects
        SET name = :name,
            description = :description,
            start_date = :startDate,
            status = :status,
            end_date = :endDate
            created_by = :createdBy,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id;
    `
}

export const STAGES = {
    GET_ALL: `
        SELECT s.*, ROUND((100 * COALESCE(SUM(p.amount), 0)) / s.estimated_cost, 1) AS progress,
        COALESCE(SUM(p.amount), 0) AS total_payments
        FROM stage s 
        LEFT JOIN payments p ON s.id = p.stage_id 
        WHERE s.project_id = :projectId 
        GROUP BY s.id;`,

    ADD: `
        INSERT INTO stage (
            project_id, name, estimated_cost, created_by, start_date, end_date, description, contractor_id
        ) 
        VALUES (
            :projectId, :name, :estimatedCost, :createdBy, :startDate, :endDate, :description, :contractorId
        );`,
    GET: `SELECT * FROM stage WHERE id = :id;`,

    UPDATE: `
        UPDATE stage
        SET name = :name,
            estimated_cost = :estimatedCost
        WHERE id = :id;`,

    GET_PROJECT_ID: `
        SELECT p.id AS project_id
        FROM stage s
        JOIN projects p ON s.project_id = p.id
        WHERE s.id = :stageId;`
}

export const PAYMENTS = {
    ADD: `
        INSERT INTO payments (
            stage_id, amount, date, payer, payment_category_id, contractor_id, description, payment_method, created_by
        ) 
        VALUES (
            :stageId, :amount, :date, :payer, :paymentCategoryId, :contractorId, :description, :paymentMethod, :createdBy
        );`,

    GET_ALL: `
        SELECT * FROM payments WHERE stage_id = :stageId ORDER BY date(date) ASC;`,

    GET_ALL_BY_PROJECT_ID: `
        SELECT * FROM payments p
        JOIN stage s ON p.stage_id = s.id
        WHERE s.project_id = :projectId
        ORDER BY date(date) ASC;`,

    GET: `
        SELECT * FROM payments WHERE id = :id;`,

    GET_PROJECT_ID: `
        SELECT p.id AS project_id
        FROM payments py
        JOIN stage s ON py.stage_id = s.id
        JOIN projects p ON s.project_id = p.id
        WHERE py.id = :paymentId;`,

    GET_STAGE_ID: `
        SELECT s.id AS stage_id
        FROM payments py
        JOIN stage s ON py.stage_id = s.id
        WHERE py.id = :paymentId;`
}

export const PAYMENT_CATEGORIES = {
    GET: `SELECT * FROM payment_categories WHERE id = :id;`,

    GET_ALL: `
        SELECT * FROM payment_categories;`,

    ADD: `
        INSERT INTO payment_categories (name, description) 
        VALUES (:name, :description);`,

    ADD_OR_UPDATE: `
        INSERT INTO payment_categories (name, description)
        VALUES (:name, :description)
        ON CONFLICT(name) DO UPDATE SET
            description = excluded.description;`,

    UPDATE: `
        UPDATE payment_categories
        SET name = :name,
            description = :description
        WHERE id = :id;`
}

export const CONTRACTORS = {
    // Get all contractors
    GET_ALL: `
        SELECT * FROM contractors
        ORDER BY name ASC;`,

    // Get a single contractor by ID
    GET: `
        SELECT * FROM contractors
        WHERE id = :id;`,

    // Add a new contractor
    ADD: `
        INSERT INTO contractors (
            name, email, phone, address
        ) 
        VALUES (
            :name, :email, :phone, :address
        );`,

    // Update an existing contractor
    UPDATE: `
        UPDATE contractors
        SET name = :name,
            email = :email,
            phone = :phone,
            address = :address,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id;`,

    // Delete a contractor by ID
    DELETE: `
        DELETE FROM contractors
        WHERE id = :id;`,

    // Get all contractors for a specific project
    PROJECTS: `
        SELECT DISTINCT 
            p.id AS project_id,
            p.name AS project_name
        FROM 
            projects p
        JOIN stage s ON p.id = s.project_id
        JOIN payments py ON s.id = py.stage_id
        WHERE 
            py.contractor_id = :id
        ORDER BY p.start_date ASC
        LIMIT 10 OFFSET 0;`
}

export const EVIDENCES = {
    ADD: `
        INSERT INTO evidences (
            payment_id, file_path, description, created_by
        ) 
        VALUES (
            :paymentId, :filePath, :description, :createdBy
        );`,

    GET_ALL: `
        SELECT * FROM evidences WHERE payment_id = :paymentId;`,

    GET: `
        SELECT * FROM evidences WHERE id = :id;`,

    GET_PROJECT_ID: `
        SELECT p.id AS project_id
        FROM payments py
        JOIN stage s ON py.stage_id = s.id
        JOIN projects p ON s.project_id = p.id
        WHERE py.id = :paymentId;`,

    GET_STAGE_ID: `
        SELECT s.id AS stage_id
        FROM payments py
        JOIN stage s ON py.stage_id = s.id
        WHERE py.id = :paymentId;`
}
