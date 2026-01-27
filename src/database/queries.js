export const USERS = {
    GET_ALL: `
        SELECT * FROM users;`,

    GET: `
        SELECT * FROM users WHERE id = $1;`,

    ADD: `
        INSERT INTO users (
            password, email, role, active, name, updated_at
        )
        VALUES (
            $1, $2, $3, $4, $5, CURRENT_TIMESTAMP
        )
        RETURNING id;`,

    COUNT: `
        SELECT COUNT(*) AS count FROM users;`,

    UPDATE: `
        UPDATE users
        SET password = $1,
            email = $2,
            role = $3,
            name = $4,
            active = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id;`,

    UPDATE_ROLE: `
        UPDATE users
        SET role = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id;`,

    FIND_BY_EMAIL: `
        SELECT * FROM users WHERE email = $1;`
}

export const PROJECTS = {
    GET_ALL: `
        SELECT 
        p.*, 
        COALESCE(
            SUM(s.estimated_cost), 
            0
        ) AS total_estimated_cost, 
        COALESCE(
            SUM(py.amount), 
            0
        ) AS actual_cost 
        FROM 
        projects p 
        LEFT JOIN stage s ON p.id = s.project_id AND s.deleted = false
        LEFT JOIN payments py ON s.id = py.stage_id AND py.deleted = false
        WHERE p.deleted = false
        GROUP BY 
        p.id;`,

    ADD: `
        INSERT INTO projects (
            name, description, start_date, end_date, status, created_by
        ) 
        VALUES (
            $1, $2, $3, $4, $5, $6
        )
        RETURNING id;`,

    GET: `
        SELECT 
            p.*, 
        COALESCE(
            SUM(s.estimated_cost), 
            0
        ) AS total_estimated_cost, 
        COALESCE(
            SUM(py.amount), 
            0
        ) AS actual_cost 
        FROM 
            projects p 
            LEFT JOIN stage s ON p.id = s.project_id AND s.deleted = false
            LEFT JOIN payments py ON s.id = py.stage_id AND py.deleted = false
        WHERE 
            p.id = $1 AND p.deleted = false
        GROUP BY 
            p.id;`,

    UPDATE: `
        UPDATE projects
        SET name = $1,
            description = $2,
            start_date = $3,
            status = $4,
            end_date = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6;
    `,

    SOFT_DELETE: `
        UPDATE projects
        SET deleted = true
        WHERE id = $1;`,

    RECOVER: `
        UPDATE projects
        SET deleted = false
        WHERE id = $1;`
}

export const STAGES = {
    GET_ALL: `
        SELECT s.*, ROUND(
            CASE WHEN s.estimated_cost = 0 THEN 0
                 ELSE ((100.0 * COALESCE(SUM(p.amount), 0)) / s.estimated_cost)::numeric
            END, 1
        ) AS progress,
        COALESCE(SUM(p.amount), 0) AS total_payments
        FROM stage s 
        LEFT JOIN payments p ON s.id = p.stage_id AND p.deleted = false
        WHERE s.project_id = $1 AND s.deleted = false
        GROUP BY s.id;`,

    ADD: `
        INSERT INTO stage (
            project_id, name, estimated_cost, created_by, start_date, end_date, description, contractor_id
        ) 
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
        )
        RETURNING id;`,
    GET: `SELECT * FROM stage WHERE id = $1 AND deleted = false;`,

    UPDATE: `
        UPDATE stage
        SET name = $1,
            estimated_cost = $2
        WHERE id = $3;`,

    GET_PROJECT_ID: `
        SELECT p.id AS project_id
        FROM stage s
        JOIN projects p ON s.project_id = p.id
        WHERE s.id = $1 AND s.deleted = false;`,

    SOFT_DELETE: `
        UPDATE stage
        SET deleted = true
        WHERE id = $1;`,

        RECOVER: `
            UPDATE stage
            SET deleted = false
            WHERE id = $1;`,

    REPORT_SUMMARY: `
        SELECT 
            s.id AS stage_id,
            s.name AS stage_name,
            s.description AS stage_description,
            s.estimated_cost AS estimated_cost,
            s.start_date AS stage_start_date,
            s.end_date AS stage_end_date,
            p.id AS project_id,
            p.name AS project_name,
            p.status AS project_status,
            p.description AS project_description,
            COALESCE(SUM(py.amount), 0) AS total_paid,
            COUNT(py.id) AS payments_count,
            ROUND(
                CASE 
                    WHEN s.estimated_cost = 0 THEN 0
                    ELSE ((COALESCE(SUM(py.amount), 0) * 100.0) / s.estimated_cost)::numeric
                END,
                1
            ) AS progress_percentage,
            (s.estimated_cost - COALESCE(SUM(py.amount), 0)) AS outstanding_balance
        FROM stage s
        JOIN projects p ON s.project_id = p.id
        LEFT JOIN payments py ON s.id = py.stage_id AND py.deleted = false
        WHERE s.id = $1 AND s.deleted = false
        GROUP BY s.id;`
}

