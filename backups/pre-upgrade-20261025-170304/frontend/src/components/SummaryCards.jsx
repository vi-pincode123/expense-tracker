import React from 'react';

const SummaryCards = ({ summary }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <div className="summary-cards">
      <div className="summary-card income">
        <h3>Total Income</h3>
        <p>{formatCurrency(summary.totalIncome)}</p>
      </div>
      <div className="summary-card expense">
        <h3>Total Expenses</h3>
        <p>{formatCurrency(summary.totalExpenses)}</p>
      </div>
      <div className="summary-card balance">
        <h3>Balance</h3>
        <p>{formatCurrency(summary.balance)}</p>
      </div>
    </div>
  );
};

export default SummaryCards;
