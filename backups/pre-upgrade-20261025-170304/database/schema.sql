CREATE DATABASE IF NOT EXISTS expense_tracker;

USE expense_tracker;

CREATE TABLE IF NOT EXISTS expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('INCOME', 'EXPENSE') NOT NULL,
    category VARCHAR(100) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO expenses (title, amount, type, category, transaction_date, description) VALUES
('Salary', 5000.00, 'INCOME', 'Salary', '2026-10-01', 'Monthly salary'),
('Groceries', 150.75, 'EXPENSE', 'Food', '2026-10-05', 'Weekly groceries'),
('Gas', 45.50, 'EXPENSE', 'Transport', '2026-10-08', 'Fuel refill');
