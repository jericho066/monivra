import { useState } from 'react';
import { formatCurrency } from '../utils/helpers';

// ── Icons available for custom wallets ───────────────────────
const WALLET_ICONS = [
  'bi-cash', 'bi-phone', 'bi-credit-card', 'bi-bank',
  'bi-building', 'bi-wallet2', 'bi-bag', 'bi-briefcase',
  'bi-piggy-bank', 'bi-currency-exchange',
];

const WALLET_COLORS = [
  '#10B981', '#2D7FF9', '#8B5CF6', '#F59E0B',
  '#EF4444', '#06B6D4', '#84CC16', '#F43F5E',
  '#0F172A', '#6B7C99',
];

// ── Add / Edit wallet form ────────────────────────────────────
const WalletForm = ({ editingWallet, onSave, onCancel }) => {
  const [name,  setName]  = useState(editingWallet?.name  || '');
  const [color, setColor] = useState(editingWallet?.color || WALLET_COLORS[0]);
  const [icon,  setIcon]  = useState(editingWallet?.icon  || WALLET_ICONS[0]);
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Wallet name is required.'); return; }
    if (trimmed.length > 20) { setError('Name must be 20 characters or less.'); return; }
    onSave({ name: trimmed, color, icon });
  };

  return (
    <div className="wallet-form">
      <div className="wallet-form__row">
        {/* Preview */}
        <div className="wallet-form__preview" style={{ backgroundColor: color }}>
          <i className={`bi ${icon}`}></i>
        </div>

        {/* Name */}
        <div style={{ flex: 1 }}>
          <label className="label">Wallet Name</label>
          <input
            className={`input ${error ? 'input-error' : ''}`}
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            placeholder="e.g. GCash, BDO Savings"
            maxLength={20}
            autoFocus
          />
          {error && (
            <span className="field-error">
              <i className="bi bi-exclamation-circle"></i> {error}
            </span>
          )}
        </div>
      </div>

      {/* Color picker */}
      <div className="wallet-form__section">
        <label className="label">Color</label>
        <div className="wallet-color-picker">
          {WALLET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`wallet-color-swatch ${color === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      {/* Icon picker */}
      <div className="wallet-form__section">
        <label className="label">Icon</label>
        <div className="wallet-icon-picker">
          {WALLET_ICONS.map(ic => (
            <button
              key={ic}
              type="button"
              className={`wallet-icon-btn ${icon === ic ? 'active' : ''}`}
              onClick={() => setIcon(ic)}
            >
              <i className={`bi ${ic}`}></i>
            </button>
          ))}
        </div>
      </div>

      <div className="budget-form__actions">
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="btn-submit" onClick={handleSave}>
          {editingWallet ? 'Update Wallet' : 'Add Wallet'}
        </button>
      </div>
    </div>
  );
};

// ── Main WalletBar ────────────────────────────────────────────
const WalletBar = ({
  wallets,
  selectedWallet,
  onSelectWallet,
  walletBalances,
  onAddWallet,
  onEditWallet,
  onDeleteWallet,
}) => {
  const [showManage, setShowManage]     = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);

  const handleSave = (data) => {
    if (editingWallet) {
      onEditWallet({ ...editingWallet, ...data });
    } else {
      onAddWallet(data);
    }
    setShowForm(false);
    setEditingWallet(null);
  };

  const handleEdit = (wallet) => {
    setEditingWallet(wallet);
    setShowForm(true);
  };

  const handleDelete = (wallet) => {
    const txCount = walletBalances[wallet.id]?.txCount || 0;
    const msg = txCount > 0
      ? `Delete "${wallet.name}"? This wallet has ${txCount} transaction(s). They will remain but will show as "Unknown Wallet".`
      : `Delete "${wallet.name}"?`;
    if (window.confirm(msg)) {
      onDeleteWallet(wallet.id);
      if (selectedWallet === wallet.id) onSelectWallet('all');
    }
  };

  return (
    <div className="wallet-bar">
      {/* Wallet pills row */}
      <div className="wallet-pills">

        {/* "All Wallets" pill */}
        <button
          className={`wallet-pill ${selectedWallet === 'all' ? 'active' : ''}`}
          onClick={() => onSelectWallet('all')}
        >
          <i className="bi bi-layers"></i>
          <span>All Wallets</span>
          {selectedWallet === 'all' && (
            <span className="wallet-pill__balance">
              {formatCurrency(
                Object.values(walletBalances).reduce((s, b) => s + b.balance, 0)
              )}
            </span>
          )}
        </button>

        {/* Individual wallet pills */}
        {wallets.map(wallet => (
          <button
            key={wallet.id}
            className={`wallet-pill ${selectedWallet === wallet.id ? 'active' : ''}`}
            onClick={() => onSelectWallet(wallet.id)}
            style={selectedWallet === wallet.id ? { borderColor: wallet.color } : {}}
          >
            <span className="wallet-pill__dot" style={{ backgroundColor: wallet.color }}></span>
            <span>{wallet.name}</span>
            {selectedWallet === wallet.id && (
              <span className="wallet-pill__balance">
                {formatCurrency(walletBalances[wallet.id]?.balance || 0)}
              </span>
            )}
          </button>
        ))}

        {/* Manage button */}
        <button
          className={`wallet-pill wallet-pill--manage ${showManage ? 'active' : ''}`}
          onClick={() => { setShowManage(!showManage); setShowForm(false); setEditingWallet(null); }}
        >
          <i className="bi bi-pencil-square"></i>
          <span>Manage</span>
        </button>
      </div>

      {/* Manage panel */}
      {showManage && (
        <div className="wallet-manage">

          {/* Wallet list */}
          {!showForm && (
            <>
              <div className="wallet-manage__list">
                {wallets.map(wallet => (
                  <div key={wallet.id} className="wallet-manage__item">
                    <div className="wallet-manage__icon" style={{ backgroundColor: wallet.color }}>
                      <i className={`bi ${wallet.icon}`}></i>
                    </div>
                    <div className="wallet-manage__info">
                      <span className="wallet-manage__name">{wallet.name}</span>
                      <span className="wallet-manage__stats">
                        {walletBalances[wallet.id]?.txCount || 0} transactions
                        · {formatCurrency(walletBalances[wallet.id]?.balance || 0)}
                      </span>
                    </div>
                    <div className="wallet-manage__actions">
                      <button className="btn-edit" onClick={() => handleEdit(wallet)} title="Edit">
                        <i className="bi bi-pen"></i>
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(wallet)}
                        title="Delete"
                        disabled={wallets.length <= 1}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-budget-add"
                style={{ marginTop: 12 }}
                onClick={() => { setEditingWallet(null); setShowForm(true); }}
              >
                <i className="bi bi-plus-lg"></i> Add Wallet
              </button>
            </>
          )}

          {/* Add / Edit form */}
          {showForm && (
            <WalletForm
              editingWallet={editingWallet}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingWallet(null); }}
            />
          )}
        </div>
      )}
    </div>
  );
};


export default WalletBar;

