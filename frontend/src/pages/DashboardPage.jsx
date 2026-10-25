import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { expenseService, getApiErrorMessage } from '../services/api';
import SummaryCards from '../components/SummaryCards';
import Charts from '../components/Charts';
import RecentTransactions from '../components/RecentTransactions';
import MonthlySummary from '../components/MonthlySummary';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';

const EMPTY_SUMMARY = {
  totalIncome: 0,
  totalExpenses: 0,
  currentMonthIncome: 0,
  currentMonthExpenses: 0,
  balance: 0,
};

const EMPTY_ANALYTICS = {
  monthlyExpenses: [],
  monthlyIncome: [],
  categoryExpenses: [],
};

const DashboardPage = ({ theme, user }) => {
  const [expenses, setExpenses] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);
  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadErrors, setLoadErrors] = useState({
    expenses: '',
    summary: '',
    analytics: '',
    recent: '',
  });

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setSummaryLoading(true);
    setAnalyticsLoading(true);
    setRecentLoading(true);
    setError('');

    const [expensesResult, summaryResult, analyticsResult, recentResult] =
      await Promise.allSettled([
        expenseService.getAllExpenses(),
        expenseService.getSummary(),
        expenseService.getAnalytics(12),
        expenseService.getRecentTransactions(6),
      ]);

    const nextLoadErrors = { expenses: '', summary: '', analytics: '', recent: '' };

    if (expensesResult.status === 'fulfilled') {
      setExpenses(Array.isArray(expensesResult.value.data) ? expensesResult.value.data : []);
    } else {
      console.error('Error fetching expenses:', expensesResult.reason);
      nextLoadErrors.expenses = getApiErrorMessage(
        expensesResult.reason,
        'Failed to fetch expenses. Please check that the backend is running.'
      );
    }

    if (summaryResult.status === 'fulfilled') {
      setSummary({ ...EMPTY_SUMMARY, ...(summaryResult.value.data || {}) });
    } else {
      console.error('Error fetching summary:', summaryResult.reason);
      nextLoadErrors.summary = 'Summary data could not be loaded. Please try refreshing.';
    }

    if (analyticsResult.status === 'fulfilled') {
      const data = analyticsResult.value.data || {};
      setAnalytics({
        monthlyExpenses: Array.isArray(data.monthlyExpenses) ? data.monthlyExpenses : [],
        monthlyIncome: Array.isArray(data.monthlyIncome) ? data.monthlyIncome : [],
        categoryExpenses: Array.isArray(data.categoryExpenses) ? data.categoryExpenses : [],
      });
    } else {
      console.error('Error fetching analytics:', analyticsResult.reason);
      nextLoadErrors.analytics = 'Chart data could not be loaded.';
    }

    if (recentResult.status === 'fulfilled') {
      setRecentExpenses(
        Array.isArray(recentResult.value.data) ? recentResult.value.data : []
      );
      nextLoadErrors.recent = '';
    } else {
      console.error('Error fetching recent transactions:', recentResult.reason);
      nextLoadErrors.recent = getApiErrorMessage(
        recentResult.reason,
        'Recent transactions could not be loaded.'
      );
    }

    setLoadErrors(nextLoadErrors);
    setLoading(false);
    setSummaryLoading(false);
    setAnalyticsLoading(false);
    setRecentLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!success) return undefined;
    const timeoutId = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timeoutId);
  }, [success]);

  const categories = useMemo(() => {
    return [...new Set(expenses.map((expense) => expense.category).filter(Boolean))];
  }, [expenses]);

  const handleCreateOrUpdate = async (expenseData) => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, expenseData);
        setSuccess('Transaction updated successfully.');
        setEditingExpense(null);
      } else {
        await expenseService.createExpense(expenseData);
        setSuccess('Transaction created successfully.');
      }
      await fetchDashboard();
      return true;
    } catch (err) {
      console.error('Error saving expense:', err);
      setError(getApiErrorMessage(err, 'Failed to save transaction. Please try again.'));
      return false;
    } finally {
      setSaving(false);
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
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    setError('');
    setSuccess('');
    try {
      await expenseService.deleteExpense(id);
      setSuccess('Transaction deleted successfully.');
      if (editingExpense?.id === id) {
        setEditingExpense(null);
      }
      await fetchDashboard();
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError(getApiErrorMessage(err, 'Failed to delete transaction. Please try again.'));
    }
  };

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isRefreshing = loading || summaryLoading || analyticsLoading || recentLoading;
  const firstName = user?.name?.trim().split(/\s+/)[0];

  const handleViewAllTransactions = () => {
    document.getElementById('transactions-heading')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <main className="dashboard">
      <div className="dashboard-toolbar">
        <div>
          <span className="dashboard-kicker">Personal finance overview</span>
          <h2 className="dashboard-title">
            {firstName ? `Welcome back, ${firstName}` : 'Your dashboard'}
          </h2>
          <p className="dashboard-subtitle">{todayLabel}</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={fetchDashboard}
          disabled={isRefreshing}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 11a8 8 0 1 0-2.3 6.3" />
            <path d="M20 5v6h-6" />
          </svg>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
          <button type="button" className="alert-action" onClick={fetchDashboard}>
            Retry
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      )}
      {loadErrors.summary && (
        <div className="alert alert-warning" role="status">
          <span>{loadErrors.summary}</span>
          <button type="button" className="alert-action" onClick={fetchDashboard}>
            Retry
          </button>
        </div>
      )}

      <SummaryCards summary={summary} loading={summaryLoading} />

      <div className="dashboard-insights">
        <RecentTransactions
          transactions={recentExpenses}
          loading={recentLoading}
          error={loadErrors.recent}
          onRetry={fetchDashboard}
          onViewAll={handleViewAllTransactions}
        />
        <MonthlySummary
          analytics={analytics}
          loading={analyticsLoading}
          error={loadErrors.analytics}
        />
      </div>

      <Charts
        analytics={analytics}
        loading={analyticsLoading}
        error={loadErrors.analytics}
        theme={theme}
      />

      <div className="content-grid">
        <ExpenseForm
          onSubmit={handleCreateOrUpdate}
          editingExpense={editingExpense}
          onCancelEdit={handleCancelEdit}
          saving={saving}
          categories={categories}
        />
        <ExpenseList
          expenses={expenses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          error={loadErrors.expenses}
          onRetry={fetchDashboard}
        />
      </div>
    </main>
  );
};

export default DashboardPage;
