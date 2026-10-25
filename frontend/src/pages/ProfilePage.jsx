import React, { useEffect, useState } from 'react';
import { authService, getApiErrorMessage } from '../services/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const getTodayLocal = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const getInitialForm = (user) => ({
  name: user?.name || '',
  email: user?.email || '',
  phoneNumber: user?.phoneNumber || '',
  dateOfBirth: user?.dateOfBirth || '',
  gender: user?.gender || '',
  address: user?.address || '',
});

const ProfilePage = ({ user, onSaved, onCancel }) => {
  const [form, setForm] = useState(() => getInitialForm(user));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(getInitialForm(user));
  }, [user]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    if (error) setError('');
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Full name is required.';
    }
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (form.dateOfBirth && form.dateOfBirth > getTodayLocal()) {
      nextErrors.dateOfBirth = 'Date of birth cannot be in the future.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim() || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        address: form.address.trim() || null,
      });
      if (response.data?.user) {
        setForm(getInitialForm(response.data.user));
      }
      onSaved(response.data);
      setSuccess('Profile saved successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to save your profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(getInitialForm(user));
    setErrors({});
    setError('');
    setSuccess('');
    onCancel();
  };

  const displayName = (user?.name || user?.email || '?').trim();
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
  const accountLabel = user?.role === 'ADMIN' ? 'Administrator' : 'Personal account';

  return (
    <main className="profile-page">
      <section className="profile-hero" aria-labelledby="profile-heading">
        <div className="profile-identity">
          <div className="profile-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="profile-identity-copy">
            <span className="profile-eyebrow">Account settings</span>
            <h2 id="profile-heading" className="profile-title">My Profile</h2>
            <p className="profile-subtitle">
              Manage your personal details and keep your account information up to date.
            </p>
          </div>
        </div>

        <span className="profile-account-badge">
          <span className="profile-status-dot" aria-hidden="true" />
          {accountLabel}
        </span>
      </section>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      )}

      <section className="profile-card" aria-labelledby="profile-form-heading">
        <div className="profile-card-header">
          <div>
            <h3 id="profile-form-heading">Personal information</h3>
            <p>Update the details associated with your Expense Tracker account.</p>
          </div>
          <span className="profile-secure-pill">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            Private &amp; secure
          </span>
        </div>

        <form className="profile-form" onSubmit={handleSubmit} noValidate>
          <div className="profile-form-grid">
            <div className="form-group profile-field">
              <label htmlFor="profile-name">Full Name <span className="required-mark">*</span></label>
              <input
                id="profile-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Alex Morgan"
                value={form.name}
                onChange={updateField}
                maxLength={100}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>

            <div className="form-group profile-field">
              <label htmlFor="profile-email">Email <span className="required-mark">*</span></label>
              <input
                id="profile-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={updateField}
                maxLength={190}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div className="form-group profile-field">
              <label htmlFor="profile-phone">Phone Number</label>
              <input
                id="profile-phone"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                placeholder="+1 555 0100"
                value={form.phoneNumber}
                onChange={updateField}
                maxLength={30}
              />
            </div>

            <div className="form-group profile-field">
              <label htmlFor="profile-dob">Date of Birth</label>
              <input
                id="profile-dob"
                name="dateOfBirth"
                type="date"
                autoComplete="bday"
                max={getTodayLocal()}
                value={form.dateOfBirth}
                onChange={updateField}
                aria-invalid={Boolean(errors.dateOfBirth)}
              />
              {errors.dateOfBirth && <p className="field-error">{errors.dateOfBirth}</p>}
            </div>

            <div className="form-group profile-field">
              <label htmlFor="profile-gender">Gender</label>
              <select
                id="profile-gender"
                name="gender"
                value={form.gender}
                onChange={updateField}
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="form-group profile-field">
              <label htmlFor="profile-address">Address</label>
              <textarea
                id="profile-address"
                name="address"
                rows={4}
                maxLength={500}
                placeholder="Street, city, state, postal code"
                value={form.address}
                onChange={updateField}
              />
            </div>
          </div>

          <div className="profile-actions">
            <span className="profile-actions-note">
              Your details are stored securely against your account.
            </span>
            <div className="profile-buttons">
              <button
                type="button"
                className="btn btn-secondary profile-cancel-btn"
                onClick={handleCancel}
                disabled={saving}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary profile-save-btn"
                disabled={saving}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
};

export default ProfilePage;
