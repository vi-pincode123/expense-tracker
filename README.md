# Expense Tracker - Full Stack Application

A full-stack personal finance dashboard with React, Spring Boot, MySQL, JWT authentication,
role-based admin tools, and owner-scoped expense data.

## Tech Stack

- **Frontend:** React 18, Vite, JavaScript, Axios, Recharts, CSS
- **Backend:** Java 21, Spring Boot 3.2, Spring Security, Spring Data JPA, Bean Validation, Maven
- **Database:** MySQL 8
- **Auth:** BCrypt password hashing and stateless JWT bearer tokens
- **Ports:** Backend `8080`, frontend `5173`

## Project Structure

```text
expense-tracker/
  backend/       Spring Boot REST API
  frontend/      React application
  database/      Fresh-install schema, migrations, and database notes
  backups/       Local database/source backups (do not commit production data)
```

## Features

### Authentication and authorization

- Sign up with name, email, and password.
- Sign in and sign out with JWT bearer tokens.
- Passwords are hashed with BCrypt; password hashes are never returned by the API.
- Public registration always creates a `USER`. It cannot create or promote an `ADMIN`.
- The first administrator is created only through server-side bootstrap environment variables.
- Admins can view aggregate application statistics and activate/deactivate users.
- Admins cannot deactivate their own account or the last active administrator.
- Deactivated users cannot sign in or continue using the application.

### Expense dashboard

- Create, edit, and delete transactions.
- Summary cards for total income, total expenses, current-month totals, and balance.
- Monthly expense bar chart and category expense pie chart.
- Search by title/description, plus type, category, date, and amount filters.
- CSV export of the currently filtered rows.
- Responsive layout, loading skeletons, empty states, and retryable API errors.
- Light/dark theme with the preference saved in `localStorage`.

### Data ownership

Every expense has an `owner_id`. The expense API only reads and writes rows owned by the
authenticated account. Changing an expense ID or filter in the URL cannot expose another
user's transactions. Admins receive aggregate statistics only and cannot open another user's
expense rows through the expense API.

### Recurring expenses and reminders

- Create recurring bills, subscriptions, and regular payments with an amount, category,
  description, start date, frequency (weekly, monthly, or yearly), and next due date.
- An in-app reminder panel highlights schedules that are overdue or due within the next
  seven days.
- Mark a schedule as paid to advance its next due date by exactly one frequency interval and
  record the payment date.
- Edit, pause, resume, and delete schedules. Paused schedules are excluded from reminders and
  must be resumed before they can be marked paid.
- Recurring schedules live in their own `recurring_expenses` table. Marking a schedule paid
  does **not** create an expense transaction, so existing summaries, charts, and CSV exports
  remain accurate.
- Every schedule belongs to the authenticated user; the API never returns another user's rows.

## Prerequisites

- Java 21
- Maven 3.9+
- Node.js 18+ and npm
- MySQL 8

On Windows, use `npm.cmd` in PowerShell and `mvn.cmd` if `mvn` is not on `PATH`.

## Environment Variables

The backend requires these variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DB_USERNAME` | Yes | MySQL username |
| `DB_PASSWORD` | Yes | MySQL password |
| `JWT_SECRET` | Yes | Signing key, at least 32 bytes; keep it stable across restarts |
| `DB_URL` | No | Defaults to `jdbc:mysql://localhost:3306/expense_tracker?...` |
| `JWT_EXPIRATION_MS` | No | Token lifetime; defaults to `3600000` (1 hour) |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated origins; defaults to `http://localhost:5173` |

One-time first-admin bootstrap variables:

| Variable | Purpose |
| --- | --- |
| `BOOTSTRAP_ADMIN_NAME` | Display name for the first admin |
| `BOOTSTRAP_ADMIN_EMAIL` | Email for the first admin |
| `BOOTSTRAP_ADMIN_PASSWORD` | 8-72 character password for the first admin |
| `ASSIGN_LEGACY_EXPENSES` | Set to `true` once to assign existing unowned expenses to that admin |

`backend/.env.example` is a checklist, not an automatically loaded file. Set the values in
your shell, IDE run configuration, or process manager. Never commit real credentials.

The frontend uses `VITE_API_BASE_URL` and defaults to `http://localhost:8080/api`:

```text
frontend/.env
VITE_API_BASE_URL=http://localhost:8080/api
```

See `frontend/.env.example`. Restart Vite after changing an environment variable.

## Fresh Installation

### 1. Create the database

From the project root:

