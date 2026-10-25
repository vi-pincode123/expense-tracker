import React from 'react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount) || 0);
};

const icons = {
  expense: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M16.5 14.5h2" />
    </svg>
  ),
  month: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18M8 3v3M16 3v3" />
      <path d="M7.5 13.5h3v3h-3z" />
    </svg>
  ),
  income: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 17 10 11l4 4 6-7" />
      <path d="M15 8h5v5" />
    </svg>
  ),
  balance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v18M7 21h10" />
      <path d="M5 7h14" />
      <path d="m5 7-2.5 5a3 3 0 0 0 5 0L5 7Z" />
      <path d="m19 7-2.5 5a3 3 0 0 0 5 0L19 7Z" />
    </svg>
  ),
};

const SummaryCards = ({ summary, loading = false }) => {
  const safeSummary = summary || {};
  const currentMonthLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const balance = Number(safeSummary.balance) || 0;
  const currentMonthIncome = Number(safeSummary.currentMonthIncome) || 0;

  const cards = [
    {
      key: 'expense',
      label: 'Total Expenses',
      value: safeSummary.totalExpenses,
      hint: 'All recorded spending',
      icon: icons.expense,
    },
    {
      key: 'month',
      label: 'This Month',
      value: safeSummary.currentMonthExpenses,
      hint: currentMonthLabel,
      icon: icons.month,
    },
    {
      key: 'income',
      label: 'Total Income',
      value: safeSummary.totalIncome,
      hint: `${formatCurrency(currentMonthIncome)} this month`,
      icon: icons.income,
    },
    {
      key: 'balance',
      label: 'Balance',
      value: balance,
      hint: balance < 0 ? 'Spending exceeds income' : 'Income minus expenses',
      icon: icons.balance,
      negative: balance < 0,
    },
  ];

  return (
    <section className="summary-cards" aria-label="Financial summary" aria-busy={loading}>
      {cards.map((card) => (
        <article
          key={card.key}
          className={`summary-card ${card.key}${card.negative ? ' is-negative' : ''}`}
        >
          <div className="summary-card-head">
            <span className="summary-icon">{card.icon}</span>
            <h3>{card.label}</h3>
          </div>
          {loading ? (
            <>
              <span className="skeleton skeleton-value" aria-hidden="true" />
              <span className="skeleton skeleton-hint" aria-hidden="true" />
            </>
          ) : (
            <>
              <p className="summary-value">{formatCurrency(card.value)}</p>
              <p className="summary-hint">{card.hint}</p>
            </>
          )}
        </article>
      ))}
    </section>
  );
};

export default SummaryCards;
