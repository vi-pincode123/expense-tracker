-- Adds recurring expense schedules and their ownership rules.
-- Apply against the expense_tracker database before starting the updated backend:
--   mysql -u root -p expense_tracker < database/migrations/004_recurring_expenses.sql

CREATE TABLE IF NOT EXISTS recurring_expenses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    owner_id BIGINT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NULL,
    start_date DATE NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    next_due_date DATE NOT NULL,
    paused TINYINT(1) NOT NULL DEFAULT 0,
    last_paid_date DATE NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_recurring_expenses_owner_due (owner_id, next_due_date),
    CONSTRAINT fk_recurring_expenses_owner
        FOREIGN KEY (owner_id) REFERENCES users (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_recurring_expenses_frequency
        CHECK (frequency IN ('WEEKLY', 'MONTHLY', 'YEARLY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