```powershell
Get-Content .\database\schema.sql -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

Or open `database/schema.sql` in MySQL Workbench and execute it. The schema creates an empty
`users` table, an `expenses` table whose `owner_id` is required, and a `recurring_expenses`
table with the same ownership rule.

If MySQL is on `PATH`, run the redirection through `cmd.exe` because PowerShell does not
support the `<` input operator:

```powershell
cmd /c "mysql -u root -p < database\schema.sql"
```

### 2. Start the backend and create the first admin

In PowerShell, set the required values. Generate a JWT secret once and save it somewhere
secure; reusing the same secret keeps existing sessions valid across restarts.

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-mysql-password"
$env:JWT_SECRET = "replace-with-a-random-secret-at-least-32-bytes-long"

$env:BOOTSTRAP_ADMIN_NAME = "Your Name"
$env:BOOTSTRAP_ADMIN_EMAIL = "you@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD = "choose-a-strong-password"

cd C:\expense-tracker\backend
mvn spring-boot:run
```

The log should report that the first administrator was created. Stop the backend with
`Ctrl+C`, then remove the bootstrap variables from that shell:

```powershell
Remove-Item Env:BOOTSTRAP_ADMIN_NAME
Remove-Item Env:BOOTSTRAP_ADMIN_EMAIL
Remove-Item Env:BOOTSTRAP_ADMIN_PASSWORD
Remove-Item Env:ASSIGN_LEGACY_EXPENSES
```

Restart the backend with the same `DB_*` and `JWT_SECRET` values. Registration is now
available, but new accounts are always standard users.

### 3. Start the frontend

```powershell
cd C:\expense-tracker\frontend
npm.cmd install
npm.cmd run dev
```

Open http://localhost:5173. Register a standard user or sign in with the admin account.

### 4. Production-style build

```powershell
cd C:\expense-tracker\backend
mvn.cmd clean package
java -jar .\target\expense-tracker-backend-0.0.1-SNAPSHOT.jar
```

```powershell
cd C:\expense-tracker\frontend
npm.cmd run build
npm.cmd run preview
```

## Upgrading an Existing Unauthenticated Installation

The live database may already contain expenses without owners. Do not start the new backend
against it until the migration and first-admin bootstrap are complete.

### 1. Back up first

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = "C:\expense-tracker\backups\expense_tracker-$stamp.sql"
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" `
  -u root -p --single-transaction --routines --triggers `
  --result-file="$backup" expense_tracker
Write-Output "Backup written to $backup"
```

Also back up the source tree before changing deployment files.

### 2. Apply migration 001

This adds the `users` table and a nullable `expenses.owner_id`. Existing rows remain intact.

```powershell
Get-Content .\database\migrations\001_auth_and_ownership.sql -Raw |
  & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p expense_tracker
```

Verify the migration:

```powershell
$env:MYSQL_PWD = "your-mysql-password"
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -N -e `
  "SELECT COUNT(*) AS unowned FROM expense_tracker.expenses WHERE owner_id IS NULL;"
```

### 3. Create the first admin and assign legacy rows

Stop the old backend first. Then run the new backend once with:

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-mysql-password"
$env:JWT_SECRET = "your-fixed-secret-at-least-32-bytes-long"
$env:BOOTSTRAP_ADMIN_NAME = "Your Name"
$env:BOOTSTRAP_ADMIN_EMAIL = "you@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD = "choose-a-strong-password"
$env:ASSIGN_LEGACY_EXPENSES = "true"

cd C:\expense-tracker\backend
mvn spring-boot:run
```

Confirm the log reports the created admin and the number of assigned legacy expenses. Query
to verify:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -N -e `
  "SELECT COUNT(*) FROM expense_tracker.users; SELECT COUNT(*) FROM expense_tracker.expenses WHERE owner_id IS NULL;"
```

The unowned count must be `0`. If you chose different email values, make sure
`BOOTSTRAP_ADMIN_EMAIL` matches the account that should own the legacy expenses.

### 4. Enforce ownership

Stop the backend. Apply the second migration:

```powershell
Get-Content .\database\migrations\002_enforce_expense_ownership.sql -Raw |
  & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p expense_tracker
```

Now restart the backend **without** `BOOTSTRAP_ADMIN_*` or `ASSIGN_LEGACY_EXPENSES`.
The application uses `spring.jpa.hibernate.ddl-auto=validate`; it will fail fast if the
database schema does not match the entities.

### 5. Verify totals and restart the frontend

Before and after migration, compare:

```sql
SELECT COUNT(*) AS rows_count,
       COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS expenses
FROM expense_tracker.expenses;
```

The row count, income, and expense totals must be unchanged. Restart Vite so it points at the
new backend, then sign in as the admin and verify the legacy data appears under **My Expenses**.

### 6. Apply the remaining schema migrations

Migrations are additive. Apply any that the database has not seen yet, in order:

```powershell
Get-Content .\database\migrations\003_user_profile.sql -Raw |
  & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p expense_tracker

Get-Content .\database\migrations\004_recurring_expenses.sql -Raw |
  & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p expense_tracker
```

Migration `003` adds optional profile columns; `004` creates the `recurring_expenses` table.
Because `ddl-auto=validate` is enabled, the backend will refuse to start if `004` is missing.
Restart the backend after applying it.

