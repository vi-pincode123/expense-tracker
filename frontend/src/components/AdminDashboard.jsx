import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminService, getApiErrorMessage } from '../services/api';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatNumber = (value) =>
  new Intl.NumberFormat('en-US').format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const AdminStat = ({ label, value, tone = '' }) => (
  <article className={`admin-stat-card ${tone}`.trim()}>
    <span className="admin-stat-label">{label}</span>
    <strong className="admin-stat-value">{value}</strong>
  </article>
);

const AdminDashboard = ({ currentUser }) => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadAdminData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');

    const [statsResult, usersResult] = await Promise.allSettled([
      adminService.getStats(),
      adminService.getUsers(),
    ]);

    const errors = [];

    if (statsResult.status === 'fulfilled') {
      setStats(statsResult.value.data);
    } else {
      console.error('Error fetching admin statistics:', statsResult.reason);
      errors.push(
        getApiErrorMessage(statsResult.reason, 'Unable to load application statistics.')
      );
    }

    if (usersResult.status === 'fulfilled') {
      setUsers(Array.isArray(usersResult.value.data) ? usersResult.value.data : []);
    } else {
      console.error('Error fetching users:', usersResult.reason);
      errors.push(getApiErrorMessage(usersResult.reason, 'Unable to load the user list.'));
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    if (!success) return undefined;
    const timeoutId = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timeoutId);
  }, [success]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
      );
    });
  }, [users, search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminData({ silent: true });
    setRefreshing(false);
  };

  const handleToggleStatus = async (user) => {
    if (updatingId || user.id === currentUser?.id) return;

    const nextActive = !user.active;
    const action = nextActive ? 'reactivate' : 'deactivate';
    const message = nextActive
      ? `Reactivate ${user.name}? They will be able to sign in again.`
      : `Deactivate ${user.name}? They will be signed out and unable to log in until reactivated.`;

    if (!window.confirm(message)) return;

    setError('');
    setSuccess('');
    setUpdatingId(user.id);

    try {
      const response = await adminService.updateUserStatus(user.id, nextActive);
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? response.data : item))
      );
      setSuccess(`${user.name} has been ${action}d.`);
      await loadAdminData({ silent: true });
    } catch (err) {
      console.error(`Error trying to ${action} user:`, err);
      setError(
        getApiErrorMessage(err, `Unable to ${action} this account. Please try again.`)
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const statCards = stats
    ? [
        { label: 'Total users', value: formatNumber(stats.totalUsers) },
        { label: 'Active users', value: formatNumber(stats.activeUsers), tone: 'positive' },
        { label: 'Inactive users', value: formatNumber(stats.inactiveUsers), tone: 'muted' },
        { label: 'Admin accounts', value: formatNumber(stats.adminUsers), tone: 'accent' },
        { label: 'Transactions', value: formatNumber(stats.totalExpenses) },
        { label: 'Total income', value: formatCurrency(stats.totalIncome), tone: 'positive' },
        { label: 'Total expenses', value: formatCurrency(stats.totalExpenseAmount), tone: 'negative' },
        { label: 'Net balance', value: formatCurrency(stats.balance), tone: 'accent' },
      ]
    : [];

  return (
    <main className="dashboard admin-dashboard">
      <div className="dashboard-toolbar">
        <div>
          <span className="dashboard-kicker">Administrator workspace</span>
          <h2 className="dashboard-title">Application overview</h2>
          <p className="dashboard-subtitle">
            Aggregate statistics and account controls. User transactions remain private.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleRefresh}
          disabled={refreshing || loading}
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
            <path d="M20 11a8 8 0 1 0-2.3 6.3" />
            <path d="M20 5v6h-6" />
          </svg>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
          <button type="button" className="alert-action" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      )}

      <section className="admin-stats" aria-label="Application statistics">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <article className="admin-stat-card" key={index}>
                <span className="skeleton admin-stat-skeleton-label" aria-hidden="true" />
                <span className="skeleton admin-stat-skeleton-value" aria-hidden="true" />
              </article>
            ))
          : statCards.map((card) => (
              <AdminStat
                key={card.label}
                label={card.label}
                value={card.value}
                tone={card.tone}
              />
            ))}
      </section>

      <section className="admin-section" aria-labelledby="admin-users-title">
        <div className="admin-section-header">
          <div>
            <h3 id="admin-users-title">User accounts</h3>
            <p>
              View account status and manage access. Password hashes are never
              included in this view.
            </p>
          </div>
          <span className="admin-count-pill">
            {formatNumber(filteredUsers.length)}
            {search ? ` of ${formatNumber(users.length)}` : ''} shown
          </span>
        </div>

        <div className="admin-toolbar">
          <label className="admin-search" htmlFor="admin-user-search">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="admin-user-search"
              type="search"
              placeholder="Search by name, email, or role…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <span className="admin-note">Admins cannot open another user&apos;s expenses.</span>
        </div>

        <div className="table-container admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Transactions</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="skeleton-row">
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <td key={cellIndex}>
                        <span className="skeleton skeleton-line" aria-hidden="true" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty">
                      <strong>No matching users</strong>
                      <span>Try a different name, email, or role.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  const isUpdating = updatingId === user.id;

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-user-cell">
                          <span className="admin-user-avatar" aria-hidden="true">
                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                          </span>
                          <span>
                            <strong className="admin-user-name">
                              {user.name}
                              {isSelf && <span className="you-tag">You</span>}
                            </strong>
                            <span className="admin-user-email">{user.email}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${user.role === 'ADMIN' ? 'admin' : 'user'}`}>
                          {user.role === 'ADMIN' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${user.active ? 'active' : 'inactive'}`}>
                          <span className="status-dot" aria-hidden="true" />
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="admin-number-cell">{formatNumber(user.expenseCount)}</td>
                      <td className="cell-date">{formatDate(user.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className={`btn btn-sm ${user.active ? 'btn-delete' : 'btn-export'}`}
                          onClick={() => handleToggleStatus(user)}
                          disabled={isSelf || isUpdating}
                          title={
                            isSelf
                              ? 'You cannot deactivate your own account.'
                              : `${user.active ? 'Deactivate' : 'Reactivate'} ${user.name}`
                          }
                        >
                          {isUpdating
                            ? 'Updating…'
                            : user.active
                              ? 'Deactivate'
                              : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default AdminDashboard;
