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
            name, description, start_date, end_date, status
        ) 
        VALUES (
            :name, :description, :startDate, :endDate, :status
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
            project_id, name, estimated_cost, created_by
        ) 
        VALUES (
            :projectId, :name, :estimatedCost, :createdBy
        );`,
    GET: `SELECT * FROM stage WHERE id = :id;`,

    UPDATE: `
        UPDATE stage
        SET name = :name,
            estimated_cost = :estimatedCost
        WHERE id = :id;`
}

export const PAYMENTS = {
    ADD: `
        INSERT INTO payments (
            stage_id, amount, date, payer, payee
        ) 
        VALUES (
            :stageId, :amount, :date, :payer, :payee
        );`,
    
    GET_ALL: `
        SELECT * FROM payments WHERE stage_id = :stageId ORDER BY date(date) ASC;`
}
