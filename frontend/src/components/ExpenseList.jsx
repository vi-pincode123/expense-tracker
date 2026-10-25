import React, { useMemo, useState } from 'react';

const EMPTY_FILTERS = {
  search: '',
  type: '',
  category: '',
  fromDate: '',
  toDate: '',
  minAmount: '',
  maxAmount: '',
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

const escapeCsvValue = (value) => {
  let stringValue = value === null || value === undefined ? '' : String(value);
  // Prevent spreadsheet formula injection while keeping the visible value readable.
  if (/^[=+\-@]/.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }
  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M4 20h16" />
  </svg>
);

const ExpenseList = ({
  expenses = [],
  onEdit,
  onDelete,
  loading = false,
  error = '',
  onRetry,
}) => {
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const categories = useMemo(() => {
    return [...new Set(expenses.map((expense) => expense.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }, [expenses]);

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  const rangeError = useMemo(() => {
    if (
      filters.minAmount !== '' &&
      filters.maxAmount !== '' &&
      Number(filters.minAmount) > Number(filters.maxAmount)
    ) {
      return 'Minimum amount cannot be greater than maximum amount.';
    }
    if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
      return 'Start date cannot be after end date.';
    }
    return '';
  }, [filters]);

  const filteredExpenses = useMemo(() => {
    if (rangeError) return [];

    const searchTerm = filters.search.trim().toLowerCase();
    const minAmount = filters.minAmount === '' ? null : Number(filters.minAmount);
    const maxAmount = filters.maxAmount === '' ? null : Number(filters.maxAmount);

    return expenses
      .filter((expense) => {
        if (searchTerm) {
          const haystack = `${expense.title || ''} ${expense.description || ''}`.toLowerCase();
          if (!haystack.includes(searchTerm)) return false;
        }
        if (filters.type && expense.type !== filters.type) return false;
        if (filters.category && expense.category !== filters.category) return false;
        if (filters.fromDate && expense.transactionDate < filters.fromDate) return false;
        if (filters.toDate && expense.transactionDate > filters.toDate) return false;

        const amount = Number(expense.amount);
        if (minAmount !== null && amount < minAmount) return false;
        if (maxAmount !== null && amount > maxAmount) return false;
        return true;
      })
      .sort((a, b) => {
        const dateCompare = (b.transactionDate || '').localeCompare(a.transactionDate || '');
        if (dateCompare !== 0) return dateCompare;
        return (b.id || 0) - (a.id || 0);
      });
  }, [expenses, filters, rangeError]);

  const totals = useMemo(() => {
    return filteredExpenses.reduce(
      (accumulator, expense) => {
        if (expense.type === 'INCOME') {
          accumulator.income += Number(expense.amount) || 0;
        } else if (expense.type === 'EXPENSE') {
          accumulator.expenses += Number(expense.amount) || 0;
        }
        return accumulator;
      },
      { income: 0, expenses: 0 }
    );
  }, [filteredExpenses]);

  const handleExportCsv = () => {
    if (filteredExpenses.length === 0) return;

    const header = ['ID', 'Title', 'Type', 'Category', 'Date', 'Amount', 'Description'];
    const rows = filteredExpenses.map((expense) => [
      expense.id,
      expense.title,
      expense.type,
      expense.category,
      expense.transactionDate,
      Number(expense.amount).toFixed(2),
      expense.description || '',
    ]);

    const csvContent = `\uFEFF${[header, ...rows]
      .map((row) => row.map(escapeCsvValue).join(','))
      .join('\r\n')}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <>
          {[0, 1, 2, 3].map((row) => (
            <tr key={row} className="skeleton-row">
              {[0, 1, 2, 3, 4, 5, 6].map((cell) => (
                <td key={cell}>
                  <span className="skeleton skeleton-line" aria-hidden="true" />
                </td>
              ))}
            </tr>
          ))}
        </>
      );
    }

    return filteredExpenses.map((expense) => (
      <tr key={expense.id}>
        <td className="cell-title" title={expense.title}>{expense.title}</td>
        <td className={`amount ${expense.type.toLowerCase()}`}>
          {expense.type === 'INCOME' ? '+' : ''}
          {formatCurrency(expense.amount)}
        </td>
        <td>
          <span className={`type-badge ${expense.type.toLowerCase()}`}>
            {expense.type}
          </span>
        </td>
        <td>{expense.category}</td>
        <td className="cell-date">{formatDate(expense.transactionDate)}</td>
        <td className="cell-description" title={expense.description || ''}>
          {expense.description || '—'}
        </td>
        <td className="cell-actions">
          <button
            type="button"
            className="btn btn-edit btn-sm"
            onClick={() => onEdit(expense)}
            aria-label={`Edit ${expense.title}`}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-delete btn-sm"
            onClick={() => onDelete(expense.id)}
            aria-label={`Delete ${expense.title}`}
          >
            Delete
          </button>
        </td>
      </tr>
    ));
  };

  const showTable = loading || (!error && filteredExpenses.length > 0);

  return (
    <section className="transactions-section" aria-labelledby="transactions-heading">
      <div className="section-header">
        <div>
          <h2 id="transactions-heading">Transactions</h2>
          <p className="section-subtitle">Search, filter, and export your records</p>
        </div>
        <span className="count-badge">
          {loading ? 'Loading…' : `${filteredExpenses.length} of ${expenses.length}`}
        </span>
      </div>

      <div className="filter-panel">
        <div className="filter-grid">
          <div className="filter-group filter-group--search">
            <label htmlFor="search">Search</label>
            <div className="input-with-icon">
              <SearchIcon />
              <input
                type="search"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by title or description…"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="filterType">Type</label>
            <select id="filterType" name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filterCategory">Category</label>
            <select
              id="filterCategory"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="fromDate">From date</label>
            <input
              type="date"
              id="fromDate"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleFilterChange}
              max={filters.toDate || undefined}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="toDate">To date</label>
            <input
              type="date"
              id="toDate"
              name="toDate"
              value={filters.toDate}
              onChange={handleFilterChange}
              min={filters.fromDate || undefined}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="minAmount">Min amount</label>
            <input
              type="number"
              id="minAmount"
              name="minAmount"
              value={filters.minAmount}
              onChange={handleFilterChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              inputMode="decimal"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="maxAmount">Max amount</label>
            <input
              type="number"
              id="maxAmount"
              name="maxAmount"
              value={filters.maxAmount}
              onChange={handleFilterChange}
              placeholder="No limit"
              min="0"
              step="0.01"
              inputMode="decimal"
            />
          </div>
        </div>

        {rangeError && <p className="filter-error" role="alert">{rangeError}</p>}

        <div className="filter-actions">
          <p className="filter-summary">
            <strong>{filteredExpenses.length}</strong> {filteredExpenses.length === 1 ? 'record' : 'records'}
            <span className="filter-summary-divider">·</span>
            Expenses <strong>{formatCurrency(totals.expenses)}</strong>
            <span className="filter-summary-divider">·</span>
            Income <strong>{formatCurrency(totals.income)}</strong>
          </p>
          <div className="filter-buttons">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              Clear filters
            </button>
            <button
              type="button"
              className="btn btn-export btn-sm"
              onClick={handleExportCsv}
              disabled={loading || filteredExpenses.length === 0}
              title="Export the filtered transactions as a CSV file"
            >
              <DownloadIcon />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="empty-state empty-state--error" role="alert">
          <h3>Unable to load transactions</h3>
          <p>{error}</p>
          {onRetry && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      ) : !loading && expenses.length === 0 ? (
        <div className="empty-state">
          <h3>No transactions yet</h3>
          <p>Add your first income or expense using the form to see it here.</p>
        </div>
      ) : !loading && filteredExpenses.length === 0 ? (
        <div className="empty-state">
          <h3>No matching transactions</h3>
          <p>{rangeError || 'Try adjusting your search or filters.'}</p>
          {hasActiveFilters && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Amount</th>
                <th scope="col">Type</th>
                <th scope="col">Category</th>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>{renderTableBody()}</tbody>
          </table>
          {showTable && !loading && filteredExpenses.length > 0 && (
            <p className="table-footnote">
              Showing {filteredExpenses.length} of {expenses.length} transactions, newest first.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default ExpenseList;
