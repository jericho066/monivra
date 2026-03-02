import { useState } from 'react';
import { formatCurrency } from '../utils/helpers';

// ── How full is the progress bar ──────────────────────────────
const getProgressStatus = (spent, budget) => {
  const pct = (spent / budget) * 100;
  if (pct >= 100) return 'over';
  if (pct >= 80)  return 'warning';
  return 'good';
};

// ── Single budget row ─────────────────────────────────────────
const BudgetRow = ({ category, spent, budget, onEdit, onRemove }) => {
  const pct    = Math.min((spent / budget) * 100, 100);
  const status = getProgressStatus(spent, budget);
  const remaining = budget - spent;

  return (
    <div className={`budget-row budget-row--${status}`}>

      {/* Left: icon + name */}
      <div className="budget-row__left">
        <div className="budget-icon" style={{ backgroundColor: category.color }}>
          <i className={`bi ${category.icon}`}></i>
        </div>
        <div className="budget-info">
          <div className="budget-category-name">{category.name}</div>
          <div className="budget-meta">
            {formatCurrency(spent)} of {formatCurrency(budget)}
          </div>
        </div>
      </div>

      {/* Center: progress bar */}
      <div className="budget-bar-wrap">
        <div className="budget-bar">
          <div
            className={`budget-bar__fill budget-bar__fill--${status}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={`budget-remaining budget-remaining--${status}`}>
          {status === 'over'
            ? `${formatCurrency(Math.abs(remaining))} over budget`
            : status === 'warning'
            ? `${formatCurrency(remaining)} left — almost there!`
            : `${formatCurrency(remaining)} remaining`
          }
        </div>
      </div>

      {/* Right: percent + actions */}
      <div className="budget-row__right">
        <span className={`budget-pct budget-pct--${status}`}>
          {Math.round((spent / budget) * 100)}%
        </span>
        <div className="budget-actions">
          <button className="btn-edit" onClick={() => onEdit(category.id, budget)} title="Edit budget">
            <i className="bi bi-pen"></i>
          </button>
          <button className="btn-delete" onClick={() => onRemove(category.id)} title="Remove budget">
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </div>

    </div>
  );
};

// ── Inline edit/add form ──────────────────────────────────────
const BudgetForm = ({ categories, budgets, editingId, editingAmount, onSave, onCancel }) => {
  const [categoryId, setCategoryId] = useState(editingId || '');
  const [amount, setAmount]         = useState(editingAmount || '');
  const [error, setError]           = useState('');

  // Only show expense categories and only those without a budget yet (unless editing)
  const expenseCategories = categories.filter(c => !/salary|income/i.test(c.name));
  const available = expenseCategories.filter(
    c => !budgets[c.id] || c.id === editingId
  );

  const handleSave = () => {
    if (!categoryId) { setError('Please select a category.'); return; }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid budget amount greater than zero.');
      return;
    }
    if (parsed > 10000000) {
      setError('Budget amount seems too large. Please double-check.');
      return;
    }
    onSave(categoryId, parsed);
  };

  return (
    <div className="budget-form">
      <div className="budget-form__fields">

        {/* Category selector — locked when editing */}
        <div className="budget-form__group">
          <label className="label">Category</label>
          {editingId ? (
            <div className="budget-form__locked">
              {categories.find(c => c.id === editingId)?.name}
            </div>
          ) : (
            <select
              className="select"
              value={categoryId}
              onChange={e => { setCategoryId(e.target.value); setError(''); }}
            >
              <option value="">Select a category…</option>
              {available.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Monthly budget amount */}
        <div className="budget-form__group">
          <label className="label">Monthly Budget (₱)</label>
          <input
            type="number"
            className={`input ${error ? 'input-error' : ''}`}
            placeholder="e.g. 5000"
            value={amount}
            min="1"
            step="1"
            onChange={e => { setAmount(e.target.value); setError(''); }}
            autoFocus={!!editingId}
          />
        </div>

      </div>

      {error && (
        <span className="field-error">
          <i className="bi bi-exclamation-circle"></i> {error}
        </span>
      )}

      <div className="budget-form__actions">
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="btn-submit" onClick={handleSave}>
          {editingId ? 'Update Budget' : 'Add Budget'}
        </button>
      </div>
    </div>
  );
};

// ── Main BudgetGoals section ──────────────────────────────────
const BudgetGoals = ({ categories, budgets, spentByCategory, onSave, onRemove }) => {
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [editingAmount, setEditingAmount] = useState('');

  const expenseCategories = categories.filter(c => !/salary|income/i.test(c.name));
  const budgetedCategories = expenseCategories.filter(c => budgets[c.id]);
  const allBudgeted = expenseCategories.every(c => budgets[c.id]);

  const handleEdit = (categoryId, currentBudget) => {
    setEditingId(categoryId);
    setEditingAmount(String(currentBudget));
    setShowForm(true);
  };

  const handleSave = (categoryId, amount) => {
    onSave(categoryId, amount);
    setShowForm(false);
    setEditingId(null);
    setEditingAmount('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setEditingAmount('');
  };

  const handleRemove = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (window.confirm(`Remove budget for "${category?.name}"?`)) {
      onRemove(categoryId);
    }
  };

  // Summary numbers across all budgeted categories
  const totalBudget = budgetedCategories.reduce((s, c) => s + (budgets[c.id] || 0), 0);
  const totalSpent  = budgetedCategories.reduce((s, c) => s + (spentByCategory[c.id] || 0), 0);
  const overCount   = budgetedCategories.filter(
    c => (spentByCategory[c.id] || 0) >= budgets[c.id]
  ).length;

  return (
    <div className="budget-section">

      {/* Section header */}
      <div className="budget-section__header">
        <div>
          <h2 className="section-title" style={{ marginBottom: 2 }}>Budget Goals</h2>
          {budgetedCategories.length > 0 && (
            <p className="budget-section__sub">
              {formatCurrency(totalSpent)} spent of {formatCurrency(totalBudget)} total budget
              {overCount > 0 && (
                <span className="budget-over-badge">
                  {overCount} over limit
                </span>
              )}
            </p>
          )}
        </div>

        {/* Add budget button — hidden if form open or all categories budgeted */}
        {!showForm && !allBudgeted && (
          <button
            className="btn-budget-add"
            onClick={() => { setEditingId(null); setEditingAmount(''); setShowForm(true); }}
          >
            <i className="bi bi-plus-lg"></i> Set Budget
          </button>
        )}
      </div>

      {/* Empty state */}
      {budgetedCategories.length === 0 && !showForm && (
        <div className="budget-empty">
          <i className="bi bi-bullseye"></i>
          <p>No budget goals set yet.</p>
          <span>Set monthly limits to stay on track with your spending.</span>
        </div>
      )}

      {/* Budget rows */}
      {budgetedCategories.length > 0 && (
        <div className="budget-list">
          {budgetedCategories.map(cat => (
            <BudgetRow
              key={cat.id}
              category={cat}
              spent={spentByCategory[cat.id] || 0}
              budget={budgets[cat.id]}
              onEdit={handleEdit}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <BudgetForm
          categories={categories}
          budgets={budgets}
          editingId={editingId}
          editingAmount={editingAmount}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

    </div>
  );
};

export default BudgetGoals;

