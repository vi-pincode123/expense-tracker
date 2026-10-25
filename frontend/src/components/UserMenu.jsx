import React from 'react';

const UserMenu = ({ user, onLogout, onProfile }) => {
  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();
  const roleLabel = user?.role === 'ADMIN' ? 'Admin' : 'User';

  return (
    <div className="user-menu">
      <button
        type="button"
        className="user-avatar user-avatar-button"
        onClick={onProfile}
        title="View profile"
        aria-label="View profile"
      >
        {initial}
      </button>
      <span className="user-meta">
        <span className="user-name" title={user?.email || ''}>
          {user?.name || user?.email}
        </span>
        <span className={`role-badge ${user?.role === 'ADMIN' ? 'admin' : 'user'}`}>
          {roleLabel}
        </span>
      </span>
      <button
        type="button"
        className="btn btn-ghost btn-sm logout-button"
        onClick={onLogout}
        title="Sign out"
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
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
        </svg>
        <span className="logout-label">Logout</span>
      </button>
    </div>
  );
};

export default UserMenu;
