import { formatCurrency } from '../utils/helpers';

const RecurringList = ({ templates, categories, onPause, onResume, onRemove }) => {
  if (templates.length === 0) return null;

  const getCategoryInfo = (categoryId) =>
    categories.find(c => c.id === categoryId) ||
    { name: 'Unknown', color: '#999', icon: 'bi-question-circle' };
    

  return (
    <div className="recurring-section">
      <div className="recurring-section__header">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          Recurring Transactions
        </h2>
        <span className="recurring-count">{templates.filter(t => t.active).length} active</span>
      </div>

      <div className="recurring-list">
        {templates.map(template => {
          const category = getCategoryInfo(template.categoryId);
          const day = new Date(template.startDate).getDate();

          return (
            <div key={template.id} className={`recurring-item ${!template.active ? 'recurring-item--paused' : ''}`}>

              {/* Icon */}
              <div className="transaction-icon" style={{ backgroundColor: category.color, opacity: template.active ? 1 : 0.45 }}>
                <i className={`bi ${category.icon}`}></i>
              </div>

              {/* Details */}
              <div className="transaction-details">
                <div className="transaction-category">
                  {category.name}
                  {!template.active && <span className="recurring-paused-badge">Paused</span>}
                </div>
                <div className="transaction-note">{template.note || 'No note'}</div>
                <div className="transaction-date">
                  <i className="bi bi-arrow-repeat" style={{ marginRight: 4 }}></i>
                  Every month on day {day}
                  {template.lastGeneratedDate && ` · Last: ${new Date(template.lastGeneratedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                </div>
              </div>

              {/* Amount + actions */}
              <div className="transaction-right">
                <div className={`transaction-amount ${template.type}`}>
                  {template.type === 'income' ? '+' : '-'}{formatCurrency(template.amount)}
                </div>
                <div className="transaction-actions" style={{ opacity: 1 }}>
                  {/* Pause / Resume */}
                  <button
                    className="btn-edit"
                    title={template.active ? 'Pause' : 'Resume'}
                    onClick={() => template.active ? onPause(template.id) : onResume(template.id)}
                  >
                    <i className={`bi ${template.active ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                  </button>
                  {/* Remove */}
                  <button
                    className="btn-delete"
                    title="Remove recurring"
                    onClick={() => onRemove(template.id)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecurringList;

