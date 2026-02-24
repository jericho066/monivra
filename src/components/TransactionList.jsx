import TransactionItem from './TransactionItem';

const EmptyState = ({ hasActiveFilters }) => (
  <div className="empty-state">
    <div className="empty-icon">
      <i className={`bi ${hasActiveFilters ? 'bi-search' : 'bi-journal-text'}`} aria-hidden="true"></i>
    </div>
    <p className="empty-title">
      {hasActiveFilters ? 'No matching transactions' : 'No transactions this month'}
    </p>
    <p className="empty-text">
      {hasActiveFilters
        ? 'Try adjusting your filters or search query'
        : 'Click "Add Transaction" to record your first transaction'}
    </p>
  </div>
);

const TransactionList = ({ transactions, getCategoryInfo, onEdit, onDelete, hasActiveFilters }) => (
  <div className="transactions">
    <div className="transaction-header">
      <h2 className="section-title">Transactions ({transactions.length})</h2>
    </div>

    {transactions.length === 0 ? (
      <EmptyState hasActiveFilters={hasActiveFilters} />
    ) : (
      <div className="transaction-list">
        {transactions.map(transaction => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            category={getCategoryInfo(transaction.categoryId)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    )}
  </div>
);

export default TransactionList;

