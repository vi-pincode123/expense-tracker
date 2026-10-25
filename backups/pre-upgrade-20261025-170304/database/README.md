# MySQL Database Setup

## Prerequisites
- MySQL 8.0 installed and running

## Setup Instructions

1. **Start MySQL Server** - Ensure MySQL is running on your system

2. **Create Database and Tables**
   You can run the schema.sql file:
   ```bash
   mysql -u root -p < schema.sql
   ```

   Or manually:
   ```sql
   CREATE DATABASE expense_tracker;
   USE expense_tracker;
   ```
   Then run the table creation and sample data from schema.sql

3. **Database Configuration**
   The backend uses the following defaults (configurable via application.properties or environment variables):
   - Host: localhost:3306
   - Database: expense_tracker
   - Username: root (change as needed)
   - Password: (empty by default, set your own)

   **Important:** Never hardcode passwords in production. Use environment variables or a secure configuration method.

## Connection Details
Update `backend/src/main/resources/application.properties` with your MySQL credentials.
