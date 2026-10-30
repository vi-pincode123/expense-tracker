# MySQL Database Setup

## Requirements

- MySQL 8.0+
- A MySQL account that can create databases, tables, indexes, and foreign keys
- The MySQL command-line client (or MySQL Workbench)

The backend expects the database named `expense_tracker` by default. Override it with
`DB_URL` if needed.

## Fresh Installation

From the project root in PowerShell:

```powershell
# mysql.exe is normally on PATH after a standard MySQL install.
# If it is not, point $mysql at your own installation:
# $mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$mysql = "mysql"

Get-Content .\database\schema.sql -Raw | & $mysql -u root -p
```

`database/schema.sql` creates:

- `users`: account identity, BCrypt password hash, role (`ADMIN` or `USER`), active flag,
  optional profile fields (`phone_number`, `date_of_birth`, `gender`, `address`), and
  timestamps.
- `expenses`: owner-scoped transactions. `owner_id` is required and references `users(id)`
  with `ON DELETE RESTRICT`.
- `recurring_expenses`: owner-scoped recurring schedules with amount, category, description,
  start date, frequency, next due date, pause state, and last paid date.

The fresh-install schema already includes everything added by migrations 001 through 004;
the migrations are only needed when upgrading an existing database. The schema intentionally
contains no sample users or expenses. Create the first admin with the backend bootstrap process
described in the root `README.md`.

## Upgrading an Existing Database

Existing installations may have an `expenses` table but no `users` table and no ownership
column. Use the numbered migrations in order. Do not skip the first-admin bootstrap between
migrations 001 and 002. Run the commands in this section from the repository root.

### 1. Back up the database

```powershell
# Run from the repository root. Set $mysqldump if it is not on PATH.
# $mysqldump = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
$mysqldump = "mysqldump"
$mysql = "mysql"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path .\backups | Out-Null
$backup = ".\backups\expense_tracker-$stamp.sql"
& $mysqldump -u root -p --single-transaction --routines --triggers `
  --result-file="$backup" expense_tracker
```

Keep this file until the upgrade has been verified. To roll back, stop the backend and
restore the dump.

### 2. Apply migration 001

```powershell
Get-Content .\database\migrations\001_auth_and_ownership.sql -Raw |
  & $mysql -u root -p expense_tracker
```

This adds the `users` table and a nullable `expenses.owner_id`. Existing expense rows are
preserved and remain unowned until the first admin is bootstrapped.

Check the result:

```sql
SHOW TABLES FROM expense_tracker;
SELECT COUNT(*) AS unowned FROM expense_tracker.expenses WHERE owner_id IS NULL;
```

### 3. Bootstrap the first admin

Stop the old backend. Start the new backend once with:

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-mysql-password"
$env:JWT_SECRET = "your-fixed-secret-at-least-32-bytes-long"
$env:BOOTSTRAP_ADMIN_NAME = "Your Name"
$env:BOOTSTRAP_ADMIN_EMAIL = "you@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD = "choose-a-strong-password"
$env:ASSIGN_LEGACY_EXPENSES = "true"

cd .\backend
.\mvnw.cmd spring-boot:run
```

The startup log should report the created administrator and the number of legacy expenses
assigned. Verify ownership before continuing:

```sql
SELECT COUNT(*) FROM expense_tracker.users;
SELECT COUNT(*) FROM expense_tracker.expenses WHERE owner_id IS NULL;
```

The second query must return `0`. If it does not, do not apply migration 002. Check that
`BOOTSTRAP_ADMIN_EMAIL` matches the admin account and that `ASSIGN_LEGACY_EXPENSES=true`
was set for this run.

### 4. Apply migration 002

Stop the backend, then enforce ownership:

```powershell
Get-Content .\database\migrations\002_enforce_expense_ownership.sql -Raw |
  & $mysql -u root -p expense_tracker
```

`owner_id` is now `NOT NULL`. Restart the backend **without** the bootstrap variables and
without `ASSIGN_LEGACY_EXPENSES`. The backend uses `ddl-auto=validate`, so startup will fail
if the migration was not applied successfully.

### 5. Verify data preservation

Run this before and after the upgrade:

```sql
SELECT COUNT(*) AS rows_count,
       COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS expenses
FROM expense_tracker.expenses;
```

The counts and totals must match the pre-upgrade values. Then sign in as the admin and verify
the legacy transactions appear under **My Expenses**.

### 6. Apply migrations 003 and 004

Migrations 003 and 004 are additive and do not modify existing data. Stop the backend, then run:

```powershell
Get-Content .\database\migrations\003_user_profile.sql -Raw |
  & $mysql -u root -p expense_tracker

Get-Content .\database\migrations\004_recurring_expenses.sql -Raw |
  & $mysql -u root -p expense_tracker
```

Migration 003 adds the optional `phone_number`, `date_of_birth`, `gender`, and `address`
columns to `users`. Migration 004 creates the `recurring_expenses` table.

Verify the profile columns and the recurring table:

```sql
SHOW COLUMNS FROM expense_tracker.users;
SHOW CREATE TABLE expense_tracker.recurring_expenses;
SELECT COUNT(*) FROM expense_tracker.recurring_expenses;
```

The backend uses `ddl-auto=validate`, so it will fail to start until both migrations have been
applied. Existing expenses, users, and totals are untouched.

## Migrations

| File | Purpose |
| --- | --- |
| `migrations/001_auth_and_ownership.sql` | Adds `users`, `owner_id`, index, and foreign key; keeps ownership nullable |
| `migrations/002_enforce_expense_ownership.sql` | Changes `owner_id` to `NOT NULL` after bootstrap |
| `migrations/003_user_profile.sql` | Adds optional profile fields (`phone_number`, `date_of_birth`, `gender`, `address`) to `users` |
| `migrations/004_recurring_expenses.sql` | Creates the `recurring_expenses` table with owner-scoped foreign key and frequency constraint |

Migration 001 is intentionally nullable so an existing database can be upgraded without
losing or guessing row ownership. Migration 002 is the point of no return; take a fresh
backup before applying it.

## Configuration

The backend reads database settings from environment variables:

- `DB_URL` default: `jdbc:mysql://localhost:3306/expense_tracker?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true`
- `DB_USERNAME` - required
- `DB_PASSWORD` - required

Never hardcode passwords in `application.properties` or commit them to source control.
