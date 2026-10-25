import React, { useState } from 'react';
import Brand from './Brand';
import ThemeToggle from './ThemeToggle';
import { authService, getApiErrorMessage } from '../services/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const AuthPage = ({ theme, onToggleTheme, onAuthenticated, initialError = '' }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(initialError || '');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    if (serverError) setServerError('');
  };

  const switchMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setFieldErrors({});
    setServerError('');
    setForm((current) => ({
      ...INITIAL_FORM,
      email: current.email,
    }));
  };

  const validate = () => {
    const errors = {};
    const email = form.email.trim();

    if (isRegister && !form.name.trim()) {
      errors.name = 'Enter your full name.';
    }

    if (!email) {
      errors.email = 'Enter your email address.';
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!form.password) {
      errors.password = 'Enter your password.';
    } else if (isRegister && (form.password.length < 8 || form.password.length > 72)) {
      errors.password = 'Password must be between 8 and 72 characters.';
    } else if (
      isRegister &&
      (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
    ) {
      errors.password = 'Password must include at least one letter and one number.';
    }

    if (isRegister && form.confirmPassword !== form.password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setServerError('');

    try {
      const payload = isRegister
        ? {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
          }
        : {
            email: form.email.trim(),
            password: form.password,
          };

      const response = isRegister
        ? await authService.register(payload)
        : await authService.login(payload);

      onAuthenticated(response.data);
    } catch (error) {
      setServerError(
        getApiErrorMessage(
          error,
          isRegister
            ? 'Unable to create your account. Please try again.'
            : 'Unable to sign in. Please try again.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <header className="auth-topbar">
        <Brand subtitle="Secure personal finance tracking" />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>

      <main className="auth-main">
        <section className="auth-intro" aria-labelledby="auth-intro-title">
          <span className="auth-eyebrow">Private by design</span>
          <h2 id="auth-intro-title">Your money, clearly yours.</h2>
          <p>
            Track income and spending, understand your habits, and keep every
            transaction visible only to the account that owns it.
          </p>

          <ul className="auth-feature-list">
            <li>
              <span className="auth-feature-icon" aria-hidden="true">01</span>
              <span>
                <strong>Owner-scoped records</strong>
                <small>Your dashboard only loads your transactions.</small>
              </span>
            </li>
            <li>
              <span className="auth-feature-icon" aria-hidden="true">02</span>
              <span>
                <strong>Role-based access</strong>
                <small>Admin tools are restricted to administrator accounts.</small>
              </span>
            </li>
            <li>
              <span className="auth-feature-icon" aria-hidden="true">03</span>
              <span>
                <strong>Light and dark</strong>
                <small>Your theme preference carries across the app.</small>
              </span>
            </li>
          </ul>
        </section>

        <section className="auth-card" aria-labelledby="auth-form-title">
          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Create account
            </button>
          </div>

          <div className="auth-card-heading">
            <h2 id="auth-form-title">
              {isRegister ? 'Start tracking today' : 'Welcome back'}
            </h2>
            <p>
              {isRegister
                ? 'Create a standard user account. Admin access is provisioned separately.'
                : 'Sign in to see your private dashboard.'}
            </p>
          </div>

          {serverError && (
            <div className="alert alert-error auth-error" role="alert" aria-live="polite">
              {serverError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isRegister && (
              <div className="form-group">
                <label htmlFor="auth-name">Full name</label>
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={updateField}
                  maxLength={100}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'auth-name-error' : undefined}
                />
                {fieldErrors.name && (
                  <p className="field-error" id="auth-name-error">{fieldErrors.name}</p>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={updateField}
                maxLength={190}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
              />
              {fieldErrors.email && (
                <p className="field-error" id="auth-email-error">{fieldErrors.email}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
                value={form.password}
                onChange={updateField}
                maxLength={72}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'auth-password-error' : undefined}
              />
              {fieldErrors.password && (
                <p className="field-error" id="auth-password-error">{fieldErrors.password}</p>
              )}
              {isRegister && !fieldErrors.password && (
                <p className="auth-hint">Use 8–72 characters with at least one letter and one number.</p>
              )}
            </div>

            {isRegister && (
              <div className="form-group">
                <label htmlFor="auth-confirm-password">Confirm password</label>
                <input
                  id="auth-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={updateField}
                  maxLength={72}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={
                    fieldErrors.confirmPassword ? 'auth-confirm-password-error' : undefined
                  }
                />
                {fieldErrors.confirmPassword && (
                  <p className="field-error" id="auth-confirm-password-error">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={submitting}
            >
              {submitting
                ? isRegister
                  ? 'Creating account…'
                  : 'Signing in…'
                : isRegister
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          <p className="auth-footnote">
            {isRegister
              ? 'Already have an account?'
              : 'New to Expense Tracker?'}{' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => switchMode(isRegister ? 'login' : 'register')}
            >
              {isRegister ? 'Sign in instead' : 'Create an account'}
            </button>
          </p>
        </section>
      </main>

      <footer className="auth-footer">
        <span>Expense Tracker</span>
        <span>Private finance workspace</span>
      </footer>
    </div>
  );
};

export default AuthPage;
