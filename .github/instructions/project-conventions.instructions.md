---
description: "Use when writing database queries, services, controllers, or SQL migrations in this project. Covers Postgres query style, INSERT returns, soft deletes, error handling, and migration syntax."
---
# ContractorPay Project Conventions

## Stack

- Runtime: **Bun**. Framework: **Express 5 + EJS**. Database: **PostgreSQL** via Bun's built-in SQL client.
- ES6 modules (`import`/`export`) throughout — no CommonJS.

## Database Queries

- Use **positional parameters** `$1, $2, $3` — never SQLite-style named params (`:name`, `:email`).
- All SQL strings belong in `src/database/queries.js` as named constants. **Never write raw SQL inline** in services or controllers.
  ```javascript
  // src/database/queries.js
  export const USERS = {
    GET: 'SELECT * FROM users WHERE id = $1 AND deleted = false',
    ADD: 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
  }
  ```
- Execute via `database.unsafe(QUERY_CONSTANT, [params])`. For simple one-off queries, use template literals: `` database`SELECT ...` ``.

## INSERT — Always Use `RETURNING id`

- Every `INSERT` must end with `RETURNING id`. Never use `lastInsertRowid` — it does not exist in this project.
  ```javascript
  // services/users.js
  const rows = await database.unsafe(USERS.ADD, [name, email, passwordHash])
  const id = rows[0].id
  ```

## Soft Deletes

- **Never hard-delete rows.** Set `deleted = true` and filter all reads with `WHERE deleted = false`.
  ```sql
  UPDATE users SET deleted = true WHERE id = $1
  ```

## Model Wrapping

- Always wrap DB rows in the corresponding model class before returning from a service.
  ```javascript
  const rows = await database.unsafe(USERS.GET, [id])
  return rows[0] ? new User(rows[0]) : null
  ```

## Service Error Handling

- Service functions must catch errors internally and return `null` on failure. Do not let exceptions propagate to controllers.
  ```javascript
  export const getUserById = async (id) => {
    try {
      const rows = await database.unsafe(USERS.GET, [id])
      return rows[0] ? new User(rows[0]) : null
    } catch (error) {
      console.error(`Error fetching user ${id}: ${error}`)
      return null
    }
  }
  ```

## Controller Error Handling

- Every controller action must use `try/catch` and render the form view with a `messages` array on error.
  ```javascript
  export const create = async (req, res) => {
    const FORM_VIEW = 'app/users/new'
    try {
      // ...
    } catch (error) {
      console.error(`Error creating user: ${error.message}`)
      return res.render(FORM_VIEW, { messages: [{ content: 'Something went wrong.', type: 'danger' }] })
    }
  }
  ```

## SQL Migrations

- New files go in `migrations/` named `{###}_{description}.sql`.
- Use **PostgreSQL syntax only**:
  - `SERIAL PRIMARY KEY` (not `INTEGER PRIMARY KEY AUTOINCREMENT`)
  - `BOOLEAN` with `DEFAULT true` / `DEFAULT false` (not `1` / `0`)
  - `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
  - `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`
