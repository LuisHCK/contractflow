# Postgres Migration Plan

This document outlines the steps required to migrate the current application database from SQLite (using `bun:sqlite`) to PostgreSQL.

## 1. Environment & Dependencies

- [x] **Infrastructure**: Set up a PostgreSQL instance.
  - [x] Add a `docker-compose.yml` file to spin up a Postgres container alongside the app.
- [x] **Dependencies**: Use Bun's built-in PostgreSQL support.
  - No external package installation needed (as per Bun docs).
- [x] **Environment Variables**: Add Postgres connection details to `.env` (e.g., `DATABASE_URL`, `PGUSER`, etc.).

## 2. Database Connection Module (`src/database/index.js`)

- [x] **Connection Logic**: Update the `init` and connection logic to connect to the Postgres server instead of opening a file.
- [x] **Schema Initialization**: Move schema creation from the `database.exec(...)` block into migrations (completed with `migrations/001_initial_schema.sql`).

## 3. Schema (DDL) Updates

PostgreSQL syntax differs from SQLite in several key areas. Update all SQL files in `migrations/` and the initialization script.

- [ ] **Auto-increment usage**:
  - *SQLite*: `INTEGER PRIMARY KEY AUTOINCREMENT`
  - *Postgres*: `SERIAL PRIMARY KEY` or `INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
- [ ] **Booleans**:
  - *SQLite*: Uses `1` or `0` (e.g., `DEFAULT 1`).
  - *Postgres*: Uses `TRUE` or `FALSE` (e.g., `DEFAULT true`). Update `users.active` column definition.
- [ ] **Timestamps**:
  - Ensure `TIMESTAMP` columns use `DEFAULT CURRENT_TIMESTAMP` correctly (this is generally compatible, but verify behavior).
- [ ] **Strict Typing**: PostgreSQL is stricter with types. Ensure passed values match column types (e.g., don't pass strings for integers).

## 4. Query Refactoring (`src/database/queries.js`)

- [ ] **Parameter Syntax**:
  - *SQLite*: Uses named parameters like `:id`, `:email`.
  - *Postgres*:
    - Use `$1`, `$2`, `$3` for native parameterized queries.
    - **Action**: All queries in `src/database/queries.js` must be rewritten to use numbered parameters, OR use a library that supports named parameters as a wrapper.
- [ ] **`INSERT` Operations**:
  - Postgres does **not** return `lastInsertRowid` property on the result object.
  - **Action**: Modify every `INSERT` statement to append `RETURNING id`.
    - Example: `INSERT INTO users (...) VALUES (...) RETURNING id;`

## 5. Codebase Updates (Controllers & Services)

- [ ] **Handle Insert Returns**:
  - The code relies heavily on `result.lastInsertRowid` in controllers and services.
  - **Action**: Search and replace usages of `.lastInsertRowid`.
    - *Before*: `const id = result.lastInsertRowid;`
    - *After*: `const id = result[0].id;` (assuming the driver returns rows array).
  - **Files to check**:
    - `src/controllers/admin.js`
    - `src/controllers/users.js`
    - `src/services/*.js` (contractors, payments, projects, stages, etc.)

## 6. Data Migration (ETL)

If preserving existing data is required:

- [ ] **Export Data**: Create a script to read all data from the existing `database.db` SQLite file.
- [ ] **Import Data**: Insert the data into the new PostgreSQL instance.
- [ ] **Sequence Sync**: After importing, ensure Postgres sequences (for IDs) are updated to the max ID value to avoid primary key collisions on new inserts.
  - Example: `SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`

## 7. Migration System (`src/database/migrations.js`)

- [x] **Update Logic**: Adapted to execute Postgres queries using Bun SQL (`tx.file`, transactions, `.simple()` where needed).
- [x] **Migration Table**: `_migrations` table created with Postgres syntax (`SERIAL`, `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`).

## 8. Verification

- [ ] Verify `FOREIGN KEY` constraints are enforcing integrity as expected.
- [ ] Verify `ON CONFLICT` clauses (Upserts) work as expected (syntax is compatible but verify logic).
- [ ] Test the application flows: User creation, Project creation, Payment recording.
