-- Run this AFTER the first admin has been created and legacy rows have been assigned.
-- Verify first that no rows are unowned:
--   SELECT COUNT(*) FROM expenses WHERE owner_id IS NULL;
-- It should return 0.

ALTER TABLE expenses
    MODIFY COLUMN owner_id BIGINT NOT NULL;
