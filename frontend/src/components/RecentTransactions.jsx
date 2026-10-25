import React from 'react';

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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const TransactionIcon = ({ type }) => {
  if (type === 'INCOME') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5" />
        <path d="m6 11 6-6 6 6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="m18 13-6 6-6-6" />
    </svg>
  );
};

const RecentTransactions = ({
  transactions = [],
  loading = false,
  error = '',
  onRetry,
  onViewAll,
}) => {
  const visibleTransactions = Array.isArray(transactions) ? transactions.slice(0, 6) : [];
  const hasTransactions = visibleTransactions.length > 0;

  return (
    <section className="recent-panel" aria-labelledby="recent-heading" aria-busy={loading}>
      <div className="recent-panel-head">
        <div>
          <p className="chart-kicker">Activity</p>
          <h2 id="recent-heading">Recent transactions</h2>
          <p className="chart-subtitle">Your latest income and expenses</p>
        </div>
        {onViewAll && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onViewAll}
            disabled={loading}
          >
            View all
          </button>
        )}
      </div>

      {loading ? (
        <div className="recent-list" aria-hidden="true">
          {[0, 1, 2, 3].map((item) => (
            <div className="recent-item recent-item--skeleton" key={item}>
              <span className="skeleton skeleton-recent-icon" />
              <span className="recent-skeleton-copy">
                <span className="skeleton skeleton-line" />
                <span className="skeleton skeleton-line skeleton-line--short" />
              </span>
              <span className="skeleton skeleton-recent-amount" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="recent-empty" role="alert">
          <p>{error}</p>
          {onRetry && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      ) : !hasTransactions ? (
        <div className="recent-empty">
          <span className="recent-empty-icon" aria-hidden="true">
            <TransactionIcon type="EXPENSE" />
          </span>
          <p>No transactions yet. Add your first income or expense below to see it here.</p>
        </div>
      ) : (
        <ul className="recent-list">
          {visibleTransactions.map((transaction) => {
            const type = transaction.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
            const isIncome = type === 'INCOME';
            return (
              <li className="recent-item" key={transaction.id}>
                <span className={`recent-icon ${type.toLowerCase()}`} aria-hidden="true">
                  <TransactionIcon type={type} />
                </span>
                <div className="recent-main">
                  <p className="recent-title" title={transaction.title}>{transaction.title}</p>
                  <p className="recent-meta">
                    <span>{transaction.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDate(transaction.transactionDate)}</span>
                  </p>
                </div>
                <span className={`recent-amount ${type.toLowerCase()}`}>
                  {isIncome ? '+' : '−'}
                  {formatCurrency(transaction.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default RecentTransactions;
