import { useState } from 'react';
import { getDefaultCategory } from '../utils/helpers';

const TransactionForm = ({
  formData,
  setFormData,
  editingTransaction,
  onSubmit,
  onClose,
  categories,
  wallets,
}) => {
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      categoryId: getDefaultCategory(type, categories),
    }));
  };

  const handleRecurringToggle = () => {
    setFormData(prev => ({ ...prev, recurring: !prev.recurring }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.amount || formData.amount === '') {
      newErrors.amount = 'Amount is required.';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than zero.';
    } else if (parseFloat(formData.amount) > 10000000) {
      newErrors.amount = 'Amount seems too large. Please double-check.';
    }

    if (!formData.walletId) {
      newErrors.walletId = 'Please select a wallet.';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date.';
    } else {
      const selected = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selected > today) newErrors.date = 'Date cannot be in the future.';
    }

    if (formData.note && formData.note.length > 100) {
      newErrors.note = `Note is too long (${formData.note.length}/100 characters).`;
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      document.querySelector(`[name="${Object.keys(newErrors)[0]}"]`)?.focus();
      return;
    }
    onSubmit(e);
  };

  const filteredCategories = categories.filter(c =>
    formData.type === 'income'
      ? /salary|income/i.test(c.name)
      : !/salary|income/i.test(c.name)
  );

  const selectedDay = formData.date ? new Date(formData.date).getDate() : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>

        <form onSubmit={handleSubmit} noValidate>

          {/* Type */}
          <div className="form-group">
            <label className="label">Type</label>
            <div className="type-toggle">
              <button type="button" className={`type-button ${formData.type === 'expense' ? 'active' : ''}`} onClick={() => handleTypeChange('expense')}>Expense</button>
              <button type="button" className={`type-button ${formData.type === 'income' ? 'active' : ''}`} onClick={() => handleTypeChange('income')}>Income</button>
            </div>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="label">Amount (₱)</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="0.00" step="0.01" className={`input ${errors.amount ? 'input-error' : ''}`} autoFocus />
            {errors.amount && <span className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.amount}</span>}
          </div>

          {/* Wallet + Category side by side */}
          <div className="form-row">
            <div className="form-group">
              <label className="label">Wallet</label>
              <select name="walletId" value={formData.walletId} onChange={handleChange} className={`select ${errors.walletId ? 'input-error' : ''}`}>
                <option value="">Select wallet…</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              {errors.walletId && <span className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.walletId}</span>}
            </div>

            <div className="form-group">
              <label className="label">Category</label>
              <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="select">
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="label">Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className={`input ${errors.date ? 'input-error' : ''}`} />
            {errors.date && <span className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.date}</span>}
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="label">
              Note (optional)
              {formData.note?.length > 80 && (
                <span className={`char-count ${formData.note.length > 100 ? 'over' : ''}`}>{formData.note.length}/100</span>
              )}
            </label>
            <input type="text" name="note" value={formData.note} onChange={handleChange} placeholder="e.g., Lunch at restaurant" className={`input ${errors.note ? 'input-error' : ''}`} />
            {errors.note && <span className="field-error"><i className="bi bi-exclamation-circle"></i> {errors.note}</span>}
          </div>

          {/* Recurring toggle — hidden when editing */}
          {!editingTransaction && (
            <div className="form-group">
              <button type="button" className={`recurring-toggle ${formData.recurring ? 'active' : ''}`} onClick={handleRecurringToggle}>
                <span className="recurring-toggle__icon">
                  <i className={`bi ${formData.recurring ? 'bi-check-circle-fill' : 'bi-arrow-repeat'}`}></i>
                </span>
                <span className="recurring-toggle__text">
                  <strong>Repeat monthly</strong>
                  <span>
                    {formData.recurring && selectedDay
                      ? `Will auto-generate on day ${selectedDay} of every month`
                      : 'Automatically add this transaction every month'}
                  </span>
                </span>
                <span className={`recurring-toggle__badge ${formData.recurring ? 'on' : 'off'}`}>
                  {formData.recurring ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          )}

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