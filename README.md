# Expense Tracker

A full-stack expense management application built with **React.js, Spring Boot, and MySQL**.

Expense Tracker helps users manage their daily expenses, track spending, organize transactions by category, and view their financial activity through a simple dashboard.

## 🚀 Features

- Add, edit, and delete expenses
- Track income and expenses
- Categorize transactions
- Search and filter expenses
- Dashboard with expense summaries
- Charts for spending analysis
- Recurring expenses
- Expense reminders
- User authentication
- User profile management
- Responsive user interface

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3

### Backend
- Java
- Spring Boot
- Spring Data JPA
- REST APIs
- JWT Authentication

### Database
- MySQL

## 📸 Screenshots

Add screenshots of the application here.

Example:

![Expense Tracker Dashboard](./screenshots/dashboard.png)

## 📁 Project Structure

```text
expense-tracker/
├── frontend/
├── backend/
├── database/
└── README.md
```

## ⚙️ How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/vi-pincode123/expense-tracker.git
cd expense-tracker
```

### 2. Backend Setup

Open the `backend` folder and configure your database connection and environment variables.

Make sure MySQL is running and the required database has been created.

Then run:

```bash
cd backend
mvn spring-boot:run
```

The backend will run on:

```text
http://localhost:8080
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on the Vite development server, usually:

```text
http://localhost:5173
```

## 🔐 Environment Variables

Create the required `.env` files using the provided example environment files.

Do not commit passwords, JWT secrets, API keys, or other sensitive credentials to GitHub.

## 🔄 Application Flow

```text
React Frontend
      ↓
REST API
      ↓
Spring Boot Backend
      ↓
MySQL Database
```

## 🎯 Purpose

This project was built as a full-stack application to demonstrate practical experience with **React.js, Java, Spring Boot, REST APIs, authentication, and MySQL**.

## 👨‍💻 Author

**Vipin Raj**

GitHub: https://github.com/vi-pincode123
