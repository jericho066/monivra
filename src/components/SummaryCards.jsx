import { formatCurrency } from '../utils/helpers';

const SummaryCards = ({ summary }) => (
  <div className="summary">
    <div className="summary-card income">
      <div className="summary-label">Income</div>
      <div className="summary-amount">{formatCurrency(summary.income)}</div>
    </div>

    <div className="summary-card expense">
      <div className="summary-label">Expenses</div>
      <div className="summary-amount">{formatCurrency(summary.expenses)}</div>
    </div>

    <div className="summary-card balance">
      <div className="summary-label">Balance</div>
      <div
        className="summary-amount"
        style={{ color: summary.balance < 0 ? '#f43f5e' : undefined }}
      >
        {formatCurrency(summary.balance)}
      </div>
    </div>
  </div>
);

export default SummaryCards;

