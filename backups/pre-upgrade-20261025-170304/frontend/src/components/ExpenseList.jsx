import React, { useState } from 'react';

const ExpenseList = ({ expenses, onEdit, onDelete, loading }) => {
  const [filters, setFilters] = useState({
    type: '',
    category: ''
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredExpenses = expenses.filter(expense => {
    if (filters.type && expense.type !== filters.type) return false;
    if (filters.category && expense.category !== filters.category) return false;
    return true;
  });

  const categories = [...new Set(expenses.map(e => e.category))].sort();

  return (
    <div className="transactions-section">
      <h2>Transactions</h2>
      
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="filterType">Filter by Type</label>
          <select
            id="filterType"
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="filterCategory">Filter by Category</label>
          <select
            id="filterCategory"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="no-data">No transactions found</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Category</th>
                <th>Date</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => (
                <tr key={expense.id}>
                  <td>{expense.title}</td>
                  <td className={`amount ${expense.type.toLowerCase()}`}>
                    {formatCurrency(expense.amount)}
                  </td>
                  <td>
                    <span className={`type-badge ${expense.type.toLowerCase()}`}>
                      {expense.type}
                    </span>
                  </td>
                  <td>{expense.category}</td>
                  <td>{formatDate(expense.transactionDate)}</td>
                  <td>{expense.description || '-'}</td>
                  <td>
                    <button 
                      className="btn btn-edit" 
                      onClick={() => onEdit(expense)}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-delete" 
                      onClick={() => onDelete(expense.id)}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
