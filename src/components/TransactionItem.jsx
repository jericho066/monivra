import { formatCurrency, formatDate } from '../utils/helpers';

const TransactionItem = ({ transaction, category, onEdit, onDelete }) => (
  <div className="transaction-item">
    <div className="transaction-icon" style={{ backgroundColor: category.color }}>
      <i className={`bi ${category.icon}`} aria-hidden="true"></i>
    </div>

    <div className="transaction-details">
      <div className="transaction-category">{category.name}</div>
      <div className="transaction-note">{transaction.note || 'No note'}</div>
      <div className="transaction-date">{formatDate(transaction.date)}</div>
    </div>

    <div className="transaction-right">
      <div className={`transaction-amount ${transaction.type}`}>
        {transaction.type === 'income' ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </div>
      <div className="transaction-actions">
        <button className="btn-edit" onClick={() => onEdit(transaction)} title="Edit">
          <i className="bi bi-pen"></i>
        </button>
        <button className="btn-delete" onClick={() => onDelete(transaction)} title="Delete">
          <i className="bi bi-trash"></i>
        </button>
      </div>
    </div>
  </div>
);

export default TransactionItem;

