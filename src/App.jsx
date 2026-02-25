import { useState, useEffect, useMemo } from 'react';
import './App.css';

import { DEFAULT_CATEGORIES } from './constants/categories';
import { getStoredData, saveData, getDefaultCategory, getMonthlyTrend, triggerDownload } from './utils/helpers';

import Header          from './components/Header';
import UndoToast       from './components/UndoToast';
import SummaryCards    from './components/SummaryCards';
import ChartSection    from './components/ChartSection';
import FilterSection   from './components/FilterSection';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';

const blankForm = (categories, type = 'expense') => ({
  amount: '',
  type,
  categoryId: getDefaultCategory(type, categories),
  date: new Date().toISOString().split('T')[0],
  note: '',
});

function App() {
  const [transactions, setTransactions]       = useState(() => getStoredData('transactions', []));
  const [categories]                          = useState(DEFAULT_CATEGORIES);
  const [currentDate, setCurrentDate]         = useState(new Date());
  const [showForm, setShowForm]               = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData]               = useState(() => blankForm(DEFAULT_CATEGORIES));
  const [undoTransaction, setUndoTransaction] = useState(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType]       = useState('all');

  useEffect(() => {
    saveData('transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    if (!undoTransaction) return;
    const timer = setTimeout(() => setUndoTransaction(null), 5000);
    return () => clearTimeout(timer);
  }, [undoTransaction]);

  const getCategoryInfo = (categoryId) =>
    categories.find(c => c.id === categoryId) ||
    { name: 'Unknown', color: '#999', icon: 'bi-question-circle' };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const matchesMonth =
        tDate.getMonth() === currentDate.getMonth() &&
        tDate.getFullYear() === currentDate.getFullYear();
      if (!matchesMonth) return false;

      const category = getCategoryInfo(t.categoryId);
      const matchesSearch =
        searchQuery === '' ||
        t.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || t.categoryId === selectedCategory;
      const matchesType     = selectedType === 'all' || t.type === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, currentDate, searchQuery, selectedCategory, selectedType]);

  const summary = useMemo(() => {
    const result = filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === 'expense') acc.expenses += t.amount;
        else acc.income += t.amount;
        return acc;
      },
      { income: 0, expenses: 0 }
    );
    result.balance = result.income - result.expenses;
    return result;
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    return categories
      .map(cat => ({
        name:  cat.name,
        value: filteredTransactions
          .filter(t => t.categoryId === cat.id && t.type === 'expense')
          .reduce((s, t) => s + t.amount, 0),
        color: cat.color,
        icon:  cat.icon,
      }))
      .filter(cat => cat.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  const monthlyTrendData = useMemo(() => getMonthlyTrend(transactions), [transactions]);

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedType !== 'all';

  const changeMonth = (direction) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + direction);
      return d;
    });
  };

  const openAddForm = () => {
    setEditingTransaction(null);
    setFormData(blankForm(categories, 'expense'));
    setShowForm(true);
  };

  const openEditForm = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount:     transaction.amount,
      type:       transaction.type,
      categoryId: transaction.categoryId,
      date:       transaction.date,
      note:       transaction.note,
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingTransaction) {
      setTransactions(prev =>
        prev.map(t =>
          t.id === editingTransaction.id
            ? { ...t, ...formData, amount: parseFloat(formData.amount) }
            : t
        )
      );
    } else {
      setTransactions(prev => [{
        id:         crypto.randomUUID(),
        amount:     parseFloat(formData.amount),
        type:       formData.type,
        categoryId: formData.categoryId,
        date:       formData.date,
        note:       formData.note,
        createdAt:  new Date().toISOString(),
      }, ...prev]);
    }
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleDelete = (transaction) => {
    setTransactions(prev => prev.filter(t => t.id !== transaction.id));
    setUndoTransaction(transaction);
  };

  const handleUndo = () => {
    if (undoTransaction) {
      setTransactions(prev => [undoTransaction, ...prev]);
      setUndoTransaction(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
  };

  const exportCSV = () => {
    const monthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
    if (monthTx.length === 0) { alert('No transactions to export for this month'); return; }

    const rows = monthTx.map(t => {
      const cat = getCategoryInfo(t.categoryId);
      return [t.date, t.type, cat.name, t.amount, t.note || ''];
    });
    const csv = [
      ['Date', 'Type', 'Category', 'Amount', 'Note'].join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(',')),
    ].join('\n');
    const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(' ', '-');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), `expenses-${monthLabel}.csv`);
  };

  const exportJSON = () => {
    const data = { transactions, categories, exportDate: new Date().toISOString() };
    triggerDownload(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
    );
  };

  const importJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.transactions && Array.isArray(data.transactions)) {
          const confirmed = window.confirm(
            `Import ${data.transactions.length} transactions? This will merge with your existing ${transactions.length} transactions.`
          );
          if (confirmed) {
            setTransactions(prev => [...data.transactions, ...prev]);
            alert('Data imported successfully!');
          }
        } else {
          alert('Invalid file format');
        }
      } catch { alert('Error reading file'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="app">
      <Header
        currentDate={currentDate}
        onChangeMonth={changeMonth}
        onAddTransaction={openAddForm}
        onExportCSV={exportCSV}
        onExportJSON={exportJSON}
        onImportJSON={importJSON}
      />

      {undoTransaction && <UndoToast onUndo={handleUndo} />}

      <SummaryCards summary={summary} />

      <ChartSection
        categoryData={categoryData}
        monthlyTrendData={monthlyTrendData}
        hasTransactions={transactions.length > 0}
      />

      <FilterSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        categories={categories}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      <TransactionList
        transactions={filteredTransactions}
        getCategoryInfo={getCategoryInfo}
        onEdit={openEditForm}
        onDelete={handleDelete}
        hasActiveFilters={hasActiveFilters}
      />

      {showForm && (
        <TransactionForm
          formData={formData}
          setFormData={setFormData}
          editingTransaction={editingTransaction}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          categories={categories}
        />
      )}
    </div>
  );
}

export default App;
