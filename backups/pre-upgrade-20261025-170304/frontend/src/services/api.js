import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const expenseService = {
  getAllExpenses: (params = {}) => {
    return api.get('/expenses', { params });
  },
  
  getExpenseById: (id) => {
    return api.get(`/expenses/${id}`);
  },
  
  createExpense: (expense) => {
    return api.post('/expenses', expense);
  },
  
  updateExpense: (id, expense) => {
    return api.put(`/expenses/${id}`, expense);
  },
  
  deleteExpense: (id) => {
    return api.delete(`/expenses/${id}`);
  },
  
  getSummary: () => {
    return api.get('/expenses/summary');
  },
};

export default api;
