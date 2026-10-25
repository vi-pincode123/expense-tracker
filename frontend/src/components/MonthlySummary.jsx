import React from 'react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount) || 0);
};

const getTotal = (points) => {
  return points.reduce((sum, point) => sum + (Number(point.total) || 0), 0);
};

const MonthlySummary = ({ analytics, loading = false, error = '' }) => {
  const monthlyExpenses = Array.isArray(analytics?.monthlyExpenses)
    ? analytics.monthlyExpenses
    : [];
  const monthlyIncome = Array.isArray(analytics?.monthlyIncome)
    ? analytics.monthlyIncome
    : [];

  const incomeByMonth = new Map(
    monthlyIncome.map((point) => [point.month, Number(point.total) || 0])
  );

  const rows = monthlyExpenses
    .slice(-6)
    .map((point) => {
      const income = incomeByMonth.get(point.month) || 0;
      const expenses = Number(point.total) || 0;
      return {
        key: point.month,
        label: point.label,
        income,
        expenses,
        net: income - expenses,
      };
    })
    .reverse();

  const hasData = rows.some((row) => row.income > 0 || row.expenses > 0);
  const netTotal = rows.reduce((sum, row) => sum + row.net, 0);
  const periodLabel = rows.length > 0
    ? `${rows[rows.length - 1].label} – ${rows[0].label}`
    : '';

  return (
    <section className="monthly-panel" aria-labelledby="monthly-heading" aria-busy={loading}>
      <div className="monthly-panel-head">
        <div>
          <p className="chart-kicker">Overview</p>
          <h2 id="monthly-heading">Monthly summary</h2>
          <p className="chart-subtitle">Income, expenses, and net for the last 6 months</p>
        </div>
        {!loading && !error && hasData && (
          <div className="chart-stat">
            <span>6-month net</span>
            <strong className={netTotal < 0 ? 'amount-negative' : 'amount-positive'}>
              {netTotal >= 0 ? '+' : ''}
              {formatCurrency(netTotal)}
            </strong>
          </div>
        )}
      </div>

      {loading ? (
        <div className="monthly-list" aria-hidden="true">
          {[0, 1, 2, 3].map((item) => (
            <div className="monthly-row monthly-row--skeleton" key={item}>
              <span className="skeleton skeleton-line skeleton-line--short" />
              <span className="skeleton skeleton-line" />
              <span className="skeleton skeleton-line skeleton-line--short" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="monthly-empty" role="alert">
          <p>Monthly summary data is unavailable.</p>
        </div>
      ) : !hasData ? (
        <div className="monthly-empty">
          <p>Monthly totals will appear after you record income or expenses.</p>
        </div>
      ) : (
        <>
          <div className="monthly-list">
            {rows.map((row, index) => {
              const isCurrentMonth = index === 0;
              return (
                <div
                  className={`monthly-row${isCurrentMonth ? ' is-current' : ''}`}
                  key={row.key}
                >
                  <div className="monthly-month">
                    <strong>{row.label}</strong>
                    {isCurrentMonth && <span className="monthly-current">This month</span>}
                  </div>
                  <div className="monthly-metrics">
                    <span className="monthly-metric">
                      <span>Income</span>
                      <strong className="amount-income">{formatCurrency(row.income)}</strong>
                    </span>
                    <span className="monthly-metric">
                      <span>Expenses</span>
                      <strong className="amount-expense">{formatCurrency(row.expenses)}</strong>
                    </span>
                  </div>
                  <span className={`monthly-net ${row.net < 0 ? 'negative' : 'positive'}`}>
                    {row.net >= 0 ? '+' : ''}
                    {formatCurrency(row.net)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="monthly-totals">
            <span>
              {periodLabel} · Income {formatCurrency(getTotal(monthlyIncome.slice(-6)))}
              {' · '}
              Expenses {formatCurrency(getTotal(monthlyExpenses.slice(-6)))}
            </span>
          </div>
        </>
      )}
    </section>
  );
};

export default MonthlySummary;
