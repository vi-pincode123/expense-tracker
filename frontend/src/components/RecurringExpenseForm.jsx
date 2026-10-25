import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_CATEGORIES } from '../constants/categories';

const FREQUENCY_OPTIONS = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const getTodayLocal = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const createEmptyForm = () => {
  const today = getTodayLocal();
  return {
    amount: '',
    category: '',
    description: '',
    startDate: today,
    frequency: 'MONTHLY',
    nextDueDate: today,
  };
};

const RecurringExpenseForm = ({
  onSubmit,
  editingRecurring,
  onCancelEdit,
  saving = false,
  categories = [],
}) => {
  const [formData, setFormData] = useState(createEmptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingRecurring) {
      setFormData({
        amount: editingRecurring.amount ?? '',
        category: editingRecurring.category || '',
        description: editingRecurring.description || '',
        startDate: editingRecurring.startDate || getTodayLocal(),
        frequency: editingRecurring.frequency || 'MONTHLY',
        nextDueDate: editingRecurring.nextDueDate || getTodayLocal(),
      });
    } else {
      setFormData(createEmptyForm());
    }
    setErrors({});
  }, [editingRecurring]);

  const categoryOptions = useMemo(() => {
    return [
      ...new Set([
        ...DEFAULT_CATEGORIES,
        ...categories.filter(Boolean),
        formData.category,
      ].filter(Boolean)),
    ];
  }, [categories, formData.category]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount && formData.amount !== 0) {
      newErrors.amount = 'Amount is required';
    } else if (Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.frequency) {
      newErrors.frequency = 'Frequency is required';
    }
    if (!formData.nextDueDate) {
      newErrors.nextDueDate = 'Next due date is required';
    } else if (formData.startDate && formData.nextDueDate < formData.startDate) {
      newErrors.nextDueDate = 'Next due date cannot be before the start date';
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

  const handleStartDateChange = (event) => {
    const { value } = event.target;
    setFormData((previous) => ({
      ...previous,
      startDate: value,
      nextDueDate:
        !previous.nextDueDate || previous.nextDueDate < value
          ? value
          : previous.nextDueDate,
    }));
    setErrors((previous) => ({ ...previous, startDate: '', nextDueDate: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const saved = await onSubmit({
      amount: Number(formData.amount),
      category: formData.category.trim(),
      description: formData.description.trim() || null,
      startDate: formData.startDate,
      frequency: formData.frequency,
      nextDueDate: formData.nextDueDate,
    });

    if (saved && !editingRecurring) {
      setFormData(createEmptyForm());
      setErrors({});
    }
  };

  return (
    <section className="form-section" aria-labelledby="recurring-form-heading">
      <div className="section-header">
        <div>
          <h2 id="recurring-form-heading">
            {editingRecurring ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
          </h2>
          <p className="section-subtitle">
            {editingRecurring
              ? 'Update the schedule below'
              : 'Set up a bill, subscription, or regular payment'}
          </p>
        </div>
        {editingRecurring && <span className="editing-badge">Editing</span>}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="recurring-amount">
              Amount <span className="required-mark">*</span>
            </label>
            <input
              type="number"
              id="recurring-amount"
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
            <label htmlFor="recurring-frequency">
              Frequency <span className="required-mark">*</span>
            </label>
            <select
              id="recurring-frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.frequency && <p className="field-error">{errors.frequency}</p>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="recurring-category">
            Category <span className="required-mark">*</span>
          </label>
          <select
            id="recurring-category"
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

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="recurring-start-date">
              Start date <span className="required-mark">*</span>
            </label>
            <input
              type="date"
              id="recurring-start-date"
              name="startDate"
              value={formData.startDate}
              onChange={handleStartDateChange}
              aria-invalid={Boolean(errors.startDate)}
            />
            {errors.startDate && <p className="field-error">{errors.startDate}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="recurring-next-due-date">
              Next due date <span className="required-mark">*</span>
            </label>
            <input
              type="date"
              id="recurring-next-due-date"
              name="nextDueDate"
              value={formData.nextDueDate}
              onChange={handleChange}
              min={formData.startDate || undefined}
              aria-invalid={Boolean(errors.nextDueDate)}
            />
            {errors.nextDueDate && <p className="field-error">{errors.nextDueDate}</p>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="recurring-description">
            Description <span className="optional-mark">(optional)</span>
          </label>
          <textarea
            id="recurring-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g. Internet subscription"
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? 'Saving…'
              : editingRecurring
                ? 'Update Recurring Expense'
                : 'Add Recurring Expense'}
          </button>
          {editingRecurring && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
};

export default RecurringExpenseForm;
