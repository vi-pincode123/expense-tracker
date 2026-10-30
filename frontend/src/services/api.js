import axios from 'axios';
import { clearStoredAuth, getStoredToken } from './authStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL is not set. Copy frontend/.env.example to frontend/.env, set the backend API URL, and restart the Vite dev server.'
  );
}

export const UNAUTHORIZED_EVENT = 'expense-tracker:unauthorized';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/');

    if (status === 401 && !isAuthRequest) {
      clearStoredAuth();
      window.dispatchEvent(
        new CustomEvent(UNAUTHORIZED_EVENT, {
          detail: {
            message: 'Your session has expired. Please log in again.',
          },
        })
      );
    }

    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallback) => {
  const data = error?.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }
  if (data?.message) {
    return data.message;
  }
  if (data?.error) {
    return data.error;
  }
  if (data?.errors && typeof data.errors === 'object') {
    const firstFieldError = Object.values(data.errors).find(Boolean);
    if (firstFieldError) {
      return firstFieldError;
    }
  }
  if (error?.code === 'ERR_NETWORK') {
    return `Cannot reach the backend at ${API_BASE_URL}. Make sure it is running and VITE_API_BASE_URL is correct.`;
  }
  return fallback;
};

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

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

  getRecentTransactions: (limit = 5) => {
    return api.get('/expenses/recent', { params: { limit } });
  },

  getAnalytics: (months = 12) => {
    return api.get('/expenses/analytics', { params: { months } });
  },
};

export const recurringExpenseService = {
  getAllRecurringExpenses: () => {
    return api.get('/recurring-expenses');
  },

  getRecurringExpenseById: (id) => {
    return api.get(`/recurring-expenses/${id}`);
  },

  createRecurringExpense: (recurringExpense) => {
    return api.post('/recurring-expenses', recurringExpense);
  },

  updateRecurringExpense: (id, recurringExpense) => {
    return api.put(`/recurring-expenses/${id}`, recurringExpense);
  },

  deleteRecurringExpense: (id) => {
    return api.delete(`/recurring-expenses/${id}`);
  },

  pauseRecurringExpense: (id) => {
    return api.patch(`/recurring-expenses/${id}/pause`);
  },

  resumeRecurringExpense: (id) => {
    return api.patch(`/recurring-expenses/${id}/resume`);
  },

  markRecurringExpensePaid: (id) => {
    return api.post(`/recurring-expenses/${id}/pay`);
  },
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),

  getUsers: () => api.get('/admin/users'),

  updateUserStatus: (id, active) => {
    return api.patch(`/admin/users/${id}/status`, { active });
  },
};

export default api;
