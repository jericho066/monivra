import { formatCurrency } from '../utils/helpers';

const SavingsRing = ({ rate }) => {
  const clamped = Math.max(0, Math.min(100, rate));
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const isNegative = rate < 0;

  return (
    <div className="savings-ring-wrap">
      <svg width="80" height="80" viewBox="0 0 80 80">
        {/* Track */}
        <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--border)" strokeWidth="7" />
        {/* Fill */}
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke={isNegative ? 'var(--expense)' : clamped >= 50 ? 'var(--income)' : 'var(--brand)'}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isNegative ? 0 : offset}
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        {/* Label */}
        <text x="40" y="44" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text-primary)">
          {isNegative ? '–' : `${Math.round(clamped)}%`}
        </text>
      </svg>
    </div>
  );
};

// Single insight card 
const InsightCard = ({ icon, color, title, value, sub, badge, badgeType }) => (
  <div className="insight-card">
    <div className="insight-card__icon" style={{ backgroundColor: color + '18', color }}>
      <i className={`bi ${icon}`}></i>
    </div>
    <div className="insight-card__body">
      <div className="insight-card__title">{title}</div>
      <div className="insight-card__value">{value}</div>
      {sub && <div className="insight-card__sub">{sub}</div>}
    </div>
    {badge && (
      <span className={`insight-badge insight-badge--${badgeType}`}>{badge}</span>
    )}
  </div>
);


const buildInsights = ({ summary, lastMonthSummary, categoryData, lastMonthCategoryData, transactions, currentDate }) => {
  const insights = [];

  // Month-over-month spending change
  if (lastMonthSummary.expenses > 0 && summary.expenses > 0) {
    const diff = summary.expenses - lastMonthSummary.expenses;
    const pct = Math.round((diff / lastMonthSummary.expenses) * 100);
    const absPct = Math.abs(pct);
    const isOver = diff > 0;

    if (absPct >= 5) {
      insights.push({
        icon: isOver ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle',
        color: isOver ? '#F24B6A' : '#0DB57A',
        title: 'Spending vs Last Month',
        value: `${isOver ? '+' : '-'}${formatCurrency(Math.abs(diff))}`,
        sub: isOver
          ? `You spent ${absPct}% more than last month.`
          : `You spent ${absPct}% less than last month. Great job!`,
        badge: isOver ? `+${absPct}%` : `-${absPct}%`,
        badgeType: isOver ? 'danger' : 'success',
      });
    }
  }

  // Biggest spending category this month
  if (categoryData.length > 0) {
    const top = categoryData[0];
    const pct = summary.expenses > 0
      ? Math.round((top.value / summary.expenses) * 100)
      : 0;

    insights.push({
      icon: top.icon,
      color: top.color,
      title: 'Top Spending Category',
      value: top.name,
      sub: `${formatCurrency(top.value)} — ${pct}% of total expenses this month.`,
      badge: null,
      badgeType: null,
    });
  }

  // Category that increased the most vs last month
  if (lastMonthCategoryData.length > 0 && categoryData.length > 0) {
    let biggestJump = null;
    let biggestJumpPct = 0;

    categoryData.forEach(cat => {
      const last = lastMonthCategoryData.find(c => c.name === cat.name);
      if (last && last.value > 0) {
        const pct = ((cat.value - last.value) / last.value) * 100;
        if (pct > biggestJumpPct && cat.value > 0) {
          biggestJumpPct = pct;
          biggestJump = { ...cat, pct: Math.round(pct) };
        }
      }
    });

    if (biggestJump && biggestJump.pct >= 20) {
      insights.push({
        icon: 'bi-graph-up-arrow',
        color: '#F59E0B',
        title: 'Biggest Category Increase',
        value: biggestJump.name,
        sub: `Up ${biggestJump.pct}% vs last month (${formatCurrency(biggestJump.value)}).`,
        badge:`+${biggestJump.pct}%`,
        badgeType: 'warning',
      });
    }
  }

  // Days left in month + daily spend rate
  if (summary.expenses > 0) {
    const today = new Date();
    const isThisMonth  = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

    if (isThisMonth) {
      const dayOfMonth = today.getDate();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const daysLeft = daysInMonth - dayOfMonth;
      const dailyRate = summary.expenses / dayOfMonth;
      const projected = Math.round(dailyRate * daysInMonth);

      insights.push({
        icon: 'bi-calendar-check',
        color: '#2D7FF9',
        title: 'Projected Monthly Spend',
        value: formatCurrency(projected),
        sub: `${daysLeft} days left · spending ${formatCurrency(Math.round(dailyRate))}/day on average.`,
        badge: null,
        badgeType: null,
      });
    }
  }

  // Income-free month warning
  if (summary.expenses > 0 && summary.income === 0) {
    insights.push({
      icon: 'bi-exclamation-triangle',
      color: '#F59E0B',
      title: 'No Income Recorded',
      value: 'Heads up!',
      sub: `You have ${formatCurrency(summary.expenses)} in expenses but no income recorded this month.`,
      badge: 'Review',
      badgeType: 'warning',
    });
  }

  // On-track message when things look great
  if (
    insights.length === 0 ||
    (summary.income > 0 && summary.balance > 0 && insights.every(i => i.badgeType !== 'danger'))
  ) {
    const savingsRate = summary.income > 0
      ? Math.round(((summary.income - summary.expenses) / summary.income) * 100)
      : 0;

    if (savingsRate >= 20) {
      insights.push({
        icon: 'bi-stars',
        color: '#0DB57A',
        title: 'You\'re On Track!',
        value: `${savingsRate}% saved`,
        sub: `You've saved ${formatCurrency(summary.balance)} this month. Keep it up!`,
        badge: 'Great',
        badgeType: 'success',
      });
    }
  }

  return insights;
};