export const PAYMENTS = {
    ADD: `
        INSERT INTO payments (
            stage_id, amount, date, payer, payment_category_id, contractor_id, description, payment_method, created_by, balance, hide_totals_invoice
        ) 
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        RETURNING id;`,

    GET_ALL: `
        SELECT * FROM payments WHERE stage_id = $1 AND deleted = false ORDER BY id DESC;`,

    GET_ALL_BY_PROJECT_ID: `
        SELECT * FROM payments p
        JOIN stage s ON p.stage_id = s.id
        WHERE s.project_id = $1 AND p.deleted = false
        ORDER BY date ASC;`,

    GET: `
        SELECT * FROM payments WHERE id = $1 AND deleted = false;`,

    GET_PROJECT_ID: `
        SELECT p.id AS project_id
        FROM payments AS py
        INNER JOIN stage AS s ON py.stage_id = s.id
        INNER JOIN projects AS p ON s.project_id = p.id
        WHERE py.id = $1 AND py.deleted = false
        LIMIT 1;`,

    GET_STAGE_ID: `
        SELECT s.id AS stage_id
        FROM payments py
        JOIN stage s ON py.stage_id = s.id
        WHERE py.id = $1 AND py.deleted = false;`,

    GET_TOTAL_PAYED_AMOUNT: `
        SELECT COALESCE(SUM(amount), 0) AS total_amount
        FROM payments
        WHERE stage_id = $1 AND deleted = false;`,

    SOFT_DELETE: `
        UPDATE payments
        SET deleted = true
        WHERE id = $1;`,

        RECOVER: `
            UPDATE payments
            SET deleted = false
            WHERE id = $1;`,

    REPORT_BY_STAGE: `
        SELECT 
            py.id,
            py.amount,
            py.date,
            py.payer,
            py.payment_method,
            py.description,
            py.balance,
            py.created_at,
            COALESCE(c.name, '') AS contractor_name,
            COALESCE(pc.name, '') AS payment_category_name
        FROM payments py
        LEFT JOIN contractors c ON py.contractor_id = c.id
        LEFT JOIN payment_categories pc ON py.payment_category_id = pc.id
        WHERE py.stage_id = $1 AND py.deleted = false
        ORDER BY py.date ASC, py.id ASC;`
}

export const PAYMENT_CATEGORIES = {
    GET: `SELECT * FROM payment_categories WHERE id = $1;`,

    GET_ALL: `
        SELECT * FROM payment_categories;`,

    ADD: `
        INSERT INTO payment_categories (name, description) 
        VALUES ($1, $2)
        RETURNING id;`,

    ADD_OR_UPDATE: `
        INSERT INTO payment_categories (name, description)
        VALUES ($1, $2)
        ON CONFLICT(name) DO UPDATE SET
            description = excluded.description;`,

    UPDATE: `
        UPDATE payment_categories
        SET name = $1,
            description = $2
        WHERE id = $3;`
}

export const CONTRACTORS = {
    // Get all contractors
    GET_ALL: `
        SELECT * FROM contractors
        ORDER BY id DESC;`,

    // Get a single contractor by ID
    GET: `
        SELECT * FROM contractors
        WHERE id = $1;`,

    // Add a new contractor
    ADD: `
        INSERT INTO contractors (
            name, email, phone, address
        ) 
        VALUES (
            $1, $2, $3, $4
        )
        RETURNING id;`,

    // Update an existing contractor
    UPDATE: `
        UPDATE contractors
        SET name = $1,
            email = $2,
            phone = $3,
            address = $4
        WHERE id = $5;`,

    // Delete a contractor by ID
    DELETE: `
        DELETE FROM contractors
        WHERE id = $1;`,

    // Get all contractors for a specific project
    PROJECTS: `
        SELECT DISTINCT 
            p.id AS project_id,
            p.name AS project_name
        FROM 
            projects p
        JOIN stage s ON p.id = s.project_id
        JOIN payments py ON s.id = py.stage_id AND py.deleted = false
        WHERE 
            py.contractor_id = $1 AND py.deleted = false
        ORDER BY p.start_date ASC
        LIMIT 10 OFFSET 0;`
}

