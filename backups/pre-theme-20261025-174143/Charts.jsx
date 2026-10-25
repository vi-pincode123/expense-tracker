import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CHART_COLORS = [
  '#6366f1', '#f97316', '#10b981', '#ef4444', '#8b5cf6',
  '#06b6d4', '#eab308', '#ec4899', '#14b8a6', '#64748b',
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount) || 0);
};

const formatCompactCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(amount) || 0);
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label || item.name}</p>
      <p className="chart-tooltip-value">{formatCurrency(item.value)}</p>
    </div>
  );
};

const ChartSkeleton = () => (
  <div className="chart-skeleton" aria-hidden="true">
    <span className="skeleton skeleton-chart" />
  </div>
);

const EmptyChart = ({ message }) => (
  <div className="chart-empty">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
    <p>{message}</p>
  </div>
);

const Charts = ({ analytics, loading = false, error = '' }) => {
  const monthlyExpenses = analytics?.monthlyExpenses || [];
  const categoryExpenses = (analytics?.categoryExpenses || []).filter(
    (item) => Number(item.total) > 0
  );

  const monthlyTotal = monthlyExpenses.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0
  );
  const categoryTotal = categoryExpenses.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0
  );

  const hasMonthlyData = monthlyTotal > 0;
  const hasCategoryData = categoryExpenses.length > 0;

  return (
    <section className="charts-grid" aria-label="Expense charts">
      <article className="chart-card chart-card--bar">
        <div className="chart-card-header">
          <div>
            <p className="chart-kicker">Trend</p>
            <h2>Monthly Expenses</h2>
            <p className="chart-subtitle">Spending over the last 12 months</p>
          </div>
          {!loading && !error && hasMonthlyData && (
            <div className="chart-stat">
              <span>12-month total</span>
              <strong>{formatCurrency(monthlyTotal)}</strong>
            </div>
          )}
        </div>

        {loading ? (
          <ChartSkeleton />
        ) : error ? (
          <EmptyChart message="Chart data is unavailable. Try refreshing the dashboard." />
        ) : !hasMonthlyData ? (
          <EmptyChart message="No expenses recorded in the last 12 months." />
        ) : (
          <div className="chart-canvas">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyExpenses} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf5" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  minTickGap={18}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={formatCompactCurrency}
                  width={58}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.07)' }}
                />
                <Bar
                  dataKey="total"
                  name="Expenses"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      <article className="chart-card chart-card--pie">
        <div className="chart-card-header">
          <div>
            <p className="chart-kicker">Breakdown</p>
            <h2>Spending by Category</h2>
            <p className="chart-subtitle">Expense transactions only</p>
          </div>
          {!loading && !error && hasCategoryData && (
            <div className="chart-stat">
              <span>Categories</span>
              <strong>{categoryExpenses.length}</strong>
            </div>
          )}
        </div>

        {loading ? (
          <ChartSkeleton />
        ) : error ? (
          <EmptyChart message="Chart data is unavailable. Try refreshing the dashboard." />
        ) : !hasCategoryData ? (
          <EmptyChart message="No expense categories to show yet." />
        ) : (
          <div className="pie-content">
            <div className="chart-canvas chart-canvas--pie">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryExpenses}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={98}
                    paddingAngle={2}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {categoryExpenses.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="pie-legend">
              {categoryExpenses.map((item, index) => {
                const percentage = categoryTotal > 0
                  ? (Number(item.total) / categoryTotal) * 100
                  : 0;
                return (
                  <li key={item.category}>
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      aria-hidden="true"
                    />
                    <span className="legend-name" title={item.category}>{item.category}</span>
                    <span className="legend-value">{formatCurrency(item.total)}</span>
                    <span className="legend-percent">{percentage.toFixed(0)}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </article>
    </section>
  );
};

export default Charts;
