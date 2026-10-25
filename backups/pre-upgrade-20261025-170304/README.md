# Expense Tracker - Full Stack Application

A complete full-stack Expense Tracker application built with React, Spring Boot, and MySQL.

## Tech Stack

- **Frontend**: React JS with Vite, JavaScript, Axios, CSS
- **Backend**: Java 21, Spring Boot, Spring Web, Spring Data JPA, Spring Boot Validation, Maven
- **Database**: MySQL 8
- **Ports**: Backend (8080), Frontend (5173)

## Project Structure

```
expense-tracker/
├── frontend/          # React frontend application
├── backend/           # Spring Boot backend application
└── database/          # Database schema and setup instructions
```

## Features

### Backend (REST API)
- `GET /api/expenses` - List all expenses (with optional filtering by type and category)
- `GET /api/expenses/{id}` - Get a specific transaction
- `POST /api/expenses` - Create a new transaction
- `PUT /api/expenses/{id}` - Update an existing transaction
- `DELETE /api/expenses/{id}` - Delete a transaction
- `GET /api/expenses/summary` - Get total income, total expenses, and balance
- Validation using Spring Boot Validation
- Proper HTTP status codes (200, 201, 204, 404)
- Error handling for missing records
- CORS configured for http://localhost:5173
- Uses BigDecimal for monetary amounts
- Calculates totals from database records

### Frontend
- Responsive dashboard showing total income, expenses, and balance
- Form to create and edit transactions (title, amount, type, category, date, description)
- Transactions table with Edit and Delete actions
- Filter transactions by type and category
- Axios integration with Spring Boot APIs
- Auto-refresh after create, update, and delete operations
- Loading indicators, validation messages, and API error messages
- Reusable React components

## Setup Instructions

### Prerequisites
- Java 21
- Maven
- Node.js and npm
- MySQL 8

### 1. Database Setup

1. Start your MySQL server
2. Navigate to the `database/` directory
3. Run the schema:
```bash
mysql -u root -p < schema.sql
```
Or use MySQL Workbench/CLI to execute `schema.sql`

See `database/README.md` for more details.

### 2. Backend Setup

1. Navigate to the `backend/` directory:
```bash
cd backend
```

2. Update database credentials in `src/main/resources/application.properties` if needed:
```properties
spring.datasource.username=your_username
spring.datasource.password=your_password
```

3. Build and run the Spring Boot application:
```bash
mvn clean install
mvn spring-boot:run
```

The backend will start on http://localhost:8080

### 3. Frontend Setup

1. Navigate to the `frontend/` directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will start on http://localhost:5173

## Testing CRUD Operations

### Using the Frontend (Recommended)
1. Open http://localhost:5173 in your browser
2. **Create**: Fill out the form and click "Add Transaction"
3. **Read**: View all transactions in the table, use filters by type/category
4. **Update**: Click "Edit" on any transaction, modify the form, click "Update Transaction"
5. **Delete**: Click "Delete" on any transaction and confirm

### Using API directly (e.g., with curl/Postman)

**Create a transaction:**
```bash
curl -X POST http://localhost:8080/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Lunch","amount":25.50,"type":"EXPENSE","category":"Food","transactionDate":"2026-10-24","description":"Restaurant"}'
```

**Get all transactions:**
```bash
curl http://localhost:8080/api/expenses
```

**Get a specific transaction:**
```bash
curl http://localhost:8080/api/expenses/1
```

**Update a transaction:**
```bash
curl -X PUT http://localhost:8080/api/expenses/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Lunch","amount":30.00,"type":"EXPENSE","category":"Food","transactionDate":"2026-10-24","description":"Updated"}'
```

**Delete a transaction:**
```bash
curl -X DELETE http://localhost:8080/api/expenses/1
```

**Get summary:**
```bash
curl http://localhost:8080/api/expenses/summary
```

**Filter by type:**
```bash
curl http://localhost:8080/api/expenses?type=INCOME
```

**Filter by category:**
```bash
curl http://localhost:8080/api/expenses?category=Food
```

## Configuration Notes

- Database credentials are configurable in `backend/src/main/resources/application.properties`
- CORS is configured for `http://localhost:5173` in the backend
- Backend runs on port 8080, frontend on port 5173
- Uses `spring.jpa.hibernate.ddl-auto=update` so schema is managed by JPA
- All monetary values use BigDecimal for precision

## Troubleshooting

1. **Backend won't start**: Check MySQL is running and credentials are correct
2. **Frontend can't connect**: Ensure backend is running on port 8080
3. **CORS errors**: Verify frontend is running on port 5173
4. **Database connection issues**: Check MySQL allows connections and the database exists