// Main Insights component
const Insights = ({
  summary,
  lastMonthSummary,
  categoryData,
  lastMonthCategoryData,
  transactions,
  currentDate,
}) => {
    
  const savingsRate = summary.income > 0
    ? ((summary.income - summary.expenses) / summary.income) * 100
    : 0;

  const insights = buildInsights({
    summary,
    lastMonthSummary,
    categoryData,
    lastMonthCategoryData,
    transactions,
    currentDate,
  });

  // Don't render if there's no data at all
  if (summary.income === 0 && summary.expenses === 0) return null;

  return (
    <div className="insights-section">

      {/* Header + Savings Rate */}
      <div className="insights-header">
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Monthly Insights</h2>
          <p className="insights-sub">
            {summary.income > 0
              ? `You've used ${Math.round((summary.expenses / summary.income) * 100)}% of your income this month.`
              : 'Add income transactions to see your savings rate.'}
          </p>
        </div>

        {/* Savings rate ring — only shown when there's income */}
        {summary.income > 0 && (
          <div className="savings-rate-block">
            <SavingsRing rate={savingsRate} />
            <div className="savings-rate-label">
              <span>Savings Rate</span>
              <strong style={{ color: savingsRate < 0 ? 'var(--expense)' : savingsRate >= 20 ? 'var(--income)' : 'var(--brand)' }}>
                {savingsRate < 0
                  ? 'Overspending'
                  : savingsRate >= 50
                  ? 'Excellent!'
                  : savingsRate >= 20
                  ? 'Good'
                  : 'Low'}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Savings summary strip */}
      {summary.income > 0 && (
        <div className="savings-strip">
          <div className="savings-strip__item">
            <span>Saved this month</span>
            <strong style={{ color: summary.balance >= 0 ? 'var(--income)' : 'var(--expense)' }}>
              {formatCurrency(summary.balance)}
            </strong>
          </div>

          <div className="savings-strip__divider" />
          <div className="savings-strip__item">
            <span>Income</span>
            <strong>{formatCurrency(summary.income)}</strong>
          </div>
          <div className="savings-strip__divider" />
          <div className="savings-strip__item">
            <span>Expenses</span>
            <strong>{formatCurrency(summary.expenses)}</strong>
          </div>
        </div>
      )}

      {/* Insight cards */}
      {insights.length > 0 && (
        <div className="insights-list">
          {insights.map((insight, i) => (
            <InsightCard key={i} {...insight} />
          ))}
        </div>
      )}

    </div>
  );
};

export default Insights;

