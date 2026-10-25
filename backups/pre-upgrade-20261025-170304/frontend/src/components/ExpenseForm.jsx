import React, { useState, useEffect } from 'react';

const ExpenseForm = ({ onSubmit, editingExpense, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE',
    category: '',
    transactionDate: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        title: editingExpense.title || '',
        amount: editingExpense.amount || '',
        type: editingExpense.type || 'EXPENSE',
        category: editingExpense.category || '',
        transactionDate: editingExpense.transactionDate || '',
        description: editingExpense.description || ''
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        type: 'EXPENSE',
        category: '',
        transactionDate: '',
        description: ''
      });
    }
    setErrors({});
  }, [editingExpense]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    else if (parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.transactionDate) newErrors.transactionDate = 'Date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      onSubmit(submitData);
    }
  };

  const categories = [
    'Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare',
    'Shopping', 'Salary', 'Freelance', 'Investment', 'Other'
  ];

  return (
    <div className="form-section">
      <h2>{editingExpense ? 'Edit Transaction' : 'Add New Transaction'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter title"
          />
          {errors.title && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>{errors.title}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount *</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter amount"
            step="0.01"
            min="0.01"
          />
          {errors.amount && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>{errors.amount}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="type">Type *</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
          {errors.type && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>{errors.type}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>{errors.category}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="transactionDate">Date *</label>
          <input
            type="date"
            id="transactionDate"
            name="transactionDate"
            value={formData.transactionDate}
            onChange={handleChange}
          />
          {errors.transactionDate && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>{errors.transactionDate}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter description (optional)"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          {editingExpense ? 'Update Transaction' : 'Add Transaction'}
        </button>
        {editingExpense && (
          <button type="button" className="btn btn-secondary" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </form>
    </div>
  );
};

export default ExpenseForm;
