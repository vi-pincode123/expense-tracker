-- Adds optional profile fields to the users table.
-- Apply against the expense_tracker database before starting the updated backend:
--   mysql -u root -p expense_tracker < database/migrations/003_user_profile.sql

ALTER TABLE users
    ADD COLUMN phone_number VARCHAR(30) NULL AFTER active,
    ADD COLUMN date_of_birth DATE NULL AFTER phone_number,
    ADD COLUMN gender VARCHAR(20) NULL AFTER date_of_birth,
    ADD COLUMN address VARCHAR(500) NULL AFTER gender;
