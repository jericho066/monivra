import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../utils/helpers';

const PieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x} y={y}
      fill="#1a202c"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{ fontSize: '14px', fontWeight: '600' }}
    >
      {`${name}: ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const SpendingPieChart = ({ categoryData }) => (
  <div className="chart-section">
    <h2 className="section-title">Spending by Category</h2>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={categoryData}
          cx="50%" cy="50%"
          outerRadius={100}
          dataKey="value"
          labelLine={window.innerWidth >= 768}
          label={window.innerWidth >= 768 ? PieLabel : false}
        >
          {categoryData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value)} />
      </PieChart>
    </ResponsiveContainer>

    <div className="category-legend">
      {categoryData.slice(0, 5).map(cat => (
        <div key={cat.name} className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: cat.color }} />
          <span className="legend-text">
            <i className={`bi ${cat.icon}`} aria-hidden="true" />
            {cat.name}: {formatCurrency(cat.value)}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const MonthlyTrendChart = ({ monthlyTrendData }) => (
  <div className="chart-section">
    <h2 className="section-title">Monthly Trend (Last 6 Months)</h2>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={monthlyTrendData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '13px' }} />
        <YAxis stroke="#6b7280" style={{ fontSize: '13px' }} />
        <Tooltip
          formatter={(value) => formatCurrency(value)}
          contentStyle={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        />
        <Bar dataKey="income"   fill="#10b981" radius={[8, 8, 0, 0]} />
        <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>

    <div className="category-legend" style={{ marginTop: '16px' }}>
      <div className="legend-item">
        <span className="legend-dot" style={{ backgroundColor: '#10b981' }} />
        <span className="legend-text">Income</span>
      </div>
      <div className="legend-item">
        <span className="legend-dot" style={{ backgroundColor: '#f43f5e' }} />
        <span className="legend-text">Expenses</span>
      </div>
    </div>
  </div>
);

const ChartSection = ({ categoryData, monthlyTrendData, hasTransactions }) => (
  <>
    {categoryData.length > 0 && <SpendingPieChart categoryData={categoryData} />}
    {hasTransactions && <MonthlyTrendChart monthlyTrendData={monthlyTrendData} />}
  </>
);

export default ChartSection;

