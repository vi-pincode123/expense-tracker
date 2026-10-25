import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_CATEGORIES } from '../constants/categories';

const getTodayLocal = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const createEmptyForm = () => ({
  title: '',
  amount: '',
  type: 'EXPENSE',
  category: '',
  transactionDate: getTodayLocal(),
  description: '',
});

const ExpenseForm = ({
  onSubmit,
  editingExpense,
  onCancelEdit,
  saving = false,
  categories = [],
}) => {
  const [formData, setFormData] = useState(createEmptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        title: editingExpense.title || '',
        amount: editingExpense.amount ?? '',
        type: editingExpense.type || 'EXPENSE',
        category: editingExpense.category || '',
        transactionDate: editingExpense.transactionDate || getTodayLocal(),
        description: editingExpense.description || '',
      });
    } else {
      setFormData(createEmptyForm());
    }
    setErrors({});
  }, [editingExpense]);

  const categoryOptions = useMemo(() => {
    const merged = new Set([
      ...DEFAULT_CATEGORIES,
      ...categories.filter(Boolean),
      formData.category,
    ].filter(Boolean));
    return [...merged];
  }, [categories, formData.category]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.amount && formData.amount !== 0) {
      newErrors.amount = 'Amount is required';
    } else if (Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (!formData.transactionDate) {
      newErrors.transactionDate = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const saved = await onSubmit({
      ...formData,
      title: formData.title.trim(),
      category: formData.category.trim(),
      amount: Number(formData.amount),
    });

    if (saved && !editingExpense) {
      setFormData(createEmptyForm());
      setErrors({});
    }
  };

  return (
    <section className="form-section" aria-labelledby="form-heading">
      <div className="section-header">
        <div>
          <h2 id="form-heading">{editingExpense ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <p className="section-subtitle">
            {editingExpense ? 'Update the details below' : 'Record a new income or expense'}
          </p>
        </div>
        {editingExpense && <span className="editing-badge">Editing</span>}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="title">Title <span className="required-mark">*</span></label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Grocery shopping"
            maxLength={255}
            autoComplete="off"
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="amount">Amount <span className="required-mark">*</span></label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              aria-invalid={Boolean(errors.amount)}
            />
            {errors.amount && <p className="field-error">{errors.amount}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="type">Type <span className="required-mark">*</span></label>
            <select id="type" name="type" value={formData.type} onChange={handleChange}>
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
            {errors.type && <p className="field-error">{errors.type}</p>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="category">Category <span className="required-mark">*</span></label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            aria-invalid={Boolean(errors.category)}
          >
            <option value="">Select a category</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.category && <p className="field-error">{errors.category}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="transactionDate">Date <span className="required-mark">*</span></label>
          <input
            type="date"
            id="transactionDate"
            name="transactionDate"
            value={formData.transactionDate}
            onChange={handleChange}
            aria-invalid={Boolean(errors.transactionDate)}
          />
          {errors.transactionDate && <p className="field-error">{errors.transactionDate}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description <span className="optional-mark">(optional)</span></label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add a note about this transaction"
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editingExpense ? 'Update Transaction' : 'Add Transaction'}
          </button>
          {editingExpense && (
            <button type="button" className="btn btn-secondary" onClick={onCancelEdit} disabled={saving}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
};

export default ExpenseForm;