export const EVIDENCES = {
    ADD: `
        INSERT INTO evidences (
            payment_id, file_path, description, created_by
        ) 
        VALUES (
            $1, $2, $3, $4
        )
        RETURNING id;`,

    GET_ALL: `
        SELECT * FROM evidences WHERE payment_id = $1;`,

    GET: `
        SELECT * FROM evidences WHERE id = $1;`,

    GET_PROJECT_ID: `
        SELECT p.id AS project_id
        FROM payments py
        JOIN stage s ON py.stage_id = s.id
        JOIN projects p ON s.project_id = p.id
        WHERE py.id = $1;`,

    GET_STAGE_ID: `
        SELECT s.id AS stage_id
        FROM payments py
        JOIN stage s ON py.stage_id = s.id
        WHERE py.id = $1;`
}

export const SETTINGS = {
    GET: `
        SELECT * FROM settings WHERE key = $1;`,

    GET_ALL: `
        SELECT * FROM settings;`,

    GET_ALL_ACTIVE: `
        SELECT * FROM settings WHERE active = true;`,

    ADD_OR_UPDATE: `
        INSERT INTO settings (
            key, value, details, active, created_by
        )
        VALUES (
            $1, $2, $3, $4, $5
        )
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            details = excluded.details,
            active = excluded.active,
            updated_at = CURRENT_TIMESTAMP;`,

    UPDATE: `
        UPDATE settings
        SET value = $1,
            details = $2,
            active = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4;`
}

export const ADMIN = {
    COUNT_USERS: `
        SELECT COUNT(*) AS count FROM users;`,

    COUNT_PROJECTS: `
        SELECT COUNT(*) AS count FROM projects;`,

    COUNT_CONTRACTORS: `
        SELECT COUNT(*) AS count FROM contractors;`,

    GET_ALL_USERS: `
        SELECT id, name, email, role, active 
        FROM users 
        ORDER BY id DESC;`,

    GET_DELETED_PROJECTS: `
        SELECT * FROM projects WHERE deleted = true ORDER BY id DESC;`,

    GET_DELETED_STAGES: `
        SELECT s.id, s.name, s.project_id, s.estimated_cost, s.deleted,
               p.name AS project_name, p.created_at
        FROM stage s
        JOIN projects p ON s.project_id = p.id
        WHERE s.deleted = true
        ORDER BY s.id DESC;`,

    GET_DELETED_PAYMENTS: `
        SELECT py.id, py.amount, py.date, py.payer, py.deleted, py.created_at,
               s.name AS stage_name, p.name AS project_name
        FROM payments py
        JOIN stage s ON py.stage_id = s.id
        JOIN projects p ON s.project_id = p.id
        WHERE py.deleted = true
        ORDER BY py.id DESC;`,

    IMPORT_CONTRACTOR: `
        INSERT INTO contractors (name, email, phone, address) 
        VALUES ($1, $2, $3, $4)
        RETURNING id;`,

    GET_PAYMENT_CATEGORY_ID_BY_NAME: `
        SELECT id FROM payment_categories WHERE name = $1;`,
    
    IMPORT_PAYMENT_CATEGORY: `
        INSERT INTO payment_categories (name, description) 
        VALUES ($1, $2)
        RETURNING id;`,
    
    IMPORT_PROJECT: `
        INSERT INTO projects (name, description, start_date, status, end_date, created_by) 
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;`,
    
    IMPORT_STAGE: `
        INSERT INTO stage (name, project_id, estimated_cost, final_cost, start_date, end_date, description, contractor_id, created_by) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;`,
    
    IMPORT_PAYMENT: `
        INSERT INTO payments (stage_id, payment_category_id, contractor_id, description, payment_method, amount, balance, date, payer, evidence, created_by) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id;`,
    
    CHECK_USER_EXISTS: `
        SELECT id FROM users WHERE id = $1;`,

    EXPORT_CONTRACTORS: `SELECT * FROM contractors;`,
    
    EXPORT_PAYMENT_CATEGORIES: `SELECT * FROM payment_categories;`,
    
    EXPORT_PROJECTS: `SELECT * FROM projects;`,
    
    EXPORT_STAGES: `SELECT * FROM stage;`,
    
    EXPORT_PAYMENTS: `SELECT * FROM payments;`
}
