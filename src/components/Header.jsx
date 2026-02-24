import logoImage from '../assets/logo.png';
import { formatMonthYear } from '../utils/helpers';

const Header = ({ currentDate, onChangeMonth, onAddTransaction, onExportCSV, onExportJSON, onImportJSON }) => {
  const today = new Date();
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  return (
    <header className="header">
      <div className="header-left" style={{ marginRight: 8 }}>
        <h1>
          <img src={logoImage} alt="" />
          Monivra
        </h1>
        <div className="month-nav">
          <button onClick={() => onChangeMonth(-1)} className="month-btn">◀</button>
          <span className="month-label">{formatMonthYear(currentDate)}</span>
          <button onClick={() => onChangeMonth(1)} className="month-btn" disabled={isCurrentMonth}>▶</button>
        </div>
      </div>

      <div className="header-actions">
        <button className="btn-export" onClick={onExportCSV} title="Export CSV">
          <i className="bi bi-download"></i> CSV
        </button>
        <button className="btn-export" onClick={onExportJSON} title="Export JSON">
          <i className="bi bi-floppy"></i> Backup
        </button>
        <label className="btn-export" style={{ cursor: 'pointer' }} title="Import JSON">
          <i className="bi bi-folder"></i> Import
          <input type="file" accept=".json" onChange={onImportJSON} style={{ display: 'none' }} />
        </label>
        <button className="btn-add" onClick={onAddTransaction}>
          + Add Transaction
        </button>
      </div>
    </header>
  );
};

export default Header;

