import React from 'react';

const FREQUENCY_LABELS = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

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

const getDueStatus = (recurringExpense, today) => {
  if (recurringExpense.paused) {
    return { key: 'paused', label: 'Paused' };
  }

  const daysUntilDue = daysBetween(today, recurringExpense.nextDueDate);
  if (daysUntilDue === null) {
    return { key: 'upcoming', label: 'Upcoming' };
  }
  if (daysUntilDue < 0) {
    return { key: 'overdue', label: 'Overdue' };
  }
  if (daysUntilDue === 0) {
    return { key: 'due-soon', label: 'Due today' };
  }
  if (daysUntilDue <= 7) {
    return {
      key: 'due-soon',
      label: `Due in ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`,
    };
  }
  return { key: 'upcoming', label: 'Upcoming' };
};

const sortByDueDate = (a, b) => {
  return (a.nextDueDate || '').localeCompare(b.nextDueDate || '');
};

const RecurringExpenseList = ({
  items = [],
  loading = false,
  error = '',
  onRetry,
  onEdit,
  onDelete,
  onPause,
  onResume,
  onMarkPaid,
  actioningId = null,
}) => {
  const today = getTodayLocal();
  const activeItems = items.filter((item) => !item.paused).sort(sortByDueDate);
  const overdueItems = activeItems.filter((item) => item.nextDueDate < today);
  const upcomingItems = activeItems.filter((item) => item.nextDueDate >= today);
  const pausedItems = items.filter((item) => item.paused).sort(sortByDueDate);

  const renderItem = (recurringExpense) => {
    const status = getDueStatus(recurringExpense, today);
    const busy = actioningId === recurringExpense.id;

    return (
      <article
        key={recurringExpense.id}
        className={`recurring-item recurring-item--${status.key}`}
      >
        <div className="recurring-item-main">
          <div className="recurring-item-heading">
            <h4 className="recurring-item-category">{recurringExpense.category}</h4>
            <span className={`recurring-status recurring-status--${status.key}`}>
              {status.label}
            </span>
          </div>
          <p className="recurring-item-description">
            {recurringExpense.description || 'No description'}
          </p>
          <div className="recurring-item-meta">
            <span className="recurring-item-amount">
              {formatCurrency(recurringExpense.amount)}
            </span>
            <span>{FREQUENCY_LABELS[recurringExpense.frequency] || recurringExpense.frequency}</span>
            <span>Next due {formatDate(recurringExpense.nextDueDate)}</span>
            <span>Started {formatDate(recurringExpense.startDate)}</span>
          </div>
        </div>

        <div className="recurring-item-actions">
          {!recurringExpense.paused && (
            <button
              type="button"
              className="btn btn-export btn-sm"
              onClick={() => onMarkPaid(recurringExpense)}
              disabled={busy}
            >
              {busy ? 'Saving…' : 'Mark paid'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-edit btn-sm"
            onClick={() => onEdit(recurringExpense)}
            disabled={busy}
          >
            Edit
          </button>
          {recurringExpense.paused ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onResume(recurringExpense)}
              disabled={busy}
            >
              Resume
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onPause(recurringExpense)}
              disabled={busy}
            >
              Pause
            </button>
          )}
          <button
            type="button"
            className="btn btn-delete btn-sm"
            onClick={() => onDelete(recurringExpense)}
            disabled={busy}
          >
            Delete
          </button>
        </div>
      </article>
    );
  };

  const renderGroup = (title, groupItems, modifier) => {
    if (groupItems.length === 0) return null;

    return (
      <div className={`recurring-group recurring-group--${modifier}`}>
        <div className="recurring-group-header">
          <h3>{title}</h3>
          <span className="count-badge">{groupItems.length}</span>
        </div>
        <div className="recurring-items">
          {groupItems.map(renderItem)}
        </div>
      </div>
    );
  };

  const hasItems = items.length > 0;

  return (
    <section className="transactions-section" aria-labelledby="recurring-list-heading">
      <div className="section-header">
        <div>
          <h2 id="recurring-list-heading">Your Schedules</h2>
          <p className="section-subtitle">Overdue items appear first, followed by upcoming payments</p>
        </div>
        <span className="count-badge">
          {loading ? 'Loading…' : `${items.length} total`}
        </span>
      </div>

      {error ? (
        <div className="empty-state empty-state--error" role="alert">
          <h3>Unable to load recurring expenses</h3>
          <p>{error}</p>
          {onRetry && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      ) : loading ? (
        <div className="recurring-loading" aria-busy="true" aria-label="Loading recurring expenses">
          {[0, 1, 2].map((item) => (
            <div className="recurring-item recurring-item--skeleton" key={item}>
              <span className="skeleton skeleton-line" aria-hidden="true" />
              <span className="skeleton skeleton-line skeleton-line--short" aria-hidden="true" />
            </div>
          ))}
        </div>
      ) : !hasItems ? (
        <div className="empty-state">
          <h3>No recurring expenses yet</h3>
          <p>Add your first bill or subscription using the form to start tracking due dates.</p>
        </div>
      ) : (
        <div className="recurring-groups">
          {renderGroup('Overdue', overdueItems, 'overdue')}
          {renderGroup('Upcoming', upcomingItems, 'upcoming')}
          {renderGroup('Paused', pausedItems, 'paused')}
        </div>
      )}
    </section>
  );
};

export default RecurringExpenseList;
