-- One-time migration for the existing Expense Tracker database.
-- Run this against the expense_tracker database BEFORE starting the new backend:
--   mysql -u root -p expense_tracker < database/migrations/001_auth_and_ownership.sql
--
-- The owner_id column is nullable during the migration so existing rows are preserved.
-- The secure first-admin bootstrap assigns those legacy rows to the first admin.

CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(190) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'USER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE expenses
    ADD COLUMN owner_id BIGINT NULL AFTER id,
    ADD KEY idx_expenses_owner_date (owner_id, transaction_date),
    ADD CONSTRAINT fk_expenses_owner
        FOREIGN KEY (owner_id) REFERENCES users (id)
        ON DELETE RESTRICT ON UPDATE CASCADE;
