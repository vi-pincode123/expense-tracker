import React from 'react';

const Brand = ({ subtitle = 'Your personal finance dashboard' }) => (
  <div className="brand">
    <span className="brand-mark" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v12H5.5A2.5 2.5 0 0 1 3 16.5v-9Z" />
        <path d="M3 8h15" />
        <path d="M16 12.5h5v4h-5a2 2 0 0 1 0-4Z" />
      </svg>
    </span>
    <div>
      <h1>Expense Tracker</h1>
      <p>{subtitle}</p>
    </div>
  </div>
);

export default Brand;
