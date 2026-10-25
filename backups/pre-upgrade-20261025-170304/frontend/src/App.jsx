import React, { useState, useEffect } from 'react';
import { expenseService } from './services/api';
import SummaryCards from './components/SummaryCards';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import './index.css';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  });
  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await expenseService.getAllExpenses();
      setExpenses(response.data);
    } catch (err) {
      setError('Failed to fetch expenses. Please check if the backend is running.');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await expenseService.getSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, []);

  const handleCreateOrUpdate = async (expenseData) => {
    setError('');
    setSuccess('');
    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, expenseData);
        setSuccess('Transaction updated successfully!');
        setEditingExpense(null);
      } else {
        await expenseService.createExpense(expenseData);
        setSuccess('Transaction created successfully!');
      }
      fetchExpenses();
      fetchSummary();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction. Please try again.');
      console.error('Error saving expense:', err);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setError('');
      setSuccess('');
      try {
        await expenseService.deleteExpense(id);
        setSuccess('Transaction deleted successfully!');
        fetchExpenses();
        fetchSummary();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete transaction. Please try again.');
        console.error('Error deleting expense:', err);
      }
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>💰 Expense Tracker</h1>
        <p>Track your income and expenses</p>
      </header>

      <SummaryCards summary={summary} />

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="main-content">
        <ExpenseForm 
          onSubmit={handleCreateOrUpdate} 
          editingExpense={editingExpense}
          onCancelEdit={handleCancelEdit}
        />
        <ExpenseList 
          expenses={expenses} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default App;
