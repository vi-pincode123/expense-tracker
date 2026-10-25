import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage, recurringExpenseService } from '../services/api';
import RecurringExpenseForm from '../components/RecurringExpenseForm';
import RecurringExpenseList from '../components/RecurringExpenseList';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount) || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getTodayLocal = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const daysBetween = (fromDate, toDate) => {
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const to = Date.parse(`${toDate}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round((to - from) / 86400000);
};

const getReminderLabel = (daysUntilDue) => {
  if (daysUntilDue < 0) {
    const overdueDays = Math.abs(daysUntilDue);
    return `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`;
  }
  if (daysUntilDue === 0) return 'Due today';
  return `Due in ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`;
};

const BellIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

const RecurringExpensesPage = () => {
  const [items, setItems] = useState([]);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRecurringExpenses = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const response = await recurringExpenseService.getAllRecurringExpenses();
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching recurring expenses:', err);
      setLoadError(getApiErrorMessage(
        err,
        'Failed to fetch recurring expenses. Please check that the backend is running.'
      ));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurringExpenses();
  }, [fetchRecurringExpenses]);

  useEffect(() => {
    if (!success) return undefined;
    const timeoutId = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timeoutId);
  }, [success]);

  const categories = useMemo(() => {
    return [...new Set(items.map((item) => item.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }, [items]);

  const reminders = useMemo(() => {
    const today = getTodayLocal();
    return items
      .filter((item) => !item.paused && item.nextDueDate)
      .map((item) => ({ ...item, daysUntilDue: daysBetween(today, item.nextDueDate) }))
      .filter((item) => item.daysUntilDue !== null && item.daysUntilDue <= 7)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [items]);

  const overdueCount = reminders.filter((item) => item.daysUntilDue < 0).length;
  const dueSoonCount = reminders.filter((item) => item.daysUntilDue >= 0).length;

  const handleCreateOrUpdate = async (recurringExpense) => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (editingRecurring) {
        await recurringExpenseService.updateRecurringExpense(
          editingRecurring.id,
          recurringExpense
        );
        setSuccess('Recurring expense updated successfully.');
        setEditingRecurring(null);
      } else {
        await recurringExpenseService.createRecurringExpense(recurringExpense);
        setSuccess('Recurring expense created successfully.');
      }
      await fetchRecurringExpenses();
      return true;
    } catch (err) {
      console.error('Error saving recurring expense:', err);
      setError(getApiErrorMessage(
        err,
        'Failed to save the recurring expense. Please try again.'
      ));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (recurringExpense) => {
    setEditingRecurring(recurringExpense);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingRecurring(null);
    setError('');
  };

  const handleDelete = async (recurringExpense) => {
    if (!window.confirm(`Delete the recurring ${recurringExpense.category} expense?`)) return;

    setError('');
    setSuccess('');
    setActioningId(recurringExpense.id);
    try {
      await recurringExpenseService.deleteRecurringExpense(recurringExpense.id);
      if (editingRecurring?.id === recurringExpense.id) {
        setEditingRecurring(null);
      }
      setSuccess('Recurring expense deleted successfully.');
      await fetchRecurringExpenses();
    } catch (err) {
      console.error('Error deleting recurring expense:', err);
      setError(getApiErrorMessage(
        err,
        'Failed to delete the recurring expense. Please try again.'
      ));
    } finally {
      setActioningId(null);
    }
  };

  const handlePauseChange = async (recurringExpense, shouldPause) => {
    setError('');
    setSuccess('');
    setActioningId(recurringExpense.id);
    try {
      if (shouldPause) {
        await recurringExpenseService.pauseRecurringExpense(recurringExpense.id);
        setSuccess(`${recurringExpense.category} paused.`);
      } else {
        await recurringExpenseService.resumeRecurringExpense(recurringExpense.id);
        setSuccess(`${recurringExpense.category} resumed.`);
      }
      await fetchRecurringExpenses();
    } catch (err) {
      console.error('Error updating recurring expense status:', err);
      setError(getApiErrorMessage(
        err,
        'Failed to update the recurring expense status. Please try again.'
      ));
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkPaid = async (recurringExpense) => {
    setError('');
    setSuccess('');
    setActioningId(recurringExpense.id);
    try {
      const response = await recurringExpenseService.markRecurringExpensePaid(recurringExpense.id);
      setSuccess(
        `${recurringExpense.category} marked as paid. Next due ${formatDate(response.data.nextDueDate)}.`
      );
      await fetchRecurringExpenses();
    } catch (err) {
      console.error('Error marking recurring expense paid:', err);
      setError(getApiErrorMessage(
        err,
        'Failed to mark the recurring expense as paid. Please try again.'
      ));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <main className="recurring-page">
      <div className="dashboard-toolbar">
        <div>
          <span className="dashboard-kicker">Automated bills and subscriptions</span>
          <h2 className="dashboard-title">Recurring Expenses</h2>
          <p className="dashboard-subtitle">
            Keep upcoming payments visible and mark each one paid as it happens.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={fetchRecurringExpenses}
          disabled={loading}
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
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
          <button type="button" className="alert-action" onClick={fetchRecurringExpenses}>
            Retry
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      )}

      <section
        className={`reminder-panel${overdueCount > 0 ? ' reminder-panel--overdue' : ''}`}
        aria-labelledby="recurring-reminders-heading"
      >
        <div className="reminder-panel-head">
          <span className="reminder-panel-icon" aria-hidden="true">
            <BellIcon />
          </span>
          <div className="reminder-panel-copy">
            <h2 id="recurring-reminders-heading">Reminders</h2>
            <p>
              {loading
                ? 'Checking your upcoming due dates…'
                : reminders.length > 0
                  ? `${overdueCount} overdue · ${dueSoonCount} due in the next 7 days`
                  : 'No payments are overdue or due in the next 7 days.'}
            </p>
          </div>
          <span className="count-badge">
            {loading ? '…' : reminders.length}
          </span>
        </div>

        {!loading && reminders.length > 0 && (
          <ul className="reminder-list">
            {reminders.map((item) => (
              <li
                key={item.id}
                className={`reminder-item${item.daysUntilDue < 0 ? ' reminder-item--overdue' : ''}`}
              >
                <div className="reminder-item-copy">
                  <strong>{item.category}</strong>
                  <span>
                    {item.description || 'Recurring payment'} · {formatCurrency(item.amount)}
                  </span>
                </div>
                <span className="reminder-item-due">
                  {getReminderLabel(item.daysUntilDue)}
                </span>
                <button
                  type="button"
                  className="btn btn-export btn-sm"
                  onClick={() => handleMarkPaid(item)}
                  disabled={actioningId === item.id}
                >
                  {actioningId === item.id ? 'Saving…' : 'Mark paid'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="content-grid">
        <RecurringExpenseForm
          onSubmit={handleCreateOrUpdate}
          editingRecurring={editingRecurring}
          onCancelEdit={handleCancelEdit}
          saving={saving}
          categories={categories}
        />
        <RecurringExpenseList
          items={items}
          loading={loading}
          error={loadError}
          onRetry={fetchRecurringExpenses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPause={(item) => handlePauseChange(item, true)}
          onResume={(item) => handlePauseChange(item, false)}
          onMarkPaid={handleMarkPaid}
          actioningId={actioningId}
        />
      </div>
    </main>
  );
};

export default RecurringExpensesPage;
