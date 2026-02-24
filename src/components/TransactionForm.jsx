import { getDefaultCategory } from '../utils/helpers';

const TransactionForm = ({ formData, setFormData, editingTransaction, onSubmit, onClose, categories }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      categoryId: getDefaultCategory(type, categories),
    }));
  };

  const filteredCategories = categories.filter(c =>
    formData.type === 'income'
      ? /salary|income/i.test(c.name)
      : !/salary|income/i.test(c.name)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="label">Type</label>
            <div className="type-toggle">
              <button type="button" className={`type-button ${formData.type === 'expense' ? 'active' : ''}`} onClick={() => handleTypeChange('expense')}>
                Expense
              </button>
              <button type="button" className={`type-button ${formData.type === 'income' ? 'active' : ''}`} onClick={() => handleTypeChange('income')}>
                Income
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Amount (₱)</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="0.00" step="0.01" className="input" autoFocus />
          </div>

          <div className="form-group">
            <label className="label">Category</label>
            <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="select">
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="input" />
          </div>

          <div className="form-group">
            <label className="label">Note (optional)</label>
            <input type="text" name="note" value={formData.note} onChange={handleChange} placeholder="e.g., Lunch at restaurant" className="input" />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-submit">{editingTransaction ? 'Update' : 'Add'} Transaction</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;

