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
        LEFT JOIN stage s ON p.id = s.project_id AND s.deleted = 0
        LEFT JOIN payments py ON p.id = s.project_id AND s.id = py.stage_id AND py.deleted = 0
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
            LEFT JOIN stage s ON p.id = s.project_id AND s.deleted = 0
            LEFT JOIN payments py ON p.id = s.project_id AND s.id = py.stage_id AND py.deleted = 0
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
            end_date = :endDate,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id;
    `
}

export const STAGES = {
    GET_ALL: `
        SELECT s.*, ROUND((100 * COALESCE(SUM(p.amount), 0)) / s.estimated_cost, 1) AS progress,
        COALESCE(SUM(p.amount), 0) AS total_payments
        FROM stage s 
        LEFT JOIN payments p ON s.id = p.stage_id AND p.deleted = 0
        WHERE s.project_id = :projectId AND s.deleted = 0
        GROUP BY s.id;`,

    ADD: `
        INSERT INTO stage (
            project_id, name, estimated_cost, created_by, start_date, end_date, description, contractor_id
        ) 
        VALUES (
            :projectId, :name, :estimatedCost, :createdBy, :startDate, :endDate, :description, :contractorId
        );`,
    GET: `SELECT * FROM stage WHERE id = :id AND deleted = 0;`,

    UPDATE: `
        UPDATE stage
        SET name = :name,
            estimated_cost = :estimatedCost
        WHERE id = :id;`,

    GET_PROJECT_ID: `
        SELECT p.id AS project_id
        FROM stage s
        JOIN projects p ON s.project_id = p.id
        WHERE s.id = :stageId AND s.deleted = 0;`,

    SOFT_DELETE: `
        UPDATE stage
        SET deleted = 1
        WHERE id = :id;`,

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
                    ELSE (COALESCE(SUM(py.amount), 0) * 100.0) / s.estimated_cost
                END,
                1
            ) AS progress_percentage,
            (s.estimated_cost - COALESCE(SUM(py.amount), 0)) AS outstanding_balance
        FROM stage s
        JOIN projects p ON s.project_id = p.id
        LEFT JOIN payments py ON s.id = py.stage_id AND py.deleted = 0
        WHERE s.id = :stageId AND s.deleted = 0
        GROUP BY s.id;`
}

export const PAYMENTS = {
    ADD: `
        INSERT INTO payments (
            stage_id, amount, date, payer, payment_category_id, contractor_id, description, payment_method, created_by, balance, hide_totals_invoice
        ) 
        VALUES (
            :stageId, :amount, :date, :payer, :paymentCategoryId, :contractorId, :description, :paymentMethod, :createdBy, :balance, :hideTotalsInvoice
        );`,

    GET_ALL: `
        SELECT * FROM payments WHERE stage_id = :stageId AND deleted = 0 ORDER BY id DESC;`,

    GET_ALL_BY_PROJECT_ID: `
        SELECT * FROM payments p
        JOIN stage s ON p.stage_id = s.id
        WHERE s.project_id = :projectId AND p.deleted = 0
        ORDER BY date(date) ASC;`,

    GET: `
        SELECT * FROM payments WHERE id = :id AND deleted = 0;`,

    GET_PROJECT_ID: `
        SELECT p.id AS project_id
        FROM payments AS py
        INNER JOIN stage AS s ON py.stage_id = s.id
        INNER JOIN projects AS p ON s.project_id = p.id
        WHERE py.id = :paymentId AND py.deleted = 0
        LIMIT 1;`,

    GET_STAGE_ID: `
        SELECT s.id AS stage_id
        FROM payments py
        JOIN stage s ON py.stage_id = s.id
        WHERE py.id = :paymentId AND py.deleted = 0;`,

    GET_TOTAL_PAYED_AMOUNT: `
        SELECT COALESCE(SUM(amount), 0) AS total_amount
        FROM payments
        WHERE stage_id = :stageId AND deleted = 0;`,

    SOFT_DELETE: `
        UPDATE payments
        SET deleted = 1
        WHERE id = :id;`,

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
        WHERE py.stage_id = :stageId AND py.deleted = 0
        ORDER BY date(py.date) ASC, py.id ASC;`
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
        ORDER BY id DESC;`,

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
        JOIN payments py ON s.id = py.stage_id AND py.deleted = 0
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

export const SETTINGS = {
    GET: `
        SELECT * FROM settings WHERE key = :key;`,

    GET_ALL: `
        SELECT * FROM settings;`,

    GET_ALL_ACTIVE: `
        SELECT * FROM settings WHERE active = 1;`,

    ADD_OR_UPDATE: `
        INSERT INTO settings (
            key, value, details, active, created_by
        )
        VALUES (
            :key, :value, :details, :active, :createdBy
        )
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            details = excluded.details,
            active = excluded.active,
            updated_at = CURRENT_TIMESTAMP;`,

    UPDATE: `
        UPDATE settings
        SET value = :value,
            details = :details,
            active = :active,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id;`
}
