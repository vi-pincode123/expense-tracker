import React, { useCallback, useEffect, useState } from 'react';
import { authService, UNAUTHORIZED_EVENT } from './services/api';
import {
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
} from './services/authStorage';
import AuthPage from './components/AuthPage';
import AdminDashboard from './components/AdminDashboard';
import Brand from './components/Brand';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import RecurringExpensesPage from './pages/RecurringExpensesPage';
import ThemeToggle from './components/ThemeToggle';
import UserMenu from './components/UserMenu';
import './index.css';

const THEME_STORAGE_KEY = 'expense-tracker-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (error) {
    // Ignore storage errors and fall back to the operating-system preference.
  }

  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [auth, setAuth] = useState(() => {
    const stored = getStoredAuth();
    return {
      user: null,
      token: stored?.token || null,
      loading: Boolean(stored?.token),
    };
  });
  const [authError, setAuthError] = useState('');
  const [view, setView] = useState('dashboard');
  const [profileReturnView, setProfileReturnView] = useState('dashboard');

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const stored = getStoredAuth();
      if (!stored?.token) {
        setAuth({ user: null, token: null, loading: false });
        return;
      }

      try {
        const response = await authService.me();
        if (!active) return;

        setStoredAuth({ token: stored.token, user: response.data });
        setAuth({ user: response.data, token: stored.token, loading: false });
        setView(response.data.role === 'ADMIN' ? 'admin' : 'dashboard');
      } catch (error) {
        if (!active) return;
        clearStoredAuth();
        setAuth({ user: null, token: null, loading: false });
        setAuthError('Your session has expired. Please log in again.');
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      // The theme still applies for this session if storage is unavailable.
    }

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute('content', theme === 'dark' ? '#0b1120' : '#4f46e5');
    }
  }, [theme]);

  useEffect(() => {
    const handleUnauthorized = (event) => {
      clearStoredAuth();
      setAuth({ user: null, token: null, loading: false });
      setAuthError(event?.detail?.message || 'Your session has expired. Please log in again.');
      setView('dashboard');
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleAuthenticated = useCallback((response) => {
    const nextAuth = { token: response.token, user: response.user };
    setStoredAuth(nextAuth);
    setAuth({ ...nextAuth, loading: false });
    setAuthError('');
    setView(response.user.role === 'ADMIN' ? 'admin' : 'dashboard');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Local sign-out must still succeed if the server token is already invalid.
    }
    clearStoredAuth();
    setAuth({ user: null, token: null, loading: false });
    setAuthError('');
    setView('dashboard');
  }, []);

  const handleProfileSaved = useCallback((response) => {
    const nextAuth = { token: response.token, user: response.user };
    setStoredAuth(nextAuth);
    setAuth({ ...nextAuth, loading: false });
  }, []);

  if (auth.loading) {
    return (
      <div className="session-loading" role="status" aria-live="polite">
        <span className="session-loading-spinner" aria-hidden="true" />
        <span>Checking your session…</span>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <AuthPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onAuthenticated={handleAuthenticated}
        initialError={authError}
      />
    );
  }

  const isAdmin = auth.user.role === 'ADMIN';
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="app-shell">
      <header className="app-header">
        <Brand />

        <nav className="app-nav" aria-label="Primary navigation">
          <button
            type="button"
            className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
            aria-current={view === 'dashboard' ? 'page' : undefined}
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
              <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />
            </svg>
            My Expenses
          </button>
          <button
            type="button"
            className={`nav-btn ${view === 'recurring' ? 'active' : ''}`}
            onClick={() => setView('recurring')}
            aria-current={view === 'recurring' ? 'page' : undefined}
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
              <path d="M4 10a8 8 0 0 1 13.6-5.7L20 6.5" />
              <path d="M20 4v3h-3" />
              <path d="M20 14a8 8 0 0 1-13.6 5.7L4 17.5" />
              <path d="M4 20v-3h3" />
              <path d="M12 8v4l2.5 1.5" />
            </svg>
            Recurring
          </button>
          {isAdmin && (
            <button
              type="button"
              className={`nav-btn ${view === 'admin' ? 'active' : ''}`}
              onClick={() => setView('admin')}
              aria-current={view === 'admin' ? 'page' : undefined}
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
                <path d="M12 3l7 3v5c0 4.6-2.9 8.1-7 10-4.1-1.9-7-5.4-7-10V6l7-3Z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Admin
            </button>
          )}
        </nav>

        <div className="header-actions">
          <span className="header-date">{todayLabel}</span>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <UserMenu
            user={auth.user}
            onLogout={handleLogout}
            onProfile={() => {
              setProfileReturnView(view === 'admin' || view === 'recurring' ? view : 'dashboard');
              setView('profile');
            }}
          />
        </div>
      </header>

      {view === 'profile' ? (
        <ProfilePage
          user={auth.user}
          onSaved={handleProfileSaved}
          onCancel={() => setView(profileReturnView)}
        />
      ) : isAdmin && view === 'admin' ? (
        <AdminDashboard currentUser={auth.user} />
      ) : view === 'recurring' ? (
        <RecurringExpensesPage />
      ) : (
        <DashboardPage theme={theme} user={auth.user} />
      )}

      <footer className="app-footer">
        <span>Expense Tracker</span>
        <span>React · Spring Boot · MySQL</span>
      </footer>
    </div>
  );
}

export default App;