## API Overview

All expense and admin endpoints require `Authorization: Bearer <token>` unless noted.

### Authentication

| Method | Endpoint | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Public; always creates `USER`; returns `201` |
| `POST` | `/api/auth/login` | Public; returns token and user |
| `POST` | `/api/auth/logout` | Revokes the current token; returns `204` |
| `GET` | `/api/auth/me` | Returns the current user |

Registration request:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "a-strong-password"
}
```

### Expenses

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/api/expenses` | Owner-scoped; optional `type` and `category` filters |
| `GET` | `/api/expenses/{id}` | Owner-scoped; `404` for another user's id |
| `POST` | `/api/expenses` | Creates an expense owned by the current user |
| `PUT` | `/api/expenses/{id}` | Updates only the current user's row |
| `DELETE` | `/api/expenses/{id}` | Deletes only the current user's row |
| `GET` | `/api/expenses/summary` | Current user's totals |
| `GET` | `/api/expenses/analytics?months=12` | Current user's chart data |

### Recurring Expenses

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/api/recurring-expenses` | Owner-scoped; sorted by next due date |
| `GET` | `/api/recurring-expenses/{id}` | Owner-scoped; `404` for another user's id |
| `POST` | `/api/recurring-expenses` | Creates a schedule owned by the current user; returns `201` |
| `PUT` | `/api/recurring-expenses/{id}` | Updates only the current user's schedule |
| `DELETE` | `/api/recurring-expenses/{id}` | Deletes only the current user's schedule |
| `PATCH` | `/api/recurring-expenses/{id}/pause` | Excludes the schedule from reminders |
| `PATCH` | `/api/recurring-expenses/{id}/resume` | Re-enables reminders |
| `POST` | `/api/recurring-expenses/{id}/pay` | Advances `nextDueDate` by one interval; `409` when paused |

Create/update request:

```json
{
  "amount": 49.99,
  "category": "Utilities",
  "description": "Internet subscription",
  "startDate": "2026-11-01",
  "frequency": "MONTHLY",
  "nextDueDate": "2026-11-01"
}
```

`nextDueDate` is optional and defaults to `startDate`. It cannot be earlier than `startDate`.
`frequency` must be `WEEKLY`, `MONTHLY`, or `YEARLY`. Marking a schedule paid advances the due
date by exactly one interval; a schedule that missed several cycles may still be overdue
afterward.

### Admin

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/api/admin/stats` | Aggregate user/expense statistics |
| `GET` | `/api/admin/users` | User accounts without password data |
| `PATCH` | `/api/admin/users/{id}/status` | Body `{"active": false}` or `{"active": true}` |

Admins cannot read another user's expense rows, chart data, search results, or CSV export.
Admin statistics are aggregate-only.

### PowerShell API example

```powershell
$login = Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8080/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"you@example.com","password":"your-password"}'

$headers = @{ Authorization = "Bearer $($login.token)" }

Invoke-RestMethod -Uri "http://localhost:8080/api/expenses" -Headers $headers
Invoke-RestMethod -Uri "http://localhost:8080/api/expenses/summary" -Headers $headers
Invoke-RestMethod -Uri "http://localhost:8080/api/recurring-expenses" -Headers $headers
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/stats" -Headers $headers
```

## Security Notes

- Keep `JWT_SECRET`, `DB_PASSWORD`, and bootstrap credentials out of source control.
- The JWT logout denylist is in memory. Restarting the backend clears it, but tokens still
  expire normally (`JWT_EXPIRATION_MS`).
- Store tokens in `localStorage` only for this local/demo application. Serve production
  traffic over HTTPS and consider an HttpOnly cookie strategy for a hardened deployment.
- There is intentionally no public password-reset endpoint. Reset a password through a
  trusted server-side administrative procedure.
- `spring.jpa.hibernate.ddl-auto=validate` means Hibernate never silently changes the schema.
  Apply SQL migrations explicitly.
- CORS defaults to `http://localhost:5173`. Set `CORS_ALLOWED_ORIGINS` if the frontend runs
  elsewhere.

## Troubleshooting

1. **Backend exits with a schema validation error**: run the outstanding migration and restart.
2. **Backend complains `JWT_SECRET` is missing or too short**: set a fixed secret of at least
   32 bytes in the backend environment.
3. **Login works but requests return `401`**: the token may have expired or the backend was
   restarted with a different JWT secret. Sign in again.
4. **`403` from `/api/admin/**`**: the signed-in account is not an `ADMIN`.
5. **CORS error**: confirm the frontend origin matches `CORS_ALLOWED_ORIGINS` and restart the
   backend after changing it.
6. **No admin account exists**: set the bootstrap variables and start the backend once, or
   restore the account through a trusted database/admin procedure.
7. **`npm.cmd run lint` fails with "couldn't find a configuration file"**: this repository
   currently ships no ESLint config. The Vite production build does not require linting.
